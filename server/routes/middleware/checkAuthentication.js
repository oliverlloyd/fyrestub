var AU = {};

module.exports = AU;

// A middleware funciton to check if the request contains an authenticated session or not
// Should be inlcluded in all requests for Private pages
AU.checkAuthentication = function(req, res, next) {
  if (req.session && req.session.email) { // a session exists, a good start
    var theemail = req.session.email;
    var thedomain = theemail.replace(/.*@/, "");

    if ( theemail === 'email@oliverlloyd.com' || thedomain === 'newsint.co.uk' ) {
      next();
    } else {
      winston.log('info', 'checkAuthentication | verification failed using email: ', theemail, { session: req.session });
      res.send(401, SIMEPL.status); // email present but not authorised
    }
  } else if ( req.session && req.session.hasOwnProperty('email') && req.session.email === null ){
    winston.log('info', 'checkAuthentication | verification failed (401), not logged in', { session: req.session });
    res.send(401, SIMEPL.status); // not logged in
  } else {
    winston.log('info', 'checkAuthentication | forbidden (403)', { session: req.session });
    res.send(403, SIMEPL.status); // forbidden or session expired
  }
};