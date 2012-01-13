
exports.installViews = function (app) {
    app.get('/app.manifest', function (req, res) {
	res.header('Content-Type: text/cache-manifest');
	res.sendfile(project_file('mobile', '/app.manifest'));
    });
};
