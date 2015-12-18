var express = require('express')
    , passport = require('passport')
    , session = require('express-session')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , expressValidator = require('express-validator')
	, serveStatic = require('serve-static')
	, morgan = require('morgan')
	, cookieParser = require('cookie-parser')
	, errorHandler = require('errorhandler')
	, flash = require('connect-flash')
    , util = require('util')
    , auth = require("./auth")
    , oauth = require("./oauth")
    , registration = require("./registration")

// Express configuration
var app = express()
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(serveStatic('public'))
app.use(morgan('dev'))
app.use(cookieParser('rede-sustentabilidade.org.br'))
app.use(session({ secret: 'rede-sustentabilidade.org.br', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }))
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
console.log(req, res)
		res.redirect('/oauth/authorization?response_type=' + req.body.response_type +
					 '&client_id=' + req.body.client_id +
					 '&redirect_uri=' + req.body.redirect_uri)
})

app.post('/oauth/token', oauth.token)
app.get('/authorization', oauth.authorization)
app.post('/decision', oauth.decision)

app.get('/restricted', passport.authenticate('accessToken', { session: false }), function (req, res) {
    res.send("Yay, you successfully accessed the restricted resource!")
})

// error handling middleware should be loaded after the loading the routes
if ('development' == app.get('env')) {
	app.locals.url_site = 'http://herokuwp.local'
	app.use(errorHandler())
}

app.set('port', process.env.PORT || 3000);
//Start
app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
