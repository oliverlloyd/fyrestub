// socket.io-express.js
//
// middleware for socket connections - adds the express.js session to the socket.io handshake object
// See:
// http://www.danielbaulig.de/socket-ioexpress/
// and https://github.com/alphapeter/socket.io-express/blob/master/socket.io-express.js

var socket_io_express = function(cookieParser, sessionStore, cookie){
    var _cookie = cookie || 'connect.sid';
    var _cookieParser = cookieParser;
    var _sessionStore = sessionStore;

    var authorization = function(data, accept){
        if (data && data.headers && data.headers.cookie) {
            _cookieParser(data, {}, function(err){
                if(err){
                    return accept('COOKIE_PARSE_ERROR');
                }
                var sessionId = data.signedCookies[_cookie];
                _sessionStore.get(sessionId, function(err, session){
                    if(err || !session || !session.user ){
                        accept('NOT_LOGGED_IN', false);
                    }
                    else{
                        data.session = session;
                        data.sessionId = sessionId;
                        accept(null, true);
                    }
                });
            });
        } else {
            return accept('MISSING_COOKIE', false);
        }
    };

    return authorization;
};

exports.createAuthFunction = socket_io_express;