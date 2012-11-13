/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström
    
    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    MIT Licensed.

    Usage : node app.js
*/

    var
        http            = require('http');
        gameport        = process.env.PORT || 80,

        io              = require('socket.io'),
        express         = require('express'),
        UUID            = require('node-uuid'),

        verbose         = false,
        app             = express();

/* Express server set up. */

//The express server handles passing our content to the browser,
//As well as routing users where they need to go. This example is bare bones
//and will serve any file the user requests from the root of your web server (where you launch the script from)
//so keep this in mind - this is not a production script but a development teaching tool.

//This is experimental code from the internet BEWARE
server = http.createServer(app);

//end experimental code
        //Tell the server to listen for incoming connections
    //app.listen( gameport );

        //Log something so we know that it succeeded.
    //console.log('\t :: Express :: Listening on port ' + gameport );

        //By default, we forward the / path to index.html automatically.
    //app.get( '/', function( req, res ){
    //    res.sendfile( __dirname + '/index.html' );
    //});


        //This handler will listen for requests on /*, any file from the root of our server.
        //See expressjs documentation for more info on routing.

    // app.get( '/*' , function( req, res, next ) {

    //         //This is the current file they have requested
    //     var file = req.params[0];

    //         //For debugging, we can track what files are requested.
    //     if(verbose) console.log('\t :: Express :: file requested : ' + file);

    //         //Send the requesting client the file.
    //     res.sendfile( __dirname + '/' + file );

    // }); 
    //app.get *


/* Socket.IO server set up. */

//Express and socket.io can work together to serve the socket.io client files for you.
//This way, when the client requests '/socket.io/' files, socket.io determines what the client needs.
    
		//store the full list of clients, hashed by id
		var clients = {};
		var numberOfClients = 0;
		
    //Create a socket.io instance using our express server
    var sio = io.listen(server);

    server.listen(5000);

    //Configure the socket.io connection settings.
    //See http://socket.io/
    sio.configure(function (){

        sio.set('log level', 0);

        sio.set('authorization', function (handshakeData, callback) {
          callback(null, true); // error first callback style
        });

    });

        //Socket.io will call this function when a client connects,
        //So we can send that client looking for a game to play,
        //as well as give that client a unique ID to use so we can
        //maintain the list if players.
    sio.sockets.on('connection', function (client) {
            //Generate a new UUID, looks something like
            //5b2ca132-64bd-4513-99da-90e838ca47d1
            //and store this on their socket/connection
        client.userid = UUID();

            //tell the player they connected, giving them their id and the list of clients
        client.emit('onconnected', { 'id': client.userid, 'clients': clients } );
        console.log(client.userid + ' connected. ' + ++numberOfClients + ' clients'); //Useful to know when someone connects
										
						//when the player responds back with position data, add to clients and tell everyone else
				client.on('verifiedconnection', function(data){
					clients[client.userid] = {'id': client.userid, 'x':data.x, 'y':data.y, 'z':data.z };
					client.broadcast.emit('onnewconnection', clients[client.userid] );
					
					console.log('\t -> Verified connection. Position is (' + data.x + ', ' + data.y + ', ' + data.z + ')'); //Useful to know when verified
				});

            //Now we want to handle some of the messages that clients will send.
            //They send messages here, and we send them to the game_server to handle.
        client.on('message', function(m) {

            console.log(m);

        }); //client.on message

            //When this client disconnects, we want to tell the game server
            //about that as well, so it can remove them from the game they are
            //in, and make sure the other player knows that they left and so on.
        client.on('disconnect', function () {
								//remove client from clients list
						delete clients[client.userid];
								//tell everyone that a player has disconnected
						client.broadcast.emit("ondisconnection", client.userid);
                //Useful to know when soomeone disconnects
            console.log(client.userid + ' disconnected. ' + --numberOfClients + ' remaining' );
            
                //If the client was in a game, set by game_server.findGame,
                //we can tell the game server to update that game state.

        }); //client.on disconnect

				
				//when a player moves, update the server copy of data and tell everyone
        client.on('updatePosition', function (data) {
            client.broadcast.emit('onplayermovement', data);
						clients[client.userid].x = data.x;
						clients[client.userid].y = data.y;
						clients[client.userid].z = data.z;
            console.log(data);
        });
        client.on("name", function(data){
            console.log(data);
        });
     
    }); //sio.sockets.on connection


