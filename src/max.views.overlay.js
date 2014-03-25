/**
* @fileoverview
*/

var max = max || {};

(function(jq) {

var views = function() {


    /** MaxViewName
    *
    *
    */

    // Object representing an overlay wrapper
    function MaxOverlay() {
        this.title = 'Overlay Title';
        this.content = '';
        this.el = '#maxui-overlay-panel';
        this.overlay_show_class = '.maxui-overlay';
        jq(this.el + ' .maxui-close').click(function(event) {
            event.preventDefault();
            event.stopPropagation();
            maxui.overlay.hide();
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
        maxoverlay = this;
        overlay.load(function(data) {
            maxoverlay.configure(data);
        });
        jq(this.overlay_show_class).show();
        this.$el().animate({
            opacity: 1
        }, 200);
    };
    MaxOverlay.prototype.hide = function() {
        this.$el().trigger('maxui-overlay-close', []);
        overlay = this;
        this.$el().animate({
            opacity: 0
        }, 200, function(event) {
            jq(overlay.overlay_show_class).hide();
        });
    };

    return {
        MaxOverlay: MaxOverlay
    };

};
max.views = max.views || {};
jq.extend(max.views, views());

})(jQuery);
