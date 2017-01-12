/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments

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

    var settings = {};

    // Get parameters from URL Configuration
    var username = getURLParameter('user');
    var preset = getURLParameter('preset');
    var transports = getURLParameter('transports');
    preset = preset=="null" ? 'timeline' : preset;

    // Get Widget basic configuration parameters
    $.get('/maxui-dev/presets/base.json', 'json')
      .always( function(data)
      {
         $.extend(settings, data);

        // When done, extend settings with parameters from selected preset
        $.get('/maxui-dev/presets/' + preset + '.json', function(data)
          { $.extend(settings, data);

            // Overwrite username if supplied
            if (username!="null") settings.username = username;
            // After all, fire up the widget
            jQuery('#container').maxUI(settings);
          });

      });

      setInterval(function(){$("#maxui-news-activities .maxui-button").trigger("click");}, 180000);
});
