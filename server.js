var Hapi = require('hapi');
var server = Hapi.createServer('localhost', parseInt(process.env.PORT, 10));
var db = require('./lib/db');
var natural = require('natural');
var Promise = require('bluebird');
var _ = require('lodash');

var topics = db.topics;
var tfidf = db.tfidf;

var getTfidf = Promise.promisify(tfidf.get, tfidf);
var getTopic = Promise.promisify(topics.get, topics);

server.route({
  path: '/',
  method: 'POST',
  handler: function(req, reply) {
    var message = req.payload.fields.$MESSAGE,
        bioid = req.payload.bioid;
    
    getTfidf(bioid).
    then(function(tfidfJson) {
      var tfidf = new natural.TfIdf(JSON.parse(tfidfJson));
      return tfidf.tfidfs(message);
    }).
    then(function(scores) {
      return _.indexOf(scores, _.max(scores));
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
