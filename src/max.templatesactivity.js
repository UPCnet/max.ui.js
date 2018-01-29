/*global Hogan *//*jshint multistr: true */
/**
* @fileoverview Provides hogan compiled templates
*               ready to render.
*/
'use strict';

var max = max || {};

max.templates = function() {
    var templates = {
        activity: Hogan.compile('\
<div class="maxui-activity {{#flagged}}maxui-flagged{{/flagged}}" id="{{id}}" userid="{{actor.id}}" username="{{actor.username}}">\
            <div class="maxui-activity-content">\
                <div class="maxui-topright">\
                    {{^showLikesCount}}<span class="maxui-publisheddate">{{date}}</span>{{/showLikesCount}}\
                    {{#showLikesCount}}<span class="maxui-likescount"><strong>{{likes}}</strong><i class="maxui-icon-thumbs-up"></i></span>{{/showLikesCount}}\
                </div>\
                <div class="maxui-actor">\
                      <a href="#"><span class="maxui-avatar maxui-big"><img src="{{avatarURL}}"></span>\
                          <span class="maxui-displayname">{{actor.displayName}}</span></a>\
                  <span class="maxui-username">{{actor.username}}&nbsp;</span>\
                </div>\
                <div class="maxui-activity-message">\
                    {{#fileDownload}}\
                    <form action="/activities/{{id}}/file/download" method="POST">\
                        <input type="hidden" name="X-Oauth-Token" value="{{auth.token}}">\
                        <input type="hidden" name="X-Oauth-Username" value="{{auth.username}}">\
                        <input type="hidden" name="X-Oauth-Scope" value="widgetcli">\
                        <input type="hidden" name="X-HTTP-Method-Override" value="GET">\
                        <span class="maxui-icon-download"></span><input type="submit" class="maxui-download" name="submit" value="{{filename}}">\
                    </form>\
                    {{/fileDownload}}\
                    <p class="maxui-body">{{&text}}</p>\
        \
                </div>\
            </div>\
            <div class="maxui-footer">\
                {{#publishedIn}}\
                <div class="maxui-origin maxui-icon-">\
                       {{literals.context_published_in}}\
                       <a href="{{publishedIn.url}}">{{publishedIn.displayName}}</a>\
                       {{#via}}\
                           {{literals.generator_via}}\
                           <span class="maxui-via">\
                           {{via}}\
                           </span>\
                       {{/via}}\
                </div>\
                {{/publishedIn}}\
                <div class="maxui-actions">\
                    <a href="" class="maxui-action maxui-commentaction maxui-icon- {{#replies}}maxui-has-comments{{/replies}}"><strong>{{replies.length}}</strong> {{literals.toggle_comments}}</a>\
                    <a href="" class="maxui-action maxui-favorites {{#favorited}}maxui-favorited{{/favorited}} maxui-icon-">{{literals.favorite}}</a>\
                    <a href="" class="maxui-action maxui-likes {{#liked}}maxui-liked{{/liked}} maxui-icon-">{{literals.like}}</a>\
                    {{#canFlagActivity}}\
                    <a href="" class="maxui-action maxui-flag {{#flagged}}maxui-flagged{{/flagged}} maxui-icon-">{{literals.flag_activity_icon}}</a>\
                    {{/canFlagActivity}}\
                    {{#canDeleteActivity}}\
                    <a href="" class="maxui-action maxui-delete maxui-icon-">{{literals.delete_activity_icon}}</a>\
                    <div class="maxui-popover left">\
                        <div class="maxui-arrow"></div>\
                            <h3 class="maxui-popover-title">{{literals.delete_activity_confirmation}}</h3>\
                            <div class="maxui-popover-content">\
                              <input type="button" class="maxui-button-delete" value="{{literals.delete_activity_delete}}">\
                              <input type="button" class="maxui-button-cancel" value="{{literals.delete_activity_cancel}}">\
                            </div>\
                    </div>\
                    {{/canDeleteActivity}}\
        \
                </div>\
            </div>\
        \
            <div class="maxui-comments" style="display: none">\
                <div class="maxui-commentsbox">\
                    {{#replies}}\
                        {{> comment}}\
                    {{/replies}}\
                </div>\
                <div class="maxui-newcommentbox">\
                        <textarea class="maxui-empty maxui-text-input" id="maxui-commentBox" data-literal="{{literals.new_comment_text}}">{{literals.new_comment_text}}</textarea>\
                        <input disabled="disabled" type="button" class="maxui-button maxui-disabled" value="{{literals.new_comment_post}}"/>\
                </div>\
            </div>\
        \
            <div class="maxui-clear"></div>\
        </div>\
            '),
        comment: Hogan.compile('\
<div class="maxui-comment" id="{{id}}" userid="{{actor.id}}" displayname="{{actor.username}}">\
            <div class="maxui-activity-content">\
               <span class="maxui-publisheddate">{{date}}</span>\
               <div class="maxui-actor">\
                   <a href="#">\
                       <span class="maxui-avatar maxui-little"><img src="{{avatarURL}}"></span>\
                       <span class="maxui-displayname">{{actor.displayName}}</span></a>\
                     <span class="maxui-username">{{actor.username}}</span>\
               </div>\
               <div>\
                   <p class="maxui-body">{{&text}}</p>\
                   {{#canDeleteComment}}\
                   <span class="maxui-delete-comment maxui-icon-"></span>\
                   <div class="maxui-popover left">\
                        <div class="maxui-arrow"></div>\
                            <h3 class="maxui-popover-title">{{literals.delete_activity_confirmation}}</h3>\
                            <div class="maxui-popover-content">\
                              <input type="button" class="maxui-button-delete" value="{{literals.delete_activity_delete}}">\
                              <input type="button" class="maxui-button-cancel" value="{{literals.delete_activity_cancel}}">\
                            </div>\
                   </div>\
                   {{/canDeleteComment}}\
               </div>\
            </div>\
        </div>\
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
        mainUIActivity: Hogan.compile('\
<div id="maxui-container">\
        {{#username}}\
         <div id="maxui-mainpanel">\
        \
           <div id="maxui-newactivity" {{#hidePostbox}}style="display:none;"{{/hidePostbox}}>\
           </div>\
        \
           <div id="maxui-search" class="folded">\
               <a id="maxui-search-toggle" class="maxui-disabled maxui-icon-" href="#" alt="obre-tanca"></a>\
               <a href="#" id="maxui-favorites-filter" title="{{literals.favorites_filter_hint}}"><i class="maxui-icon-star"/></a>\
               <div id="maxui-search-box">\
                  <input id="maxui-search-text" type="search" data-literal="{{literals.search_text}}" class="maxui-empty maxui-text-input" value="{{literals.search_text}}" />\
               </div>\
               <div id="maxui-search-filters"></div>\
           </div>\
        \
           <div id="maxui-show-timeline" class="maxui-togglebar maxui-icon-" style="{{showTimelineToggle}}"><a href="#">{{literals.activity}}</a></div>\
        \
              <div id="maxui-activity-sort">\
                <a class="maxui-sort-action maxui-most-recent {{orderViewRecent}}" href="#">{{literals.recent_activity}}</a>\
                /\
                <a class="maxui-sort-action maxui-most-valued {{orderViewLikes}}" href="#">{{literals.valued_activity}}</a>\
                /\
                <a class="maxui-sort-action maxui-flagged {{orderViewFlagged}}" href="#">{{literals.flagged_activity}}</a>\
              </div>\
              <div id="maxui-news-activities" hidden>\
                  <input type="button" class="maxui-button" value="Carrega noves entrades">\
              </div>\
           <div id="maxui-timeline" style="{{showTimeline}}">\
              <div class="maxui-wrapper">\
                  <div id="maxui-preload" class="maxui-activities" style="height:0px;overflow:hidden">\
                      <div class="maxui-wrapper">\
                      </div>\
                  </div>\
                  <div id="maxui-activities" class="maxui-activities">\
                  </div>\
                  <div id="maxui-more-activities">\
                      <input type="button" class="maxui-button" value="{{literals.load_more}}">\
                  </div>\
              </div>\
           </div>\
           <div id="maxui-overlay-background" class="maxui-overlay">\
           </div>\
           <div id="maxui-overlay-wrapper" class="maxui-overlay">\
               <div id="maxui-overlay-panel">\
                   <div id="maxui-overlay-header">\
                        <h3 id="maxui-overlay-title">I\'m a overlay</h3>\
                        <i class="maxui-close maxui-icon-cancel"/>\
                   </div>\
                   <div id="maxui-overlay-content">\
                   </div>\
               </div>\
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
