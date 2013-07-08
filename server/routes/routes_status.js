
module.exports = function(app) {
  app.get('*', function(req, res){
    res.send(200, SIMEPL.status);
  });  
  app.post('*', function(req, res){
    res.send(200, SIMEPL.status);
  });  
};