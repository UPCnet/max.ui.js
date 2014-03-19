/*jshint multistr: true */
var max = max || {};

/**
* @fileoverview
*/

(function(jq) {

max.views = function() {


    /** MaxPredictive.
    * Provides a dropdown list with autocompletion results
    * on top of a input, triggering events
    */

    function MaxPredictive(options) {
        self = this;
        self.minchars = options.minchars;
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
        var num_predictions = self.$list.find('.maxui-prediction').length;
        var is_predicting = self.$el.is(":visible").length > 0;
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
        var num_predictions = self.$list.find('.maxui-prediction').length;
        var is_predicting = self.$el.is(":visible").length > 0;
        var $next = $selected.next();
        $selected.removeClass('selected');
        if ($next.length > 0) {
            self.select($next);
        } else {
            self.select($selected.siblings(':first'));
        }
    };

    MaxPredictive.prototype.show = function(event) {
        var self = this;
        var $input = jq(event.target);
        var text = maxui.utils.normalizeWhiteSpace($input.val(), false);
        if (text.length >= this.minchars) {
            if (self.requests.hasOwnProperty(text)) {
                self.render(text);
            } else {
                this.source.apply(this, [event, text, function(data) {
                    self.requests[text] = this;
                    self.render(text);
                }]);
            }
        } else {
            self.hide();
        }
    };

    MaxPredictive.prototype.render = function(text) {
        var self = this;
        var predictions = '';
        var items = self.requests[text];
        var filter = self.filter();
        // Iterate through all the conversations
        for (i = 0; i < items.length; i++) {
            var prediction = items[i];
            // Only add predictions of users that are not already in the conversation
            if (filter.indexOf(prediction.username) == -1) {
                var avatar_url = maxui.settings.avatarURLpattern.format(prediction.username);
                var params = {
                    username: prediction.username,
                    displayName: prediction.displayName,
                    avatarURL: avatar_url,
                    cssclass: 'maxui-prediction' + (i === 0 && ' selected' || '')
                };
                // Render the conversations template and append it at the end of the rendered covnersations
                predictions = predictions + maxui.templates.predictive.render(params);
            }
        }
        if (predictions === '') {
            predictions = '<li>' + maxui.settings.literals.no_match_found + '</li>';
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
        this.input = options.input;
        this.$input = jq(this.input);
        this.placeholder = options.placeholder;
        this.$delegate = jq(options.delegate);
        this.setBindings();
        this.bindings = options.bindings;

        // Initialize input value with placeholder
        this.$input.val(this.placeholder);
    }

    MaxInput.prototype.bind = function(eventName, callback) {
        var maxinput = this;
        maxinput.$delegate.on(eventName, maxinput.input, callback);

    };

    MaxInput.prototype.execExtraBinding= function(context, event) {
        var maxinput = this;
        if (this.bindings.hasOwnProperty(event.type)) {
            this.bindings[event.type].apply(context, [event]);
        }

    };

    MaxInput.prototype.getInputValue = function() {
        var text = this.$input.val();
        return maxui.utils.normalizeWhiteSpace(text, false);
    };

    MaxInput.prototype.setBindings = function() {
        var maxinput = this;

        // Erase placeholder when focusing on input and nothing written
        maxinput.bind('focusin', function(event) {
            event.preventDefault();
            event.stopPropagation();
            var normalized = maxinput.getInputValue();
            if (normalized == maxinput.placeholder) jq(this).val('');
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
            if (event.which == 38) maxinput.$input.trigger('maxui-input-up', [event]);
            else if (event.which == 40) maxinput.$input.trigger('maxui-input-down', [event]);
            maxinput.$input.toggleClass('maxui-empty', false);
        });
        // Trigger events on ENTER, ESC
        maxinput.bind('keyup', function(event) {
            event.preventDefault();
            event.stopPropagation();
            var normalized = maxinput.getInputValue();
            if (event.which == 13 && !event.shiftKey) maxinput.$input.trigger('maxui-input-submit', [event]);
            else if (event.which == 27) maxinput.$input.trigger('maxui-input-cancel', [event]);
            else if (event.which != 38 && event.which != 40) maxinput.$input.trigger('maxui-input-keypress', [event]);
            maxinput.execExtraBinding(this, event);

        });

    };

    return {
        MaxInput: MaxInput,
        MaxPredictive: MaxPredictive
    };

};

})(jQuery);
