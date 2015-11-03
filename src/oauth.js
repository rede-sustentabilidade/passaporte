var oauth2orize = require('oauth2orize')
    , passport = require('passport')
    , db = require('./db')
    , crypto = require('crypto')
    , utils = require("./utils")
    , bcrypt = require('bcrypt')

// create OAuth 2.0 server
var server = oauth2orize.createServer();

//(De-)Serialization for clients
server.serializeClient(function(client, done) {
    return done(null, client.client_id)
})

server.deserializeClient(function(id, done) {
	countQuery = db.query(`
		SELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
		where oc.client_id = $1;
	`, [id]);

	countQuery.on('error', done);
	countQuery.on('row', (row) => {
		if(parseInt(row.count) > 0) {
			res.send("Client ID not found.").status(404)
		} else {
			done(null, row)
		}
    })
})

//Implicit grant
server.grant(oauth2orize.grant.token(function (client, user, ares, done) {
    let token = utils.uid(256),
    	tokenHash = crypto.createHash('sha1').update(token).digest('hex'),
    	expirationDate = new Date(new Date().getTime() + (3600 * 1000)),
		query = db.query(`
		INSERT INTO rs.oauth_access_tokens(access_token, client_id, user_id, expires)
			name, client_id, client_secret, redirect_uri) VALUES ($1, $2, $3, $4)
		`, [tokenHash, client.client_id, user.id, expirationDate]);
	query.on('error', done)
    query.on('row', (row) => {
    	return done(null, token, {expires_in: expirationDate.toISOString()})
    })
}))

// user authorization endpoint
exports.authorization = [
	function(req, res, next) {
		if (req.user) next()
		else res.redirect('/oauth/authorization')
	},
	server.authorization(function(client_id, redirect_uri, done) {
		countQuery = db.query(`
			SELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
			where oc.client_id = $1 and oc.redirect_uri = $2;
		`, [client_id, redirect_uri]);

		countQuery.on('error', done);
		countQuery.on('row', (row) => {
			if(parseInt(row.count) > 0) {
				res.send("Client ID not found.").status(404)
			} else {
				done(null, row, redirect_uri)
			}
		})
	}),
	function(req, res) {
		res.render('decision', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
	}
]

// user decision endpoint

exports.decision = [
	function(req, res, next) {
		if (req.user) next()
		else res.redirect('/oauth/authorization')
	},
	server.decision()
]
