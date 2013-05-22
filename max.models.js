var max = max || {};

/**
 * @fileoverview Max backbones views definition
 */

max.models = function(settings) {

    /*
    *    Main interface view, this holds
    *    All the other subviews
    *
    *    @param {el} the element where to instantiate the view
    */

    // Setup authentication settings to be accessed
    // By Backbone in the closure
    var settings = settings
    var auth = {
        username: settings.username,
        token: settings.oAuthToken
    }

    // Enable POST Tunneling
    Backbone.emulateHTTP = true

    // Backbone Sync override with max custom headers
    var originalSync = Backbone.sync
    Backbone.sync = function(method, model, options) {

        options.headers = options.headers || {}
        _.extend(options.headers, {
            "X-Oauth-Token": auth.token,
            "X-Oauth-Username": auth.username,
            "X-Oauth-Scope": "widgetcli"
        })
        return originalSync.apply(this, [method, model, options])
    }

    var User = Backbone.Model.extend({
        idAttribute: 'username',
        urlRoot: '{0}/people'.format(settings.maxServerURL),
        defaults: {
            username: '',
            displayName: ''
        },

        initialize: function(){

        },

        getSubscriptions: function() {
            var userSubscriptions = {},
                subscribedTo = this.get('subscribedTo')

            if (subscribedTo.items.length>0)
                for (sc=0;sc<subscribedTo.items.length;sc++)
                {
                    var subscription = subscribedTo.items[sc]
                    userSubscriptions[subscription.url]={}
                    userSubscriptions[subscription.url]['permissions']={}
                    for (pm=0;pm<subscription.permissions.length;pm++)
                    {
                        var permission=subscription.permissions[pm]
                        userSubscriptions[subscription.url]['permissions'][permission]=true
                    }
                }

            return userSubscriptions
        },

        canWrite: function() {

            // Determine write permission, granted by default if we don't find a restriction
            var canwrite = true

            // If we don't have a context, we're in timeline, so we can write
            if (this.context)
            {
                // Add read context if user is not subscribed to it{
                var subscriptions = this.getSubscriptions()
                if (!subscriptions[this.context.hash])
                {
                    subscriptions[this.context.hash]={}
                    subscriptions[this.context.hash]['permissions']={}

                    // Check only for public defaults, as any other permission would require
                    // a susbcription, that we already checked that doesn't exists
                    subscriptions[this.context.hash]['permissions']['read'] = this.context.permissions.read=='public'
                    subscriptions[this.context.hash]['permissions']['write'] = this.context.permissions.write=='public'
                }

                // Iterate through all the defined write contexts to check for write permissions on
                // the current user
                for (wc=0;wc<maxui.settings.writeContexts.length;wc++)
                    {
                        var write_context = maxui.settings.writeContextsHashes[wc]
                        if (subscriptions[write_context]['permissions'])
                        {
                          if (subscriptions[write_context]['permissions'].write==false)
                          {
                              maxui.settings.canwrite = false
                          }
                        }
                        else { maxui.settings.canwrite = false }
                    }
            }

        }


    }) // End User model


    // Collection that returns the inner `items` attribute of the
    // json returned by calls to the server, in response
    // to calls to the fetch or reset collection methods

    var MaxCollection = Backbone.Model.extend({
        parse: function(resp, options) {
            return resp.items;
        },
    })

    var Activity = Backbone.Model.extend({
        idAttribute: 'id',
        urlRoot: '{0}/activities'.format(settings.maxServerURL),

        initialize: function(){

        }
    })

    var Comment = Backbone.Model.extend({
        idAttribute: 'id',
        urlRoot: '{0}/activities/{1}/comments'.format(settings.maxServerURL, options.activity_id),

        initialize: function(){

        }
    })

    var ActivityComments = MaxCollection.extend({
        model: Comment,
        url: '{0}/activities/{1}/comments'.format(settings.maxServerURL, options.activity_id),
    })

    var UserActivity = Activity.extend({
        urlRoot: '{0}/people/{1}/activities'.format(settings.maxServerURL, settings.username),

        initialize: function(){

        }
    })

    var Timeline = MaxCollection.extend({
        model: Activity,
        url: '{0}/people/{1}/timeline'.format(settings.maxServerURL, settings.username),
    })
    // Expose models to the world

    return {
        User: User,
        UserActivity: UserActivity,
        Timeline: Timeline
        Comment: Comment,
        ActivityComments: ActivityComments
    }
}