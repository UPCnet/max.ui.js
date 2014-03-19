if (!Object.keys) {
    Object.keys = function(obj) {
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
String.prototype.format = function() {
    var pattern = /\{\d+\}/g;
    var args = arguments;
    return this.replace(pattern, function(capture) {
        return args[capture.match(/\d+/)];
    });
};

function MaxClient() {
    this.ROUTES = {
        users: '/people',
        user: '/people/{0}',
        avatar: '/people/{0}/avatar',
        user_activities: '/people/{0}/activities',
        timeline: '/people/{0}/timeline',
        user_comments: '/people/{0}/comments',
        user_shares: '/people/{0}/shares',
        user_likes: '/people/{0}/likes',
        follows: '/people/{0}/follows',
        follow: '/people/{0}/follows/{1}',
        subscriptions: '/people/{0}/subscriptions',
        activities: '/contexts/{0}/activities',
        activity: '/activities/{0}',
        comments: '/activities/{0}/comments',
        comment: '/activities/{0}/comments/{1}',
        likes: '/activities/{0}/likes',
        like: '/activities/{0}/likes/{1}',
        favorites: '/activities/{0}/favorites',
        favorite: '/activities/{0}/favorites/{1}',
        shares: '/activities/{0}/shares',
        share: '/activities/{0}/shares/{1}',
        conversations: '/conversations',
        conversation: '/conversations/{0}',
        conversation_owner: '/conversations/{0}/owner',
        user_conversation: '/people/{0}/conversations/{1}',
        messages: '/conversations/{0}/messages',
        context: '/contexts/{0}'
    };
}
MaxClient.prototype.configure = function(settings) {
    this.url = settings.server;
    this.mode = settings.mode;
    this.token = settings.token;
    this.actor = {
        "objectType": "person",
        "username": settings.username
    };
};
MaxClient.prototype.POST = function(route, query, callback) {
    maxclient = this;
    resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 3) triggers = arguments[3];
    if (this.mode == 'jquery') {
        jQuery.ajax({
            url: resource_uri,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
            },
            type: 'POST',
            data: JSON.stringify(query),
            async: true,
            dataType: 'json'
        }).done(function(result) {
            callback.call(result);
            if (triggers.done) jQuery(window).trigger(triggers.done, result);
        }).fail(function(xhr) {
            jQuery(window).trigger('maxclienterror', xhr);
            if (triggers.fail) jQuery(window).trigger(triggers.fail, xhr);
        });
    }
    return true;
};
MaxClient.prototype.PUT = function(route, query, callback) {
    maxclient = this;
    resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 3) triggers = arguments[3];
    if (this.mode == 'jquery') {
        jQuery.ajax({
            url: resource_uri,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
                xhr.setRequestHeader("X-HTTP-Method-Override", 'PUT');
            },
            type: 'POST',
            data: JSON.stringify(query),
            async: true,
            dataType: 'json'
        }).done(function(result) {
            callback.call(result);
            if (triggers.done) jQuery(window).trigger(triggers.done, result);
        }).fail(function(xhr) {
            jQuery(window).trigger('maxclienterror', xhr);
            if (triggers.fail) jQuery(window).trigger(triggers.fail, xhr);
        });
    }
    return true;
};
MaxClient.prototype.DELETE = function(route, query, callback) {
    maxclient = this;
    resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 2) triggers = arguments[2];
    if (this.mode == 'jquery') {
        jQuery.ajax({
            url: resource_uri,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
                xhr.setRequestHeader("X-HTTP-Method-Override", 'DELETE');
            },
            type: 'POST',
            data: JSON.stringify(query),
            async: true,
            dataType: 'json'
        }).done(function(result) {
            callback.call(result);
            if (triggers.done) jQuery(window).trigger(triggers.done, result);
        }).fail(function(xhr) {
            jQuery(window).trigger('maxclienterror', xhr);
            if (triggers.fail) jQuery(window).trigger(triggers.fail, xhr);
        });
    }
    return true;
};
MaxClient.prototype.GET = function(route, query, callback) {
    maxclient = this;
    resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 3) triggers = arguments[3];
    if (Object.keys(query).length > 0) {
        resource_uri += '?' + jQuery.param(query, true);
    }
    if (this.mode == 'jquery') {
        jQuery.ajax({
            url: resource_uri,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
            },
            type: 'GET',
            async: true,
            dataType: 'json'
        }).done(function(result) {
            if (triggers.done) jQuery(window).trigger(triggers.done);
            callback.call(result);
        }).fail(function(xhr) {
            jQuery(window).trigger('maxclienterror', xhr);
            if (triggers.fail) jQuery(window).trigger(triggers.fail);
        });
    }
    return true;
};
MaxClient.prototype.getUserTimeline = function(username, callback) {
    var route = this.ROUTES.timeline.format(username);
    var query = {};
    if (arguments.length > 2) query = arguments[2];
    this.GET(route, query, callback);
};
MaxClient.prototype.getUserData = function(username, callback) {
    var route = this.ROUTES.user.format(username);
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.getUsersList = function(userquery, callback) {
    var route = this.ROUTES.users;
    var query = {
        username: userquery
    };
    this.GET(route, query, callback);
};
MaxClient.prototype.getContext = function(chash, callback) {
    var route = this.ROUTES.context.format(chash);
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.getActivities = function(options, callback) {
    var route = this.ROUTES.activities.format(options.context);
    var query = {};
    if (arguments.length > 2) query = arguments[2];
    if (options.tags)
        if (options.tags.length > 0) query.context_tags = options.tags;
    this.GET(route, query, callback);
};
MaxClient.prototype.getConversation = function(chash, callback) {
    var route = this.ROUTES.conversation.format(chash);
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.modifyConversation = function(chash, displayName, callback) {
    var query = {
        "displayName": displayName
    };
    route = this.ROUTES.conversation.format(chash);
    this.PUT(route, query, callback);
};
MaxClient.prototype.addUserToConversation = function(chash, username, callback) {
    var query = {};
    var route = this.ROUTES.user_conversation.format(username, chash);
    this.POST(route, query, callback);
};
MaxClient.prototype.transferConversationOwnership = function(chash, username, callback) {
    var query = {
        "actor": {
            "username": username
        }
    };
    route = this.ROUTES.conversation_owner.format(chash);
    this.PUT(route, query, callback);
};
MaxClient.prototype.getConversationsForUser = function(username, callback) {
    var route = this.ROUTES.conversations;
    query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.getMessagesForConversation = function(hash, callback) {
    var route = this.ROUTES.messages.format(hash);
    query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.getCommentsForActivity = function(activityid, callback) {
    route = this.ROUTES.comments.format(activityid);
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.addComment = function(comment, activity, callback) {
    var query = {
        "actor": {},
        "object": {
            "objectType": "comment",
            "content": ""
        }
    };
    query.actor = this.actor;
    query.object.content = comment;
    route = this.ROUTES.comments.format(activity);
    this.POST(route, query, callback);
};
MaxClient.prototype.addActivity = function(text, contexts, callback) {
    query = {
        "object": {
            "objectType": "note",
            "content": ""
        }
    };
    if (contexts.length > 0) {
        query.contexts = [];
        for (ct = 0; ct < contexts.length; ct++) {
            query.contexts.push({
                'objectType': 'context',
                'url': contexts[ct]
            });
        }
    }
    query.object.content = text;
    //We have a generator
    if (arguments.length > 3) {
        query.generator = arguments[3];
    }
    route = this.ROUTES.user_activities.format(this.actor.username);
    trigger = {
        'done': 'maxui-posted-activity',
        'fail': 'maxui-failed-activity'
    };
    this.POST(route, query, callback, trigger);
};
MaxClient.prototype.removeActivity = function(activity_id, callback) {
    route = this.ROUTES.activity.format(activity_id);
    this.DELETE(route, {}, callback);
};
MaxClient.prototype.removeActivityComment = function(activity_id, comment_id, callback) {
    route = this.ROUTES.comment.format(activity_id, comment_id);
    this.DELETE(route, {}, callback);
};
MaxClient.prototype.addMessageAndConversation = function(params, callback) {
    query = {
        "object": {
            "objectType": "note",
            "content": params.message
        },
        "contexts": [{
                'objectType': 'conversation',
                'participants': params.participants
                      }
                    ]
    };
    if (params.displayName) {
        query.contexts[0].displayName = params.displayName;
    }
    route = this.ROUTES.conversations;
    this.POST(route, query, callback);
};
MaxClient.prototype.addMessage = function(text, chash, callback) {
    query = {
        "object": {
            "objectType": "note",
            "content": ""
        }
    };
    query.object.content = text;
    route = this.ROUTES.messages.format(chash);
    this.POST(route, query, callback);
};
MaxClient.prototype.follow = function(username, callback) {
    query = {
        "object": {
            "objectType": "person",
            "username": ""
        }
    };
    query.object.username = username;
    route = this.ROUTES.follow.format(this.actor.username, username);
    resp = this.POST(route, query, callback);
};
MaxClient.prototype.favoriteActivity = function(activityid, callback) {
    query = {};
    route = this.ROUTES.favorites.format(activityid);
    resp = this.POST(route, query, callback);
};
MaxClient.prototype.unfavoriteActivity = function(activityid, callback) {
    query = {};
    route = this.ROUTES.favorite.format(activityid, this.actor.username);
    resp = this.DELETE(route, query, callback);
};
MaxClient.prototype.likeActivity = function(activityid, callback) {
    query = {};
    route = this.ROUTES.likes.format(activityid);
    resp = this.POST(route, query, callback);
};
MaxClient.prototype.unlikeActivity = function(activityid, callback) {
    query = {};
    route = this.ROUTES.like.format(activityid, this.actor.username);
    resp = this.DELETE(route, query, callback);
};
