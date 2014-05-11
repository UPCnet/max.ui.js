/**
* @fileoverview
*/
var max = max || {};

(function(jq) {

var views = function() {


    /** MaxConversationsList
    *
    *
    */

    function MaxConversationsList(maxconversations, options) {
        var self = this;
        self.conversations = [];
        self.mainview = maxconversations;
        self.maxui = self.mainview.maxui;
    }

    MaxConversationsList.prototype.load = function(conversations) {
        var self = this;
        if (_.isArray(conversations)) {
            self.conversations = conversations;
            self.render();
        } else if (_.isFunction(conversations)) {
            self.maxui.maxClient.getConversationsForUser.apply(self.maxui.maxClient, [
            self.maxui.settings.username,
                function(data) {
                    self.conversations = data;
                    self.render();
                    conversations();
                }
            ]);
        }
    };

    MaxConversationsList.prototype.loadConversation = function(conversation_hash) {
        var self = this;
        var callback;

        if (arguments.length > 1) {
            callback = arguments[1];
        }
        self.maxui.maxClient.getConversationSubscription(conversation_hash, self.maxui.settings.username,function(data) {
            if (_.findWhere(self.conversations, {'id': data.id})) {
                self.conversations = _.map(self.conversations, function(conversation) {
                    if (conversation.id == data.id) {
                        return data;
                    } else {
                        return conversation;
                    }
                });
            } else {
                data.messages = 1;
                self.conversations.push(data);
            }
            self.sort();
            self.render();
            callback();
        });
    };

    MaxConversationsList.prototype.updateLastMessage = function(conversation_id, message) {
        var self = this;
        var increment = 0;
        if (arguments.length > 2)
            increment = 1;

        self.conversations = _.map(self.conversations, function(conversation) {
            if (conversation.id == conversation_id) {
                conversation.lastMessage = message;
                conversation.messages += increment;
            }
            return conversation;
        }, self);
        self.sort();
    };

    MaxConversationsList.prototype.resetUnread = function(conversation_id) {
        var self = this;

        self.conversations = _.map(self.conversations, function(conversation) {
            if (conversation.id == conversation_id) {
                conversation.messages = 0;
            }
            return conversation;
        }, self);
        self.mainview.updateUnreadConversations();
    };

    MaxConversationsList.prototype.sort = function() {
        var self = this;
        self.conversations = _.sortBy(self.conversations, function(conversation) {return conversation.lastMessage.published;});
        self.conversations.reverse();
    };

    MaxConversationsList.prototype.remove = function(conversation_id) {
        var self = this;
        self.conversations = _.filter(self.conversations, function(conversation){ return conversation.id != conversation_id;});
        self.sort();
        self.render();
    };

    MaxConversationsList.prototype.insert = function(conversation) {
        var self = this;
        self.conversations.push(conversation);
        self.sort();
        self.render();
    };

    MaxConversationsList.prototype.show = function() {
        var self = this;
        self.mainview.loadWrappers();
        self.mainview.$newparticipants.show();
         // Load conversations from max if never loaded
        if (self.conversations.length === 0) {
            self.load();
            self.toggle();
        // Otherwise, just show them
        } else {
            self.render();
            self.toggle();
        }
    };

    MaxConversationsList.prototype.toggle = function() {
        var self = this;
        self.mainview.loadWrappers();
        var literal = '';

        if (!self.mainview.visible()) {
            self.mainview.$addpeople.css({
                'border-color': '#ccc'
            });
            self.mainview.$common_header.removeClass('maxui-showing-messages').addClass('maxui-showing-conversations');

            self.mainview.scrollbar.setHeight(self.mainview.height - 45);
            self.mainview.scrollbar.setTarget('#maxui-conversations #maxui-conversations-list');
            self.mainview.scrollbar.setContentPosition(0);
            self.mainview.$addpeople.animate({
                'height': 19,
                'padding-top': 6,
                'padding-bottom': 6
            }, 400, function(event) {
                self.mainview.$addpeople.removeAttr('style');
            });

            widgetWidth = self.mainview.$conversations_list.width() + 11; // +2 To include border;
            self.mainview.$conversations_list.animate({
                'margin-left': 0
            }, 400);
            self.mainview.$messages.animate({
                'left': widgetWidth + 20
            }, 400);
            self.maxui.settings.conversationsSection = 'conversations';
            literal = self.maxui.settings.literals.new_conversation_text;
            self.mainview.$postbox.val(literal).attr('data-literal', literal);
        }

    };

    // Renders the conversations list of the current user, defined in settings.username
    MaxConversationsList.prototype.render = function() {
        var self = this;
        // String to store the generated html pieces of each conversation item
        // by default showing a "no conversations" message
        var html = '<span id="maxui-info">' + self.maxui.settings.literals.no_chats + '<span>';

        // Render the postbox UI if user has permission
        var showCT = self.maxui.settings.UISection == 'conversations';
        var toggleCT = self.maxui.settings.disableConversations === false && !showCT;
        var params = {
            avatar: self.maxui.settings.avatarURLpattern.format(self.maxui.settings.username),
            allowPosting: true,
            buttonLiteral: self.maxui.settings.literals.new_message_post,
            textLiteral: self.maxui.settings.literals.new_conversation_text,
            literals: self.maxui.settings.literals,
            showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;'
        };

        var postbox = self.maxui.templates.postBox.render(params);
        var $postbox = jq('#maxui-newactivity');
        $postbox.html(postbox);


        // Reset the html container if we have conversations
        if (self.conversations.length > 0) html = '';

        // Iterate through all the conversations
        for (i = 0; i < self.conversations.length; i++) {
            var conversation = self.conversations[i];
            var partner = conversation.participants[0];
            var avatar_url = self.maxui.settings.conversationAvatarURLpattern.format(conversation.id);
            var displayName = '';

            if (conversation.participants.length <= 2) {
                if (conversation.participants.length == 1) {
                    partner = conversation.participants[0];
                    displayName += '[Archive] ';
                }
                else if (conversation.participants[0].username == self.maxui.settings.username) {
                    partner = conversation.participants[1];
                }
                avatar_url = self.maxui.settings.avatarURLpattern.format(partner.username);
            }
            displayName += conversation.displayName;
            var conv_params = {
                id: conversation.id,
                displayName: displayName,
                text: self.maxui.utils.formatText(conversation.lastMessage.content),
                messages: conversation.messages,
                literals: self.maxui.settings.literals,
                date: self.maxui.utils.formatDate(conversation.lastMessage.published, self.maxui.language),
                avatarURL: avatar_url,
                hasUnread: conversation.messages > 0
            };
            // Render the conversations template and append it at the end of the rendered covnersations
            html += self.maxui.templates.conversation.render(conv_params);
        }
    jq('#maxui-conversations-list').html(html);
    };


    /** MaxConversationMessages
    *
    *
    */

    function MaxConversationMessages(maxconversations, options) {
        var self = this;
        self.messages = {};
        self.mainview = maxconversations;
        self.maxui = self.mainview.maxui;
        self.remaining = true;
    }

    // Loads the last 10 messages of a conversation
    MaxConversationMessages.prototype.load = function() {
        var self = this;
        self.messages[self.mainview.active] = [];
        self.maxui.maxClient.getMessagesForConversation(self.mainview.active, {limit:10}, function(messages) {
            self.remaining = this.getResponseHeader('X-Has-Remaining-Items');
            _.each(messages, function(message, index, list) {
                message.ack = true;
                self.append(message);
            });
            self.render();
        });
    };

    MaxConversationMessages.prototype.ack = function(message_id) {
        var self = this;
        self.messages[self.mainview.active] = _.map(self.messages[self.mainview.active], function(message) {
            if (message_id == message.uuid) {
                message.ack = true;
            }
            return message;
        });
    };

    MaxConversationMessages.prototype.setTitle = function(title) {
        var self = this;
        self.mainview.$common_header.find('#maxui-back-conversations h3').text(title);
    };

    MaxConversationMessages.prototype.loadOlder = function() {
        var self = this;
        var older_loaded = _.first(self.messages[self.mainview.active]);
        self.maxui.maxClient.getMessagesForConversation(self.mainview.active, {limit:10, before:older_loaded.uuid}, function(messages) {
            self.remaining = this.getResponseHeader('X-Has-Remaining-Items');
            _.each(messages, function(message, index, list) {
                message.ack = true;
                self.prepend(message, index);
            });
            self.render();
        });
    };

    MaxConversationMessages.prototype.append = function(message) {
        var self = this;
        var _message;
        update_params = [];
        // Convert activity from max to mimic rabbit response
        if (!_.has(message, 'data')) {
            _message = {
                'action': 'add',
                'object': 'message',
                'user': {
                    'username': message.actor.username,
                    'displayName': message.actor.displayName
                },
                'published': message.published,
                'data': {
                    'text': message.object.content,
                    'objectType': message.object.objectType
                },
                'uuid': message.id,
                'destination': message.contexts[0].id,
                'ack': message.ack
            };

            if (_.contains(['image', 'file'], message.object.objectType)) {
                _message.data.fullURL = message.object.fullURL;
                _message.data.thumbURL = message.object.thumbURL;
            }
            // If it's a message from max, update last message on listview
            self.mainview.listview.updateLastMessage(_message.destination, {'content': _message.data.text, 'published': _message.published});
        } else {
            _message = message;
            // Is a message from rabbit, update last message on listview and increment unread counter
            self.mainview.listview.updateLastMessage(_message.destination, {'content': _message.data.text, 'published': _message.published}, true);
        }
        self.messages[_message.destination] = self.messages[_message.destination] || [];
        self.messages[_message.destination].push(_message);
    };

    MaxConversationMessages.prototype.prepend = function(message, index) {
        var self = this;

        // Convert activity from max to mimic rabbit response
        if (!_.has(message, 'data')) {
            _message = {
                'action': 'add',
                'object': 'message',
                'user': {
                    'username': message.actor.username,
                    'displayName': message.actor.displayName
                },
                'published': message.published,
                'data': {
                    'text': message.object.content,
                    'objectType': message.object.objectType
                },
                'uuid': message.id,
                'destination': message.contexts[0].id,
                'ack': message.ack
            };

            if (_.contains(['image', 'file'], message.object.objectType)) {
                _message = message;
                _message.data.fullURL = message.object.fullURL;
                _message.data.thumbURL = message.object.thumbURL;
            }
        }

        self.messages[self.mainview.active] = self.messages[self.mainview.active] || [];
        self.messages[self.mainview.active].splice(index, 0, _message);
    };

    MaxConversationMessages.prototype.render = function() {
        var self = this;
        // String to store the generated html pieces of each conversation item
        var messages = '';
        // Iterate through all the conversations
        images_to_render = [];
        for (i = 0; i < self.messages[self.mainview.active].length; i++) {
            var message = self.messages[self.mainview.active][i];
            var avatar_url = self.maxui.settings.avatarURLpattern.format(message.user.username);
            // Store in origin, who is the sender of the message, the authenticated user or anyone else
            var origin = 'maxui-user-notme';
            if (message.user.username == self.maxui.settings.username) origin = 'maxui-user-me';
            _.defaults(message.data, {filename: message.uuid});
            var params = {
                id: message.uuid,
                text: self.maxui.utils.formatText(message.data.text),
                date: self.maxui.utils.formatDate(message.published, maxui.language),
                origin: origin,
                literals: self.maxui.settings.literals,
                avatarURL: avatar_url,
                ack: message.ack ? origin == 'maxui-user-me' : false,
                fileDownload: message.data.objectType == 'file',
                filename: message.data.filename,
                auth: {'token': maxui.settings.oAuthToken, 'username': maxui.settings.username}
            };
            // Render the conversations template and append it at the end of the rendered covnersations
            messages = messages + self.maxui.templates.message.render(params);
            if (message.data.objectType == 'image') {
                images_to_render.push(message);
            }
        }
        jq('#maxui-messages #maxui-message-list').html(messages);

        _.each(images_to_render, function(message, index, list) {
            self.maxui.maxClient.getMessageImage('/messages/{0}/image/thumb'.format(message.uuid), function(encoded_image_data) {
                var imagetag = '<img class="maxui-embedded" alt="" src="data:image/png;base64,{0}" />'.format(encoded_image_data);
                $('.maxui-message#{0} .maxui-body'.format(message.uuid)).after(imagetag);
            });
        });

        $moremessages = jq('#maxui-messages #maxui-more-messages');
        if (self.remaining == "1") $moremessages.show();
        else $moremessages.hide();

    };

    MaxConversationMessages.prototype.show = function(conversation_hash) {
        var self = this;
        self.mainview.loadWrappers();

        // PLEASE CLEAN THIS SHIT
        $button = jq('#maxui-newactivity').find('input.maxui-button');
        $button.removeAttr('disabled');
        $button.attr('class', 'maxui-button');
        self.mainview.$newmessagebox.find('textarea').attr('class', 'maxui-text-input');
        self.mainview.$newmessagebox.find('.maxui-error-box').animate({
                    'margin-top': -26
                }, 200);
        self.mainview.$newparticipants.hide();
        // UNTIL HERE

        self.mainview.active = conversation_hash;
        self.mainview.listview.resetUnread(conversation_hash);

        // Load conversation messages from max if never loaded
        if (!_.has(self.messages, conversation_hash)) {
            self.load();
            self.toggle();
        // Otherwise, just show them
        } else {
            self.render();
            self.toggle();
        }
    };

    MaxConversationMessages.prototype.toggle = function() {
        var self = this;
        self.mainview.loadWrappers();
        var literal = '';

        if (self.maxui.settings.conversationsSection != 'messages') {
            self.mainview.$addpeople.animate({
                'height': 0,
                'padding-top': 0,
                'padding-bottom': 0
            }, 400, function(event) {
                self.mainview.$addpeople.css({
                    'border-color': 'transparent'
                });
            });
            self.setTitle(self.mainview.getActive().displayName);
            self.mainview.$common_header.removeClass('maxui-showing-conversations').addClass('maxui-showing-messages');
            self.mainview.$conversations_list.animate({
                'margin-left': self.maxui.settings.sectionsWidth * (-1)
            }, 400);
            self.mainview.$messages.animate({
                'left': 0,
                'margin-left': 0
            }, 400, function(event) {
                self.mainview.scrollbar.setHeight(self.mainview.height - 45);
                self.mainview.scrollbar.setTarget('#maxui-conversations #maxui-messages');
                self.mainview.scrollbar.setContentPosition(100);
            });
            self.mainview.$messages.width(self.maxui.settings.sectionsWidth);
            self.maxui.settings.conversationsSection = 'messages';
            literal = self.maxui.settings.literals.new_activity_text;
            self.mainview.$postbox.val(literal).attr('data-literal', literal);
        }

    };


    /** MaxConversations
    *
    *
    */

    function MaxConversations(maxui, options) {
        var self = this;
        self.el = '#maxui-conversations';
        self.$el = jq(self.el);
        self.maxui = maxui;
        self.height = 320;

        self.listview = new MaxConversationsList(self, {});
        self.messagesview = new MaxConversationMessages(self, {});
        self.conversationSettings = new max.views.MaxChatInfo(self.maxui);

        self.active = '';

    }

    MaxConversations.prototype.visible = function() {
        var self = this;
        return self.$conversations.is(':visible') && self.$conversations.height > 0;
    };



    MaxConversations.prototype.loadScrollbar = function() {
        var self = this;
        self.scrollbar = new max.views.MaxScrollbar({
            width: self.maxui.settings.scrollbarWidth,
            handle: {height: 20},
            scrollbar: self.el + ' #maxui-scrollbar',
            target: self.el
        });
    };

    MaxConversations.prototype.getActive = function() {
        var self = this;
        return  _.findWhere(self.listview.conversations, {'id': self.active});
    };

    MaxConversations.prototype.loadWrappers = function() {
        var self = this;
        self.$conversations = jq('#maxui-conversations');
        self.$conversations_list = jq('#maxui-conversations-list');
        self.$conversations_wrapper = self.$conversations.find('.maxui-wrapper');
        self.$messages = jq('#maxui-messages');
        self.$message_list = jq('#maxui-message-list');
        self.$postbox = jq('#maxui-newactivity-box textarea');
        self.$common_header = self.$conversations.find('#maxui-common-header');
        self.$addpeople = jq('#maxui-add-people-box');
        self.$newparticipants = $('#maxui-new-participants');
        self.$newmessagebox = jq('#maxui-newactivity');
    };

    MaxConversations.prototype.render = function() {
        var self = this;
        self.loadScrollbar();
        self.bindEvents();
    };

    MaxConversations.prototype.bindEvents = function() {
        var self = this;
        // Show overlay with conversation info
        jq('#maxui-conversation-info').click(function(event) {
            event.preventDefault();
            event.stopPropagation();
            self.maxui.overlay.show(self.conversationSettings);
        });

        //Assign going back to conversations list
        jq('#maxui-back-conversations').on('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            window.status = '';
            self.listview.show();
        });

        //Assign activation of messages section by delegating the clicl of a conversation arrow to the conversations container
        jq('#maxui-conversations').on('click', '.maxui-conversation', function(event) {
            event.preventDefault();
            event.stopPropagation();
            window.status = '';
            var conversation_hash = jq(event.target).closest('.maxui-conversation').attr('id');
            self.messagesview.show(conversation_hash);
        });

        /// Load older activities
        jq('#maxui-conversations').on('click', '#maxui-more-messages .maxui-button', function(event) {
            event.preventDefault();
            event.stopPropagation();
            window.status = '';
            self.messagesview.loadOlder();

        });
    };


    /**
     *    Sends a post when user clicks `post activity` button with
     *    the current contents of the `maxui-newactivity` textarea
     **/
    MaxConversations.prototype.send = function(text) {
        var self = this;

        message = {
            data: {
                "text": text
            },
            action: 'add',
            object: 'message'
        };
        var sent = self.maxui.messaging.send(message, '{0}.messages'.format(self.active));

        jq('#maxui-newactivity textarea').val('');
        jq('#maxui-newactivity .maxui-button').attr('disabled', 'disabled');
        sent.ack = false;
        sent.destination = self.active;
        self.messagesview.append(sent);
        self.messagesview.render();
        self.scrollbar.setContentPosition(100);
        self.messagesview.show(self.active);

        self.listview.updateLastMessage(self.active, {'content': sent.data.text, 'published': sent.published});

    };

    /**
     *    Creates a new conversation and shows it
     **/
    MaxConversations.prototype.create = function(options) {
        var self = this;

        options.participants.push(maxui.settings.username);

        maxui.maxClient.addMessageAndConversation(options, function(event) {
            var message = this;
            var chash = message.contexts[0].id;

                conversation = {
                'id': chash,
                'displayName': message.contexts[0].displayName,
                'lastMessage': {
                    'content': message.object.content,
                    'published': message.published
                },
                'participants': options.participants,
                'tags': message.contexts[0].tags
            };
            self.active = chash;
            self.listview.insert(conversation);
            self.messagesview.remaining = 0;
            message.ack = true;
            self.messagesview.append(message);
            self.messagesview.render();
            self.messagesview.show(chash);
            self.loadWrappers();
            self.$newparticipants[0].people = [];
            self.maxui.reloadPersons();

        });

    };

    MaxConversations.prototype.updateUnreadConversations = function(data) {
        var self = this;
        var $showconversations = $('#maxui-show-conversations .maxui-unread-conversations');
        var conversations_with_unread_messages = _.filter(self.listview.conversations, function(conversation) {
            if (conversation.messages > 0) return conversation;
        });
        if (conversations_with_unread_messages.length > 0) {
            $showconversations.text(conversations_with_unread_messages.length);
            $showconversations.removeClass('maxui-hidden');
        } else {
            $showconversations.addClass('maxui-hidden');
        }
    };

    MaxConversations.prototype.ReceiveMessage = function(message) {
        var self = this;
        // Insert message only if the message is from another user.
        if (message.user.username != self.maxui.settings.username) {
            console.log('New message from user {0} on {1}'.format(message.user, message.destination));
            self.messagesview.append(message);

            if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'messages') {
                self.messagesview.render();
                self.scrollbar.setContentPosition(100);

            } else if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'conversations') {
                self.listview.render();
                $('.maxui-message-count:first').css({
                    'background-color': 'red'
                });
            } else if (self.maxui.settings.UISection == 'timeline') {
                self.updateUnreadConversations();
                self.listview.render();
            }
        } else {
            console.log('Message {0} succesfully delivered'.format(message.uuid));
            var interval = setInterval(function(event) {
                var $message = jq('#' + message.uuid + ' .maxui-icon-check');
                if ($message) {
                    $message.addClass('maxui-ack');
                    self.messagesview.ack(message.uuid);
                    clearInterval(interval);
                }
            }, 10);
        }
    };

    MaxConversations.prototype.ReceiveConversation = function(message) {
        var self = this;
        // Insert conversation only if the message is from another user.
        if (message.user.username != self.maxui.settings.username) {

            if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'conversations') {
                self.active = message.destination;
                self.listview.loadConversation(message.destination, function(event) {
                    //self.messagesview.show(chash);
                });
            }

        } else {
        }
    };

    return {
        MaxConversations: MaxConversations
    };

};

max.views = max.views || {};
jq.extend(max.views, views());

})(jQuery);
