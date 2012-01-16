
var appCacheUrls = [
		'/mobile/public/js/jquery-1.7.min.js',
		'/mobile/public/js/jquery.form.js',
		'/mobile/public/js/underscore-min.js',
		'/mobile/public/js/mustache.min.js',
		'/mobile/public/js/backbone-min.js',

		'/mobile/public/js/helper.js',
		'/mobile/public/js/spec.js',
		'/mobile/public/js/model.js',
		'/mobile/public/js/view.js',
		'/mobile/public/js/app.js',
		'/mobile/public/js/mockupdata.js',
		'/mobile/public/css/application.css',
		'/mobile/public/img/logo.png',
		'/mobile/public/dashboard/template.html',
		];

exports.installViews = function (app, version) {
    app.get('/mobile/app.manifest', function (req, res) {
	//res.sendfile(project_file('mobile', '/app.manifest'));
	var c = 'CACHE MANIFEST\n';
	appCacheUrls.forEach(function (url) {
		url = url.replace('/mobile/public/', '/mobile/pub.' + version + '/');
		c += url + '\n';
	    });
	c += '\n';
	c += 'NETWORK:\n';
	c += '*\n';	
	res.header('Content-Type: text/cache-manifest');
	res.send(c);
    });
};
