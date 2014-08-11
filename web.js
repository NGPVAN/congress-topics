var Hapi = require('hapi');
var server = Hapi.createServer('localhost', parseInt(process.env.PORT, 10));

server.route({
  path: '/',
  method: 'GET',
  handler: function(req, reply) {
    reply('Hello Hapi');
  }
});

server.start();
