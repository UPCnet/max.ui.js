/*
* Invokes maxui when page is ready
* This file is for testing auto loading of maxui, using the dist release

* It's possible to override certain settings from url in development mode
*   - username:   authorize as a different user, must hack oauth in max service to be usefull
*   - preset:     select a preset to configure the widget
*/

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

jQuery().ready(function() {

    var settings = {}

    // Get parameters from URL Configuration
    var username = getURLParameter('user')
    var preset = getURLParameter('preset')
    var transports = getURLParameter('transports')
    preset = preset=="null" ? 'timeline' : preset


    // Setup global var to store settings
    window._MAXUI = window._MAXUI || {}


    // Get Widget basic configuration parameters
    $.get('/maxui-dev/presets/base.json', 'json')
      .always( function(data)
      {
         $.extend(settings, data)

        // When done, extend settings with parameters from selected preset
        $.get('/maxui-dev/presets/' + preset + '.json', function(data)
          { $.extend(settings, data)

            // Overwrite username if supplied
            if (username!="null") settings['username'] = username

            // After all, setup callback to autoload the wudget ready with the calculated params
            window._MAXUI.onReady = function() {
                intervalID = setInterval(function(event) {
                    if ($().maxUI) {
                        clearInterval(intervalID)
                        $('#container').maxUI(settings)
                    }
                }, 30)
            }
          })

      });


      (function(d){
          var mui_location = '/maxui-dev/dist/built.js'
          var mui = d.createElement('script'); mui.type = 'text/javascript'; mui.async = true;
          mui.src = mui_location;
          var s = d.getElementsByTagName('script')[0]; s.parentNode.insertBefore(mui, s);
      }(document))


})
