// Define the router
var AppRouter = Backbone.Router.extend({
	routes: {
	    '!/update': 'update_status',
	    '!/reply/:statusid': 'reply',
	    '!/repost/:statusid': 'repost',
	    '!/mentions': 'mentions',
	    '!/browse': 'public_timeline',
	    '!/statuses/:id': 'status_detail',
	    '!/q/:query': 'search',
	    //'!/search': 'search_form',
	    //'!/friends': 'friends_list',
	    //'!/dm/:peerid': 'direct_message_conversation',
	    //'!/dm': 'direct_messages',
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
			    var s = orig.text.replace(/<(.|\n)*?>/g, '');
			    app.updateStatus({
				    text: '转@' + orig.user.name + ' ' + s,
					repost_status_id: statusid
					});
			});
		});
	},

	search: function (query) {
	    App.layout('wide');
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
	    App.layout('wide');
	    App.ready(function (app) {
		    app.getPublicTimeline();
		});
	},

	mentions: function () {
	    App.layout('wide');
	    App.ready(function (app) {
		    app.getMentions();
		});
	},

	user: function (userid) {
	    App.layout('wide');
	    App.ready(function (app) {
		    $(document).scrollTop(0);
		    app.sidebarUser(userid);
		    app.getUserTimeline(userid);
		});
	},

	
	home: function () {
	    App.layout('wide');
	    App.ready(function (app) {
		    $(document).scrollTop(0);
		    app.getHomeTimeline();
		    app.sidebarHome();
		});
	},


	status_detail: function (id) {
	    App.layout('narrow');
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
    app.statusCache = new ModelCache(Status, 'status');

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
    
    app.facebox = function (temp_selector, data) {
	var html = app.template(temp_selector, data);
	$.facebox(html);
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
	
	window.applicationCache.addEventListener('updateready', function(e) {
		if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
		    // Browser downloaded a new app cache.
		    // Swap it in and reload the page to get the new hotness.
		    window.applicationCache.swapCache();
		    if (confirm('ABC有新版本了. 安装?')) {
			window.location.reload();
		    }
		} else {
		    // Manifest didn't changed. Nothing new to server.
		}
	    }, false);

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
	
	$(document).delegate('textarea', 'keydown', function (evt) {
		if(evt.keyCode == 13 && evt.ctrlKey) {
		    $(evt.currentTarget).parents('form').submit();
		}
	    });
	
	app.clickStat = { sum: 0, times: 0};

	$(document).delegate('a', 'mouseover', function (evt) {
		tm = new Date();
		var a = $(evt.currentTarget);
		var prefurl = a.attr('prefetch');
		if(prefurl) {
		    app.prefetchTimeline(prefurl);
		}
	    });
	$(document).delegate('a', 'click', function (evt) {
		if(tm) {
		    var t = new Date();
		    app.clickStat.sum += t - tm;
		    app.clickStat.times += 1;
		    /*console.info('click stat', 
				 app.clickStat.sum / app.clickStat.times,
				 app.clickStat.sum,
				 app.clickStat.times); */
		    tm = null;
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
	Backbone.history.start();

	setInterval(function () {
		$('#main #timeline').trigger('get_new');
	    }, 30000);
    };

    app.timelineCache = new ModelCache(Timeline, 'timeline1');

    app.prefetchTimeline = function (url) {
	app.timelineCache.prefetch(url);
    };
    app.getTimeline = function (url, opts) {
	opts = opts || {};
	app.timelineCache.fetch(url, {
		'disable_cache': opts.disable_cache || false,
		'only_cache': false,
		'success': function (data) {
		    if(opts.success) {
			opts.success(data);
		    } else {
			$('#main').unbind();
			var v = new TimelineView({
				el: $('#main'),
				collection: data,
				url: url,
				view_classes: opts.view_classes || '',
				show_avatar: opts.show_avatar
			    });
			v.render();
		    } 
		    if(typeof opts.render_complete == 'function') {
			opts.render_complete();
		    }
		    _.map(data.models, function (status) {
			    app.statusCache.set(url, status);
			});
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
	app.loginuser.set_background();
	app.addUpdateView();
	app.getTimeline('/proxy/statuses/mentions?format=html', {
		view_classes: 'mentions',
		    render_complete: function () {
		    $('#navigation #mentions a').html('提到我的');
		}
	    });
    };

    app.getPublicTimeline = function () {
	app.loginuser.set_background();
	app.addUpdateView();
	app.getTimeline('/proxy/statuses/public_timeline?format=html', {
		view_classes: 'public'
	    });
    };

    app.getHomeTimeline = function () {
	app.loginuser.set_background();
	app.addUpdateView();
	app.getTimeline('/proxy/statuses/friends_timeline?format=html', {
		view_classes: 'home'
	    });
    };

    app.search = function (query) {
	app.loginuser.set_background();
	app.addUpdateView();
	app.getTimeline('/proxy/search/public_timeline?format=html&q=' + query, {view_classes: 'search'});
	app.sidebarHome();
    };

    app.search_form = function () {
	var v = new SearchView({
		el: $('#sidebar')
	    });
	v.render();
	app.getSavedSearch();
    };

    app.logout = function () {
	sessionStorage.clear();
	window.location = '/logout';
    };
    
    app.addUpdateView = function () {
	var view = new UpdateStatusView({
		el: $('#main')
	    });
	view.render();	
    }

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
	app.getUser(userid, function (u) {
		u.set_background();
		var el = $('#main #main-header');
		el.unbind();
		var view = new UserView({
			el: el,
			model: u
		    });
		view.render();
	    });
	var opts = {
	    view_classes: 'user',
	    show_avatar: false,
	    error: function (err, req) {
		if(req.status == 403) {
		    $('#main').unbind();
		    var view = new TimelineView({
			    collection: new Timeline(),
			    el: $('#main'),
			    warning: '隐私用户'
			});
		    view.render();
		} else {
		    app.handleError(err, req);
		}
	    }
	};
	app.getTimeline('/proxy/statuses/user_timeline?format=html&id=' + userid,
			opts);	

    };

    app.getStatusPage = function (statusid) {
	app.getStatus(statusid, {
		'success': function (data) {
		    $('#layout-narrow').unbind();
		    var view = new StatusView({
			    el: $('#layout-narrow'),
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
		    if(data.mentions > 0) {
			$('#navigation #mentions a').html('提到我的(' + data.mentions + ')');
		    } else {
			$('#navigation #mentions a').html('提到我的');
		    }
		}
	    });
    }

    app.getStatusContext = function (statusid) {
	var url = '/proxy/statuses/context_timeline?format=html&id=' + statusid;
	app.getTimeline(url, {
		view_classes: 'context',
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
		    el: $('#search'),
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
			    el: $('#search'),
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
    /*$(document).bind('cacheRefresh', function () {
	    cached_saved_search = null;
	    }); */

    app.getSavedSearch = function () {
	if(cached_saved_search) {
	    var v = new QueryListView({
		    el: $('#search'),
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
			    el: $('#search'),
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

    app.gotoUserTimeline = function (userid) {
	var hash = '#!/' + encodeURIComponent(userid);
	app.gohash(hash);
    };
    
    app.refresh = function () {
	sessionStorage.clear();
	$(document).trigger('cacheRefresh');
    };

    app.getStatus = function (id, opts) {
	app.statusCache.fetch('/proxy/statuses/show?format=html&id=' + id, opts);
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

    app.layout = function (mode) {
	if($('#layout-' + mode).length <= 0) {
	    var html = app.template('#layout-' + mode + '-template', {});
	    if($('.container').length) {
		$('.container').replaceWith(html);		
	    } else {
		$(document.body).append(html);
	    }
	}
    };

    app.sidebarUser = function (userid) {
	userid = userid || null;
	app.getUser(userid, function(u) {
		$('#sidebar').unbind();
		var view = new SidebarUserView({
			el: $('#sidebar'),
			model: u
		    });
		view.render();
	    });
    };

    app.sidebarHome = function () {
	$('#sidebar').unbind();
	var view = new SidebarHomeView({
		el: $('#sidebar'),
		model: app.loginuser
	    });
	view.render();
	app.search_form();
    };

    app.replyStatus = function (statusid) {
	app.getStatus(statusid, function (orig) {
		orig = orig.toJSON();
		var view = new UpdateStatusView({
			as_box: true,
			text: '@' + orig.user.name + ' ',
			in_reply_to_status_id: statusid
		    });
		view.render();
	    });

    };

    app.repostStatus = function (statusid) {
	app.getStatus(statusid, function (orig) {
		orig = orig.toJSON();
		var s = orig.text.replace(/<(.|\n)*?>/g, '');
		var view = new UpdateStatusView({
			as_box: true,
			text: '转@' + orig.user.name + ' ' + s,
			repost_status_id: statusid
		    });
		view.render();
	    });
    };
    
    app.deleteStatus = function (statusid) {
	if(confirm('确定删除此消息')) {
	    var url = '/proxy/statuses/destroy';
	    $.ajax(url, {
		    type: 'POST',
			data: "id=" + statusid,
			'success': function (data) {
			$('#timeline').trigger('status.destroy', statusid);
		    }
		});
	}
    };
    return app;
}();
