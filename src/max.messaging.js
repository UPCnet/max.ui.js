/*global SockJS */
/*global Stomp */
/*global uuid */
/**
 * @fileoverview
 */
'use strict';
var max = max || {};
(function(jq) {
    /** MaxMessaging
     *
     *
     */
    function MaxMessaging(maxui) {
        var self = this;
        self.logtag = 'MESSAGING';
        self.maxui = maxui;
        self.active = false;
        self.vhost = '/';
        self.max_retries = 3;
        self.retry_interval = 3000;
        // Collect info from seettings
        self.debug = self.maxui.settings.enableAlerts;
        self.token = self.maxui.settings.oAuthToken;
        self.stompServer = self.maxui.settings.maxTalkURL;
        // Construct login merging username with domain (if any)
        // if domain explicitly specified, take it, otherwise deduce it from url
        if (maxui.settings.domain) {
            self.domain = maxui.settings.domain;
        } else {
            self.domain = self.domainFromMaxServer(self.maxui.settings.maxServerURL);
        }
        self.login = "";
        if (self.domain) {
            self.login += self.domain + ':';
        }
        self.login += self.maxui.settings.username;
        // Start socket
        self.ws = new SockJS(self.stompServer);
        self.bindings = [];
        self.specification = {
            uuid: {
                id: 'g',
                type: 'string'
            },
            user: {
                id: 'u',
                type: 'object',
                fields: {
                    'username': {
                        'id': 'u'
                    },
                    'displayname': {
                        'id': 'd'
                    }
                }
            },
            action: {
                id: 'a',
                type: 'char',
                values: {
                    'add': {
                        id: 'a'
                    },
                    'delete': {
                        id: 'd'
                    },
                    'modify': {
                        id: 'm'
                    },
                    'refresh': {
                        id: 'r'
                    },
                    'ack': {
                        id: 'k'
                    }
                }
            },
            object: {
                id: 'o',
                type: 'char',
                values: {
                    'message': {
                        id: 'm'
                    },
                    'conversation': {
                        id: 'c'
                    },
                    'tweet': {
                        id: 't'
                    },
                    'activity': {
                        id: 'a'
                    },
                    'context': {
                        id: 'x'
                    },
                    'comment': {
                        id: 't'
                    }
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
                    max: {
                        id: 'm'
                    },
                    widget: {
                        id: 'w'
                    },
                    ios: {
                        id: 'i'
                    },
                    android: {
                        id: 'a'
                    },
                    tweety: {
                        id: 't'
                    },
                    maxbunny: {
                        id: 'b'
                    }
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
            }
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
            if (_.has(spec, 'fields') && spec.type === 'object') {
                spec.fields = {};
                _.each(svalue.fields, function(vvalue, vname, vlist) {
                    spec.fields[vvalue.id] = _.clone(vvalue);
                    spec.fields[vvalue.id].name = vname;
                    delete spec.fields[vvalue.id].id;
                });
            }
            spec.name = sname;
            delete spec.id;
            self._specification[svalue.id] = spec;
        });
    }
    MaxMessaging.prototype.domainFromMaxServer = function(server) {
        //var self = this;
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
        var server_without_trailing_slash = server.replace(/\/$/, "");
        var dummy_a = document.createElement('a');
        dummy_a.href = server_without_trailing_slash;
        return _.last(dummy_a.pathname.split('/'));
    };
    MaxMessaging.prototype.start = function() {
        var self = this;
        self.maxui.logger.info('Connecting ...', self.logtag);
        self.connect();
        var current_try = 1;
        // Retry connection if initial failed
        var interval = setInterval(function(event) {
            if (!self.active && current_try <= self.max_retries) {
                self.maxui.logger.debug('Connection retry #{0}'.format(current_try), self.logtag);
                self.ws.close();
                self.ws = new SockJS(self.maxui.settings.maxTalkURL);
                self.connect();
            } else {
                if (!self.active) {
                    self.maxui.logger.error('Connection failure after {0} reconnect attempts'.format(self.max_retries), self.logtag);
                }
                clearInterval(interval);
            }
            current_try += 1;
        }, self.retry_interval);
    };
    MaxMessaging.prototype.bind = function(params, callback) {
        var self = this;
        self.bindings.push({
            'key': self.pack(params),
            'callback': callback
        });
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
        if (_.isEmpty(matched_bindings)) {
            self.maxui.logger.warning('Ignoring received message\n{0}\n No binding found for this message'.format(message), self.logtag);
        } else {
            _.each(matched_bindings, function(binding, index, list) {
                self.maxui.logger.debug('Matched binding "{1}"'.format(message, binding.key), self.logtag);
                var unpacked = self.unpack(message);
                // format routing key to extract first part before dot (.)
                var destination = routing_key.replace(/(\w+)\.(.*)/g, "$1");
                unpacked.destination = destination;
                binding.callback(unpacked);
            });
        }
    };
    MaxMessaging.prototype.disconnect = function() {
        var self = this;
        self.stomp.disconnect();
        return;
    };
    MaxMessaging.prototype.connect = function() {
        var self = this;
        self.stomp = Stomp.over(self.ws);
        self.stomp.heartbeat.outgoing = 0;
        self.stomp.heartbeat.incoming = 0;
        self.stomp.debug = function(message) {
            self.maxui.logger.debug(message, self.logtag);
        };
        var product = 'maxui';
        if (self.maxui.settings.generator) {
            product += '[{0}]'.format(self.maxui.settings.generator);
        }
        var headers = {
            login: self.login,
            passcode: self.token,
            host: self.vhost,
            product: product,
            "product-version": self.maxui.version,
            platform: '{0} {1} / {2} {3}'.format(jq.ua.browser.name, jq.ua.browser.version, jq.ua.os.name, jq.ua.os.version)
        };
        var connectCallback = function(x) {
            self.stomp.subscribe('/exchange/{0}.subscribe'.format(self.maxui.settings.username), function(stomp_message) {
                var data = JSON.parse(stomp_message.body);
                var routing_key = /([^/])+$/.exec(stomp_message.headers.destination)[0];
                self.on_message(data, routing_key);
            });
            self.active = true;
            self.maxui.logger.info('Succesfully connected to {0}'.format(self.stompServer), self.logtag);
        };
        var errorCallback = function(error) {
            self.maxui.logger.error(error.body);
        };
        self.stomp.connect(headers, connectCallback, errorCallback);
    };
    MaxMessaging.prototype.pack = function(message) {
        var self = this;
        var packed = {};
        var packed_key;
        _.each(message, function(value, key, list) {
            var spec = self.specification[key];
            if (_.isUndefined(spec)) {
                // Raise ??
            } else {
                var packed_value;
                if (_.has(spec, 'values')) {
                    if (_.has(spec.values, value)) {
                        packed_value = spec.values[value].id;
                    }
                } else {
                    packed_value = value;
                    if (_.has(spec, 'fields') && spec.type === 'object' && _.isObject(packed_value)) {
                        var packed_inner = {};
                        _.each(message[key], function(inner_value, inner_key, inner_list) {
                            if (_.has(spec.fields, inner_key)) {
                                packed_key = spec.fields[inner_key].id;
                            } else {
                                packed_key = inner_key;
                            }
                            packed_inner[packed_key] = inner_value;
                        });
                        packed_value = packed_inner;
                    }
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
        var unpacked_key;
        _.each(message, function(value, key, list) {
            var spec = self._specification[key];
            if (_.isUndefined(spec)) {
                // Raise ??
            } else {
                var unpacked_value;
                // change packed value if field has a values mapping
                if (_.has(spec, 'values')) {
                    if (_.has(spec.values, value)) {
                        unpacked_value = spec.values[value].name;
                    }
                    // otherwise leave the raw value
                } else {
                    unpacked_value = value;
                    //change inner object keys if the field has a field keys mapping
                    if (_.has(spec, 'fields') && spec.type === 'object' && _.isObject(unpacked_value)) {
                        var unpacked_inner = {};
                        _.each(message[key], function(inner_value, inner_key, inner_list) {
                            if (_.has(spec.fields, inner_key)) {
                                unpacked_key = spec.fields[inner_key].name;
                            } else {
                                unpacked_key = inner_key;
                            }
                            unpacked_inner[unpacked_key] = inner_value;
                        });
                        unpacked_value = unpacked_inner;
                    }
                }
                // Include key/value only if the value is defined
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
            'version': self.maxui.version,
            'user': {
                'username': self.maxui.settings.username,
                'displayname': self.maxui.settings.displayName
            },
            'published': self.maxui.utils.rfc3339(self.maxui.utils.now()),
            'uuid': uuid.v1()
        };
        if (self.domain) {
            base.domain = self.domain;
        }
        // Overwrite any key-value pair in params already defined in base
        // Trim any key from params not in specification
        return _.extend(_.pick(params, _.keys(self.specification)), base);
    };
    MaxMessaging.prototype.send = function(message, routing_key) {
        var self = this;
        var message_unpacked = self.prepare(message);
        self.stomp.send('/exchange/{0}.publish/{1}'.format(self.maxui.settings.username, routing_key), {}, JSON.stringify(self.pack(message_unpacked)));
        return message_unpacked;
    };
    max.MaxMessaging = MaxMessaging;
})(jQuery);
