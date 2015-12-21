/**
* Module dependencies.
*/
import passport from 'passport'
import {Strategy as LocalStrategy} from 'passport-local'
import {BasicStrategy as BasicStrategy} from 'passport-http'
import {Strategy as ClientPasswordStrategy} from 'passport-oauth2-client-password'
import {Strategy as BearerStrategy} from 'passport-http-bearer'
import db from './db'
import bcrypt from 'bcrypt'
import crypto from 'crypto'


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
			} else if (row.client_secret == clientSecret) {
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
			select oc.name, oc.client_id, oc.client_secret, oc.redirect_uri
			from rs.oauth_clients oc
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
        var accessTokenHash = crypto.createHash('sha1').update(accessToken).digest('hex')
		let tokenSearch = db.query(
			`select oa.access_token, oa.client_id, oa.user_id, oa.expires
			from rs.oauth_access_tokens oa
			where oa.access_token = $1;`,
			[accessTokenHash],
			function (err ,rToken) {
				if (err) return done(err)
				if(Object.keys(rToken.rows).length == 0)  return done(null, false)
				let user_id = rToken.rows[0].user_id
				let expires = rToken.rows[0].expires
				if (new Date() > expires) {
					let tokenRemove = db.query(
						`delete from rs.oauth_access_tokens oa where oa.access_token = $1`,
						[accessTokenHash],
						done
					)
				} else {
					let userSearch = db.query(`
						select u.id, u.username, u.password
						from rs.users as u
						where u.id = $1`,
						[user_id],
						function (err2, rUser) {
							if (err) return done(err)
							if (!rUser.rows[0].id) return done(null, false)
							// no use of scopes for no
							var info = { scope: '*' }
							delete rUser.rows[0].password
							done(null, rUser.rows[0], info)
						}
					)
				}
			}
		)
    }
))
