
var timeline_path = {'/statuses/public_timeline': true,
		     '/statuses/friends_timeline': true,
		     '/statuses/user_timeline': true,
		     '/statuses/mentions': true
};

var status_fields = ['id', 'text', 'created_at', 'user'];
var user_fields = ['id', 'name', 'screen_name', 'profile_image_url', 'friends_count', 'followers_count', 'statuses_count'];

function encodeUser(user) {
    var values = [];
    for(var i =0; i< user_fields.length; i++) {
	var v = user[user_fields[i]];
	if(v == undefined) {
	    v = null;
	}
	values.push(v);
    }
    return values;
}

function decodeUser(val) {
    if(val == undefined) {
	console.info('undefined');
	return null;
    }
    var start = 0;
    var user = new Object();
    for(var i=0; i<user_fields.length; i++) {
	var key = user_fields[i];
	var v = val[i];
	user[key] = v;
    }
    return user;
}

function encodeStatus(values, status) {
    var len = status_fields.length;
    for(var i = 0; i<len; i++) {
	var key = status_fields[i];
	var v;
	if(key == 'user') {
	    v = encodeUser(status[key]);
	} else if (key == 'created_at') {
	    v = status[key];
	    v = new Date(v).getTime();
	    v = v / 1000;
	} else {
	    v = status[key];
	}
	if(v == undefined) {
	    v = null;
	}
	values[key].push(v);
    }
}

function decodeStatus(values, index) {
    var status = new Object();
    for(var i=0; i<status_fields.length; i++) {
	var key = status_fields[i];
	var v = values[key][index];
	if(key == 'user') {
	    v = decodeUser(v);
	    if(!v) {
		console.info(values[key]);
	    }
	} else if(key == 'created_at') {
	    v = new Date(v * 1000);
	}
	status[key] = v;
    }
    return status;
}

function encodeTimeline(path, timeline) {
    if(timeline_path[path]) {
	var values = {};
	for(var i=0; i<status_fields.length; i++) {
	    values[status_fields[i]] = [];
	}
	for(var i=0; i<timeline.length; i++) {
	    var status = timeline[i];
	    var st = encodeStatus(values, status);
	}
	var newvalues = [];
	for(var i=0; i<status_fields.length; i++) {
	    newvalues.push(values[status_fields[i]]);
	}
	return values;
    } else {
	return timeline;
    }
}

function decodeTimeline(values) {
    var elem_len = values[status_fields[0]].length;
    var timeline = [];
    for(var i=0; i<elem_len; i++) {
	var status = decodeStatus(values, i);
	timeline.push(status);
    }
    return timeline;
}

exports.encodeTimeline = encodeTimeline;
exports.decodeTimeline = decodeTimeline;

