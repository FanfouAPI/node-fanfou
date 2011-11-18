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