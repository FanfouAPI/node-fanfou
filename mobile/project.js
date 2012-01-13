
var appCacheUrls = [
		'/public/mobile/js/jquery-1.7.min.js',
		'/public/mobile/js/jquery.form.js',
		'/public/mobile/js/underscore-min.js',
		'/public/mobile/js/mustache.min.js',
		'/public/mobile/js/backbone-min.js',
		'/public/mobile/js/helper.js',
		'/public/mobile/js/spec.js',
		'/public/mobile/js/model.js',
		'/public/mobile/js/view.js',
		'/public/mobile/js/app.js',
		'/public/mobile/js/mockupdata.js',
		'/public/mobile/css/application.css',
		'/public/mobile/img/logo.png',
		];

exports.installViews = function (app, version) {
    app.get('/app.mobile.manifest', function (req, res) {
	//res.sendfile(project_file('mobile', '/app.manifest'));
	var c = 'CACHE MANIFEST\n';
	appCacheUrls.forEach(function (url) {
		c += url + '\n';
	    });
	c += '/app_template/mobile/' + version + '.html\n';
	c += '\n';
	c += 'NETWORK\n';
	c += '*\n';	
	res.header('Content-Type: text/cache-manifest');
	res.send(c);
    });
};
