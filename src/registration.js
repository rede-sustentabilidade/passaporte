import db from './db-psql'
import db2 from './db-psql'
import utils from "./utils"
import bcrypt from 'bcrypt'
import mailer from './mailer'
import loginLocal from './auth'

exports.userChangePassword = function(req, res) {
	req.checkBody('username',            'E-mail inválido').notEmpty().isEmail()
	req.checkBody('current_password',    'O campo senha atual é obrigatório').notEmpty()
	req.checkBody('new_password',        'O senha deve conter ao menos 6 caracteres').notEmpty().len(6, 50);
	req.checkBody('repeat_new_password', 'O campo repetir senha é obrigatório').notEmpty()

	let username            = req.body['username'],
		current_password    = req.body['current_password'],
		new_password        = req.body['new_password'],
		repeat_new_password = req.body['repeat_new_password'],
		errors = req.validationErrors()
	if (errors) {
		let err = []
		errors.forEach(function(v) {
			err.push({ message: v.msg, message_type: "error"});
		})
		res.render('userChangePassword', err[0])
	} else if (new_password !== repeat_new_password) {
		res.render('userChangePassword', { "message": 'A nova senha e o repetir senha não conferem', "message_type": "error"});
	}	else {
		loginLocal(username, current_password, function(err, results, msg) {
			if (!results) {
				res.render('userChangePassword', {"message":msg.message, "message_type":"error"})
			} else {
				let row = results
				bcrypt.genSalt(10, (saltError, salt) => {
					bcrypt.hash(new_password, salt, (hashError, hash) => {
						db.query(`
						UPDATE rs.users set password = $1 where id = $2;
						`, [hash, row.id], (err, results) => {
							if (err) return res.render('userChangePassword', {message:err})
							res.render('userChangePassword',
								{message:"Senha alterado com sucesso, para o email: "
								+ row.username, message_type:"success"})
							})
					});
				});
			}
		});
	}
}

exports.userLostPassword = function(req, res) {
	req.checkBody('email', 'E-mail inválido').notEmpty().isEmail()

	var errors = req.validationErrors()
	if (errors) {
		res.render('userLostPassword', {message:errors})
	} else {
		let email = req.body['email'],
			countQuery = db.query(`
				SELECT u.id, u.username from rs.users u
				where lower(u.username) = lower($1);
			`, [email]);

		countQuery.on('row', (row) => {
			if(Object.keys(row).length > 0) {
				let password = Math.random().toString(36).slice(-8)
				bcrypt.genSalt(10, (saltError, salt) => {
					bcrypt.hash(password, salt, (hashError, hash) => {
						db.query(`
						UPDATE rs.users set password = $1 where id = $2;
						`, [hash, row.id], (err, results) => {
							if (err) return res.render('userLostPassword', {message:err})

							let m = new mailer()
							m.send (email, 'Requisição de nova senha',
`Seu pedido de resgate de senha foi finalizado.

A nova senha do seu login é: ${password}

Agora você pode acessar o site da rede e autenticar-se
${req.app.locals.url_site}/?login=1
`, function () {
								res.render('userLostPassword',
									{message:"Cadastro realizado com sucesso, instruções foram enviadas para o email: "
									+ email, message_type:"success"})
								})
							})
					});
				});
			}
		});
	}
}

exports.registerUser = function(req, res) {
	req.checkBody('email', 'E-mail inválido').notEmpty().isEmail()

	var errors = req.validationErrors()
	if (errors) {
		res.format({
			html: () => {
				res.render('userRegistration', {message:errors})
			},
			json: () => {
				res.json({message:errors, error: true});
			}
		});
	} else {
		let email = req.body['email'],
			countQuery = db.query(`
				SELECT count(1) from rs.users u
				where lower(u.username) = lower($1);
			`, [email]);

		countQuery.on('row', (row) => {
			let passaporte = false;
			if(parseInt(row.count) > 0) {
				passaporte = true;
				let countQueryAfiliado = db2.query(`
					SELECT count(1) from rs.afiliados u
					where lower(u.email) = lower($1);
				`, [email]);

				countQueryAfiliado.on('row', (rowAfiliado) => {
					let afiliado = false;
					if(parseInt(rowAfiliado.count) > 0) {
						afiliado = true;
					}
					getUserId(email, function(idUser) {
						res.format({
							html: () => {
								res.render('userRegistration', {message:"E-mail já cadastrado."})
							},
							json: () => {
								res.json({passaporte: passaporte, afiliado: afiliado, idUser: idUser});
							}
						});
					});
				});
				
				
			} else {
				let password = Math.random().toString(36).slice(-8)
				bcrypt.genSalt(10, (saltError, salt) => {
					bcrypt.hash(password, salt, (hashError, hash) => {
						db.query(`
						INSERT INTO rs.users(username, password) VALUES ($1, $2)
						`, [email, hash], (err, results) => {
							if (err) return res.render('userRegistration', {message:err})

							let m = new mailer()
							m.send (email, 'Informações do cadastro',
`Olá, agora você é um conectad@ à rede.

Para dar prosseguimento à sua filiação, favor fazer contato com a coordenação de organização de seu estado pelo telefone que está disponível em www.redesustentabilidade.org.br/contatos-regionais

Atenciosamente
Comissão Executiva Nacional
Rede Sustentabilidade

A senha do seu login é: ${password}

Agora você pode acessar o site da rede e autenticar-se
${req.app.locals.url_site}/?login=1
`, function () {
								
									getUserId(email, function(idUser) {
										res.format({
											html: () => {
												res.render('userRegistration', {
													message:"Cadastro realizado com sucesso, instruções foram enviadas para o email: "
													+ email, message_type:"success"
												})
											},										
											json: () => {
												res.json({
													passaporte: false, 
													afiliado: false,
													idUser: idUser
												})
											}
										});
									});
								
								})
							})
					});
				});
			}
		});

		// get user_id 
		function getUserId(email, callback) {
			let idQuery = db.query(`
				SELECT u.id from rs.users u
				where lower(u.username) = lower($1);
			`, [email]);

			idQuery.on('row', (row) => {
				callback(row.id);
			});
		}


	}
}

exports.registerClient = function(req, res) {
	req.checkBody('name', 'Nome inválido').notEmpty().len(3, 40)
	req.checkBody('redirect_uri', 'URL inválida').isURL()

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
				res.send("E-mail já foi utilizado").status(422)
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
