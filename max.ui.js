(function(jq) {
    /**
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    **/
    jq.fn.maxUI = function(options) {

        // Keep a reference of the context object
        var maxui = this
        maxui.templates = max.templates()
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
                        'currentConversationSection': 'conversations',
                        'activitySortOrder': 'activities',
                        'transports': undefined,
                        'domain': undefined,
                        'maximumConversations': 20,
                        'contextTagsFilter': []
                        }

        maxui.scrollbar = {
            dragging: false,
            width: 10,
            handle: {
                height: 20
            }
        }

        // extend defaults with user-defined settings
        maxui.settings = jq.extend(defaults,options)

        // save the undotted username for stomp messages
        maxui.settings.stomp_username = maxui.settings.username.replace('.','_')

        // Check timeline/activities consistency
        if (maxui.settings.UISection == 'timeline' && maxui.settings.activitySource == 'timeline' && maxui.settings.readContext)
        {
            maxui.settings.readContext = undefined
            maxui.settings.writeContexts = []
        }

        // Extract domain out of maxserver url, if present
        // Matches several cases, but always assumes the domain is the last
        // part of the path. SO, urls with subpaths, always will be seen as a
        // domain urls, examples:
        //
        // http://max.upcnet.es  --> NO DOMAIN
        // http://max.upcnet.es/  --> NO DOMAIN
        // http://max.upcnet.es/demo  --> domain "demo"
        // http://max.upcnet.es/demo/  --> domain "demo"
        // http://max.upcnet.es/subpath/demo/  --> domain "demo"
        // http://max.upcnet.es/subpath/demo  --> domain "demo"

        server_regex = regex = /(?:^https?:\/\/)*(.*?)(?:\/([^\/]*)+)?\/?$/g;
        groups = regex.exec(maxui.settings.maxServerURL)
        if (groups[2]) {
            maxui.settings.domain = groups[2]
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

        //set default avatar and profile url pattern if user didn't provide it
        if (!maxui.settings.avatarURLpattern)
              maxui.settings['avatarURLpattern'] = maxui.settings.maxServerURL+'/people/{0}/avatar'

        if (!maxui.settings.contextAvatarURLpattern)
               maxui.settings['contextAvatarURLpattern'] = maxui.settings.maxServerURL+'/contexts/{0}/avatar'

        if (!maxui.settings.conversationAvatarURLpattern)
               maxui.settings['conversationAvatarURLpattern'] = maxui.settings.maxServerURL+'/conversations/{0}/avatar'

        // Disable profileURL by now

        // if (!maxui.settings.profileURLpattern)
        //        maxui.settings['profileURLpattern'] = maxui.settings.maxServerURL+'/profiles/{0}'

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

        // Get user data and start ui rendering when completed
        this.maxClient.getUserData(maxui.settings.username, function() {

            //Determine if user can write in writeContexts
            var userSubscriptions = {}
            if (this.subscribedTo)
            {
                if (this.subscribedTo)
                {
                    if (this.subscribedTo.length>0)
                    {
                        for (sc=0;sc<this.subscribedTo.length;sc++)
                        {
                            var subscription = this.subscribedTo[sc]
                            userSubscriptions[subscription.hash]={}
                            userSubscriptions[subscription.hash]['permissions']={}
                            for (pm=0;pm<subscription.permissions.length;pm++)
                            {
                                var permission=subscription.permissions[pm]
                                userSubscriptions[subscription.hash]['permissions'][permission]=true
                            }
                        }
                    }
                }
            }

            maxui.settings.subscriptions = userSubscriptions

            // Start socket listener

            if (!maxui.settings.disableConversations) {

                // Collect conversation ids
                maxui.conversations = []
                var talking_items = this.talkingIn || []
                for (co=0;co<talking_items.length;co++) {
                    maxui.conversations.push(talking_items[co].id)
                }

                // Stomp.js boilerplate
                ws = new SockJS(maxui.settings.maxTalkURL);
                maxui.client = Stomp.over(ws);

                 var on_connect = function(x) {
                    for (co=0;co<maxui.conversations.length;co++) {
                        conversation_id = maxui.conversations[co]
                        maxui.client.subscribe('/exchange/{0}'.format(conversation_id), function(d) {maxui.insertMessage(d)})
                    }
                    maxui.client.subscribe('/exchange/new/{0}'.format(maxui.settings.username), function(d) {
                        data = JSON.parse(d.body)
                        if (maxui.settings.UISection == 'conversations' && maxui.settings.conversationsSection == 'conversations')
                            maxui.printConversations( function() { maxui.toggleSection('conversations')
                                                                   $('.maxui-message-count:first').css({'background-color':'red'})
                                                                 })
                        maxui.client.subscribe('/exchange/{0}'.format(data.conversation), function(d) {maxui.insertMessage(d)})
                    });
                };

                var on_error =  function(error) {
                  console.log(error.body);
                };
                if (maxui.settings.enableAlerts)
                    maxui.client.debug = function(a){console.log(a);};

                maxui.client.heartbeat.outgoing = 0;
                maxui.client.heartbeat.incoming = 0;
                var stomp_user_with_domain = ""
                if (maxui.settings.domain) {
                    stomp_user_with_domain += maxui.settings.domain + ':'
                }
                stomp_user_with_domain += maxui.settings.username
                maxui.client.connect(stomp_user_with_domain, maxui.settings.oAuthToken, on_connect, on_error, '/');
            }

            // render main interface

            var showCT = maxui.settings.UISection == 'conversations'
            var showTL = maxui.settings.UISection == 'timeline'
            var toggleTL = maxui.settings.disableTimeline == false && !showTL
            var toggleCT = maxui.settings.disableConversations == false && !showCT
            var containerWidth = maxui.width() - maxui.scrollbar.width

            var params = {
                                  username: maxui.settings.username,
                                  literals: maxui.settings.literals,
                         showConversations: showCT ? 'display:block;' : 'display:none;',
                   showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;',
                              showTimeline: showTL ? 'display:block;' : 'display:none;',
                        showTimelineToggle: toggleTL ? 'display:block;' : 'display:none;',
                             messagesStyle: 'width:{0}px;left:{0}px;'.format(containerWidth)
                     }
            var mainui = maxui.templates.mainUI.render(params)
            maxui.html(mainui)
            if (maxui.settings.UISection=='conversations')
                maxui.printConversations( function() { maxui.bindEvents()
                                                       maxui.toggleSection('conversations')
                                                     })
            else if (maxui.settings.UISection=='timeline')
                maxui.printActivities({}, function() { maxui.bindEvents() })
        })

        // allow jq chaining
        return maxui;
    };


    jq.fn.insertMessage = function(d) {
        maxui = this

        data = JSON.parse(d.body)
        console.log('New message from user {0} on {1}'.format(data.username, data.conversation))
        if (maxui.settings.UISection == 'conversations' && maxui.settings.conversationsSection == 'messages') {
            maxui.printMessages(data.conversation, function() {
                maxui.scrollbar.setContentPosition(100)
            })

        }
        else if (maxui.settings.UISection == 'conversations' && maxui.settings.conversationsSection == 'conversations')
            maxui.printConversations( function() {
                maxui.toggleSection('conversations')
                $('.maxui-message-count:first').css({'background-color':'red'})
            })
    }

    jq.fn.bindEvents =function() {

        maxui = this

        maxui.scrollbar.$dragger = jq('.maxui-dragger')
        maxui.scrollbar.$bar = jq('#maxui-scrollbar')

        jq('#maxui-conversations').on('mousewheel', function(event, delta, deltaX, deltaY) {
            event.preventDefault()
            event.stopPropagation()

            if (maxui.scrollbar.enabled()) {
                var movable_height = maxui.scrollbar.$target.height() - maxui.scrollbar.maxtop - maxui.scrollbar.handle.height
                var actual_margin = parseInt(maxui.scrollbar.$target.css('margin-top'))
                var new_margin = actual_margin + (deltaY * -1 * 30)
                if (new_margin > 0) new_margin = 0
                if (new_margin < (movable_height * -1)) new_margin = movable_height * -1

                maxui.scrollbar.$target.css({'margin-top': new_margin})
                var new_margin = new_margin * -1
                var relative_pos = ( new_margin * 100 ) / movable_height
                maxui.scrollbar.setDraggerPosition(relative_pos)
            }
        })

        maxui.scrollbar.setHeight = function(height) {
            var wrapper_top = $('#maxui-conversations .maxui-wrapper').offset().top - maxui.offset().top -1
            console.log(wrapper_top)
            maxui.scrollbar.$bar.css({'height':height, 'top':wrapper_top})
            maxui.scrollbar.maxtop = height - maxui.scrollbar.handle.height -2
        }
        maxui.scrollbar.setTarget = function(selector) {
            maxui.scrollbar.$target = jq(selector)
        }
        maxui.scrollbar.setDraggerPosition = function(relative_pos) {
            margintop = (maxui.scrollbar.maxtop * relative_pos) / 100
            maxui.scrollbar.$dragger.css({'margin-top': margintop})
        }
        maxui.scrollbar.setContentPosition = function(relative_pos) {
            if (maxui.scrollbar.enabled()) {
                var movable_height = maxui.scrollbar.$target.height() - maxui.scrollbar.maxtop - maxui.scrollbar.handle.height
                var margintop = (movable_height * relative_pos) / 100
                maxui.scrollbar.$target.css({'margin-top': margintop * -1})
                maxui.scrollbar.setDraggerPosition(relative_pos)
            } else {
                maxui.scrollbar.$target.css({'margin-top': ''})
                maxui.scrollbar.setDraggerPosition(0)
            }
        }
        maxui.scrollbar.enabled = function() {
            return maxui.scrollbar.$target.height() > maxui.scrollbar.maxtop
        }

        jq(document).on('mousemove' ,function(event) {

            if (maxui.scrollbar.dragging) {
                event.stopPropagation()
                event.preventDefault()

                // drag only if target content is taller than scrollbar
                if (maxui.scrollbar.enabled()) {

                    // Calculate dragger position, constrained to actual limits
                    var margintop = event.clientY - maxui.scrollbar.$bar.offset().top
                    if (margintop < 0) margintop = 0
                    if (margintop >= maxui.scrollbar.maxtop) margintop = maxui.scrollbar.maxtop

                    // Calculate dragger position relative to 100 and move content
                    var relative_position = (margintop * 100) / maxui.scrollbar.maxtop
                    maxui.scrollbar.setContentPosition(relative_position)
                }
            }
        })

        jq(document.body).on('mousedown', '.maxui-dragger', function(event) {
            event.stopPropagation()
            event.preventDefault()
            maxui.scrollbar.dragging = true
        })

        jq(document).on('mouseup', function(event) {
            maxui.scrollbar.dragging = false
        })


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

        //Assign Username and avatar clicking via delegating the click to the activities container
        jq('#maxui-search').on('click','#maxui-favorites-filter',function (event) {
            event.preventDefault()
            var favoritesButton = jq(event.currentTarget)
            var filterFavorites = !favoritesButton.hasClass('active')
            if (filterFavorites) {
                maxui.addFilter({type:'favorites', value:true, visible:false})
            } else {
                maxui.delFilter({type:'favorites', value:true})
            }
            favoritesButton.toggleClass('active', filterFavorites)
            })

        //Assign hashtag filtering via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-hashtag',function (event) {
            event.preventDefault()
            maxui.addFilter({type:'hashtag', value:jq(this).attr('value')})
            jq('#maxui-search').toggleClass('folded',false)
            })

        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-search-filters').on('click','.maxui-close',function (event) {
            event.preventDefault()
            var filter = jq(this.parentNode.parentNode)
            maxui.delFilter({type:filter.attr('type'), value:filter.attr('value')})
            })

        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-new-participants').on('click','.maxui-close',function (event) {
            event.preventDefault()
            var filter = jq(this.parentNode.parentNode)
            maxui.delPerson({username:filter.attr('username')})
            })

        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-new-displayName').on('keyup','input',function (event) {
            event.preventDefault()
            maxui.reloadPersons()

            })

        //Assign user mention suggestion to textarea by click
        jq('#maxui-newactivity').on('click','.maxui-prediction',function (event) {
            event.preventDefault()

            var $selected = jq(this)
            var $area = jq('#maxui-newactivity-box textarea')
            var $predictive = jq('#maxui-newactivity #maxui-predictive')
            var text = $area.val()

            var matchMention = new RegExp('^\\s*@([\\w\\.]+)')
            var match = text.match(matchMention)
            var replacement = text.replace(matchMention, '@'+$selected.text()+' ')
            $predictive.hide()
            $area.val(replacement)
            $area.focus()
            })

       //Assign user mention suggestion to input by click
        jq('#maxui-conversation-predictive').on('click','.maxui-prediction',function (event) {
            event.preventDefault()

            var $selected = jq(this)
            var $area = jq('#maxui-add-people-box .maxui-text-input')
            var $predictive = jq('#maxui-conversations #maxui-predictive')
            var text = $area.val()

            var matchMention = new RegExp('^\\s*([\\w\\.]+)\s*')
            var match = text.match(matchMention)
            var replacement = text.replace(matchMention, $selected.text())

            maxui.addPerson({'username': replacement})
            $predictive.hide()
            $area.val('').focus()
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
            var conversation_displayName = jq(event.target).closest('.maxui-conversation').attr('data-displayname')
            maxui.settings.currentConversation = {'hash': conversation_hash, 'displayName': conversation_displayName}
            maxui.printMessages(conversation_hash, function() { maxui.toggleMessages('messages') })
            })

        //Toggle favorite status via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-action.maxui-favorites',function (event) {
            event.preventDefault()
            var $favorites = jq(this)
            var $activity = jq(this).closest('.maxui-activity')
            var activityid = $activity.attr('id')
            var favorited = $favorites.hasClass('maxui-favorited')
            var $span = $favorites.find('span')

            if (favorited) {
                maxui.maxClient.unfavoriteActivity(activityid, function(event) {
                    $favorites.toggleClass('maxui-favorited', false)
                    $span.text(maxui.settings.literals.favorite)
                })
            } else {
                maxui.maxClient.favoriteActivity(activityid, function(event) {
                    $favorites.toggleClass('maxui-favorited', true)
                    $span.text(maxui.settings.literals.unfavorite)
                })

            }
        })

        //Toggle like status via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-action.maxui-likes',function (event) {
            event.preventDefault()
            var $likes = jq(this)
            var $activity = jq(this).closest('.maxui-activity')
            var activityid = $activity.attr('id')
            var liked = $likes.hasClass('maxui-liked')
            var $span = $likes.find('span')

            if (liked) {
                maxui.maxClient.unlikeActivity(activityid, function(event) {
                    $likes.toggleClass('maxui-liked', false)
                    $span.text(maxui.settings.literals.like)
                })
            } else {
                maxui.maxClient.likeActivity(activityid, function(event) {
                    $likes.toggleClass('maxui-liked', true)
                    $span.text(maxui.settings.literals.unlike)
                })
            }
        })

        //Assign activity removal confirmation dialog toggle via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-action.maxui-delete',function (event) {
            console.log('delete')
            event.preventDefault()
            var $activity = jq(this).closest('.maxui-activity')
            var $dialog = $activity.find('.maxui-actions > .maxui-popover')

            if (!$dialog.is(':visible')) {
                jq('.maxui-popover').css({opacity:0}).hide()
                $dialog.show()
                $dialog.animate({opacity:1}, 300)
            } else {
                $dialog.animate({opacity:0}, 300)
                jq('.maxui-popover').css({opacity:0}).hide()
            }
        })

        //Assign activity removal confirmation dialog via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-actions .maxui-button.cancel',function (event) {
            event.preventDefault()
            var $activity = jq(this).closest('.maxui-activity')
            // Hide all visible dialogs
            $popover = jq('.maxui-popover:visible').css({opacity:0})
            $popover.hide()
        })

        //Assign activity removal via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-actions .maxui-button.delete',function (event) {
            console.log('delete activityid')
            event.preventDefault()
            var $activity = jq(this).closest('.maxui-activity')
            var activityid = $activity.attr('id')
            maxui.maxClient.removeActivity(activityid, function(event) {
                var $popover =jq('.maxui-popover:visible').animate({opacity:0}, 300)
                $activity.css({height:$activity.height(), 'min-height':'auto'})
                $activity.animate({height: 0, opacity:0}, 100, function(event) {
                    $activity.remove()
                    $popover.hide()

                })
            })

        })

        //Assign activity comment removal confirmation dialog toggle via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-delete-comment',function (event) {
            event.preventDefault()
            var $comment = jq(this).closest('.maxui-comment')
            var $dialog = $comment.find('.maxui-popover')

            if (!$dialog.is(':visible')) {
                jq('.maxui-popover').css({opacity:0}).hide()
                $dialog.show()
                $dialog.animate({opacity:1}, 300)
            } else {
               $dialog.animate({opacity:0}, 300)
               jq('.maxui-popover').css({opacity:0}).hide()
            }
        })

        //Assign activity comment removal confirmation dialog via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-comment .maxui-button.cancel',function (event) {
            event.preventDefault()
            var $comment = jq(this).closest('.maxui-comment')
            var $dialog = $comment.find('.maxui-popover')

            $popover = jq('.maxui-popover').css({opacity:0})
            $popover.hide()
        })


        //Assign activity comment removal via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-comment .maxui-button.delete',function (event) {
            console.log('delete comment')
            event.preventDefault()
            var $comment = jq(this).closest('.maxui-comment')
            var $activity = $comment.closest('.maxui-activity')
            var activityid = $activity.attr('id')
            var commentid = $comment.attr('id')
            maxui.maxClient.removeActivityComment(activityid, commentid, function() {
                var $popover =jq('.maxui-popover').animate({opacity:0}, 300)
                $comment.css({height:$activity.height(), 'min-height':'auto'})
                $comment.animate({height: 0, opacity:0}, 100, function(event) {
                    $comment.remove()
                    $popover.hide()
                })
            })

        })


        jq('#maxui-timeline').on('click', '.maxui-sort-action.maxui-most-recent a', function (event) {
            event.preventDefault()
            $sortbutton = jq(this).closest('.maxui-sort-action')
            if (!$sortbutton.hasClass('active')) {
                jq('#maxui-activity-sort .maxui-sort-action.active').toggleClass('active', false)
                $sortbutton.toggleClass('active', true)
                maxui.printActivities({})
            }

        })

        jq('#maxui-timeline').on('click', '.maxui-sort-action.maxui-most-valued a', function (event) {
            event.preventDefault()
            $sortbutton = jq(this).closest('.maxui-sort-action')
            if (!$sortbutton.hasClass('active')) {
                jq('#maxui-activity-sort .maxui-sort-action.active').toggleClass('active', false)
                $sortbutton.toggleClass('active', true)
                maxui.printActivities({sortBy: 'likes'})
            }

        })
// **************************************************************************************
//                    add people predicting
// **************************************************************************************
        var selector = '.maxui-text-input'
        jq('#maxui-add-people-box')
        .on('focusin',selector, function(event) {
                  event.preventDefault()
                  var text = jq(this).val()
                  var literal = jq(this).attr('data-literal')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized==literal )
                      jq(this).val('')
        })

         .on('keydown', selector, function(event) {
           if ( jq('#maxui-conversation-predictive:visible').length>0 &&  (event.which==40 || event.which==38 || event.which==13 || event.which==9)) {
              maxui.utils.freezeEvent(event)
           }
         })

        .on('keyup',selector, function(event) {
                  event.preventDefault()
                  event.stopPropagation()
                  var text = jq(this).val()
                  var normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if (normalized=='')
                  {   jq(this).attr('class','maxui-empty maxui-text-input')
                      jq(this).removeAttr('title')
                  }
                  else
                  {   if (maxui.settings.canwrite) {
                          jq(this).attr('class','maxui-text-input')
                      }
                  }
                  var key = event.which
                  var matchMention = new RegExp('^\\s*([\\w\\.]+)\\s*')
                  var match = text.match(matchMention)

                  var matchMentionEOL = new RegExp('^\\s*([\\w\\.]+)\\s*$')
                  var matchEOL = text.match(matchMentionEOL)

                  var $selected = jq('#maxui-conversation-predictive .maxui-prediction.selected')
                  var $area = jq(this)
                  var $predictive = jq('#maxui-conversation-predictive')
                  var num_predictions = $predictive.find('.maxui-prediction').length
                  var is_predicting = jq('#maxui-conversation-predictive:visible').length>0

                  // Up & down
                  if (key==40 && is_predicting && num_predictions>1) {
                    var $next = $selected.next()
                    $selected.removeClass('selected')
                    if ($next.length>0) $next.addClass('selected')
                    else {$selected.siblings(':first').addClass('selected')}
                  }
                  else if (key==38 && is_predicting && num_predictions>1) {
                    var $prev = $selected.prev()
                    $selected.removeClass('selected')
                    if ($prev.length>0) $prev.addClass('selected')
                    else {$selected.siblings(':last').addClass('selected')}
                  }
                  else if (key==27) {
                    $predictive.hide()
                  }
                  else if ((key==13 || key==9) && is_predicting) {
                    console.log('intro')
                    var matchMention2 = new RegExp('^\\s*([\\w\\.]+\\s*)')
                    var replacement = text.replace(matchMention2, $selected.text())
                    console.log(replacement)
                    maxui.addPerson({'username': replacement})
                    $predictive.hide()
                    $area.val('').focus()
                  }

                  else //1
                  {
                      if (maxui.settings.conversationsSection=='conversations') {
                          if (match) {
                              $area.attr('class','maxui-text-input')
                              if (matchEOL) {
                                  $predictive.show()
                                  $predictive.html('<ul></ul>')
                                  maxui.printPredictions(match[1], '#maxui-conversation-predictive')
                              }
                          }

                          else {
                              $predictive.hide()
                              $area.attr('class','maxui-empty maxui-text-input')
                              if (!text.match(RegExp('^\\s*@')) ) {
                                  $area.attr('class','maxui-text-input error')
                                  $area.attr('title', maxui.settings.literals.post_permission_not_here)
                              }
                          }
                      }
                 } //1


        })

        .on('focusout',selector, function(event) {
                  event.preventDefault()
                  var text = jq(this).val()
                  var literal = jq(this).attr('data-literal')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized=='' )
                      jq(this).val(literal)
        })


// **************************************************************************************



        //Assign Activity post action And textarea behaviour
        maxui.bindActionBehaviour('#maxui-newactivity','#maxui-newactivity-box', {}, function(text)
                {

                if (maxui.settings.UISection=='timeline') {
                    maxui.sendActivity(text)
                    jq('#maxui-search').toggleClass('folded',true)
                }

                else if (maxui.settings.UISection=='conversations') {
                    if (maxui.settings.conversationsSection=='conversations') {

                        var participants_box = $('#maxui-new-participants')[0]
                        var participants = []
                        for (i=0;i<participants_box.people.length;i++)
                            participants.push(participants_box.people[i].username)
                        var message = jq('#maxui-newactivity textarea').val()

                        var options = {
                            participants: participants,
                            message: message
                        }

                        if (participants.length>1) {
                            var displayName = jq('#maxui-add-people-box #maxui-new-displayName input').val()
                            options.displayName = displayName
                        }
                        maxui.createConversationAndSendMessage(options, function() {
                            participants_box.people = []
                            maxui.reloadPersons()
                        })
                    }
                    else {
                      maxui.sendMessage(text, maxui.settings.currentConversation.hash)

                    }

                }


                },
                function(text, area, button, ev) {

                  var key = ev.which
                  var matchMention = new RegExp('^\\s*@([\\w\\.]+)\s*')
                  var match = text.match(matchMention)

                  var matchMentionEOL = new RegExp('^\\s*@([\\w\\.]+)\s*$')
                  var matchEOL = text.match(matchMentionEOL)

                  var $selected = jq('#maxui-newactivity .maxui-prediction.selected')
                  var $area = jq(area)
                  var $predictive = jq('#maxui-newactivity #maxui-predictive')
                  var num_predictions = $predictive.find('.maxui-prediction').length
                  var is_predicting = jq('#maxui-newactivity #maxui-predictive:visible').length>0

                  // Up & down
                  if (key==40 && is_predicting && num_predictions>1) {
                    var $next = $selected.next()
                    $selected.removeClass('selected')
                    if ($next.length>0) $next.addClass('selected')
                    else {$selected.siblings(':first').addClass('selected')}
                  }
                  else if (key==38 && is_predicting && num_predictions>1) {
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
                                  $predictive.show()
                                  $predictive.html('<ul></ul>')
                                  maxui.printPredictions(match[1], '#maxui-newactivity #maxui-predictive')
                              }
                              jq(button).removeAttr('disabled')
                              jq(button).attr('class','maxui-button')
                              $area.attr('class','maxui-text-input')


                          }
                          else {
                              jq(button).val(maxui.settings.literals.new_activity_post)
                              $predictive.hide()
                              if (!text.match(RegExp('^\\s*@')) && !maxui.settings.canwrite) {
                                  $area.attr('class','maxui-text-input error')
                                  $area.attr('title', maxui.settings.literals.post_permission_unauthorized)
                              }                          }
                      }

                      else if (maxui.settings.UISection=='conversations') {

                          if (maxui.settings.conversationsSection=='conversations') {
                            maxui.reloadPersons()
                          }
                          else if (maxui.settings.conversationsSection=='messages') {
                              $predictive.hide()
                              jq(button).removeAttr('disabled')
                              jq(button).attr('class','maxui-button')
                              $area.attr('class','maxui-text-input')
                          }


                      } //elseif

                  } //1
                }) //function



        //Assign Commentbox send comment action And textarea behaviour
        maxui.bindActionBehaviour('#maxui-activities', '.maxui-newcommentbox', {}, function(text)
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
        maxui.bindActionBehaviour('#maxui-search','#maxui-search-box', {}, function(text)
               {
                console.log('behaviour')
               maxui.textSearch(text)
               jq('#maxui-search').toggleClass('folded',false)
               jq('#maxui-search-text').val('')
               })
        // // Execute search if <enter> pressed
        // jq('#maxui-search .maxui-text-input').keyup(function(e) {
        //           if (e.keyCode == 13) {
        //             console.log('enter')
        //              maxui.textSearch(jq(this).attr('value'))
        //              jq('#maxui-search').toggleClass('folded',false)
        //           }
        // });
    }

    /**
    *    Takes a  button-input pair identified by 'maxui-button' and 'maxui-text-input'
    *    classes respectively, contained in a container and applies focusin/out
    *    and clicking behaviour
    *
    *    @param {String} delegate         CSS selector identifying the parent container on which to delegate events
    *    @param {String} target           CSS selector identifying the direct container on which execute events
    *    @param {object} options          Extra options, currently ignore-button, to avoid button updates
    *    @param {Function} clickFunction  Function to execute when click on the button
    **/
    jq.fn.bindActionBehaviour = function(delegate, target, options, clickFunction) {

        // Clear input when focusing in only if user hasn't typed anything yet
        var maxui = this
        var selector = target+' .maxui-text-input'
        if (arguments.length>4) { var extra_bind = arguments[4] }
        else { var extra_bind = null }
        jq(delegate)

        .on('focusin',selector, function(event) {
                  event.preventDefault()
                  var text = jq(this).val()
                  var literal = jq(this).attr('data-literal')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized==literal )
                      jq(this).val('')
        })

         .on('keydown', selector, function(event) {
           if ( jq(delegate + ' #maxui-predictive:visible').length>0 &&  (event.which==40 || event.which==38 || event.which==13 || event.which==9)) {
              maxui.utils.freezeEvent(event)
           } else if(event.which==13 && event.shiftKey==false && !options.ignore_button) {
                event.preventDefault()
                var $area = jq(this).parent().find('.maxui-text-input')
                var literal = $area.attr('data-literal')
                var text = $area.val()
                var normalized = maxui.utils.normalizeWhiteSpace(text,false)

                if (normalized!=literal & normalized!='')
                    clickFunction.apply(this,[text])

           }


         })

        .on('keyup',selector, function(event) {
                  event.preventDefault()
                  event.stopPropagation()
                  var text = jq(this).val()
                  var button = jq(this).parent().find('.maxui-button')
                  var normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if (normalized=='' && !options.ignore_button)
                  {   jq(button).attr('disabled', 'disabled')
                      jq(button).attr('class','maxui-button maxui-disabled')
                      jq(this).attr('class','maxui-empty maxui-text-input')
                      jq(this).removeAttr('title')
                  }
                  else
                  {   if (maxui.settings.canwrite && !options.ignore_button) {
                          jq(button).removeAttr('disabled')
                          jq(button).attr('class','maxui-button')
                          jq(this).attr('class','maxui-text-input')
                      }
                  }

                  if (extra_bind!=null) {
                    extra_bind(text, this, button, event)
                  }


        })

        .on('focusout',selector, function(event) {
                  event.preventDefault()
                  var text = jq(this).val()
                  var literal = jq(this).attr('data-literal')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized=='' )
                      jq(this).val(literal)
        })

        .on('click',target+' .maxui-button',function (event) {
            event.preventDefault()
            var $area = jq(this).parent().find('.maxui-text-input')
            var literal = $area.attr('data-literal')
            var text = $area.val()
            var normalized = maxui.utils.normalizeWhiteSpace(text,false)

            if ((normalized!=literal & normalized!='') || options.empty_click)
                clickFunction.apply(this,[text])
            })

    }

    /**
    *    Updates the search filters with a new collection of keywords/hashtags extracted of
    *    a user-entered text, and reloads the search query. Identifies special characters
    *    at the first position of each keyword to identify keyword type
    *
    *    @param {String} text    A string containing whitespace-separated keywords/#hashtags
    **/
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


    /**
    *    Reloads the current filters UI and executes the search, optionally starting
    *    at a given point of the timeline
    *
    *    @param {String} (optional)    A string containing the id of the last activity loaded
    **/
    jq.fn.reloadFilters = function() {

        var maxui=this
        var params = {filters:maxui.filters}
        var activity_items = maxui.templates.filters.render(params)
        jq('#maxui-search-filters').html(activity_items)
        var filters = {}
        // group filters
        enableSearchToggle = false
        for (f=0;f<params.filters.length;f++) {
            var filter = params.filters[f]

            // Enable toggle button only if there's at least one visible filter
            if (filter.visible) {
                enableSearchToggle = true
            }
            if (!filters[filter.type]) {
                filters[filter.type]=[]
            }
            filters[filter.type].push(filter.value)
        }

        // Accept a optional parameter indicating search start point
        if (arguments.length>0)
            filters['before'] = arguments[0]

        maxui.printActivities(filters)

        //Enable or disable filter toogle if there are visible filters defined (or not)
        if (enableSearchToggle) {
            jq('#maxui-search-toggle').toggleClass('maxui-disabled', maxui.filters.length==0)
            jq('#maxui-search').toggleClass('folded',maxui.filters.length==0)
        }
   }


    /**
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    **/
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

    /**
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    **/
    jq.fn.addFilter = function(filter) {
        maxui = this
        var reload=true
        //Reload or not by func argument
        if (arguments.length>1)
            reload=arguments[1]

        if (!maxui.filters)
            { maxui.filters = []}


        // show filters bu default unless explicitly specified on filter argument
        if (!filter.hasOwnProperty('visible')) {
            filter.visible = true
        }

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

    /**
    *    Reloads the current filters UI and executes the search, optionally starting
    *    at a given point of the timeline
    *
    *    @param {String} (optional)    A string containing the id of the last activity loaded
    **/
    jq.fn.reloadPersons = function() {

        var maxui=this
        $participants_box = jq('#maxui-new-participants')
        participants_box = $participants_box[0]
        if (!participants_box.people) {
            participants_box.people = []
        }
        $button = jq('#maxui-newactivity input.maxui-button')

        $newmessagebox = jq('#maxui-newactivity')
        var message = $newmessagebox.find('textarea').val()
        var placeholder = $newmessagebox.find('textarea').attr('data-literal')
        message = maxui.utils.normalizeWhiteSpace(message)

        $newdisplaynamebox = jq('#maxui-add-people-box #maxui-new-displayName')
        var displayName = $newdisplaynamebox.find('input').val()
        displayName = maxui.utils.normalizeWhiteSpace(displayName)

        var params = {persons:participants_box.people}
        var participants_items = maxui.templates.participants.render(params)
        jq('#maxui-new-participants').html(participants_items)


        jq('#maxui-add-people-box .maxui-label .maxui-count').text('({0}/{1})'.format(participants_box.people.length + 1,maxui.settings.maximumConversations))

        if (participants_box.people.length>0) {
            if ((participants_box.people.length==1 || displayName!='') && message!='' && message!=placeholder) {
                $button.removeAttr('disabled')
                $button.attr('class','maxui-button')
                $newmessagebox.find('textarea').attr('class','maxui-text-input')
            } else {
                $button.attr('disabled', 'disabled')
                $button.attr('class','maxui-button maxui-disabled')
                if (displayName=='') {
                    $newmessagebox.find('textarea').attr('class','maxui-text-input error')
                    $newmessagebox.find('textarea').attr('title', maxui.settings.literals.post_permission_missing_displayName)
                }
            }

            $participants_box.show()
            $newmessagebox.show()
            if (participants_box.people.length>1) {
                $newdisplaynamebox.show()
            } else {
                $newdisplaynamebox.hide()
                $newdisplaynamebox.find('.maxui-text-input').val('')
            }

        } else {
            $button.attr('disabled', 'disabled')
            $button.attr('class','maxui-button maxui-disabled')
            $participants_box.hide()
            $newmessagebox.find('textarea').attr('class','maxui-text-input error')
            $newmessagebox.find('textarea').attr('title', maxui.settings.literals.post_permission_not_enough_participants)

            $newdisplaynamebox.hide()
            $newdisplaynamebox.find('.maxui-text-input').val('')
        }
   }

    /**
    *    Removes a person from the list of new conversation
    *    @param {String} person    A String representing a user's username
    **/
    jq.fn.delPerson = function(person) {
        maxui = this
        var deleted = false
        var index = -1
        participants_box = $('#maxui-new-participants')[0]
        for (i=0;i<participants_box.people.length;i++)
             if (participants_box.people[i].username == person.username)
              {
                 deleted = true
                 participants_box.people.splice(i,1)
              }
        if (deleted)
            this.reloadPersons()
    }

    /**
    *    Adds a new person to the list of new conversation
    *    @param {String} person    A String representing a user's username
    **/
    jq.fn.addPerson = function(person) {
        maxui = this
        participants_box = $('#maxui-new-participants')[0]
        var reload=true
        //Reload or not by func argument
        if (arguments.length>1)
            reload=arguments[1]

        var already_filtered = false

        if (!participants_box.people)
            { participants_box.people = []}

        if (person.username != maxui.settings.username && participants_box.people.length < (maxui.settings.maximumConversations -1) ) {
            for (i=0;i<participants_box.people.length;i++)
                 if (participants_box.people[i].username == person.username)
                     already_filtered = true

             if (!already_filtered)
             {
                participants_box.people.push(person)
                if(reload==true)
                    this.reloadPersons()
             }
        }
    }

    /**
    *    Toggles between Conversations and Messages
    **/
    jq.fn.toggleMessages = function(sectionToEnable) {
        maxui = this

        var $conversations = jq('#maxui-conversations')
        var $conversations_list = jq('#maxui-conversations-list')
        var $conversations_wrapper = $conversations.find('.maxui-wrapper')
        var $messages = jq('#maxui-messages')
        var $message_list = jq('#maxui-message-list')
        var $postbox = jq('#maxui-newactivity-box textarea')
        var $common_header = $conversations.find('#maxui-common-header')
        var $addpeople = jq('#maxui-add-people-box')

        var widgetWidth = maxui.width() // Real width of the widget, without the two 1-pixel borders
        var sectionHorizontalPadding = 20
        var widgetBorder = 2
        var widgetScrollbar = maxui.scrollbar.width
        var sectionsWidth = widgetWidth - widgetScrollbar - widgetBorder
        var height = 320


        if (sectionToEnable=='messages' && sectionToEnable!=maxui.settings.conversationsSection)
        {
            $addpeople.animate({'height': 0, 'padding-top':0, 'padding-bottom':0}, 400, function(event) {
                $addpeople.css({'border-color': 'transparent'})
            })
            $common_header.find('h3').text(maxui.settings.currentConversation.displayName)
            $conversations_list.animate({'margin-left':sectionsWidth * (-1) }, 400)
            $messages.animate({'left':0, 'margin-left':0}, 400, function(event) {
                $conversations_wrapper.height(height - 31 - 45)
                $common_header.animate({'height':45}, 100, function(event) {
                    maxui.scrollbar.setHeight(height-31-45)
                    maxui.scrollbar.setTarget('#maxui-conversations #maxui-messages')
                    maxui.scrollbar.setContentPosition(100)
                })
            })
            $messages.width(sectionsWidth)
            maxui.settings.conversationsSection='messages'
            var literal = maxui.settings.literals.new_activity_text
            $postbox.val(literal).attr('data-literal', literal)

        }
        if (sectionToEnable=='conversations' && sectionToEnable!=maxui.settings.conversationsSection) {
            $common_header.animate({'height':0}, 100, function(event) {
                $addpeople.css({'border-color': '#ccc'})
                maxui.scrollbar.setHeight(height-31)
                maxui.scrollbar.setTarget('#maxui-conversations #maxui-conversations-list')
                maxui.scrollbar.setContentPosition(0)
                $addpeople.animate({'height': 19, 'padding-top':6, 'padding-bottom':6}, 400, function(event) {
                    $addpeople.removeAttr('style')
                })
            })
            $conversations_wrapper.height(height - 31)
            var widgetWidth = $conversations_list.width()+11 // +2 To include border
            $conversations_list.animate({'margin-left':0 }, 400)
            $messages.animate({'left':widgetWidth + 20 }, 400)
            maxui.settings.conversationsSection='conversations'
            var literal = maxui.settings.literals.new_conversation_text
            $postbox.val(literal).attr('data-literal', literal)
        }
    }


    /**
    *    Toggles between main sections
    **/
    jq.fn.toggleSection = function(sectionToEnable) {
        maxui = this
        var $search = jq('#maxui-search')
        var $timeline = jq('#maxui-timeline')
        var $timeline_wrapper = jq('#maxui-timeline .maxui-wrapper')
        var $conversations = jq('#maxui-conversations')
        var $common_header = $conversations.find('#maxui-common-header')
        var $back_conversations = $conversations.find('#maxui-back-conversations')
        var $conversations_user_input = $conversations.find('input#add-user-input')
        var $conversations_list = jq('#maxui-conversations #maxui-conversations-list')
        var $conversations_wrapper = jq('#maxui-conversations .maxui-wrapper')
        var $postbutton = jq('#maxui-newactivity-box .maxui-button')
        var $conversationsbutton = jq('#maxui-show-conversations')
        var $timelinebutton = jq('#maxui-show-timeline')
        var $addpeople = jq('#maxui-add-people-box')

        var widgetWidth = maxui.width() // Real width of the widget, without the two 1-pixel borders
        var sectionPadding = 10
        var widgetBorder = 1
        var sectionsWidth = widgetWidth - maxui.scrollbar.width - (sectionPadding * 2) - (widgetBorder * 2)
        var height = 320

        if (sectionToEnable=='conversations' && maxui.settings.currentConversationSection=='conversations')
        {

          //$conversations.width($conversations.width())
          //$conversations_list.width($conversations.width())
          var height = 320
          $conversations.show()
          $addpeople.show()

          $common_header.animate({'height':0}, 400)
          $conversations_user_input.focus()
          $conversations.animate({'height':height-31}, 400, function(event) {
            $conversations_wrapper.height(height - 31)
          })
          $conversations_list.width(sectionsWidth)
          $timeline.animate({'height':0}, 400)
          $search.hide(400)
          maxui.settings.UISection='conversations'
          $postbutton.val(maxui.settings.literals.new_message_post)
          $conversationsbutton.hide()
          if (!maxui.settings.disableTimeline) $timelinebutton.show()
          maxui.scrollbar.setHeight(height-31)
          maxui.scrollbar.setTarget('#maxui-conversations #maxui-conversations-list')
        }
        if (sectionToEnable=='timeline')
        {
          $timeline.show()
          var timeline_height = $timeline_wrapper.height()
          $timeline.animate({'height':timeline_height}, 400, function(event) {
              $timeline.css('height','')
          })
          $conversations.animate({'height':0}, 400, function(event) {
              $conversations.hide()
              $addpeople.hide()
          })
          $search.show(400)
          //maxui.settings.currentConversationSection=='conversations'
          maxui.settings.UISection='timeline'
          $postbutton.val(maxui.settings.literals.new_activity_post)
          if (!maxui.settings.disableConversations) $conversationsbutton.show()
          $timelinebutton.hide()

        }

        }


    /**
    *    Returns the current settings of the plugin
    **/
    jq.fn.Settings = function() {
        maxui = this
        return maxui.settings
        }


    /**
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    **/
    jq.fn.createConversationAndSendMessage = function (options, post_creation) {
        maxui = this
        var func_params = []

        options.participants.push(maxui.settings.username)
        func_params.push(options)

        if (maxui.settings.UISection=='conversations') {
            func_params.push( function() {
                            post_creation()
                            var chash = this.contexts[0].id
                            var activityid = this.id

                            maxui.settings.currentConversation = {hash: chash}
                            if (options.displayName) {
                                maxui.settings.currentConversation.displayName = options.displayName
                            } else {
                                maxui.settings.currentConversation.displayName = options.participants[0].displayName
                            }

                            maxui.printMessages(chash, function() {
                                   maxui.toggleMessages('messages')
                                   id = maxui.client.subscribe('/exchange/{0}'.format(chash), function(d) {maxui.insertMessage(d)})
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

    /**
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    **/
    jq.fn.sendMessage = function (text, chash) {
        maxui = this
        var func_params = []
        func_params.push(text)
        func_params.push(chash)
        func_params.push( function() {
                            jq('#maxui-newactivity textarea').val('')
                            jq('#maxui-newactivity .maxui-button').attr('disabled','disabled')
                            maxui.printMessages(chash, function() {maxui.toggleMessages('messages')})
                            // var activityid = this.id
                            // maxui.io.emit('talk', { conversation: chash, timestamp: maxui.utils.timestamp(), messageID: activityid } )

                           })

        var messageAdder = maxui.maxClient.addMessage
        messageAdder.apply(maxui.maxClient, func_params)

    }

    /**
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    **/
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

    /**
    *    Loads more activities from max posted earlier than
    *    the oldest loaded activity
    **/
    jq.fn.loadMoreActivities = function () {
        maxui=this
        filter = {before:jq('.maxui-activity:last').attr('id')}
        maxui.printActivities(filter)

    }


    /**
    *    Renders the conversations list of the current user, defined in settings.username
    **/
    jq.fn.printPredictions = function(query, predictive_selector) {
        var maxui = this

        var func_params = []
        func_params.push(query)
        func_params.push( function() { maxui.formatPredictions(this, predictive_selector) })

        var userListRetriever = this.maxClient.getUsersList
        userListRetriever.apply(this.maxClient,func_params)
    }

    /**
    *
    *
    **/
    jq.fn.formatPredictions = function(items, predictive_selector) {
        var maxui = this;

        // String to store the generated html pieces of each conversation item
        var predictions = ''

        // Iterate through all the conversations
        for (i=0;i<items.length;i++)
            {
            var prediction = items[i]
            if (prediction.username != maxui.username)
                {
                var avatar_url = maxui.settings.avatarURLpattern.format(prediction.username)
                var params = {
                                   username: prediction.username,
                                  avatarURL: avatar_url,
                                   cssclass: 'maxui-prediction' + (i == 0 && ' selected' || '')
                             }

                // Render the conversations template and append it at the end of the rendered covnersations
                predictions = predictions + maxui.templates.predictive.render(params)
                }
            }
        jq(predictive_selector + ' ul').html(predictions)

        if (arguments.length>2) {
          var callback = arguments[2]
          callback()
        }
    }



    /**
    *    Renders the conversations list of the current user, defined in settings.username
    **/
    jq.fn.printConversations = function() {
        var maxui = this
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
                                  maxui.formatConversations(this, callback)

                                })
        }
        else
        {
            func_params.push( function() { maxui.formatConversations(this) })
        }

        var conversationsRetriever = this.maxClient.getConversationsForUser
        conversationsRetriever.apply(this.maxClient,func_params)
    }

    /**
    *
    *
    **/
    jq.fn.formatConversations = function(items) {
        var maxui = this;

        // String to store the generated html pieces of each conversation item
        var conversations = ''

        // Iterate through all the conversations
        for (i=0;i<items.length;i++)
            {
            var conversation = items[i]

            if (conversation.participants.length <= 2) {
                if (conversation.participants[0].username == maxui.settings.username) {
                    var partner = conversation.participants[1] }
                else {
                    var partner = conversation.participants[0]
                }

                var avatar_url = maxui.settings.avatarURLpattern.format(partner.username)
            } else {
                var avatar_url = maxui.settings.conversationAvatarURLpattern.format(conversation.id)
            }
                var displayName = conversation.displayName

            var params = {
                                   id: conversation.id,
                          displayName: displayName,
                                 text: maxui.utils.formatText(conversation.lastMessage.content),
                             messages: conversation.messages,
                             literals: maxui.settings.literals,
                                 date: maxui.utils.formatDate(conversation.lastMessage.published, maxui.language),
                            avatarURL: avatar_url
                         }

            // Render the conversations template and append it at the end of the rendered covnersations
            conversations = conversations + maxui.templates.conversation.render(params)

            }
        if (items.length>0) {
            jq('#maxui-conversations-list').html(conversations)
        }

        if (arguments.length>1) {
          var callback = arguments[1]
          callback()
        }
    }

    /**
    *    Renders the messages of the choosen conversation
    **/
    jq.fn.printMessages = function(conversation_hash) {
        var maxui = this

        var func_params = []
        func_params.push(conversation_hash)
        if (arguments.length>1)
        {
            var callback = arguments[1]
            func_params.push( function() {
                                  maxui.formatMessages(this, callback)

                                })
        }
        else
        {
            func_params.push( function() { maxui.formatMessages(this) })
        }

        var messagesRetriever = this.maxClient.getMessagesForConversation
        messagesRetriever.apply(this.maxClient,func_params)
    }

    /**
    *
    *
    **/
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
        jq('#maxui-messages #maxui-message-list').html(messages)

        if (arguments.length>1) {
          var callback = arguments[1]
          callback()
        }
    }

    /**
    *    Renders the N activities passed in items on the timeline slot. This function is
    *    meant to be called as a callback of a call to a max webservice returning a list
    *    of activity objects
    *
    *    @param {String} items     a list of objects representing activities, returned by max
    *    @param {String} insertAt  were to prepend or append activities, 'beginning' or 'end
    *    @param {Function} (optional)  A function to call when all formatting is finished
    **/
    jq.fn.formatActivities = function(items, insertAt) {
            var maxui = this;
            var activities = ''

            // Iterate through all the activities
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
                    var replies = []
                    if (activity.replies)
                        {
                            if (activity.replies.length>0)
                                {
                                    for (r=0;r<activity.replies.length;r++)
                                        {
                                        var comment = activity.replies[r]
                                        reply = {
                                                           id: comment.id,
                                                       actor: comment.actor,
                                                         date: maxui.utils.formatDate(comment.published,maxui.language),
                                                         text: maxui.utils.formatText(comment.content),
                                                    avatarURL: maxui.settings.avatarURLpattern.format(comment.actor.username),
                                             canDeleteComment: comment.deletable,
                                                     literals: maxui.settings.literals

                                                }
                                        replies.push(reply)
                                        }
                                }
                        }

                    // Take all the latter properties and join them into an object
                    // containing all the needed params to render the template
                        var params = {
                                           id: activity.id,
                                        actor: activity.actor,
                                     literals: maxui.settings.literals,
                                         date: maxui.utils.formatDate(activity.published, maxui.language),
                                         text: maxui.utils.formatText(activity.object.content),
                                      replies: replies,
                                    favorited: activity.favorited,
                                        likes: activity.likesCount ? activity.likesCount : 0,
                               showLikesCount: maxui.currentSortOrder == 'likes',
                                        liked: activity.liked,

                                    avatarURL: avatar_url,
                                  publishedIn: contexts,
                            canDeleteActivity: activity.deletable,
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

    /**
    *    Renders the N comments passed in items on the timeline slot. This function is
    *    meant to be called as a callback of a call to a max webservice returning comments
    *    @param {String} items         a list of objects representing comments, returned by max
    *    @param {String} activity_id   id of the activity where comments belong to
    **/
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
                                    avatarURL: maxui.settings.avatarURLpattern.format(comment.actor.username),
                             canDeleteComment: comment.deletable
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


    /**
    *    Renders the postbox
    **/
    jq.fn.renderPostbox = function() {
        var maxui = this
        // Render the postbox UI if user has permission
        var showCT = maxui.settings.UISection == 'conversations'
        var toggleCT = maxui.settings.disableConversations == false && !showCT

        var params = {        avatar: maxui.settings.avatarURLpattern.format(maxui.settings.username),
                        allowPosting: maxui.settings.canwrite,
                       buttonLiteral: maxui.settings.literals.new_activity_post,
                         textLiteral: maxui.settings.literals.new_activity_text,
                            literals: maxui.settings.literals,
             showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;'
                    }
        var postbox = maxui.templates.postBox.render(params)
        var $postbox = jq('#maxui-newactivity')
        $postbox.html(postbox)


    }


    /**
    *    Renders the timeline of the current user, defined in settings.username
    **/
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

        if (!filters.sortBy) {
            filters.sortBy = maxui.settings.activitySortOrder
        }

        maxui.currentSortOrder = filters.sortBy

        if (maxui.settings.activitySource=='timeline')
        {
            var activityRetriever = this.maxClient.getUserTimeline
            func_params.push(maxui.settings.username)
        }
        else if (maxui.settings.activitySource=='activities')
        {
            var activityRetriever = this.maxClient.getActivities
            options = {
                context: maxui.settings.readContextHash,
                tags: maxui.settings.contextTagsFilter
            }
            func_params.push(options)
        }

        if (arguments.length>1)
        {
            var callback = arguments[1]
            func_params.push( function(event) {
                var items = this
                // Determine write permission, granted by default if we don't find a restriction
                maxui.settings.canwrite = true

                // If we don't have a context, we're in timeline, so we can write
                if (maxui.settings.activitySource == 'activities') {
                    maxui.maxClient.getContext(
                        maxui.settings.readContextHash,
                        function (event) {
                            var context = this

                            // Add read context if user is not subscribed to it{
                            var subscriptions = maxui.settings.subscriptions
                            if (!subscriptions[context.hash])
                            {
                                subscriptions[context.hash]={}
                                subscriptions[context.hash]['permissions']={}

                                // Check only for public defaults, as any other permission would require
                                // a susbcription, that we already checked that doesn't exists
                                subscriptions[context.hash]['permissions']['read'] = context.permissions.read=='public'
                                subscriptions[context.hash]['permissions']['write'] = context.permissions.write=='public'
                            }

                            // Iterate through all the defined write contexts to check for write permissions on
                            // the current user
                            for (wc=0;wc<maxui.settings.writeContexts.length;wc++)
                                {
                                    var write_context = maxui.settings.writeContextsHashes[wc]
                                    if (subscriptions[write_context]['permissions'])
                                    {
                                      if (subscriptions[write_context]['permissions'].write!=true)
                                      {
                                          maxui.settings.canwrite = false
                                      }
                                    }
                                    else { maxui.settings.canwrite = false }
                                }


                            maxui.renderPostbox()
                            // format the result items as activities
                            maxui.formatActivities(items, insert_at, callback)

                        }
                    )
                } else {
                    maxui.renderPostbox(items, insert_at, callback)
                            // format the result items as activities
                    maxui.formatActivities(items, insert_at, callback)
                }

            })
        }
        else
        {
            func_params.push( function() {
                maxui.formatActivities(this, insert_at)})
        }


        // if passed as param, assume an object with search filtering params
        // one or all of [limit, before, after, hashtag]
        func_params.push(filters)

        activityRetriever.apply(this.maxClient,func_params)
        }

    /**
    *    Renders the timeline of the current user, defined in settings.username
    **/
    jq.fn.printCommentsForActivity = function(activity_id) {


        var maxui = this
        var func_params = []

        func_params.push(activity_id)
        func_params.push(function() {maxui.formatComment(this, activity_id)})
        this.maxClient.getCommentsForActivity.apply(this.maxClient, func_params)

    }


})(jQuery);
