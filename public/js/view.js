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
	    var statusid = $(evt.currentTarget).parents('.status-row').attr('rel');
	    console.info(statusid);
	    if(statusid) {
		App.gohash('#!/statuses/' + statusid);
	    }
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
		    var userid = $(this).attr('href').replace('http://fanfou.com/', '');
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
	initialize: function () {},
	render: function () {
	    var html = App.template('#update-status-template', {});
	    this.el.html(html);
	    $('#update-status form').ajaxForm({
		    dataType: 'json',
			success: function (data) {
			console.info('updated', data);
			App.gohash('#');
		    }
		});

	}
    });
