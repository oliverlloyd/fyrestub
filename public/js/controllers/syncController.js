// syncController.js
function SyncController()
{
  var that = this;

  var storage = new StorageController(),
      utils = new UtilsController();


  this.execute = function(callback){
    console.log('sync.execute | executing a sync...');
    storage.readAll('time_last_synced', function(e, timeLastSynced){
      if ( e ) callback(e);
      else {
        if ( isNaN(parseFloat(timeLastSynced)) || !isFinite(timeLastSynced) ) timeLastSynced = 0; // not run before so use 0

        utils.isOnline(function(onlineStatus){ // check online status
          if ( onlineStatus === 0 ){ // we're online so lets try and sync
            console.log("sync.execute | I think that we are online, so I'm syncing...");
            parseLocalStorageKeys(function(e, localData){
              // console.log('sync.execute | localData: ', localData);
              if ( localData ){ 
                var keys = Object.keys(localData);
                var keyCount = keys.length;

                for (var type in localData){
                  (function(thetype){
                    // console.log('sync.execute | keyCount: ', keyCount);
                    // console.log('sync.execute | type: ', type);
                    // console.log('sync.execute | keys.indexOf(type): ', keys.indexOf(type));
                    var theLocalArray = localData[thetype];
                    if ( theLocalArray instanceof Array ) { // it really is an array (always should be)
                      var dataToSend = []; // an empty array to store any modified values                  
                      for (var x = theLocalArray.length - 1; x >= 0; x--) { // for each value in this particular local array
                        var thisValue = theLocalArray[x];
                        if (thisValue && thisValue.virgin ){
                          // console.log('sync.execute | we think some things changed locally');
                          // console.log('sync.execute | thisValue: ', thisValue);
                          // console.log('sync.execute | thisValue.modified: ', thisValue.modified);
                          // console.log('sync.execute | timeLastSynced: ', timeLastSynced);
                          // this value has been modified since we last synced so add it to the array to update the server with
                          dataToSend.push(thisValue);
                        }
                      }
                      // console.log('sync.execute | dataToSend.length: ', dataToSend.length);
                      if ( dataToSend.length > 0 ){
                        // we have an array of modified values that should be sent up
                        makePushRequest(thetype, dataToSend, function(e, pushtype){
                          if ( e ) callback(e);
                          else {
                            makePullRequest(pushtype, timeLastSynced, theLocalArray, function(e, pulltype){
                              if ( e ) callback(e);
                              else if ( (keyCount-1) === keys.indexOf(thetype) ) {
                                console.log('sync.execute | CALLBACK');
                                resetPending(); // clear pending actions
                                callback(null, onlineStatus);
                              }
                            });
                          }
                        });
                      } else { // else there was no data to send, pull any mod'd stuff from the server
                        makePullRequest(thetype, timeLastSynced, theLocalArray, function(e, pulltype){
                          if ( e ) callback(e);
                          else if ( (keyCount-1) === keys.indexOf(thetype) ) {
                            resetPending(); // clear pending actions
                            callback(null, onlineStatus);
                          }
                        });
                      }
                    } else {
                      console.error('sync.execute | theLocalArray was not an array');
                      if ( (keyCount-1) === keys.indexOf(thetype) ) {
                        callback(null, onlineStatus);
                      }
                    }
                  })(type);
                }
              } else { // localData is falsey (empty) 
                callback(null, onlineStatus);
              }
            });
          } else { // onlineStatus is 1 (not authed) or 2 (not online) so don't try to sync
            utils.displayLastSync(timeLastSynced);
            console.log("sync.execute | I don't think I am online or I'm not authd, so no sync then");
            callback(null, onlineStatus);
          }
        });

      }
    });
  };

  function parseLocalStorageKeys(callback){
    var input = [];

    if ( ! localStorage.length ) callback(null, false); // if localStorage is empty

    for (var i = localStorage.length - 1; i >= 0; i--) { // for each value in local storage
      var keyname = localStorage.key(i);
      // console.log('sync.execute | parseLocalStorageKeys, keyname: ', keyname);
      // console.log('sync.execute | parseLocalStorageKeys, i: ', i);
      if ( keyname.slice(0,4) === 'sync' ){ // this is an entry to sync
        input.push(keyname); // append this sync key to array
        // console.log('sync.execute | parseLocalStorageKeys, i after readAll: ', i);
      }
      if ( i === 0 ) { // now that the keys object is initialised, get the data
        if ( input.length > 0 ){
          readLocalStorageValues(input, function(e, output){
            if (e) callback(e);
            callback(null, output);
          });
        } else {
          callback(null, false); // nothing found to sync
        }
      }
    }
  }

  function readLocalStorageValues(input, callback){
    var output = {};
    for (var i = input.length - 1; i >= 0; i--) {
      var keyname = input[i];
      storage.readAll(keyname, function(e, theLocalArray){
        if ( e ) callback(e);
        var type = keyname.substr(5); // chop off the sync_ prefix that should always be present
        // console.log('sync.execute | readLocalStorageValues, type: ', type);
        // console.log('sync.execute | readLocalStorageValues, i: ', i);
        output[type] = theLocalArray;
        if ( i === 0 ) callback(null, output);
      });
    }
  }

  function makePullRequest(type, timeLastSynced, theLocalArray, callback){
    // console.log('sync.execute | makePullRequest');
    pullData(type, timeLastSynced, function(e, response){
      // console.log('sync.execute | makePullRequest response.type returned: ', response.type);
      if ( e ) callback(e);
      else {
        if ( response && response.when ){
          storage.updateAll('time_last_synced', response.when);
          utils.displayLastSync(response.when);
        } else console.log('makePullRequest | else response: ', response);

        if ( response && response.data && response.data.length > 0 ) { // the pull was successful and we got data
          // now merge the two arrays
          var mergedArray = utils.arrayUnion(theLocalArray, response.data);
          // console.log('sync.execute | mergedArray: ', mergedArray);
          // overwrite local storage with this fresh data
          // console.log('sync.execute | makePullRequest response.type: ', response.type);
          storage.updateAll('sync_'+response.type, mergedArray);
          callback(null, response.type);
        } else callback(null, false); // else there was no data returned, carry on
      }
    });
  }

  function makePushRequest(type, dataToSend, callback){
    console.log('sync.execute | makePushRequest');
    pushData(type, dataToSend, function(e, thetype){ // post the data
      if ( e ) callback(e);
      else callback(null, thetype);
    });
  }

  function pushData(type, data, callback){
    // console.log('sync.execute | pushData options: type, data:');
    console.log(type);
    console.log(data);
    $.ajax({
      url: "/sync/"+type,
      type: "POST",
      contentType: 'application/json',
      accepts: 'application/json',
      data: JSON.stringify(data),
      success: function(result){
        callback(null, type);
      },
      error: function(jqXHR, status, message){
        console.log(jqXHR);
        console.log(status);
        console.log(message);
        callback(message);
      }
    });
  }


  function pullData(type, time, callback){
    // console.log('sync.execute | pullData options: type, time:');
    // console.log('sync.execute | type: ', type);
    // console.log('sync.execute | time: ', time);
    $.ajax({
      url: "/sync/"+type+"/"+time,
      type: "GET",
      accepts: 'application/json',
      success: function(response){
        response.type = type; // add the type to the response to ensure we maintain asyncrounous integrity
        // console.log('QQQ sync.execute | pullData, response:', response);
        callback(null, response);
      },
      error: function(jqXHR, status, message){
        console.log('ERROR sync.execute | pullData');
        console.log(jqXHR);
        console.log(status);
        console.log(message);
        callback(message);
      }
    });
  }

  function resetPending(){
    storage.updateAll('pending', 0);
    utils.updatePendingDisplay(0);
  }
}