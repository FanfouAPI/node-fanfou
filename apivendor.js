var OAuth = require('oauth').OAuth;
var querystring = require('querystring');

exports.login_url = '/fanfou_login';
exports.api_host = 'http://api.zkff.com';
//exports.base_url = 'http://zkff.com/oauth/';
exports.request_token_url = 'http://zkff.com/oauth/';
exports.access_token_url = 'http://zkff.com/oauth/';
exports.authorize_url = 'http://zkff.com/oauth/';
exports.consumer_key = '';
exports.consumer_secret = '';

exports.config = function(opts) {
    function copy_attr(key) {
	if(opts[key]) {
	    module.exports[key] = opts[key];
	}	
    }

    copy_attr('login_url');
    copy_attr('api_host');
    copy_attr('request_token_url');
    copy_attr('access_token_url');
    copy_attr('authorize_url');
    copy_attr('consumer_key');
    copy_attr('consumer_secret');    
};

exports.logout = function (req) {
    delete req.session.oauth_token ;
    delete req.session.oauth_token_secret;

    delete req.session.oauth_access_token;
    delete req.session.oauth_access_token_secret;
};

exports.require_login = function (req, res, next) {
    if(!req.session.oauth_access_token) {
	var isajax = (req.headers['x-requested-with'] && 
		      req.headers['x-requested-with'].toLowerCase()
		         == 'xmlhttprequest');
	if(isajax) {
	    res.send('Auth required', {'Content-Type': 'application/json'}, 410);
	} else {
	    res.redirect(exports.login_url);
	}
	return;
    } 
    next();
};

exports.authorize = function(req, res, callback_url) {
    var oa = new OAuth(module.exports.request_token_url,
		       module.exports.access_token_url,
		       module.exports.consumer_key,
		       module.exports.consumer_secret,
		       "1.0",
		       callback_url || null,
		       "HMAC-SHA1");
    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
	    if(error) {
		console.error(error);
	    }
	    else { 
		// store the tokens in the session
		req.session.oauth_token = oauth_token;
		req.session.oauth_token_secret = oauth_token_secret;
		//res.cookie('oauth_access_token', oauth_token);
		//res.cookie('oauth_access_token_secret', oauth_token_secret);
		res.redirect(module.exports.authorize_url + '?oauth_token=' + oauth_token + '&oauth_callback=' + callback_url);
	    }
	});
};

exports.from_request = function (req, callback_url) {
    var inst = new Object();
    inst.oa = new OAuth(module.exports.request_token_url,
			module.exports.access_token_url,
			module.exports.consumer_key,
			module.exports.consumer_secret,
			"1.0",
			callback_url,
			"HMAC-SHA1");
    inst.post = function (url, data, opts) {
	if(typeof opts == 'function') {
	    opts = {'success': opts};
	}
	opts = opts || {};
	var api_host = opts.api_host || module.exports.api_host;
	var path = api_host + url + '.json';
	
	var qstr = querystring.stringify(opts.query);
	if(qstr.length > 0) {
	    path += '?' + qstr;
	}
	inst.oa.post(path,
		     req.session.oauth_access_token,
		     req.session.oauth_access_token_secret,
		     data,
		     opts.post_content_type || 'application/x-www-form-urlencoded',
		     function (error, data, resp) {
			 if(error) {
			     opts.error && opts.error(error, data, resp);
			 } else {
			     if(opts.success) {
				 opts.success(data, resp);
			     }
			 }
		     });
    };

    inst.get = function (url, opts) {
	if(typeof opts == 'function') {
	    opts = {'success': opts};
	}
	opts = opts || {};
	var path = module.exports.api_host + url + '.json';
	var qstr = querystring.stringify(opts.query);
	if(qstr.length > 0) {
	    path += '?' + qstr;
	}

	inst.oa.get(path,
		    req.session.oauth_access_token,
		    req.session.oauth_access_token_secret,
		    function (error, data, response) {
			if(error) {
			    opts.error && opts.error(error, data, response);
			} else {
			    try {
				data = JSON.parse(data);
			    } catch(e) {
				console.error(e, data, response);
				e.statusCode = 500; //response.statusCode;
				opts.error && opts.error(e, data, response);
				return;
			    }
			    opts.success && opts.success(data, response);
			}
		    });
    };
    
    inst.get_access_token = function (callback) {
	inst.oa
	.getOAuthAccessToken(
			     req.session.oauth_token, 
			     req.session.oauth_token_secret, 
			     //req.cookies.oauth_access_token, 
			     //req.cookies.oauth_access_token_secret, 
			     req.param('oauth_verifier'), 
			     function(error, oauth_access_token, oauth_access_token_secret, results2) {
				 if(error) {
				     console.error(error);
				 }
				 else {
				     req.session.oauth_access_token = oauth_access_token;
				     req.session.oauth_access_token_secret = oauth_access_token_secret;
				     //req.res.cookie('oauth_access_token', oauth_access_token);
				     //req.res.cookie('oauth_access_token_secret', oauth_access_token_secret);
			     
				     callback(oauth_access_token, oauth_access_token_secret);
				 }
			     });
    }
    return inst;
};