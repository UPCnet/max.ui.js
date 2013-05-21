var max = max || {};

/**
 * @fileoverview Max backbones views definition
 */


max.views = function(settings) {

    var settings = settings
    var models = max.models(settings)
    var templates = max.templates()
    var literals = settings.literals
    var utils = max.utils()

    /*
    *    Main interface view, this holds
    *    All the other subviews
    *
    *    @param {el} the element where to instantiate the view
    */

    ActivityView = Backbone.View.extend({
        initialize: function(options) {
            var view = this
            this.render = _.bind(this.render, this)
            this.model.bind('change:name', this.render)

            var activity = this.model
            // Take first context (if exists) to display in the 'published on' field
            // XXX TODO Build a coma-separated list of contexts ??
            var contexts = undefined
            if (activity.get('contexts'))
                contexts = activity.contexts[0]

            // Take generator property (if exists) and set it only if it's different
            // from the application name defined in settings
            var generator = undefined
            if (activity.get('generator') && activity.generator!=settings.generatorName)
                generator = activity.generator

            // Prepare avatar image url depending on actor type
            var avatar_url = ''
            if (activity.get('actor').objectType=='person') {
                avatar_url = settings.avatarURLpattern.format(activity.get('actor').username)
              }
            else if (activity.get('actor').objectType=='context') {
                avatar_url = contextAvatarURLpattern.format(activity.get('actor').hash)
              }
            // Take replies (if exists) and format to be included as a formatted
            // subobject ready for hogan
            var replies = undefined
            if (activity.get('replies'))
                {
                    var _replies = activity.get('replies')
                    replies = { totalItems: _replies.totalItems,
                                     items: []
                              }

                    if (_replies.itemslength>0)
                        {
                            for (r=0;r<_replies.items.length;r++)
                                {
                                var comment = _replies.items[r]
                                reply = {
                                                   id: comment.id,
                                               actor: comment.actor,
                                                 date: utils.formatDate(comment.published,settings.language),
                                                 text: utils.formatText(comment.content),
                                            avatarURL: settings.avatarURLpattern.format(comment.actor.username)
                                        }
                                replies.items.push(reply)
                                }
                        }
                }

            // Take all the latter properties and join them into an object
            // containing all the needed params to render the template

            view.replies = replies
            view.avatar_url = avatar_url
            view.contexts = contexts
            view.generator = generator
        },

        render: function() {
            var variables = {
                id: this.model.get('id'),
                actor: this.model.get('actor'),
                literals:literals,
                date: utils.formatDate(this.model.get('published'), settings.language),
                text: utils.formatText(this.model.get('object').content),
                replies: this.replies,
                avatarURL: this.avatar_url,
                publishedIn: this.contexts,
                canDeleteActivity: this.model.get('owner') == settings.username,
                via: this.generator
            }
            // Render the activities template and append it at the end of the rendered activities
            // partials is used to render each comment found in the activities
            var partials = {comment: templates.comment}
            var html = templates.activity.render(variables, partials)
            console.log('here')
            return html
        }
    })

    TimelineView = Backbone.View.extend({
        initialize: function(options) {
            var view = this
            view._activityViews = []
            view.collection = new models.Timeline()
            view.collection.fetch({
                success: function(event) {
                    view.collection.each(function(activity) {
                        view._activityViews.push( new ActivityView({
                            model: activity,
                        }))
                    })
                    view.render()
                }
            })

        },
        render: function (){
            var view = this
            view.$el.empty()
            _(this._activityViews).each(function(activityView) {
                view.$el.append(activityView.render())
            })

        }
    })

    PostBoxView = Backbone.View.extend({
        initialize: function(options) {
            this.render()
        },
        render: function () {
            var showCT = settings.UISection == 'conversations'
            var toggleCT = settings.disableConversations == false && !showCT
            var variables = {
                avatar: settings.avatarURLpattern.format(settings.username),
                allowPosting: this.canwrite(),
                buttonLiteral: literals.new_activity_post,
                textLiteral: literals.new_activity_text,
                literals: literals,
                showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;'
            }
            var html = templates.postBox.render(variables)
            this.$el.html(html)
        },
        canwrite: function() {
            return true
        }

    })

    MainView = Backbone.View.extend({
        initialize: function(options){
            var mainview = this
            mainview.user = new models.User({'username': settings.username})
            mainview.user.fetch({
                success: function(event) {
                    settings.subscriptions = mainview.user.getSubscriptions()
                    mainview.render()
                    mainview.views = {}
                    mainview.views.postbox = new PostBoxView({el: $('#maxui-newactivity')})
                    mainview.views.timeline = new TimelineView({el: $('#maxui-activities')})
                }
            })

        },
        render: function(){
            var showCT = settings.UISection == 'conversations'
            var showTL = settings.UISection == 'timeline'
            var toggleTL = settings.disableTimeline == false && !showTL
            var toggleCT = settings.disableConversations == false && !showCT
            var containerWidth = this.$el.width()

            var variables = {
                username: settings.username,
                literals: literals,
                showConversations: showCT ? 'display:block;' : 'display:none;',
                showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;',
                showTimeline: showTL ? 'display:block;' : 'display:none;',
                showTimelineToggle: toggleTL ? 'display:block;' : 'display:none;',
                messagesStyle: 'width:{0}px;left:{0}px;'.format(containerWidth)
            }
            var html = templates.mainUI.render(variables)
            this.$el.html(html)
        }
    })
    return {
        MainView: MainView

    }
}