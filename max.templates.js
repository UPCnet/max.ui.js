

// construct and compile templates
var MSTCH_MAXUI_MAIN_UI = '\
<div id="maxui-container">\
{{#username}}\
   <div id="maxui-newactivity">\
       <textarea>{{newActivityText}}</textarea>\
       <input type="button" class="send" value="{{newActivitySendButton}}">\
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
<div class="maxui-activity" activityid="{{id}}" userid="{{actor.id}}" displayname="{{actor.displayName}}">\
    <div class="maxui-avatar">\
        <img src="{{#avatarURL}}{{actor.displayName}}{{/avatarURL}}">\
    </div>\
    <div class="maxui-activity-content">\
        <div>\
          <span class="maxui-displayname">{{actor.displayName}}</span>\
          <span class="maxui-username">{{actor.displayName}}</span>\
        </div>\
        <div>\
            <p class="maxui-body">{{object.content}}</p>\
        </div>\
        <div class="maxui-publisheddate">{{#formattedDate}}{{published}}{{/formattedDate}}</div>\
    </div>\
    <div class="maxui-footer">\
        <div class="maxui-actions">\
            <ul>\
                <li><span class="maxui-commentaction">Comentaris  {{#replies}}({{replies.totalItems}}){{/replies}}</span></li>\
            </ul>\
        </div>\
    </div>\
\
    <div class="maxui-comments" style="display: none">\
        <div class="maxui-commentsbox">\
            {{#replies.items}}\
            <div class="maxui-comment" commentid="{{id}}" userid="{{author.id}}" displayname="{{author.displayName}}">\
                <div class="maxui-avatar">\
                    <img src="{{#avatarURL}}{{author.displayName}}{{/avatarURL}}">\
                </div>\
                <div class="maxui-activity-content">\
                    <div>\
                      <span class="maxui-displayname">{{author.displayName}}</span>\
                      <span class="maxui-username">{{author.displayName}}</span>\
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
                <input type="button" class="send" value="Envia comentari"/>\
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
<div class="maxui-comment" commentid="{{id}}" userid="{{author.id}}" displayname="{{author.displayName}}">\
    <div class="maxui-avatar">\
        <img src="{{#avatarURL}}{{author.displayName}}{{/avatarURL}}">\
    </div>\
    <div class="maxui-activity-content">\
        <div>\
          <span class="maxui-displayname">{{author.displayName}}</span>\
          <span class="maxui-username">{{author.displayName}}</span>\
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
