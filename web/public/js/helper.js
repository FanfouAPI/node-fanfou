var rconsole = function () {
    function makelog(level, w) {
	$.ajax('/rconsole/' + level, {
		data: {w: w},
		success: function () {}
	    });
    }

    return {
	log: function (w) { makelog('log', w); },
	info: function (w) { makelog('info', w); }
    }
}();

if(window.exports == undefined) {
    window.exports = {};
}

window.load_template = function(callback) {
    var ver = check_version();
    return $.ajax('/web/pub.' + ver + '/dashboard/template.html', {
	    cache: true,
	    success: function (resp) {
		if(typeof resp == 'string') {
		    document.body.innerHTML += resp;
		} else if(resp.status == 200) {
		    document.body.innerHTML += resp.responseText;
		}
		if(typeof callback == 'function') {
		    callback();
		}
	    },
	    error: function (err, resp) {
		console.error(err, resp);
		//window.location = '/';
	    }
	});
}

    function process_status_dom(dom, stobj) {
    $('a.former', dom).each(function () {
	    var userid = $(this).attr('href').replace(/.*\//g, '');
	    $(this).addClass('user')
		.attr('href', '#')
		.attr('rel', userid);
	});

    $('a', dom).each(function () {
	    var href = $(this).attr('href').replace('http://fanfou.com/', '#!/');
	    
	    if(/^\/q\/./.test(href)) {
		$(this).attr('href', '#!/q/' + encodeURIComponent(href.substr(3)));
	    } else if(/^#!\/photo\//.test(href)) {
		if(stobj.photo) {
		    $(this).remove();
		}
	    }
	});
}

function parse_date(reprdate) {
    function tendigit(d) {
	if(d < 10) {
	    return '0' + d;
	} else {
	    return '' + d;
	}
    }
    var date = new Date(reprdate);
    var currDate = new Date();
    if(date.getFullYear() != currDate.getFullYear()) {
	return date.getFullYear() + '年';
    } else if (date.getMonth() != currDate.getMonth() ||
	       date.getDate() != currDate.getDate()){
	return (date.getMonth() + 1) + '月' + date.getDate() + '日';
    } else {
	// Same day
	return tendigit(date.getHours()) + ':' + tendigit(date.getMinutes());
    }
}

function parse_date_str(reprdate) {
    var date = new Date(reprdate);
    var currDate = new Date();
    var diff = Math.floor((currDate - date)/1000.0);
    if(diff <= 2) {
	return '刚刚';
    } else if(diff <= 60) {
	return diff + '秒前';
    } else if(diff <= 3600) {
	return Math.floor(diff/60) + '分钟前';
    } else if(diff <= 86400) {
	return Math.floor(diff/3600) + '小时前';
    } else {
	return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }
}

window.check_version = function() {
    var t = /^\/(\w+)\/p\/(\d+)/.exec(window.location.pathname);
    if(t) {
	var ver = t[2];
	var curr_ver = sessionStorage.getItem('version');
	if(ver != curr_ver) {
	    sessionStorage.setItem('version', ver);
	}
	return ver;
    }
}

function ModelCache(model, prefix) {
    var _cache = {};
    var _model = model;
    var _prefix = prefix + '_';

    function erase(key) {
	sessionStorage.removeItem(_prefix + key);
    }

    function get(key) {
       var json = sessionStorage.getItem(_prefix + key);
       if(json) {
	   json = JSON.parse(json);
	   var cache_set_time = json.cache_set_time;
	   if(json.magic) {
	       json = json.array;
	   }
	   var obj = new _model(json);
	   obj.cache_set_time = cache_set_time;
	   return obj;
	} else {
	    return null;
	}
    }

    function set(key, obj) {
	obj = obj.toJSON();
	if(obj instanceof Array) {
	    obj = {'magic': true, array: obj, cache_set_time: new Date().getTime()};
	} else {
	    obj.cache_set_time = new Date().getTime();
	}
	sessionStorage.setItem(_prefix + key, JSON.stringify(obj));
    }

    function updateModel(key, obj, use_set) {
	var orig = get(key);
	if(orig &&
	   typeof orig == 'object' &&
	   typeof obj == 'object') {
	    orig.set(obj);
	    set(key, orig);
	} else if(use_set){
	    set(key, new _model(obj));
	}
    }
    
    var prefetching = {};
    
    function prefetch (url) {
	var model = new _model();
	model.url = url;
	var callobjs = prefetching[url];
	if(!callobjs) {
	    callobjs = Array();
	    prefetching[url] = callobjs;
	}

	model.fetch({
		'complete': function () {
		    //console.info('prefetching complete');
		    delete prefetching[url];
		},
		'success': function (data) {
		    var callobjs = prefetching[url];
		    set(url, data);
		    if(callobjs) {
			_.map(callobjs, function (opts) {
				//console.info('calling');
				if(typeof opts.success == 'function') {
				    opts.success(data);
				}
			    });
		    }
		},
		'error': function (err, resp) {
		    var callobjs = prefetching[url];
		    if(callobjs) {
			_.map(callobjs, function (opts) {
				if(typeof opts.error == 'function') {
				    opts.error(err, resp);
				}
			    });
		    }
		}
	    });
    }

    function fetch(url, opts) {
        if(typeof opts == 'function') {
            opts = {'success': opts};
        }
	var disable_cache = opts.disable_cache || false;
	var key = url;
	if(!disable_cache) {
	    var u = get(key);
	    if(opts.only_cache == undefined) {
		opts.only_cache = true;
	    }
	    if(u) {
		// Cache hit.
		opts.success(u);
		if(opts.only_cache ||
		   (new Date().getTime() - u.cache_set_time < 2000)) {
		    // cache within one second is considiered the desired one.
		    //console.info('found', url);
		    return;
		}
	    }
        }
        // Request from server
	var fetch_opts = {
	    success: function (data) {
		if(!disable_cache) {
		    set(key, data);
		}
		if(typeof opts.success == 'function') {
		    opts.success(data);
		} else {
		    console.warn('opts.success is not a function');
		}
	    },
	    error: function () {
		if(typeof opts.error == 'function') {
		    opts.error.apply(u, arguments);
		} else {
		    App.notifyTitle('找不着对象' + key);
		}
	    }
	};
	if(prefetching[url] != undefined) {
	    //console.info('prefetching push opts');
	    prefetching[url].push(fetch_opts);
	} else {
	    //console.info('no cache fetching it');
	    u = new _model();
	    u.url = url;
	    u.fetch(fetch_opts);
	}
    }
    return {
        'get': get,
	    'set': set,
	    'erase': erase,
	    'fetch': fetch,
	    'prefetch': prefetch,
	    'updateModel': updateModel
    };
}
