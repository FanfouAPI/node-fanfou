var NotifyView = Backbone.View.extend({
	events: {},
	initialize: function (opts) {
	    this.content = opts.content;
	},
	render: function () {
	    var html = App.template('#notify-template', {content: this.content});
	    var dom = $(html);
	    //dom.height(window.innerHeight - 10);
	    this.el.html(dom);	    
	}
    });

var UserView = Backbone.View.extend({
	events: {
	},
	initialize: function () {
	},
	render: function () {
	    var u = this.model.toJSON();
	    var html = App.template('#user-info-template', u);
	    this.el.html(html);
	}
    });

var SearchView = Backbone.View.extend({
	events: {
	    'click #exec': 'do_search',
	    'keydown #id_q': 'do_keydown'
	},
	do_keydown: function (evt) {
	    if(evt.keyCode == 13) {
		this.$('#exec').focus().click();
	    }
	},

	do_search: function (evt) {
	    var v = $(evt.currentTarget).siblings('#id_q').val();
	    if(v) {
		App.gohash('#!/q/' + encodeURIComponent(v));
		$('#id_q').val('');
	    }
	},
	initialize: function () {},

	render: function () {
	    var html = App.template('#sidebar-search-template', {});
	    this.el.append(html);
	}
    });


var StatusView = Backbone.View.extend({
	events: {
	    'click a.user': 'click_userlink',
	    'mouseover a.user': 'mouseover_userlink',
	    'click .image': 'click_image'
	},

	click_userlink: function (evt) {
	    evt.preventDefault();
	    var userid = $(evt.currentTarget).attr('rel');
	    if(userid) {
		App.gotoUserTimeline(userid);
	    }
	    evt.stopPropagation();
	},

	mouseover_userlink: function (evt) {
	    console.info('mouse over', 'ok');
	    var userid = $(evt.currentTarget).attr('rel');
	    },

	click_image: function (evt) {
	    var div = $(evt.currentTarget);
	    var img = $('img', div);
	    var urla = img.attr('rel');
	    var urlb = img.attr('src');
	    img.attr('rel', urlb);
	    img.attr('src', urla);
	},

	initialize: function (){},

	render: function() {
	    var status = this.model.toJSON();
	    if(!status.photo || !status.photo.imageurl) {
		status.photo = null;
	    }
	    status.created_at = parse_date_str(status.created_at);
	    var html = App.template('#status-template', status);
	    var dom = $(html);
	    process_status_dom(dom, status);
	    this.$('.r-box-content').html(dom);
	}
    });

var TimelineView = Backbone.View.extend({
	events: {
	    'click a.user': 'click_userlink',
	    'mouseover a.user': 'mouseover_userlink',
	    'click .image': 'click_image',
	    'click #timeline-more': 'more_timeline',
	    'click #timeline-top': 'to_top',
	    'click .notice-new': 'render_fresh',
	    'mouseover .status-row': 'hover_status',
	    'mouseout .status-row': 'leave_status',
	    'get_new #timeline': 'get_new',
	    'status.destroy #timeline': 'on_status_destroy'
	},

	hover_status: function (evt) {
	    var row = $(evt.currentTarget);
	    if(!row.hasClass('status-row')) {
		row = row.parents('.status-row');
	    }
	    $('.status-commands').hide();
	    $('.status-commands', row).show();
	},

	leave_status: function (evt) {
	    var row = $(evt.currentTarget);
	    if(!row.hasClass('status-row')) {
		row = row.parents('.status-row');
	    }
	    $('.status-commands', row).hide();
	},

	click_userlink: function (evt) {
	    evt.preventDefault();
	    var userid = $(evt.currentTarget).attr('rel');
	    if(userid) {
		App.gotoUserTimeline(userid);
	    }
	    evt.stopPropagation();
	},

	mouseover_userlink: function (evt) {
	    var userid = $(evt.currentTarget).attr('rel');
	    if(userid) {
		userid = encodeURIComponent(userid);
		App.prefetchTimeline('/proxy/statuses/user_timeline?format=html&id=' + userid);
	    }
	},

	click_image: function (evt) {
	    var div = $(evt.currentTarget);
	    var img = $('img', div);
	    var urla = img.attr('rel');
	    var urlb = img.attr('src');
	    img.attr('rel', urlb);
	    img.attr('src', urla);
	},

	on_status_destroy: function (evt, statusid) {
	    var view = this;
	    this.$('#' + statusid).slideUp(function () {
		    view.$('#' + statusid).remove();
		    App.timelineCache.erase(view.url);
		});
	},
	initialize: function (opts) {
	    this.view_classes = opts.view_classes || '';
	    this.warning = opts.warning || '';
	    this.prefix = opts.prefix || '';
	    this.url = opts.url || opts.collection.url || '';
	    if(opts.show_avatar == undefined) {
		this.show_avatar = true;
	    } else {
		this.show_avatar = !!opts.show_avatar;
	    }
	    this.fresh_collection = new Timeline();
	},

	render_status: function (obj) {
	    obj = obj.toJSON();
	    if(!obj.photo.imageurl) {
		obj.photo = null;
	    }
	    obj.created_at = parse_date_str(obj.created_at);
	    obj.deletable = obj.user.id == App.loginuser.id;
	    obj.show_avatar = this.show_avatar;
	    var sthtml = App.template('#timeline-status-template', obj);
	    var stdom = $(sthtml);
	    process_status_dom(stdom, obj);
	    return stdom;
	},
	
	notify: function (word) {
	    this.$('.timeline-notice').html(word).slideDown();
	},

	get_new: function (evt) {
	    var since_id = this.$('.status-row:first').attr('rel');
	    if(this.fresh_collection.length > 0) {
		since_id = this.fresh_collection.models[0].get('id');
	    }
	    var fresh_url = this.url + (this.url.indexOf('?') >= 0? '&': '?') + 'since_id=' + since_id;
	    var view = this;
	    var rows = this.$('#timeline-rows');
	    App.getTimeline(fresh_url, {
		    'disable_cache': true,
		    'success': function (data) {
			if(data.length > 0) {
			    data.add(view.fresh_collection.models);
			    view.fresh_collection = data;
			    view.notify('<span class="notice-new">新增' + view.fresh_collection.length + '条消息，点击查看</span>');
			}
		    }
		});
	},

	render_fresh: function (evt) {
	    if(this.fresh_collection.length > 20) {
		this.fresh_collection = new Timeline();
		this.$('.timeline-notice').empty().hide();
		App.gohash(window.location.hash);
	    } else {
		var rows = this.$('#timeline-rows');
		var div = $('<div id="temple">');
		var view = this;
		_.map(this.fresh_collection.models, function (st) {
			var stdom = view.render_status(st);
			div.append(stdom);
		    });
		
		/*div.hide().prependTo(rows).slideDown('slow', function () {
			view.$('.timeline-notice').empty().slideUp()
			});*/
		this.$('.timeline-notice').empty().hide();
		rows.prepend(div);
		this.fresh_collection = new Timeline();
	    }
	},

	to_top: function (evt) {
	    $(document).scrollTop(0);
	},

	more_timeline: function (evt) {
	    var max_id = this.$('.status-row:last').attr('rel');
	    var more_url = this.url + (this.url.indexOf('?') >= 0? '&': '?') + 'max_id=' + max_id;
	    var rows = this.$('#timeline-rows');
	    
	    var view = this;
	    App.getTimeline(more_url, {
		    'success': function (data) {	
			_.map(data.models, function (obj) {
				var stdom = view.render_status(obj);
				rows.append(stdom);
				return obj;
			    });
		    }
		});
	},
	
	render: function () {
	    var html = App.template('#timeline-template', {
		    prefix: this.prefix,
		    url: this.collection.url,
		    view_classes: this.view_classes,
		    warning: !!this.warning
		});
	    var dom = $(html);
	    var view = this;
	    _.map(this.collection.models, function (obj) {
		    var stdom = view.render_status(obj);
		    $('#timeline-rows', dom).append(stdom);
		    return obj;
		});
	    this.$('#timeline').html(dom);
	    if(this.warning) {
		this.notify(this.warning);
	    }
	}
    });

var UpdateStatusView = Backbone.View.extend({
	events: {
	},

	initialize: function (opts) {
	    this.text = opts.text || '';
	    this.repost_status_id = opts.repost_status_id || '';
	    this.in_reply_to_status_id = opts.in_reply_to_status_id || '';
	    this.as_box = opts.as_box || false;
	},

	render: function () {
	    var context = {
		repost_status_id: this.repost_status_id,
		in_reply_to_status_id: this.in_reply_to_status_id,
		text: this.text
	    };
	    
	    var form;
	    if(this.as_box) {
		App.facebox('#update-status-template', context);
		form = $('#facebox #update-status form');
	    } else {
		var html = App.template('#update-status-template', context);
		this.$('.r-box-content #main-header').html(html);
		this.$('textarea').focus().click();
		form = this.$('#update-status form');
		initSWFUpload(form);
	    }

	    var view = this;
	    form.ajaxForm({
		    dataType: 'json',
		    success: function (data) {
			if(view.as_box) {
			    $(document).trigger('close.facebox');
			} else {
			    App.gohash('#');
			}
		    },
		    complete: function () {
		    }
		});

	}
    });

var TrendsView = Backbone.View.extend({
	events: {},
	initialize: function (opts) {
	    this.title = opts.title;
	},
	render: function () {
	    var trends = _.map(this.model.get('trends'), function (q) {
		    return {
			'name': q.name,
			'query': encodeURIComponent(q.query)
		    }
		});
	    if(trends.length) {
		var html = App.template('#trends-template', {
			trends: trends,
			title: this.title
		    });
		//$(html).insertAfter(this.el);
		this.$('.r-box-content').append(html);
	    }
	}
    });

var QueryListView = Backbone.View.extend({
	events: {},
	initialize: function (opts) {
	    this.title = opts.title;
	},
	render: function () {
	    var trends = _.map(this.collection.models, function (q) {
		    q = q.toJSON();
		    return {
			'name': q.name,
			'query': encodeURIComponent(q.query)
		    }
		});
	    if(trends.length) {
		var html = App.template('#trends-template', {
			trends: trends,
			title: this.title
		    });
		//$(html).insertAfter(this.el);
		this.$('.r-box-content').append(html);
	    }
	}
    });

var UserListView = Backbone.View.extend({
	events: {
	    'mousedown #userlist-area': 'drag_start',
	    'mousemove #userlist-area': 'drag_move',
	    'mouseup #userlist-area': 'drag_end',
	    'touchstart  #userlist-area': 'drag_start',
	    'touchmove #userlist-area': 'drag_move',
	    'touchend #userlist-area': 'drag_end',
	    //'mouseup a.user': 'click_user',
	},
	click_user: function (evt) {
	    //evt.preventDefault();
	    var userid = $(evt.currentTarget).attr('rel');
	    if(!userid) {
		userid = $(evt.currentTarget).parents('.user-item').attr('rel');
	    }
	    if(userid) {
		App.gotoUserTimeline(userid);
	    }
	    //evt.stopPropagation();
	},
	drag_start: function (evt) {
	    /*var userid = $(evt.target).parents('.user-item').attr('rel');
	    if(userid) {
		this.dragging_userid = userid;
		}*/

	    evt.preventDefault();
	    var pageX = evt.type == 'mousedown'?evt.pageX:evt.originalEvent.changedTouches[0].pageX;
	    this.start_x = pageX;
	    this.delta_x = 0;

	    this.box = this.$('#user-box');
	    this.start_left = this.box.offset().left;
	    this.drag_timer();
	    evt.stopPropagation();
	},

	drag_timer: function () {
	    var v = this;
	    if(this.start_x) {
		this.box.animate({'left': (this.start_left + this.delta_x) + 'px'}, 
				 'fast',
				 function () {
				     v.drag_timer();
					 });
	    } else {
		var wwidth = this.el.width();
		var box_width = this.box.width();
		var box_center = this.box.offset().left + box_width / 2;
		var center = (wwidth - box_width) / 2;

		function tocenter(box, center) {
		    box.animate({'left': center + 'px'}, 'fast');
		}

		if(this.box.offset().left + box_width >= wwidth) {
		    if(this.page <= 0) {
			tocenter(this.box, center);
		    } else {
			this.box.animate({'left': wwidth + 'px'}, 'fast',
					 function () {
					     v.prev_page();
					 });
		    }
		} else if(this.box.offset().left <= 10) {
		    if((this.page + 1) * this.pagesize >= this.collection.models.length) {
			tocenter(this.box, center);
		    } else {
			this.box.animate({'left': -box_width + 'px'}, 'fast', 
					 function() {
					     v.next_page();
					 });
		    }
		} else {
		    tocenter(this.box, center);
		}
	    }
	},
	
	drag_move: function (evt) {
	    if(this.start_x) {
		var pageX = evt.type == 'mousemove'?evt.pageX:evt.originalEvent.changedTouches[0].pageX;
		this.delta_x = pageX - this.start_x;
	    }
	},

	drag_end: function (evt) {
	    if(this.start_x) {
		this.start_x = null;
		/*if(this.dragging_userid) {
		    if($(evt.target).attr('id') == 'userlist-area') {
			App.gotoUserTimeline(this.dragging_userid);
		    }
		}
		this.dragging_userid = null; */

	    }
	},

	initialize: function () {
	    this.start_x = null;
	    this.page = 0;
	    this.pagesize = 10;
	    this.fromleft = 0;	    
	},
	
	next_page: function () {
	    this.page += 1;
	    this.fromleft = 0;
	    this.render();
	},

	prev_page: function () {
	    this.page -= 1;
	    this.fromleft = 1;
	    this.render();
	},

	render: function () {
	    var start = this.page * this.pagesize;
	    var end = start + this.pagesize;
	    var userlist = _.map(this.collection.models.slice(start, end), function (obj) {
		    obj = obj.toJSON();
		    obj.short_name = obj.name.substr(0, 4);
		    return obj;
		});

	    var html = App.template('#userlist-template', {
		    userlist: userlist
		});
	    var boxdom = $(html);
	    if(this.fromleft) {
		$('#user-box', boxdom).css('left', '-300px');
	    } else {
		$('#user-box', boxdom).css('left', this.el.width() + 'px');
	    }
	    this.el.html(boxdom);
	    var box = this.$('#user-box');
	    var center = (this.el.width() - box.width()) / 2;

	    this.$('#user-box').animate({
		    'left': center
			}, 'slow');
	}
    });

var DMConvListView = Backbone.View.extend({
	events: {
	    //'click .dm-row': 'click_dm',
	    'touchstart .dm-row': 'touchstart_dm',
	    'touchend .dm-row': 'touchend_dm',
	    'mousedown .dm-row': 'touchstart_dm',
	    'mouseup .dm-row': 'touchend_dm'
	},
	initialize: function() {
	},

	click_dm: function (evt) {
	    
	},
	touchend_dm: function (evt) {
	    if(this.touched_row) {
		var target = $(evt.currentTarget);
		if(!target.hasClass('dm-row')) {
		    target = target.parents('.dm-row');
		}
		var dmid = target.attr('rel');
		if(dmid && dmid == this.touched_row.dmid) {
		    var pageX = evt.type == 'mouseup'?evt.pageX:evt.originalEvent.changedTouches[0].pageX;
		    if(Math.abs(pageX - this.touched_row.pageX) > 80) {
			this.to_conversation(target);
		    }
		}
		this.touched_row = null;
	    }
	},

	touchstart_dm: function (evt) {
	    var target = $(evt.currentTarget);
	    if(!target.hasClass('dm-row')) {
		target = target.parents('.dm-row');
	    }
	    if(target.length) {
		var pageX = evt.type == 'mousedown'?evt.pageX:evt.originalEvent.changedTouches[0].pageX;
		this.touched_row = {
		    'dmid': target.attr('rel'),
		    'pageX': pageX
		};
	    }
	},

	to_conversation: function (dock) {
	    var peerid = dock.attr('rel');
	    if(peerid) {
		App.gohash('#!/dm/' + encodeURIComponent(peerid));
	    }
	},

	render: function () {
	    var dmlist = _.map(this.collection.models, function (obj) {
		    var msg = obj.toJSON();
		    var is_sender = msg.dm.recipient.id == msg.otherid;
		    msg.peer = (is_sender?
				msg.dm.recipient:
				msg.dm.sender);
		    msg.peer.sender_class = is_sender? 'sender': '';
		    return msg;
		});
	    var html = App.template('#dmconv-list-template', {
		    dmlist: dmlist
			});
	    this.el.html(html);
	}
    });

var DMConversationView = Backbone.View.extend({
	events: {
	    'click .dm-send img': 'click_dm',
	},
	initialize: function(opts) {
	    this.user = opts.user;
	},

	click_dm: function (evt) {
	    $(evt.currentTarget).parents('form').submit();
	},

	render: function () {
	    var dmlist = _.map(this.collection.models, function (obj) {
		    var msg = obj.toJSON();
		    msg.sender.avatar_align = (msg.sender.id == App.loginuser.get('id')?
					       'avatar-right': 'avatar-left');
		    return msg;
		});
	    var html = App.template('#dm-conversation-template', {
		    dmlist: dmlist,
		    user: this.user,
		    loginuser: App.loginuser.toJSON()
			});
	    this.el.html(html);
	    this.$('.dm-send form').ajaxForm({
		    dataType: 'json',
		    success: function (data) {
			App.gohash(window.location.hash);
		    },
			error: function (err, req) {
			App.handleError(err, req);
		    },
			complete: function () {
		    }
		});

	}
    });

var SidebarHomeView = Backbone.View.extend({
	events: {},
	initialize: function () {
	    
	},
	render: function () {
	    var user = this.model.toJSON();
	    var html = App.template('#sidebar-home-template', user);
	    this.el.html(html);
	}
    });

var SidebarUserView = Backbone.View.extend({
	events: {},
	initialize: function () {
	    
	},
	render: function () {
	    var user = this.model.toJSON();
	    var html = App.template('#sidebar-user-template', user);
	    this.el.html(html);
	}
    });
