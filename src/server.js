import Hapi from 'hapi';
import good from 'good';
import userRegisterHandler from './api/user_register_handler';

let server = new Hapi.Server(),
    serverRegisterOptions = () => {
        return [
            {
                register: good,
                options: {
                    reporters: [{
                        reporter: 'good-console',
                        events: {log: '*', response: '*', error: '*'}
                    }]
                }
            },
            {
                register: userRegisterHandler
            }
        ];
    }(),
    serverErrorHandler = (err) => {
        if (err) {
            console.error(err);
        } else {
            server.start(() => {
                console.log('Server started at: ' + server.info.uri); // jshint ignore:line
            });
        }
    }; 

server.connection({
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
});

server.register(serverRegisterOptions, serverErrorHandler);

