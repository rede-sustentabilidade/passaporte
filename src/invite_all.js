import Sequelize from 'sequelize'
import bcrypt from 'bcrypt'
import mailer from './mailer'
import async from 'async'
// ES6 introduces "classes". For people familiar with
// object oriented languages such as Java as C++ this
// is nothing out of the ordinary.
class InviteAll {
	// The constructor will be executed if you initiate a
	// "Rectangle" object with
	//
	//   new Rectangle(width, height)
	//
	constructor() {
		let wp_uri = process.env.DATABASE_SITE_URL || 'mysql://root@127.0.0.1:/rs_dev',
			pass_uri = process.env.DATABASE_URL || 'postgres://postgres@/rs-api'
		this.dbWordpress = new Sequelize(wp_uri);
		this.dbPassport = new Sequelize(pass_uri);

		this.loadModels();
		this.readNotInvitedUsers();
	}

	loadModels() {
		this.userWordpress = this.dbWordpress.define('wp_users', {
			id: {
				type: Sequelize.INTEGER,
				field: 'ID',
				primaryKey: true
			},
			email: {
				type: Sequelize.STRING,
				field: 'user_email'
			}
		}, {
			timestamps: false,
			freezeTableName: true
		});

		this.userPassport = this.dbPassport.define('users', {
			id: {
				type: Sequelize.INTEGER,
				field: 'id',
				primaryKey: true
			},
			email: {
				type: Sequelize.STRING,
				field: 'username'
			},
			password: {
				type: Sequelize.STRING,
				field: 'password'
			},
		}, {
			schema: 'rs',
			timestamps: false,
			freezeTableName: true // Model tableName will be the same as the model name
		});
	}

	readNotInvitedUsers() {
		let that = this
		this.userWordpress
			.findAndCountAll({
				where: {
					email: {
						$notIn: ['ale@city10.com.br','alejacomin@hotmail.com','amaurysoares@hotmail.com','berthacf14@gmail.com','informebe@gmail.com','itamarcustodioferreira@gmail.com','nadiacasmoura@bol.com.br','orlandogs2005@gmail.com','paricarana1991@gmail.com','reginaldobacci@reginaldobacci.adv.br','sdpmcosta@bol.com.br','ver.russinho@yahoo.com.br','yuri.carvalhogomes@gmail.com']
					}
				}
			})
			.then(function(result) {
				console.log(result.count + ' usuários encontrados')
				async.eachSeries(result.rows, function(i, done) {
					that.saveNewUser(i, done)
				})
			});
	}

	saveNewUser(row, done) {
		let that = this,
			user_id = row.id,
			email = row.email,
			password = Math.random().toString(36).slice(-8)
		bcrypt.genSalt(10, function (saltError, salt) {
			bcrypt.hash(password, salt, function (hashError, hash) {
				that.userPassport
					.findOrCreate({where: {email: email}, defaults: {id: user_id, password: hash}})
					.spread(function(user, created) {
						if (created) {
							console.log(`A senha do ${email} é: ${password} ${hash}`)
						}
						done(null, created)
					})
				// let m = new mailer()
				// m.send (email, 'Informações do cadastro',
// `Você iniciou o cadastro no site da Rede Sustentabilidade.


// Agora você pode acessar o site da rede e autenticar-se
// ${req.app.locals.url_site}/?login=1
// `
				// )
			})
		})
	}
}

let i = new InviteAll()

