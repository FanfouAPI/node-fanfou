// Define the router
var AppRouter = Backbone.Router.extend({
	routes: {
	    '!/update': 'update_status',
	    '!/reply/:statusid': 'reply',
	    '!/repost/:statusid': 'repost',
	    '!/mentions': 'mentions',
	    '!/public': 'public_timeline',
	    '!/statuses/:id': 'status_detail',
	    '!/q/:query': 'search',
	    '!/search': 'search_form',
	    '!/:id': "user",
	    '': "home"
	},

	update_status: function () {
	    App.updateStatus();
	},

	reply: function (statusid) {
	    App.getStatus(statusid, function (orig) {
		    orig = orig.toJSON();
		    App.updateStatus({
			    text: '@' + orig.user.name + ' ',
			    in_reply_to_status_id: statusid
			});
		});
	},
	repost: function (statusid) {
	    App.getStatus(statusid, function (orig) {
		    orig = orig.toJSON();
		    App.updateStatus({
			    text: '转@' + orig.user.name + ' ' + orig.text,
			    repost_status_id: statusid
			});
		});
	},

	search: function (query) {
	    App.search(query);
	},

	search_form: function () {
	    App.search_form();
	},

	public_timeline: function () {
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
	
	var header_touch_point = null;
	function header_touch_end(evt) {
	    if(header_touch_point) {
		var pageX = evt.type == 'mouseup'?evt.pageX:evt.originalEvent.changedTouches[0].pageX;
		if(Math.abs(pageX - header_touch_point.pageX) > 80) {
		    $('#commands').toggle();
		}
		header_touch_point = null;
	    }
	}
	$(document).delegate('#header-wrapper', 'touchend', header_touch_end);
	//$(document).delegate('#commands', 'touchend', header_touch_end);
	$(document).delegate('#header-wrapper', 'mouseup', header_touch_end);

	function header_touch_start(evt) {
	    var pageX = evt.type == 'mousedown'?evt.pageX:evt.originalEvent.changedTouches[0].pageX;
	    header_touch_point = {
		'pageX': pageX
	    };
	}
	$(document).delegate('#header-wrapper', 'touchstart', header_touch_start);
	//$(document).delegate('#commands', 'touchstart', header_touch_start);
	$(document).delegate('#header-wrapper', 'mousedown', header_touch_start);

	$.ajaxSetup({cache: false});
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

    app.search_form = function () {
	var v = new SearchView({
		el: app.getContentArea(),
	    });
	v.render();
	app.getSavedSearch();
    };

    app.logout = function () {
	localStorage.clear();
	window.location = '/logout';
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
    };

    app.getStatusPage = function (statusid) {
	var status = new Status();
	status.url = '/proxy/statuses/show?format=html&id=' + statusid;
	status.fetch({
		'success': function (data) {
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
    var cached_trends = null;
    app.getTrends = function () {
	if(cached_trends) {
	    var v = new TrendsView({
		    el: $('#query'),
		    title: '饭否热词',
		    model: cached_trends
		});
	    v.render();
	    return;
	}

	var trends = new Trends();
	trends.url = '/proxy/trends/index';
	trends.fetch({
		'success': function (data) {
		    var v = new TrendsView({
			    el: $('#query'),
			    title: '饭否热词',
			    model: data
			});
		    v.render();
		    cached_trends = data;
		}, 'error': function (err, req) {
		    app.handleError(err, req);
		}
	    });
    };
    var cached_saved_search = null;
    app.getSavedSearch = function () {
	if(cached_saved_search) {
	    var v = new QueryListView({
		    el: $('#query'),
		    title: '保存搜索',
		    collection: cached_saved_search
		});
	    v.render();
	    app.getTrends();
	    return;
	}

	var trends = new QueryList();
	trends.url = '/proxy/saved_searches/index';
	trends.fetch({
		'success': function (data) {
		    var v = new QueryListView({
			    el: $('#query'),
			    title: '保存搜索',
			    collection: data
			});
		    v.render();
		    cached_saved_search = data;
		    app.getTrends();
		}, 'error': function (err, req) {
		    app.handleError(err, req);
		}
	    });
    };

    app.handleError = function (err, req) {
	if(req.status == 410) {
	    window.location = '/';
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

    app.updateStatus = function (opts) {
	opts = opts || {};
	opts.el = app.getContentArea();
	console.info(opts);
	var v = new UpdateStatusView(opts);
	v.render();
    };

    app.gotoUserTimeline = function (userid) {
	var hash = '#!/' + encodeURIComponent(userid);
	app.gohash(hash);
    };
    
    app.refresh = function () {
	applicationCache.update();
	localStorage.clear();
    };

    app.getStatus = function (id, opts) {
	if(typeof opts == 'function') {
	    opts = {success: opts};
	}
	opts = opts || {};	
	var status = new Status();
	status.url = '/proxy/statuses/show?id=' + id;
	status.fetch({
		success: function(st) {
		    if(opts.success) {
			opts.success(st);
		    }
		},
		    error: function (err) {
		    if(opts.error) {
			opts.error(err);
		    }
		}
	    });
    };
    return app;
}();
