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

function MaxClient () {

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
                      share : '/activities/{0}/shares/{1}',
                      conversations : '/conversations',
                      messages: '/conversations/{0}/messages'
                   }
};

MaxClient.prototype.configure = function(settings) {
  this.url = settings.server
	this.mode = settings.mode
  this.token = settings.token
  this.actor = {
            "objectType": "person",
            "username": settings.username
        }

};

MaxClient.prototype.POST = function(route, query, callback) {
    maxclient = this
    resource_uri = '{0}{1}'.format(this.url, route)
    if (this.mode=='jquery')
    {
           jQuery.ajax( {url: resource_uri,
             beforeSend: function(xhr) {
                 xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                 xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                 xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
             },
			     type: 'POST',
			     data: JSON.stringify(query),
			     async: true,
			     dataType: 'json'
			    })
         .done( function(result) { callback.call(result) } )
         .fail( function(xhr) { jQuery(window).trigger('maxclienterror',xhr) })

    }
    else
    {
	    var params = {}
	    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON
	    params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST
	    params[gadgets.io.RequestParameters.REFRESH_INTERVAL] = 1
	    params[gadgets.io.RequestParameters.POST_DATA] = JSON.stringify(query)

      var headers = {"X-Oauth-Token": maxclient.token,
                     "X-Oauth-Username": maxclient.actor.username,
                     "X-Oauth-Scope": 'widgetcli'}
      params[gadgets.io.RequestParameters.HEADERS] = headers

	    gadgets.io.makeRequest(
	                   resource_uri,
	                   function(result) { callback.call(result.data) },
	                   params
	                    )


    }
    return true
};

MaxClient.prototype.GET = function(route, query, callback) {
    maxclient = this
    resource_uri = '{0}{1}'.format(this.url, route)
    if (Object.keys(query).length >0)
    {
        resource_uri+='?'+jQuery.param(query, true)
    }
    if (this.mode=='jquery')
    {
	    jQuery.ajax( {url: resource_uri,
             beforeSend: function(xhr) {
                 xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                 xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                 xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
             },
			     type: 'GET',
			     async: true,
			     dataType: 'json'
			    })
         .done( function(result) { callback.call(result) } )
         .fail( function(xhr) { jQuery(window).trigger('maxclienterror',xhr) })

	}
	else
	{
	    var params = {}
	    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON
	    params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.GET
	    params[gadgets.io.RequestParameters.REFRESH_INTERVAL] = 1

      var headers = {"X-Oauth-Token": maxclient.token,
                     "X-Oauth-Username": maxclient.actor.username,
                     "X-Oauth-Scope": 'widgetcli'}
      params[gadgets.io.RequestParameters.HEADERS] = headers

	    gadgets.io.makeRequest(
	                   resource_uri,
	                   function(result) { callback.call(result.data) },
	                   params
	                    )

     }
   //return {json:ajax_result,statuscode:xhr['statusText']}
   return true
	}

MaxClient.prototype.getUserTimeline = function(username, callback) {
	var route = this.ROUTES['timeline'].format(username);
  if (arguments.length>2)
      var query=arguments[2]
  else
      var query={}
  this.GET(route,query,callback)
};

MaxClient.prototype.getUserData = function(username, callback) {
    var route = this.ROUTES['user'].format(username);
    var query = {}
    this.GET(route,query,callback)
};

MaxClient.prototype.getActivities = function(username, context, callback) {
  var route = this.ROUTES['activities'];
  if (arguments.length>3)
    {
      query=arguments[3]
    }
  else
    {
      query={}
    }
  if (context)
      { //construir la query string
        query.context = context
       }
  this.GET(route,query,callback)
};

MaxClient.prototype.getConversationsForUser = function(username, callback) {
  var route = this.ROUTES['conversations'];
  query={}
  this.GET(route,query,callback)
};

MaxClient.prototype.getMessagesForConversation = function(hash, callback) {
  var route = this.ROUTES['messages'].format(hash);
  query={}
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
        { query.contexts = []
          for (ct=0;ct<contexts.length;ct++)
          {
            query.contexts.push({'objectType':'uri','url':contexts[ct]})
          }
        }

    query.object.content = text

    //We have a generator
    if (arguments.length>3)
        {
          query.generator = arguments[3]
        }

  	route = this.ROUTES['user_activities'].format(this.actor.username);
    this.POST(route,query,callback)
};


MaxClient.prototype.addMessage = function(text,participants,callback) {
    query = {
        "object": {
            "objectType": "message",
            "content": ""
            },
        "contexts": [ { 'objectType': 'conversation',
                        'participants': participants
                      }
                    ]
        }

    query.object.content = text

    route = this.ROUTES['conversations']
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
