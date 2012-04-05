(function(jq) {
    /*
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    */
    jq.fn.maxUI = function(options) {

        // Keep a reference of the context object
        var maxui = this

        // create namespace global variable if it doesn't exists
        if (!window._MAXUI)
            { window._MAXUI = {}}

        // Define default english literals
        var literals_en = {'new_activity_text': 'Write something...',
                           'new_activity_post': "Post activity",
                           'toggle_comments': "Comments",
                           'new_comment_text': "Comment something...",
                           'new_comment_post': "Post comment",
                           'load_more': "Load more",
                           'context_published_in': "Published in",
                           'generator_via': "via",
                           'search_text': "Search..."
            }

        // Update the default EN literals and delete from the options,
        // to allow partial extending of literals
        var literals = jq.extend(literals_en,options.literals)
        delete options.literals

        var defaults = {'maxRequestsAPI' : 'jquery',
                        'maxServerURL' : 'http://max.beta.upcnet.es',
                        'readContext': '',
                        'writeContexts' : [],
                        'activitySource': 'timeline',
                        'literals': literals,
                        'enableAlerts': false
                        }

        // extend defaults with user-defined settings
        // and store in the global _MAXUI namespace
        _MAXUI.settings = jq.extend(defaults,options)

        // Prepare utf strings to show correctly on browser
        // TODO Check if needed on all browsers, sometimes not working...
        //for (key in _MAXUI.settings.literals)
        //    {
        //      value = _MAXUI.settings.literals[key]
        //       _MAXUI.settings.literals[key] = maxui.utf8_decode(value)
        //    }

        // Configure maxui without CORS if CORS not available
        if (!this.isCORSCapable())
            {
                // IF it has been defined an alias, set as max server url
                if (_MAXUI.settings.maxServerURLAlias)
                _MAXUI.settings.maxServerURL = _MAXUI.settings.maxServerURLAlias
            }

        // Add read context to write contexts
        _MAXUI.settings.writeContexts.push(_MAXUI.settings.readContext)

        // Calculate readContextHash
        _MAXUI.settings.readContextHash = maxui.sha1(_MAXUI.settings.readContext)



        // set default avatar and profile url pattern if user didn't provide it
        if (!_MAXUI.settings.avatarURLpattern)
               _MAXUI.settings['avatarURLpattern'] = _MAXUI.settings.maxServerURL+'/people/{0}/avatar'

        if (!_MAXUI.settings.contextAvatarURLpattern)
               _MAXUI.settings['contextAvatarURLpattern'] = _MAXUI.settings.maxServerURL+'/contexts/{0}/avatar'

        if (!_MAXUI.settings.profileURLpattern)
               _MAXUI.settings['profileURLpattern'] = _MAXUI.settings.maxServerURL+'/profiles/{0}'

        // Catch errors triggered by failed max api calls
        if (_MAXUI.settings.enableAlerts)
        jq(window).bind('maxclienterror', function(event,xhr) {
            var error = JSON.parse(xhr.responseText)
            alert('The server responded with a "{0}" error, with the following message: "{1}". \n\nPlease try again later or contact administrator at admin@max.upc.edu.'.format(error.error,error.error_description))
        })

        // Init MAX Client
        this.maxClient = new MaxClient(_MAXUI.settings.maxServerURL)
        this.maxClient.setMode(_MAXUI.settings.maxRequestsAPI)
        this.maxClient.setActor(_MAXUI.settings.username)

        this.maxClient.getUserData(_MAXUI.settings.username, function() {

            //Determine if user can write in writeContexts
            var userSubscriptions = {}
            if (this.subscribedTo)
            {
                if (this.subscribedTo.items)
                {
                    if (this.subscribedTo.items.length>0)
                    {
                        for (sc=0;sc<this.subscribedTo.items.length;sc++)
                        {
                            var subscription = this.subscribedTo.items[sc]
                            userSubscriptions[subscription.url]={}
                            userSubscriptions[subscription.url]['permissions']={}
                            for (pm=0;pm<subscription.permissions.length;pm++)
                            {
                                var permission=subscription.permissions[pm]
                                userSubscriptions[subscription.url]['permissions'][permission]=true
                            }
                        }
                    }
                }
            }

            window._MAXUI.settings.subscriptions = userSubscriptions
            // render main interface
            var params = {
                         username: _MAXUI.settings.username,
                         literals: _MAXUI.settings.literals
                     }
            var mainui = MAXUI_MAIN_UI.render(params)
            maxui.html(mainui)
            maxui.printActivities({},function() {

                  //Assign click to loadmore
                  jq('#maxui-more-activities .maxui-button').click(function (event) {
                      event.preventDefault()
                      if (jq('#maxui-search').hasClass('folded'))
                      {
                          maxui.loadMoreActivities()
                      }
                      else
                      {
                          last_result_id = jq('.maxui-activity:last').attr('id')
                          maxui.reloadFilters(last_result_id)
                      }
                      })

                  //Assign click to toggle search filters if any search filter defined
                  jq('#maxui-search-toggle').click(function (event) {
                      event.preventDefault()
                      if (!jq(this).hasClass('maxui-disabled'))
                      {
                          jq('#maxui-search').toggleClass('folded')
                          if (jq('#maxui-search').hasClass('folded'))
                              maxui.printActivities({})
                          else
                              maxui.reloadFilters()
                      }
                      })

                  //Assign Commentbox toggling via delegating the click to the activities container
                  jq('#maxui-activities').on('click','.maxui-commentaction',function (event) {
                      event.preventDefault()
                      window.status=''
                      jq(this).closest('.maxui-activity').find('.maxui-comments').toggle(200)
                      })

                  //Assign hashtag filtering via delegating the click to the activities container
                  jq('#maxui-activities').on('click','.maxui-hashtag',function (event) {
                      event.preventDefault()
                      maxui.addFilter({type:'hashtag', value:jq(this).attr('value')})
                      jq('#maxui-search').toggleClass('folded',false)
                      })

                  //Assign filter closing via delegating the click to the filters container
                  jq('#maxui-search-filters').on('click','.close',function (event) {
                      event.preventDefault()
                      var filter = jq(this.parentNode.parentNode)
                      maxui.delFilter({type:filter.attr('type'), value:filter.attr('value')})
                      })

                  //Assign Activity post action And textarea behaviour
                  maxui.bindActionBehaviour('#maxui-newactivity','#maxui-newactivity-box', _MAXUI.settings.literals.new_activity_text, function(text)
                          {
                          maxui.sendActivity(text)
                          jq('#maxui-search').toggleClass('folded',true)
                          })

                  //Assign Commentbox send comment action And textarea behaviour
                  maxui.bindActionBehaviour('#maxui-activities', '.maxui-newcommentbox', _MAXUI.settings.literals.new_comment_text, function(text)
                         {
                         var activityid = jq(this).closest('.maxui-activity').attr('id')
                         maxui.maxClient.addComment(text, activityid, function() {
                                      jq('#activityContainer textarea').val('')
                                      var activity_id = this.object.inReplyTo[0].id
                                      maxui.printCommentsForActivity(activity_id)
                                      jq('#'+activity_id+' .maxui-newcommentbox textarea').val('')
                                      jq('#'+activity_id+' .maxui-newcommentbox .maxui-button').attr('disabled','disabled')
                                      })
                        })

                  //Assign Search box search action And input behaviour
                  maxui.bindActionBehaviour('#maxui-search','#maxui-search-box', _MAXUI.settings.literals.search_text, function(text)
                         {
                         maxui.textSearch(text)
                         jq('#maxui-search').toggleClass('folded',false)
                         })
                  // Execute search if <enter> pressed
                  jq('#maxui-search .maxui-text-input').keyup(function(e) {
                            if (e.keyCode == 13) {
                               maxui.textSearch(jq(this).attr('value'))
                               jq('#maxui-search').toggleClass('folded',false)
                            }
                  });
              })
        })

        // allow jq chaining
        return maxui;
    };

    /*
    *    Takes a  button-input pair identified by 'maxui-button' and 'maxui-text-input'
    *    classes respectively, contained in a container and applies focusin/out
    *    and clicking behaviour
    *
    *    @param {String} delegate         CSS selector identifying the parent container on which to delegate events
    *    @param {String} target           CSS selector identifying the direct container on which execute events
    *    @param {String} literal          Text to display when focus is out of input and no text entered
    *    @param {Function} clickFunction  Function to execute when click on the button
    */
    jq.fn.bindActionBehaviour = function(delegate, target, literal, clickFunction) {

        // Clear input when focusing in only if user hasn't typed anything yet
        var maxui = this
        var selector = target+' .maxui-text-input'
        jq(delegate)

        .on('focusin',selector, function(event) {
                  event.preventDefault()
                  text = jq(this).val()
                  normalized = maxui.normalizeWhiteSpace(text,false)
                  if ( normalized==literal )
                      jq(this).val('')
        })

        .on('keyup',selector, function(event) {
                  event.preventDefault()
                  text = jq(this).val()
                  button = jq(this).parent().find('.maxui-button')
                  normalized = maxui.normalizeWhiteSpace(text,false)
                  if (normalized=='')
                  {   jq(button).attr('disabled', 'disabled')
                      jq(button).attr('class','maxui-button maxui-disabled')
                      jq(this).attr('class','maxui-empty maxui-text-input')
                  }
                  else
                  {   jq(button).removeAttr('disabled')
                      jq(button).attr('class','maxui-button')
                      jq(this).attr('class','maxui-text-input')
                  }

        })

        .on('focusout',selector, function(event) {
                  event.preventDefault()
                  text = jq(this).val()
                  normalized = maxui.normalizeWhiteSpace(text,false)
                  if ( normalized=='' )
                      jq(this).val(literal)
        })

        .on('click',target+' .maxui-button',function (event) {
            event.preventDefault()
            var text = jq(this).parent().find('.maxui-text-input').val()
            var normalized = maxui.normalizeWhiteSpace(text,false)
            if (normalized!=literal & normalized!='')
                clickFunction.apply(this,[text])
            })

    }

    /*
    *    Strips whitespace at the beggining and end of a string and optionaly between
    *
    *    @param {String} s       A text that may contain whitespaces
    *    @param {Boolean} multi  If true, reduces multiple consecutive whitespaces to one
    */
    jq.fn.normalizeWhiteSpace = function (s, multi) {

        s = s.replace(/(^\s*)|(\s*jq)/gi,"");
        s = s.replace(/\n /,"\n");

        var trimMulti=true
        if (arguments.length>1)
            trimMulti=multi
        if (trimMulti==true)
            s = s.replace(/[ ]{2,}/gi," ");
        return s;
    }

    /*
    *    Updates the search filters with a new collection of keywords/hashtags extracted of
    *    a user-entered text, and reloads the search query. Identifies special characters
    *    at the first position of each keyword to identify keyword type
    *
    *    @param {String} text    A string containing whitespace-separated keywords/#hashtags
    */
    jq.fn.textSearch = function (text) {
                //Normalize spaces
                normalized = this.normalizeWhiteSpace(text)
                var keywords = normalized.split(' ')
                for (kw=0;kw<keywords.length;kw++)
                {
                    var kwtype = 'keyword'
                    var keyword = keywords[kw]
                    if (keyword[0]=='#')
                    {
                        kwtype='hashtag'
                        keyword = keyword.substr(1)
                    }
                    if (keyword.length>=3)
                        this.addFilter({type:kwtype, value:keyword}, false)
                }
                this.reloadFilters()
    }


    /*
    *    Reloads the current filters UI and executes the search, optionally starting
    *    at a given point of the timeline
    *
    *    @param {String} (optional)    A string containing the id of the last activity loaded
    */
    jq.fn.reloadFilters = function() {

        var maxui=this
        var params = {filters:window._MAXUI.filters}
        var activity_items = MAXUI_FILTERS.render(params)
        jq('#maxui-search-filters').html(activity_items)
        var filters = {}
        // group filters
        for (f=0;f<params.filters.length;f++)
            { var filter = params.filters[f]

              if (!filters[filter.type])
                  filters[filter.type]=[]
              filters[filter.type].push(filter.value)
            }

        // Accept a optional parameter indicating search start point
        if (arguments.length>0)
            filters['before'] = arguments[0]

        maxui.printActivities(filters)

        //Enable or disable filter toogle if there are filters defined (or not)
        jq('#maxui-search-toggle').toggleClass('maxui-disabled',window._MAXUI.filters.length==0)
        jq('#maxui-search').toggleClass('folded',window._MAXUI.filters.length==0)
   }


    /*
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    */
    jq.fn.delFilter = function(filter) {
        var deleted = false
        var index = -1
        for (i=0;i<window._MAXUI.filters.length;i++)
             if (window._MAXUI.filters[i].value==filter.value & window._MAXUI.filters[i].type==filter.type)
              {
                 deleted = true
                 window._MAXUI.filters.splice(i,1)
              }
        if (deleted)
            this.reloadFilters()
    }

    /*
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    */
    jq.fn.addFilter = function(filter) {

        var reload=true
        //Reload or not by func argument
        if (arguments.length>1)
            reload=arguments[1]

        if (!window._MAXUI.filters)
            { window._MAXUI.filters = []}

        switch (filter.type)
        {
        case "hashtag":
        filter['prepend']='#';break;
        default: filter['prepend']='';break;
        }


        var already_filtered = false
        for (i=0;i<window._MAXUI.filters.length;i++)
             if (window._MAXUI.filters[i].value==filter.value & window._MAXUI.filters[i].type==filter.type)
                 already_filtered = true

         if (!already_filtered)
         {
            window._MAXUI.filters.push(filter)
            if(reload==true)
                this.reloadFilters()
         }
    }


    /*
    *    Identifies cors funcionalities and returns a boolean
         indicating wheter the browser is or isn't CORS capable
    */
    jq.fn.isCORSCapable = function() {
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
    jq.fn.Settings = function() {
        return maxui.settings
        }

    /*
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    */
    jq.fn.sendActivity = function () {
        maxui=this
        var text = jq('#maxui-newactivity textarea').val()
        var func_params = []
        func_params.push(text)
        func_params.push(_MAXUI.settings.writeContexts)
        func_params.push( function() {
                              jq('#maxui-newactivity textarea').val('')
                              jq('#maxui-newactivity .maxui-button').attr('disabled','disabled')
                              var first = jq('.maxui-activity:first')
                              if (first.length>0)
                                  { filter = {after:first.attr('id')}
                                    maxui.printActivities(filter)
                                  }
                              else {
                                    maxui.printActivities({})
                                  }
                              })

        //Pass generator to activity post if defined
        if (_MAXUI.settings.generatorName) { func_params.push(_MAXUI.settings.generatorName) }

        var activityAdder = maxui.maxClient.addActivity
        activityAdder.apply(maxui.maxClient, func_params)

    }

    /*
    *    Loads more activities from max posted earlier than
    *    the oldest loaded activity
    */
    jq.fn.loadMoreActivities = function () {
        maxui=this
        filter = {before:jq('.maxui-activity:last').attr('id')}
        maxui.printActivities(filter)

    }

    /*
    *    Returns an human readable date from a timestamp in rfc3339 format (cross-browser)
    *    @param {String} timestamp    A date represented as a string in rfc3339 format '2012-02-09T13:06:43Z'
    */
    jq.fn.formatDate = function(timestamp) {
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
          formatted = jq.easydate.format_date(thisdate)
          return formatted
         }
         else
          return null;
    }

    /*
    *    Returns an utf8 decoded string
    *    @param {String} str_data    an utf-8 String
    */
    jq.fn.utf8_decode = function(str_data) {
        // Converts a UTF-8 encoded string to ISO-8859-1
        //
        // version: 1109.2015
        // discuss at: http://phpjs.org/functions/utf8_decode
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // +      input by: Aman Gupta
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Norman "zEh" Fuchs
        // +   bugfixed by: hitwork
        // +   bugfixed by: Onno Marsman
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: utf8_decode('Kevin van Zonneveld');
        // *     returns 1: 'Kevin van Zonneveld'
        var tmp_arr = [],
            i = 0,
            ac = 0,
            c1 = 0,
            c2 = 0,
            c3 = 0;

        str_data += '';

        while (i < str_data.length) {
            c1 = str_data.charCodeAt(i);
            if (c1 < 128) {
                tmp_arr[ac++] = String.fromCharCode(c1);
                i++;
            } else if (c1 > 191 && c1 < 224) {
                c2 = str_data.charCodeAt(i + 1);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = str_data.charCodeAt(i + 1);
                c3 = str_data.charCodeAt(i + 2);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }

        return tmp_arr.join('');
    }

    /*
    *    Renders the N activities passed in items on the timeline slot. This function is
    *    meant to be called as a callback of a call to a max webservice returning a list
    *    of activity objects
    *
    *    @param {String} items     a list of objects representing activities, returned by max
    *    @param {String} insertAt  were to prepend or append activities, 'beginning' or 'end
    *    @param {Function} (optional)  A function to call when all formatting is finished
    */
    jq.fn.formatActivities = function(items, insertAt) {
            var maxui = this;
            var activities = ''

            // Iterate throug all the activities
            for (i=0;i<items.length;i++)
                {
                    var activity = items[i]

                    // Take first context (if exists) to display in the 'published on' field
                    // XXX TODO Build a coma-separated list of contexts ??
                    var contexts = undefined
                    if (activity.hasOwnProperty('contexts'))
                         {
                             if (activity.contexts.length>0)
                                 contexts = activity.contexts[0]
                         }

                    // Take generator property (if exists) and set it only if it's different
                    // from the application name defined in settings
                    var generator = undefined
                    if (activity.hasOwnProperty('generator'))
                         {
                            if (activity.generator!=_MAXUI.settings.generatorName)
                                generator = activity.generator
                         }

                    // Prepare avatar image url depending on actor type
                    var avatar_url = ''
                    var profile_url = ''
                    if (activity.actor.objectType=='person') {
                        avatar_url = _MAXUI.settings.avatarURLpattern.format(activity.actor.username)
                        profile_url = _MAXUI.settings.profileURLpattern.format(activity.actor.username)
                      }
                    else if (activity.actor.objectType=='context') {
                        avatar_url = _MAXUI.settings.contextAvatarURLpattern.format(activity.actor.urlHash)
                        profile_url = activity.actor.url
                      }
                    // Take replies (if exists) and format to be included as a formatted
                    // subobject ready for hogan
                    var replies = undefined
                    if (activity.replies)
                        {
                            replies = { totalItems: activity.replies.totalItems,
                                             items: []
                                      }
                            if (activity.replies.items.length>0)
                                {
                                    for (r=0;r<activity.replies.items.length;r++)
                                        {
                                        var comment = activity.replies.items[r]
                                        reply = {
                                                           id: comment.id,
                                                       author: comment.author,
                                                         date: maxui.formatDate(comment.published),
                                                         text: maxui.formatText(comment.content),
                                                    avatarURL: _MAXUI.settings.avatarURLpattern.format(comment.author.username),
                                                   profileURL: _MAXUI.settings.profileURLpattern.format(comment.author.username)

                                                }
                                        replies.items.push(reply)
                                        }
                                }
                        }

                    // Take all the latter properties and join them into an object
                    // containing all the needed params to render the template
                    var params = {
                                           id: activity.id,
                                        actor: activity.actor,
                                     literals:_MAXUI.settings.literals,
                                         date: maxui.formatDate(activity.published),
                                         text: maxui.formatText(activity.object.content),
                                      replies: replies,
                                    avatarURL: avatar_url,
                                   profileURL: profile_url,
                                  publishedIn: contexts,
                                          via: generator

                                 }
                    // Render the activities template and append it at the end of the rendered activities
                    // partials is used to render each comment found in the activities
                    var partials = {comment: MAXUI_COMMENT}
                    var activities = activities + MAXUI_ACTIVITY.render(params, partials)
                }


            // Prepare animation and insert activities at the top of activity stream
            if (insertAt == 'beggining')
            {
                // Load all the activities in a overflow-hidden div to calculate the height
                jq('#maxui-preload .wrapper').prepend(activities)
                var ritems = jq('#maxui-preload .wrapper .maxui-activity')
                var heightsum = 0
                for (i=0;i<ritems.length;i++)
                      heightsum += jq(ritems[i]).height()+18

                // Move the hidden div to be hidden on top of the last activity and behind the main UI
                var currentPreloadHeight = jq('#maxui-preload').height()
                jq('#maxui-preload').height(heightsum-currentPreloadHeight)
                jq('#maxui-preload').css( {"margin-top":(heightsum-currentPreloadHeight)*-1})

                // Animate it to appear sliding on the bottom of the main UI
                jq('#maxui-preload').animate({"margin-top":0}, 200, function()
                   {
                        // When the animation ends, move the new activites to its native container
                        jq('#maxui-preload .wrapper').html("")
                        jq('#maxui-activities').prepend(activities)
                        jq('#maxui-preload').height(0)

                   })

            }
            // Insert at the end
            else if (insertAt == 'end')
                jq('#maxui-activities').append(activities)
            // Otherwise, replace everything
            else
                jq('#maxui-activities').html(activities)

          // if Has a callback, execute it
          if (arguments.length>2)
              {
                arguments[2].call()
              }

        }

    /*
    *    Renders the N comments passed in items on the timeline slot. This function is
    *    meant to be called as a callback of a call to a max webservice returning comments
    *    @param {String} items         a list of objects representing comments, returned by max
    *    @param {String} activity_id   id of the activity where comments belong to
    */
    jq.fn.formatComment = function(items, activity_id) {
            // When receiving the list of activities from max
            // construct the object for Hogan
            // `activities `contain the list of activity objects
            // `formatedDate` contain a function maxui will be rendered inside the template
            //             to obtain the published date in a "human readable" way
            // `avatarURL` contain a function maxui will be rendered inside the template
            //             to obtain the avatar url for the activity's actor

            // Save reference to the maxui class, as inside below defined functions
            // the this variable will contain the activity item being processed
            maxui = this;
            var comments = ''

            for (i=0;i<items.length;i++)
                {
                    var comment = items[i]

                    var params = {   literals:_MAXUI.settings.literals,
                                           id: comment.id,
                                       author: comment.author,
                                         date: maxui.formatDate(comment.published),
                                         text: maxui.formatText(comment.content),
                                    avatarURL: _MAXUI.settings.avatarURLpattern.format(comment.author.username),
                                   profileURL: _MAXUI.settings.profileURLpattern.format(comment.author.username)
                                 }
                    // Render the comment template and append it at the end of the rendered comments
                    var comments = comments + MAXUI_COMMENT.render(params)
                }
            // Insert new comments by replacing previous comments with all comments
            jq('.maxui-activity#'+activity_id+' .maxui-commentsbox').html(comments)
            // Update comment count
            comment_count = jq('.maxui-activity#'+activity_id+' .maxui-commentaction strong')
            jq(comment_count).text(eval(jq(comment_count).text())+1)
        }

    /*
    *    Searches for urls and hashtags in text and transforms to hyperlinks
    *    @param {String} text     String containing 0 or more valid links embedded with any other text
    */
    jq.fn.formatText = function (text){
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

            text = text.replace(
                /(\s|^)#{1}(\w+)/gi,
                function(){
                    var tag = arguments[2]
                    var search_url='{0}/{}'
                    return '<a class="maxui-hashtag" value="'+tag+'" href="' + search_url + '">#' + tag + ' </a>';
                }
            );
        }
        return text;
    }


    jq.fn.sha1 = function(msg) {

  function rotate_left(n,s) {
    var t4 = ( n<<s ) | (n>>>(32-s));
    return t4;
  };

  function lsb_hex(val) {
    var str="";
    var i;
    var vh;
    var vl;

    for( i=0; i<=6; i+=2 ) {
      vh = (val>>>(i*4+4))&0x0f;
      vl = (val>>>(i*4))&0x0f;
      str += vh.toString(16) + vl.toString(16);
    }
    return str;
  };

  function cvt_hex(val) {
    var str="";
    var i;
    var v;

    for( i=7; i>=0; i-- ) {
      v = (val>>>(i*4))&0x0f;
      str += v.toString(16);
    }
    return str;
  };


  function Utf8Encode(string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    }

    return utftext;
  };

  var blockstart;
  var i, j;
  var W = new Array(80);
  var H0 = 0x67452301;
  var H1 = 0xEFCDAB89;
  var H2 = 0x98BADCFE;
  var H3 = 0x10325476;
  var H4 = 0xC3D2E1F0;
  var A, B, C, D, E;
  var temp;

  msg = Utf8Encode(msg);

  var msg_len = msg.length;

  var word_array = new Array();
  for( i=0; i<msg_len-3; i+=4 ) {
    j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
    msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
    word_array.push( j );
  }

  switch( msg_len % 4 ) {
    case 0:
      i = 0x080000000;
    break;
    case 1:
      i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
    break;

    case 2:
      i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
    break;

    case 3:
      i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8  | 0x80;
    break;
  }

  word_array.push( i );

  while( (word_array.length % 16) != 14 ) word_array.push( 0 );

  word_array.push( msg_len>>>29 );
  word_array.push( (msg_len<<3)&0x0ffffffff );


  for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {

    for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
    for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);

    A = H0;
    B = H1;
    C = H2;
    D = H3;
    E = H4;

    for( i= 0; i<=19; i++ ) {
      temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B,30);
      B = A;
      A = temp;
    }

    for( i=20; i<=39; i++ ) {
      temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B,30);
      B = A;
      A = temp;
    }

    for( i=40; i<=59; i++ ) {
      temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B,30);
      B = A;
      A = temp;
    }

    for( i=60; i<=79; i++ ) {
      temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B,30);
      B = A;
      A = temp;
    }

    H0 = (H0 + A) & 0x0ffffffff;
    H1 = (H1 + B) & 0x0ffffffff;
    H2 = (H2 + C) & 0x0ffffffff;
    H3 = (H3 + D) & 0x0ffffffff;
    H4 = (H4 + E) & 0x0ffffffff;

  }

  var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

  return temp.toLowerCase();

    }

    /*
    *    Renders the timeline of the current user, defined in settings.username
    */
    jq.fn.printActivities = function(filters) {
        // save a reference to the container object to be able to access it
        // from callbacks defined in inner levels
        var maxui = this

        var func_params = []
        var insert_at = 'replace'

        if (filters.before)
            {insert_at = 'end'}
        if (filters.after)
            {insert_at = 'beggining'}



        if (_MAXUI.settings.activitySource=='timeline')
        {
            var activityRetriever = this.maxClient.getUserTimeline
            func_params.push(_MAXUI.settings.username)
        }
        else if (_MAXUI.settings.activitySource=='activities')
        {
            var activityRetriever = this.maxClient.getActivities
            func_params.push(_MAXUI.settings.username)
            func_params.push(_MAXUI.settings.readContextHash)
        }

        if (arguments.length>1)
        {
            var callback = arguments[1]
            func_params.push( function() {

                // Determine write permission, granted by default if we don't find a restriction
                var canwrite = true

                // Add read context if user is not subscribed to it
                var subscriptions = _MAXUI.settings.subscriptions
                if (!subscriptions[this.context.url])
                {
                    subscriptions[this.context.url]={}
                    subscriptions[this.context.url]['permissions']={}

                    // Check only for public defaults, as any other permission would require
                    // a susbcription, that we already checked that doesn't exists
                    subscriptions[this.context.url]['permissions']['read'] = this.context.permissions.read=='public'
                    subscriptions[this.context.url]['permissions']['write'] = false
                }

                // Iterate through all the defined write contexts to check for write permissions on
                // the current user
                for (wc=0;wc<_MAXUI.settings.writeContexts.length;wc++)
                    {
                        var write_context = _MAXUI.settings.writeContexts[wc]
                        if (subscriptions[write_context]['permissions'])
                        {
                          if (subscriptions[write_context]['permissions'].write==false)
                          {
                              canwrite = false
                          }
                        }
                        else { canwrite = false }
                    }

                // Render the postbox UI if user has permission
                if (canwrite)
                {
                    var params = jq.extend(_MAXUI.settings,{'avatar':_MAXUI.settings.avatarURLpattern.format(_MAXUI.settings.username),
                                                                'profile':_MAXUI.settings.profileURLpattern.format(_MAXUI.settings.username),
                                                                'allowPosting': canwrite,
                                                                'literals': _MAXUI.settings.literals
                                                               })
                    var postbox = MAXUI_POSTBOX.render(params)
                    jQuery('#maxui-mainpanel').prepend(postbox)
                }

                // format the result items as activities
                 maxui.formatActivities(this.items, insert_at, callback)
            })
        }
        else
        {
            func_params.push( function() {maxui.formatActivities(this.items, insert_at)})
        }


        // if passed as param, assume an object with search filtering params
        // one or all of [limit, before, after, hashtag]
        func_params.push(filters)

        activityRetriever.apply(this.maxClient,func_params)
        }

    /*
    *    Renders the timeline of the current user, defined in settings.username
    */
    jq.fn.printCommentsForActivity = function(activity_id) {


        var maxui = this
        var func_params = []

        func_params.push(activity_id)
        func_params.push(function() {maxui.formatComment(this.items, activity_id)})
        this.maxClient.getCommentsForActivity.apply(this.maxClient, func_params)

    }


})(jQuery);
