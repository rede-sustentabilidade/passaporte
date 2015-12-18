/**
* Module dependencies.
*/
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportLocal = require('passport-local');

var _passportHttp = require('passport-http');

var _passportOauth2ClientPassword = require('passport-oauth2-client-password');

var _passportHttpBearer = require('passport-http-bearer');

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

/**
* LocalStrategy
*/
_passport2['default'].use(new _passportLocal.Strategy(function (username, password, done) {
	var query = _db2['default'].query('\n\t\t\tSELECT u.id, u.username, u.password from rs.users u\n\t\t\twhere lower(u.username) = lower($1);\n\t\t', [username], function (err, results) {
		if (err) {
			done(err);
		}

		var row = results.rows[0];
		if (parseInt(results.rows.length) < 1) {
			return done(null, false, { message: 'E-mail não encontrado.' });
		} else {
			_bcrypt2['default'].compare(password, row.password, function (err, res) {
				if (!res) return done(null, false, { message: 'Senha não confere.' });
				return done(null, row);
			});
		}
	});
}));

_passport2['default'].serializeUser(function (user, done) {
	done(null, user.username);
});

_passport2['default'].deserializeUser(function (id, done) {
	var query = _db2['default'].query('\n\t\tSELECT u.id, u.username from rs.users u\n\t\twhere u.username = $1;\n\t', [id]);

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
_passport2['default'].use("clientBasic", new _passportHttp.BasicStrategy(function (clientId, clientSecret, done) {
	var countQuery = _db2['default'].query('\n\t\t\tSELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc\n\t\t\twhere oc.client_secret = $1 and oc.client_id = $2;\n\t\t', [clientSecret, clientId], function (err, result) {
		var row = result.rows[0];
		if (Object.keys(row).length < 1) {
			return done(null, false);
		} else if (row.client_secret === clientSecret) {
			return done(null, row);
		}
		return done(null, false);
	});
	countQuery.on('error', done);
}));

_passport2['default'].use("clientPassword", new _passportOauth2ClientPassword.Strategy(function (clientId, clientSecret, done) {
	var countQuery = _db2['default'].query('\n\t\t\tSELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri\n\t\t\tFROM rs.oauth_clients oc\n\t\t\twhere oc.client_secret = $1 and oc.client_id = $2;\n\t\t', [clientSecret, clientId], function (err, result) {
		var row = result.rows[0];
		if (Object.keys(row).length < 1) {
			return done(null, false);
		} else if (row.client_secret == clientSecret) {
			return done(null, row);
		} else {
			return done(null, false);
		}
	});
	countQuery.on('error', done);
}));

/**
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).
 */
_passport2['default'].use("accessToken", new _passportHttpBearer.Strategy(function (accessToken, done) {
	console.log(accessToken);
	done(null, true);
	var accessTokenHash = _crypto2['default'].createHash('sha1').update(accessToken).digest('hex');
	_db2['default'].collection('accessTokens').findOne({ token: accessTokenHash }, function (err, token) {
		if (err) return done(err);
		if (!token) return done(null, false);
		if (new Date() > token.expirationDate) {
			_db2['default'].collection('accessTokens').remove({ token: accessTokenHash }, function (err) {
				done(err);
			});
		} else {
			_db2['default'].collection('users').findOne({ username: token.userId }, function (err, user) {
				if (err) return done(err);
				if (!user) return done(null, false);
				// no use of scopes for no
				var info = { scope: '*' };
				done(null, user, info);
			});
		}
	});
}));