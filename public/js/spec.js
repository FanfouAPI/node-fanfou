
var timeline_path = {'/statuses/public_timeline': true,
		     '/statuses/friends_timeline': true,
		     '/statuses/user_timeline': true,
		     '/statuses/mentions': true,
		     '/statuses/context_timeline': true,
		     '/search/public_timeline': true
};

var userlist_path = {'/users/friends': true,
		     '/users/followers': true
};

var status_fields = ['id', 'text', 'created_at'];
var user_fields = ['id', 'name', 'screen_name', 'profile_image_url',
		   'friends_count', 'followers_count', 'statuses_count'];
for(var i=0; i<user_fields.length; i++) {
    var uf = user_fields[i];
    if(typeof uf == 'string') {
	status_fields.push(['user', uf]);	
    } else {
	// Array
	var key = ['user'];
	for(var j=0; j< uf.length; j++) {
	    key.push(uf[j]);
	}
	status_fields.push(key);
    }
}

function decodeObject(fields, values, index) {
    var len = fields.length;
    var obj = new Object();
    for(var i=0; i<len; i++) {
	var key = fields[i];
	if(typeof key == 'string') {
	    obj[key] = values[i][index];
	} else { // Array
	    var m = obj;
	    var j = 0;
	    for(; j<key.length - 1; j++) {
		var subkey = key[j];
		if(m[subkey] == undefined) {
		    m[subkey] = new Object();
		}
		m = m[subkey];
	    }
	    m[key[j]] = values[i][index];
	}
    }
    return obj;
}

function encodeObject(fields, values, obj) {
    var len = fields.length;
    for(var i =0; i<len; i++) {
	var key = fields[i];
	var v;
	if(typeof key == 'string') {
	    v = obj[key];
	} else { //Array
	    v = obj;
	    for(var j = 0; j<key.length; j++) {
		v = v[key[j]];
		if(v == undefined) {
		    break;
		}
	    }
	}
	if(v == undefined) {
	    v = null;
	}
	values[i].push(v);	
    }
}

function encodeResult(path, data) {
    if(timeline_path[path]) {
	return encodeTimeline(data);
    } else if(userlist_path[path]) {
	return encodeUserList(data);
    } else {
	return data;
    }
}

function encodeUserList(userlist) {
    var values = [];
    for(var i=0; i<status_fields.length; i++) {
	values[i] = new Array();
    }

    for(var i=0; i<userlist.length; i++) {
	var user = userlist[i];
	encodeObject(user_fields, values, user);
    }
    return values;
}

function encodeTimeline(timeline) {
    var values = [];
    var created_at_index = -1;
    for(var i=0; i<status_fields.length; i++) {
	values[i] = new Array();
	if(status_fields[i] == 'created_at'){
	    created_at_index = i;
	}	
    }
    
    for(var i=0; i<timeline.length; i++) {
	var status = timeline[i];
	encodeObject(status_fields, values, status);
    }
    
    if(created_at_index >= 0) {
	var narr = new Array();
	for(var i=0; i<values[created_at_index].length; i++) {
	    var ts = values[created_at_index][i];
	    var v = new Date(ts).getTime();
	    narr.push(v);
	}
	values[created_at_index] = narr;
    }
    return values;
}

function decodeTimeline(values) {
    var elem_len = values[0].length;
    var timeline = [];
    for(var i=0; i<elem_len; i++) {
	var status = decodeObject(status_fields, values, i);
	timeline.push(status);
    }
    return timeline;
}

function decodeUserList(values) {
    var elem_len = values[0].length;
    var userlist = [];
    for(var i=0; i<elem_len; i++) {
	var status = decodeObject(user_fields, values, i);
	userlist.push(status);
    }
    return userlist;
}

exports.encodeResult = encodeResult;
exports.decodeTimeline = decodeTimeline;
exports.decodeUserList = decodeUserList;;

