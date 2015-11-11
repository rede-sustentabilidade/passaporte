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
	let countQuery = db.query(`
		SELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
		where oc.client_id = $1;
	`, [id]);

	countQuery.on('error', done);
	countQuery.on('row', (row) => {
		if(parseInt(row.length) < 1) {
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
			VALUES ($1, $2, $3, $4);
		`, [tokenHash, client.client_id, user.id, expirationDate], (err, result) => {
			if (err) return done(err)
			return done(null, token, {expires_in: expirationDate.toISOString()})
		})
}))



//Register grant (used to issue authorization codes)
// server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
//     var code = utils.uid(16)
//     var codeHash = crypto.createHash('sha1').update(code).digest('hex')

//     db.collection('authorizationCodes').save({code: codeHash, clientId: client._id, redirectURI: redirectURI, userId: user.username}, function(err) {
//         if (err) return done(err)
//         done(null, code)
//     })
// }))

//Register grant (used to issue authorization codes)
server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    var code = utils.uid(16)
    var codeHash = crypto.createHash('sha1').update(code).digest('hex'),
		query = db.query(`
		INSERT INTO rs.oauth_authorization_codes(code, client_id, user_id, redirect_uri)
			VALUES ($1, $2, $3, $4);
		`, [codeHash, client.client_id, user.id, redirectURI], (err, result) => {
			if (err) return done(err)
			return done(null, code)
		})
}))

//Used to exchange authorization codes for access token
server.exchange(oauth2orize.exchange.code(function (client, code, redirectURI, done) {
    db.collection('authorizationCodes').findOne({code: code}, function (err, authCode) {
        if (err) return done(err)
        if (!authCode) return done(null, false)
        if (client.clientId !== authCode.clientId) return done(null, false)
        if (redirectURI !== authCode.redirectURI) return done(null, false)

        db.collection('authorizationCodes').remove({code: code}, function(err) {
            if(err) return done(err)
            var token = utils.uid(256)
            var refreshToken = utils.uid(256)
            var tokenHash = crypto.createHash('sha1').update(token).digest('hex')
            var refreshTokenHash = crypto.createHash('sha1').update(refreshToken).digest('hex')

            var expirationDate = new Date(new Date().getTime() + (3600 * 1000))

            db.collection('accessTokens').save({token: tokenHash, expirationDate: expirationDate, userId: authCode.userId, clientId: authCode.clientId}, function(err) {
                if (err) return done(err)
                db.collection('refreshTokens').save({refreshToken: refreshTokenHash, clientId: authCode.clientId, userId: authCode.userId}, function (err) {
                    if (err) return done(err)
                    done(null, token, refreshToken, {expires_in: expirationDate})
                })
            })
        })
    })
}))

//Refresh Token
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
    var refreshTokenHash = crypto.createHash('sha1').update(refreshToken).digest('hex')

    db.collection('refreshTokens').findOne({refreshToken: refreshTokenHash}, function (err, token) {
        if (err) return done(err)
        if (!token) return done(null, false)
        if (client.clientId !== token.clientId) return done(null, false)

        var newAccessToken = utils.uid(256)
        var accessTokenHash = crypto.createHash('sha1').update(newAccessToken).digest('hex')

        var expirationDate = new Date(new Date().getTime() + (3600 * 1000))

        db.collection('accessTokens').update({userId: token.userId}, {$set: {token: accessTokenHash, scope: scope, expirationDate: expirationDate}}, function (err) {
            if (err) return done(err)
            done(null, newAccessToken, refreshToken, {expires_in: expirationDate})
        })
    })
}))

// user authorization endpoint
exports.authorization = [
	function(req, res, next) {
		if (req.user) {
			next()
		} else {
			res.redirect('/oauth/authorization?'+
				'client_id='+req.query.client_id+
				'&redirect_uri='+req.query.redirect_uri+
				'&response_type='+req.query.response_type
			)
		}
	},
	server.authorization(function(client_id, redirect_uri, done) {
		let countQuery = db.query(`
			SELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
			where oc.client_id = $1 and oc.redirect_uri = $2;
		`, [client_id, redirect_uri]);

		countQuery.on('error', done);
		countQuery.on('row', (row) => {
			if(parseInt(row.count) < 0) {
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
		if (req.user) {
			next()
		} else {
			res.redirect('/oauth/authorization?'+
				'client_id='+req.query.client_id+
				'&redirect_uri='+req.query.redirect_uri+
				'&response_type='+req.query.response_type
			)
		}
	},
	server.decision()
]
