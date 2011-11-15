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

var SearchView = Backbone.View.extend({
	events: {
	    'click #exec': 'do_search'
	},
	do_search: function (evt) {
	    var v = $(evt.currentTarget).siblings('#id_q').val();
	    if(v) {
		App.gohash('#!/q/' + encodeURIComponent(v));
	    }
	},
	initialize: function () {},

	render: function () {
	    var html = App.template('#query-template', {});
	    this.el.html(html);
	}
    });

var StatusView = Backbone.View.extend({
	events: {
	    'click a.user': 'click_userlink'
	},

	click_userlink: function (evt) {
	    evt.preventDefault();
	    var userid = $(evt.currentTarget).attr('rel');
	    if(userid) {
		App.gotoUserTimeline(userid);
	    }
	    evt.stopPropagation();
	},

	initialize: function (){},
	render: function() {
	    var status = this.model.toJSON();
	    status.created_at = parse_date(status.created_at);
	    var html = App.template('#status-template', status);
	    var dom = $(html);
	    process_status_dom(dom);
	    this.el.html(dom);
	}
    });

var TimelineView = Backbone.View.extend({
	events: {
	    'click a.user': 'click_userlink',
	    'touchstart .status-row': 'touchstart_status',
	    'touchend .status-row': 'touchend_status',
	    'mousedown .status-row': 'touchstart_status',
	    'mouseup .status-row': 'touchend_status'
	},

	touchend_status: function (evt) {
	    if(this.touched_row) {
		var target = $(evt.currentTarget);
		if(!target.hasClass('status-row')) {
		    target = target.parents('.status-row');
		}
		var statusid = target.attr('rel');
		if(statusid && statusid == this.touched_row.statusid) {
		    var pageX = evt.type == 'mouseup'?evt.pageX:evt.originalEvent.changedTouches[0].pageX;
		    if(Math.abs(pageX - this.touched_row.pageX) > 80) {
			this.show_commands(target);
		    }
		}
		this.touched_row = null;
	    }
	},

	touchstart_status: function (evt) {
	    var target = $(evt.currentTarget);
	    if(!target.hasClass('status-row')) {
		target = target.parents('.status-row');
	    }
	    if(target.length) {
		var pageX = evt.type == 'mousedown'?evt.pageX:evt.originalEvent.changedTouches[0].pageX;
		this.touched_row = {
		    'statusid': target.attr('rel'),
		    'pageX': pageX
		};
	    }
	},
	
	click_userlink: function (evt) {
	    evt.preventDefault();
	    var userid = $(evt.currentTarget).attr('rel');
	    if(userid) {
		App.gotoUserTimeline(userid);
	    }
	    evt.stopPropagation();
	},

	show_commands: function (dock) {
	    if($('#status-commands', dock).length) {
		$('#status-commands').remove();
	    } else {
		$('#status-commands').remove();
		var statusid = dock.attr('rel');
		var repost_status_id = dock.attr('repost');
		
		var status = null;
		var created_at = '';
		for(var i=0; i<this.collection.models.length; i++) {
		    var obj = this.collection.models[i];
		    if(obj.get('id') == statusid) {
			status = obj.toJSON();
			created_at = parse_date(status.created_at);
		    }
		}

		var html = App.template('#status-commands-template', {
			statusid: statusid,
			created_at: created_at,
			repost_status_id: repost_status_id
		    });
		var dom = $(html);
		//dom.insertAfter(dock);
		dock.append(dom);
	    }
	},

	initialize: function (opts) {
	    this.prefix = opts.prefix || '';
	},
	
	render: function () {
	    var timeline = _.map(this.collection.models, function (obj) {
		    return obj.toJSON();
		});
	    
	    var html = App.template('#timeline-template', {
		    prefix: this.prefix,
		    timeline: timeline
		});
	    var dom = $(html);
	    process_status_dom(dom);
	    this.el.html(dom);
	}
    });

var UpdateStatusView = Backbone.View.extend({
	events: {},
	initialize: function (opts) {
	    this.text = opts.text || '';
	    this.repost_status_id = opts.repost_status_id || '';
	    this.in_reply_to_status_id = opts.in_reply_to_status_id || '';
	},

	render: function () {
	    var context = {
		repost_status_id: this.repost_status_id,
		in_reply_to_status_id: this.in_reply_to_status_id,
		text: this.text
	    };
	    var html = App.template('#update-status-template', context);
	    this.el.html(html);
	    $('#update-status form').ajaxForm({
		    dataType: 'json',
			success: function (data) {
			App.gohash('#');
		    }
		});
	    this.$('textarea').focus();
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
		$(html).insertAfter(this.el);
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
		$(html).insertAfter(this.el);
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