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

        function MaxViewName(options) {
            self = this;
        }

        MaxViewName.prototype.methodname = function($element) {
            var self = this;
        };

        return {
            MaxViewName: MaxViewName
        };

    };

    max.views = max.views || {};
    jq.extend(max.views, views());

})(jQuery);
