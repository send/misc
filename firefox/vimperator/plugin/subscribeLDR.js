/**
 * Subscribe URL with livedoor Reader
 *
 * License : MIT License
 * @author SAKAI, Kazuaki
 * @version 0.1
 */
(function () {
  liberator.modules.commands.addUserCommand(['ldr'], 'Subscribe URL with livedoor Reader',
    function(arg, special) {
      var url = window._content.top.location;
      window.loadURI('http://reader.livedoor.com/subscribe/' + url);
    },
    {}
  );
})();
