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

function load_template(callback) {
    return $.ajax('/dashboard/template.html?a=' + Math.random(), {
	    success: function (resp) {
		if(typeof resp == 'string') {
		    document.body.innerHTML += resp;;
		} else if(resp.status == 200) {
		    console.info(resp.responseText);
		    document.body.innerHTML += resp.responseText;
		}
		if(typeof callback == 'function') {
		    callback();
		}
	    },
		error: function (err, resp) {
		console.error(err, resp);
	    }
	});
}

function process_status_dom(dom) {
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