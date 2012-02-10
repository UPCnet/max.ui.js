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
        var mainui = MAXUI_MAIN_UI.render(settings)
        self.html(mainui)
        self.printTimeline()

        //Assign click to post action
        $('#maxui-newactivity .send').click(function () {
            self.sendActivity()
            })

        //Assign Commentbox toggling via delegating the click to the activities container
        $('#maxui-activities').on('click','.maxui-commentaction',function () {
            $(this).closest('.maxui-activity').find('.maxui-comments').toggle()
            })


        //Assign Commentbox send comment via delegating the click to the activities container
       $('#maxui-activities').on('click','.maxui-comments .send',function(){
           var text = $(this).closest('.maxui-comments').find('textarea').val()
           var activityid = $(this).closest('.maxui-activity').attr('activityid')

           self.maxClient.addComment(text, activityid, function() {
                        $('#activityContainer textarea').val('')
                         })

          });

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
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    */
    $.fn.sendActivity = function () {
        var text = $('#maxui-newactivity textarea').val()
        this.maxClient.addActivity(text, function() {
            $('#maxui-newactivity textarea').val('')
            })
    }

    /*
    *    Returns an human readable date from a timestamp
    *    @param {String} timestamp    A date represented as a string iun the form '2012-02-09T13:06:43Z'
    */
    $.fn.formatDate = function(timestamp) {
        var date = new Date()
        return $.easydate.format_date(date)
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
                // `formatedDate` contain a function that will be rendered inside the template
                //             to obtain the published date in a "human readable" way
                // `avatarURL` contain a function that will be rendered inside the template
                //             to obtain the avatar url for the activity's actor

                var params = {activities: this.items,
                              formattedDate: function() {
                                 return function(date) {
                                     // Here, `this` refers to the activity object
                                     // currently being processed by the hogan template
                                     var date = this.published
                                     return self.formatDate(date)
                                 }
                              },
                              avatarURL: function () {
                                 return function(text) {
                                     // Here, `this` refers to the activity object
                                     // currently being processed by the hogan template
                                     if (this.hasOwnProperty('actor')) { var username = this.actor.displayName }
                                     else { var username = this.author.displayName }
                                     return self.maxClient.getUserAvatarURL(username)
                                 }
                              }
                             }

                // Render the activities template and insert it into the timeline
                var activity_items = MAXUI_ACTIVITIES.render(params)
                $('#maxui-activities').html(activity_items)
            })




        }

})(jQuery);
