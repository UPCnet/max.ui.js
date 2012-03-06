if (!Object.keys) {
    Object.keys = function (obj) {
        var keys = [],
            k;
        for (k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                keys.push(k);
            }
        }
        return keys;
    };
}

String.prototype.format = function(){
    var pattern = /\{\d+\}/g;
    var args = arguments;
    return this.replace(pattern, function(capture){ return args[capture.match(/\d+/)]; });
    }

function MaxClient (url) {
    this.url = url;
    this.mode = 'jquery'

    this.ROUTES = {   users : '/people',
                      user : '/people/{0}',
                      avatar : '/people/{0}/avatar',
                      user_activities : '/people/{0}/activities',
                      timeline : '/people/{0}/timeline',
                      user_comments : '/people/{0}/comments',
                      user_shares : '/people/{0}/shares',
                      user_likes : '/people/{0}/likes',
                      follows : '/people/{0}/follows',
                      follow : '/people/{0}/follows/{1}',
                      subscriptions : '/people/{0}/subscriptions',
                      activities : '/activities',
                      activity : '/activities/{0}',
                      comments : '/activities/{0}/comments',
                      comment : '/activities/{0}/comments/{1}',
                      likes : '/activities/{0}/likes',
                      like : '/activities/{0}/likes/{1}',
                      shares : '/activities/{0}/shares',
                      share : '/activities/{0}/shares/{1}'
                   }
};

MaxClient.prototype.setMode = function(mode) {
	this.mode = mode

};

MaxClient.prototype.setActor = function(username) {
	this.actor = {
            "objectType": "person",
            "username": username
        }
};

MaxClient.prototype.POST = function(route, query, callback) {
    resource_uri = '{0}{1}'.format(this.url, route)
    if (this.mode=='jquery')
    {
           jQuery.ajax( {url: resource_uri,
             beforeSend: function(xhr) {
                 xhr.setRequestHeader("X-Oauth-Token", _MAXUI.settings.oAuthToken);
                 xhr.setRequestHeader("X-Oauth-Username", _MAXUI.settings.username);
                 xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
             },
			     type: 'POST',
			     data: JSON.stringify(query),
			     async: true,
			     dataType: 'json'
			    }
			   ).always(function(result,status,xhr) {
              if (xhr.status==200 | xhr.status==201)
                  callback.call(result)
         });
    }
    else
    {
	    var params = {}
	    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON
	    params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST
	    params[gadgets.io.RequestParameters.REFRESH_INTERVAL] = 1
	    params[gadgets.io.RequestParameters.POST_DATA] = JSON.stringify(query)

      var headers = {"X-Oauth-Token": _MAXUI.settings.oAuthToken,
                     "X-Oauth-Username": _MAXUI.settings.username,
                     "X-Oauth-Scope": 'widgetcli'}
      params[gadgets.io.RequestParameters.HEADERS] = headers

      console.log(params)

	    gadgets.io.makeRequest(
	                   resource_uri,
	                   function(result) { callback.call(result.data) },
	                   params
	                    )


    }
    return true
};

MaxClient.prototype.GET = function(route, query, callback) {
    resource_uri = '{0}{1}'.format(this.url, route)
    if (Object.keys(query).length >0)
    {
        resource_uri+='?'+jQuery.param(query, true)
    }
    if (this.mode=='jquery')
    {
	    jQuery.ajax( {url: resource_uri,
             beforeSend: function(xhr) {
                 xhr.setRequestHeader("X-Oauth-Token", _MAXUI.settings.oAuthToken);
                 xhr.setRequestHeader("X-Oauth-Username", _MAXUI.settings.username);
                 xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
             },
			     type: 'GET',
			     async: true,
			     dataType: 'json'
			    }
			   ).always(function(result,status,xhr) {
              if (xhr.status==200 | xhr.status==201)
                  callback.call(result)
         });
	}
	else
	{
	    var params = {}
	    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON
	    params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.GET
	    params[gadgets.io.RequestParameters.REFRESH_INTERVAL] = 1

      var headers = {"X-Oauth-Token": _MAXUI.settings.oAuthToken,
                     "X-Oauth-Username": _MAXUI.settings.username,
                     "X-Oauth-Scope": 'widgetcli'}
      params[gadgets.io.RequestParameters.HEADERS] = headers

	    gadgets.io.makeRequest(
	                   resource_uri,
	                   function(result) { console.log(data);callback.call(result.data) },
	                   params
	                    )

     }
   //return {json:ajax_result,statuscode:xhr['statusText']}
   return true
	}

MaxClient.prototype.getUserTimeline = function(username, callback) {
	var route = this.ROUTES['timeline'].format(username);
  if (arguments.length>2)
      query=arguments[3]
  else
      query={}

  this.GET(route,query,callback)
};


MaxClient.prototype.getActivities = function(username, contexts, callback) {
  var route = this.ROUTES['activities'];
  if (arguments.length>3)
    {
      query=arguments[3]
    }
  else
    {
      query={}
    }
  if (contexts.length>0)
      { //construir la query string
        query.contexts = contexts
       }
  this.GET(route,query,callback)
};


MaxClient.prototype.getCommentsForActivity = function(activityid, callback) {
  route = this.ROUTES['comments'].format(activityid);
  var query = {}
  this.GET(route,query,callback)
};


MaxClient.prototype.addComment = function(comment, activity, callback) {

    var query = {
        "actor": {},
        "object": {
            "objectType": "comment",
            "content": ""
            }
        }

    query.actor = this.actor
    query.object.content = comment

	  route = this.ROUTES['comments'].format(activity);
    this.POST(route,query,callback)

};


MaxClient.prototype.addActivity = function(text,contexts,callback) {
    query = {
        "object": {
            "objectType": "note",
            "content": ""
            }
        }
    if (contexts.length>0)
       { query.contexts = contexts }
    query.object.content = text

	route = this.ROUTES['user_activities'].format(this.actor.username);
    this.POST(route,query,callback)
};

MaxClient.prototype.follow = function(username, callback ) {
    query = {
        "object": {
            "objectType": "person",
            "username": ""
            }
        }

    query.object.username = username

	route = this.ROUTES['follow'].format(this.actor.username,username);
    resp = this.POST(route,query)
};
