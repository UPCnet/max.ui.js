(function(jq) {
    /*
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    */
    jq.fn.maxUI = function(options) {

        // Keep a reference of the context object
        var maxui = this
        maxui.utils = max.utils()

        var defaults = {'maxRequestsAPI' : 'jquery',
                        'maxServerURL' : 'https://max.upc.edu',
                        'readContext': undefined,
                        'writeContexts' : [],
                        'activitySource': 'timeline',
                        'enableAlerts': false,
                        'UISection': 'timeline',
                        'disableTimeline': false,
                        'disableConversations': false,
                        'conversationsSection': 'conversations',
                        'activitySortOrder': 'activities',
                        'profileURLPattern': undefined,
                        'transports': undefined
                        }

        // extend defaults with user-defined settings
        maxui.settings = jq.extend(defaults,options)

        // Check timeline/activities consistency
        if (maxui.settings.UISection == 'timeline' && maxui.settings.activitySource == 'timeline' && maxui.settings.readContext)
        {
            maxui.settings.readContext = undefined
            maxui.settings.writeContexts = []
        }

        if (maxui.settings.readContext)
        {
            // Calculate readContextHash
            maxui.settings.readContextHash = maxui.utils.sha1(maxui.settings.readContext)

            // Add read context to write contexts
            maxui.settings.writeContexts.push(maxui.settings.readContext)

            // Store the hashes of the write contexts
            maxui.settings.writeContextsHashes = []
            for (wc=0;wc<maxui.settings.writeContexts.length;wc++) {
                maxui.settings.writeContextsHashes.push(maxui.utils.sha1(maxui.settings.writeContexts[wc]))
            }
        }

        // Get language from options or set default.
        // Set literals in the choosen language and extend from user options
        maxui.language = options.language || 'en'
        user_literals = options.literals || {}
        maxui.settings.literals = jq.extend(max.literals(maxui.language), user_literals)

        // Configure maxui without CORS if CORS not available
        if (!maxui.utils.isCORSCapable())
            {
                // IF it has been defined an alias, set as max server url
                if (maxui.settings.maxServerURLAlias)
                maxui.settings.maxServerURL = maxui.settings.maxServerURLAlias
            }

        //set default avatar and profile url pattern if user didn't provide it
        if (!maxui.settings.avatarURLpattern)
              maxui.settings['avatarURLpattern'] = maxui.settings.maxServerURL+'/people/{0}/avatar'

        if (!maxui.settings.contextAvatarURLpattern)
               maxui.settings['contextAvatarURLpattern'] = maxui.settings.maxServerURL+'/contexts/{0}/avatar'

        // DEFAULT VALUE DISABLED !!! Now disables the link by css and javascript if
        // not configured. The desired configuration would be to have a default
        // profile pattern if nothing specified as with the avatar
        // if (!maxui.settings.profileURLpattern)
        //         maxui.settings['profileURLpattern'] = maxui.settings.maxServerURL+'/profiles/{0}'

        // Catch errors triggered by failed max api calls
        if (maxui.settings.enableAlerts)
        jq(window).bind('maxclienterror', function(event,xhr) {
            var error = JSON.parse(xhr.responseText)
            alert('The server responded with a "{0}" error, with the following message: "{1}". \n\nPlease try again later or contact administrator at admin@max.upc.edu.'.format(error.error,error.error_description))
        })

        maxui.views = max.views(maxui.settings);

        maxui.mainview = new maxui.views.MainView({el: maxui})

        // allow jq chaining
        return maxui;
    };


























    jq.fn.bindEvents =function() {

        maxui = this
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

        //Assign Username and avatar clicking via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-actor',function (event) {
            event.preventDefault()
            var actor = jq(this).find('.maxui-username').text()
            maxui.addFilter({type:'actor', value:actor})
            jq('#maxui-search').toggleClass('folded',false)

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

        //Assign user mention suggestion to textarea by click
        jq('#maxui-predictive').on('click','.maxui-prediction',function (event) {
            event.preventDefault()

            var $selected = jq(this)
            var $area = jq('#maxui-newactivity-box textarea')
            var $predictive = jq('#maxui-predictive')
            var text = $area.val()

            var matchMention = new RegExp('^\\s*@([\\w\\.]+)')
            var match = text.match(matchMention)
            var replacement = text.replace(matchMention, '@'+$selected.text()+' ')
            $predictive.hide()
            $area.val(replacement)
            $area.focus()

            })

        //Assign activation of conversations section by its button
        jq('#maxui-show-conversations').on('click',function (event) {
            event.preventDefault()
            window.status=''
            maxui.printConversations( function() { maxui.toggleSection('conversations') })

            })

        //Assign activation of conversations section by its button
        jq('#maxui-back-conversations').on('click',function (event) {
            event.preventDefault()
            window.status=''
            maxui.printConversations( function() { maxui.toggleMessages('conversations') })
            })

        //Assign activation of timeline section by its button
        jq('#maxui-show-timeline').on('click',function (event) {
            event.preventDefault()
            window.status=''
            maxui.printActivities({}, function() { maxui.toggleSection('timeline') })
            })

        //Assign activation of messages section by delegating the clicl of a conversation arrow to the conversations container
        jq('#maxui-conversations').on('click', '.maxui-conversation',function (event) {
            event.preventDefault()
            window.status=''
            var conversation_hash = jq(event.target).closest('.maxui-conversation').attr('id')
            maxui.settings.currentConversation = conversation_hash
            maxui.printMessages(conversation_hash, function() { maxui.toggleMessages('messages') })
            })

        //Assign activity removal via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-delete-activity',function (event) {
            event.preventDefault()
            var $activity = jq(this).closest('.maxui-activity')
            var activityid = $activity.attr('id')
            maxui.maxClient.removeActivity(activityid, function() {
                $activity.css({height:$activity.height(), 'min-height':'auto'})
                $activity.animate({height: 0, opacity:0}, 100, function(event) {
                    $activity.remove()
                })
            })
        })

        //Assign Activity post action And textarea behaviour
        maxui.bindActionBehaviour('#maxui-newactivity','#maxui-newactivity-box', function(text)
                {
                var matchMention = new RegExp('^\\s*@([\\w\\.]+)\s*')
                var match = text.match(matchMention)

                if (maxui.settings.UISection=='timeline') {
                    if (match) {
                        // strip mentions at the start of line
                        var stripped = text.replace( matchMention,'')
                        maxui.createConversationAndSendMessage(stripped,match[1])
                    }
                    else {
                        maxui.sendActivity(text)
                        jq('#maxui-search').toggleClass('folded',true)
                    }
                }

                else if (maxui.settings.UISection=='conversations') {
                    if (maxui.settings.conversationsSection=='conversations') {
                        if (match) {
                            // strip mentions at the start of line
                            var stripped = text.replace( matchMention,'')
                            maxui.createConversationAndSendMessage(stripped,match[1])
                        }
                    }
                    else {
                      maxui.sendMessage(text, maxui.settings.currentConversation)

                    }

                }


                },
                function(text, area, button, ev) {

                  var key = ev.which
                  var matchMention = new RegExp('^\\s*@([\\w\\.]+)\s*')
                  var match = text.match(matchMention)

                  var matchMentionEOL = new RegExp('^\\s*@([\\w\\.]+)\s*$')
                  var matchEOL = text.match(matchMentionEOL)

                  var $selected = jq('.maxui-prediction.selected')
                  var $area = jq(area)
                  var $predictive = jq('#maxui-predictive')
                  var is_predicting = jq('#maxui-predictive:visible').length>0

                  // Up & down
                  if (key==40 && is_predicting) {
                    var $next = $selected.next()
                    $selected.removeClass('selected')
                    if ($next.length>0) $next.addClass('selected')
                    else {$selected.siblings(':first').addClass('selected')}
                  }
                  else if (key==38 && is_predicting) {
                    var $prev = $selected.prev()
                    $selected.removeClass('selected')
                    if ($prev.length>0) $prev.addClass('selected')
                    else {$selected.siblings(':last').addClass('selected')}
                  }
                  else if (key==27) {
                    $predictive.hide()
                  }
                  else if ((key==13 || key==9) && is_predicting) {
                    var matchMention2 = new RegExp('^\\s*@([\\w\\.]+)')
                    var replacement = text.replace(matchMention2, '@'+$selected.text()+' ')
                    $predictive.hide()
                    $area.val(replacement).focus()
                  }

                  else if (text=='') {
                      if (maxui.settings.UISection=='timeline')
                          jq(button).val(maxui.settings.literals.new_activity_post)
                  }

                  else //1
                  {
                      if (maxui.settings.UISection=='timeline') {

                          if (match) {
                              jq(button).val(maxui.settings.literals.new_message_post)
                              if (matchEOL) {
                                  jq('#maxui-predictive').show()
                                  jq('#maxui-predictive').html('<ul></ul>')
                                  maxui.printPredictions(match[1])
                              }
                              jq(button).removeAttr('disabled')
                              jq(button).attr('class','maxui-button')
                              $area.attr('class','maxui-text-input')


                          }
                          else {
                              jq(button).val(maxui.settings.literals.new_activity_post)
                              jq('#maxui-predictive').hide()
                              if (!text.match(RegExp('^\\s*@')) && !maxui.settings.canwrite) {
                                  $area.attr('class','maxui-text-input error')
                                  $area.attr('title', maxui.settings.literals.post_permission_unauthorized)
                              }                          }
                      }

                      else if (maxui.settings.UISection=='conversations') {

                          if (maxui.settings.conversationsSection=='conversations') {
                              if (match) {
                                  jq(button).removeAttr('disabled')
                                  jq(button).attr('class','maxui-button')
                                  $area.attr('class','maxui-text-input')
                                  jq(button).removeAttr('disabled')
                                  jq(button).attr('class','maxui-button')
                                  $area.attr('class','maxui-text-input')
                                  if (matchEOL) {
                                      jq('#maxui-predictive').show()
                                      jq('#maxui-predictive').html('<ul></ul>')
                                      maxui.printPredictions(match[1])
                                  }
                              }

                              else {
                                  jq('#maxui-predictive').hide()
                                  jq(button).attr('disabled', 'disabled')
                                  jq(button).attr('class','maxui-button maxui-disabled')
                                  $area.attr('class','maxui-empty maxui-text-input')
                                  if (!text.match(RegExp('^\\s*@')) ) {
                                      $area.attr('class','maxui-text-input error')
                                      $area.attr('title', maxui.settings.literals.post_permission_not_here)
                                  }
                              }
                          }
                          else if (maxui.settings.conversationsSection=='messages') {
                              jq('#maxui-predictive').hide()
                              jq(button).removeAttr('disabled')
                              jq(button).attr('class','maxui-button')
                              $area.attr('class','maxui-text-input')
                          }


                      } //elseif

                  } //1
                }) //function



        //Assign Commentbox send comment action And textarea behaviour
        maxui.bindActionBehaviour('#maxui-activities', '.maxui-newcommentbox', function(text)
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
        maxui.bindActionBehaviour('#maxui-search','#maxui-search-box', function(text)
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
    }

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
    jq.fn.bindActionBehaviour = function(delegate, target, clickFunction) {

        // Clear input when focusing in only if user hasn't typed anything yet
        var maxui = this
        var selector = target+' .maxui-text-input'
        if (arguments.length>3) { var extra_bind = arguments[3] }
        else { var extra_bind = null }
        jq(delegate)

        // .on('focusin',selector, function(event) {
        //           event.preventDefault()
        //           var text = jq(this).val()
        //           var literal = jq(this).attr('data-literal')
        //           normalized = maxui.utils.normalizeWhiteSpace(text,false)
        //           if ( normalized==literal )
        //               jq(this).val('')
        // })

         .on('keydown', selector, function(event) {
           if ( jq('#maxui-predictive:visible').length>0 &&  (event.which==40 || event.which==38 || event.which==13 || event.which==9)) {
              maxui.utils.freezeEvent(event)
           } else if(event.which==13 && event.shiftKey==false) {
                event.preventDefault()
                var $area = jq(this).parent().find('.maxui-text-input')
                var literal = $area.attr('data-literal')
                var text = $area.val()
                var normalized = maxui.utils.normalizeWhiteSpace(text,false)

                if (normalized!=literal & normalized!='')
                    clickFunction.apply(this,[text])

           }


         })

        // .on('keyup',selector, function(event) {
        //           event.preventDefault()
        //           event.stopPropagation()
        //           var text = jq(this).val()
        //           var button = jq(this).parent().find('.maxui-button')
        //           var normalized = maxui.utils.normalizeWhiteSpace(text,false)
        //           if (normalized=='')
        //           {   jq(button).attr('disabled', 'disabled')
        //               jq(button).attr('class','maxui-button maxui-disabled')
        //               jq(this).attr('class','maxui-empty maxui-text-input')
        //               jq(this).removeAttr('title')
        //           }
        //           else
        //           {   if (maxui.settings.canwrite) {
        //                   jq(button).removeAttr('disabled')
        //                   jq(button).attr('class','maxui-button')
        //                   jq(this).attr('class','maxui-text-input')
        //               }
        //           }

        //           if (extra_bind!=null) {
        //             extra_bind(text, this, button, event)
        //           }


        // })

        // .on('focusout',selector, function(event) {
        //           event.preventDefault()
        //           var text = jq(this).val()
        //           var literal = jq(this).attr('data-literal')
        //           normalized = maxui.utils.normalizeWhiteSpace(text,false)
        //           if ( normalized=='' )
        //               jq(this).val(literal)
        // })

    //     .on('click',target+' .maxui-button',function (event) {
    //         event.preventDefault()
    //         var $area = jq(this).parent().find('.maxui-text-input')
    //         var literal = $area.attr('data-literal')
    //         var text = $area.val()
    //         var normalized = maxui.utils.normalizeWhiteSpace(text,false)

    //         if (normalized!=literal & normalized!='')
    //             clickFunction.apply(this,[text])
    //         })

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

                    switch (keyword[0])
                    {
                    case '#': var kwtype='hashtag';
                              var keyword = keyword.substr(1);
                              break;
                    case '@': var kwtype='actor';
                              var keyword = keyword.substr(1);
                              break;
                    default:  var kwtype = 'keyword';
                              break;
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
        var params = {filters:maxui.filters}
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
        jq('#maxui-search-toggle').toggleClass('maxui-disabled', maxui.filters.length==0)
        jq('#maxui-search').toggleClass('folded',maxui.filters.length==0)
   }


    /*
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    */
    jq.fn.delFilter = function(filter) {
        maxui = this
        var deleted = false
        var index = -1
        for (i=0;i<maxui.filters.length;i++)
             if (maxui.filters[i].value==filter.value & maxui.filters[i].type==filter.type)
              {
                 deleted = true
                 maxui.filters.splice(i,1)
              }
        if (deleted)
            this.reloadFilters()
    }

    /*
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    */
    jq.fn.addFilter = function(filter) {

        maxui = this
        var reload=true
        //Reload or not by func argument
        if (arguments.length>1)
            reload=arguments[1]

        if (!maxui.filters)
            { maxui.filters = []}

        switch (filter.type)
        {
        case "hashtag": filter['prepend']='#';break;
        case "actor": filter['prepend']='@';break;
        default:        filter['prepend']='';break;
        }


        var already_filtered = false
        for (i=0;i<maxui.filters.length;i++)
             if (maxui.filters[i].value==filter.value & maxui.filters[i].type==filter.type)
                 already_filtered = true

         if (!already_filtered)
         {
            maxui.filters.push(filter)
            if(reload==true)
                this.reloadFilters()
         }
    }

    /*
    *    Toggles between Conversations and Messages
    */
    jq.fn.toggleMessages = function(sectionToEnable) {
        maxui = this

        var $conversations = jq('#maxui-conversations')
        var $conversations_list = jq('#maxui-conversations-list')
        var $messages = jq('#maxui-messages')
        var $message_list = jq('#maxui-message-list')
        var $postbox = jq('#maxui-newactivity-box textarea')

        if (sectionToEnable=='messages')
        {
            var widgetWidth = $conversations_list.width()+11 // +2 To include border
            var height = 270
            //$conversations_list.jScrollPane().data('jsp').destroy()
            $conversations_list.animate({'margin-left':widgetWidth*(-1) }, 400)
            $messages.animate({'left':0}, 400, function(event) {
                $message_list.height(height-22)
                $message_list.jScrollPane({'maintainPosition':true})
            $message_list.jScrollPane().data('jsp').scrollToBottom()

            })
            $messages.width(widgetWidth)
            maxui.settings.conversationsSection='messages'
            var literal = maxui.settings.literals.new_activity_text
            $postbox.val(literal).attr('data-literal', literal)
        }
        else {
            var widgetWidth = $conversations_list.width()+11 // +2 To include border
            $conversations_list.animate({'margin-left':0 }, 400)
            $message_list.jScrollPane().data('jsp').destroy()
            $messages.animate({'left':widgetWidth}, 400)
            maxui.settings.conversationsSection='conversations'
            var literal = maxui.settings.literals.new_conversation_text
            $postbox.val(literal).attr('data-literal', literal)
        }
    }


    /*
    *    Toggles between main sections
    */
    jq.fn.toggleSection = function(sectionToEnable) {
        maxui = this
        var $search = jq('#maxui-search')
        var $timeline = jq('#maxui-timeline')
        var $timeline_wrapper = jq('#maxui-timeline .maxui-wrapper')
        var $conversations = jq('#maxui-conversations')
        var $conversations_list = jq('#maxui-conversations #maxui-conversations-list')
        var $conversations_list_wrapper = jq('#maxui-conversations #maxui-conversations-list .maxui-wrapper')
        var $postbutton = jq('#maxui-newactivity-box .maxui-button')
        var $conversationsbutton = jq('#maxui-show-conversations')
        var $timelinebutton = jq('#maxui-show-timeline')

        if (sectionToEnable=='conversations')
        {
          $conversations.show()
          $conversations.width($conversations.width())
          $conversations_list.width($conversations.width())
          var height = 270

          $conversations.animate({'height':height}, 400, function(event) {
            $conversations_list.height(height)
            if (jq('#maxui-conversations .jspPane').length==0) {
                $conversations_list.jScrollPane({'maintainPosition':true, 'stickToBottom': true})
              }
          })
          $timeline.animate({'height':0}, 400)
          $search.hide(400)
          maxui.settings.UISection='conversations'
          $postbutton.val(maxui.settings.literals.new_message_post)
          $conversationsbutton.hide()
          if (!maxui.settings.disableTimeline) $timelinebutton.show()

        }
        else
        {
          $timeline.show()
          var timeline_height = $timeline_wrapper.height()
          $timeline.animate({'height':timeline_height}, 400, function(event) {
              $timeline.css('height','')
          })
          $conversations.animate({'height':0}, 400, function(event) {
              $conversations.hide()
          })
          $search.show(400)
          maxui.settings.UISection='timeline'
          $postbutton.val(maxui.settings.literals.new_activity_post)
          if (!maxui.settings.disableConversations) $conversationsbutton.show()
          $timelinebutton.hide()

        }

        }

    /*
    *    Returns the current settings of the plugin
    */
    jq.fn.Settings = function() {
        maxui = this
        return maxui.settings
        }


    /*
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    */
    jq.fn.createConversationAndSendMessage = function (text, target) {
        maxui = this
        var func_params = []
        func_params.push(text)

        var participants = []
        participants.push(maxui.settings.username)
        participants.push(target)
        func_params.push(participants)

        if (maxui.settings.UISection=='conversations') {
            func_params.push( function() {
                            jq('#maxui-newactivity textarea').val('')
                            jq('#maxui-newactivity .maxui-button').attr('disabled','disabled')
                            var chash = this.contexts[0].id
                            var activityid = this.id
                            maxui.printMessages(chash, function() {
                                   maxui.toggleMessages('messages')
                                   maxui.io.emit('join', maxui.settings.username)
                                   maxui.settings.currentConversation = chash
                                   maxui.io.emit('talk', { conversation: chash, timestamp: maxui.utils.timestamp(), messageID: activityid } )
                            })
                       })
        } else {
            func_params.push( function() {
                            jq('#maxui-newactivity textarea').val('')
                            jq('#maxui-newactivity .maxui-button').attr('disabled','disabled')
                            maxui.printConversations( function() { maxui.toggleSection('conversations') })
                           })
        }

        var messageAdder = maxui.maxClient.addMessageAndConversation
        messageAdder.apply(maxui.maxClient, func_params)

    }

    /*
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    */
    jq.fn.sendMessage = function (text, chash) {
        maxui = this
        var func_params = []
        func_params.push(text)

        func_params.push(chash)

        func_params.push( function() {
                            jq('#maxui-newactivity textarea').val('')
                            jq('#maxui-newactivity .maxui-button').attr('disabled','disabled')
                            maxui.printMessages(chash, function() {maxui.toggleMessages('messages')})
                            var activityid = this.id
                            maxui.io.emit('talk', { conversation: chash, timestamp: maxui.utils.timestamp(), messageID: activityid } )

                           })

        var messageAdder = maxui.maxClient.addMessage
        messageAdder.apply(maxui.maxClient, func_params)

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
    *    Renders the conversations list of the current user, defined in settings.username
    */
    jq.fn.printPredictions = function(query) {
        var maxui = this

        var func_params = []
        func_params.push(query)
        func_params.push( function() { maxui.formatPredictions(this.items) })

        var userListRetriever = this.maxClient.getUsersList
        userListRetriever.apply(this.maxClient,func_params)
    }

    /*
    *
    *
    */
    jq.fn.formatPredictions = function(items) {
        var maxui = this;

        // String to store the generated html pieces of each conversation item
        var predictions = ''

        // Iterate through all the conversations
        for (i=0;i<items.length;i++)
            {
            var prediction = items[i]
            var avatar_url = maxui.settings.avatarURLpattern.format(prediction.username)
            var params = {
                               username: prediction.username,
                              avatarURL: avatar_url,
                               cssclass: 'maxui-prediction' + (i == 0 && ' selected' || '')
                         }

            // Render the conversations template and append it at the end of the rendered covnersations
            predictions = predictions + maxui.templates.predictive.render(params)

            }
        jq('#maxui-predictive ul').html(predictions)

        if (arguments.length>1) {
          var callback = arguments[1]
          callback()
        }
    }



    /*
    *    Renders the conversations list of the current user, defined in settings.username
    */
    jq.fn.printConversations = function() {
        var maxui = this
        maxui.settings.canwrite = true
        // Render the postbox UI if user has permission

        var showCT = maxui.settings.UISection == 'conversations'
        var toggleCT = maxui.settings.disableConversations == false && !showCT

        var params = {        avatar: maxui.settings.avatarURLpattern.format(maxui.settings.username),
                        allowPosting: true,
                       buttonLiteral: maxui.settings.literals.new_message_post,
                         textLiteral: maxui.settings.literals.new_conversation_text,
                            literals: maxui.settings.literals,
             showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;'
                    }
        var postbox = maxui.templates.postBox.render(params)
        var $postbox = jq('#maxui-newactivity')
        $postbox.html(postbox)



        var func_params = []
        func_params.push(maxui.settings.username)
        if (arguments.length>0)
        {
            var callback = arguments[0]
            func_params.push( function() {
                                  maxui.formatConversations(this.items, callback)

                                })
        }
        else
        {
            func_params.push( function() { maxui.formatConversations(this.items) })
        }

        var conversationsRetriever = this.maxClient.getConversationsForUser
        conversationsRetriever.apply(this.maxClient,func_params)
    }

    /*
    *
    *
    */
    jq.fn.formatConversations = function(items) {
        var maxui = this;

        // String to store the generated html pieces of each conversation item
        var conversations = ''

        // Iterate through all the conversations
        for (i=0;i<items.length;i++)
            {
            var conversation = items[i]

            var other_participants = conversation.participants.slice()
            maxui.utils.removeValueFrom(other_participants,maxui.settings.username)
            var partner = other_participants[0]
            var andmore = ''
            if (other_participants.length>1) andmore = maxui.literals.andmore
            var avatar_url = maxui.settings.avatarURLpattern.format(partner)

            var params = {
                                   id: conversation.id,
                              partner: partner,
                                 text: maxui.utils.formatText(conversation.lastMessage.content),
                             messages: conversation.messages,
                             literals: maxui.settings.literals,
                                 date: maxui.utils.formatDate(conversation.lastMessage.published, maxui.language),
                            avatarURL: avatar_url
                         }

            // Render the conversations template and append it at the end of the rendered covnersations
            conversations = conversations + maxui.templates.conversation.render(params)

            }
        if (items.length==0) conversations = '<span style="font-style:italic;color:#666;">No hi ha converses<span>'
        jq('#maxui-conversations-list .maxui-wrapper').html(conversations)

        if (arguments.length>1) {
          var callback = arguments[1]
          callback()
        }
    }

    /*
    *    Renders the messages of the choosen conversation
    */
    jq.fn.printMessages = function(conversation_hash) {
        var maxui = this
        maxui.settings.canwrite = true

        var func_params = []
        func_params.push(conversation_hash)
        if (arguments.length>1)
        {
            var callback = arguments[1]
            func_params.push( function() {
                                  maxui.formatMessages(this.items, callback)

                                })
        }
        else
        {
            func_params.push( function() { maxui.formatMessages(this.items) })
        }

        var messagesRetriever = this.maxClient.getMessagesForConversation
        messagesRetriever.apply(this.maxClient,func_params)
    }

    /*
    *
    *
    */
    jq.fn.formatMessages = function(items) {
        var maxui = this;

        // String to store the generated html pieces of each conversation item
        var messages = ''

        // Iterate through all the conversations
        for (i=0;i<items.length;i++)
            {
            var message = items[i]
            var avatar_url = maxui.settings.avatarURLpattern.format(message.actor.username)

            // Store in origin, who is the sender of the message, the authenticated user or anyone else
            origin = 'maxui-user-notme'
            if (message.actor.username==maxui.settings.username) origin = 'maxui-user-me'

            var params = {
                                   id: message.id,
                                 text: maxui.utils.formatText(message.object.content),
                                 date: maxui.utils.formatDate(message.published, maxui.language),
                               origin: origin,
                             literals: maxui.settings.literals,
                             avatarURL: avatar_url
                         }

            // Render the conversations template and append it at the end of the rendered covnersations
            messages = messages + maxui.templates.message.render(params)

            }
        jq('#maxui-messages .maxui-wrapper').html(messages)

        if (arguments.length>1) {
          var callback = arguments[1]
          callback()
        }
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
                    if (activity.actor.objectType=='person') {
                        avatar_url = maxui.settings.avatarURLpattern.format(activity.actor.username)
                      }
                    else if (activity.actor.objectType=='context') {
                        avatar_url = maxui.settings.contextAvatarURLpattern.format(activity.actor.hash)
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
                                                       actor: comment.actor,
                                                         date: maxui.utils.formatDate(comment.published,maxui.language),
                                                         text: maxui.utils.formatText(comment.content),
                                                    avatarURL: maxui.settings.avatarURLpattern.format(comment.actor.username)
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
                                  publishedIn: contexts,
                            canDeleteActivity: activity.owner == maxui.settings.username,
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
                jq('#maxui-preload .maxui-wrapper').prepend(activities)
                var ritems = jq('#maxui-preload .maxui-wrapper .maxui-activity')
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
                        jq('#maxui-preload .maxui-wrapper').html("")
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
                                       actor: comment.actor,
                                         date: maxui.utils.formatDate(comment.published, maxui.language),
                                         text: maxui.utils.formatText(comment.content),
                                    avatarURL: maxui.settings.avatarURLpattern.format(comment.actor.username)
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

        filters.sortBy = maxui.settings.activitySortOrder


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
                maxui.settings.canwrite = true

                // If we don't have a context, we're in timeline, so we can write
                if (this.context)
                {
                    // Add read context if user is not subscribed to it{
                    var subscriptions = maxui.settings.subscriptions
                    if (!subscriptions[this.context.hash])
                    {
                        subscriptions[this.context.hash]={}
                        subscriptions[this.context.hash]['permissions']={}

                        // Check only for public defaults, as any other permission would require
                        // a susbcription, that we already checked that doesn't exists
                        subscriptions[this.context.hash]['permissions']['read'] = this.context.permissions.read=='public'
                        subscriptions[this.context.hash]['permissions']['write'] = this.context.permissions.write=='public'
                    }

                    // Iterate through all the defined write contexts to check for write permissions on
                    // the current user
                    for (wc=0;wc<maxui.settings.writeContexts.length;wc++)
                        {
                            var write_context = maxui.settings.writeContextsHashes[wc]
                            if (subscriptions[write_context]['permissions'])
                            {
                              if (subscriptions[write_context]['permissions'].write==false)
                              {
                                  maxui.settings.canwrite = false
                              }
                            }
                            else { maxui.settings.canwrite = false }
                        }
                }

                // // Render the postbox UI if user has permission
                // var showCT = maxui.settings.UISection == 'conversations'
                // var toggleCT = maxui.settings.disableConversations == false && !showCT

                // var params = {        avatar: maxui.settings.avatarURLpattern.format(maxui.settings.username),
                //                 allowPosting: maxui.settings.canwrite,
                //                buttonLiteral: maxui.settings.literals.new_activity_post,
                //                  textLiteral: maxui.settings.literals.new_activity_text,
                //                     literals: maxui.settings.literals,
                //      showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;'
                //             }
                // var postbox = maxui.templates.postBox.render(params)
                // var $postbox = jq('#maxui-newactivity')
                // $postbox.html(postbox)

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
