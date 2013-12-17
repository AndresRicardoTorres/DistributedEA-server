var mongo = require('mongodb');

function Server(database,mainCallback){
    
  var actualGeneration=null;
  var project=null;
  var projectsCollection = database.collection("projects");
  var populationCollection = database.collection("population");
  
  ///Search for a new project a initialize the first generation
  ///
  function initialize(){
    
//     console.log('initialize');
    //Should be one for the moment
    projectsCollection.findOne({},function(err,doc){
      
//       console.log(doc,"doc");
      if(doc != null){
	
	project = {}; 	
 	project.populationTotal = doc.populationTotal;
	project.generationLimit = doc.generationLimit;
	project.mutationPercent = doc.mutationPercent;
	project.mattingPoolPercent = doc.mattingPoolPercent;
	
	project.creationFunctionString = doc.creationFunction.code;
	project.fitnessFunctionString = doc.fitnessFunction.code;
	project.mutationFunctionString = doc.mutationFunction.code;
	project.crossoverFunctionString = doc.crossoverFunction.code;
	eval("project.creationFunction = "+doc.creationFunction.code);
	eval("project.fitnessFunction = "+doc.fitnessFunction.code);
	eval("project.mutationFunction = "+doc.mutationFunction.code);
	eval("project.crossoverFunction = "+doc.crossoverFunction.code);
	
//  	console.log(JSON.stringify({a:project}),'AAAA');
	populationCollection.count({generation:0},function(err,count){
// 	  console.log(project.populationTotal,'project.populationTotal');
	  console.log('Individuos en la generacion 0 => '+count);
	  for(var i=count;i<project.populationTotal;i++){	    
	    var aChromosome=project.creationFunction();
	    var aIndividual={
	      generation:0,
	      position:i,
	      chromosome:aChromosome
	    };
	    populationCollection.insert(aIndividual,function(err){
	      if(err)console.log("ERROR! "+err);
	    });
	    actualGeneration=0;
	  }
	  
	});
	///TODO: update estimatedTime, whit a test
	project.estimatedTime=10;
      }
      
      getActualGeneration(0,function(){
	  if(project === null || actualGeneration === null){
	    mainCallback(new Error("Project not found"));
	  }else{
	    mainCallback(null);
	  }
	  
      });
      
    });
    
  };
  initialize();
  
  function getActualGeneration(generation,callback){    
//     console.log(project,'Search actualGeneration');
    if(project != null){ 
      
//       console.log(project.generationLimit,'94');
      
//       console.log(actualGeneration,'actualGeneration *actualGeneration ');
      
      if(actualGeneration==null){
	populationCollection.count({generation:generation},function(err,count)
	{
// 	  console.log(count,'count *actualGeneration ');
	  if(count<=project.populationTotal){
	    actualGeneration=generation;
// 	    console.log('actualGeneration='+generation);
	    callback();
	  }else{
	    getActualGeneration(generation+1,callback);
	  }
	});
      }else{
	callback();
      }
      
     }else{
      callback();
    }
  };
  
  
  requestRandomInteger = function(max){
    return Math.floor(Math.random()*max);
  }
  
  function generateSubpopulation(amount,callback){
    ///The client should be busy for a minute
    var idealTime = 60 * 10000;
    ///The estimated time for a one job
    var idealAmount = Math.ceil(idealTime/project.estimatedTime);
    var realAmmount = Math.min(idealAmount,amount);
    var positions = new Array();
    var randomPositions = new Array();
            
    for(var i=0;i<realAmmount;i++)
    {
      var random = requestRandomInteger(project.populationTotal);
      while(positions[random]){
	random = requestRandomInteger(project.populationTotal);
      }
      positions[random]=true;
      randomPositions.push(random);
    }
    
    console.log(randomPositions.length,'randomPositions');
    populationCollection.find({'generation':actualGeneration,'position':{'$in':randomPositions}},{'chromosome':1,'_id':0}).toArray(function(err,individuals){
      if(err)console.log(err,'err');
      var chromosomes = new Array();
      for(var i=0;i<individuals.length;i++)
      {
	chromosomes.push(individuals[i].chromosome);
      }
      callback(chromosomes);
    });
  }
  
  function searchNextGeneration(callback){
    console.log("searchNextGeneration");
    var nextGeneration = actualGeneration+1;
    populationCollection.count({generation:nextGeneration},function(err,countNextGeneration){
      if(err)console.log("ERROR! "+err);
      console.log("Hay "+countNextGeneration+" en la generation "+nextGeneration+" en la BD");
      var difference = project.populationTotal -countNextGeneration;
      if(difference>0)
      {	
	callback(difference);
      }else{
	console.log("AUMENTO LA GENERACION");
	actualGeneration++;
	searchNextGeneration(callback);
      }
    });
  }
    
  this.handleRequest= function(request,callback){
        
    if(actualGeneration < project.generationLimit){
      searchNextGeneration(function(difference){
 	console.log('FALTAN '+difference+" EN LA GENERACION "+(actualGeneration+1));
	generateSubpopulation(difference,function(subPopulation){
		callback(subPopulation,project,actualGeneration,project.estimatedTime);
	    });
      });
    }
    else{
      ///No more work
      callback(null,null);
    }
    
    
    
  };
  
  ///TODO:Update statics
  this.handleDeliver= function(request,callback){
    
    populationCollection.count({generation:request.generation},function(err,countGeneration){
      console.log("Hay "+countGeneration+" en la generation "+request.generation+" en la BD");
      
      var individuals = new Array();
      
      for(var i=0;i<request.newChromosomes.length;i++){
	
	  var aIndividual={
	    generation:parseInt(request.generation),
	    position:countGeneration+i+1,
	    chromosome:request.newChromosomes[i],
	    fitness:request.fitness[i]
	  };
	  individuals.push(aIndividual);
      }
      
      populationCollection.insert(individuals,{fsync:true,journal:true},function(err,docs){
	if(err)console.error("ERROR populationCollection.insert ");
	  console.log("INSERTE "+ docs.length+" individuos");
	
	
	populationCollection.count({generation:request.generation},function(err,countGeneration){
	  if(err)console.error("ERROR populationCollection.insert ");
	  console.log("CONFIRMO  Hay"+ countGeneration+" en la generation "+request.generation+" en la BD");
	  callback();
	});
	
      });
      
    });
  };
  
  
  this.processCommunication= function (request,callback){
    
    console.log("\n---ACTION "+request.action+'---');
    
    if(typeof request.action != 'undefined'){
      switch(request.action){
	case 'request':
	    this.handleRequest(request,function(subPopulation,project,actualGeneration,estimatedTime){
	      
	      var respuesta = {finalized:true};
	      
	      if(project != null)
	      {
		console.log("Envio "+subPopulation.length+" individuos");
		var respuesta = {
		  generation:actualGeneration,
		  subPopulation:subPopulation,
		  estimatedTime:estimatedTime
		};
		if(request.assignedProject == 'false'){
		  respuesta.assignedProject=project;
		}
	      }
	      callback(null,JSON.stringify(respuesta ));
	    });
	  break;
	case 'deliver' :
	    request.newChromosomes = JSON.parse(request.newChromosomes)
	    console.log("Recibo "+request.newChromosomes.length+" individuos");	    	    
	    this.handleDeliver(request,function(){	      
	      callback(null,JSON.stringify({ok:true}));
	    });
	  break;
      }
    }
  }
  
  
}

module.exports = Server;