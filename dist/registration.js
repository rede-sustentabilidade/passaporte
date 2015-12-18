'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _mailer = require('./mailer');

var _mailer2 = _interopRequireDefault(_mailer);

exports.registerUser = function (req, res) {
	req.checkBody('email', 'E-mail inválido').notEmpty().isEmail();

	var errors = req.validationErrors();
	if (errors) {
		res.render('userRegistration', { message: errors });
	} else {
		(function () {
			var email = req.body['email'],
			    countQuery = _db2['default'].query('\n\t\t\t\tSELECT count(1) from rs.users u\n\t\t\t\twhere lower(u.username) = lower($1);\n\t\t\t', [email]);

			countQuery.on('row', function (row) {
				if (parseInt(row.count) > 0) {
					res.render('userRegistration', { message: "E-mail já cadastrado." });
				} else {
					(function () {
						var password = Math.random().toString(36).slice(-8);
						_bcrypt2['default'].genSalt(10, function (saltError, salt) {
							_bcrypt2['default'].hash(password, salt, function (hashError, hash) {
								_db2['default'].query('\n\t\t\t\t\t\tINSERT INTO rs.users(username, password) VALUES ($1, $2)\n\t\t\t\t\t\t', [email, hash], function (err, results) {
									if (err) return res.render('userRegistration', { message: err });

									var m = new _mailer2['default']();
									m.send(email, 'Informações do cadastro', 'Você iniciou o cadastro no site da Rede Sustentabilidade.\n\nA senha do seu login é: ' + password + '\n\nAgora você pode acessar o site da rede e autenticar-se\nhttps://redesustentabilidade.org.br/oauth/authorization\n', function () {
										res.render('userRegistration', { message: "Cadastro realizado com sucesso, instruções foram enviadas para o email: " + email, message_type: "success" });
									});
								});
							});
						});
					})();
				}
			});
		})();
	}
};

exports.registerClient = function (req, res) {
	req.checkBody('name', 'Nome inválido').notEmpty().len(3, 40);
	req.checkBody('redirect_uri', 'URL inválida').isURL();

	var errors = req.validationErrors();
	if (errors) {
		res.send(errors).status(400);
	} else {
		(function () {
			var name = req.body['name'],
			    redirect_uri = req.body['redirect_uri'],
			    client_id = _utils2['default'].uid(8),
			    client_secret = _utils2['default'].uid(20),
			    countQuery = _db2['default'].query('\n\t\t\t\tSELECT count(1) from rs.oauth_clients oc\n\t\t\t\twhere lower(oc.name) = lower($1);\n\t\t\t', [name]);

			countQuery.on('row', function (row) {
				if (parseInt(row.count) > 0) {
					res.send("E-mail já foi utilizado").status(422);
				} else {
					_db2['default'].query('\n\t\t\t\tINSERT INTO rs.oauth_clients(name, client_id, client_secret, redirect_uri) VALUES ($1, $2, $3, $4)\n\t\t\t\t', [name, client_id, client_secret, redirect_uri], function (err, results) {
						if (err) return res.send(err).status(500);
						res.status(201).send({ name: name, client_id: client_id, client_secret: client_secret });
					});
				}
			});
		})();
	}
};