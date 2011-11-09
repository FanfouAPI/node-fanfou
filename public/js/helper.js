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