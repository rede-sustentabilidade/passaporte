/**
* Module dependencies.
*/
'use strict';

var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy,
    ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy,
    BearerStrategy = require('passport-http-bearer').Strategy,
    db = require('./db'),
    bcrypt = require('bcrypt'),
    crypto = require('crypto');

/**
* LocalStrategy
*/
passport.use(new LocalStrategy(function (username, password, done) {
	var query = db.query('\n\t\t\tSELECT u.id, u.username, u.password from rs.users u\n\t\t\twhere lower(u.username) = lower($1);\n\t\t', [username], function (err, results) {
		if (err) {
			done(err);
		}

		var row = results.rows[0];
		if (parseInt(results.rows.length) < 1) {
			return done(null, false, { message: 'E-mail não encontrado.' });
		} else {
			bcrypt.compare(password, row.password, function (err, res) {
				if (!res) return done(null, false, { message: 'Senha não confere.' });
				return done(null, row);
			});
		}
	});
}));

passport.serializeUser(function (user, done) {
	done(null, user.username);
});

passport.deserializeUser(function (id, done) {
	var query = db.query('\n\t\tSELECT u.id, u.username from rs.users u\n\t\twhere u.username = $1;\n\t', [id]);

	query.on('error', done);
	query.on('row', function (row) {
		if (Object.keys(row).length < 1) {
			done(null, false);
		} else {
			done(null, row);
		}
	});
});

/**
 * These strategies are used to authenticate registered OAuth clients.
 * The authentication data may be delivered using the basic authentication scheme (recommended)
 * or the client strategy, which means that the authentication data is in the body of the request.
 */
passport.use("clientBasic", new BasicStrategy(function (clientId, clientSecret, done) {
	var countQuery = db.query('\n\t\t\tSELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc\n\t\t\twhere oc.client_id = $1;\n\t\t', [clientId]);

	countQuery.on('error', done);
	countQuery.on('row', function (row) {
		if (Object.keys(row).length < 1) {
			return done(null, false);
		} else if (row.client_secret === clientSecret) {
			return done(null, row);
		}
		return done(null, false);
	});
}));

passport.use("clientPassword", new ClientPasswordStrategy(function (clientId, clientSecret, done) {
	var countQuery = db.query('\n\t\t\tSELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri\n\t\t\tFROM rs.oauth_clients oc\n\t\t\tWHERE oc.client_id = $1;\n\t\t', [clientId]);

	countQuery.on('error', done);
	countQuery.on('row', function (row) {
		if (Object.keys(row).length < 1) {
			return done(null, false);
		} else if (row.client_secret === clientSecret) {
			return done(null, row);
		} else {
			return done(null, false);
		}
	});
}));

/**
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).
 */
passport.use("accessToken", new BearerStrategy(function (accessToken, done) {
	var accessTokenHash = crypto.createHash('sha1').update(accessToken).digest('hex');
	db.collection('accessTokens').findOne({ token: accessTokenHash }, function (err, token) {
		if (err) return done(err);
		if (!token) return done(null, false);
		if (new Date() > token.expirationDate) {
			db.collection('accessTokens').remove({ token: accessTokenHash }, function (err) {
				done(err);
			});
		} else {
			db.collection('users').findOne({ username: token.userId }, function (err, user) {
				if (err) return done(err);
				if (!user) return done(null, false);
				// no use of scopes for no
				var info = { scope: '*' };
				done(null, user, info);
			});
		}
	});
}));