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
    var jq = jQuery

    /*
    *    Main interface view, this holds
    *    All the other subviews
    *
    *    @param {el} the element where to instantiate the view
    */

    var CommentsView = Backbone.View.extend({
        initialize: function(options) {
        var view = this
            view._views = []
            view.activity_id = options.activity_id
            view.collection = new models.ActivityComments([], {activity_id: this.activity_id})
            view.model = CommentView
            view.$visibility = view.$el.closest('.maxui-comments')

            _(view).bindAll()
            view.collection.bind('destroy', view.remove)
        },

        fetch: function(options) {
            var view = this
            view.collection.fetch({
                success: function(event) {
                    view.collection.each(function(model) {
                        view._views.push( new view.model({
                            model: model,
                        }))
                    })
                    view.render()
                    options.success.apply(view)
                }
            })

        },

        toggle: function() {
            var view = this
            if (view.collection.isEmpty()) {
                view.$el.empty()
                view.fetch({
                    success: function(event){
                        view.$visibility.toggle(200)
                    }
                })
            } else {
                view.$visibility.toggle(200)
            }
        },

        render: function () {
            var view = this
            view.$el.empty()
            _(view._views).each(function(model_view) {
                html = model_view.render().el
                view.$el.append(html)
            })
        },

        update: function() {
            alert('updating')
        },

        remove: function(model) {
            var itemToRemove = _(this._views).select(function(cv) { return cv.model === model; })[0];
            this._views = _(this._views).without(itemToRemove);
        }


    })


    var CommentView = Backbone.View.extend({
        initialize: function(options) {
            var view = this

            _(view).bindAll()
            this.model.bind('destroy', this.animateAndRemove, this)

        },

        // Other functions

        animateAndRemove: function(model, resp, options) {
            this.$el.css({height:this.$el.height(), 'min-height':'auto'})
            this.$el.animate(
                {height: 0, opacity:0},
                200,
                function(event) { this.remove() }
            )
        },


        render: function() {

            var variables = {
                id: this.model.get('id'),
                actor: this.model.get('actor'),
                date: utils.formatDate(this.model.get('published'),settings.language),
                text: utils.formatText(this.model.get('content')),
                avatarURL: settings.avatarURLpattern.format(this.model.get('actor').username)
            }

            // Render the activities template and append it at the end of the rendered activities
            // partials is used to render each comment found in the activities
            var html = templates.comment.render(variables)
            this.$el.html(html)
            return this
        }
    })


    var ActivityView = Backbone.View.extend({
        initialize: function(options) {
            var view = this

            _(view).bindAll()
            this.model.bind('destroy', this.animateAndRemove, this)

            this.render = _.bind(this.render, this)

            var activity = this.model
            // Take first context (if exists) to display in the 'published on' field
            // XXX TODO Build a coma-separated list of contexts ??
            var contexts = undefined
            if (activity.get('contexts'))
                contexts = activity.get('contexts')[0]

            // Take generator property (if exists) and set it only if it's different
            // from the application name defined in settings
            var generator = undefined
            if (activity.get('generator') && activity.generator!=settings.generatorName)
                generator = activity.get('generator')

            // Prepare avatar image url depending on actor type
            var avatar_url = ''
            if (activity.get('actor').objectType=='person') {
                avatar_url = settings.avatarURLpattern.format(activity.get('actor').username)
              }
            else if (activity.get('actor').objectType=='context') {
                avatar_url = contextAvatarURLpattern.format(activity.get('actor').hash)
              }

            // Set empty replies, this will be filled in by commentsview
            var replies = 0
            if (activity.get('replies'))
                replies = activity.get('replies').totalItems

            view.replies = replies
            view.avatar_url = avatar_url
            view.contexts = contexts
            view.generator = generator
            if (settings.profileURLPattern) {
                view.profile_url = settings.profileURLPattern.format(settings.username)
                view.actor_link_active = true
            }
            else {
                view.profile_url = '#'
                view.actor_link_active = false
            }
        },

        events: {
            'click .maxui-actor a':            'goToProfile',
            'click .maxui-delete-activity':    'removeActivity',
            'click .maxui-commentaction':      'toggleComments'
        },

        // Envent binded functions

        goToProfile: function(event) {
            if (!settings.profileURLPattern)
                event.preventDefault()
                event.stopPropagation()
        },

        toggleComments: function(event) {
            view = this
            event.preventDefault()
            view.comments_view.toggle()
        },

        removeActivity: function(event) {
            this.model.destroy({wait:true})
        },

        // Other functions

        animateAndRemove: function(model, resp, options) {
            this.$el.css({height:this.$el.height(), 'min-height':'auto'})
            this.$el.animate(
                {height: 0, opacity:0},
                200,
                function(event) { this.remove() }
            )
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
                profileURL: this.profile_url,
                publishedIn: this.contexts,
                enableActorLink: this.actor_link_active,
                canDeleteActivity: this.model.get('owner') == settings.username,
                via: this.generator
            }
            // Render the activities template and append it at the end of the rendered activities
            // partials is used to render each comment found in the activities
            var partials = {comment: templates.comment}
            var html = templates.activity.render(variables, partials)
            this.$el.html(html)

            // setup the comments view whe the rendering is completed
            this.comments_view = new CommentsView({
                activity_id: this.model.get('id'),
                el: this.$el.find('.maxui-commentsbox')
            })
            return this
        }
    })

    var TimelineView = Backbone.View.extend({
        initialize: function(options) {
        var view = this
            view._activityViews = []
            view.collection = new models.Timeline()

            _(view).bindAll('remove')
            view.collection.bind('destroy', view.remove)

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
        render: function () {
            var view = this
            view.$el.empty()
            _(view._activityViews).each(function(activityView) {
                view.$el.append(activityView.render().el)
            })

        },

        update: function() {
            alert('updating')
        },

        remove: function(model) {
            var activityToRemove = _(this._activityViews).select(function(cv) { return cv.model === model; })[0];
            this._activityViews = _(this._activityViews).without(activityToRemove);
        }


    })

    var PostBoxView = Backbone.View.extend({
        initialize: function(options) {
            this.default_text = options.default_text
            this.render()
            this.$text = jq(this.$el).find('textarea.maxui-text-input')
            this.$button = jq(this.$el).find('input.maxui-button')
            this.activities = options.activities
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
        canwrite: function() { return true },
        isPredicting: function() { return jq('#maxui-predictive:visible').length>0 },
        getText: function() { return utils.normalizeWhiteSpace(this.$text.val(), false) },
        setText: function(text) { this.$text.val(text)},
        enableButton: function() { this.$button.removeAttr('disabled') },
        disableButton: function() { this.$button.attr({'disabled': 'disabled', 'class': 'maxui-button maxui-disabled'}) },
        clear: function() { this.disableButton(); this.setText(this.default_text); this.$text.attr('class','maxui-empty maxui-text-input')},

        events: {
            'click input.maxui-button':             'post',
            'focusin textarea.maxui-text-input':    'focusIn',
            'focusout textarea.maxui-text-input':   'focusOut',
            'keydown textarea.maxui-text-input':    'keyDown',
            'keyup textarea.maxui-text-input':      'keyUp',
        },

        post: function (event) {
            var view = this
            var new_activity = new this.model({
                object: {
                    objectType: 'note',
                    content: this.getText()
            }})
            new_activity.save({}, {
                success: function(event) {
                    view.clear()
                    view.activities.update()
                }
            })
        },

        focusIn: function(event) {
            event.preventDefault()
            if ( this.getText() == this.default_text )
                this.setText('')

        },

        focusOut: function(event) {
            event.preventDefault()
            if ( this.getText() == '' )
                this.setText(this.default_text)
        },

        keyDown: function(event) {
            if ( this.isPredicting() && false(event.which==40 || event.which==38 || event.which==13 || event.which==9)) {
                utils.freezeEvent(event)
            } else if (event.which==13 && event.shiftKey==false) {
                event.preventDefault()
                var text = this.getText()
                if (text!=this.default_text & text!='')
                    this.post()
            }
        },

        keyUp: function(event) {
            event.preventDefault()
            event.stopPropagation()
            if (this.getText()=='') {
                this.disableButton()
                this.$text.attr('class','maxui-empty maxui-text-input')
            }
            else {
                if (this.canwrite()) {
                    this.enableButton()
                    this.$text.attr('class','maxui-text-input')
                }
            }

            // TO recover when refactoring the predictive input
            // if (extra_bind!=null) {
            //   extra_bind(text, this, button, event)
            // }
        }

    })

    var MainView = Backbone.View.extend({
        initialize: function(options){
            var mainview = this
            mainview.user = new models.User({'username': settings.username})
            mainview.user.fetch({
                success: function(event) {
                    settings.subscriptions = mainview.user.getSubscriptions()
                    mainview.render()
                    mainview.views = {}
                    mainview.views.activities = new TimelineView({el: $('#maxui-activities')})
                    mainview.views.postbox = new PostBoxView({
                        el: $('#maxui-newactivity'),
                        default_text: literals.new_activity_text,
                        model: models.UserActivity,
                        activities: mainview.views.activities
                    })

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