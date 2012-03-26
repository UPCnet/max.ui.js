

// construct and compile templates
var MSTCH_MAXUI_MAIN_UI = '\
<div id="maxui-container">\
{{#username}}\
 <div id="maxui-mainpanel">\
   {{#allowPosting}}\
   <div id="maxui-newactivity">\
      <a href="{{profile}}" class="maxui-avatar">\
          <img src="{{avatar}}">\
      </a>\
      <div class="textbox">\
           <textarea>{{literals.new_activity_text}}</textarea>\
           <input type="button" class="send" value="{{literals.new_activity_post}}">\
      </div>\
   </div>\
   {{/allowPosting}}\
   <div id="maxui-search-filters">\
   </div>\
   <div id="maxui-timeline">\
      <div class="wrapper">\
          <div id="maxui-preload" class="activities" style="height:0px;overflow:hidden">\
              <div class="wrapper">\
              </div>\
          </div>\
          <div id="maxui-activities" class="activities">\
          </div>\
      </div>\
   </div>\
   <div id="maxui-more-activities">\
        <input type="button" class="load" value="{{literals.load_more}}">\
   </div>\
  </div>\
 </div>\
{{/username}}\
{{^username}}\
  No s\'ha definit cap usuari\
{{/username}}\
</div>\
';


var MSTCH_MAXUI_ACTIVITY = '\
<div class="maxui-activity" id="{{id}}" userid="{{actor.id}}" username="{{actor.username}}">\
    <div class="maxui-activity-content">\
        <div class="maxui-publisheddate">{{date}}</div>\
        <div class="maxui-author">\
          <a href="{{profileURL}}">\
           		<span class="maxui-avatar"><img src="{{avatarURL}}"></span>\
		          <span class="maxui-displayname">{{actor.displayName}}</span>\
          </a>\
          <span class="maxui-username">{{actor.username}}</span>\
        </div>\
        <div>\
            <p class="maxui-body">{{&text}}</p>\
        </div>\
        <div class="maxui-publisheddate"></div>\
    </div>\
    <div class="maxui-footer">\
        <div class="maxui-origin">\
               {{#publishedIn}}{{literals.context_published_in}} <a href="{{publishedIn.url}}">{{publishedIn.displayName}}</a> {{/publishedIn}} \
               {{#via}} {{literals.generator_via}} {{via}} {{/via}}\
        </div>\
        <div class="maxui-actions">\
            <a href="" class="maxui-commentaction">\
                 {{#replies}}<strong>{{replies.totalItems}}</strong>{{/replies}}\
                 {{^replies}}<strong>0</strong>{{/replies}}\
                 {{literals.toggle_comments}}\
            </a>\
            \
        </div>\
    </div>\
\
    <div class="maxui-comments" style="display: none">\
        <div class="maxui-commentsbox">\
            {{#replies.items}}\
                {{> comment}}\
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
';


var MSTCH_MAXUI_COMMENT = '\
<div class="maxui-comment" id="{{id}}" userid="{{author.id}}" displayname="{{author.username}}">\
    <div class="maxui-activity-content">\
        <div class="maxui-publisheddate">{{date}}</div>\
        <div class="maxui-author">\
	   <a href="{{profileURL}}">\
		<span class="maxui-avatar"><img src="{{avatarURL}}"></span>\
		<span class="maxui-displayname">{{author.displayName}}</span></a> \
	   <span class="maxui-username">{{author.username}}</span>\
        </div>\
        <div>\
            <p class="maxui-body">{{&text}}</p>\
        </div>\
        <div class="maxui-publisheddate"></div>\
    </div>\
</div>\
';


var MSTCH_MAXUI_FILTERS = '\
{{#filters}}\
<div class="maxui-filter" type="{{type}}" value="{{value}}"><span>{{value}}<a class="close" href="">X</a></span></div>\
{{/filters}}\
';

var MAXUI_MAIN_UI = Hogan.compile(MSTCH_MAXUI_MAIN_UI);
var MAXUI_ACTIVITY = Hogan.compile(MSTCH_MAXUI_ACTIVITY);
var MAXUI_COMMENT = Hogan.compile(MSTCH_MAXUI_COMMENT);
var MAXUI_FILTERS = Hogan.compile(MSTCH_MAXUI_FILTERS);
