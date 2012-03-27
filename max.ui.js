(function($) {
    /*
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    */
    $.fn.maxUI = function(options) {

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
        var literals = $.extend(literals_en,options.literals)
        delete options.literals

        var defaults = {'maxRequestsAPI' : 'jquery',
                        'maxServerURL' : 'http://max.beta.upcnet.es',
                        'readContext': '',
                        'writeContexts' : [],
                        'activitySource': 'timeline',
                        'literals': literals
                        }

        // extend defaults with user-defined settings
        // and store in the global _MAXUI namespace
        _MAXUI.settings = $.extend(defaults,options)

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

        _MAXUI.settings.writeContexts.push(_MAXUI.settings.readContext)

        // set default avatar and profile url pattern if user didn't provide it
        if (!_MAXUI.settings.avatarURLpattern)
               _MAXUI.settings['avatarURLpattern'] = _MAXUI.settings.maxServerURL+'/people/{0}/avatar'

        if (!_MAXUI.settings.profileURLpattern)
               _MAXUI.settings['profileURLpattern'] = _MAXUI.settings.maxServerURL+'/profiles/{0}'

        // Init MAX CLient
        this.maxClient = new MaxClient(_MAXUI.settings.maxServerURL)
        this.maxClient.setMode(_MAXUI.settings.maxRequestsAPI)
        this.maxClient.setActor(_MAXUI.settings.username)

        this.maxClient.getUserData(_MAXUI.settings.username, function() {

            //Determine if user can write in writeContexts
            var userSubscriptionPermissions = {}
            if (this.subscribedTo)
            {
                if (this.subscribedTo.items)
                {
                    if (this.subscribedTo.items.length>0)
                    {
                        for (sc=0;sc<this.subscribedTo.items.length;sc++)
                        {
                            var subscription = this.subscribedTo.items[sc]
                            userSubscriptionPermissions[subscription.url]={}
                            for (pm=0;pm<subscription.permissions.length;pm++)
                            {
                                var permission=subscription.permissions[pm]
                                userSubscriptionPermissions[subscription.url][permission]=true
                            }
                        }
                    }
                }
            }
            var canwrite = true

            for (wc=0;wc<_MAXUI.settings.writeContexts.length;wc++)
                {
                    var write_context = _MAXUI.settings.writeContexts[wc]
                    if (userSubscriptionPermissions[write_context])
                    {
                      if (userSubscriptionPermissions[write_context].write==false)
                      {
                          canwrite = false
                      }
                    }
                    else { canwrite = false }
                }
            // render main interface using partials
            var params = $.extend(_MAXUI.settings,{'avatar':_MAXUI.settings.avatarURLpattern.format(_MAXUI.settings.username),
                                                        'profile':_MAXUI.settings.profileURLpattern.format(_MAXUI.settings.username),
                                                        'allowPosting': canwrite
                                                       })
            var mainui = MAXUI_MAIN_UI.render(params)
            maxui.html(mainui)
            maxui.printActivities({},function() {

                  //Assign click to loadmore
                  $('#maxui-more-activities .maxui-button').click(function () {
                      maxui.loadMoreActivities()
                      })

                  //Assign click to toggle search filters
                  $('#maxui-search-toggle').click(function () {
                      event.preventDefault()
                      $('#maxui-search').toggleClass('folded')
                      if ($('#maxui-search').hasClass('folded'))
                          maxui.printActivities({})
                      else
                          maxui.reloadFilters()
                      })

                  //Assign Commentbox toggling via delegating the click to the activities container
                  $('#maxui-activities').on('click','.maxui-commentaction',function (event) {
                      event.preventDefault()
                      window.status=''
                      $(this).closest('.maxui-activity').find('.maxui-comments').toggle(200)
                      })

                  //Assign hashtag filtering via delegating the click to the activities container
                  $('#maxui-activities').on('click','.maxui-hashtag',function () {
                      event.preventDefault()
                      maxui.addFilter({type:'hashtag', value:$(this).attr('value')})
                      })

                  //Assign filter closing via delegating the click to the filters container
                  $('#maxui-search-filters').on('click','.close',function () {
                      event.preventDefault()
                      var filter = $(this.parentNode.parentNode)
                      maxui.delFilter({type:filter.attr('type'), value:filter.attr('value')})
                      })

                  //Assign Activity post action And textarea behaviour
                  maxui.bindActionBehaviour('#maxui-newactivity','#maxui-newactivity-box', _MAXUI.settings.literals.new_activity_text, function(text)
                          {
                          maxui.sendActivity(text)
                          $('#maxui-search').toggleClass('folded',true)
                          })

                  //Assign Commentbox send comment action And textarea behaviour
                  maxui.bindActionBehaviour('#maxui-activities', '.maxui-newcommentbox', _MAXUI.settings.literals.new_comment_text, function(text)
                         {
                         var activityid = $(this).closest('.maxui-activity').attr('id')
                         maxui.maxClient.addComment(text, activityid, function() {
                                      $('#activityContainer textarea').val('')
                                      var activity_id = this.object.inReplyTo[0].id
                                      maxui.printCommentsForActivity(activity_id)
                                      })
                        })

                  //Assign Search box search action And input behaviour
                  maxui.bindActionBehaviour('#maxui-search','#maxui-search-box', _MAXUI.settings.literals.search_text, function(text)
                         {
                         maxui.textSearch(text)
                         $('#maxui-search').toggleClass('folded',false)
                         })
                  // Execute search if <enter> pressed
                  $('#maxui-search .maxui-text-input').keyup(function(e) {
                            if (e.keyCode == 13) {
                               maxui.textSearch($(this).attr('value'))
                               $('#maxui-search').toggleClass('folded',false)
                            }
                  });
              })
        })

        // allow $ chaining
        return maxui;
    };


    $.fn.bindActionBehaviour = function(delegate, target, literal, clickFunction) {

        // Clear input when focusing in only if user hasn't typed anything yet
        var maxui = this
        var selector = target+' .maxui-text-input'
        $(delegate)

        .on('focusin',selector, function() {
                  text = $(this).val()
                  normalized = maxui.normalizeWhiteSpace(text,false)
                  if ( normalized==literal )
                      $(this).val('')
        })

        .on('keyup',selector, function() {
                  text = $(this).val()
                  button = $(this).parent().find('.maxui-button')
                  normalized = maxui.normalizeWhiteSpace(text,false)
                  if (normalized=='')
                  {
                      $(button).attr('disabled', 'disabled')
                      $(this).attr('class','empty maxui-text-input')
                  }
                  else
                  {
                      $(button).removeAttr('disabled')
                      $(this).attr('class','maxui-text-input')
                  }

        })

        .on('focusout',selector, function() {
                  text = $(this).val()
                  normalized = maxui.normalizeWhiteSpace(text,false)
                  if ( normalized=='' )
                      $(this).val(literal)
        })

        .on('click',target+' .maxui-button',function () {
            event.preventDefault()
            var text = $(this).parent().find('.maxui-text-input').val()
            var normalized = maxui.normalizeWhiteSpace(text,false)
            if (normalized!=literal & normalized!='')
                clickFunction.apply(this,[text])
            })

    }

    $.fn.normalizeWhiteSpace = function (s, multi) {

        s = s.replace(/(^\s*)|(\s*$)/gi,"");
        s = s.replace(/\n /,"\n");

        var trimMulti=true
        if (arguments.length>1)
            trimMulti=multi
        if (trimMulti==true)
            s = s.replace(/[ ]{2,}/gi," ");
        return s;
    }

    $.fn.textSearch = function (text) {
                //Normalize spaces
                normalized = this.normalizeWhiteSpace(text)
                var keywords = normalized.split(' ')
                for (kw=0;kw<keywords.length;kw++)
                {
                    var keyword = keywords[kw]
                    if (keyword.length>=3)
                        this.addFilter({type:'keyword', value:keyword}, false)
                }
                this.reloadFilters()
    }


    /*
    *    Reloads the current filters UI and executes the search
    */
    $.fn.reloadFilters = function() {

        var maxui=this
        var params = {filters:window._MAXUI.filters}
        var activity_items = MAXUI_FILTERS.render(params)
        $('#maxui-search-filters').html(activity_items)
        var filters = {}
        // group filters
        for (f=0;f<params.filters.length;f++)
            { var filter = params.filters[f]

              if (!filters[filter.type])
                  filters[filter.type]=[]
              filters[filter.type].push(filter.value)
            }

        maxui.printActivities(filters)

   }


    /*
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    */
    $.fn.delFilter = function(filter) {
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
    $.fn.addFilter = function(filter) {

        var reload=true
        //Reload or not by func argument
        if (arguments.length>1)
            reload=arguments[1]

        if (!window._MAXUI.filters)
            { window._MAXUI.filters = []}

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
        var func_params = []
        func_params.push(text)
        func_params.push(_MAXUI.settings.writeContexts)
        func_params.push( function() {
                              $('#maxui-newactivity textarea').val('')
                              var first = $('.maxui-activity:first')
                              if (first.length>0)
                                  { filter = {after:first.attr('id')}
                                    maxui.printActivities(filter)
                                  }
                              else {
                                    maxui.printActivities()
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
    $.fn.loadMoreActivities = function () {
        maxui=this
        filter = {before:$('.maxui-activity:last').attr('id')}
        maxui.printActivities(filter)

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

    /*
    *    Returns an utf8 decoded string
    *    @param {String} str_data    an utf-8 String
    */
    $.fn.utf8_decode = function(str_data) {
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
    *    meant to be called as a callback of a call to a max webservice returning activities
    *    @param {String} items     a list of objects representing activities, returned by max
    *    @param {String} insertAt  optional argument indicating were to prepend or append activities
    */
    $.fn.formatActivities = function(items, insertAt) {
            // When receiving the list of activities from max
            // construct the object for Hogan
            // `activities `contain the list of activity objects
            // `formatedDate` contain a function maxui will be rendered inside the template
            //             to obtain the published date in a "human readable" way
            // `avatarURL` contain a function maxui will be rendered inside the template
            //             to obtain the avatar url for the activity's actor
            var maxui = this;
            var activities = ''

            for (i=0;i<items.length;i++)
                {
                    var activity = items[i]

                    var contexts = undefined
                    if (activity.hasOwnProperty('contexts'))
                         {
                             if (activity.contexts.length>0)
                                 {
                                      contexts = activity.contexts[0]
                                 }
                         }

                    var generator = undefined

                    if (activity.hasOwnProperty('generator'))
                         {
                            if (activity.generator!=_MAXUI.settings.generatorName)
                                generator = activity.generator
                         }

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


                    var params = {
                                           id: activity.id,
                                        actor: activity.actor,
                                     literals:_MAXUI.settings.literals,
                                         date: maxui.formatDate(activity.published),
                                         text: maxui.formatText(activity.object.content),
                                      replies: replies,
                                    avatarURL: _MAXUI.settings.avatarURLpattern.format(activity.actor.username),
                                   profileURL: _MAXUI.settings.profileURLpattern.format(activity.actor.username),
                                  publishedIn: contexts,
                                          via: generator
                                 }
                    // Render the activities template and append it at the end of the rendered activities
                    var partials = {comment: MAXUI_COMMENT}
                    var activities = activities + MAXUI_ACTIVITY.render(params, partials)
                }



            if (insertAt == 'beggining')
            {
                $('#maxui-preload .wrapper').prepend(activities)
                var ritems = $('#maxui-preload .wrapper .maxui-activity')
                var heightsum = 0
                for (i=0;i<ritems.length;i++)
                    {
                      heightsum += $(ritems[i]).height()+18
                    }



                var currentPreloadHeight = $('#maxui-preload').height()
                $('#maxui-preload').height(heightsum-currentPreloadHeight)
                $('#maxui-preload').css( {"margin-top":(heightsum-currentPreloadHeight)*-1})

                $('#maxui-preload').animate({"margin-top":0}, 200, function()
                   {
                        $('#maxui-preload .wrapper').html("")
                        $('#maxui-activities').prepend(activities)
                        $('#maxui-preload').height(0)

                   })

//                $('#maxui-activities').css({'margin-top':69})
                //$('#maxui-activities').prepend(activity_items)
            }
            else if (insertAt == 'end')
                $('#maxui-activities').append(activities)
            else
                $('#maxui-activities').html(activities)

          // Has a callback
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
    $.fn.formatComment = function(items, activity_id) {
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
            $('.maxui-activity#'+activity_id+' .maxui-commentsbox').html(comments)
            // Update comment count
            comment_count = $('.maxui-activity#'+activity_id+' .maxui-commentaction strong')
            $(comment_count).text(eval($(comment_count).text())+1)
        }

    /*
    *    Searches for urls and hashtags in text and transforms to hyperlinks
    *    @param {String} text     String containing 0 or more valid links embedded with any other text
    */
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


    /*
    *    Renders the timeline of the current user, defined in settings.username
    */
    $.fn.printActivities = function(filters) {
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
            func_params.push(_MAXUI.settings.readContext)
        }

        if (arguments.length>1)
        {
            var callback = arguments[1]
            func_params.push( function() {maxui.formatActivities(this.items, insert_at, callback)})
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
    $.fn.printCommentsForActivity = function(activity_id) {


        var maxui = this
        var func_params = []

        func_params.push(activity_id)
        func_params.push(function() {maxui.formatComment(this.items, activity_id)})
        this.maxClient.getCommentsForActivity.apply(this.maxClient, func_params)

    }


})(jQuery);
