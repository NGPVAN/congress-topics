var level = require('level');
var sublevel = require('level-sublevel');

var db = sublevel(level(__dirname + '/../database'));
exports.tfidf = db.sublevel('tfidf');
exports.topics = db.sublevel('topics');
