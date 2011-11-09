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
	    'click .status-content': 'click_content'
	},
	click_userlink: function (evt) {
	    evt.preventDefault();
	    var userid = $(evt.currentTarget).attr('rel');
	    if(userid) {
		App.gotoUserTimeline(userid);
	    }
	    evt.stopPropagation();
	},

	click_content: function (evt) {
	    $('#status-commands').remove();
	    var dock = $(evt.currentTarget).parents('.status-row');
	    var statusid = dock.attr('rel');
	    var html = App.template('#status-commands-template', {
		    statusid: statusid
		});
	    var dom = $(html);

	    console.info(dock);
	    dom.insertAfter(dock);
	    //dock.append(dom);
	},

	initialize: function () {},
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
