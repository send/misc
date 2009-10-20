#!/opt/local/bin/ruby -Ku -rtime
#
require 'rubygems'
require 'yaml'
require 'net/http'
require 'cgi'
require 'pit'
require 'twitter'
require 'osx/cocoa'
include OSX
require 'growl'
require 'RMagick'
require 'thread'
require 'json'

@@config = Pit.get("twitter.com", :require => {
  "screen_name" => "your twitter screen name",
  "password" => "your password",
  "interval" => 45,
  "error_interval" => 180,
  "noticed_users" => "",
  "keywords" => "",
  'fav_mode' => false
})
module TwitterGrowler
  APP_NAME = "TwitterGrowler"

  class App < OSX::NSObject
    DEFAULT_NOTIFICATIONS = [
      "normal", "noticed_users", "keywords"
    ]
    URL_REGEX = /h?(ttps?):\/\/+([a-zA-Z0-9][-_.!~\*'\(\)a-zA-Z0-9;\/?:@&=+$,%#]+[-_~*\(a-zA-Z0-9;\/\?@&=\+$%#])/
    PRIORITIES = Growl::Notifier::PRIORITIES

    def initialize
      @noticed_users = @@config['noticed_users'].split(/\s*,\s*/)
      @keywords = @@config['keywords'].split(/\s*,\s*/)
      @since_id = 0
      @last_notified = @last_fetch = Time.new
      @container = ImageContainer.new
      @icon =@container.get 'http://twitter.com/favicon.ico'
      auth = Twitter::HTTPAuth.new @@config["screen_name"], @@config["password"]
      @client = Twitter::Base.new auth
      self
    end

    def init
      if super_init
        @growl = Growl::Notifier.sharedInstance
        @growl.delegate = self
        @growl.register APP_NAME, DEFAULT_NOTIFICATIONS, ["normal"], @icon
        @growl.notify "normal", APP_NAME, "start", :sticky => false, :priority => PRIORITIES[:normal]
        self
      end
    end

    def run
      Thread.new { NSApplication.sharedApplication.run }
      while true do
        begin
          if @since_id > 0
            @timeline = @client.friends_timeline :since_id => @since_id 
          else
            @timeline = @client.friends_timeline
          end
        rescue Exception
          $@.each {|bt| print "#{bt}\n" }
          sleep @@config["error_interval"] if @timeline.nil?
          next
        end
        @last_fetch = Time.now
        time = nil
        @timeline.reverse.each do |status|
          next unless status['user']
          @since_id = status['id'] if @since_id < status['id']
          @last_notified = time if  !time.nil? && time - @last_notified > 0
          time = Time.parse status['created_at']
          wait = (@last_notified == 0) ? 0 : time - @last_notified
          wait = 0.2 if wait < 0
          wait = 2 if @last_fetch - time > @@config["interval"] && wait > 2
          sleep wait
          self.notify status
        end

        timer = @@config["interval"] - (Time.now - @last_fetch)
        sleep timer if timer > 0
      end
    end

    def notify status
      title = status['user']['screen_name'] + ' (' + CGI.unescapeHTML(status['user']['name']) + ')'
      type = DEFAULT_NOTIFICATIONS[0]
      desc = CGI.unescapeHTML status['text']
      context = { :id => status['id'], :screen_name => status['user']['screen_name'], :desc => desc }.to_json if
        !status['id'].nil? and !status['user'].nil? and !status['user'].empty? and
        !status['user']['screen_name'].nil? and !status['user']['screen_name'].empty?

      icon = @container.get status['user']['profile_image_url']
      sticky = false
      priority = 0
      icon = @icon if !icon.nil? && icon == ""

      @noticed_users.each do |user|
        if status['user']['screen_name'] == user
          priority = 1
          break
        end
      end
      @keywords.each do |keyword|
        unless desc.index(keyword).nil?
          sticky= true
          priority = 2
          break
        end
      end
      if status['in_reply_to_user_id'] == @@config['screen_name']
        sticky = true
        priority = 2
      end
      @growl.notify type, title, desc, :click_context => context, :sticky => sticky, :priority => priority, :icon => icon
    end

    def growlNotifierClicked_context sender, clicked_context
      context = JSON.parse clicked_context
      if @@config["fav_mode"]
        @client.favorite_create context["id"]
      else
        matches = URL_REGEX.match(context["desc"])
        if matches.nil?
          system "open 'http://twitter.com/#{context['screen_name']}/status/#{context['id']}'"
        else
          system "open 'h#{matches[1]}://#{matches[2]}'"
        end
      end
    end
  end

  class ImageContainer
    MAX_REDIRECT = 5
    UA = APP_NAME
    NOCACHE_REGEX = /no-cache/i
    IMAGE_REGEX = /^image\//i

    def initialize
      @cache = {}
      self
    end

    def get url, headers = {}, limit = MAX_REDIRECT
      return nil if limit <= 0

      headers['User-Agent'] = UA
      unless @cache[url].nil?
        headers['If-Modified-Since'] = @cache[url][:last_modified] unless @cache[url][:last_modified].nil?
        headers['If-None-Match'] = @cache[url][:etag] unless @cache[url][:etag].nil?
      end
      uri = URI.parse(URI.encode(url))
      begin
        response = Net::HTTP::start(uri.host, uri.port) do |http|
          request = Net::HTTP::Get.new uri.request_uri, headers
          http.request request
        end
        
        case response
        when Net::HTTPSuccess
          return response.body if
            NOCACHE_REGEX.match(response.header['Pragma']) or
            NOCACHE_REGEX.match(response.header['Cache-Control'])

          content = response.body
          return nil unless IMAGE_REGEX.match response['Content-Type']

          begin 
            if /\.ico$/i.match(url)
              data = Magick::Image.from_blob(content) { |s| s.format = 'ico'}
            else
              data = Magick::Image.from_blob(content)
            end
            data = data.first.crop_resized! 128, 128

            resized = data.to_blob
          rescue Exception
            p url
            p content
            $@.each {|bt| print "#{bt}\n" }
            resized = content
          end
          content = NSImage.alloc.initWithData NSData.dataWithRubyString(resized)

          @cache[url] = {}
          @cache[url][:content] = content
          @cache[url][:last_modified] = (response['Last-Modified'].nil?) ? Time.new.to_s : response['Last-Modified']
          @cache[url][:etag] = response['Etag'] unless response['Etag'].nil?

          @cache[url][:content]
        when Net::HTTPRedirection
          case response
          when Net::HTTPNotModified
            @cache[url][:content]
          else
            self.get response['location'], headers, limit - 1
          end
        else
          print "#{url}\n"
          p response.code
          response.error!
        end
      rescue Exception
        $@.each {|bt| print "#{bt}\n" }
        p headers
        return nil if @cache[url].nil?
        @cache[url][:content]
      end
    end
  end
end

if $0 == __FILE__
  TwitterGrowler::App.new.run
end
