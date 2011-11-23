// Backbone model
var Status = Backbone.Model.extend({
    });

var User = Backbone.Model.extend({
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
	model: DirectMessage
    });