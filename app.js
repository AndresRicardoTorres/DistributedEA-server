var express = require('express');
var app = express(); // Web framework to handle routing requests
var MongoClient = require('mongodb').MongoClient // Driver for connecting to MongoDB
var Server = require("./Server.js");


MongoClient.connect('mongodb://eva05.local:37017,eva04.local:37017,eva03.local:37017/agmp', function(err, db) {
    if(err) {console.log(err);}
    
    var aServer = Server(db,function(isReady){
      
//       console.log(isReady,'isReady');
      if(isReady){
	// Express middleware to populate 'req.body' so we can access POST variables
	app.use(express.json({limit: '50mb'}));
	app.use(express.urlencoded({limit: '50mb'}));
      
	app.post("/",function(req, res, next){
// 	  console.log(req.body ,'req.body');
	  if(typeof req.body.action != 'undefined'){
	    switch(req.body.action){
	      case 'request':
		  this.handleRequest(req.body,function(subPopulation,project,actualGeneration,estimatedTime){
		    if(project == null)
		    {
		      var respuesta = {finalized:true};		      
		    }else{
// 		      console.log(project,'project');
		      console.log(subPopulation.length,"CANTIDAD A PROCESAR");
		      var respuesta = {
			generation:actualGeneration,
			subPopulation:subPopulation,
			estimatedTime:estimatedTime
		      };
		      if(req.body.assignedProject == 'false'){
			respuesta.assignedProject=project;
		      }
		    }
		    console.log("handleRequest"+JSON.stringify(respuesta ));
		    res.send(JSON.stringify(respuesta ));
		  });
		break;
	      case 'deliver' :
		  console.log("deliver");
		  this.handleDeliver(req.body,function(){
		     res.send(JSON.stringify({ok:true}));
		  });
		break;
	    }
	  }
	});
	
	///process.env.PORT variable for use in cloud9
	var port = process.env.PORT || 8000;
	app.listen(port);
	console.log('Server listening on port '+port);
      }else{
	console.log("Projects not found");
	db.close();
      }
    });
});