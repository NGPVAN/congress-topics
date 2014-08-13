#!/usr/bin/env node
var Promise = require('bluebird');
var fs = require('graceful-fs');
var _ = require('lodash');
var natural = require('natural');
var db = require('../lib/db');

var tfidf = db.tfidf;
var topics = db.topics;

var loadYaml = require('js-yaml').safeLoad;
var readDir = Promise.promisify(fs.readdir);
var readFile = Promise.promisify(fs.readFile);
var analyze = require('../analyze');
var addTopic = Promise.promisify(topics.put, topics);
var addTfidf = Promise.promisify(tfidf.put, tfidf);

var yamlPath = __dirname + '/../contact-congress/members/';

function getBioId(filename) {
  return filename.match(/^(.*).yaml$/)[1];
}

function optionListToArray(optionList) {
  if(!_.isArray(optionList)) {
    if(_.some(optionList, function(optionValue, optionKey) {
      return optionKey.indexOf('--');
    })) {
      return _.values(optionList);
    }
    else {
      return _.keys(optionList);
    }
  }
  else {
    return optionList;
  }
}

function createTfIdf(optionList) {
  var tfidf = new natural.TfIdf(),
      addDocument = tfidf.addDocument.bind(tfidf);

  _.each(optionList, addDocument);

  return tfidf;
}

function processFile(filename) {
  return readFile(yamlPath + filename).
  then(loadYaml).
  then(function(congressForm) {
    var topic = _(congressForm.contact_form.steps).
    filter(function(step) {
      return _.some(step, function(stepValue) {
        return _.isArray(stepValue);
      });
    }).
    flatten(function(step) {
      return _.values(step);
    }).
    filter(function(element) {
      return element.value === '$TOPIC';
    }).
    first();

    return topic && topic.options;
  }).
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

readDir(yamlPath).
then(function(filenames) {
  return _.filter(filenames, function(filename) {
    return filename.match(/^[A-Z]+[0-9]*.yaml$/);
  });
}).
then(function(filenames) {
  return Promise.map(filenames, processFile);
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
