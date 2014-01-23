var MongoClient = require('mongodb').MongoClient;
var http = require('http');
var qs = require('querystring');
var async = require('async');
var Server = require("./lib/Server.js");
var configuration = require("./config/config.js");

var httpServer;
var aServer;
var aQueue;
var initialTime=null;
var lapTime=0;
var lapTotalTime = 0;
var timeRequest=0;
var timeDeliver=0;
var queueCount = 0;
var PARALELL_TASKS = 1;

function printReport(){
  var endTime = new Date();
  var time = (endTime - initialTime)/1000;
  lapTotalTime=lapTotalTime/1000;
  console.info("===REPORT===");
  console.info("Initial Time: "+ initialTime);
  console.info("End Time: "+ endTime);
  console.info("Total Duration:"+time);
  console.info("");
  console.info("Time work in server:"+ lapTotalTime);
  console.info("Request time: "+aServer.totalTimeRequest/1000);
  console.info("Request time (round): "+timeRequest/1000);
  console.info("Deliver time: "+aServer.totalTimeDeliver/1000);
  console.info("Deliver time (round): "+timeDeliver/1000);
  console.info("");
  console.info("Total tasks completed:" +queueCount);
}

function processQueue(task,callback)
{  
  lapTime = new Date();
  aServer.processCommunication(task.data,function(error,answer){
    if (answer== JSON.stringify({ok:true})){
      timeDeliver+=new Date()-lapTime;
    }
    else{
      timeRequest+=new Date()-lapTime;
    }
    task.response.end(answer);
    
    if(answer == JSON.stringify({finalized:true})){
        printReport();
    }
    callback();
  });
}

function finishedTask(err){
  if(err)
        console.error("ERROR en push "+err);
  queueCount++;            
  lapTotalTime+=(new Date()-lapTime);
}

function processHttpRequest(request,response){
  if(initialTime == null)
    initialTime = new Date();

  var requestBody = '';
  request.on('data', function(data) {
    requestBody +=data;
  });
  request.on('end', function() {
    var formData = qs.parse(requestBody);

    ///Write in database parallel to queue process
    aServer.writeInDB();

    var aTask = {      
      data:formData,
      response:response
    }

    /// add a task to the queue process
    aQueue.push(aTask,finishedTask);
  });  
}

MongoClient.connect(configuration.urlMongo, function(err, db) {
  if(err) {
    console.error("ERROR >> "+err);
  }
  
  Server(db,function(error,isReady){
    aServer = this;
    if(error) {
      console.error("ERROR " +error);
    }
    
    // Start queue for client request
    aQueue = async.queue(processQueue,PARALELL_TASKS);
    // Start HTTP server
    httpServer = http.createServer(processHttpRequest);
    httpServer.listen(configuration.httpPort);

    console.log('Server listening on port '+configuration.httpPort);
    console.log('Start time :'+new Date());
  });
});