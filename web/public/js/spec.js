
var timeline_path = {'/statuses/public_timeline': true,
		     '/statuses/friends_timeline': true,
		     '/statuses/user_timeline': true,
		     '/statuses/mentions': true,
		     '/statuses/context_timeline': true,
		     '/search/public_timeline': true,
		     '/2/lists/statuses': true,
};

var userlist_path = {'/users/friends': true,
		     '/users/followers': true
};

var dmconvlist_path = {'/direct_messages/conversation_list': true};
var dmconv_path = {'/direct_messages/conversation': true};

var status_fields = ['id', 'text', 'created_at', 
		     'in_reply_to_status_id',
		     'in_reply_to_screen_name',
		     'repost_status_id', 'location',
		     ['photo', 'largeurl'],
		     ['photo', 'imageurl'],
		     ['photo', 'thumburl']];

var user_fields = ['id', 'name', 'screen_name', 'profile_image_url',
		   'friends_count', 'followers_count', 'statuses_count'];

var dmconv_fields = ['otherid', 'msg_num',
		     ['dm', 'created_at'],
		     ['dm', 'id'],
		     ['dm', 'text'],
		     ['dm', 'recipient', 'id'],
		     ['dm', 'recipient', 'name'],
		     ['dm', 'recipient', 'profile_image_url'],
		     ['dm', 'sender', 'id'],
		     ['dm', 'sender', 'name'],
		     ['dm', 'sender', 'profile_image_url']];

var dm_fields = ['id', 'created_at', 'text',
		 ['recipient', 'id'],
		 ['recipient', 'name'],
		 ['recipient', 'profile_image_url'],
		 ['sender', 'id'],
		 ['sender', 'name'],
		 ['sender', 'profile_image_url']];

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
    } else if(dmconvlist_path[path]) {
	return encodeDMConvList(data);
    } else if(dmconv_path[path]) {
	return encodeDMList(data);
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

function encodeDMConvList(convlist) {
    var values = [];
    var created_at_index = -1;
    for(var i=0; i<dmconv_fields.length; i++) {
	values[i] = new Array();
	var f = dmconv_fields[i];
	//if(dmconv_fields[i] == ['dm', 'created_at']){
	if(typeof f == 'object' &&
	   f instanceof Array &&
	   f.length == 2 && 
	   f[1] == 'created_at') {
	    created_at_index = i;
	}	
    }
    
    for(var i=0; i<convlist.length; i++) {
	var conv = convlist[i];
	encodeObject(dmconv_fields, values, conv);
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

function encodeDMList(convlist) {
    var values = [];
    var created_at_index = -1;
    for(var i=0; i<dm_fields.length; i++) {
	values[i] = new Array();
	if(dm_fields[i] == 'created_at') {
	    created_at_index = i;
	}	
    }
    
    for(var i=0; i<convlist.length; i++) {
	var dm = convlist[i];
	encodeObject(dm_fields, values, dm);
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


function decodeDMConvList(values) {
    var elem_len = values[0].length;
    var dmconvlist = [];
    for(var i=0; i<elem_len; i++) {
	var dmconv = decodeObject(dmconv_fields, values, i);
	dmconvlist.push(dmconv);
    }
    return dmconvlist;
}

function decodeDMList(values) {
    var elem_len = values[0].length;
    var dmlist = [];
    for(var i=0; i<elem_len; i++) {
	var dm = decodeObject(dm_fields, values, i);
	dmlist.push(dm);
    }
    return dmlist;
}

exports.encodeResult = encodeResult;
exports.decodeTimeline = decodeTimeline;
exports.decodeUserList = decodeUserList;
exports.decodeDMConvList = decodeDMConvList;
exports.decodeDMList = decodeDMList;
