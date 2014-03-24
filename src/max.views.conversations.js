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
        self.mainview = maxconversations;
        self.maxui = self.mainview.maxui;
    }

    MaxConversationsList.prototype.show = function() {
        var self = this;
        self.mainview.loadWrappers();
        var literal = '';

        if (self.maxui.settings.conversationsSection != 'conversations') {
            self.mainview.$addpeople.css({
                'border-color': '#ccc'
            });
            self.mainview.$common_header.removeClass('maxui-showing-messages').addClass('maxui-showing-conversations');

            self.maxui.scrollbar.setHeight(self.mainview.height - 45);
            self.maxui.scrollbar.setTarget('#maxui-conversations #maxui-conversations-list');
            self.maxui.scrollbar.setContentPosition(0);
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

        // String to store the generated html pieces of each conversation item
        var html = '';
        // Iterate through all the conversations
        for (i = 0; i < self.mainview.conversations.length; i++) {
            var conversation = self.mainview.conversations[i];
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
        if (self.mainview.conversations.length > 0) {
            jq('#maxui-conversations-list').html(html);
        }
    };


    /** MaxConversationMessages
    *
    *
    */

    function MaxConversationMessages(maxconversations, options) {
        var self = this;
        self.mainview = maxconversations;
        self.maxui = self.mainview.maxui;
    }

    MaxConversationMessages.prototype.show = function() {
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

            self.mainview.$common_header.find('#maxui-back-conversations h3').text(self.maxui.settings.currentConversation.displayName);
            self.mainview.$common_header.removeClass('maxui-showing-conversations').addClass('maxui-showing-messages');
            self.mainview.$conversations_list.animate({
                'margin-left': self.maxui.settings.sectionsWidth * (-1)
            }, 400);
            self.mainview.$messages.animate({
                'left': 0,
                'margin-left': 0
            }, 400, function(event) {
                self.maxui.scrollbar.setHeight(self.mainview.height - 45);
                self.maxui.scrollbar.setTarget('#maxui-conversations #maxui-messages');
                self.maxui.scrollbar.setContentPosition(100);
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
        self.maxui = maxui;
        self.conversations = [];
        self.stomp = options.stomp;
        self.listview = new MaxConversationsList(self, {});
        self.messagesview = new MaxConversationMessages(self, {});
        self.height = 320;
    }

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
    };

    MaxConversations.prototype.load = function() {
        var self = this;
        // If argument provided, take conversations from there
        if (arguments.length > 0) {
            self.conversations = arguments[0];

        // Otherwise, load current user conversations directly
        } else {
            parameters = [
                self.maxui.settings.username,
                function(data) {
                    self.listview.render();
                }
            ];
            this.maxClient.getConversationsForUser.apply(self.maxui.maxClient, parameters);
        }

    };

    MaxConversations.prototype.connect = function() {
        var self = this;

        // subscribe to all exchanges indentified by conversation_id, A message will be inserted as
        // a result of mesages coming in from each exchange
        for (co = 0; co < self.conversations.length; co++) {
            conversation_id = self.conversations[co].id;
            self.stomp.subscribe('/exchange/{0}'.format(conversation_id), self.insertMessage);
        }
        // subscribe to exchange "new" notifications. Conversations sections will be rerendered
        // And a conversations exchanges subscriptions updated with the new one
        self.stomp.subscribe('/exchange/new/{0}'.format(self.maxui.settings.username), function(d) {
            data = JSON.parse(d.body);
            if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'conversations') {
                self.insertConversation(data);
                self.maxui.printConversations(function() {
                    self.maxui.toggleSection('conversations');
                    $('.maxui-message-count:first').css({
                        'background-color': 'red'
                    });
                });
            }
            // subscribe to the new conversation exchange
            self.stomp.subscribe('/exchange/{0}'.format(data.conversation), function(d) {
                self.insertMessage(d);
            });
        });
    };

    MaxConversations.prototype.insertMessage = function(d) {
        var self = this;
        debugger
    };

    MaxConversations.prototype.insertMessage = function(d) {
        var self = this;
        data = JSON.parse(d.body);
        console.log('New message from user {0} on {1}'.format(data.username, data.conversation));
        if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'messages') {
            self.maxui.printMessages(data.conversation, function() {
                self.maxui.scrollbar.setContentPosition(100);
            });
        } else if (self.maxui.settings.UISection == 'conversations' && self.maxui.settings.conversationsSection == 'conversations') self.maxui.printConversations(function() {
            self.maxui.toggleSection('conversations');
            $('.maxui-message-count:first').css({
                'background-color': 'red'
            });
        });
    };

    return {
        MaxConversations: MaxConversations
    };

};

max.views = max.views || {};
jq.extend(max.views, views());

})(jQuery);
