var Lab = require('lab');
var fs = require('fs');
var server = require('../server');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;

describe('POST', function() {
  it('should not pick select for R000146', function(done) {
    var options = {
      method: 'POST',
      url: '/',
      payload: { 
        bioid: 'R000146',
        topic: 'women',
        message: 'When it comes to protecting women, actions speak louder' +
          'than words.'
      }
    };

    server.inject(options, function(response) {
      var result = response.result;

      expect(result).to.eql({ topic: 'Abortion' });
      done();
    });
  });

  it('should 404 for N000032 since they don\'t require topic', function(done) {
    var options = {
      method: 'POST',
      url: '/',
      payload: { 
        bioid: 'N000032',
        topic: 'transportation',
        message: 'yo!'
      }
    };

    server.inject(options, function(response) {
      expect(response.statusCode).to.equal(404);
      done();
    });
  });

  it('should should choose bike for Jim Moran for a bike message', 
  function(done) {
    var options = {
      method: 'POST',
      url: '/',
      payload: { 
        bioid: 'M000933',
        topic: 'transportation',
        message: fs.readFileSync(__dirname + '/data/bike-transport-message').
          toString()
      }
    };

    server.inject(options, function(response) {
      var result = response.result;

      expect(result).to.eql({ topic: '--- Bike and Ped' });
      done();
    });
  });
});
