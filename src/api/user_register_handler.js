// this module handles with user registration
import Joi from 'joi';
import Boom from 'boom';
import dbClient from '../utils/db';
import bcrypt from 'bcrypt';

let userRegisterHandler = () => {
    // request basics validations
    let httpValidation = {
        payload: {
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required()
        }
    },

    // request handler
    httpHandler = (request, reply) => {
        let email = request.payload.email,
            password = request.payload.password,
            countQuery = dbClient.query(`
                SELECT count(1) from rs.users u
                where lower(u.username) = lower($1);
            `, [email]);

        countQuery.on('row', (row) => {
            if(parseInt(row.count) > 0) {
                return reply(Boom.badRequest('already in use'));
            } else {
                bcrypt.genSalt(10, (saltError, salt) => {
                    bcrypt.hash(password, salt, (hashError, hash) => {
                        dbClient.query(`
                        INSERT INTO rs.users(username, password) VALUES ($1, $2)
                    `, [email, hash]);
                    });
                });

                return reply(row);
            }
        });
    },

    // hapi route register
    register = (server, options, next) => {
        server.route({
            method: 'POST',
            path: '/sign_up',
            config: {
                validate: httpValidation,
                handler: httpHandler
            }
        });
        return next();
    };

    register.attributes = {
        name: 'api'
    };

    return register;
}();

export default userRegisterHandler;
