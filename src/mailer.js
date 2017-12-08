import nodemailer from 'nodemailer'
import sesTransport from 'nodemailer-ses-transport'
class Mailer {
	constructor () {
		this.mail_key = process.env['MAIL_KEY']
		this.mail_secret    = process.env['MAIL_SECRET']
		this.validate = false

		this.transporter = nodemailer.createTransport(sesTransport({
			accessKeyId: this.mail_key,
			secretAccessKey: this.mail_secret,
			rateLimit: 5
		}), {
			// default values for sendMail method
			from: 'Rede Sustentabilidade <nao-responda@redesustentabilidade.org.br>',
			replyTo: 'contato@redesustentabilidade.org.br'
		})
	}

	setTransporter (transporter) {
		this.transporter = transporter
	}

	isConfigEmpty () {
		if (!this.mail_service || !this.mail_user || !this.mail_pass) {
			return false
		}
		return true
	}

	send (to, subject, content, done) {
		let that = this
		return this.transporter.sendMail({
			to: to,
			subject: subject,
			text: content
		}, function (err, info) {
			if (err) {
				console.error('Error:'+ JSON.stringify(err));
				return done('Não foi possível enviar o email de teste.', null)
			} else {
				that.validate = true
				console.log('Info:'+ JSON.stringify(info));
				return done(null, info)
			}
		});

	}

	testSend (done) {
		return this.send('lucaspirola@gmail.com', 'hello', 'hello world!', done)
	}
}

export default Mailer
