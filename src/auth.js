/*jslint node: true */
'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var config = require('./config');
var db = require('./' + config.db.type + '/index');

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(new LocalStrategy(
  function (username, password, done) {
    db.users.findByUsername(username, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      if (user.password != password) {
        return done(null, false);
      }
      return done(null, user);
    });
  }
));

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(
  function (username, password, done) {
    db.clients.findByClientId(username, function (err, client) {
      if (err) {
        return done(err);
      }
      if (!client) {
        return done(null, false);
      }
      if (client.clientSecret != password) {
        return done(null, false);
      }
      return done(null, client);
    });
  }
));

/**
 * Client Password strategy
 *
 * The OAuth 2.0 client password authentication strategy authenticates clients
 * using a client ID and client secret. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
 */
passport.use(new ClientPasswordStrategy(
  function (clientId, clientSecret, done) {
    db.clients.findByClientId(clientId, function (err, client) {
      if (err) {
        return done(err);
      }
      if (!client) {
        return done(null, false);
      }
      if (client.clientSecret != clientSecret) {
        return done(null, false);
      }
      return done(null, client);
    });
  }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function (accessToken, done) {
    db.accessTokens.find(accessToken, function (err, token) {
      if (err) {
        return done(err);
      }
      if (!token) {
        return done(null, false);
      }
      if (new Date() > token.expirationDate) {
        db.accessTokens.delete(accessToken, function (err) {
          return done(err);
        });
      } else {
        if (token.userID !== null) {
          db.users.find(token.userID, function (err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              return done(null, false);
            }
            // to keep this example simple, restricted scopes are not implemented,
            // and this is just for illustrative purposes
            var info = {scope: '*'};
            return done(null, user, info);
          });
        } else {
          //The request came from a client only since userID is null
          //therefore the client is passed back instead of a user
          db.clients.find(token.clientID, function (err, client) {
            if (err) {
              return done(err);
            }
            if (!client) {
              return done(null, false);
            }
            // to keep this example simple, restricted scopes are not implemented,
            // and this is just for illustrative purposes
            var info = {scope: '*'};
            return done(null, client, info);
          });
        }
      }
    });
  }
));

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTPS request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  db.users.find(id, function (err, user) {
    done(err, user);
  });
});







// /**
// * Module dependencies.
// */
// import passport from 'passport'
// import {Strategy as LocalStrategy} from 'passport-local'
// import {BasicStrategy as BasicStrategy} from 'passport-http'
// import {Strategy as ClientPasswordStrategy} from 'passport-oauth2-client-password'
// import {Strategy as BearerStrategy} from 'passport-http-bearer'
// import db from './db'
// import bcrypt from 'bcrypt'
// import crypto from 'crypto'
//
//
// /**
// * LocalStrategy
// */
// var loginLocal = function(username, password, done) {
// 	let query = db.query(`
// 		SELECT u.id, u.username, u.password from rs.users u
// 		where lower(u.username) = lower($1);
// 	`, [username], function(err, results) {
// 		if (err) { done(err) }
// 		let row = results.rows[0]
// 		if(parseInt(results.rows.length) < 1) {
// 			return done(null, false, {message: 'E-mail não encontrado.'});
// 		} else {
// 			bcrypt.compare(password, row.password, function (err, res) {
// 				if (!res) return done(null, false, {message: 'Senha inválida'})
// 				return done(null, row)
// 			})
// 		}
// 	});
// }
// passport.use(new LocalStrategy(loginLocal))
//
// passport.serializeUser(function(user, done) {
//     done(null, user.username);
// })
//
// passport.deserializeUser(function(id, done) {
// 	let query = db.query(`
// 		SELECT u.id, u.username from rs.users u
// 		where u.username = $1;
// 	`, [id]);
//
// 	query.on('error', done);
// 	query.on('row', (row) => {
// 		if(Object.keys(row).length < 1) {
// 			done(null, false)
// 		} else {
// 			done(null, row)
// 		}
//     })
// })
//
//
// /**
//  * These strategies are used to authenticate registered OAuth clients.
//  * The authentication data may be delivered using the basic authentication scheme (recommended)
//  * or the client strategy, which means that the authentication data is in the body of the request.
//  */
// passport.use("clientBasic", new BasicStrategy(
//     function (clientId, clientSecret, done) {
// 		let countQuery = db.query(`
// 			SELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
// 			where oc.client_secret = $1 and oc.client_id = $2;
// 		`, [clientSecret, clientId], function (err, result) {
// 			let row = result.rows[0]
// 			if(Object.keys(row).length < 1) {
// 				return done(null, false)
// 			} else if (row.client_secret == clientSecret) {
// 				return done(null, row)
// 			}
// 			return done(null, false)
// 		})
// 		countQuery.on('error', done);
//     }
// ));
//
// passport.use("clientPassword", new ClientPasswordStrategy(
//     function (clientId, clientSecret, done) {
// 		let countQuery = db.query(`
// 			select oc.name, oc.client_id, oc.client_secret, oc.redirect_uri
// 			from rs.oauth_clients oc
// 			where oc.client_secret = $1 and oc.client_id = $2;
// 		`, [clientSecret, clientId], function (err ,result) {
// 			let row = result.rows[0]
// 			if(Object.keys(row).length < 1) {
// 				return done(null, false)
// 			} else if (row.client_secret == clientSecret) {
// 				return done(null, row)
// 			} else {
// 				return done(null, false)
// 			}
// 		})
// 		countQuery.on('error', done);
//     }
// ));
//
// /**
//  * This strategy is used to authenticate users based on an access token (aka a
//  * bearer token).
//  */
// passport.use("accessToken", new BearerStrategy(
//     function (accessToken, done) {
//         var accessTokenHash = crypto.createHash('sha1').update(accessToken).digest('hex')
// 		let tokenSearch = db.query(
// 			`select oa.access_token, oa.client_id, oa.user_id, oa.expires
// 			from rs.oauth_access_tokens oa
// 			where oa.access_token = $1;`,
// 			[accessTokenHash],
// 			function (err ,rToken) {
// 				if (err) return done(err)
// 				if(Object.keys(rToken.rows).length == 0)  return done(null, false)
// 				let user_id = rToken.rows[0].user_id
// 				let expires = rToken.rows[0].expires
// 				if (new Date() > expires) {
// 					let tokenRemove = db.query(
// 						`delete from rs.oauth_access_tokens oa where oa.access_token = $1`,
// 						[accessTokenHash],
// 						done
// 					)
// 				} else {
// 					let userSearch = db.query(`
// 						select u.id, u.username, u.password
// 						from rs.users as u
// 						where u.id = $1`,
// 						[user_id],
// 						function (err2, rUser) {
// 							if (err) return done(err)
// 							if (rUser.rows.length == 0) return done(null, false)
// 							// no use of scopes for no
// 							var info = { scope: '*' }
// 							delete rUser.rows[0].password
// 							done(null, rUser.rows[0], info)
// 						}
// 					)
// 				}
// 			}
// 		)
//     }
// ))
// export default loginLocal
