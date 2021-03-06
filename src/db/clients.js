/*jslint node: true */
'use strict';
import db from '../db-psql'

/**
 * This is the configuration of the clients that are allowed to connected to your authorization server.
 * These represent client applications that can connect.  At a minimum you need the required properties of
 *
 * id: (A unique numeric id of your client application )
 * name: (The name of your client application)
 * clientId: (A unique id of your client application)
 * clientSecret: (A unique password(ish) secret that is _best not_ shared with anyone but your client
 *     application and the authorization server.
 *
 * Optionally you can set these properties which are
 * trustedClient: (default if missing is false.  If this is set to true then the client is regarded as a
 *     trusted client and not a 3rd party application.  That means that the user will not be presented with
 *     a decision dialog with the trusted application and that the trusted application gets full scope access
 *     without the user having to make a decision to allow or disallow the scope access.
 */
var clients = [
  {
    id: '1',
    name: 'Samplr',
    clientId: 'abc123',
    clientSecret: 'ssh-secret'
  },
  {
    id: '2',
    name: 'Samplr2',
    clientId: 'xyz123',
    clientSecret: 'ssh-password'
  },
  {
    id: '3',
    name: 'Samplr3',
    clientId: 'LiwFKQ0b',
    clientSecret: 'vEdVSdklM6Y1Vo5HFWkz',
    trustedClient: true
  }
];

/**
 * Returns a client if it finds one, otherwise returns
 * null if a client is not found.
 * @param id The unique id of the client to find
 * @param done The function to call next
 * @returns The client if found, otherwise returns null
 */
exports.find = function (id, done) {
  let countQuery = db.query(`
    SELECT oc.id, oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
    where oc.id = $1;
  `, [id], function(err, results) {
    if (err) done(err)
    if(results.rows.length < 0) {
      // res.send("Client ID not found.").status(404)
      done(null, null)
    } else {
      let row = results.rows[0]
      done(null, row)
    }
  })
  countQuery.on('error', done);
  // for (var i = 0, len = clients.length; i < len; i++) {
  //   var client = clients[i];
  //   if (client.id === id) {
  //     return done(null, client);
  //   }
  // }
  // return done(null, null);
};

/**
 * Returns a client if it finds one, otherwise returns
 * null if a client is not found.
 * @param clientId The unique client id of the client to find
 * @param done The function to call next
 * @returns The client if found, otherwise returns null
 */
exports.findByClientId = function (clientId, done) {
  let countQuery = db.query(`
    SELECT oc.id, oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
    where oc.client_id = $1;
  `, [clientId], function(err, results) {
    if (err) done(err)
    if(results.rows.length < 0) {
      // res.send("Client ID not found.").status(404)
      done(null, null)
    } else {
      let row = results.rows[0]
      done(null, row)
    }
  })
  countQuery.on('error', done);
  // for (var i = 0, len = clients.length; i < len; i++) {
  //   var client = clients[i];
  //   if (client.clientId === clientId) {
  //     return done(null, client);
  //   }
  // }
  // return done(null, null);
};
