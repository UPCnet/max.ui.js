/**
 * @fileoverview
 */
'use strict';
var max = max || {};
(function(jq) {
    var views = function() {
        /** MaxScrollbar
         *
         *
         */
        function MaxScrollbar(options) {
            var self = this;
            self.maxui = options.maxui;
            self.width = options.width;
            self.handle = options.handle;
            self.dragging = false;
            self.scrollbar_selector = options.scrollbar;
            self.$bar = jq(self.scrollbar_selector);
            self.$dragger = self.$bar.find('.maxui-dragger');
            self.target_selector = options.target;
            self.$target = jq(self.target_selector);
            self.bind();
        }
        MaxScrollbar.prototype.bind = function() {
            var self = this;
            self.$target.on('mousewheel', function(event, delta, deltaX, deltaY) {
                event.preventDefault();
                event.stopPropagation();
                if (self.enabled()) {
                    var movable_height = self.$target.height() - self.maxtop - self.handle.height;
                    var actual_margin = parseInt(self.$target.css('margin-top'), 10);
                    var new_margin = actual_margin + (deltaY * 1 * 10);
                    if (new_margin > 0) {
                        new_margin = 0;
                    }
                    if (new_margin < (movable_height * -1)) {
                        new_margin = movable_height * -1;
                    }
                    self.$target.css({
                        'margin-top': new_margin
                    });
                    new_margin = new_margin * -1;
                    var relative_pos = (new_margin * 100) / movable_height;
                    self.setDraggerPosition(relative_pos);
                }
            });
            jq(document).on('mousemove', function(event) {
                if (self.dragging) {
                    event.stopPropagation();
                    event.preventDefault();
                    // drag only if target content is taller than scrollbar
                    if (self.enabled()) {
                        // Calculate dragger position, constrained to actual limits
                        var margintop = event.clientY + jq(window).scrollTop() - self.$bar.offset().top;
                        if (margintop < 0) {
                            margintop = 0;
                        }
                        if (margintop >= self.maxtop) {
                            margintop = self.maxtop;
                        }
                        // Calculate dragger position relative to 100 and move content
                        var relative_position = (margintop * 100) / self.maxtop;
                        self.setContentPosition(relative_position);
                    }
                }
            });
            jq(document.body).on('mousedown', '.maxui-dragger', function(event) {
                event.stopPropagation();
                event.preventDefault();
                self.dragging = true;
            });
            jq(document).on('mouseup', function(event) {
                self.dragging = false;
            });
        };
        MaxScrollbar.prototype.setHeight = function(height) {
            var self = this;
            var wrapper_top = jq('#maxui-conversations .maxui-wrapper').offset().top - self.maxui.offset().top - 1;
            self.$bar.css({
                'height': height,
                'top': wrapper_top
            });
            self.maxtop = height - self.handle.height - 2;
        };
        MaxScrollbar.prototype.setTarget = function(selector) {
            var self = this;
            self.$target = jq(selector);
        };
        MaxScrollbar.prototype.setDraggerPosition = function(relative_pos) {
            var self = this;
            var margintop = (self.maxtop * relative_pos) / 100;
            self.$dragger.css({
                'margin-top': margintop
            });
        };
        MaxScrollbar.prototype.setContentPosition = function(relative_pos) {
            var self = this;
            if (self.enabled()) {
                var movable_height = self.$target.height() - self.maxtop - self.handle.height;
                var margintop = (movable_height * relative_pos) / 100;
                self.$target.css({
                    'margin-top': margintop * -1
                });
                self.setDraggerPosition(relative_pos);
            } else {
                self.$target.css({
                    'margin-top': ''
                });
                self.setDraggerPosition(0);
            }
        };
        MaxScrollbar.prototype.enabled = function() {
            var self = this;
            return self.$target.height() > self.maxtop;
        };
        return {
            MaxScrollbar: MaxScrollbar
        };
    };
    max.views = max.views || {};
    jq.extend(max.views, views());
})(jQuery);
