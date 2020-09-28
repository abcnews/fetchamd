/* global describe, it, chai, fetchAmd */

describe('Require', () => {
  describe('basic', () => {
    it('can load a single module.', (done) => {
      fetchAmd('requireable1.js').then((item1) => {
        chai.assert(typeof item1, 'object');
        chai.assert(item1.name, 'item one');
        done();
      });
    });
    it('can load a Browserified standalone module.', (done) => {
      fetchAmd('requireable3-browserify.js').then((item3) => {
        chai.assert(typeof item3, 'number');
        // item3 exports the number 5.
        chai.assert(item3, 5);
        done();
      });
    });
  });

  describe('Popular libraries on cdnjs', () => {
    it('can load D3', (done) => {
      fetchAmd('http://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js').then((d3) => {
        chai.assert(typeof d3, 'function');
        chai.assert(typeof d3.selectAll, 'function');
        done();
      });
    });
    it('can load Leaflet', (done) => {
      fetchAmd('http://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.js').then((L) => {
        chai.assert(typeof L, 'object');
        chai.assert(typeof L.version, '0.7.3');
        done();
      });
    });
    it('can load Underscore', (done) => {
      fetchAmd('http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js').then((_) => {
        chai.assert(typeof _, 'function');
        chai.assert(typeof _.each, 'function');
        done();
      });
    });
  });
});
