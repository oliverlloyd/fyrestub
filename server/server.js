// DEPENDENCIES
// ============
var express = require("express"),
    http = require("http"),
    os = require("os"), // used to get hostname
    port = process.env.PORT || 7007,
    app = module.exports = express(),
    pjson = require('../package.json'),
    redis = require('redis'), // stores client session
    url = require('url'), // for splitting MONGO_URL
    winstonDB = require('winston-mongodb').MongoDB; // winston's mongodb module


// CONSTANTS
// =========
winston = require('winston'), // logging library
REDIS_URL = process.env.REDISTOGO_URL || 'redis://localhost:6379'; // global const for redis
MONGO_URL = process.env.MONGOHQ_URL;
SIMEPL = {}; // Custom global namespace
SIMEPL.host = process.env.HOST;
SIMEPL.status = {
  "version": pjson.version,
  "environment": process.env.NODE_ENV
};


// REDIS
// =====
var connection = require("url").parse(REDIS_URL); // parse redis url
REDIS_PARAMS = {}; // global const with redis connection settings, also used by socket.io
REDIS_PARAMS.port = connection.port;
REDIS_PARAMS.host = connection.hostname;

// connect to redis so we can put the express session there
var client = redis.createClient(REDIS_PARAMS.port, REDIS_PARAMS.host);
if ( connection.auth ) {
  //REDIS_PARAMS.pass = REDIS_PARAMS.host + ':' + connection.auth.split(":")[2];
  REDIS_PARAMS.pass = connection.auth.split(":")[1];
  client.auth(REDIS_PARAMS.pass, function (err) {
    if (err) throw err;
    else winston.log('authorised to redis at: '+ REDIS_PARAMS.host);
  });
} else winston.log('connected to redis at: '+ REDIS_PARAMS.host);

var RedisStore        = require('connect-redis')(express);
var sessionStore      = new RedisStore({ client: client }); // put the express session in redis


// MONGODB CONNECTION PARAMETERS
// =============================
if( MONGO_URL ){ // we're using a remote db so we need to parse the url
  var mongoDb = url.parse( MONGO_URL );
  if( mongoDb.auth ) {
    var autharray = mongoDb.auth.split(':');
    SIMEPL.dbUser = autharray[0];
    SIMEPL.dbPass = autharray[1];
  }
  SIMEPL.dbPort = parseInt(mongoDb.port, 10),
  SIMEPL.dbHost = mongoDb.hostname,
  SIMEPL.dbName = mongoDb.path.substring(1);
} else { // we're using a local db
  SIMEPL.dbPort = 27017,
  SIMEPL.dbHost = 'localhost',
  SIMEPL.dbName = 'simepl';
}


// WINSTON LOGGING
// ===============
winston.add(winstonDB, {
  'level': 'info',
  'username': SIMEPL.dbUser,
  'password': SIMEPL.dbPass,
  'db': SIMEPL.dbName,
  'host': SIMEPL.dbHost,
  'port': SIMEPL.dbPort
});


// FORCE SSL
// =========
if ( SIMEPL.host ){ // only force ssl for remote servers
  app.use(function (req, res, next) { // Force SSL
    res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.headers.host + '/');
    }
    next();
  });
}


// SERVER CONFIGURATION
// ====================
var cookieParser = express.cookieParser('ok so this is the epl project');
app.configure(function() {
  app.use(express.bodyParser());
  app.use(cookieParser);
  app.use(express.session({ store: sessionStore }));
  app.use(express.methodOverride());
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(express["static"](__dirname + "/../public"));
  app.use(app.router);
});


// MOZILLA PERSONNA
// ================
var audience;
if ( SIMEPL.host ) {
  audience = 'https://' + SIMEPL.host;
  winston.log('info', 'app.js | hostname is: ', audience);
} else {
  audience = 'http://' + os.hostname() + ':' + port;
  winston.log('info', 'app.js | hostname:is: ', audience);
}
require("express-persona")(app, {
  audience: audience, // Must match your browser's address bar
  sessionKey: "email"
});


// START NODEJS
// ============
http.createServer(app).listen(port);


// ROUTES
// ======
require('./routes')(app); // routes are setup in a seperate directory


// SOCKET.IO
// =========
var server = http.createServer(app); // we need to explicitly define the server for socket.io to work with Express 3
// start socket.io listening - we pass in server, sessionStore and cookieParser here so that we can add the express session to the socket
require('./modules/socket-manager.js').setupSocket(server, cookieParser, sessionStore);
