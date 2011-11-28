//var querystring = require('querystring');
var fs = require('fs');

exports.compose_multipart = function (fields, files, callback) {
    var boundary = '-----------ksadfsfwXXX';
    var buffer = new Buffer(1024 * 1024 * 4, 'binary');
    var offset = 0;

    for(var key in files) {
	offset += buffer.write('--' + boundary + '\r\n', offset);
	var entry = files[key];
	offset += buffer.write('Content-Disposition: form-data; name="' +
			       key + '"; filename="' + 'aaa.png' + 
			       '"\r\n', offset);
	offset += buffer.write('Content-Type: ' + entry.type + '\r\n\r\n', offset);
	//var fbuffer = fs.readFileSync(entry.path, 'binary');
	var fd = fs.openSync(entry.path, 'r');
	var fbuffer = new Buffer(entry.size, 'binary');
	var sz = fs.readSync(fd, fbuffer, 0, entry.size, 0);
	fbuffer.copy(buffer, offset, 0, sz);
	offset += sz;
	//offset += buffer.write(fbuffer, offset);
	offset += buffer.write('\r\n', offset);
	fs.closeSync(fd);
    }

    for(var key in fields) {
	offset += buffer.write('--' + boundary + '\r\n', offset);
	offset += buffer.write('Content-Disposition: form-data; name="' + key + '"\r\n\r\n', offset);
	//offset += buffer.write(querystring.escape(fields[key]), offset);
	offset += buffer.write(fields[key], offset);
	offset += buffer.write('\r\n', offset);
    }

    // End boundary
    offset += buffer.write('--' + boundary + '--\r\n', offset);
    var data = buffer.toString('binary', 0, offset);
    callback(boundary, data);
}

function get_last_modified() {
    var lm = 0;
    for(var i=0; i<arguments.length; i++) {
	var f = arguments[i];
	var stat = fs.statSync(f);
	var m;
	if(stat.isDirectory()) {
	    var dirlist = fs.readdirSync(f);
	    for(var j=0; j<dirlist.length; j++) {
		var de = dirlist[j];
		m = get_last_modified(f + '/' + de);
		if(m > lm) {
		    lm = m;
		}
	    }
	} else {
	    //console.info('checking', f);
	    m = new Date(stat.mtime).getTime() / 1000;
	    if(m > lm) {
		lm = m;
	    }
	}
    }
    return lm;
}

exports.get_last_modified = get_last_modified;
