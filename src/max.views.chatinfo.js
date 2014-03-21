/**
* @fileoverview
*/
var max = max || {};

(function(jq) {

var views = function() {


    /** MaxChatInfo
    *
    *
    */

    function MaxChatInfo (maxui) {
        var self = this;
        self.title = maxui.settings.literals.conversations_info_title;
        self.content = '<div>Hello world</div>';
        self.panelID = 'conversation-settings-panel';
        displayNameSlot = {
            show: function() {
                var $panel = jq(self.getOwnerSelector(''));
                var $displayNameEdit = jq(self.getOwnerSelector('> #maxui-conversation-displayname-edit'));
                var $displayName = jq(self.getOwnerSelector('> .maxui-displayname'));
                var $displayNameInput = jq(conversation.getOwnerSelector('> #maxui-conversation-displayname-edit input.maxui-displayname'));
                $displayNameInput.width($panel.width() - 82);
                $displayName.hide();
                $displayNameEdit.show().val($displayName.text()).focus();
            },
            hide: function() {
                var $displayNameEdit = jq(self.getOwnerSelector('> #maxui-conversation-displayname-edit'));
                var $displayName = jq(self.getOwnerSelector('> .maxui-displayname'));
                var $displayNameInput = jq(conversation.getOwnerSelector('> #maxui-conversation-displayname-edit input.maxui-displayname'));
                $displayName.show();
                $displayNameEdit.hide().val('');
            },
            save: function() {
                var $displayNameEdit = jq(self.getOwnerSelector('> #maxui-conversation-displayname-edit'));
                var $displayName = jq(self.getOwnerSelector('> .maxui-displayname'));
                var $displayNameInput = jq(conversation.getOwnerSelector('> #maxui-conversation-displayname-edit input.maxui-displayname'));
                maxui.maxClient.modifyConversation(conversation.data.id, $displayNameInput.val(), function(event) {
                    self.displayNameSlot.hide();
                    $displayName.text(this.displayName);
                });
            }
        };

    }
    MaxChatInfo.prototype.getOwnerSelector =  function(selector) {
        return '#maxui-' + this.panelID + '.maxui-owner ' + selector;
    };
    MaxChatInfo.prototype.getSelector = function(selector) {
        return '#maxui-' + this.panelID + ' ' + selector;
    };
    MaxChatInfo.prototype.bind = function(overlay) {
        conversation = this;
        // Clear previous overla usage bindings
        overlay.$el().unbind();
        // Open displayName editing box when user clicks on displayName
        overlay.$el().on('click', conversation.getOwnerSelector('> .maxui-displayname'), function(event) {
            conversation.displayNameSlot.show();
        });
        // Saves or hides displayName editing box when user presses ENTER or ESC
        overlay.$el().on('keyup', conversation.getOwnerSelector('> #maxui-conversation-displayname-edit input.maxui-displayname'), function(event) {
            if (event.which == 27) {
                conversation.displayNameSlot.hide();
            } else if (event.which == 13) {
                conversation.displayNameSlot.save();
            }
        });
        // Saves displayName when user clicks the ok button
        overlay.$el().on('click', conversation.getOwnerSelector('#maxui-conversation-displayname-edit i.maxui-icon-ok-circled'), function(event) {
            conversation.displayNameSlot.save();
        });
        // Hides displayName editing box hen user clicks the cancel button
        overlay.$el().on('click', conversation.getOwnerSelector('#maxui-conversation-displayname-edit i.maxui-icon-cancel-circled'), function(event) {
            conversation.displayNameSlot.hide();
        });

        // Displays confirmation buttons when Owner clicks on kick user button
        // Displays confirmation buttons when Owner clicks on transfer ownership button
        overlay.$el().on('click', conversation.getOwnerSelector('.maxui-conversation-user-action'), function(event) {
            var $action = jq(event.currentTarget);
            var $participant = $action.closest('.maxui-participant');
            $participant.find('.maxui-conversation-confirmation:visible').hide();
            $participant.find('.maxui-conversation-user-action.active').removeClass('active');
            $action.addClass('active');
            if ($action.hasClass('maxui-icon-crown-plus')) $participant.find('.maxui-conversation-transfer-to').show();
            else if ($action.hasClass('maxui-icon-trash')) $participant.find('.maxui-conversation-kick-user').show();
        });

        // Transfers ownership to selected user and toggles ownership crown and classes accordingly
        overlay.$el().on('click', conversation.getSelector('.maxui-participant .maxui-conversation-transfer-to .maxui-icon-ok-circled'), function(event) {
            var $new_owner = jq(event.currentTarget).closest('.maxui-participant');
            var new_owner_username = $new_owner.attr('data-username');
            var $current_owner = jq(conversation.getSelector('.maxui-participant.maxui-owner'));
            var $current_crown = $current_owner.find('.maxui-icon-crown');
            var $new_crown = $new_owner.find('.maxui-icon-crown-plus');
            maxui.maxClient.transferConversationOwnership(conversation.data.id, new_owner_username, function(event) {
                $new_owner.find('.maxui-conversation-transfer-to').hide();
                $current_crown.removeClass('maxui-icon-crown').addClass('maxui-icon-crown-plus');
                $new_crown.removeClass('maxui-icon-crown-plus').addClass('maxui-icon-crown');
                $current_owner.removeClass('maxui-owner');
                $new_owner.addClass('maxui-owner');

                overlay.$el().find(conversation.getSelector('')).toggleClass('maxui-owner', false);
                overlay.$el().find(conversation.getSelector('#maxui-new-participant')).remove();
                $new_crown.removeClass('active');
            });
        });

        // Kicks user and toggles trashbin and classes accordingly
        overlay.$el().on('click', conversation.getSelector('.maxui-participant .maxui-conversation-kick-user .maxui-icon-ok-circled'), function(event) {
            var $kicked_user = jq(event.currentTarget).closest('.maxui-participant');
            var kicked_username = $kicked_user.attr('data-username');
            maxui.maxClient.kickUserFromConversation(conversation.data.id, kicked_username, function(event) {
                $kicked_user.remove();
            });
        });

        // Cancels ownership transfer
        // Cancels user kicking
        overlay.$el().on('click', conversation.getSelector('.maxui-participant .maxui-conversation-confirmation .maxui-icon-cancel-circled'), function(event) {
            var $new_owner = jq(event.currentTarget).closest('.maxui-participant');
            $new_owner.find('.maxui-conversation-confirmation:visible').hide();
            var $new_owner_action_icon = $new_owner.find('.maxui-conversation-user-action.active');
            $new_owner_action_icon.removeClass('active');
        });

        // Create MaxInput with predictable functionality

        conversation.predictive = new max.views.MaxPredictive({
            minchars: 3,
            filter: function(event) {
                return jq.map(conversation.data.participants, function(element, index) {return element.username;});
            },
            source: function(event, query, callback) { maxui.maxClient.getUsersList(query, callback);},
            action: function($selected) {
                // Action executed after a prediction item is selected, to add the user add confirmation buttons
                var username = $selected.attr('data-username');
                var displayName = $selected.attr('data-username');
                var params = {
                    style: "opacity:0; height:0px;",
                    username: username,
                    displayName: displayName,
                    literals: maxui.settings.literals,
                    avatarURL: maxui.settings.avatarURLpattern.format(username)
                };
                var newuser = maxui.templates.participant.render(params);
                var $participants = jq(conversation.getSelector('.maxui-participants > ul'));
                $participants.append(newuser);
                var $participant = jq(conversation.getSelector('.maxui-participant:last'));
                $participant.animate({height:36}, 100, function(event) {
                    $participant.animate({opacity:1}, 200);
                });

                $participant.find('.maxui-conversation-add-user').show().focus();
                jq(conversation.getSelector('#maxui-new-participant .maxui-text-input')).trigger('maxui-input-clear');

            },
            list: "#maxui-new-participant #maxui-conversation-predictive"
        });

        conversation.newparticipant = new max.views.MaxInput(
            {
                input: "#maxui-new-participant .maxui-text-input",
                delegate: overlay.el,
                placeholder: maxui.settings.literals.conversations_info_add,
                bindings: {
                    'maxui-input-keypress': function(event) {conversation.predictive.show(event);},
                    'maxui-input-submit': function(event) {conversation.predictive.choose(event);},
                    'maxui-input-cancel': function(event) {conversation.predictive.hide(event);},
                    'maxui-input-up': function(event) {conversation.predictive.moveup(event);},
                    'maxui-input-down': function(event) {conversation.predictive.movedown(event);},

                }
        });

        // Confirmas adding a new user to the conversation
        overlay.$el().on('click', conversation.getOwnerSelector('.maxui-participant .maxui-conversation-add-user .maxui-icon-ok-circled'), function(event) {
            var $participant = $(event.target).closest('.maxui-participant');
            var new_username = $participant.attr('data-username');
            maxui.maxClient.addUserToConversation(conversation.data.id, new_username, function(event) {

                $participant.animate({opacity:0}, 200, function(event) {
                    $participant.find('.maxui-conversation-add-user').remove();
                        $participant.animate({opacity:1}, 200);
                        $participant.find('.maxui-conversation-user-action').show();
                    });

            });
        });

        // Cancels adding a new user to the conversation
        overlay.$el().on('click', conversation.getOwnerSelector('.maxui-participant .maxui-conversation-add-user .maxui-icon-cancel-circled'), function(event) {
            var $participant = $(event.currentTarget).closest('.maxui-participant');
            $participant.animate({opacity:0}, 200, function(event) {
                $participant.animate({height:0}, 200, function(event) {
                    $participant.remove();
                });
            });
        });

        // User Leaves conversation
        overlay.$el().on('click', conversation.getSelector('#maxui-conversation-leave .maxui-button'), function(event) {
            var leaving_username = maxui.settings.username;
            maxui.maxClient.kickUserFromConversation(conversation.data.id, leaving_username, function(event) {
                overlay.hide();
                $('#maxui-back-conversations a').trigger('click');
            });
        });

        // User clicks delete conversation button
        overlay.$el().on('click', conversation.getSelector('#maxui-conversation-delete .maxui-button'), function(event) {
            jq(conversation.getSelector('#maxui-conversation-delete .maxui-help')).show();
        });

        // User confirms deleting a conversation
        overlay.$el().on('click', conversation.getSelector('#maxui-conversation-delete .maxui-help .maxui-confirmation-ok'), function(event) {
            maxui.maxClient.deleteConversation(conversation.data.id, function(event) {
                overlay.hide();
                $('#maxui-back-conversations a').trigger('click');
            });
        });

        // User cancels deleting a conversation
        overlay.$el().on('click', conversation.getSelector('#maxui-conversation-delete .maxui-help .maxui-confirmation-cancel'), function(event) {
            jq(conversation.getSelector('#maxui-conversation-delete .maxui-help')).hide();
        });
    };

    MaxChatInfo.prototype.load = function(configurator) {
        var conversation = this;
        maxui.maxClient.getConversation(maxui.settings.currentConversation.hash, function(data) {
            conversation.data = data;
            var participants = [];
            for (pt = 0; pt < conversation.data.participants.length; pt++) {
                var participant = conversation.data.participants[pt];
                participant.avatarURL = maxui.settings.avatarURLpattern.format(participant.username);
                participant.owner = participant.username == conversation.data.owner;
                participants.push(participant);
            }
            var avatar_url = maxui.settings.conversationAvatarURLpattern.format(conversation.data.id);
            if (conversation.data.participants.length <= 2) {
                var partner = conversation.data.participants[0];
                // Check if the partner choosed is the same as the logged user
                // We can't be sure that the partner is the first or the second in the array
                if (conversation.data.participants[0].username == maxui.settings.username) {
                    partner = conversation.data.participants[1];
                    // User the user partner's avatar as conversation avatar
                    avatar_url = maxui.settings.avatarURLpattern.format(partner.username);
                }
            }
            var params = {
                displayName: conversation.data.displayName,
                conversationAvatarURL: avatar_url,
                participants: participants,
                literals: maxui.settings.literals,
                panelID: conversation.panelID,
                published: maxui.utils.formatDate(conversation.data.published, maxui.language),
                canManage: maxui.settings.username == conversation.data.owner
            };
            conversation.content = maxui.templates.conversationSettings.render(params);
            configurator(conversation);
        });
    };


    return {
        MaxChatInfo: MaxChatInfo
    };

};

max.views = max.views || {};
jq.extend(max.views, views());

})(jQuery);
