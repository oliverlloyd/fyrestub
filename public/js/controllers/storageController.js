function StorageController()
{
  var that = this;

  var utils = new UtilsController();


  this.updateAll = function(type, data){
    if ( type ){
      that.localSet(type, data, function(e, result){
        if (e) callback(e);
      });
    }
  };

  this.deleteAll = function(type){
    if ( type ){
      that.localRemove(type, function(e, result){
        if (e) callback(e);
      });
    }
  };

  this.readAll = function(type, callback){
    if ( type ){
      that.localGet(type, function(e, result){
        if (e) callback(e);
        else {
          callback(null, result);
        }
      });
    } else {
      callback('type not specified');
    }
  };



  this.updateById = function(id, type, newData, callback){
    // console.log('storage.updateById | id: ', id);
    // console.log('storage.updateById | type: ', type);
    // console.log('storage.updateById | newData: ', newData);

    if ( id && type && newData ){
      that.localGet(type, function(e, localData){
        if (e) callback(e);
        else {
          // console.log('storage.updateById | localData: ', localData);
          if (! localData || JSON.stringify(localData) === "[]") {
            // localData is empty
            localData = [];
          } else { // there are some local values so find any that match this record and delete
            for (var i = localData.length - 1; i >= 0; i--) {
              if ( localData[i]._id === id ){
                localData.splice(i,1);
                break;
              }
            }
          }
          localData.push(newData); // add this object to the local array and reset it
          that.localSet(type, localData, function(e, result){
            if (e) callback(e);
            else callback(null, result);
          });
        }
      });
    } else {
      callback('invalid parameters specified');
    }
  };

  this.deleteById = function(id, type, callback){
    if ( id && type ){
      that.localGet(type, function(e, localData){
        if (e) callback(e);
        else {
          var thisobject;
          if ( localData ) {
            for (var i = localData.length - 1; i >= 0; i--) {
              if ( localData[i]._id === id ){
                thisobject = localData[i];
                localData.splice(i,1); // remove the current data
                break;
              }
            }
          }
          thisobject.deleted = true; // mark this object as deleted
          thisobject.virgin = true; // make sure this object is picked up for sync
          localData.push(thisobject); // add this modified object to the local array and reset it
          that.localSet(type, localData, function(e, result){
            if (e) callback(e);
            else callback(null, result);
          });
        }
      });
    } else {
      callback('invalid parameters specified');
    }
  };

  this.readById = function(id, type, callback){
    if ( id && type ){
      that.localGet(type, function(e, result){
        if (e) callback(e);
        else {
          for (var i = result.length - 1; i >= 0; i--) {
            if ( result[i]._id === id ){
              callback(e, result[i]);
              break;
            }
          }
        }
      });
    } else {
      callback('invalid parameters specified');
    }
  };


  // functions to interact with local storage
  this.localSet = function(type, obj, callback){
    localStorage.setItem(type, JSON.stringify(obj));
    callback(null, true);
  };


  this.localRemove = function(type, callback){
    localStorage.removeItem(type);
    callback(null, true);
  };


  this.localGet = function(type, callback){
    var data = localStorage.getItem(type);
    if ( data && typeof data === 'string' ) {
      var result = JSON.parse(data);
      callback(null, result);
    } else {
      callback(null, null);
    }
  };
}