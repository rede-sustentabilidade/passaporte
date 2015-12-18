/**
* Module dependencies.
*/
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , BasicStrategy = require('passport-http').BasicStrategy
    , ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
    , BearerStrategy = require('passport-http-bearer').Strategy
    , db = require('./db')
    , bcrypt = require('bcrypt')
    , crypto = require('crypto')


/**
* LocalStrategy
*/
passport.use(new LocalStrategy(
    function(username, password, done) {
		let query = db.query(`
			SELECT u.id, u.username, u.password from rs.users u
			where lower(u.username) = lower($1);
		`, [username], function(err, results) {
			if (err) { done(err) }

			let row = results.rows[0]
			if(parseInt(results.rows.length) < 1) {
				return done(null, false, {message: 'E-mail não encontrado.'});
			} else {
				bcrypt.compare(password, row.password, function (err, res) {
					if (!res) return done(null, false, {message: 'Senha não confere.'})
					return done(null, row)
				})
			}
		});
    }
))

passport.serializeUser(function(user, done) {
    done(null, user.username);
})

passport.deserializeUser(function(id, done) {
	let query = db.query(`
		SELECT u.id, u.username from rs.users u
		where u.username = $1;
	`, [id]);

	query.on('error', done);
	query.on('row', (row) => {
		if(Object.keys(row).length < 1) {
			done(null, false)
		} else {
			done(null, row)
		}
    })
})


/**
 * These strategies are used to authenticate registered OAuth clients.
 * The authentication data may be delivered using the basic authentication scheme (recommended)
 * or the client strategy, which means that the authentication data is in the body of the request.
 */
passport.use("clientBasic", new BasicStrategy(
    function (clientId, clientSecret, done) {
		let countQuery = db.query(`
			SELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
			where oc.client_secret = $1 and oc.client_id = $2;
		`, [clientSecret, clientId], function (err, result) {
			let row = result.rows[0]
			if(Object.keys(row).length < 1) {
				return done(null, false)
			} else if (row.client_secret === clientSecret) {
				return done(null, row)
			}
			return done(null, false)
		})
		countQuery.on('error', done);
    }
));

passport.use("clientPassword", new ClientPasswordStrategy(
    function (clientId, clientSecret, done) {
		let countQuery = db.query(`
			SELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri
			FROM rs.oauth_clients oc
			where oc.client_secret = $1 and oc.client_id = $2;
		`, [clientSecret, clientId], function (err ,result) {
			let row = result.rows[0]
			if(Object.keys(row).length < 1) {
				return done(null, false)
			} else if (row.client_secret == clientSecret) {
				return done(null, row)
			} else {
				return done(null, false)
			}
		})
		countQuery.on('error', done);
    }
));

/**
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).
 */
passport.use("accessToken", new BearerStrategy(
    function (accessToken, done) {
		console.log(accessToken)
		done(null, true)
        var accessTokenHash = crypto.createHash('sha1').update(accessToken).digest('hex')
        db.collection('accessTokens').findOne({token: accessTokenHash}, function (err, token) {
            if (err) return done(err)
            if (!token) return done(null, false)
            if (new Date() > token.expirationDate) {
                db.collection('accessTokens').remove({token: accessTokenHash}, function (err) { done(err) })
            } else {
                db.collection('users').findOne({username: token.userId}, function (err, user) {
                    if (err) return done(err)
                    if (!user) return done(null, false)
                    // no use of scopes for no
                    var info = { scope: '*' }
                    done(null, user, info);
                })
            }
        })
    }
))
