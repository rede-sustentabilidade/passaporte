'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

//import session from 'express-session'

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _expressValidator = require('express-validator');

var _expressValidator2 = _interopRequireDefault(_expressValidator);

var _serveStatic = require('serve-static');

var _serveStatic2 = _interopRequireDefault(_serveStatic);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _errorhandler = require('errorhandler');

var _errorhandler2 = _interopRequireDefault(_errorhandler);

var _connectFlash = require('connect-flash');

var _connectFlash2 = _interopRequireDefault(_connectFlash);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _auth = require("./auth");

var _auth2 = _interopRequireDefault(_auth);

var _oauth = require("./oauth");

var _oauth2 = _interopRequireDefault(_oauth);

var _registration = require("./registration");

var _registration2 = _interopRequireDefault(_registration);

// Express configuration
var app = (0, _express2['default'])();
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(_bodyParser2['default'].urlencoded({ extended: true }));
app.use((0, _expressValidator2['default'])());
app.use((0, _serveStatic2['default'])('public'));
app.use((0, _morgan2['default'])('dev'));
app.use((0, _cookieParser2['default'])('rede-sustentabilidade.org.br'));
//app.use(session({ secret: 'rede-sustentabilidade.org.br', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }))
app.use(_passport2['default'].initialize());
app.use(_passport2['default'].session());
app.use((0, _connectFlash2['default'])());
app.get('/client/registration', function (req, res) {
	res.render('clientRegistration');
});
app.post('/client/registration', _registration2['default'].registerClient);

app.get('/registration', function (req, res) {
	res.render('userRegistration');
});
app.post('/registration', _registration2['default'].registerUser);

app.get('/oauth/authorization', function (req, res) {
	res.render('login', {
		client_id: req.query.client_id,
		redirect_uri: req.query.redirect_uri,
		response_type: req.query.response_type,
		messages: req.flash('error')
	});
});

app.post('/oauth/authorization', _passport2['default'].authenticate('local', {
	failureFlash: true,
	failureRedirect: '/oauth/authorization'
}), function (req, res) {
	//It is not essential for the flow to redirect here,
	// it would also be possible to call this directly
	res.redirect('/authorization?response_type=' + req.body.response_type + '&client_id=' + req.body.client_id + '&redirect_uri=' + req.body.redirect_uri);
});

app.post('/oauth/token', _oauth2['default'].token);
app.get('/authorization', _oauth2['default'].authorization);
app.post('/decision', _oauth2['default'].decision);

app.get('/restricted', _passport2['default'].authenticate('accessToken', { session: false }), function (req, res) {
	res.send("Yay, you successfully accessed the restricted resource!");
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	// app.use(function(err, req, res, next) {
	// 	res.status(err.status || 500);
	// 	res.render('error', {
	// 		message: err.message,
	// 		error: err
	// 	})
	// })
	app.locals.url_site = 'http://herokuwp.local';
	app.use((0, _errorhandler2['default'])());
}
// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

exports['default'] = app;
module.exports = exports['default'];