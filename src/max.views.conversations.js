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

    MaxConversationsList.prototype.loadConversation = function(conversation_hash) {
        var self = this;
        self.maxui.maxClient.getConversation(conversation_hash, function(data) {
            self.conversations.push(data);
            self.conversations = _.sortBy(self.conversations, 'published');
            self.render();
        });
    };

    MaxConversationsList.prototype.insert = function(conversation) {
        var self = this;
        self.conversations.push(conversation);
        self.conversations = _.sortBy(self.conversations, 'published');
        self.render();
    };

    MaxConversationsList.prototype.show = function() {
        var self = this;
        self.mainview.loadWrappers();
        var literal = '';

        if (self.maxui.settings.conversationsSection != 'conversations') {
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
                avatarURL: avatar_url
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

    MaxConversationMessages.prototype.loadOlder = function() {
        var self = this;
        var older_loaded = _.first(self.messages[self.mainview.active]);
        self.maxui.maxClient.getMessagesForConversation(self.mainview.active, {limit:10, before:older_loaded.messageID}, function(messages) {
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

        // Convert activity from max to mimic rabbit response
        if (!_.has(message, 'messageID')) {
            message = {
                'message': message.object.content,
                'username': message.actor.username,
                'displayName': message.actor.displayName,
                'published': message.published,
                'messageID': message.id,
                'ack': message.ack
            };
        }
        self.messages[self.mainview.active] = self.messages[self.mainview.active] || [];
        self.messages[self.mainview.active].push(message);
    };

    MaxConversationMessages.prototype.prepend = function(message, index) {
        var self = this;

        // Convert activity from max to mimic rabbit response
        if (!_.has(message, 'messageID')) {
            message = {
                'message': message.object.content,
                'username': message.actor.username,
                'displayName': message.actor.displayName,
                'published': message.published,
                'messageID': message.id,
                'ack': message.ack
            };
        }

        self.messages[self.mainview.active] = self.messages[self.mainview.active] || [];
        self.messages[self.mainview.active].splice(index, 0, message);
    };
    MaxConversationMessages.prototype.render = function() {
        var self = this;
        // String to store the generated html pieces of each conversation item
        var messages = '';
        // Iterate through all the conversations
        for (i = 0; i < self.messages[self.mainview.active].length; i++) {
            var message = self.messages[self.mainview.active][i];
            var avatar_url = self.maxui.settings.avatarURLpattern.format(message.username);
            // Store in origin, who is the sender of the message, the authenticated user or anyone else
            var origin = 'maxui-user-notme';
            if (message.username == self.maxui.settings.username) origin = 'maxui-user-me';
            var params = {
                id: message.messageID,
                text: self.maxui.utils.formatText(message.message),
                date: self.maxui.utils.formatDate(message.published, maxui.language),
                origin: origin,
                literals: self.maxui.settings.literals,
                avatarURL: avatar_url,
                ack: message.ack
            };
            // Render the conversations template and append it at the end of the rendered covnersations
            messages = messages + self.maxui.templates.message.render(params);
        }
        jq('#maxui-messages #maxui-message-list').html(messages);

        $moremessages = jq('#maxui-messages #maxui-more-messages');
        if (self.remaining == "1") $moremessages.show();
        else $moremessages.hide();

    };

    MaxConversationMessages.prototype.show = function(conversation_hash) {
        var self = this;

        self.mainview.active = conversation_hash;

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

            self.mainview.$common_header.find('#maxui-back-conversations h3').text(self.mainview.getActive().displayName);
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
        self.stomp = maxui.stomp;
        self.height = 320;

        self.listview = new MaxConversationsList(self, {});
        self.messagesview = new MaxConversationMessages(self, {});
        self.conversationSettings = new max.views.MaxChatInfo(self.maxui);

        self.active = '';

    }

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
    };

    MaxConversations.prototype.load = function() {
        var self = this;
        // If argument provided, take conversations from there
        if (arguments.length > 0) {
            self.listview.conversations = arguments[0];

        // Otherwise, load current user conversations directly
        } else {
            parameters = [
                self.maxui.settings.username,
                function(data) {
                    self.listview.conversations = data;
                    self.listview.render();
                }
            ];
            this.maxClient.getConversationsForUser.apply(self.maxui.maxClient, parameters);
        }

    };

    MaxConversations.prototype.connect = function() {
        var self = this;

        receive_helper = function(d) {
            self.ReceiveMessage(d);
        };

        // subscribe to all exchanges indentified by conversation_id, A message will be inserted as
        // a result of mesages coming in from each exchange
        for (co = 0; co < self.listview.conversations.length; co++) {
            conversation_id = self.listview.conversations[co].id;
            self.stomp.subscribe('/exchange/{0}'.format(conversation_id), receive_helper);
        }
        // subscribe to exchange "new" notifications. Conversations sections will be rerendered
        // And a conversations exchanges subscriptions updated with the new one
        self.stomp.subscribe('/exchange/new/{0}'.format(self.maxui.settings.username), function(d) {
            data = JSON.parse(d.body);
            self.listview.loadConversation(data.conversation);
            if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'conversations') {

/*                self.maxui.printConversations(function() {
                    self.maxui.toggleSection('conversations');
                    $('.maxui-message-count:first').css({
                        'background-color': 'red'
                    });
                });*/
            }
            // subscribe to the new conversation exchange
            self.stomp.subscribe('/exchange/{0}'.format(data.conversation),  receive_helper());
        });
    };

    MaxConversations.prototype.render = function(text) {
        var self = this;
        self.loadScrollbar();
        self.listview.render();
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

        maxui.maxClient.addMessage(text, self.active, function(event) {
            var message = this;
            jq('#maxui-newactivity textarea').val('');
            jq('#maxui-newactivity .maxui-button').attr('disabled', 'disabled');
            message.ack = false;
            self.messagesview.append(message);
            self.messagesview.render();
            self.scrollbar.setContentPosition(100);
            self.messagesview.show(self.active);
        });

    };

    /**
     *    Sends a post when user clicks `post activity` button with
     *    the current contents of the `maxui-newactivity` textarea
     **/
    MaxConversations.prototype.create = function(options) {
        var self = this;

        //var func_params = [];
        options.participants.push(maxui.settings.username);
        //func_params.push(options);

        maxui.maxClient.addMessageAndConversation(options, function(event) {
            var message = this;
            var chash = message.contexts[0].id;
            maxui.settings.currentConversation = {
                hash: chash
            };
            if (options.displayName) {
                maxui.settings.currentConversation.displayName = options.displayName;
            } else {
                maxui.settings.currentConversation.displayName = options.participants[0].displayName;
            }
            conversation = {
                'id': message.contexts[0].id,
                'displayName': message.contexts[0].displayName,
                'lastMessage': {
                    'content': message.object.content,
                    'published': message.published
                },
                'participants': options.participants
            };

            self.active = chash;
            self.listview.insert(conversation);
            self.messagesview.append(message);
            self.messagesview.render();
            self.messagesview.show(chash);
            self.stomp.subscribe('/exchange/{0}'.format(chash), function(d) {
                self.ReceiveMessage(d);
            });

            self.loadWrappers();
            self.$newparticipants[0].people = [];
            self.maxui.reloadPersons();

        });

    };

    MaxConversations.prototype.ReceiveMessage = function(data) {
        var self = this;
        message = JSON.parse(data.body);

        // Insert message only if the message is from another user.
        if (message.username != self.maxui.settings.username) {
            console.log('New message from user {0} on {1}'.format(message.username, message.conversation));
            self.messagesview.append(message);

            if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'messages') {
                self.messagesview.render();
                self.scrollbar.setContentPosition(100);

            } else if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'conversations') {
                self.listview.render();
                $('.maxui-message-count:first').css({
                    'background-color': 'red'
                });
            }
        } else {
            console.log('Message {} succesfully delivered'.format(data.message));
            var interval = setInterval(function(event) {
                var $message = jq('#' + message.messageID + ' .maxui-icon-check');
                if ($message) {
                    $message.addClass('maxui-ack');
                    clearInterval(interval);
                }
            }, 50);


        }
    };

    return {
        MaxConversations: MaxConversations
    };

};

max.views = max.views || {};
jq.extend(max.views, views());

})(jQuery);
