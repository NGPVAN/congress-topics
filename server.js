var Hapi = require('hapi');
var server = Hapi.createServer(~~process.env.PORT || 3000, '0.0.0.0');
var db = require('./lib/db');
var natural = require('natural');
var Promise = require('bluebird');
var _ = require('lodash');
var analyze = require('./analyze');

var topics = db.topics;
var tfidf = db.tfidf;

var getTfidf = Promise.promisify(tfidf.get, tfidf);
var getTopic = Promise.promisify(topics.get, topics);

server.route({
  path: '/',
  method: 'POST',
  config: {
    payload: {
      output: 'data',
      parse: true
    }
  },
  handler: function(req, reply) {
    var message = req.payload.message,
        bioid = req.payload.bioid;

    tfidf.get(bioid, console.log);
    getTfidf(bioid).
    then(function(tfidfJson) {
      var tfidf = new natural.TfIdf(JSON.parse(tfidfJson));
      return tfidf.tfidfs(analyze(message));
    }).
    then(function(scores) {
      var index = _.indexOf(scores, _.max(scores));
      if(index === -1) {
        return Hapi.error.notFound(bioid+' does not use topics.');
      }
      else {
        return getTopic(bioid+'-'+index).
        then(function(topic) {
          return { topic: topic };
        });
      }
    }).
    catch(function(reason) {
      console.log(reason);
      return Hapi.error.internal('uh oh', reason);
    }).
    then(reply);
  }
});

module.exports = server;
