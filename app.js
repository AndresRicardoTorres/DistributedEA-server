var MongoClient = require('mongodb').MongoClient;
var http = require('http');
var qs = require('querystring');
var async = require('async');
var Server = require("./lib/Server.js");
var configuration = require("./config/config.js");

MongoClient.connect(configuration.urlMongo, function(err, db) {
  if(err) {console.error(err);}
 
  var httpServer;
  var initialTime=null;
  var lapTime=0;
  var lapTotalTime = 0;
  var aServer = Server(db,function(error,isReady){
    if(error) {console.error("ERROR " +error);}		
    var THIS = this;
    httpServer = http.createServer(function (request, response) {
      if(initialTime == null)
        initialTime = new Date();
      if (request.method == 'POST') {
	      var requestBody = '';
        request.on('data', function(data) {requestBody +=data;
	  console.log("DATA"+new Date().getTime())	  
	});
        request.on('end', function() {	      
      	  var formData = qs.parse(requestBody);
 	  formData.dateTest = parseInt(formData.dateTest);
	  //console.log("formData.dateTest"+formData.dateTest);
		   console.log("formData.dateTest"+formData.dateTest);
	  console.log("new test => "+(new Date().getTime()-formData.dateTest));
		   if(formData.action == 'deliver'){
		   timeNewTest+=(new Date().getTime()-formData.dateTest);}
      	  var aTask = {
      	    server:THIS,
      	    data:formData,
      	    response:response
      	  }
          ///Write in database asyncronius off the tasks
        	//THIS.writeInDB();
      	  aQueue.push(aTask,function(err){            
      	    if(err)console.error("ERROR en push "+err);
            queueCount++;            
            lapTotalTime+=(new Date()-lapTime);
      	  });
        });
      }
    });
    
    httpServer.listen(configuration.httpPort);
    
    console.log('Server listening on port '+configuration.httpPort);
    console.log('Start time :'+new Date());

  });
  var timeRequest=0;
  var timeDeliver=0;
  var queueCount = 0;
  var timeNewTest = 0;
  var aQueue = async.queue(function(task,callback){
    
    lapTime = new Date();
    task.server.processCommunication(task.data,function(error,answer){
      if (answer== JSON.stringify({ok:true})){
	timeDeliver+=new Date()-lapTime;	
      }
      else{
	timeRequest+=new Date()-lapTime;
	console.log("lap => "+(new Date()-lapTime)/1000);
      }
      task.response.end(answer);
      
      if(answer == JSON.stringify({finalized:true})){          
        	var endTime = new Date();
		console.info("Initial Time => "+ initialTime);
        	var time = (endTime - initialTime)/1000;
          lapTotalTime=lapTotalTime/1000;
	  console.info("timeNewTest: "+timeNewTest/1000);
	  console.info("request time: "+task.server.totalTimeRequest/1000)
	  console.info("request time (round): "+timeRequest/1000)
	  console.info("deliver time: "+task.server.totalTimeDeliver/1000)
	  console.info("deliver time (round): "+timeDeliver/1000)
        	console.info("End Time => "+ endTime);
          console.info("Total Duration "+time+" in seconds");
          console.info("Time work in server => "+ lapTotalTime+" in seconds ,"+(lapTotalTime/time*100)+"%");
          console.info("Total task =>" +queueCount);
      }
      callback();
    });
  },1);
});
