// Backbone model
var Status = Backbone.Model.extend({
    });

var User = Backbone.Model.extend({
    });

// Collections
var Timeline = Backbone.Collection.extend({
	model: Status,
	parse: function (resp, xhr) {
	    var sk = exports.decodeTimeline(resp);
	    return sk;
	}
    });
