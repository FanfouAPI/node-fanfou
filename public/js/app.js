// Define the router
var AppRouter = Backbone.Router.extend({
	routes: {
	    '!/update': 'update_status',
	    '!/mentions': 'mentions',
	    '!/statuses/:id': 'status_detail',
	    '!/q/:query': 'search',
	    '!/:id': "user",
	    '': "home"
	},

	update_status: function () {
	    App.updateStatus();
	},
	search: function (query) {
	    App.search(query);
	},
	mentions: function () {
	    App.getMentions();
	},

	user: function (userid) {
	    $(document).scrollTop(0);
	    App.getUserTimeline(userid);
	},

	home: function () {
	    $(document).scrollTop(0);
	    App.getHomeTimeline();
	},

	status_detail: function (id) {
	    App.getStatusPage(id);
	}
    });

var App = function () {
    var app_router;
    var app = new Object();

    app.template = function (temp_selector, data) {
        return Mustache.to_html($(temp_selector).html(),
                                data);
    };

    app.gohash = function(h) {
	if(h == '#') {
	    h = '';
	}
	if(window.location.hash == h) {
	    Backbone.history.loadUrl(h);
	} else {
	    window.location.hash = h;
	}
    };
    
    app.initialize = function() {
        app_router = new AppRouter();
        Backbone.history.start();
	setInterval(function () {
		var text = $('#loading').html();
		if(text.length >= 3) {
		    text = '.';
		} else if(text.length == 2) {
		    text = '...';
		} else {
		    text = '..';
		}
		$('#loading').html(text);
	    }, 100);

    
	$(document).bind('ajaxSend', function (evt, req, settings) {
		$('#loading').show();
	    });
	$(document).bind('ajaxComplete', function (evt, req) {
		$('#loading').hide();
	    });
	$('#loading').hide();
	rconsole.info('app initialized');
    };

    app.getMentions = function () {
	var timeline = new Timeline();
	timeline.url = '/proxy/statuses/mentions?format=html';
	timeline.fetch({
		'success': function (data) {
		    var v = new TimelineView({
			    el: $('#content'),
				collection: data
			});
		    v.render();
		}, 'error': function (err, req) {
		    console.error('get mentions error', err);
		    app.handleError(err, req);
		}		    
	    });
    };

    app.getHomeTimeline = function () {
	var timeline = new Timeline();
	timeline.url = '/proxy/statuses/friends_timeline?format=html';
	timeline.fetch({
		'success': function (data) {
		    var v = new TimelineView({
			    el: $('#content'),
				collection: data
			});
		    v.render();
		}, 'error': function (err, req) {
		    console.error('get timeline error', err, req);
		    app.handleError(err, req);
		}		    
	    });
    };
    app.search = function (query) {
	var timeline = new Timeline();
	timeline.url = '/proxy/search/public_timeline?format=html&q=' + query;
	timeline.fetch({
		'success': function (data) {
		    var v = new TimelineView({
			    el: $('#content'),
				collection: data
			});
		    v.render();
		}, 'error': function (err, req) {
		    console.error('get timeline error', err, req);
		}		    
	    });
    };
    app.getUserTimeline = function (userid) {
	var timeline = new Timeline();
	timeline.url = '/proxy/statuses/user_timeline?format=html&id=' + userid;
	timeline.fetch({
		'success': function (data) {
		    var v = new TimelineView({
			    el: $('#content'),
				collection: data
			});
		    v.render();
		}, 'error': function (err, req) {
		    if(req.status == 403) {
			app.notify('隐私用户');
		    } else {
			app.handleError(err, req);
		    }
		}		    
	    });
    };

    app.getStatusPage = function (statusid) {
	var status = new Status();
	status.url = '/proxy/statuses/show?format=html&id=' + statusid;
	status.fetch({
		'success': function (data) {
		    console.info(data.toJSON());
		    var view = new StatusView({
			    el: $('#content'),
			    model: data,
			});
		    view.render();
		}, 'error': function (err, req) {
		    if(req.status == 403) {
			app.notify('隐私消息');
		    } else {
			app.handleError(err, req);
		    }
		}		    
	    });
    };
    app.handleError = function (err, req) {
	if(req.status == 410) {
	    window.location.reload();
	} else if(req.status == 401) {
	    app.notify('访问错误!');
	} else {
	    console.error(err, req);
	}
    };

    app.notify = function (content) {
	var v = new NotifyView({
		el: $('#content'),
		content: content
	    });
	v.render();
    };

    app.updateStatus = function () {
	var v = new UpdateStatusView({
		el: $('#content')
	    });
	v.render();
    };

    app.gotoUserTimeline = function (userid) {
	var hash = '#!/' + encodeURIComponent(userid);
	app.gohash(hash);
    };

    return app;
}();