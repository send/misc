#!/usr/bin/env ruby -Ku -rtime 

require 'rubygems'
require 'net/http'
require 'json'
require 'osx/cocoa'
include OSX
require 'growl'
require 'thread'
require 'cgi'
require 'RMagick'

OSX::NSApplication.sharedApplication

@@config = {
  :post_mode => true,
  :fav_mode => false,
  :screen_name => 'your screen name',
  :passwd => 'your passwd',
  :interval => 45,
  :error_interval => 180,
  :reply_assign_to => :mustdo,
  :noticed_users => {
    :assign_to => :notice,
    :users => []
  },
  :importance => {
    :notice => {
      :priority => 1,
      :sticky => false,
      :words => []
    },
    :todo => {
      :priority => 0,
      :sticky => true,
      :words => []
    },
    :mustdo => {
      :priority => 2,
      :sticky => true,
      :words => []
    }
  }
}

module TwitterGrowlReader
  class App
    
    def initialize
      @since_id = 0
      @last_notified = @last_fetch = Time.new
      @notifier = Notifier.new
      @agent = Agent.new
    end
  
    def run
      Thread.new { NSApplication.sharedApplication.run }
      while true do
        self.action
        timer = @@config[:interval] - (Time.now - @last_fetch)
        sleep timer if timer > 0
      end
    end
  
    def action
      @timeline = @agent.fetch_timeline @since_id
      @last_fetch = Time.now
      if @timeline.nil?
        sleep @@config[:error_interval]
        return nil
      end
      time = nil
      @timeline.reverse.each do |status|
        next unless status['user']
        @since_id = status['id'] if @since_id < status['id']
        @last_notified = time if  !time.nil? && time - @last_notified > 0
        time = Time.parse status['created_at']
        wait = (@last_notified == 0) ? 0 : time - @last_notified
        wait = 0.2 if wait < 0
        wait = 2 if @last_fetch - time > @@config[:interval] && wait > 2
        sleep wait
        @notifier.notify status
      end
  
    end
  end
    
  class Notifier
  
    DEFAULT_NOTIFICATIONS = [
      "normal", "todo", "reminder", "mustdo"
    ]

    URL_REGEX = /h?(ttps?):\/\/+([a-zA-Z0-9][-_.!~\*'\(\)a-zA-Z0-9;\/?:@&=+$,%#]+[-_~*\(a-zA-Z0-9;\/\?@&=\+$%#])/

    def initialize
      @agent = Agent.new
      @user = @agent.user
      @growl = Growl::Notifier.alloc.initWithDelegate self
      @growl.start :TwitterGrowlReader, DEFAULT_NOTIFICATIONS, DEFAULT_NOTIFICATIONS[0], nil
    end

    def growl_onClicked (sender, click_context)
      context = JSON.parse(click_context)
      if @@config[:fav_mode]
        @agent.favor context['id']
      else
        matches = URL_REGEX.match(context['desc'])
        if matches.nil?
          url = "http://twitter.com/#{context['screen_name']}/status/#{context['id']}"
          system "open '#{url}'"
        else
          matched_url = "h#{matches[1]}://#{matches[2]}"
          system "open '#{matched_url}'"
        end
      end
    end
  
    def notify (status)
      title = status['user']['screen_name'] + ' (' + CGI.unescapeHTML(status['user']['name']) + ')'
      type = DEFAULT_NOTIFICATIONS[0]
      desc = CGI.unescapeHTML status['text']
      context = { :id => status['id'], :screen_name => status['user']['screen_name'], :desc => desc }.to_json if
        !status['id'].nil? and !status['user'].nil? and !status['user']['screen_name'].nil?

      icon = @agent.request status['user']['profile_image_url']

      sticky = false
      priority = 0
      icon = nil if !icon.nil? && icon == ""
      
      # check importance
      catch (:exit) do |c|
        if status['in_reply_to_user_id'] == @user['id']
          assign_to = @@config[:reply_assign_to]
          sticky = @@config[:importance][assign_to][:sticky]
          priority = @@config[:importance][assign_to][:priority]
          type = DEFAULT_NOTIFICATIONS[priority]
          throw c
        end
        count = 0
        @@config[:importance].each_value do |importance|
          count += 1
          importance[:words].each do |word|
            unless desc.index(word).nil?
              sticky = importance[:sticky]
              priority = importance[:priority]
              type = DEFAULT_NOTIFICATIONS[count]
              throw c
            end
          end
        end
        @@config[:noticed_users][:users].each do |user|
          if status['user']['screen_name'] == user
            assign_to = @@config[:noticed_users][:assign_to]
            sticky = @@config[:importance][assign_to][:sticky]
            priority = @@config[:importance][assign_to][:priority]
            type = DEFAULT_NOTIFICATIONS[priority]
            throw c
          end
        end
      end
      @growl.notify type, title, desc, context, sticky, priority, icon
    end
  end

  class Agent
    
    MAX_REDIRECT = 5
    UA = "TwitterGrowlReader"
    TARGET_HOST = "http://twitter.com"
    NOCACHE_REGEX = /no-cache/i
    IMAGE_REGEX = /^image\//i

    def initialize
      @cache = {}
    end

    def user
      url = TARGET_HOST + "/users/show/#{@@config[:screen_name]}.json"
      JSON.parse self.request(url, {}, false, true)
    end

    def fetch_timeline (since_id = 0)
      url = TARGET_HOST + "/statuses/friends_timeline.json"
      url += "?since_id=#{since_id.to_s}" if (since_id > 0)
      timeline = self.request url, {}, @@config[:post_mode], true
      (timeline.nil?) ? nil : JSON.parse(timeline)
    end
  
    def favor id
      url = TARGET_HOST + "/favorites/create/#{id}.json"
      self.request url,{}, true, true
    end
  
    def request (url, headers = {}, post_mode = false ,use_auth = false, limit = MAX_REDIRECT)
      return nil if limit <= 0

      headers['User-Agent'] = UA
      unless @cache[url].nil?
        headers['If-Modified-Since'] = @cache[url][:last_modified] unless @cache[url][:last_modified].nil?
        headers['If-None-Match'] = @cache[url][:etag] unless @cache[url][:etag].nil?
      end

      uri = URI.parse(URI.encode(url))
      path = uri.request_uri
      host = (uri.host.nil?) ? TARGET_HOST : uri.host
      begin
        response =  Net::HTTP::start(host, 80) do |http|
          request = (post_mode) ? Net::HTTP::Post.new(path, headers): Net::HTTP::Get.new(path, headers)
          request.basic_auth @@config[:screen_name], @@config[:passwd] if use_auth
          http.request(request)
        end

        case response
        when Net::HTTPSuccess
          return response.body if
            NOCACHE_REGEX.match(response.header['Pragma']) or
            NOCACHE_REGEX.match(response.header['Cache-Control'])

          content = response.body
          if IMAGE_REGEX.match response['Content-Type']
            begin 
              data = Magick::Image.from_blob(content).first.crop_resized! 128, 128
              resized = data.to_blob
            rescue Exception
              p url
              $@.each {|bt| print "#{bt}\n" }
              resized = content
            end
            content = NSImage.alloc.initWithData NSData.dataWithRubyString(resized)
          end

          @cache[url] = {}
          @cache[url][:content] = content
          @cache[url][:last_modified] = (response['Last-Modified'].nil?) ? Time.new.to_s : response['Last-Modified']
          @cache[url][:etag] =  response['Etag'] unless response['Etag'].nil?

          @cache[url][:content]
        when Net::HTTPRedirection
          case response
          when Net::HTTPNotModified
            @cache[url][:content]
          else
            self.request response['location'], headers, post_mode, limit - 1
          end
        else
          print "#{url}\n"
          p response.code
          response.error!
        end
      rescue Exception
        p $@
        p headers
        return nil if @cache[url].nil?
        @cache[url][:content]
      end
    end
  end

end
if $0 == __FILE__
  TwitterGrowlReader::App.new.run
end
