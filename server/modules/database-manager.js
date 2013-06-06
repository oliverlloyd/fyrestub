var Database = require('mongodb').Db;
var Server = require('mongodb').Server;

var DB = {};
	DB = new Database(SIMEPL.dbName, new Server(SIMEPL.dbHost, SIMEPL.dbPort, {auto_reconnect: true}, {}));
	DB.open(function(error, d){
		if (error) throw error;
		else {
			if( SIMEPL.dbUser && SIMEPL.dbPass) {
				DB.authenticate(SIMEPL.dbUser, SIMEPL.dbPass, function(err) {
					if (err) winston.error(err);
					else winston.info('authenticated to database :: ' + SIMEPL.dbName);
				});
			}
			if ( MONGO_URL ) winston.info('connected to remote database :: ' + SIMEPL.dbName);
			else winston.info('connected to local database :: ' + SIMEPL.dbName);
		}
	});

module.exports = DB;
