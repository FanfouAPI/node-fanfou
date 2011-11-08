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