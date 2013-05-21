var max = max || {};

// Backbone Sync override with max custom headers

// var originalSync = Backbone.sync
// Backbone.sync = function(method, model, options) {
//     options.headers = options.headers || {}
//     _.extend(options.headers, {
//         "X-Oauth-Token": "",
//         "X-Oauth-Username": "carles.bruguera",
//         "X-Oauth-Scope": "widgetcli"
//     })
//     originalSync.call(model, method, models, options)
// }

// Enable POST Tunneling

Backbone.emulateHTTP = true

/**
 * @fileoverview Max backbones views definition
 */


max.models = function(options) {

    var options = options

    /*
    *    Main interface view, this holds
    *    All the other subviews
    *
    *    @param {el} the element where to instantiate the view
    */

    var User = Backbone.Model.extend({
        initialize: function(){

        },
        urlRoot: '{0}/people'.format(options.maxServerURL),
        defaults: {
            username: '',
            displayName: ''
        }

    })

    return {
        User: User
    }
}