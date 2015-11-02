let userRegisterHandler = () => {
    let sayHello = (request, reply) => {
        reply({
            hello: request.params.name
        });
    },

    register = (server, options, next) => {
        server.route({
            method: 'GET',
            path: '/hello/{name}',
            handler: sayHello
        });
        return next();
    };

    register.attributes = {
        name: 'api'
    };

    return register;
}();

export default userRegisterHandler;
