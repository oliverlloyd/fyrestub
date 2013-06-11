//main.js
$(document).ready(function(){

  var utils = new UtilsController(),
      storage = new StorageController(),
      sync = new SyncController(),
      authentication = new AuthenticationController();

  var teams = [
      'Arsenal',
      'Aston Villa',
      'Barnsley',
      'Birmingham City',
      'Blackburn Rovers',
      'Blackpool',
      'Bolton Wanderers',
      'Bradford City',
      'Burnley',
      'Cardiff City',
      'Charlton Athletic',
      'Chelsea',
      'Coventry City',
      'Crystal Palace',
      'Derby County',
      'Everton',
      'Fulham',
      'Hull City',
      'Ipswich Town',
      'Leeds United',
      'Leicester City',
      'Liverpool',
      'Manchester City',
      'Manchester United',
      'Middlesbrough',
      'Newcastle United',
      'Norwich City',
      'Nottingham Forest',
      'Oldham Athletic',
      'Portsmouth',
      'Queens Park Rangers',
      'Reading',
      'Sheffield United',
      'Sheffield Wednesday',
      'Southampton',
      'Stoke City',
      'Sunderland',
      'Swansea City',
      'Swindon Town',
      'Tottenham Hotspur',
      'Watford',
      'West Bromwich Albion',
      'West Ham United',
      'Wigan Athletic',
      'Wolverhampton Wanderers'
  ]

  MESSAGES = {
    ooyalla: [],
    coveritlive: []
  };

  // ---------------------------------- *** Init the page *** --------------------------------------------
  var syncInterval; // class global to store the interval used to syc the data

  utils.onEnter(false); // remove any bindings to the enter key press event

  moment().local(); // use local time for showing dates, not UTC

  utils.onEnter(false); // turn off form submit onEnter

  initStartButton();

  function initStartButton(){
    $('.button.start').on('click', function(){
      simepl.active = true;
      $(this).off();
      $(this).addClass('disabled');
      $('.button.stop').removeClass('disabled');
      initStopButton();
    });
  }

  function initStopButton(){
    $('.button.stop').on('click', function(){
      simepl.active = false;
      $(this).off();
      $(this).addClass('disabled');
      $('.button.start').removeClass('disabled');
      initStartButton();
    });
  }

  setInterval(function(){ utils.printMessages('ooyalla'); }, 9000);
  setInterval(function(){ utils.printMessages('coveritlive'); }, 6000);

  setInterval(function(){
    if ( simepl.active ){
      utils.addMsg(teams[Math.floor(Math.random()*44)] +': '+Math.floor(Math.random()*4) + ' ' + teams[Math.floor(Math.random()*44)]+ ': '+Math.floor(Math.random()*4), 'ooyalla');
      utils.addMsg(teams[Math.floor(Math.random()*44)] +': '+Math.floor(Math.random()*4) + ' ' + teams[Math.floor(Math.random()*44)]+ ': '+Math.floor(Math.random()*4), 'coveritlive');
    }
  }, 5000);

  utils.checkEnvironment(document.location.hostname);

  utils.blinkCursor(); // start the cursor blinking
  // -----------------------------------------------------------------------------------------------------


  // ------------------------------------------ Authentication -------------------------------------------
  authentication.isAuthorised(function(authorised){ // check is already authd
    storage.readAll('isAuthenticated', function(e, email){
      if (e) {
        console.error(e);
        utils.showEmail(false); // unlikely
      } else if ( authorised && email ){
        utils.showEmail(email); // the path of success
      } else {
        utils.showEmail(false); // all other cases
        storage.deleteAll('isAuthenticated');
        navigator.id.logout();
      }
    });
  });

  $("#label-logout").on("click", function() {
    if (confirm('Leaving us? Are you sure?')) {
      // first check to see if we're online and able to logout
      utils.isOnline(function(status){
        if ( status !== 2 ) { // not offline
          navigator.id.logout();
        } else {
          alert('You cannot logout if you do not have an internet connection');
        }
      });
    }
  });

  document.querySelector("#label-login").addEventListener("click", function() {
    navigator.id.request();
  }, false);

  authentication.initialise();
  // -----------------------------------------------------------------------------------------------------


  // ------------------------------- History.js - Initialise and bind ------------------------------------
  (function(window,undefined){

      // Init
      var History = window.History;
      if ( !History.enabled ) {
           // History.js is disabled for this browser.
           // This is because we can optionally choose to support HTML4 browsers or not.
          return false;
      }

      // Bind to StateChange Event
      History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
        console.log('History.Adaptor | statechange')
          var State = History.getState(); // Note: We are using History.getState() instead of event.state
          History.log(State.data, State.title, State.url);
          utils.showPage( State.data.title ); // show the page
          refreshPage(State.data.index); // update the page based on this state
      });

  })(window);
  // -----------------------------------------------------------------------------------------------------



  // ---------------------------------------- Sync Interval ----------------------------------------------
  syncInterval = setInterval(function(){
    console.log('main.js | syncInterval');
    makeSyncRequest();
  }, 1000*60*3); // try to sync every n intervals

  makeSyncRequest(); // off the bat, sync

  function makeSyncRequest(){
    sync.execute(function(e, onlineStatus){
      if(e) console.error(e);
      else {
        applicationCache.update(); // check for a new version of the manifest (and thus the site)
      }
    });
  }
  // -----------------------------------------------------------------------------------------------------


  // ---------------------------------- AppCache Manifest -----------------------------------------------
  // Check if a new manifest is available. On Firefox this listener is not triggered - updates occur on refresh
  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // Browser downloaded a new app cache.
      $('.refresh').show();
    } else { // Manifest didn't change
      $('.refresh').hide();
    }
  }, false);

  $('.refresh').on('click', function(){
    if (confirm('A new version of this site is available. Load it?')) {
      window.applicationCache.swapCache();
      //utils.clearCache(); dev only
      location.reload();
    }
  });
  // -----------------------------------------------------------------------------------------------------



  // ------------------------------ Read in Local Storage Defaults ---------------------------------------
   // get any pending services so we can update display
  storage.readAll('pending', function(e, pending){
    if ( e ) console.error(e);
    else {
      utils.updatePendingDisplay(pending); // show any pending updates
    }
  });

   // get date last sync'd so we can write to the screen
  storage.readAll('time_last_synced', function(e, when){
    if ( e ) console.error(e);
    else utils.displayLastSync(when); // last_synced
  });
  // -----------------------------------------------------------------------------------------------------
});