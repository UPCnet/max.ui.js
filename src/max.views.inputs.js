/*jshint multistr: true */
/**
 * @fileoverview
 */
'use strict';
var max = max || {};
(function(jq) {
    var views = function() {
        /** MaxPredictive.
         * Provides a dropdown list with autocompletion results
         * on top of a input, triggering events
         */
        function MaxPredictive(options) {
            var self = this;
            self.minchars = options.minchars;
            self.maxui = options.maxui;
            self.source = options.source;
            self.action = options.action;
            self.filter = options.filter;
            self.requests = {};
            self.$el = jq(options.list);
            self.$list = self.$el.find('ul');
            self.$el.on('click', '.maxui-prediction', function(event) {
                var $clicked = jq(event.currentTarget);
                self.select($clicked);
                self.choose(event);
            });
        }
        MaxPredictive.prototype.select = function($element) {
            var self = this;
            var $selected = self.$list.find('.maxui-prediction.selected');
            $selected.removeClass('selected');
            $element.addClass('selected');
        };
        MaxPredictive.prototype.choose = function(event) {
            var self = this;
            var $selected = self.$list.find('.maxui-prediction.selected');
            this.action.apply(self, [$selected]);
            self.hide();
        };
        MaxPredictive.prototype.moveup = function(event) {
            var self = this;
            var $selected = self.$list.find('.maxui-prediction.selected');
            var $prev = $selected.prev();
            if ($prev.length > 0) {
                self.select($prev);
            } else {
                self.select($selected.siblings(':last'));
            }
        };
        MaxPredictive.prototype.movedown = function(event) {
            var self = this;
            var $selected = self.$list.find('.maxui-prediction.selected');
            var $next = $selected.next();
            $selected.removeClass('selected');
            if ($next.length > 0) {
                self.select($next);
            } else {
                self.select($selected.siblings(':first'));
            }
        };
        MaxPredictive.prototype.matchingRequest = function(text) {
            var self = this;
            var previous_request;
            var previous_text = text.substr(0, text.length - 1);
            jq.each(self.requests, function(key, value) {
                if (previous_text === key) {
                    previous_request = value;
                }
            });
            if (previous_request && !previous_request.remaining) {
                // We have a previous request (-1) and the server told us that there's no remaining items
                // so we return the key of the stored request to use
                return previous_request.text;
            }
        };
        MaxPredictive.prototype.normalizeWhiteSpace = function(s, multi) {
            s = s.replace(/(^\s*)|(\s*$)/gi, "");
            s = s.replace(/\n /, "\n");
            var trimMulti = true;
            if (arguments.length > 1) {
                trimMulti = multi;
            }
            if (trimMulti === true) {
                s = s.replace(/[ ]{2,}/gi, " ");
            }
            return s;
        };
        // Fetch new predictions from source if needed, and render them
        // Also, predictions are stored in self.requests, so we try to repeat request only when needed
        // Algorith:
        //   1 - if the request is repeated, use the stored request
        //   2 - if we have a request that is shorter than 10, filter and use it, as there isn't more data in server to show
        //   3 - if we don't have any matching data for the current request, fetch it
        MaxPredictive.prototype.show = function(event) {
            var self = this;
            var $input = jq(event.target);
            var text = self.normalizeWhiteSpace($input.val(), false);
            if (text.length >= this.minchars) {
                var matching_request = self.matchingRequest(text);
                if (self.requests.hasOwnProperty(text)) {
                    self.render(text, text);
                } else if (matching_request) {
                    self.render(text, matching_request);
                } else {
                    this.source.apply(this, [event, text,
                        function(data) {
                            self.requests[text] = {
                                text: text,
                                data: data,
                                remaining: this.getResponseHeader('X-Has-Remaining-Items')
                            };
                            self.render(text, text);
                        }]);
                }
            } else {
                self.hide();
            }
        };
        MaxPredictive.prototype.render = function(query, request) {
            var self = this;
            var predictions = '';
            var items = self.requests[request].data;
            var filter = self.filter();
            // Iterate through all the users returned by the query
            var selected_index = false;
            for (var i = 0; i < items.length; i++) {
                var prediction = items[i];
                // Only add predictions of users that are not already in the conversation
                // and that match the text query search, 'cause we could be reading a used request
                var query_matches_username = prediction.username.search(new RegExp(query, "i")) >= 0;
                var query_matches_displayname = prediction.displayName.search(new RegExp(query, "i")) >= 0;
                var prediction_matches_query = query_matches_displayname || query_matches_username;
                if (filter.indexOf(prediction.username) === -1 && prediction_matches_query) {
                    var avatar_url = self.maxui.settings.avatarURLpattern.format(prediction.username);
                    var params = {
                        username: prediction.username,
                        displayName: prediction.displayName,
                        avatarURL: avatar_url,
                        cssclass: 'maxui-prediction' + (!selected_index && ' selected' || '')
                    };
                    // Render the conversations template and append it at the end of the rendered conversations
                    predictions = predictions + self.maxui.templates.predictive.render(params);
                    selected_index = true;
                }
            }
            if (predictions === '') {
                predictions = '<li>' + self.maxui.settings.literals.no_match_found + '</li>';
            }
            self.$list.html(predictions);
            self.$el.show();
        };
        MaxPredictive.prototype.hide = function(event) {
            var self = this;
            self.$el.hide();
        };
        /** MaxInput.
         * Provides common features for a input that shows/hides a placeholder on focus
         * and triggers events on ENTER and ESC
         */
        function MaxInput(options) {
            var self = this;
            self.input = options.input;
            self.$input = jq(self.input);
            self.placeholder = options.placeholder;
            self.$delegate = jq(options.delegate);
            self.setBindings();
            self.bindings = options.bindings;
            // Initialize input value with placeholder
            self.$input.val(self.placeholder);
        }
        MaxInput.prototype.normalizeWhiteSpace = function(s, multi) {
            s = s.replace(/(^\s*)|(\s*$)/gi, "");
            s = s.replace(/\n /, "\n");
            var trimMulti = true;
            if (arguments.length > 1) {
                trimMulti = multi;
            }
            if (trimMulti === true) {
                s = s.replace(/[ ]{2,}/gi, " ");
            }
            return s;
        };
        MaxInput.prototype.bind = function(eventName, callback) {
            var self = this;
            self.$delegate.on(eventName, self.input, callback);
        };
        MaxInput.prototype.execExtraBinding = function(context, event) {
            var self = this;
            if (self.bindings.hasOwnProperty(event.type)) {
                self.bindings[event.type].apply(context, [event]);
            }
        };
        MaxInput.prototype.getInputValue = function() {
            var self = this;
            var text = this.$input.val();
            return self.normalizeWhiteSpace(text, false);
        };
        MaxInput.prototype.setBindings = function() {
            var maxinput = this;
            // Erase placeholder when focusing on input and nothing written
            maxinput.bind('focusin', function(event) {
                event.preventDefault();
                event.stopPropagation();
                var normalized = maxinput.getInputValue();
                if (normalized === maxinput.placeholder) {
                    jq(this).val('');
                }
                maxinput.execExtraBinding(this, event);
            });
            // Put placeholder back when focusing out and nothing written
            maxinput.bind('focusout', function(event) {
                event.preventDefault();
                event.stopPropagation();
                var normalized = maxinput.getInputValue();
                if (normalized === '') {
                    jq(this).val(maxinput.placeholder);
                    maxinput.$input.toggleClass('maxui-empty', true);
                }
                maxinput.execExtraBinding(this, event);
            });
            // Execute custom bindings on the events triggered by some
            // keypresses in the "keyup" binding.
            var binded_key_events = 'maxui-input-submit maxui-input-cancel maxui-input-up maxui-input-down maxui-input-keypress';
            maxinput.bind(binded_key_events, function(event) {
                event.preventDefault();
                event.stopPropagation();
                maxinput.execExtraBinding(this, event);
            });
            maxinput.bind('maxui-input-clear', function(event) {
                maxinput.$input.val(maxinput.placeholder);
            });
            // Put placeholder back when focusing out and nothing written
            maxinput.bind('keydown', function(event) {
                if (event.which === 38) {
                    maxinput.$input.trigger('maxui-input-up', [event]);
                } else if (event.which === 40) {
                    maxinput.$input.trigger('maxui-input-down', [event]);
                }
                maxinput.$input.toggleClass('maxui-empty', false);
            });
            // Trigger events on ENTER, ESC
            maxinput.bind('keyup', function(event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.which === 13 && !event.shiftKey) {
                    maxinput.$input.trigger('maxui-input-submit', [event]);
                } else if (event.which === 27) {
                    maxinput.$input.trigger('maxui-input-cancel', [event]);
                } else if (event.which !== 38 && event.which !== 40) {
                    maxinput.$input.trigger('maxui-input-keypress', [event]);
                }
                maxinput.execExtraBinding(this, event);
            });
        };
        return {
            MaxInput: MaxInput,
            MaxPredictive: MaxPredictive
        };
    };
    max.views = max.views || {};
    jq.extend(max.views, views());
})(jQuery);
