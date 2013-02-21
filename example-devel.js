/*
* Invokes maxui when page is ready
* calling trough jQuery ready is only for development purses
* use snippet in example.js for production environments
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

            // After all, fire up the widget
            jQuery('#container').maxUI(settings)
          })

      })



})
