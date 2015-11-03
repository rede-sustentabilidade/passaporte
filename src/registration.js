var db = require('./db').db()
    , utils = require("./utils")
    , bcrypt = require('bcrypt')

exports.registerUser = function(req, res) {
    req.checkBody('username', 'No valid username is given').notEmpty().len(3, 40)
    req.checkBody('password', 'No valid password is given').notEmpty().len(6, 50)

	var errors = req.validationErrors()
    if (errors) {
        res.status(400).send(errors)
    } else {
        var username = req.body['username']
        var password = req.body['password']

        db.collection('users').findOne({username: username}, function (err, user) {
            if(user) {
                res.send("Username is already taken").status(422)
            } else {
                bcrypt.hash(password, 11, function (err, hash) {
                    db.collection('users').save({username: username, password: hash}, function (err) {
                        res.status(201).send({username: username})
                    })
                })
            }
        })
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