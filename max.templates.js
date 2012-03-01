

// construct and compile templates
var MSTCH_MAXUI_MAIN_UI = '\
<div id="maxui-container">\
{{#username}}\
   <div id="maxui-newactivity">\
       <textarea>{{literals.new_activity_text}}</textarea>\
       <input type="button" class="send" value="{{literals.new_activity_post}}">\
   </div>\
   <div id="maxui-timeline">\
      <div class="wrapper">\
          <div id="maxui-activities">\
          </div>\
      </div>\
   </div>\
  </div>\
{{/username}}\
{{^username}}\
  No s\'ha definit cap usuari\
{{/username}}\
</div>\
';


var MSTCH_MAXUI_ACTIVITIES = '\
{{#activities}}\
<div class="maxui-activity" activityid="{{id}}" userid="{{actor.id}}" username="{{actor.username}}">\
    <div class="maxui-avatar">\
        <img src="{{#avatarURL}}{{actor.username}}{{/avatarURL}}">\
    </div>\
    <div class="maxui-activity-content">\
        <div>\
          <span class="maxui-displayname">{{actor.displayName}}</span>\
          <span class="maxui-username">{{actor.username}}</span>\
        </div>\
        <div>\
            <p class="maxui-body">{{#formattedText}}{{object.content}}{{/formattedText}}</p>\
        </div>\
        <div class="maxui-publisheddate">{{#formattedDate}}{{published}}{{/formattedDate}}</div>\
    </div>\
    <div class="maxui-footer">\
        <div class="maxui-actions">\
            <ul>\
                <li><span class="maxui-commentaction">{{literals.toggle_comments}}  {{#replies}}({{replies.totalItems}}){{/replies}}</span></li>\
            </ul>\
        </div>\
    </div>\
\
    <div class="maxui-comments" style="display: none">\
        <div class="maxui-commentsbox">\
            {{#replies.items}}\
            <div class="maxui-comment" commentid="{{id}}" userid="{{author.id}}" displayname="{{author.username}}">\
                <div class="maxui-avatar">\
                    <img src="{{#avatarURL}}{{author.username}}{{/avatarURL}}">\
                </div>\
                <div class="maxui-activity-content">\
                    <div>\
                      <span class="maxui-displayname">{{author.username}}</span>\
                      <span class="maxui-username">{{author.username}}</span>\
                    </div>\
                    <div>\
                        <p class="maxui-body">{{content}}</p>\
                    </div>\
                    <!--div class="maxui-publisheddate"></div-->\
                </div>\
            </div>\
            {{/replies.items}}\
        </div>\
        <div class="maxui-newcommentbox">\
            <div class="maxui-newcommentBoxContainer">\
                <textarea class="maxui-commentBox"></textarea>\
            </div>\
            <div class="maxui-newcommentbutton">\
                <input type="button" class="send" value="{{literals.new_comment_post}}"/>\
            </div>\
        </div>\
    </div>\
\
    <div class="maxui-clear"></div>\
</div>\
{{/activities}}\
';


var MSTCH_MAXUI_COMMENTS = '\
{{#replies.items}}\
<div class="maxui-comment" commentid="{{id}}" userid="{{author.id}}" displayname="{{author.username}}">\
    <div class="maxui-avatar">\
        <img src="{{#avatarURL}}{{author.username}}{{/avatarURL}}">\
    </div>\
    <div class="maxui-activity-content">\
        <div>\
          <span class="maxui-displayname">{{author.username}}</span>\
          <span class="maxui-username">{{author.username}}</span>\
        </div>\
        <div>\
            <p class="maxui-body">{{content}}</p>\
        </div>\
        <div class="maxui-publisheddate">{{#formattedDate}}{{published}}{{/formattedDate}}</div>\
    </div>\
</div>\
{{/replies.items}}\
';



var MAXUI_MAIN_UI = Hogan.compile(MSTCH_MAXUI_MAIN_UI);
var MAXUI_ACTIVITIES = Hogan.compile(MSTCH_MAXUI_ACTIVITIES);
var MAXUI_COMMENTS = Hogan.compile(MSTCH_MAXUI_COMMENTS);
