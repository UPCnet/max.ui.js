

// construct and compile templates
var MSTCH_MAXUI_MAIN_UI = '\
<div id="maxui-container">\
{{#username}}\
   <div id="maxui-newactivity">\
       <textarea>{{newActivityText}}}</textarea>\
       <input type="button" class="send" value="{{newActivitySendButton}}">\
   </div>\
   <div id="maxui-timeline">\
      <div class="wrapper">\
         {{> activities}}\
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
<div id="maxui-activities">\
</div>\
';

var MSTCH_MAXUI_ACTIVITY = '\
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
        <div class="maxui-activity-date" title="{{published}}"></div>\
    </div>\
    <div class="maxui-footer">\
        <div class="maxui-actions">\
            <ul>\
                <li><a class="maxui-commentaction" href="#">Comentaris </a></li>\
            </ul>\
        </div>\
        <div class="maxui-comments" style="display: none">\
            <div class="maxui-commentsbox"></div>\
            <div class="maxui-newcommentbox">\
                <div class="maxui-newcommentBoxContainer">\
                    <textarea class="maxui-commentBox"></textarea>\
                </div>\
                <div class="maxui-newcommentbutton">\
                    <input type="button" class="send" value="Envia comentari"/>\
                </div>\
            </div>\
        </div>\
    </div>\
</div>\
{{/activities}}\
';

var MAXUI_MAIN_UI = Hogan.compile(MSTCH_MAXUI_MAIN_UI);
var MAXUI_ACTIVITIES = Hogan.compile(MSTCH_MAXUI_ACTIVITIES);
var MAXUI_ACTIVITY = Hogan.compile(MSTCH_MAXUI_ACTIVITY);

