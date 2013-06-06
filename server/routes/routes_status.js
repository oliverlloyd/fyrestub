var AU = require('./middleware/checkAuthentication');

module.exports = function(app) {
  // very basic status response designed to allow the client to check if it has a connection to the server
  app.get('/status', AU.checkAuthentication, function(req, res){
    res.send(200, SIMEPL.status);
  });
};