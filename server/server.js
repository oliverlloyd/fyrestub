// DEPENDENCIES
// ============
var express = require("express"),
    http = require("http"),
    os = require("os"), // used to get hostname
    port = process.env.PORT || 7008,
    app = module.exports = express(),
    pjson = require('../package.json'),
    url = require('url'); // for splitting MONGO_URL



// CONSTANTS
// =========
SIMEPL = {}; // Custom global namespace
SIMEPL.host = process.env.HOST;
SIMEPL.status = {
  "version": pjson.version,
  "environment": process.env.NODE_ENV
};



// SERVER CONFIGURATION
// ====================
var cookieParser = express.cookieParser('ok so this is the epl project');
app.configure(function() {
  app.use(express.bodyParser());
  app.use(cookieParser);
  app.use(express.methodOverride());
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(app.router);
});



// START NODEJS
// ============
var server = http.createServer(app).listen(port); // we need to explicitly define the server for socket.io to work with Express 3
console.log('Listening on ', os.hostname() + ':' + port);


// ROUTES
// ======
require('./routes')(app); // routes are setup in a seperate directory
