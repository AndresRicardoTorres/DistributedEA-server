var assert = require('assert');

exports.assertStatus = function (code) {
    return function (error, response, body) {
        assert.isObject(response);
        assert.equal (response.statusCode, code);
    }    
}

exports.assertJSONResponse = function(obj_test){
    return function(error, response, body){
        var obj_repsonse = JSON.parse(body);
        assert.isObject(obj_repsonse);
        for(var i in obj_test){
            assert.include (obj_repsonse, i);
            assert.equal(obj_repsonse[i],obj_test[i]);
        }
    }
}
