import express from 'express'
import passport from 'passport'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import expressValidator from 'express-validator'
import serveStatic from 'serve-static'
import morgan from 'morgan'
import errorHandler from 'errorhandler'
import raven from 'raven'
import flash from 'connect-flash'

import util from './utils'
import auth from './auth'
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
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(errorHandler())
  app.use(morgan('combined'))
} else {
  // The request handler must be the first item
  app.use(raven.middleware.express.requestHandler(process.env.SENTRY_DSN));
  console.log('error log request handler sentry')
}

app.set('views', __dirname + '/../views')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(serveStatic('public'))

const corsOptions = {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    "credentials": true,
    "origin": [/redesustentabilidade.org.br$/, /redesustentabilidade.net$/, /localhost\.dev:3000$/]
};

app.use(cors(corsOptions));

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
app.locals.url_site = process.env['DEFAULT_WEBSITE_URL'] || 'http://rede.site'

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

if (app.get('env') === 'production') {
  console.log('error log error handler sentry')
  // The error handler must be before any other error middleware
  app.use(raven.middleware.express.errorHandler(process.env.SENTRY_DSN));
}

app.options('*', cors(corsOptions));

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
