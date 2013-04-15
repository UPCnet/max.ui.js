/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments

* It's possible to override certain settings from url in development mode
*   - username:   authorize as a different user, must hack oauth in max service to be usefull
*   - preset:     select a preset to configure the widget
*   - transports: limit the socket.io transports. must be one of
          0: "websocket"
          1: "flashsocket"
          2: "htmlfile"
          3: "xhr-polling"
          4: "jsonp-polling"
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

    // Get Widget basic configuration parameters
    $.get('presets/base.json', 'json')
      .always( function(data)
      {
         $.extend(settings, data)

        // When done, extend settings with parameters from selected preset
        $.get('presets/' + preset + '.json', function(data)
          { $.extend(settings, data)

            // Overwrite username if supplied
            if (username!="null") settings['username'] = username

            // Overwrite transports if supplied
            if (transports!="null") settings['transports'] = [transports]


            // After all, fire up the widget
            jQuery('#container').maxUI(settings)
          })

      })



})
