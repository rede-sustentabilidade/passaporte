var db = require('./db')
	, utils = require("./utils")
	, bcrypt = require('bcrypt')

exports.registerUser = function(req, res) {
	req.checkBody('email', 'E-mail inválido').notEmpty().isEmail()

	var errors = req.validationErrors()
	if (errors) {
		res.render('userRegistration', {message:errors})
	} else {
		let email = req.body['email'],
			countQuery = db.query(`
				SELECT count(1) from rs.users u
				where lower(u.username) = lower($1);
			`, [email]);

		countQuery.on('row', (row) => {
			if(parseInt(row.count) > 0) {
				res.render('userRegistration', {message:"E-mail já cadastrado."})
			} else {
				let password = Math.random().toString(36).slice(-8)
				bcrypt.genSalt(10, (saltError, salt) => {
					bcrypt.hash(password, salt, (hashError, hash) => {
						db.query(`
						INSERT INTO rs.users(username, password) VALUES ($1, $2)
						`, [email, hash], (err, results) => {
							if (err) return res.render('userRegistration', {message:err})
							res.render('userRegistration', {message:"Cadastro realizado com sucesso, instruções foram enviadas para o email: " + email, message_type:"success"})
						})
					});
				});
			}
		});
	}
}

exports.registerClient = function(req, res) {
	req.checkBody('name', 'No valid name is given').notEmpty().len(3, 40)
	req.checkBody('redirect_uri', 'Invalid url').isURL()

	var errors = req.validationErrors()
	if (errors) {
		res.send(errors).status(400)
	} else {
		let name = req.body['name'],
			redirect_uri = req.body['redirect_uri'],
			client_id = utils.uid(8),
			client_secret = utils.uid(20),
			countQuery = db.query(`
				SELECT count(1) from rs.oauth_clients oc
				where lower(oc.name) = lower($1);
			`, [name]);

		countQuery.on('row', (row) => {
			if(parseInt(row.count) > 0) {
				res.send("Name is already taken").status(422)
			} else {
				db.query(`
				INSERT INTO rs.oauth_clients(name, client_id, client_secret, redirect_uri) VALUES ($1, $2, $3, $4)
				`, [name, client_id, client_secret, redirect_uri], (err, results) => {
					if (err) return res.send(err).status(500)
					res.status(201).send({name: name, client_id: client_id, client_secret: client_secret})
				});
			}
		});
	}
}