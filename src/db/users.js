/*jslint node: true */
'use strict';
import db from '../db-psql'

/**
 * This is the configuration of the users that are allowed to connected to your authorization server.
 * These represent users of different client applications that can connect to the authorization server.
 * At a minimum you need the required properties of
 *
 * id: (A unique numeric id of your user )
 * username: (The user name of the user)
 * password: (The password of your user)
 * name: (The name of your user)
 */
var users = [
  {
    id: '1',
    username: 'bob@gmail.com',
    password: 'secret',
    name: 'Bob Smith'
  },
  {
    id: '2',
    username: 'joe',
    password: 'password',
    name: 'Joe Davis'
  }
];

/**
 * Returns a user if it finds one, otherwise returns
 * null if a user is not found.
 * @param id The unique id of the user to find
 * @param done The function to call next
 * @returns The user if found, otherwise returns null
 */
exports.find = function (id, done) {
	let query = db.query(`
		SELECT u.id, u.username, u.password from rs.users u
		where u.id = $1;
	`, [id], function(err, results) {
		if (err) { done(err) }
		if(parseInt(results.rows.length) < 1) {
			return done(null, null, {message: 'ID não encontrado.'});
		} else {
		  let row = results.rows[0]
			return done(null, row)
		}
	});

  // for (var i = 0, len = users.length; i < len; i++) {
  //   var user = users[i];
  //   if (user.id === id) {
  //     return done(null, user);
  //   }
  // }
  // return done(null, null);
};

/**
 * Returns a user if it finds one, otherwise returns
 * null if a user is not found.
 * @param username The unique user name to find
 * @param done The function to call next
 * @returns The user if found, otherwise returns null
 */
exports.findByUsername = function (username, done) {
  let query = db.query(`
    SELECT u.id, u.username, u.password from rs.users u
    where lower(u.username) = lower($1);
  `, [username], function(err, results) {
    if (err) { done(err) }
    if(parseInt(results.rows.length) < 1) {
      return done(null, null, {message: 'E-mail não encontrado.'})
    } else {
      let row = results.rows[0]
      return done(null, row);
    }
  });

  // for (var i = 0, len = users.length; i < len; i++) {
  //   var user = users[i];
  //   if (user.username === username) {
  //     return done(null, user);
  //   }
  // }
  // return done(null, null);
};
