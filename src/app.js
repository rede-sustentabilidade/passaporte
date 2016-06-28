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
import auth from './auth'
//import oauth from './oauth'
import oauth2 from './oauth2'
import user from './user'
import client from './client'
import site from './site'
import token from './token'

import registration from './registration'
import redis from './redis'
import cors from 'cors'
import jwt from 'jsonwebtoken'

// Express configuration
var app = express()
app.set('views', __dirname + '/../views')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(serveStatic('public'))
app.use(morgan('combined'))
app.use(cors());

// Config Redis to support session store
var RedisStore = require('connect-redis')(session);
var rs = new RedisStore({ client: redis, maxAge: 24 * 60 * 60 * 1000 });


// Config Session
app.use(cookieParser('rede-sustentabilidade.org.br'))
app.use(session({ store: rs, secret: 'rede-sustentabilidade.org.br', cookie: { maxAge: 60000*60*24*7 } }))
app.use(bodyParser.json());
app.use(passport.initialize())
app.use(passport.session())
app.use(flash());

// Config Routes
app.get('/client/registration', function(req, res) { res.render('clientRegistration') })
app.post('/client/registration', registration.registerClient)

app.get('/registration', function(req, res) { res.render('userRegistration') })
app.post('/registration', registration.registerUser)

app.get('/lost_password', function(req, res) { res.render('userLostPassword') })
app.post('/lost_password', registration.userLostPassword)

app.get('/change_password', function(req, res) { res.render('userChangePassword') })
app.post('/change_password', registration.userChangePassword)


app.get('/', site.index);
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);

app.get('/dialog/authorize', oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);
app.post('/oauth/token', oauth2.token);

app.get('/api/userinfo', user.info);
app.get('/api/clientinfo', client.info);

// Mimicking google's token info endpoint from
// https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
app.get('/api/tokeninfo', token.info);


// app.get('/oauth/authorization', function(req, res) {
// 	if (!req.body.client_id || !req.body.response_type || !req.body.redirect_uri) {
// 		let countQuery = db.query(`
// 			SELECT oc.name, oc.client_id, oc.client_secret, oc.redirect_uri from rs.oauth_clients oc
// 			limit 1
// 		`);
//     console.log(countQuery);
//
// 		countQuery.on('row', (row) => {
// 			if(Object.keys(row).length < 1) {
// 				res.send('Client ID not found.').status(404)
// 			} else {
// 				res.render('login', {
// 					client_id : row.client_id,
// 					redirect_uri: row.redirect_uri,
// 					response_type: 'code',
// 					messages: req.flash('error')
// 				})
// 			}
// 		})
// 	} else {
// 		res.render('login', {
// 			client_id : req.query.client_id,
// 			redirect_uri: req.query.redirect_uri,
// 			response_type: req.query.response_type,
// 			messages: req.flash('error')
// 		})
// 	}
// })
//
// app.post('/oauth/authorization', passport.authenticate('local', {
// 		failureFlash: true,
// 		failureRedirect: '/oauth/authorization'
// 	}), function(req, res) {
// 		//It is not essential for the flow to redirect here,
// 		// it would also be possible to call this directly
// 		res.redirect('/authorization?response_type=' + req.body.response_type +
// 					 '&client_id=' + req.body.client_id +
// 					 '&redirect_uri=' + req.body.redirect_uri)
// })
//
// app.post('/oauth/token', oauth.token)
// app.get('/authorization', oauth.authorization)
// app.post('/decision', oauth.decision)
//
// app.get('/user', passport.authenticate('accessToken', { session: false }), function (req, res) {
//     res.json(req.user)
// })
//
// app.get('/jwt', passport.authenticate('accessToken', { session: false }), function (req, res) {
// 		var token = jwt.sign({ user_id: req.user.id, role: 'admin' }, 'gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr9C');
//     res.json({token})
// })

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(errorHandler())
}

app.locals.url_site = process.env['DEFAULT_WEBSITE_URL'] || 'http://rede.site'
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
