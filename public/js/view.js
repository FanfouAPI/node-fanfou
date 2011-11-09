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
	events: {},
	initialize: function (){},
	render: function() {
	    var html = App.template('#status-template', this.model.toJSON());
	    this.el.html(html);
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
	    /*var s = '';
	    var e = evt.originalEvent.changedTouches[0];
	    for(var k in e) {
		s += k + ' => ' + e[k] + '\n';
	    }
	    rconsole.info(s); */
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
		var html = App.template('#status-commands-template', {
			statusid: statusid
		    });
		var dom = $(html);
		//dom.insertAfter(dock);
		dock.append(dom);
	    }
	},

	initialize: function () {

	},
	render: function () {
	    var timeline = _.map(this.collection.models, function (obj) {
		    return obj.toJSON();
		});

	    var html = App.template('#timeline-template', {
		    timeline: timeline
		});
	    var dom = $(html);
	    $('a.former', $(dom)).each(function () {
		    //var userid = $(this).attr('href').replace('http://fanfou.com/', '');
		    var userid = $(this).attr('href').replace(/.*\//g, '');
		    $(this).addClass('user')
			.attr('href', '#')
			.attr('rel', userid);
			/*.attr('href', 
			      "javascript:App.gotoUserTimeline('" + 
			      userid + "');"); */
		});
	    $('a', $(dom)).each(function () {
		    var href = $(this).attr('href').replace('http://fanfou.com/', '#!/');
		    
		    if(/^\/q\/./.test(href)) {
			$(this).attr('href', '#!/q/' + encodeURIComponent(href.substr(3)));
		    }
		});
	    this.el.html(dom);
	}
    });

var UpdateStatusView = Backbone.View.extend({
	events: {},
	initialize: function (opts) {
	    this.text = opts.text || '';
	    this.repost_status_id = opts.repost_status_id || '';
	    this.in_reply_to_status_id = opts.in_reply_to_status_id || '';
	    console.info('xxx', opts);
	},

	render: function () {
	    var context = {
		repost_status_id: this.repost_status_id,
		in_reply_to_status_id: this.in_reply_to_status_id,
		text: this.text
	    };
	    var html = App.template('#update-status-template', context);
	    this.el.html(html);
	    console.info(html, context);
	    $('#update-status form').ajaxForm({
		    dataType: 'json',
			success: function (data) {
			App.gohash('#');
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
