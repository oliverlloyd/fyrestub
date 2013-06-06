

module.exports = function(app, exp, sessionStore, cookieParser) {

	app.configure(function(){
		app.use(exp.bodyParser());
		app.use(exp.methodOverride());
	});

	app.configure('development', function(){
		// require('console-trace')({ 
		// 	always: true
		// });
	});

}