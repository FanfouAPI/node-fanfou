// Backbone model
var Status = Backbone.Model.extend({
    });

var User = Backbone.Model.extend({
	set_background: function () {
	    var u = this.toJSON();
	    var body = $(document.body);
	    if(u.profile_background_image_url) {
		body.removeClass('default')
		    .css('background-color', u.profile_background_color)
		    .css('background-image', 'url(' + u.profile_background_image_url + ')');
		if(u.profile_background_tile) {
		    body.css('background-repeat', 'repeat');
		} else {
		    body.css('background-repeat', 'no-repeat');
		}
	    } else {
		body.css('background-color', '')
		.css('background-image', '')
		.css('background-repeat', '')
		.addClass('default');
	    }
	}
    });

var Query = Backbone.Model.extend({});

var DirectMessage = Backbone.Model.extend({});

// Collections
var Timeline = Backbone.Collection.extend({
	model: Status,
	parse: function (resp, xhr) {
	    var sk = exports.decodeTimeline(resp);
	    return sk;
	}
    });

var QueryList = Backbone.Collection.extend({
	model: Query
    });

var Trends = Backbone.Model.extend({
    });

var UserList = Backbone.Collection.extend({
	model: User,
	parse: function (resp, xhr) {
	    var sk = exports.decodeUserList(resp);
	    return sk;
	}
    });

var DMList = Backbone.Collection.extend({
	model: DirectMessage,
	parse: function (resp, xhr) {
	    var sk = exports.decodeDMList(resp);
	    return sk;
	}	
    });

var DMConvList = Backbone.Collection.extend({
	model: DirectMessage,
	parse: function (resp, xhr) {
	    var sk = exports.decodeDMConvList(resp);
	    return sk;
	}	
    });
