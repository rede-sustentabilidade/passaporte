import express from 'express'
import passport from 'passport'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import expressValidator from 'express-validator'
import serveStatic from 'serve-static'
import morgan from 'morgan'
import errorHandler from 'errorhandler'
import flash from 'connect-flash'
import util from 'util'
import auth from "./auth"
import oauth from "./oauth"
import registration from "./registration"

// Express configuration
var app = express()
app.set('views', __dirname + '/../views')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(serveStatic('public'))
app.use(morgan('dev'))
app.use(cookieParser('rede-sustentabilidade.org.br'))
app.use(session({ secret: 'rede-sustentabilidade.org.br', cookie: { maxAge: 60000*60*24*7 }, resave: true, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash());
app.get('/client/registration', function(req, res) { res.render('clientRegistration') })
app.post('/client/registration', registration.registerClient)

app.get('/registration', function(req, res) { res.render('userRegistration') })
app.post('/registration', registration.registerUser)

app.get('/oauth/authorization', function(req, res) {
	res.render('login', {
		client_id : req.query.client_id,
		redirect_uri: req.query.redirect_uri,
		response_type: req.query.response_type,
		messages: req.flash('error')
	})
})

app.post('/oauth/authorization', passport.authenticate('local', {
		failureFlash: true,
		failureRedirect: '/oauth/authorization'
	}), function(req, res) {
		//It is not essential for the flow to redirect here,
		// it would also be possible to call this directly
		res.redirect('/authorization?response_type=' + req.body.response_type +
					 '&client_id=' + req.body.client_id +
					 '&redirect_uri=' + req.body.redirect_uri)
})

app.post('/oauth/token', oauth.token)
app.get('/authorization', oauth.authorization)
app.post('/decision', oauth.decision)

app.get('/user', passport.authenticate('accessToken', { session: false }), function (req, res) {
    res.json(req.user)
})

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
	app.locals.url_site = 'http://herokuwp.local'
	app.use(errorHandler())
}
// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	})
})

export default app