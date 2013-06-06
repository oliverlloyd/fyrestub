// personaController.js
function AuthenticationController()
{
  var that = this;

  var storage = new StorageController(),
      sync = new SyncController(),
      utils = new UtilsController();


  this.isAuthorised = function(callback){ // run at init and on sync
    // Check is the global auth flag is set
    if ( simepl.AUTHENTICATED ) callback(true);
    else callback(false);
  };

  this.initialise = function(){ // refreshDashboard is called upon successful login
   // Mozilla Persona
    navigator.id.watch({
      onlogin: function(assertion) {
        $.ajax({
          type: 'POST',
          url: '/persona/verify', // goes to express-persona module
          data: {assertion: assertion},
          beforeSend: function(xhr, opts){
            console.log('Persona BEFORE POST /persona/verify');
          },
          success: function(res, status, xhr) {
            console.log('Persona SUCCESS POST /persona/verify');
            console.log(res);

            if ( res && res.status === "okay") { // got a valid response from express-persona
              //storage.sync(function(e, onlineStatus){
              sync.execute(function(e, onlineStatus){
                if(e) console.error(e);
                else {
                  console.log('onlogin success | onlineStatus: ', onlineStatus);
                  if ( onlineStatus === 0 ){ // connection good, valid user
                    utils.showEmail(res.email);
                    simepl.AUTHENTICATED = true;
                    storage.updateAll('isAuthenticated', res.email); // log the fact we're authd
                  } else if ( onlineStatus === 1 ) { // email not present in authorised list
                    alert('You are not authorised to use this site.');
                    simepl.AUTHENTICATED = false;
                  } else { // unlikely given we've just had a response for persona but...
                    console.error('onLogin | status = 2, no internet connection');
                  }
                }
              });
            } else if ( res && res.status === "not okay") { // verification failed
              alert('Verification failed. ' + res.email + ' is not who they say they are...');
              simepl.AUTHENTICATED = false;
              navigator.id.logout();
            } else {
              console.error('There was a problem authenticating you:\n\n' + status + '\n\n' + JSON.stringify(res));
            }
          },
          error: function(xhr, status, err) {
            console.error('Persona ERROR POST /persona/verify');
            navigator.id.logout();
            simepl.AUTHENTICATED = false;
            //alert("Login failure: " + err);
            console.error("Login failure: " + err);
          }
        });
      },
      onlogout: function() {

        $.ajax({
          type: 'POST',
          url: '/persona/logout',
          success: function(res, status, xhr) {
            console.log("You have been logged out");
            simepl.AUTHENTICATED = false; // set global flag
            storage.deleteAll('isAuthenticated'); // clear local storage
            utils.showEmail(false); // update top-bar
            utils.displayOnlineStatus(1); // show as not signed in          
          },
          error: function(xhr, status, err) {
            //alert("Logout failure: " + err);
            console.error("Logout failure: " + err);
            console.error("Logout failure: " + status);
          }
        });
      }
    });
  };
}