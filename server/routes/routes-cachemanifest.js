

module.exports = function(app) {

  app.get("/public/parsilo.appcache", function(req, res){
    console.log('parsilo.appcache was requested');
    res.header("Content-Type", "text/cache-manifest");
    res.end("CACHE MANIFEST");
  });

}