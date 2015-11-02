/**
 * this module handles with user registration
 */

import Joi from 'joi';

let userRegisterHandler = () => {
    /**
     * request basics validations
     */
    let httpValidation = {
        params: {
            name: Joi.string().max(10).min(2).alphanum()
        }
    },

    /**
     * request handler
     */
    httpHandler = (request, reply) => {
        reply({
            hello: request.params.name
        });
    },

    /**
     * hapi route register
     */
    register = (server, options, next) => {
        server.route({
            method: 'GET',
            path: '/hello/{name}',
            config: {
                validate: httpValidation,
                handler: httpHandler
            }
        });
        return next();
    };

    return register;
}();

export default userRegisterHandler;
