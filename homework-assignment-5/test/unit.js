/**
 * Unit Tests
 */

const lib = require('../app/lib');
const assert = require('assert');

const unit = {};

unit['lib.getNumberOne should return 1'] = (done) => {
    assert.equal(lib.getNumberOne(), 1);
    done();
};

unit['lib.getNumberOne should not return 2, failed as expetected.'] = (done) => {
    assert.equal(lib.getNumberOne(), 2);
    done();
}

unit['lib.getNumberOneSync should callback with result 1.'] = (done) => {
    lib.getNumberOneAsync(function(result) {
        assert.equal(result, 1);
        done();
    })
}

unit['lib.acceptNumberOnly should callback with error if non-numeric parameter passed in.'] = (done) => {
    lib.acceptNumberOnly('invalid parameter', function(err) {
        assert.equal(err instanceof TypeError, true);
        done();
    })
}

unit['lib.acceptNumberOnly should not throw error if non-numeric parameter passed in.'] = (done) => {
    assert.doesNotThrow(function() {
        lib.acceptNumberOnly('invalid parameter', function(err) {
            done();
        });
    });
}

module.exports = unit;