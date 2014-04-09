/**
* @fileoverview
*/
var max = max || {};

(function(jq) {

    /** MaxMessaging
    *
    *
    */

    function MaxMessaging(maxui) {
        var self = this;
        self.maxui = maxui;
        self.active = false;
        self.vhost = '/';

        // Collect info from seettings
        self.debug = maxui.settings.enableAlerts;
        self.username = maxui.settings.username;
        self.token = maxui.settings.oAuthToken;
        self.stompServer = maxui.settings.maxTalkURL;

        // Construct login merging username with domain (if any)
        self.domain = self.domainFromMaxServer(maxui.settings.maxServerURL);
        self.login = "";
        if (self.domain) {
            self.login += self.domain + ':';
        }
        self.login += maxui.settings.username;

        // Start socket
        self.ws = new SockJS(self.stompServer);
        self.bindings = [];

        self.specification = {
            user: {
                id: 'u',
                type: 'string'
            },
            action: {
                id: 'a',
                type: 'char',
                values: {
                    'add': {id: 'a'},
                    'delete': {id: 'd'},
                    'modify': {id: 'm'}
                }
            },
            object: {
                id: 'o',
                type: 'char',
                values: {
                    'message': {id: 'm'},
                    'conversation': {id: 'c'}
                }
            },
            data: {
                id: 'd',
                type: 'object'
            },
            source: {
                id: 's',
                type: 'char',
                values: {
                    max: {id: 'm'},
                    widget: {id: 'w'},
                    ios: {id: 'i'},
                    android: {id: 'a'}
                }
            },
            domain: {
                id: 'i',
                type: 'string'
            },
            version: {
                id: 'v',
                type: 'string'
            },
            published: {
                id: 'p',
                type: 'date'
            },
        };

        // invert specification to acces by packed value
        self._specification = {};
        _.each(self.specification, function(svalue, sname, slist) {
            var spec = _.clone(svalue);
            if (_.has(spec, 'values')) {
                spec.values = {};
                _.each(svalue.values, function(vvalue, vname, vlist) {
                    spec.values[vvalue.id] = _.clone(vvalue);
                    spec.values[vvalue.id].name = vname;
                    delete spec.values[vvalue.id].id;
                });
            }
            spec.name = sname;
            delete spec.id;
            self._specification[svalue.id] = spec;
        });
    }

    MaxMessaging.prototype.domainFromMaxServer = function(server) {
        var self = this;
        // Extract domain out of maxserver url, if present
        // Matches several cases, but always assumes the domain is the last
        // part of the path. SO, urls with subpaths, always will be seen as a
        // domain urls, examples:
        //
        // http://max.upcnet.es  --> NO DOMAIN
        // http://max.upcnet.es/  --> NO DOMAIN
        // http://max.upcnet.es/demo  --> domain "demo"
        // http://max.upcnet.es/demo/  --> domain "demo"
        // http://max.upcnet.es/subpath/demo/  --> domain "demo"
        // http://max.upcnet.es/subpath/demo  --> domain "demo"
        server_regex = regex = /(?:^https?:\/\/)*(.*?)(?:\/([^\/]*)+)?\/?$/g;
        groups = regex.exec(server);
        if (groups[2]) {
            return groups[2];
        }

    };

    MaxMessaging.prototype.start = function() {
        var self = this;
        self.connect();

        // Retry connection if initial failed
        interval = setInterval(function(event) {
            if (!self.active) {
                console.log('connection timeout, retrying');
                self.ws.close();
                self.ws = new SockJS(maxui.settings.maxTalkURL);
                self.connect();
            } else {
                clearInterval(interval);
            }
        }, 2000);
    };

    MaxMessaging.prototype.bind = function(params, callback) {
        var self = this;
        self.bindings.push({'key': self.pack(params), 'callback': callback});
    };

    MaxMessaging.prototype.on_message = function(message, routing_key) {
        var self = this;
        var matched_bindings = _.filter(self.bindings, function(binding) {
            // compare the stored binding key with a normalized key from message
            var bind_key = _.pick(message, _.keys(binding.key));
            if (_.isEqual(binding.key, bind_key)) {
                    return binding;
                    }
        });
        if (self.debug && _.isEmpty(matched_bindings)) {
            console.error('No defined binding found for this message');
        } else {
            _.each(matched_bindings, function(binding, index, list) {
                var unpacked = self.unpack(message);
                // format routing key to extract first part before dot (.)
                destination = routing_key.replace(/(\w+)\.(.*)/g, "$1");
                unpacked.destination = destination;
                binding.callback(unpacked);
            });
        }
    };

    MaxMessaging.prototype.connect = function() {
        var self = this;
        self.stomp = Stomp.over(self.ws);
        self.stomp.heartbeat.outgoing = 0;
        self.stomp.heartbeat.incoming = 0;

        if (self.debug) self.stomp.debug = function(message) {
            console.log(message);
        };

        self.stomp.connect(
            self.username,
            self.token,
            // Define stomp stomp ON CONNECT callback
            function(x) {
                self.stomp.subscribe('/exchange/{0}.subscribe'.format(self.maxui.settings.username), function(stomp_message) {
                   var data = JSON.parse(stomp_message.body);
                   var routing_key = /([^/])+$/.exec(stomp_message.headers.destination)[0];
                   self.on_message(data, routing_key);
                });
                self.active = true;
            },
            // Define stomp stomp ON ERROR callback
            function(error) {
                console.log(error.body);
            },
            self.vhost);
    };

    MaxMessaging.prototype.pack = function(message) {
        var self = this;
        var packed = {};
        var packed_value;
        _.each(message, function(value, key, list){
            var spec = self.specification[key];
            if (_.isUndefined(spec)) {
                // Raise ??
            } else {
                packed_value = undefined;
                if (_.has(spec, 'values')) {
                    if (_.has(spec.values, value)) {
                        packed_value = spec.values[value].id;
                    }
                } else {
                    packed_value = value;
                }
                if (!_.isUndefined(packed_value)) {
                    packed[spec.id] = packed_value;
                }
            }
        });
        return packed;
    };

    MaxMessaging.prototype.unpack = function(message) {
        var self = this;
        var unpacked = {};
        var unpacked_value;
        _.each(message, function(value, key, list){
            var spec = self._specification[key];
            if (_.isUndefined(spec)) {
                // Raise ??
            } else {
                unpacked_value = undefined;
                if (_.has(spec, 'values')) {
                    if (_.has(spec.values, value)) {
                        unpacked_value = spec.values[value].name;
                    }
                } else {
                    unpacked_value = value;
                }
                if (!_.isUndefined(unpacked_value)) {
                    unpacked[spec.name] = unpacked_value;
                }
            }
        });
        return unpacked;
    };

    MaxMessaging.prototype.prepare = function(params) {
        var self = this;
        var base = {
            'source': 'widget',
            'version': maxui.version,
            'user': self.username,
            'domain': self.domain,
            'published': maxui.utils.rfc3339(maxui.utils.now()),
        };
        // Overwrite any key-value pair in params already defined in base
        // Trim any key from params not in specification
        return _.extend(_.pick(params, _.keys(self.specification)), base);
    };

    MaxMessaging.prototype.send = function(message, routing_key) {
        var self = this;
        var message_unpacked = self.prepare(message);
        result = self.stomp.send('/exchange/{0}.publish/{1}'.format(self.username, routing_key), {}, JSON.stringify(self.pack(message_unpacked)));
        return message_unpacked;
    };


max.MaxMessaging = MaxMessaging;

})(jQuery);
