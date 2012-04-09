(function(jq) {
    /*
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    */
    jq.fn.maxUI = function(options) {

        // Keep a reference of the context object
        var maxui = this
        maxui.templates = max.templates()
        maxui.utils = max.utils()

        // create namespace global variable if it doesn't exists
        if (!window._MAXUI)
            { window._MAXUI = {}}

        // Get language from options or set default. Doing this previously to set other defaults
        // in order to get the default literals in the chosen language
        maxui.language = options.language || 'en'


        var defaults = {'maxRequestsAPI' : 'jquery',
                        'maxServerURL' : 'https://max.upc.edu',
                        'readContext': '',
                        'writeContexts' : [],
                        'activitySource': 'timeline',
                        'literals': max.literals(maxui.language),
                        'enableAlerts': false
                        }

        // extend defaults with user-defined settings
        // and store in the global _MAXUI namespace
        maxui.settings = jq.extend(defaults,options)

        // Configure maxui without CORS if CORS not available
        if (!maxui.utils.isCORSCapable())
            {
                // IF it has been defined an alias, set as max server url
                if (maxui.settings.maxServerURLAlias)
                maxui.settings.maxServerURL = maxui.settings.maxServerURLAlias
            }

        // Add read context to write contexts
        maxui.settings.writeContexts.push(maxui.settings.readContext)

        // Calculate readContextHash
        maxui.settings.readContextHash = maxui.utils.sha1(maxui.settings.readContext)



        // set default avatar and profile url pattern if user didn't provide it
        if (!maxui.settings.avatarURLpattern)
               maxui.settings['avatarURLpattern'] = maxui.settings.maxServerURL+'/people/{0}/avatar'

        if (!maxui.settings.contextAvatarURLpattern)
               maxui.settings['contextAvatarURLpattern'] = maxui.settings.maxServerURL+'/contexts/{0}/avatar'

        if (!maxui.settings.profileURLpattern)
               maxui.settings['profileURLpattern'] = maxui.settings.maxServerURL+'/profiles/{0}'

        // Catch errors triggered by failed max api calls
        if (maxui.settings.enableAlerts)
        jq(window).bind('maxclienterror', function(event,xhr) {
            var error = JSON.parse(xhr.responseText)
            alert('The server responded with a "{0}" error, with the following message: "{1}". \n\nPlease try again later or contact administrator at admin@max.upc.edu.'.format(error.error,error.error_description))
        })

        // Init MAX Client
        this.maxClient = new MaxClient()
        var maxclient_config = {  server:    maxui.settings.maxServerURL,
                                    mode:    maxui.settings.maxRequestsAPI,
                                   username: maxui.settings.username,
                                   token:    maxui.settings.oAuthToken
                               }
        this.maxClient.configure(maxclient_config)
        this.maxClient.getUserData(maxui.settings.username, function() {

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

            maxui.settings.subscriptions = userSubscriptions
            // render main interface
            var params = {
                         username: maxui.settings.username,
                         literals: maxui.settings.literals
                     }
            var mainui = maxui.templates.mainUI.render(params)
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
                  maxui.bindActionBehaviour('#maxui-newactivity','#maxui-newactivity-box', maxui.settings.literals.new_activity_text, function(text)
                          {
                          maxui.sendActivity(text)
                          jq('#maxui-search').toggleClass('folded',true)
                          })

                  //Assign Commentbox send comment action And textarea behaviour
                  maxui.bindActionBehaviour('#maxui-activities', '.maxui-newcommentbox', maxui.settings.literals.new_comment_text, function(text)
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
                  maxui.bindActionBehaviour('#maxui-search','#maxui-search-box', maxui.settings.literals.search_text, function(text)
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
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized==literal )
                      jq(this).val('')
        })

        .on('keyup',selector, function(event) {
                  event.preventDefault()
                  text = jq(this).val()
                  button = jq(this).parent().find('.maxui-button')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
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
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized=='' )
                      jq(this).val(literal)
        })

        .on('click',target+' .maxui-button',function (event) {
            event.preventDefault()
            var text = jq(this).parent().find('.maxui-text-input').val()
            var normalized = maxui.utils.normalizeWhiteSpace(text,false)
            if (normalized!=literal & normalized!='')
                clickFunction.apply(this,[text])
            })

    }

    /*
    *    Updates the search filters with a new collection of keywords/hashtags extracted of
    *    a user-entered text, and reloads the search query. Identifies special characters
    *    at the first position of each keyword to identify keyword type
    *
    *    @param {String} text    A string containing whitespace-separated keywords/#hashtags
    */
    jq.fn.textSearch = function (text) {
                maxui = this
                //Normalize spaces
                normalized = maxui.utils.normalizeWhiteSpace(text)
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
        var activity_items = maxui.templates.filters.render(params)
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
        func_params.push(maxui.settings.writeContexts)
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
        if (maxui.settings.generatorName) { func_params.push(maxui.settings.generatorName) }

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
                            if (activity.generator!=maxui.settings.generatorName)
                                generator = activity.generator
                         }

                    // Prepare avatar image url depending on actor type
                    var avatar_url = ''
                    var profile_url = ''
                    if (activity.actor.objectType=='person') {
                        avatar_url = maxui.settings.avatarURLpattern.format(activity.actor.username)
                        profile_url = maxui.settings.profileURLpattern.format(activity.actor.username)
                      }
                    else if (activity.actor.objectType=='context') {
                        avatar_url = maxui.settings.contextAvatarURLpattern.format(activity.actor.urlHash)
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
                                                         date: maxui.utils.formatDate(comment.published,maxui.language),
                                                         text: maxui.utils.formatText(comment.content),
                                                    avatarURL: maxui.settings.avatarURLpattern.format(comment.author.username),
                                                   profileURL: maxui.settings.profileURLpattern.format(comment.author.username)

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
                                     literals:maxui.settings.literals,
                                         date: maxui.utils.formatDate(activity.published, maxui.language),
                                         text: maxui.utils.formatText(activity.object.content),
                                      replies: replies,
                                    avatarURL: avatar_url,
                                   profileURL: profile_url,
                                  publishedIn: contexts,
                                          via: generator

                                 }
                    // Render the activities template and append it at the end of the rendered activities
                    // partials is used to render each comment found in the activities
                    var partials = {comment: maxui.templates.comment}
                    var activities = activities + maxui.templates.activity.render(params, partials)
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

                    var params = {   literals:maxui.settings.literals,
                                           id: comment.id,
                                       author: comment.author,
                                         date: maxui.utils.formatDate(comment.published, maxui.language),
                                         text: maxui.utils.formatText(comment.content),
                                    avatarURL: maxui.settings.avatarURLpattern.format(comment.author.username),
                                   profileURL: maxui.settings.profileURLpattern.format(comment.author.username)
                                 }
                    // Render the comment template and append it at the end of the rendered comments
                    var comments = comments + maxui.templates.comment.render(params)
                }
            // Insert new comments by replacing previous comments with all comments
            jq('.maxui-activity#'+activity_id+' .maxui-commentsbox').html(comments)
            // Update comment count
            comment_count = jq('.maxui-activity#'+activity_id+' .maxui-commentaction strong')
            jq(comment_count).text(eval(jq(comment_count).text())+1)
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



        if (maxui.settings.activitySource=='timeline')
        {
            var activityRetriever = this.maxClient.getUserTimeline
            func_params.push(maxui.settings.username)
        }
        else if (maxui.settings.activitySource=='activities')
        {
            var activityRetriever = this.maxClient.getActivities
            func_params.push(maxui.settings.username)
            func_params.push(maxui.settings.readContextHash)
        }

        if (arguments.length>1)
        {
            var callback = arguments[1]
            func_params.push( function() {

                // Determine write permission, granted by default if we don't find a restriction
                var canwrite = true

                // Add read context if user is not subscribed to it
                var subscriptions = maxui.settings.subscriptions
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
                for (wc=0;wc<maxui.settings.writeContexts.length;wc++)
                    {
                        var write_context = maxui.settings.writeContexts[wc]
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
                    var params = jq.extend(maxui.settings,{'avatar':maxui.settings.avatarURLpattern.format(maxui.settings.username),
                                                                'profile':maxui.settings.profileURLpattern.format(maxui.settings.username),
                                                                'allowPosting': canwrite,
                                                                'literals': maxui.settings.literals
                                                               })
                    var postbox = maxui.templates.postBox.render(params)
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
