// Define the router
var AppRouter = Backbone.Router.extend({
	routes: {
	    '!/update': 'update_status',
	    '!/mentions': 'mentions',
	    '!/public': 'public',
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

	public: function () {
	    App.getPublicTimeline();
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
    app.getContentArea = function () {
	var cnt = $('#content');
	cnt.unbind();
	return cnt;
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

    app._timelineCache = {};
    app.loadTimelineCache = function (key) {
	var cached_model;
	if(window.localStorage) {
	    cached_model = localStorage.getItem('timeline.' + key);
	    if(cached_model) {
		cached_model = new Timeline(_.map(JSON.parse(cached_model), 
						  function (s) {
						      return new Status(s);
						  }));
	    }
	} else {
	    cached_model = app._timelineCache[key];
	}
	if(cached_model) {
	    var v = new TimelineView({
		    el: app.getContentArea(),
		    collection: cached_model
		});
	    v.render();
	}
    };

    app.storeTimelineCache = function (key, timeline) {
	if(window.localStorage) {
	    localStorage.setItem('timeline.' + key,
				   JSON.stringify(_.map(timeline.models, function (m) {
					       return m.toJSON();
					   })));
	} else {
	    app._timelineCache[key] = timeline;
	}
    };

    app.getTimeline = function (url, opts) {
	if(typeof opts == 'function') {
	    opts = {success: opts};
	} else if(!opts) {
	    opts = {};
	}

	var cachekey = window.location.hash;
	app.loadTimelineCache(cachekey);
	var timeline = new Timeline();
	timeline.url = url;
	timeline.fetch({
		'success': function (data) {
		    if(opts.success) {
			opts.success(data);
		    } else {
			var v = new TimelineView({
				el: app.getContentArea(),
				collection: data
			    });
			v.render();
			app.storeTimelineCache(cachekey, data);
		    } 
		}, 'error': function (err, req) {
		    if(opts.error) {
			opts.error(err, req);
		    } else {
			console.error('get timeline error', url, err);
			app.handleError(err, req);
		    }
		}		    
	    });
    }
    app.getMentions = function () {
	app.getTimeline('/proxy/statuses/mentions?format=html');
    };

    app.getPublicTimeline = function () {
	app.getTimeline('/proxy/statuses/public_timeline?format=html');
    };

    app.getHomeTimeline = function () {
	app.getTimeline('/proxy/statuses/friends_timeline?format=html');
    };

    app.search = function (query) {
	app.getTimeline('/proxy/search/public_timeline?format=html&q=' + query);
    };
    
    app.getUserTimeline = function (userid) {
	app.getTimeline(
			'/proxy/statuses/user_timeline?format=html&id=' + userid, {
			    error: function (err, req) {
				if(req.status == 403) {
				    app.notify('隐私用户');
				} else {
				    app.handleError(err, req);
				}
			    }		    
			});
    }

    app.getStatusPage = function (statusid) {
	var status = new Status();
	status.url = '/proxy/statuses/show?format=html&id=' + statusid;
	status.fetch({
		'success': function (data) {
		    console.info(data.toJSON());
		    var view = new StatusView({
			    el: app.getContentArea(),
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
		el: app.getContentArea(),
		content: content
	    });
	v.render();
    };

    app.updateStatus = function () {
	var v = new UpdateStatusView({
		el: app.getContentArea()
	    });
	v.render();
    };

    app.gotoUserTimeline = function (userid) {
	var hash = '#!/' + encodeURIComponent(userid);
	app.gohash(hash);
    };
    
    app.refresh = function () {
	localStorage.clear();
    }

    return app;
}();
