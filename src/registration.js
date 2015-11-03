var db = require('./db')
    , utils = require("./utils")
    , bcrypt = require('bcrypt')

exports.registerUser = function(req, res) {
    req.checkBody('username', 'No valid username is given').notEmpty().len(3, 40)
    req.checkBody('password', 'No valid password is given').notEmpty().len(6, 50)

	var errors = req.validationErrors()
    if (errors) {
        res.status(400).send(errors)
    } else {
        let username = req.body['username'],
        	password = req.body['password'],
			countQuery = db.query(`
                SELECT count(1) from rs.users u
                where lower(u.username) = lower($1);
            `, [username]);

        countQuery.on('row', (row) => {
            if(parseInt(row.count) > 0) {
                res.send("Username is already taken").status(422)
            } else {
			console.log(row)
                bcrypt.genSalt(10, (saltError, salt) => {
                    bcrypt.hash(password, salt, (hashError, hash) => {
                        db.query(`
						INSERT INTO rs.users(username, password) VALUES ($1, $2)
                    	`, [username, hash]);
                		res.status(201).send({username: username})
                    });
                });
            }
        });
    }
}

exports.registerClient = function(req, res) {
    req.checkBody('name', 'No valid name is given').notEmpty().len(3, 40)

    var errors = req.validationErrors()
    if (errors) {
        res.send(errors).status(400)
    } else {
        var name = req.body['name']
        var clientId = utils.uid(8)
        var clientSecret = utils.uid(20)

        db.collection('clients').findOne({name: name}, function (err, client) {
            if(client) {
                res.send("Name is already taken").status(422)
            } else {
                db.collection('clients').save({name: name, clientId: clientId, clientSecret: clientSecret}, function (err) {
                    res.send({name: name, clientId: clientId, clientSecret: clientSecret}).status(201)
                })
            }
        })
    }
}