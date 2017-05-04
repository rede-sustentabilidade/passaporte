/*jslint node: true */
/*global exports */
'use strict';

//TODO Document all of this

var passport = require('passport');
var login = require('connect-ensure-login');
import flash from 'connect-flash'

exports.index = function (req, res) {
  res.redirect(req.app.locals.url_site)
};

exports.loginForm = function (req, res) {
  res.render('login', {
    messages: flash('error'),
    sess: req.session.query
  });
};

exports.login = [
  passport.authenticate('local', {successReturnToOrRedirect: '/', failureRedirect: '/login', failureFlash: true})
];

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/');
};

exports.account = [
  login.ensureLoggedIn(),
  function (req, res) {
    res.render('account', {user: req.user});
  }
];
