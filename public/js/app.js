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
	    '!/friends': 'friends_list',
	    '!/dm/:peerid': 'direct_message_conversation',
	    '!/dm': 'direct_messages',
	    '!/:id': "user",
	    '': "home"
	},
	
	friends_list: function () {
	    App.ready(function (app) {
		    app.getFriends();
		});
	},

	update_status: function () {
	    App.ready(function (app) {
		    app.updateStatus();
		});
	},

	reply: function (statusid) {
	    App.ready(function (app) {
		    app.getStatus(statusid, function (orig) {
			    orig = orig.toJSON();
			    app.updateStatus({
				    text: '@' + orig.user.name + ' ',
					in_reply_to_status_id: statusid
					});
			});
		});
	},
	repost: function (statusid) {
	    App.ready(function (app) {
		    app.getStatus(statusid, function (orig) {
			    orig = orig.toJSON();
			    app.updateStatus({
				    text: '转@' + orig.user.name + ' ' + orig.text,
					repost_status_id: statusid
					});
			});
		});
	},

	search: function (query) {
	    App.ready(function (app) {
		    app.search(query);
		});
	},

	search_form: function () {
	    App.ready(function (app) {
		    app.search_form();
		});
	},

	public_timeline: function () {
	    App.ready(function (app) {
		    app.getPublicTimeline();
		});
	},

	mentions: function () {
	    App.ready(function (app) {
		    app.getMentions();
		});
	},

	user: function (userid) {
	    App.ready(function (app) {
		    $(document).scrollTop(0);
		    app.getUserTimeline(userid);
		});
	},

	home: function () {
	    App.ready(function (app) {
		    $(document).scrollTop(0);
		    app.getHomeTimeline();
		});
	},


	status_detail: function (id) {
	    App.ready(function (app) {
		    $(document).scrollTop(0);
		    app.getStatusPage(id);
		});
	},
	direct_message_conversation: function (peerid) {
	    App.ready(function (app) {
		    $(document).scrollTop(0);
		    app.getDMConversation(peerid);
		});
	},
	direct_messages: function () {
	    App.ready(function (app) {
		    $(document).scrollTop(0);
		    app.getDMConvList();
		});
	}
    });

var App = function () {
    var app_router;
    var app = new Object();

    app.loginuser = null;
    
    app.ready = function(fn) {
        if(app.loginuser) {
            fn(app);
        } else {
            $(document).bind('metadata.ready', 
			     function () {
				 fn(app);
			     });
        }
    };

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
    
	var loading_counter = 0;
	$(document).bind('ajaxSend', function (evt, req, settings) {
		loading_counter++;
		$('#loading').show();
	    });
	$(document).bind('ajaxComplete', function (evt, req) {
		loading_counter--;
		if(loading_counter <= 0) {
		    $('#loading').hide();
		    loading_counter = 0;
		}
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

	check_version();
	
	$(document).delegate('#notify-area', 'click', function (evt) {
		$('#notify-area').hide();
	    });

	app.fetchNotification();
	setInterval(function () {
		app.fetchNotification(); 
	    }, 30 * 1000);

	app.getUser(null, function (u) {
		app.loginuser = u;
		$(document).trigger('metadata.ready');
	    });
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
	return cached_model;
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
	var usecache = opts.usecache || true;
	var cachekey = url;
	if(usecache) {
	    var cached_model = app.loadTimelineCache(cachekey);
	    if(cached_model && (opts.cache_once || false)) {
		return;
	    }
	}
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
			if(usecache) {
			    app.storeTimelineCache(cachekey, data);
			}
		    } 
		}, 'error': function (err, req) {
		    if(opts.error) {
			opts.error(err, req);
		    } else {
			app.handleError(err, req);
		    }
		}		    
	    });
    };

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
    
    app.getUser = function (userid, opts) {
        if(!userid) {
            userid = '*';
        }
	if(typeof opts == 'function') {
	    opts = {'success': opts};
	}
	opts = opts || {}
        var url = '/proxy/users/show' + ((userid != '*')?
                                         ('?id=' + userid): '');
	var user = new User();
	user.url = url;
	user.fetch({
		'success': function (u) {
		    if(opts.success) {
			opts.success(u);
		    }
		},
		    'error': function (err, req) {
			if(opts.error) {
			    opts.error(err, req);
			} else {
			    app.handleError(err, req);
			}
		    }
	    });
        return;
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
		    app.getStatusContext(statusid);
		}, 'error': function (err, req) {
		    if(req.status == 403) {
			app.notify('隐私消息');
		    } else {
			app.handleError(err, req);
		    }
		}		    
	    });
    };

    app.fetchNotification = function () {
	var url = '/proxy/account/notification';
	$.ajax(url, {
		'success': function(data) {
		    var s = '';
		    if(data.direct_messages > 0) {
			s += ' <a href="javascript:App.gohash(\'#!/dm\');">有新的私信</a>';
		    } 
		    if(data.mentions > 0) {
			s += ' <a href="javascript:App.gohash(\'#!/mentions\');">有新提示消息</a>';
		    }
		    if(s) {
			app.notifyTitle(s);
		    }
		}
	    });
    }

    app.getStatusContext = function (statusid) {
	var url = '/proxy/statuses/context_timeline?format=html&id=' + statusid;
	app.getTimeline(url, {
		//usecache: false,
		cache_once: false,
		success: function (timeline) {
		    if(timeline.models.length > 1) {
			var v = new TimelineView({
				el: $('#context'),
				prefix: '<h3 class="text-center">消息上下文</h3>',
				collection: timeline
			    });
			v.render();
		    }
		}
	    });
    };

    var cached_trends = null;
    $(document).bind('cacheRefresh', function () {
	    cached_trends = null;
	});
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
    $(document).bind('cacheRefresh', function () {
	    cached_saved_search = null;
	});
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
	} else if(req.status == 403) {
	    app.notify('无权限');
	} else if(req.status == 404) {
	    app.notify('对象不存在');
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
	var v = new UpdateStatusView(opts);
	v.render();
    };

    app.gotoUserTimeline = function (userid) {
	var hash = '#!/' + encodeURIComponent(userid);
	app.gohash(hash);
    };
    
    app.refresh = function () {
	//applicationCache.update();
	localStorage.clear();
	$(document).trigger('cacheRefresh');
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

    var cached_friends = null;
    $(document).bind('cacheRefresh', function () {
	    cached_friends = null;
	});
    app.getFriends = function () {
	if(cached_friends) {
	    var view = new UserListView({
		    el: app.getContentArea(),
		    collection: cached_friends
		});
	    view.render();
	    return;
	}

	var friends = new UserList();
	friends.url = '/proxy/users/friends';
	friends.fetch({
		success: function (frds) {
		    var view = new UserListView({
			    el: app.getContentArea(),
			    collection: frds
			});
		    view.render();
		    cached_friends = frds;
		}, error: function (err, req) {
		    app.handleError(err, req);
		}
	    });
    };
    
    app.getDMConvList = function () {
	var dmlist = new DMConvList();
	dmlist.url = '/proxy/direct_messages/conversation_list?mode=lite&count=100';
	dmlist.fetch({
		'success': function (dms) {
		    var view = new DMConvListView({
			    el: app.getContentArea(),
			    collection: dms
			});
		    view.render();
		},
		    'error': function (err, req) {
			app.handleError(err, req);
		    }
	    });	
    };

    app.getDMConversation = function (peerid) {
	var dmlist = new DMList();
	dmlist.url = '/proxy/direct_messages/conversation?mode=lite&id=' + peerid;
	dmlist.fetch({
		'success': function (dms) {
		    var view = new DMConversationView({
			    el: app.getContentArea(),
			    collection: dms,
			    user: peerid
			});
		    view.render();
		},
		    'error': function (err, req) {
			app.handleError(err, req);
		    }
	    });	
    };

    app.notifyTitle = function (w) {
	$('#notify-area').html(w).show();
    };
    return app;
}();
