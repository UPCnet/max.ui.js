/**
 * @fileoverview
 */
'use strict';
var max = max || {};
(function(jq) {
    /** MaxLogging
     *
     *
     */
    var levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };

    function MaxLogging(options) {
        var self = this;
        self.level = 0;
    }
    MaxLogging.prototype.setLevel = function(level) {
        var self = this;
        self.level = levels[level];
    };
    MaxLogging.prototype.log = function(message, tag) {
        try {
            window.console.log('{0}: {1}'.format(tag, message));
        } catch (err) {}
    };
    MaxLogging.prototype.debug = function(message) {
        var tag = 'MAXUI';
        if (arguments.length > 1) {
            tag = arguments[1];
        }
        var self = this;
        if (self.level <= levels.debug) {
            self.log(message, tag);
        }
    };
    MaxLogging.prototype.info = function(message) {
        var tag = 'MAXUI';
        if (arguments.length > 1) {
            tag = arguments[1];
        }
        var self = this;
        if (self.level <= levels.info) {
            self.log(message, tag);
        }
    };
    MaxLogging.prototype.warn = function(message) {
        var tag = 'MAXUI';
        if (arguments.length > 1) {
            tag = arguments[1];
        }
        var self = this;
        if (self.level <= levels.warn) {
            self.log(message, tag);
        }
    };
    MaxLogging.prototype.error = function(message) {
        var tag = 'MAXUI';
        if (arguments.length > 1) {
            tag = arguments[1];
        }
        var self = this;
        if (self.level <= levels.error) {
            self.log(message, tag);
        }
    };
    max.MaxLogging = MaxLogging;
})(jQuery);
