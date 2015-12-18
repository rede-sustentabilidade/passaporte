'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _nodemailer = require('nodemailer');

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _nodemailerSesTransport = require('nodemailer-ses-transport');

var _nodemailerSesTransport2 = _interopRequireDefault(_nodemailerSesTransport);

var Mailer = (function () {
	function Mailer() {
		_classCallCheck(this, Mailer);

		this.mail_key = process.env['MAIL_KEY'];
		this.mail_secret = process.env['MAIL_SECRET'];
		this.validate = false;

		this.transporter = _nodemailer2['default'].createTransport((0, _nodemailerSesTransport2['default'])({
			accessKeyId: this.mail_key,
			secretAccessKey: this.mail_secret,
			rateLimit: 5
		}, {
			// default values for sendMail method
			from: 'Rede Sustentabilidade <nao-responda@redesustentabilidade.org.br>',
			replyTo: 'sistema@redesustentabilidade.org.br'
		}));
	}

	_createClass(Mailer, [{
		key: 'setTransporter',
		value: function setTransporter(transporter) {
			this.transporter = transporter;
		}
	}, {
		key: 'isConfigEmpty',
		value: function isConfigEmpty() {
			if (!this.mail_service || !this.mail_user || !this.mail_pass) {
				return false;
			}
			return true;
		}
	}, {
		key: 'send',
		value: function send(to, subject, content, done) {
			var that = this;
			return this.transporter.sendMail({
				to: to,
				subject: subject,
				text: content
			}, function (err, info) {
				if (err) {
					return done('Não foi possível enviar o email de teste.', null);
				} else {
					that.validate = true;
					return done(null, info.response.toString());
				}
			});
		}
	}, {
		key: 'testSend',
		value: function testSend(done) {
			return this.send('lucaspirola@gmail.com', 'hello', 'hello world!', done);
		}
	}]);

	return Mailer;
})();

exports['default'] = Mailer;
module.exports = exports['default'];