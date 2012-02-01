(function($) {
    // MaxUI plugin definition
    $.fn.maxUI = function(options) {


        // define defaults
        var defaults = {'maxRequestsAPI' : 'jquery',
                        'newActivityText' : 'Write something ...',
                        'newActivitySendButton' : 'Post activity',
                        'maxServerURL' : 'http://max.beta.upcnet.es'
                        }
        // extend defaults with user-defined settings
        var settings = jQuery.extend(defaults,options)

        // Init MAX CLient

        var maxClient = new MaxClient(settings.maxServerURL)
        maxClient.setMode(settings.maxRequestsAPI)

        // render main interface using settings
        partials = { activities : MAXUI_ACTIVITIES}
        var mainui = MAXUI_MAIN_UI.render(settings,partials)
        this.html(mainui)

        // allow jQuery chaining
        return this;
    };

    // Returns the current settings of the plugin
    $.fn.Settings = function() {
        return settings
        }

})(jQuery);