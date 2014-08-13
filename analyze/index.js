var stopWords = require('./stop-words');
var natural = require('natural');
var _ = require('lodash');

var tokenizer = new natural.TreebankWordTokenizer();
var stemmer = natural.PorterStemmer.stem.bind(natural.PorterStemmer);

module.exports = function(document) {
  return _(tokenizer.tokenize(document.toLowerCase())).
  filter(function(token) {
    return !stopWords[token];
  }).
  map(stemmer).
  value().
  join(' ');
};
