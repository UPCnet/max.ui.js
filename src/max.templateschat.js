/*global Hogan *//*jshint multistr: true */
/**
* @fileoverview Provides hogan compiled templates
*               ready to render.
*/
'use strict';

var max = max || {};

max.templates = function() {
    var templates = {
        conversation: Hogan.compile('\
<div class="maxui-conversation" id="{{id}}" data-displayname="{{displayName}}">\
            <div class="maxui-activity-content">\
                <div class="maxui-topright">\
        \
                    <div class="maxui-publisheddate">{{date}}</div>\
                    <div class="maxui-enterconversation">\
                        <a class="maxui-enterconversation maxui-icon-" href="#"></a>\
                        {{#hasUnread}}<span class="maxui-unread-messages">{{messages}}</span>{{/hasUnread}}\
                    </div>\
                </div>\
                <div class="maxui-actor">\
                      <a href="#"><span class="maxui-avatar maxui-big"><img src="{{avatarURL}}"></span>\
                      <span class="maxui-displayname">{{displayName}}</span></a>\
                </div>\
                <div>\
                    <p class="maxui-body">{{&text}}</p>\
                </div>\
            </div>\
        \
            <div class="maxui-clear"></div>\
        </div>\
            '),
        conversationSettings: Hogan.compile('\
<div id="maxui-{{panelID}}" {{#canManage}}class="maxui-owner"{{/canManage}}>\
          <span class="maxui-avatar maxui-big"><img src="{{conversationAvatarURL}}"></span>\
          <div id="maxui-conversation-displayname-edit">\
              <input type="text" class="maxui-displayname" value="{{displayName}}"/>\
              <i class="maxui-icon-cancel-circled"></i>\
              <i class="maxui-icon-ok-circled"></i>\
          </div>\
          <span class="maxui-displayname">{{displayName}}</span>\
          <span class="maxui-published">{{literals.conversations_info_created}} {{published}}</span>\
          <div class="maxui-participants">\
            <h4>{{literals.conversations_info_participants}}</h4>\
            <ul>\
              {{#participants}}\
              <li class="maxui-participant {{#owner}}maxui-owner{{/owner}}" data-username="{{username}}">\
                  <span class="maxui-avatar maxui-little"><img src="{{avatarURL}}"></span>\
                  <span class="maxui-displayname">{{displayName}}\
                      <i class="maxui-conversation-user-action maxui-icon-trash" {{^owner}}title="{{literals.conversations_info_kick_message_1}} {{displayName}} {{literals.conversations_info_kick_message_2}}"{{/owner}}></i>\
                      <i class="maxui-conversation-user-action maxui-icon-crown{{^owner}}-plus{{/owner}}" {{^owner}}title="{{literals.conversations_info_transfer_message_1}} {{displayName}} {{literals.conversations_info_transfer_message_2}}"{{/owner}}></i>\
                      <div class="maxui-conversation-transfer-to maxui-conversation-confirmation">\
                          <i class="maxui-icon-cancel-circled"></i>\
                          <i class="maxui-icon-ok-circled"></i>\
                      </div>\
                      <div class="maxui-conversation-kick-user maxui-conversation-confirmation">\
                          <i class="maxui-icon-cancel-circled"></i>\
                          <i class="maxui-icon-ok-circled"></i>\
                      </div>\
                  </span>\
                  <span class="maxui-username">{{username}}</span>\
              </li>\
              {{/participants}}\
            </ul>\
            {{#canAdd}}\
            <div id="maxui-new-participant">\
                <i class="maxui-icon-user-add"/>\
                <input type="text" class="maxui-text-input maxui-empty"/>\
                <div id="maxui-conversation-predictive" class="maxui-predictive" style="display:none;"><ul></ul></div>\
            </div>\
            {{/canAdd}}\
            </div>\
            <div id="maxui-conversation-leave">\
              <input type="button" class="maxui-button maxui-button-red maxui-button-wide" value="{{literals.conversations_info_leave}}">\
          </div>\
          <div id="maxui-conversation-delete">\
              <input type="button" class="maxui-button maxui-button-red maxui-button-wide" value="{{literals.conversations_info_delete}}">\
              <div class="maxui-help">\
                  <p><b>{{literals.conversations_info_delete_warning}}</b> {{literals.conversations_info_delete_help}}</p>\
                  <button class="maxui-button maxui-button-red maxui-confirmation-cancel">{{literals.cancel}}</button>\
                  <button class="maxui-button maxui-button-green maxui-confirmation-ok">{{literals.delete}}</button>\
              </div>\
          </div>\
        </div>\
            '),
        participant: Hogan.compile('\
  <li class="maxui-participant {{#owner}}maxui-owner{{/owner}}" data-username="{{username}}" style="{{style}}">\
              <span class="maxui-avatar maxui-little"><img src="{{avatarURL}}"></span>\
              <span class="maxui-displayname">{{displayName}}\
                  <i class="maxui-conversation-user-action maxui-icon-trash" {{^owner}}title="Click to kick {{displayName}} out of this conversation"{{/owner}} style="display:none;"></i>\
                  <i class="maxui-conversation-user-action maxui-icon-crown{{^owner}}-plus{{/owner}}" {{^owner}}title="Click to make {{displayName}} the owner of this conversation"{{/owner}} style="display:none;"></i>\
                  <div class="maxui-conversation-transfer-to maxui-conversation-confirmation">\
                      <i class="maxui-icon-cancel-circled"></i>\
                      <i class="maxui-icon-ok-circled"></i>\
                  </div>\
                  <div class="maxui-conversation-kick-user maxui-conversation-confirmation">\
                      <i class="maxui-icon-cancel-circled"></i>\
                      <i class="maxui-icon-ok-circled"></i>\
                  </div>\
                  <div class="maxui-conversation-add-user maxui-conversation-confirmation">\
                      <i class="maxui-icon-cancel-circled"></i>\
                      <i class="maxui-icon-ok-circled"></i>\
                  </div>\
              </span>\
              <span class="maxui-username">{{username}}</span>\
          </li>\
            '),
        participants: Hogan.compile('\
{{#persons}}\
        <div class="maxui-filter maxui-participant" type="participant" username="{{username}}"><span>{{prepend}}{{displayName}}<a class="maxui-close" href=""><i class="maxui-icon-cancel-circled" alt="tanca"/></a></span></div>\
        {{/persons}}\
            '),
        postBox: Hogan.compile('\
      <span class="maxui-avatar maxui-big">\
                  <img src="{{avatar}}">\
              </span>\
              <div id="maxui-newactivity-box">\
                   <div class="maxui-wrapper">\
                       <textarea class="maxui-empty maxui-text-input" data-literal="{{textLiteral}}">{{textLiteral}}</textarea>\
                       <div class="maxui-error-box"></div>\
                   </div>\
        \
                    {{#showSubscriptionList}}\
                    <select id="maxui-subscriptions">\
                      {{#subscriptionList}}\
                        <option value="{{hash}}">{{displayname}}</option>\
                      {{/subscriptionList}}\
                    </select>\
                    {{/showSubscriptionList}}\
                   <input disabled="disabled" type="button" class="maxui-button maxui-disabled" value="{{buttonLiteral}}">\
              </div>\
            '),
        predictive: Hogan.compile('\
<li data-username="{{username}}" data-displayname="{{displayName}}" class="{{cssclass}}">\
        <img src="{{avatarURL}}"/><span>{{displayName}}</span>\
        </li>\
            '),
        filters: Hogan.compile('\
{{#filters}}\
            {{#visible}}\
            <div class="maxui-filter maxui-{{type}}" type="{{type}}" value="{{value}}"><span>{{prepend}}{{value}}<a class="maxui-close" href=""><i class="maxui-icon-cancel-circled" alt="tanca"/></a></span></div>\
            {{/visible}}\
        {{/filters}}\
            '),
        message: Hogan.compile('\
<div class="maxui-message maxui-user-{{#othersMessage}}not{{/othersMessage}}me" id="{{id}}">\
            <div class="maxui-activity-content">\
                <span class="maxui-avatar maxui-little"><img src="{{avatarURL}}"></span>\
                <div class="maxui-balloon">\
                    {{#fileDownload}}\
                    <form action="/messages/{{id}}/file/download" method="POST">\
                        <input type="hidden" name="X-Oauth-Token" value="{{auth.token}}">\
                        <input type="hidden" name="X-Oauth-Username" value="{{auth.username}}">\
                        <input type="hidden" name="X-Oauth-Scope" value="widgetcli">\
                        <input type="hidden" name="X-HTTP-Method-Override" value="GET">\
                        <span class="maxui-icon-download"></span><input type="submit" class="maxui-download" name="submit" value="File download">\
                    </form>\
                    {{/fileDownload}}\
                    {{#showDisplayName}}<span class="maxui-displayname">{{displayName}}</span>{{/showDisplayName}}\
                    <p class="maxui-body">{{&text}}</p>\
                    <span class="maxui-publisheddate">{{date}}</span>\
                    <i class="maxui-icon-check{{#ack}} maxui-ack{{/ack}}"></i>\
                </div>\
            </div>\
            <div class="maxui-clear"></div>\
        </div>\
            '),
        mainUIChat: Hogan.compile('\
<div id="maxui-container">\
        {{#username}}\
         <div id="maxui-mainpanel">\
           <div id="maxui-conversations" style="height:0px; {{showConversations}}">\
               <div id="maxui-common-header">\
                  <div id="maxui-conversations-header" class="maxui-togglebar">\
                      <h3 class="maxui-title">{{literals.conversations}}</h3></a>\
                  </div>\
                  <div id="maxui-back-conversations" class="maxui-togglebar">\
                      <a class="maxui-icon-" href="#"> {{literals.conversations_list}}\
                      <h3 class="maxui-title">displayName</h3></a>\
                      <i id="maxui-conversation-info" class="maxui-icon-cog"/>\
                  </div>\
               </div>\
               <div class="maxui-wrapper">\
                   <div id="maxui-conversations-list" class="maxui-activities">\
                       <span id="maxui-info">{{literals.no_chats}}<span>\
                   </div>\
        \
                   <div id="maxui-messages" style="{{messagesStyle}}">\
                       <div id="maxui-more-messages">\
                           <input type="button" class="maxui-button maxui-button-grey" value="{{literals.chats_load_older}}">\
                       </div>\
                       <div id="maxui-message-list">\
                       </div>\
                   </div>\
                </div>\
                   <div id="maxui-scrollbar">\
                          <div class="maxui-dragger handle"/>\
                   </div>\
           </div>\
        \
            <div id="maxui-show-conversations" class="maxui-togglebar maxui-icon-" style="{{showConversationsToggle}}">\
                <span class="maxui-unread-conversations maxui-hidden"></span> <a href="#">{{literals.conversations_lower}}</a>\
            </div>\
        \
            <div id="maxui-conversation-predictive" class="maxui-predictive" style="display:none;"><ul></ul></div>\
            <div id="maxui-add-people-box" style="display:none;">\
                <div>\
                  <label class="maxui-label">{{literals.participants}}: <span class="maxui-count">(1/20)</span></label>\
                  <input tabindex="20" type="text" data-literal="{{literals.conversations_info_add}}" value="{{literals.conversations_info_add}}" class="maxui-text-input" id="add-user-input">\
                </div>\
                <div id="maxui-new-participants" style="display:none;"></div>\
                <div id="maxui-new-displayName" style="display:none;">\
                    <label class="maxui-label">{{literals.conversation_name}}: </label>\
                    <input tabindex="21" type="text" class="maxui-simple-text-input"/>\
                </div>\
            </div>\
        \
            <div id="maxui-newactivity" {{#hidePostbox}}style="display:none;"{{/hidePostbox}}>\
            </div>\
          </div>\
         </div>\
        {{/username}}\
        {{^username}}\
          No s\'ha definit cap usuari\
        {{/username}}\
        </div>\
            ')
    };
    return templates;
};
