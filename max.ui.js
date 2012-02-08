(function($) {
    /*
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    */
    $.fn.maxUI = function(options) {

        // Keep a reference of the context object
        var self = this

        // define defaults
        var defaults = {'maxRequestsAPI' : 'jquery',
                        'newActivityText' : 'Write something ...',
                        'newActivitySendButton' : 'Post activity',
                        'maxServerURL' : 'http://max.beta.upcnet.es'
                        }
        // extend defaults with user-defined settings
        var settings = jQuery.extend(defaults,options)

        // Init MAX CLient

        self.maxClient = new MaxClient(settings.maxServerURL)
        self.maxClient.setMode(settings.maxRequestsAPI)
        self.maxClient.setActor(settings.username)

        // render main interface using partials
        var partials = { activities : MAXUI_ACTIVITIES}
        var mainui = MAXUI_MAIN_UI.render(settings,partials)
        self.html(mainui)
        self.printTimeline()

        // allow jQuery chaining
        return self;
    };

    /*
    *    Returns the current settings of the plugin
    */
    $.fn.Settings = function() {
        return settings
        }

    /*
    *    Renders the timeline of the current user, defined in settings.username
    */
    $.fn.printTimeline = function() {
        // save a reference to the container object to be able to access it
        // from callbacks defined in inner levels
        var self = this
        this.maxClient.getUserTimeline(settings.username, function() {

                // When receiving the list of activities from max
                // construct the object for Hogan
                // `activities `contain the list of activity objects
                // `avatarURL` contain a function that will be rendered inside the template
                //             to obtain the avatar url for the activity's actor
                var params = {activities: this.items,
                              avatarURL: function () {
                                 return function(text) {
                                     // Here, `this` refers to the activity object
                                     // currently being processed by the hogan template

                                     var username = this.actor.displayName
                                     return self.maxClient.getUserAvatarURL(username)
                                 }
                              }
                             }
                // Render the activities template and insert it into the timeline
                var activity_items = MAXUI_ACTIVITY.render(params)
                $('#maxui-activities').html(activity_items)
            }

                )

               //  $(".date").easydate(easydateOptions);
               //  $('.commentaction').click(function()
               //    {
               //        $(this).closest('.activity').find('.comments').toggle()
               //    }
               //  )

               // $('.sendcomment').click(function(){
               //     text = $(this).closest('.comments').find('textarea').val()
               //     activityid = $(this).closest('.activity').attr('activityid')
               //     console.log(text)
               //     sendComment(text,activityid,maxdn)
               //     //$('#timeline').html('')
               //     //printTimeline(maxdn)
               // });


        }

})(jQuery);
