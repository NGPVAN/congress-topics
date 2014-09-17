var Lab = require('lab');
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
        message: 'Ask Congress to strengthen our investment in biking and walking. Americans are increasingly searching for solutions to tight family budgets, rising health care costs, and time wasted in traffic. Despite a small current investment of resources, biking and walking already account for 12 percent of all trips made by Americans.  Forty percent of all trips in the United States are just two miles or less, yet the vast majority are made by car. These short car trips are the most polluting and energy intensive. They are also the easiest trips to convert to bicycling and walking.  Sign below to say: I think Congress should continue and strengthen our investment in bicycling and walking. As a nation, we can move decisively towards increasing the share of trips taken on foot and by bicycle from 10 percent to 20 percent.  Such a shift from driving to bicycling and walking will provide tens of billions of dollars per year in economic, health, tourism, energy, environmental, safety, and congestion-related benefits.  I support a federal transportation bill that invests in bicycling and walking as safe, healthy, and effective transportation choices.'
      }
    };

    server.inject(options, function(response) {
      var result = response.result;

      expect(result).to.eql({ topic: '--- Bike and Ped' });
      done();
    });
  });
});
