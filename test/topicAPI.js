var request = require('request');   

///Variables tmp
var MongoClient = require('mongodb').MongoClient;
var uri_mongodb_connection = 'mongodb://177.71.196.106:27017/agmp';
var mongodb_collection_config = 'configuracion';
var DB = null;
///END variables tmp

exports.urlbase = function(){
    //return "http://localhost:3000";
    return "http://agmp_servidor_-c9-andresricardotorres.c9.io";
};

exports.post = function (action,object) {
    return function () {
        var options = {"method":"POST","url":exports.urlbase()+action,"form":object};
        request(options, this.callback);
    };
}

exports.findOne = function(collection,query){
    return function(error, response, body){
        var topicTHIS = this;
		MongoClient.connect(uri_mongodb_connection, function(err, db) {
		    topicTHIS.DB =  db;
			db.collection(collection).findOne(query, topicTHIS.callback);
		});
    }
}