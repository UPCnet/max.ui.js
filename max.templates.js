

// construct and compile templates
var MSTCH_MAXUI_MAIN_UI = '\
<div id="maxui">\
{{#username}}\
   <div id="newactivity">\
       <textarea>{{newActivityText}}}</textarea>\
       <input type="button" class="send" value="{{newActivitySendButton}}">\
   </div>\
   <div id="timeline">\
      <div id="wrapper">\
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
<div id="activities">\
{{username}} activity goodness\
</div>\
';

var MAXUI_MAIN_UI = Hogan.compile(MSTCH_MAXUI_MAIN_UI);
var MAXUI_ACTIVITIES = Hogan.compile(MSTCH_MAXUI_ACTIVITIES);

