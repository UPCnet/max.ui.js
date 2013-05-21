var max = max || {};

/**
 * @fileoverview Max backbones views definition
 */


max.views = function() {


    return {

        /*
        *    Main interface view, this holds
        *    All the other subviews
        *
        *    @param {el} the element where to instantiate the view
        */

        MainView: Backbone.View.extend({
            initialize: function(){
                this.render();
            },
            render: function(){
                this.$el.html( maxui.templates.mainUI.render(this.params) );
            }
        })

    }
}