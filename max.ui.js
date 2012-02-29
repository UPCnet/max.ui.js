(function($) {
    /*
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    */
    $.fn.maxUI = function(options) {

        // Keep a reference of the context object
        var maxui = this
        // define defaults


        // create namespace global variable if it doesn't exists

        if (!window._MAXUI)
            { window._MAXUI = {}}

        var defaults = {'maxRequestsAPI' : 'jquery',
                        'newActivityText' : 'Write something ...',
                        'newActivitySendButton' : 'Post activity',
                        'maxServerURL' : 'http://max.beta.upcnet.es',
                        'contextFilter': [],
                        'activitySource': 'timeline'
                        }
        // extend defaults with user-defined settings
        // and store in the global _MAXUI namespace
        _MAXUI.settings = jQuery.extend(defaults,options)

        // Configure maxui without CORS if CORS not available
        if (!this.isCORSCapable())
            {
                _MAXUI.settings.maxServerURL = _MAXUI.settings.maxServerURLAlias
            }

        // construct avatar pattern if user didn't define it
        if (!_MAXUI.settings.avatarURLpattern)
            {

               _MAXUI.settings['avatarURLpattern'] = _MAXUI.settings.maxServerURL+'/people/{0}/avatar'
            }

        // Init MAX CLient

        this.maxClient = new MaxClient(_MAXUI.settings.maxServerURL)
        this.maxClient.setMode(_MAXUI.settings.maxRequestsAPI)
        this.maxClient.setActor(_MAXUI.settings.username)

        // render main interface using partials
        var mainui = MAXUI_MAIN_UI.render(_MAXUI.settings)
        this.html(mainui)
        this.printActivities()

        //Assign click to post action
        $('#maxui-newactivity .send').click(function () {
            maxui.sendActivity()
            })

        //Assign Commentbox toggling via delegating the click to the activities container
        $('#maxui-activities').on('click','.maxui-commentaction',function () {
            $(this).closest('.maxui-activity').find('.maxui-comments').toggle()
            })


        //Assign Commentbox send comment via delegating the click to the activities container
       $('#maxui-activities').on('click','.maxui-comments .send',function(event){
           event.preventDefault()
           var text = $(this).closest('.maxui-comments').find('textarea').val()
           var activityid = $(this).closest('.maxui-activity').attr('activityid')

           maxui.maxClient.addComment(text, activityid, function() {
                        $('#activityContainer textarea').val('')
                         })

          });

        // allow jQuery chaining
        return maxui;
    };

    /*
    *    Identifies cors funcionalities
    */
    $.fn.isCORSCapable = function() {
        var xhrObject = new XMLHttpRequest();
            //check if the XHR tobject has CORS functionalities
            if (xhrObject.withCredentials!=undefined){
                return true;
              }
            else {
                return false;
              }
    }





    /*
    *    Returns the current settings of the plugin
    */
    $.fn.Settings = function() {
        return maxui.settings
        }

    /*
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    */
    $.fn.sendActivity = function () {
        maxui=this
        var text = $('#maxui-newactivity textarea').val()
        this.maxClient.addActivity(text, _MAXUI.settings.contextFilter, function() {
            $('#maxui-newactivity textarea').val('')
            maxui.printActivities()
            })
    }

    /*
    *    Returns an human readable date from a timestamp in rfc3339 format (cross-browser)
    *    @param {String} timestamp    A date represented as a string in rfc3339 format '2012-02-09T13:06:43Z'
    */
    $.fn.formatDate = function(timestamp) {
        var thisdate = new Date()
        var match = timestamp.match(
          "^([-+]?)(\\d{4,})(?:-?(\\d{2})(?:-?(\\d{2})" +
          "(?:[Tt ](\\d{2})(?::?(\\d{2})(?::?(\\d{2})(?:\\.(\\d{1,3})(?:\\d+)?)?)?)?" +
          "(?:[Zz]|(?:([-+])(\\d{2})(?::?(\\d{2}))?)?)?)?)?)?$");
         if (match) {
          for (var ints = [2, 3, 4, 5, 6, 7, 8, 10, 11], i = ints.length - 1; i >= 0; --i)
           match[ints[i]] = (typeof match[ints[i]] != "undefined"
            && match[ints[i]].length > 0) ? parseInt(match[ints[i]], 10) : 0;
          if (match[1] == '-') // BC/AD
           match[2] *= -1;
          var ms = Date.UTC(
           match[2], // Y
           match[3] - 1, // M
           match[4], // D
           match[5], // h
           match[6], // m
           match[7], // s
           match[8] // ms
          );
          if (typeof match[9] != "undefined" && match[9].length > 0) // offset
           ms += (match[9] == '+' ? -1 : 1) *
            (match[10]*3600*1000 + match[11]*60*1000); // oh om
          if (match[2] >= 0 && match[2] <= 99) // 1-99 AD
           ms -= 59958144000000;
          thisdate.setTime(ms);
          formatted = $.easydate.format_date(thisdate)
          return formatted
         }
         else
          return null;
    }


    $.fn.formatActivity = function(items) {
            // When receiving the list of activities from max
            // construct the object for Hogan
            // `activities `contain the list of activity objects
            // `formatedDate` contain a function maxui will be rendered inside the template
            //             to obtain the published date in a "human readable" way
            // `avatarURL` contain a function maxui will be rendered inside the template
            //             to obtain the avatar url for the activity's actor
            maxui = this;
            var params = {activities: items,
                          formattedDate: function() {
                             return function(date) {
                                 // Here, `this` refers to the activity object
                                 // currently being processed by the hogan template
                                 var date = this.published
                                 return maxui.formatDate(date)
                             }
                          },
                          formattedText: function () {
                             return function(text) {
                                // Look for links and linkify them
                                var text = this.object.content
                                return maxui.formatText(text)
                             }
                          },
                          avatarURL: function () {
                             return function(text) {
                                 // Here, `this` refers to the activity object
                                 // currently being processed by the hogan template
                                 if (this.hasOwnProperty('actor')) { var username = this.actor.username }
                                 else { var username = this.author.username }
                                 return _MAXUI.settings.avatarURLpattern.format(username)
                             }
                          }
                         }

            // Render the activities template and insert it into the timeline
            var activity_items = MAXUI_ACTIVITIES.render(params)
            $('#maxui-activities').prepend(activity_items)
        }

    $.fn.formatText = function (text){
        if (text) {
            text = text.replace(
                /((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi,
                function(url){
                    var full_url = url;
                    if (!full_url.match('^https?:\/\/')) {
                        full_url = 'http://' + full_url;
                    }
                    return '<a href="' + full_url + '">' + url + '</a>';
                }
            );
        }
        return text;
    }


    /*
    *    Renders the timeline of the current user, defined in settings.username
    */
    $.fn.printActivities = function() {
        // save a reference to the container object to be able to access it
        // from callbacks defined in inner levels
        var maxui = this
        var func_params = []
        if (_MAXUI.settings.activitySource=='timeline')
        {
            var activityRetriever = this.maxClient.getUserTimeline
            func_params.push(_MAXUI.settings.username)
            func_params.push( function() {maxui.formatActivity(this.items)})
        }
        else if (_MAXUI.settings.activitySource=='activities')
        {
            var activityRetriever = this.maxClient.getActivities
            func_params.push(_MAXUI.settings.username)
            func_params.push(_MAXUI.settings.contextFilter)
            func_params.push( function() {maxui.formatActivity(this.items)})
        }

        activityRetriever.apply(this.maxClient,func_params)
        }
})(jQuery);
