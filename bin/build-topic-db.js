#!/usr/bin/env node
var BPromise = require('bluebird');
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
var addTopic = BPromise.promisify(topics.put, topics);
var addTfidf = BPromise.promisify(tfidf.put, tfidf);

function getBioId(filename) {
  return filename.match(/^(.*).yaml$/)[1];
}

function fileToBioidToKeysAndTfidf(filename, processedFile) {
  return processedFile.
  then(function(optionList) {
    var keys = _.keys(optionList);
    var options = optionListToArray(optionList);

    //Get rid of the select ones
    var indiciesToRemove = [];
    _.each(options, function(option, index) {
      if(option.match(/[sS]elect/)) {
        indiciesToRemove.push(index);
      }
    });

    var filterer = function(value, index) {
      return !_.contains(indiciesToRemove, index);
    };

    return {
      keys: _.filter(keys, filterer),
      tfidf: createTfIdf(_.map(_.filter(options, filterer), analyze))
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
  return BPromise.map(filenames, function(filename) {
    return fileToBioidToKeysAndTfidf(filename, processFile(filename));
  });
}).
then(function(bioIdToOptionLists) {
  return _.reduce(bioIdToOptionLists, function(acc, bioIdToOptionList) {
    return _.extend(acc, bioIdToOptionList);
  }, {});
}).

then(function(bioIdToKeysAndTfidf) {
  return BPromise.all(_.map(bioIdToKeysAndTfidf, 
  function(keysAndTfidfbioId, bioId) {
    return addTfidf(bioId, JSON.stringify(keysAndTfidfbioId.tfidf)).
    then(function() {
      return BPromise.map(keysAndTfidfbioId.keys, function(key, index) {
        addTopic(bioId+'-'+index, key);
      });
    });
  }));
}).

catch(function(reason) {
  console.log(reason);
  process.exit(1);
});
