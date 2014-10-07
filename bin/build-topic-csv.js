#!/usr/bin/env node
var _ = require('lodash');
var dbBuilder = require('../lib/db-builder');
var BPromise = require('bluebird');
var dbBuilder = require('../lib/db-builder');

var getYamlFilenames = dbBuilder.getYamlFilenames;
var loadFile = dbBuilder.loadFile;
var getUrl = dbBuilder.getUrl;
var getOptionList = dbBuilder.getOptionList;
var getBioId = dbBuilder.getBioId;

getYamlFilenames().
then(function(filenames) {
  return BPromise.map(filenames, function(filename) {
    return loadFile(filename).
    then(function(congressForm) {
      var url = getUrl(congressForm);
      var optionList = getOptionList(congressForm);
      return [url, optionList];
    }).
    spread(function(url, optionList) {
      var bioid = getBioId(filename);
      return _.map(optionList, function(value, key) {
        return [bioid, url, key, value];
      });
    });
  });
}).
then(function(objectListLists) {
  _.each(objectListLists, function(objectList) {
    _.each(objectList, function(row) {
      process.stdout.write(row.join()+'\n');
    });
  });
}).

catch(function(reason) {
  console.log(reason);
  process.exit(1);
});
