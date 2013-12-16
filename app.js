var http = require('http');
var qs = require('querystring');
var MongoClient = require('mongodb').MongoClient // Driver for connecting to MongoDB
var Server = require("./Server.js");

MongoClient.connect('mongodb://eva05.local:37017,eva04.local:37017,eva03.local:37017/agmp', function(err, db) {
    if(err) {console.log(err);}
    
    var aServer = Server(db,function(isReady){
      

      if(isReady){
	
	function process(req,res){
	  console.log("\n---ACTION "+req.action+'---');
	  console.log(req,"REQ");
	  if(typeof req.action != 'undefined'){
	    switch(req.action){
	      case 'request':
		  this.handleRequest(req,function(subPopulation,project,actualGeneration,estimatedTime){
		    if(project == null)
		    {
		      var respuesta = {finalized:true};		      
		    }else{

		      console.log("Envio "+subPopulation.length+" individuos");
		      var respuesta = {
			generation:actualGeneration,
			subPopulation:subPopulation,
			estimatedTime:estimatedTime
		      };
		      if(req.assignedProject == 'false'){
			respuesta.assignedProject=project;
		      }
		    }
		    
		    res.end(JSON.stringify(respuesta ));
		  });
		break;
	      case 'deliver' :		  
		  console.log("Recibo "+req.newChromosomes.length+" individuos");
		  if(!req.newChromosomes instanceof Array){
		    console.log(req);
		  }
		  if(typeof req.newChromosomes.length)
		  this.handleDeliver(req,function(){
		     res.end(JSON.stringify({ok:true}));
		  });
		break;
	    }
	  }
	}
	
	///process.env.PORT variable for use in cloud9
	var port = 8000;
	
	http.createServer(function (request, response) {
	  if (request.method == 'POST') {
	    var requestBody = '';
	    request.on('data', function(data) {
	      requestBody += data;	      
	    });
	    request.on('end', function() {
	      console.log(requestBody,'requestBody');
	      var formData = qs.parse(requestBody);
	      process(formData,response);	      
	    });
	  }
	}).listen(port);	
	console.log('Server listening on port '+port);
	
      }else{
	console.log("Projects not found");
	db.close();
      }
    });
});