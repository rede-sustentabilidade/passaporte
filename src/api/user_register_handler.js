// this module handles with user registration
import Joi from 'joi';
import Boom from 'boom';
import dbClient from '../utils/db';

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
        let queryParameters = [request.params.email],
            totalUsersWithEmail = 0,
            countQuery = dbClient.query(`
                SELECT count(1) from rs.users u
                where lower(u.username) = lower($1);
            `, queryParameters);

        countQuery.on('row', (row) => {
            totalUsersWithEmail = row;
        });

        if(totalUsersWithEmail > 0) {
            return reply(Boom.badRequest('already in use'));
        }

        return reply({
            total: totalUsersWithEmail
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
