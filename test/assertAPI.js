var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;

var uri_mongodb_connection = 'mongodb://177.71.196.106:27017/agmp';
var mongodb_collection_config = 'configuracion';

exports.assertStatus = function (code) {
    return function (error, response, body) {
        assert.isObject(response);
        assert.equal (response.statusCode, code);
    }    
}

exports.assertJSONResponse = function(obj_test){
    return function(error, response, body){
        var obj_repsonse = null;
        try{
            obj_repsonse = JSON.parse(body);
        }catch(e){}
        assert.isNotNull(obj_repsonse,"La respuesta debe ser un JSON valido");
        if(obj_repsonse){
            assert.isObject(obj_repsonse);
            for(var i in obj_test){
                assert.include (obj_repsonse, i);
                assert.equal(obj_repsonse[i],obj_test[i]);
            }
        }
    }
}

exports.assertMongodbFindOne = function(query){
    return function(error, response, body){
        if(error) {
            console.log(error);
            return;
        }
        
        MongoClient.connect(uri_mongodb_connection, function(err, db) {
            assert.isNotNull(err,"Hubo error en la conexion de MongoDB");
            if(err) {
                console.log(err);
                return;
            }
            //console.log("44");
            db.collection(mongodb_collection_config).findOne(query,function(err,doc){
                //console.log("46");
                assert.isNotNull(err,"Hubo error en la consulta a MongoDB");
                if(err) {
                    console.log(err);
                    return;
                }
                console.log(doc,"51");
                //assert.isNotNull(doc,"El documento no debe estar vacio");
            });
        });
    }
}