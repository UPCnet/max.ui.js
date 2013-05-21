var max = max || {};

/**
 * @fileoverview Max backbones views definition
 */

max.models = function(options) {

    var auth = {
        username: options.username,
        token: options.token
    }

    /*
    *    Main interface view, this holds
    *    All the other subviews
    *
    *    @param {el} the element where to instantiate the view
    */

    // Enable POST Tunneling
    Backbone.emulateHTTP = true

    // Backbone Sync override with max custom headers
    var originalSync = Backbone.sync
    Backbone.sync = function(method, model, options) {

        options.headers = options.headers || {}
        _.extend(options.headers, {
            "X-Oauth-Token": options.auth.token,
            "X-Oauth-Username": options.auth.username,
            "X-Oauth-Scope": "widgetcli"
        })
        return originalSync.apply(this, [method, model, options])
    }

    // Backbone fetch override to inject custom authorization
    var originalFetch = Backbone.Model.prototype.fetch
    Backbone.Model.prototype.fetch =  function(options) {
      options = options || {}
      _.extend(options.auth = auth)
      return originalFetch.apply(this, [options])
    }


    var User = Backbone.Model.extend({
        idAttribute: 'username',
        urlRoot: '{0}/people'.format(options.maxServerURL),
        defaults: {
            username: '',
            displayName: ''
        },

        initialize: function(){

        }
    })

    // Expose models to the world

    return {
        User: User
    }
}