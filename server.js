var Hapi = require('hapi');
var server = Hapi.createServer('localhost', parseInt(process.env.PORT, 10));
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
    var message = req.payload.fields.$MESSAGE,
        bioid = req.payload.bioid;

    tfidf.get(bioid, console.log);
    getTfidf(bioid).
    then(function(tfidfJson) {
      var tfidf = new natural.TfIdf(JSON.parse(tfidfJson));
      return tfidf.tfidfs(analyze(message));
    }).
    then(function(scores) {
      var index = _.indexOf(scores, _.max(scores));
      return index === -1 ? 0 : index;
    }).
    then(function(index) {
      return getTopic(bioid+'-'+index);
    }).
    catch(function(reason) {
      console.log(reason);
      return Hapi.error.internal('uh oh', reason);
    }).
    then(reply);
  }
});

module.exports = server;
