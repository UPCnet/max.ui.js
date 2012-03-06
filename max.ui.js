(function(jQuery) {
    /*
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    */
    jQuery.fn.maxUI = function(options) {

        // Keep a reference of the context object
        var maxui = this

        // create namespace global variable if it doesn't exists

        if (!window._MAXUI)
            { window._MAXUI = {}}

        // Define default english literals
        var literals_en = {'new_activity_text': 'Write something',
                           'new_activity_post': "Post activity",
                           'toggle_comments': "Comments",
                           'new_comment_post': "Post comment",
                           'load_more': "Load more"
            }

        // Update the default EN literals and delete from the options,
        // to allow partial extending of literals

        var literals = jQuery.extend(literals_en,options.literals)
        delete options.literals

        var defaults = {'maxRequestsAPI' : 'jquery',
                        'maxServerURL' : 'http://max.beta.upcnet.es',
                        'contextFilter': [],
                        'activitySource': 'timeline',
                        'literals': literals
                        }

        // extend defaults with user-defined settings
        // and store in the global _MAXUI namespace
        _MAXUI.settings = jQuery.extend(defaults,options)

        // Configure maxui without CORS if CORS not available
        if (!this.isCORSCapable())
            {
                // IF it has been defined an alias a fallback
                if (_MAXUI.settings.maxServerURLAlias)
                _MAXUI.settings.maxServerURL = _MAXUI.settings.maxServerURLAlias
            }

        // set default avatar url pattern if user didn't provide it
        if (!_MAXUI.settings.avatarURLpattern)
            {

               _MAXUI.settings['avatarURLpattern'] = _MAXUI.settings.maxServerURL+'/people/{0}/avatar'
            }

        // Init MAX CLient

        this.maxClient = new MaxClient(_MAXUI.settings.maxServerURL)
        this.maxClient.setMode(_MAXUI.settings.maxRequestsAPI)
        this.maxClient.setActor(_MAXUI.settings.username)

        // render main interface using partials
        var params = jQuery.extend(_MAXUI.settings,{'avatar':_MAXUI.settings.avatarURLpattern.format(_MAXUI.settings.username)})
        var mainui = MAXUI_MAIN_UI.render(params)
        this.html(mainui)
        this.printActivities()

        //Assign click to post action
        jQuery('#maxui-newactivity .send').click(function () {
            maxui.sendActivity()
            })

        //Assign click to loadmore
        jQuery('#maxui-more-activities .load').click(function () {
            maxui.loadMoreActivities()
            })

        //Assign Commentbox toggling via delegating the click to the activities container
        jQuery('#maxui-activities').on('click','.maxui-commentaction',function () {
            jQuery(this).closest('.maxui-activity').find('.maxui-comments').toggle()
            })


        //Assign Commentbox send comment via delegating the click to the activities container
       jQuery('#maxui-activities').on('click','.maxui-comments .send',function(event){
           event.preventDefault()
           var text = jQuery(this).closest('.maxui-comments').find('textarea').val()
           var activityid = jQuery(this).closest('.maxui-activity').attr('id')

           maxui.maxClient.addComment(text, activityid, function() {
                        jQuery('#activityContainer textarea').val('')
                        var activity_id = this.object.inReplyTo[0].id
                        maxui.printCommentsForActivity(activity_id)
                        })
          });

       jQuery('#maxui-newactivity textarea').focusin(function() {
                  if ( jQuery(this).val()==_MAXUI.settings.literals.new_activity_text )
                      {jQuery(this).val('')
                  jQuery(this).attr('class','')}
        });

       jQuery('#maxui-newactivity textarea').focusout(function() {
                  if ( jQuery(this).val()=='' )
                      {jQuery(this).val(_MAXUI.settings.literals.new_activity_text)
                       jQuery(this).attr('class','empty')}
                  else {
                       jQuery(this).attr('class','')
                  }
        });

        // allow jQuery chaining
        return maxui;
    };

    /*
    *    Identifies cors funcionalities
    */
    jQuery.fn.isCORSCapable = function() {
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
    jQuery.fn.Settings = function() {
        return maxui.settings
        }

    /*
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    */
    jQuery.fn.sendActivity = function () {
        maxui=this
        var text = jQuery('#maxui-newactivity textarea').val()
        this.maxClient.addActivity(text, _MAXUI.settings.contextFilter, function() {
            jQuery('#maxui-newactivity textarea').val('')
            var first = jQuery('.maxui-activity:first')
            if (first.length>0)
                { filter = {after:first.attr('id')}
                  maxui.printActivities(filter)
                }
            else {
                  maxui.printActivities()
                }
            })
    }

    /*
    *    Loads more activities from max
    */
    jQuery.fn.loadMoreActivities = function () {
        maxui=this
        filter = {before:jQuery('.maxui-activity:last').attr('id')}
        maxui.printActivities(filter)

    }

    /*
    *    Returns an human readable date from a timestamp in rfc3339 format (cross-browser)
    *    @param {String} timestamp    A date represented as a string in rfc3339 format '2012-02-09T13:06:43Z'
    */
    jQuery.fn.formatDate = function(timestamp) {
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
          formatted = jQuery.easydate.format_date(thisdate)
          return formatted
         }
         else
          return null;
    }


    jQuery.fn.formatActivity = function(items, insertAt) {
            // When receiving the list of activities from max
            // construct the object for Hogan
            // `activities `contain the list of activity objects
            // `formatedDate` contain a function maxui will be rendered inside the template
            //             to obtain the published date in a "human readable" way
            // `avatarURL` contain a function maxui will be rendered inside the template
            //             to obtain the avatar url for the activity's actor
            maxui = this;
            var params = {literals:_MAXUI.settings.literals,
                          activities: items,
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

            if (insertAt == 'beggining')
              {
                jQuery('#maxui-activities').prepend(activity_items)
              }
            else
              {
                jQuery('#maxui-activities').append(activity_items)
              }

        }


    jQuery.fn.formatComment = function(items,activity_id) {
            // When receiving the list of activities from max
            // construct the object for Hogan
            // `activities `contain the list of activity objects
            // `formatedDate` contain a function maxui will be rendered inside the template
            //             to obtain the published date in a "human readable" way
            // `avatarURL` contain a function maxui will be rendered inside the template
            //             to obtain the avatar url for the activity's actor
            maxui = this;
            var params = {literals:_MAXUI.settings.literals,
                          comments: items,
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
            var comment_items = MAXUI_COMMENTS.render(params)
            jQuery('.maxui-activity#'+activity_id+' .maxui-commentsbox').html(comment_items)

        }

    jQuery.fn.formatText = function (text){
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
    jQuery.fn.printActivities = function() {
        // save a reference to the container object to be able to access it
        // from callbacks defined in inner levels
        var maxui = this

        var func_params = []
        var insert_at = 'beggining'

        if (arguments.length>0)
           {
             if (arguments[0].before)
                 {insert_at = 'end'}
           }


        if (_MAXUI.settings.activitySource=='timeline')
        {
            var activityRetriever = this.maxClient.getUserTimeline
            func_params.push(_MAXUI.settings.username)
            func_params.push( function() {maxui.formatActivity(this.items, insert_at)})
        }
        else if (_MAXUI.settings.activitySource=='activities')
        {
            var activityRetriever = this.maxClient.getActivities
            func_params.push(_MAXUI.settings.username)
            func_params.push(_MAXUI.settings.contextFilter)
            func_params.push( function() {maxui.formatActivity(this.items, insert_at)})

        }

        // if passed as param, assume an object with search filtering params
        // one or all of [limit, since]
        if (arguments.length>0)
           {
             func_params.push(arguments[0])
           }


        activityRetriever.apply(this.maxClient,func_params)
        }

    /*
    *    Renders the timeline of the current user, defined in settings.username
    */
    jQuery.fn.printCommentsForActivity = function(activity_id) {


        var maxui = this
        var func_params = []

        func_params.push(activity_id)
        func_params.push(function() {maxui.formatComment(this.items, activity_id)})
        this.maxClient.getCommentsForActivity.apply(this.maxClient, func_params)

    }


})(jQuery);
