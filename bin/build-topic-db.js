#!/usr/bin/env node
var Promise = require('bluebird');
var _ = require('lodash');
var db = require('../lib/db');
var natural = require('natural');
var dbBuilder = require('../lib/db-builder');

var tfidf = db.tfidf;
var topics = db.topics;

var analyze = require('../analyze');

var optionListToArray = dbBuilder.optionListToArray;
var getYamlFilenames = dbBuilder.getYamlFilenames;
var processFile = dbBuilder.processFile;
var getBioId = dbBuilder.getBioId;
var addTopic = Promise.promisify(topics.put, topics);
var addTfidf = Promise.promisify(tfidf.put, tfidf);

function getBioId(filename) {
  return filename.match(/^(.*).yaml$/)[1];
}

function fileToBioidToKeysAndTfidf(filename, processedFile) {
  return processedFile.
  then(function(optionList) {
    return {
      keys: _.keys(optionList),
      tfidf: createTfIdf(_.map(optionListToArray(optionList), analyze))
    };
  }).
  then(function(keysAndTfidf) {
    var bioIdToOptionList = {};
    bioIdToOptionList[getBioId(filename)] = keysAndTfidf;
    return bioIdToOptionList;
  });
}

function createTfIdf(optionList) {
  var tfidf = new natural.TfIdf(),
      addDocument = tfidf.addDocument.bind(tfidf);

  _.each(optionList, addDocument);

  return tfidf;
}

getYamlFilenames().
then(function(filenames) {
  return Promise.map(filenames, function(filename) {
    return fileToBioidToKeysAndTfidf(filename, processFile(filename));
  });
}).
then(function(bioIdToOptionLists) {
  return _.reduce(bioIdToOptionLists, function(acc, bioIdToOptionList) {
    return _.extend(acc, bioIdToOptionList);
  }, {});
}).

then(function(bioIdToKeysAndTfidf) {
  return Promise.all(_.map(bioIdToKeysAndTfidf, 
  function(keysAndTfidfbioId, bioId) {
    return addTfidf(bioId, JSON.stringify(keysAndTfidfbioId.tfidf)).
    then(function() {
      return Promise.map(keysAndTfidfbioId.keys, function(key, index) {
        addTopic(bioId+'-'+index, key);
      });
    });
  }));
}).

catch(function(reason) {
  console.log(reason);
  process.exit(1);
});
