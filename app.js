var MongoClient = require('mongodb').MongoClient;
var http = require('http');
var qs = require('querystring');
var async = require('async');
var Server = require("./lib/Server.js");
var configuration = require("./config/config.js");

MongoClient.connect(configuration.urlMongo, function(err, db) {
  if(err) {console.error(err);}
 
  var httpServer;
  var initialTime = new Date();
  var lapTime;
  var aServer = Server(db,function(error,isReady){
    if(error) {console.error("ERROR " +error);}		
    var THIS = this;
    httpServer = http.createServer(function (request, response) {
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
  	  THIS.writeInDB();
	  aQueue.push(aTask,function(err){
	    if(err)console.error("ERROR en push "+err);
		      console.log("###END### "+(queueCount++));
	    console.log("Duracion LAP:"+(new Date()-lapTime)/1000)+" Seconds";
	  });
	});
      }
    });
    
    httpServer.listen(configuration.httpPort);
    
    console.log('Server listening on port '+configuration.httpPort);
    console.log('Start time :'+initialTime);
    httpServer.on('close',function(){
      console.log('Server is shutdown ');
      db.close();	  
    });
  });
  
  var queueCount = 0;
  var aQueue = async.queue(function(task,callback){
    console.log("###BEGIN### "+queueCount);
    lapTime = new Date();
    task.server.processCommunication(task.data,function(error,answer){
      task.response.end(answer);
      
      if(answer == JSON.stringify({finalized:true})){
	///Don't stop the server NEVER, other clients can use it
	var endTime = new Date();
	var time = (endTime - initialTime)/1000;
	console.log("End Time : "+ endTime + "Duration "+time+ "segundos");
      }
      callback();
    });
  },1);    
});