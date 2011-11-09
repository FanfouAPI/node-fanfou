var express = require('express'),
    OAuth = require('oauth').OAuth,
    querystring = require('querystring');
var fs = require('fs');
var apivendor = require('./apivendor.js');
var settings =  require('./settings.js');
var spec = require('./public/js/spec.js');
apivendor.config(settings.oauth_info);

// Setup the Express.js server
var app = express.createServer();
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
	secret: "skjghskdjfhbqigohqdiouk"
}));
//app.use(express.router);

var dashboard_url = '/bd1';
app.get('/', apivendor.require_login, function(req, res){
	res.redirect(dashboard_url);
    });

app.get(dashboard_url, apivendor.require_login, function(req, res) {
	res.sendfile(__dirname + '/public/dashboard/index.html');
    });
app.use(express.static(__dirname + '/public'));

app.get('/app.manifest', function (req, res) {
	res.header('Content-Type: text/cache-manifest');
	res.sendfile(__dirname + '/public/app.manifest');
    });
// OAuth
/*app.get(apivendor.login_url, function(req, res) {
	//var callback_url = 'http://' + req.headers.host + '/api_callback';
	//apivendor.authorize(req, res, callback_url);
  });
*/

app.get('/logout', function (req, res) {
	apivendor.logout(req);
	res.redirect('/');
    });

app.get('/api_authorize', function (req, res) {
	var callback_url = 'http://' + req.headers.host + '/api_callback';
	apivendor.authorize(req, res, callback_url);
    });

app.get('/api_callback', function(req, res) {
	var api = apivendor.from_request(req);
	api.get_access_token(function(token, secret) {
		res.redirect(dashboard_url);
	    });
    });

app.get('/app_template.js', function(req, res) {
	fs.readFile(__dirname + '/public/dashboard/template.html', 'utf-8', function (err, data) {
		if(err) {
		    // 404
		}
		var resp = 'function read_template() {\nvar window.a = ';
		resp += JSON.stringify(data);
		//resp += '; $(document.body).append($(a)); };';
		resp += '; \ndocument.body.innerHTML += window.a';
		res.send(resp, {'Content-Type': 'text/javascript'});
	    });
    });
app.get('/show_account', apivendor.require_login, function(req, res) {
	var api = apivendor.from_request(req);
	api.get('/account/verify_credentials',
		function(data) {
		    res.send(data);
		});
});

app.get('/proxy/:section/:action', apivendor.require_login, function(req, res) {
	var path = '/' + req.params.section + '/' + req.params.action;	
	if(req.params.action == 'index') {
	    path = '/' + req.params.section;
	}
	var api = apivendor.from_request(req);
	api.get(path, {
		'query': req.query,
		'success': function (data) {
		    var sk = spec.encodeTimeline(path, data);
		    res.send(sk);
		},
		    'error': function (err) {
			console.info(err.data, {'Content-Type': 'application/json'}, err.statusCode);
			res.send(err.data, {'Content-Type': 'application/json'}, err.statusCode);
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
                'error': function () {
		    console.error('error', path, arguments);
		}
	    });
    });

app.get('/rconsole/:level', apivendor.require_login, function (req, res) {
	var log = console[req.params.level];
	if(log == undefined) {
	    log = console.log
	}
	log('REMOTE', req.query.w);
	res.send('ok');
    });

app.listen(settings.daemon_port);
console.log("listening on http://localhost:" + settings.daemon_port);
