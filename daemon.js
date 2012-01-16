var express = require('express');
var OAuth = require('oauth').OAuth;
var formidable = require('formidable');

var fs = require('fs');
var apivendor = require('./apivendor.js');
var settings =  require('./settings.js');
var maxAge = 60 * 60 * 24 * 365; // One Year

var installed_projects = ['mobile', 'web'];
var default_project = 'mobile';

files = ['apivendor.js',
	 'daemon.js', 'helper.js',
	 'settings.js'];

var project_modules = {};
var project_specs = {};

function project_file(prj, fn) {
    return __dirname + '/' + prj + fn;
}

installed_projects.forEach(function (prj) {
	project_modules[prj] = require('./' + prj + '/project.js');
	files.push(prj);
	var spec = require(project_file(prj, '/public/js/spec.js'));
	project_specs[prj] = spec;
    });


var helper = require('./helper.js');
apivendor.config(settings.oauth_info);

// Setup the Express.js server
var app = express.createServer();
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
	    secret: "skjghskdjfhbqigohqdioukd"
		}));
var modified = helper.get_last_modified.apply({}, files);
var version = modified.__last_modified;

/** static files */
app.use('/facebox', express.static(__dirname + '/facebox', {maxAge: maxAge * 1000}));
app.use('/swfupload', express.static(__dirname + '/swfupload', {maxAge: maxAge * 1000}));


app.get('/logout', function (req, res) {
	apivendor.logout(req);
	res.redirect('/');
    });


// Per project routing
installed_projects.forEach(function (project) {
	function prjurl(url) {
	    return '/' + project + url;
	}

	function dashboard_url(ver) {
	    if(ver == undefined) {
		ver = version;
	    }
	    return prjurl('/p/' + ver);
	}

	function to_version(req, res, next) {
	    if(req.params.version != '' + version) {
		res.redirect(dashboard_url());
	    } else {
		next();
	    }
	}

	app.use(prjurl('/public/'), express.static(project_file(project, '/public'), {maxAge: maxAge * 1000}));
	project_modules[project].installViews(app, version);

	app.get(prjurl('/p/:version'), to_version, apivendor.require_login, function(req, res) {
		var path = project_file(project, '/public/dashboard/index.html');
		fs.readFile(path, 'utf-8', function (err, data) {
			if(err) {
		    res.send('not found', 404);
			} else {
			    data = data.replace(/%VERSION%/ig, version);
			    var expires = new Date();
			    expires.setTime(expires.getTime() + maxAge * 1000);
			    res.setHeader('Expires', expires.toUTCString());
			    res.setHeader('Cache-Control', 'public,max-age=' + maxAge);
			    res.send(data, 200);
			}
		    });
	    });
	
	var public_re = new RegExp('/' + project + '/pub.(\\d+)/(.*)');
	app.get(public_re, function (req, res) {
		var path = '/public/' + req.params[1];
		console.info('pub', path);
		var expires = new Date();
		expires.setTime(expires.getTime() + maxAge * 1000);
		res.setHeader('Expires', expires.toUTCString());
		res.setHeader('Cache-Control', 'public,max-age=' + maxAge);
		res.sendfile(project_file(project, path));
	    });

	app.get(prjurl('/api_authorize/'), function (req, res) {
		var callback_url = 'http://' + req.headers.host + '/' + project + '/api_callback/';
		apivendor.authorize(req, res, callback_url);
	    });
	
	app.get(prjurl('/api_callback/'), function(req, res) {
		var api = apivendor.from_request(req);
		api.get_access_token(function(token, secret) {
			req.session.project = project;
			var durl = dashboard_url();
			console.info(durl);
			res.redirect(durl);
		    });
	    });
    });

app.get('/smart_api_authorize', function (req, res) {
	var ua_pattern = /iphone|ios|ipad|android/i;
	if(ua_pattern.test(req.headers['user-agent'])) {
	    project = 'mobile';
	} else {
	    project = 'web';
	}
	var callback_url = 'http://' + req.headers.host + '/' + project + '/api_callback/';
	apivendor.authorize(req, res, callback_url);
    });

// API Proxy	
app.get('/proxy/:section/:action', apivendor.require_login, function(req, res) {
	var path = '/' + req.params.section + '/' + req.params.action;	
	if(req.params.action == 'index') {
	    path = '/' + req.params.section;
	}
	var api = apivendor.from_request(req);
	delete req.query['_'];
	api.get(path, {
		'query': req.query,
		    'success': function (data) {
		    var spec = project_specs[req.session.project];
		    var sk = spec.encodeResult(path, data);
		    res.send(sk);
		},
		    'error': function (err) {
			console.info(err.data, {'Content-Type': 'application/json'}, err.statusCode);
			res.send(err.data, {'Content-Type': 'application/json'}, err.statusCode);
		    }
	    });
    });

app.post('/upload', function (req, res) {
	var form = new formidable.IncomingForm();
	form.parse(req, function (err, fields, files) {
		res.send(files.Filedata);
	    });
    });

app.post('/statuses/update', apivendor.require_login, function(req, res) {
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if((files.photo && files.photo.size > 0) ||
		   fields.uploaded_file) {
		    if(fields.uploaded_file) {
			files = {'photo': JSON.parse(fields.uploaded_file)};
			delete fields['uploaded_file'];
		    }
		    var api = apivendor.from_request(req);
		    helper.compose_multipart(fields, files, function (b, payload) {
			    api.post('/photos/upload', payload, {
				    'post_content_type': 'multipart/form-data; boundary=' + b,
					'success': function (data) {
					res.header('Content-Type: application/json');
					res.send(data);
				    },
					'error': function (err) {
				    res.send(err.data, {'Content-Type': 'application/json'}, err.statusCode);
					}
				});
			});		    

		} else {
		    req.body = fields;
		    var api = apivendor.from_request(req);
		    api.post('/statuses/update', fields, {
			    'success': function (data) {
				res.header('Content-Type: application/json');
				res.send(data);
			    },
				'error': function (err) {
				    res.send(err.data, {'Content-Type': 'application/json'}, err.statusCode);
				}
			});
		}
	    });	
    });

app.post('/proxy/:section/:action', apivendor.require_login, function(req, res) {
	var path = '/' + req.params.section + '/' + req.params.action;
	var api = apivendor.from_request(req);
	api.post(path, req.body, {
		'success': function (data) {
		    res.send(data);
		},
		    'error': function (err, data, resp) {
			res.send(err.data, 
				 //{'Content-Type': 'application/json'}, 
				 {'Content-Type': resp.headers['content-type'] || 'application/json'},
				 err.statusCode);
		    }
	    });
    });

app.get('/rconsole/:level', apivendor.require_login, function (req, res) {
	var log = console[req.params.level];
	if(log == undefined) {
	    log = console.log;
	}
	log('REMOTE', req.query.w);
	res.send('ok');
    });

app.get('/', apivendor.require_login, function(req, res){
	var project = req.session.project || default_project;
	res.redirect('/' + project + '/p/' + version); //dashboard_url(project));
    });

app.listen(settings.daemon_port);
console.log("listening on http://localhost:" + settings.daemon_port);


