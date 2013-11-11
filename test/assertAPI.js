var assert = require('assert');

exports.assertStatus = function (code) {
    return function (e, res) {
        assert.isObject(res);
       // console.log(res);
        assert.equal (res.statusCode, code);
    }    
}
