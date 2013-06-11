
// socket-manager.js
var socketio = require('socket.io');

var RedisStore = require('socket.io/lib/stores/redis')
  , sioRedis  = require('socket.io/node_modules/redis')
  , pub    = sioRedis.createClient(REDIS_PARAMS.port, REDIS_PARAMS.host)
  , sub    = sioRedis.createClient(REDIS_PARAMS.port, REDIS_PARAMS.host)
  , sioClient = sioRedis.createClient(REDIS_PARAMS.port, REDIS_PARAMS.host);

if ( REDIS_PARAMS.pass ) {
    pub.auth(REDIS_PARAMS.pass, function (err) { if (err) throw err; else console.log('pub authed on sioRedis at: '+ REDIS_PARAMS.host); });
    sub.auth(REDIS_PARAMS.pass, function (err) { if (err) throw err; else console.log('sub authed on sioRedis at: '+ REDIS_PARAMS.host); });
    sioClient.auth(REDIS_PARAMS.pass, function (err) { if (err) throw err; else console.log('client authed on sioRedis at: '+ REDIS_PARAMS.host); });
} else console.log('connected to sioRedis at: '+ REDIS_PARAMS.host);


var SIO = {};
module.exports = SIO;

var io;

SIO.setupSocket = function(server, cookieParser, sessionStore){

  // adds express session
  var authFunction = require('./socket.io-express.js').createAuthFunction(cookieParser, sessionStore);

    io = socketio.listen(server); // connect socket to express
    io.set('authorization', authFunction); // set middleware for capturing the express session

    // use redis, not the default memoryStore
    io.set('store', new RedisStore({
      redis    : sioRedis
    , redisPub : pub
    , redisSub : sub
    , redisClient : sioClient
    }));    

    // configure
    io.configure('development', function () {
            io.set("transports", ["xhr-polling"]); // required to work on Heroku
            io.set("polling duration", 10); // required to work on Heroku
            io.set('log level', 3);                    // reduce logging
    });

    io.configure('production', function () {
        
        //-------------------Herokification-----------------------------------------------------
        io.set("transports", ["xhr-polling"]); // required to work on Heroku
        io.set("polling duration", 10);
        // see: https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
        //--------------------------------------------------------------------------------------

        // io.enable('browser client minification');  // send minified client
        // io.enable('browser client etag');          // apply etag caching logic based on version number
        io.set('log level', 1);                    // reduce logging
        // io.set('transports', [                     // enable all transports (optional if you want flashsocket)
        //     'websocket'
        //   , 'flashsocket'
        //   , 'htmlfile'
        //   , 'xhr-polling'
        //   , 'jsonp-polling'
        // ]);
    });

    // every socket comes in here and is put into a global array keyed by userid & its own socket id
    io.sockets.on('connection', function(thissocket){
        var hs = thissocket.handshake;
        var userid = hs.session.user._id;

        console.log('A socket with sessionID '+hs.sessionId+' connected.');

        // ------------------------------------------------------------------------------------------------
        // socket handshake
        //
        // after the client has connected (and got a socket back from this routine) the clinet *must* emit
        // a handshake message so that this socket is entered into the socket store.
        // This allows the client to specify the groupid that they wish to belong to - typically, groupid
        // is resultid. This means the sendMsg function can emit messages to all sockets belonging to 
        // the group - not just this specific socket.
        // ------------------------------------------------------------------------------------------------
        // thissocket.on('handshake', function(groupid){
        //     console.log('handshake request made with: ', groupid);
        //     if ( groupid === 'userid' ) groupid = userid;
        //     if ( groupid ) {
        //         if ( ! jv_sockets[userid] ) jv_sockets[userid] = {}; // create an object if userid is not already present
        //         jv_sockets[userid][thissocket.id] = {
        //             groupid   : groupid, // add the property groupid
        //             socket  : thissocket // this is the actual socket used to send data over
        //         };
        //     } else console.log('invalid groupid supplied')
        // })

        // ------------------------------------------------------------------------
        // handshake method using socket.io rooms
        // ------------------------------------------------------------------------
        thissocket.on('handshake', function(groupid){
            console.log('Hnadshake request received from ', thissocket.id, ' using groupid: ', groupid)
            thissocket.join(groupid);
        });

        thissocket.on('disconnect', function(){ // remove this socket from the global array
            console.log('on disconnect');
            delete thissocket;
        });
  });
}

SIO.sendMsg = function(name, userid, groupid, payload){
    // console.log('sendMsg | name: '+name)
    // console.log('sendMsg | userid: '+userid)
    
    // ------------------------------------------------------------------------
    // build payload
    //
    // this allows a consistent format for messages. If a string is passed it 
    // is added to an object. On the client all listeners expect stringifyd
    // objects and this protects this whilst giving flexibility to server code.
    // ------------------------------------------------------------------------
    var payloadObj = {};
    if(typeof payload  !== 'object') {
        payloadObj.msg = payload;
    } else payloadObj = payload;


    // ------------------------------------------------------------------------
    // Loop all sockets for user
    //
    // for each socket belonging to this user, we check to see if any belong to
    // this group and emit to them only
    // ------------------------------------------------------------------------
    // if(jv_sockets[userid]) { // the user has some sockets
    //     for (var key in jv_sockets[userid]){ // for each socket in the array
    //         if( jv_sockets[userid][key].groupid === groupid ){ // if this socket is part of the group
    //             if (typeof jv_sockets[userid][key].socket.handshake === 'object') { // if this socket is indeed a socket
    //                 console.log('emitting to userid: ', userid, ' on socketid: ', key, ' with groupid: ', groupid);
    //                 jv_sockets[userid][key].socket.emit(name, JSON.stringify(payloadObj)); // then emit to this socket
    //             } else console.log('no valid handshake for socket')
    //         } else console.log('socketid: ', key, ' with groupid: ', jv_sockets[userid][key].groupid, ' does not match groupid: ', groupid);
    //     }                
    // } else console.log('there are no sockets listening for this user'); 



    // ------------------------------------------------------------------------
    // emit method using socket.io rooms
    // ------------------------------------------------------------------------
    io.sockets.in(groupid).emit(name, JSON.stringify(payloadObj));

}  