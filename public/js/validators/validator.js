
function Validator(){

  var that = this;

  var storage = new StorageController();

  // build array maps of the form inputs & control groups //
  this.registrationFields = [
    $('#input-name'),
    $('#input-dob')
  ];

  this.validateName = function(s){
    if ( ! s.length >= 1 ) return 1;
    else if ( s.match(/[^\w éÉÀàÂâÄäÆæÇçÈèÉéÊêËëÎîÏïÔôÙùÛûÜü]/g) && s.match(/[^\w ]/g).length > 0 ) return 2;
    else return 0;
  };

  this.validateNumber = function(n){
    if ( ! n.length >= 1 ) return 1;
    else if ( isNaN(parseFloat(n)) || !isFinite(n) ) return 2;
    else return 0;
  };

  this.validateDOB = function(n){
    var now = new moment();

    // check if numeric
    // see: http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
    if (n.length > 4) {
      var year = n.substr(n.length - 4);
      if ( isNaN(parseFloat(n)) || !isFinite(n) ) return 2;
      else if ( n.length !== 8 ) return 3;
      else if ( ! moment(n, "DDMMYYYY").isValid() ) return 4;
      else if ( year < 1900 ) return 6;
      else if ( year > now.year() ) return 7;
      else return 0;
    } else {
      if ( ! n.length >= 1 ) return 1; //now only needed here
      else if ( isNaN(parseFloat(n)) || !isFinite(n) ) return 2;
      else if ( n.length !== 4 ) return 5;
      else if ( n < 1900) return 6;
      else if ( n > now.year()) return 7;
      else if ( ! moment(n, "YYYY").isValid() ) return 8;
      else return 0;
    }
  };

  this.isUnique = function(thislabel, callback){
    var unique = true;
    storage.readAll('sync_clients', function(e, theclients){
      if ( e ) callback(true); // generous
      else {
        if ( theclients ){
          for (var i = theclients.length - 1; i >= 0; i--) {
            // console.log('isUnique | theclients[i].label: ', theclients[i].label);
            if ( theclients[i].label === thislabel ) {
              unique = false;
              break;
            }
          }
          callback(unique);
        } else callback(true); // there are no local clients so sure, it's unique
      }
    });
  };

  this.showError = function(element, msg){
    element
      .addClass('error')
      .parent()
      .find('small')
      .addClass('error')
      .text(msg);
  };
}

Validator.prototype.validateRegistrationForm = function(newClient, callback){

  var that = this;

  var thename = that.registrationFields[0];
  var thedob = that.registrationFields[1];
  var thecode = thename.val() + thedob.val();

  var errors = 0;
  for (var i=0; i < that.registrationFields.length; i++) {
    that.registrationFields[i]
      .removeClass('error')
      .parent()
      .find('small')
      .removeClass('error')
      .text('');
  }

  var resultName = that.validateName(thename.val());
  switch (resultName){
    case 0: // do nothing
    break;
    case 1: // Nothing entered
      that.showError( thename, 'Vous devez entrer un nom');
      errors++;
    break;
    case 2: // Invlaid chars
      that.showError(thename, 'Les noms contiennent des caractères alpha numériques uniquement');
      errors++;
    break;
  }

  var resultDOB = that.validateDOB(thedob.val());
  switch (resultDOB){
    case 0: // do nothing
    break;
    case 1: // Nothing entered
      that.showError( thedob, 'Vous devez entrer une DDN');
      errors++;
    break;
    case 2: // Invlaid chars
      that.showError( thedob, 'La DDN doit être numérique');
      errors++;
    break;
    case 3: // Invlaid date
      that.showError( thedob, 'Vous devez entrer 8 charactères au format JJMMAAAA');
      errors++;
    break;
    case 4: // Invlaid date
      that.showError( thedob, 'Date non valide au format JJMMAAAA');
      errors++;
    break;
    case 5: // Invlaid date - YYYY
      that.showError( thedob, 'Vous devez entrer 4 charactères au format AAAA');
      errors++;
    break;
    case 6: // Invlaid date - YYYY
      that.showError( thedob, 'La date doit être supérieure à 1900');
      errors++;
    break;
    case 7: // Invlaid date - YYYY
      that.showError( thedob, 'Impossible de définir une date avenir');
      errors++;
    break;
    case 8: // Invlaid date - YYYY
      that.showError( thedob, 'Date non valide au format AAAA');
      errors++;
    break;
  }

  if ( errors === 0 ) { // So long there are no other errors, check if unique
    if ( newClient ){ // If we're creating a client (not updating)
      that.isUnique(thecode.toUpperCase(), function(codeUnique){
        if ( !codeUnique ) { //Not unique so update the screen
            that.showError( thename, 'Cette combinaison de nom et DDN n est pas unique');
            that.showError( thedob, 'Cette combinaison de nom et DDN n est pas unique');
            errors++;
        }
        callback( errors === 0 );
      });
    } else callback( true ); // No Errors and we're updating so don't check if unique
  } else callback( false ); // False, there were errors
};


Validator.prototype.validateSyringueForm = function(callback){

  var that = this;

  var syringues = $('#input-syringues');

  var errors = 0;
  syringues
      .removeClass('error')
      .parent()
      .find('small')
      .removeClass('error')
      .text('');

  var resultNumber = that.validateNumber(syringues.val());
  switch (resultNumber){
    case 0: // do nothing
    break;
    case 1: // Nothing entered
      that.showError(syringues, 'Vous devez entrer un value');
      errors++;
    break;
    case 2: // Invalid
      that.showError(syringues, 'Le value doit être numérique');
      errors++;
    break;
  }

  callback( errors === 0 );
};
