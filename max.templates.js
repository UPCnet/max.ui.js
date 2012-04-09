var max = max || {};

/**
 * @fileoverview Provides hogan compiled templates
 *               ready to render.
 */


max.templates = function() {

// construct and compile templates
var MSTCH_MAXUI_MAIN_UI = '\
<div id="maxui-container">\
{{#username}}\
 <div id="maxui-mainpanel">\
\
   <div id="maxui-search" class="folded">\
       <a id="maxui-search-toggle" class="maxui-disabled" href="#"><img src="https://max.upc.edu/maxui/transparent.gif" alt="obre-tanca" ></a>\
       <div id="maxui-search-box">\
          <input id="maxui-search-text" type="search" placeholder="{{literals.search_text}}" class="maxui-empty maxui-text-input" value="{{literals.search_text}}" />\
          <!--<input disabled="disabled" id="maxui-search-action" type="button" class="maxui-button maxui-disabled"></input>-->\
       </div>\
       <div id="maxui-search-filters"></div>\
   </div>\
\
   <div id="maxui-timeline">\
      <div class="wrapper">\
          <div id="maxui-preload" class="activities" style="height:0px;overflow:hidden">\
              <div class="wrapper">\
              </div>\
          </div>\
          <div id="maxui-activities" class="activities">\
          </div>\
          <div id="maxui-more-activities">\
              <input type="button" class="maxui-button" value="{{literals.load_more}}">\
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
';


var MSTCH_MAXUI_POSTBOX = '\
   {{#allowPosting}}\
   <div id="maxui-newactivity">\
      <a href="{{profile}}" class="maxui-avatar">\
          <img src="{{avatar}}">\
      </a>\
      <div id="maxui-newactivity-box">\
           <textarea class="maxui-empty maxui-text-input">{{literals.new_activity_text}}</textarea>\
           <input disabled="disabled" type="button" class="maxui-button maxui-disabled" value="{{literals.new_activity_post}}">\
      </div>\
   </div>\
   {{/allowPosting}}\
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
               {{#publishedIn}}\
                   {{literals.context_published_in}}\
                   <a href="{{publishedIn.url}}">{{publishedIn.displayName}}</a>\
               {{/publishedIn}}\
               {{#via}}\
                   {{literals.generator_via}}\
                   <span class="maxui-via">\
                   {{via}}\
                   </span>\
               {{/via}}\
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
                <textarea class="maxui-empty maxui-text-input" id="maxui-commentBox">{{literals.new_comment_text}}</textarea>\
                <input disabled="disabled" type="button" class="maxui-button maxui-disabled" value="{{literals.new_comment_post}}"/>\
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
<div class="maxui-filter maxui-{{type}}" type="{{type}}" value="{{value}}"><span>{{prepend}}{{value}}<a class="close" href=""><img src="https://max.upc.edu/maxui/x.png" alt="tanca"></a></span></div>\
{{/filters}}\
';

var templates = {
    mainUI: Hogan.compile(MSTCH_MAXUI_MAIN_UI),
   postBox: Hogan.compile(MSTCH_MAXUI_POSTBOX),
  activity: Hogan.compile(MSTCH_MAXUI_ACTIVITY),
   comment: Hogan.compile(MSTCH_MAXUI_COMMENT),
  filters: Hogan.compile(MSTCH_MAXUI_FILTERS)
  }

  return templates
}