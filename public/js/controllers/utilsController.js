//utils
function UtilsController()
{
  var that = this;

  this.isOnline = function(callback){
    $.ajax({
      url: "/status/",//?timestamp="+new Date().getTime(), // should return 204, no content if a connection was successful
      type: "GET",
      timeout: 10000, // if 10 seconds is not enough then the connection is probably not there or too poor
      // not tested if timeout triggers the error event...
      beforeSend : function(xhr, opts){
        that.displayOnlineStatus(4); // syncing
      },
      success: function(data){
        var thestatus = data;
        that.showVersion(thestatus.version);
        that.displayOnlineStatus(0);
        callback(0);
      },
      error: function(jqXHR, status, message){
        var code = jqXHR.status;
        if (code === 401) {
          that.displayOnlineStatus(1); // unauthorised
          callback(1);
        } else if ( code === 403) {
          that.displayOnlineStatus(3); // forbidden (no session)
          callback(3);
        } else {
          that.displayOnlineStatus(2); // offline
          callback(2);
        }
      }
    });
  };

  this.checkEnvironment = function(hostname){
    // if ( hostname.indexOf('simepl.') === -1 ){ // test envs are parsilo-test or parsilo-staging
    //   $('.topbar').removeClass('topbar_prod').addClass('topbar_test');
    //   $('.footer').removeClass('footer_prod').addClass('footer_test');
    //   $('.title span').text('EPL - TEST');
    // }
  };

  this.showVersion = function(version){
    // if ( version ){

    // } else {

    // }
  };

  this.cursorAnimation = function(opacity)
  {
    $(".cursor").animate({
      opacity: opacity
    }, "fast", "swing");
  };

  this.blinkCursor = function(){
    var cursor = 0;
    setInterval ( function(){
      if ( cursor == 1 ) cursor = 0;
      else cursor = 1;
      that.cursorAnimation(cursor);
    },350);
  };

  this.addMsg = function(string, destination){
    if ( MESSAGES[destination] && string ){
      MESSAGES[destination].push(string);
    }
  };

  this.printMessages = function(type){
    if ( simepl.active ){
      var themessage = MESSAGES[type].pop();
      console.log(MESSAGES);
      console.log(type);
      console.log(MESSAGES[type]);
      
      if ( themessage && themessage.length > 0 ){
        var element_msg = $('.'+type+'.msg');
        var element_msgs = $('.'+type+'.msgs');

        var theasterix = '<span class="'+type+' cursor">*</span>';
        var msg = '<h6 class="'+type+' msg">'+theasterix+'</h6>';

        var currentString = '', refinedString = '';
        var wait = 100, extra = 0;
        var theconstant = 20;

        element_msg.last().text(''); // clear the asterix
        for (var i = 0; i < themessage.length; i++) {
          if ( themessage[i] === ':' ) extra = (Math.floor(Math.random()*2) + 1) * 1000;
          setTimeout(function(x){
            currentString = element_msg.last().text();
            refinedString =  currentString.substr(0, currentString.length - 1); // remove last char (the asterix);
            element_msg.last().html(refinedString + themessage[x].toUpperCase() + theasterix );
            if ( x === themessage.length - 1 ) {
              element_msg.last().text( refinedString + themessage[x].toUpperCase() );
              setTimeout( function(){ 
                element_msgs.append(msg);
                var msgCount = element_msg.length;
                if ( msgCount > 7 ) element_msg.first().remove();
              }, 400 );
            }
          }, wait + (i * theconstant), i );

          wait += extra;
          extra = 0;
        }
      }
    }
  };

  this.minimalist = function(state, callback){
    if (state) {
      $('.content-services').hide();
      $('.spurious').slideUp(400, function(){
        callback();
      }); // Note - slideUp is required here to prevent the new user click event being lost - happens with hide()
    } else {
      // $('#input-code').autocomplete('close'); // in case it was shown manually using search method
      $('.spurious').slideDown(400, function(){
        callback();
      });
    }
  };

  this.resetView = function(clientSelected){
    // console.log('utils.resetView | clientSelected: ', clientSelected);
    // view management stuff here
    switch(clientSelected){
      case true: { // A client was selected from the autocomplete
        $('.content-services').slideDown(); // show services
        $('.service-switch').removeAttr('disabled'); // enable switch controls
        $('.save.services').removeClass('disabled'); // enable save button
        $('.goto.editclient').removeClass('disabled'); // enable edit button
        $('#input-code').blur(); // remove focus from autocomplete input
      }
      break;
      case false: { // Set view to no client selected
        simepl.savePending = false;
        that.onEnter(false); // turn off onEnter action
        $('#input-code').val(''); // wipe autocomplete input
        $('.content-services').slideUp(); // hide services
        $('.service-switch').attr('disabled', 'disabled'); // disable switch controls
        $('.show.messages').off();
        $('.goto.editclient').addClass('disabled'); // disable switch controls
        $('.save.services').addClass('disabled'); // disable save button
        //$('#input-code').focus(); // set focus to autocomplete input
        if ( $('.ui-menu').is(":visible") ) $('#input-code').autocomplete('close');
      }
    }
    $('#additional-info').slideUp(); // hide additional info
    $('#btn-addinfo').text('Entretiens/Orientations');
    $('.switch-off').click();
    $('.addinfo-count').val('');
  };

  this.theyAreSure = function(){
    if ( simepl.savePending ) { // if a visit is showing and not saved
      if (confirm("Vous n'avais pas enregistré cette visite, continuer?")) {
        simepl.savePending = false;
        return true;
      } else {
        return false;
      }
    } else { // there is no pending record so we don't need to confirm
      return true;
    }
  };

  this.showPage = function(page){
    // sometimes we manually trigger the autocomplete ui and in that case we have to close it ourselves too    
    if ( $('.ui-menu').is(":visible") ) {
      $('#input-code').autocomplete('close');
      that.minimalist(false, function(){});
    }

    switch ( page ){
      case "services":{
        $('#input-code').val('');
        $('.page-content').hide();
        $('.page-services').show();
        History.pushState({
            "title": page,
            "index": 0
          },
          'EPL | '+page.charAt(0).toUpperCase() + page.slice(1),
          "/"
        ); // Log state to History
      }
      break;
      case "registration":{
        that.onEnter(false);
        $('.page-content').hide();
        $('.page-registration').show();
        History.pushState({
            "title": page,
            "index": 1
          },
          'EPL | '+page.charAt(0).toUpperCase() + page.slice(1),
          "/"
        ); // Log state to History
      }
      break;
      case "dailysummary":{
        if ( that.theyAreSure() ) {
          that.onEnter(false);
          $('.page-content').hide();
          $('.page-dailysummary').show();
          History.pushState({
              "title": page,
              "index": 2
            },
            'EPL | '+page.charAt(0).toUpperCase() + page.slice(1),
            "/"
          ); // Log state to History
        }
      }
      break;
      case "recentvisits":{
        if ( that.theyAreSure() ) {
          that.onEnter(false);
          $('.page-content').hide();
          $('.page-recentvisits').show();
          History.pushState({
              "title": page,
              "index": 3
            },
            'EPL | '+page.charAt(0).toUpperCase() + page.slice(1),
            "/"
          ); // Log state to History
        }
      }
      break;
      case "graphs":{
        if ( that.theyAreSure() ) {
          that.onEnter(false);
          $('.page-content').hide();
          $('.page-graphs').show();
          History.pushState({
              "title": page,
              "index": 3
            },
            'EPL | '+page.charAt(0).toUpperCase() + page.slice(1),
            "/"
          ); // Log state to History
        }
      }
      break;
      case "dataminer":{
        if ( that.theyAreSure() ) {
          that.onEnter(false);
          $('.page-content').hide();
          $('.data-miner').show();
          History.pushState({
              "title": page,
              "index": 4
            },
            'EPL | '+page.charAt(0).toUpperCase() + page.slice(1),
            "/"
          ); // Log state to History
        }
      }
      break;
    }
  };

  this.openMsgModal = function(element, actionOnEnter){
    $(element).foundation('reveal', 'open');
    $(element).foundation('reveal', {closed: function(){
      that.onEnter(actionOnEnter);
    }});
  };

  this.onEnter = function(action, keepDefault){
    // console.log('onEnter | action: ', action);
    if ( action && typeof action === 'function' ) {
      $(document).off('keypress'); // cancel any previous bindings
      $(document).keypress(function(e) {
        if(e.which == 13) {
          // console.log('onEnter | if enter key pressed set action');
          e.preventDefault(); // cancel default
          action(); // call the function passed in
        }
      });
    } else { // do nothing
      $(document).off('keypress'); // cancel any previous bindings
      $(document).keypress(function(e) {
        if(e.which == 13) {
          // console.log('onEnter | if enter key pressed do nothing');
          if ( !keepDefault ) e.preventDefault(); // cancel default
          return true;
        }
      });
    }
  };

  this.getDates = function(callback){
    var midnight = moment().hours(0).minutes(0).seconds(0).unix()*1000; // default to system
    var overridden = $('#dash-date').data('date');
    if ( overridden && overridden > 0 ) midnight = overridden; // pull the date from the dom (because it may have been overridden)
    var today = moment(midnight).format("DDMMYYYY");
    callback(midnight, today);
  };

  this.updatePendingDisplay = function(pending){
    if ( pending ) {
      $('#label-servicecount').text(' - ' + pending);
    }
    else {
      $('#label-servicecount').text('');
    }
  };

  this.showEmail = function(email){
    // console.log('showEmail: ', email);
    if ( email ){
      $('#label-email').text(email);
      $('.account.logout').show();
      $('.account.login').hide();
    } else {
      $('#label-email').text('');
      $('.account.logout').hide();
      $('.account.login').show();
    }
  };
  this.displayOnlineStatus = function(status){
    // console.log('displayOnlineStatus: ', status);
    switch (status){
      case 0: { // online and authd
        $('.onlinestatus.icon-refresh').hide();
        $('.onlinestatus.label')
          .show()
          .removeClass('alert')
          .addClass('success')
          .find('.statustext')
          .text('online');
        $('#label-logout').show();
      }
      break;
      case 1:{ // online but not authed
        $('.onlinestatus.icon-refresh').hide();
        $('.onlinestatus.label')
          .show()
          .removeClass('success')
          .addClass('alert')
          .find('.statustext')
          .text('non autorisé');
        $('.account.logout').hide();
        $('.account.login').show();
      }
      break;
      case 2: { // offline
        $('.onlinestatus.icon-refresh').hide();
        $('.onlinestatus.label')
          .show()
          .removeClass('success')
          .addClass('alert')
          .find('.statustext')
          .text('offline');
        $('#label-logout').hide();
        $('.account.login').hide();
      }
      break;
      case 3: { // forbidden, no session
        $('.onlinestatus.icon-refresh').hide();
        $('.onlinestatus.label')
          .show()
          .removeClass('success')
          .addClass('alert')
          .find('.statustext')
          .text('session expiré');
        $('.account.logout').hide();
        $('.account.login').show();
      }
      break;
      case 4: { // syncing
        $('.onlinestatus.label').hide();
          // .removeClass('success')
          // .removeClass('alert')
          // .find('.statustext')
          // .text('syncing...');
        $('.onlinestatus.icon-refresh').show();
      }
      break;
    }
  };

  this.populatePremiervu = function(){
    var thisyear = moment().year();
    var pastyears = 4;
    var element = $('#select-premiervu');

    // remove any existing options
    element
      .find('option')
      .remove()
      .end()
      .parent()
      .find('li')
      .remove();

    // add the default NSP option
    element
      .append($('<option>', { value: 'NSP', text : 'NSP' }));

    element
      .parent()
      .find('ul')
      .append('<li>NSP</li>');

    // add an option for each year
    for (var i = 0; i < pastyears; i++) { // for the number of years to go back
      var year = thisyear - i;
      // add the options to the select
      element.append($('<option>', { value: year, text : year }));

      // add the li itens to the ul (required for foundation custom selects)
      element
        .parent()
        .find('ul')
        .append('<li>'+year+'</li>');
    }
    // this year as default
    that.selectDefault(element, 1);
  };

  this.filterDeleted = function(array){
    if ( array ) {
      for (var i = array.length - 1; i >= 0; i--) {
        if ( array[i].deleted ) array.splice(i,1);
      }
      return array;
    }
    else return array; // anyway
  };

  this.displayLastSync = function(when){
    if ( when > 0 ) $('#label-lastsync').text(moment(when-10000).fromNow()); // subtract 10 seconds to deal with clocks a bit out of sync
    else $('#label-lastsync').text('Never');
  };

  // use momentjs for better dates
  this.prettifyDate = function(n){
    if( isNaN(parseFloat(n)) || !isFinite(n)) return false; // value entered was not numeric
    else {
      var m = moment(parseInt(n, 10)); // using moment.js because it's better than native Date; it gives .days for example which is handy here

      var display_string = m.format("dddd, D MMMM YYYY");
      return display_string;
    }
  };

  this.now = function(){
    return new Date().getTime();
  };

  // No comment required
  this.isEqual = function(a, b) {
      return a._id === b._id;
  };

  this.arrayUnion = function(o, m)  {
    if ( o !== null && m !== null ) {
      // console.log('o & m');
      // console.log(o);
      // console.log(m);
      for (var i = m.length - 1; i >= 0; i--) {
        if ( m[i] !== null ) {
          for (var x = o.length - 1; x >= 0; x--) { // for each local client
            if ( o[x] !== null && that.isEqual( o[x], m[i] ) ){ o.splice(x, 1); } // if modified clientalready present, remove it
          }
          if ( ! m[i].deleted ) o.push(m[i]); // add the modified client to the array if it is not marked as deleted
        }
      }
      return o;
    } else return false;
  };

  this.selectDefault = function(element, desiredindex){
    var thisindex = 0;
    $(element).parent().find('ul li').each(function() { // for each option in the select list
      $(this).removeClass('selected');
      if ( thisindex === desiredindex ) {
        $(this).addClass('selected')
          .parent()
          .parent()
          .find('.current')
          .text($(this).text());
      }
      thisindex++;
    });
  };

  this.setMomentjsLang = function(){
    moment.lang('fr', {
          months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
          monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
          weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
          weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
          weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
          longDateFormat : {
              LT : "HH:mm",
              L : "DD/MM/YYYY",
              LL : "D MMMM YYYY",
              LLL : "D MMMM YYYY LT",
              LLLL : "dddd D MMMM YYYY LT"
          },
          calendar : {
              sameDay: "[Aujourd'hui à] LT",
              nextDay: '[Demain à] LT',
              nextWeek: 'dddd [à] LT',
              lastDay: '[Hier à] LT',
              lastWeek: 'dddd [dernier à] LT',
              sameElse: 'L'
          },
          relativeTime : {
              future : "dans %s",
              past : "il y a %s",
              s : "quelques secondes",
              m : "une minute",
              mm : "%d minutes",
              h : "une heure",
              hh : "%d heures",
              d : "un jour",
              dd : "%d jours",
              M : "un mois",
              MM : "%d mois",
              y : "une année",
              yy : "%d années"
          },
          ordinal : function (number) {
              return  (number === 1 ? 'er' : 'ème');
          },
          week : {
              dow : 1, // Monday is the first day of the week.
              doy : 4  // The week that contains Jan 4th is the first week of the year.
          }
      });
  };

  this.sort_by = function(field, reverse, primer){
    var key = function (x) {return primer ? primer(x[field]) : x[field];};
    return function (a,b) {
      var A = key(a), B = key(b);
      return (A < B ? -1 : (A > B ? 1 : 0)) * [1,-1][+!!reverse];
    };
  };

  this.setDashDate = function(thedate){
    $('#dash-date').text(moment(thedate).format("ddd D MMM YYYY")); // pretty date is shown
  };

  this.clearCache = function(){
    for (var i = localStorage.length - 1; i >= 0; i--) { // for each value in local storage
      var keyname = localStorage.key(i);
      localStorage.removeItem(keyname);
    }
  };
}