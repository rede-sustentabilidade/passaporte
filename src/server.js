import app from './app'
//import models from "./models"
import path from 'path'
import debug from 'debug'
import http from 'http'
import config from './config'
import fs from 'fs'

debug('web:server')

/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(process.env.PORT || '5000')
app.set('port', port)

/**
 * Create HTTP server.
 */

 var db = require('./' + config.db.type + '/index');
 if (config.db.type === 'mongodb') {
   console.log('Using MongoDB for the data store');
 } else if (config.db.type === 'db') {
   console.log('Using MemoryStore for the data store');
 } else {
   //We have no idea here
   throw new Error("Within config/index.js the db.type is unknown: " + config.db.type);
 }

 //From time to time we need to clean up any expired tokens
 //in the database
 setInterval(function () {
   db.accessTokens.removeExpired(function (err) {
     if (err) {
       console.error("Error removing expired tokens");
     }
   });
 }, config.db.timeToCheckExpiredTokens * 1000);

 //TODO: Change these for your own certificates.  This was generated
 //through the commands:
 //openssl genrsa -out privatekey.pem 1024
 //openssl req -new -key privatekey.pem -out certrequest.csr
 //openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem

// let options = {
//   key: fs.readFileSync(path.join(__dirname, '/certs/privatekey.pem')),
//   cert: fs.readFileSync(path.join(__dirname, '/certs/certificate.pem'))
// };
let server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */
//models.sequelize.sync()
server.listen(port)
server.on('error', onError)
server.on('listening', onListening)
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	var port = parseInt(val, 10)

	if (isNaN(port)) {
		// named pipe
		return val
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string'
	? 'pipe ' + addr
	: 'port ' + addr.port
	debug('Listening on ' + bind)
}
