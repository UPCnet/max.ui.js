/**
 * @fileoverview
 */
'use strict';
var max = max || {};
(function(jq) {
    var views = function() {
        /** MaxViewName
         *
         *
         */
        // Object representing an overlay wrapper
        function MaxOverlay(maxui) {
            var self = this;
            self.maxui = maxui;
            self.title = 'Overlay Title';
            self.content = '';
            self.el = '#maxui-overlay-panel';
            self.overlay_show_class = '.maxui-overlay';
            jq(self.el + ' .maxui-close').click(function(event) {
                event.preventDefault();
                event.stopPropagation();
                self.maxui.overlay.hide();
            });
        }
        MaxOverlay.prototype.$el = function() {
            return jq(this.el);
        };
        MaxOverlay.prototype.setTitle = function(title) {
            this.$el().find('#maxui-overlay-title').text(title);
        };
        MaxOverlay.prototype.setContent = function(content) {
            this.$el().find('#maxui-overlay-content').html(content);
        };
        MaxOverlay.prototype.configure = function(overlay) {
            this.setTitle(overlay.title);
            this.setContent(overlay.content);
            overlay.bind(this);
        };
        MaxOverlay.prototype.show = function(overlay) {
            var self = this;
            overlay.load(function(data) {
                self.configure(data);
            });
            jq(self.overlay_show_class).show();
            self.$el().animate({
                opacity: 1
            }, 200);
        };
        MaxOverlay.prototype.hide = function() {
            var self = this;
            self.$el().trigger('maxui-overlay-close', []);
            self.$el().animate({
                opacity: 0
            }, 200, function(event) {
                jq(self.overlay_show_class).hide();
            });
        };
        return {
            MaxOverlay: MaxOverlay
        };
    };
    max.views = max.views || {};
    jq.extend(max.views, views());
})(jQuery);
