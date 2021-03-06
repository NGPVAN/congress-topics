var BPromise = require('bluebird');
var fs = require('graceful-fs');
var _ = require('lodash');

var readDir = BPromise.promisify(fs.readdir);
var readFile = BPromise.promisify(fs.readFile);
var loadYaml = require('js-yaml').safeLoad;

var yamlPath = __dirname + '/../contact-congress/members/';

function getBioId(filename) {
  return filename.match(/^(.*).yaml$/)[1];
}

function optionListToArray(optionList) {
  if(!_.isArray(optionList)) {
    if(_.some(optionList, function(optionValue, optionKey) {
      return optionKey.match('--');
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

function loadFile(filename) {
  return readFile(yamlPath + filename).
  then(loadYaml);
}

function getUrl(congressForm) {
  var visit = _.first(congressForm.contact_form.steps, function(step) {
    return step.visit;
  })[0];

  return visit && visit.visit;
}

function getOptionList(congressForm) {
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
}

function processFile(filename) {
  return loadFile(filename).
  then(getOptionList);
}

function getYamlFilenames() {
  return readDir(yamlPath).
  then(function(filenames) {
    return _.filter(filenames, function(filename) {
      return filename.match(/^[A-Z]+[0-9]*.yaml$/);
    });
  });
}

exports.processFile = processFile;
exports.getYamlFilenames = getYamlFilenames;
exports.getBioId = getBioId;
exports.optionListToArray = optionListToArray;
exports.loadFile = loadFile;
exports.getUrl = getUrl;
exports.getOptionList = getOptionList;
