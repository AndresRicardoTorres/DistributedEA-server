var MongoClient = require('mongodb').MongoClient;
var http = require('http');
var qs = require('querystring');
var async = require('async');
var Server = require("./Server.js");
var configuration = require("./config.js");

MongoClient.connect(configuration.urlMongo, function(err, db) {
    if(err) {console.error(err);}
    
    var aServer = Server(db,function(error,isReady){
      if(error) {console.error(error);}
	var THIS = this;
	var httpServer = http.createServer(function (request, response) {
	  if (request.method == 'POST') {
	    var requestBody = '';
	    request.on('data', function(data) {requestBody +=data;});
	    request.on('end', function() {	      
	      var formData = qs.parse(requestBody);
	      var aTask = {
		server:THIS,
		data:formData,
		response:response
	      }
	      aQueue.push(aTask,function(err){
		if(err)console.error("ERROR en push "+err);
		 console.log("###END### "+(queueCount++));
	      });
	    });
	  }
	});
	
	httpServer.listen(configuration.httpPort);
	console.log('Server listening on port '+configuration.httpPort);
	
	httpServer.on('close',function(){
	  console.log('Server is shutdown ');
	  db.close();	  
	});
    });
    
    var queueCount = 0;
    var aQueue = async.queue(function(task,callback){
      console.log("###BEGIN### "+queueCount);
      task.server.processCommunication(task.data,function(error,answer){
	task.response.end(answer);
	if(typeof answer.finalized != 'undefined' && answer.finalized){
	  httpServer.close();
	}
	callback();
      });
    },1);
    
});