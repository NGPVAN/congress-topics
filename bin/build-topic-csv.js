#!/usr/bin/env node
var _ = require('lodash');
var dbBuilder = require('../lib/db-builder');
var Promise = require('bluebird');
var dbBuilder = require('../lib/db-builder');

var getYamlFilenames = dbBuilder.getYamlFilenames;
var processFile = dbBuilder.processFile;
var getBioId = dbBuilder.getBioId;

getYamlFilenames().
then(function(filenames) {
  return Promise.map(filenames, function(filename) {
    return processFile(filename).
    then(function(optionList) {
      var bioid = getBioId(filename);
      return _.map(optionList, function(option) {
        return [bioid, option];
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
