var mongo = require('mongodb');

function Server(database,mainCallback){
    
  var actualGeneration=null;
  var project=null;
  var projectsCollection = database.collection("projects");
  var populationCollection = database.collection("population");
//   var insertOptions = {w:"majority"};
  var insertOptions = {};
  var updateOptions = {multi:true,safe:true};
  
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

	populationCollection.count({generation:0},function(err,count){
// 	  console.log(project.populationTotal,'project.populationTotal');
// 	  console.log('Individuos en la generacion 0 => '+count);
	  
	  var individuals = new Array();
	  for(var i=count;i<project.populationTotal;i++){	    
	    var aChromosome=project.creationFunction(doc.creationOptions);
	    var aIndividual={
	      generation:0,
	      position:i,
	      chromosome:aChromosome,
	      inProcess:false
	    };
	    individuals.push(aIndividual);	    
	    actualGeneration=0;
	  }
	  
	  populationCollection.insert(individuals,insertOptions,function(err){
	    if(err)console.log("ERROR! "+err);	    
	    populationCollection.count({generation:0},function(err,count){
	      if(err)console.log("ERROR! "+err);
	      console.log("Se crearon "+count+" indiviudos inciales.");
	    });
	  });
	});
	///TODO: update estimatedTime, whit a test
	project.estimatedTime=1200;
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
  
  function calculateAmount(difference){
    ///The client should be busy for a minute
    var idealTime = 60 * 1000;
    ///The estimated time for a one job
    var idealAmount = Math.ceil(idealTime/project.estimatedTime);
    
    return Math.min(idealAmount,difference);
  }
  
  function getPossiblePositions(callback){
    ///TODO clean inProcess with timestamp higher
    
    var possiblePositions = new Array();
    var query = {
      'generation':actualGeneration,
      'inProcess' : false
    };
    var projection = {      
	'_id':0,
	'position':1
    };
    
    populationCollection.find(query,projection).toArray(function(err,individuals){
      if(err)console.error(err);
							
      for(var i=0;i<individuals.length;i++){
	possiblePositions.push(individuals[i].position);
      }
      callback(possiblePositions);
    });
  }
  
  function generateRandomPositions(ammount,callback){
    var positions = new Array();
    var randomPositions = new Array();
    
    getPossiblePositions(function(possiblePositions){
      console.log('possiblePositions',JSON.stringify(possiblePositions.sort(sortNumbers)));
      console.log(possiblePositions.length,'possiblePositions.length');
      
	var limite = Math.min(ammount,possiblePositions.length);
	for(var i=0;i<limite;i++)
	{
	  var random = requestRandomInteger(possiblePositions.length);
	  while(positions[random]){
	    random = requestRandomInteger(possiblePositions.length);
	  }
	  positions[random]=true;
	  randomPositions.push(possiblePositions[random]);
	}
	    
	callback(randomPositions);
    });
    
  }

  var sortNumbers = function(a,b){if(a<b)return -1;if(a>b)return 1;return 0};
  
  function generateSubpopulation(difference,callback){
    
    var realAmmount = calculateAmount(difference);
    
    populationCollection.count({generation:actualGeneration,inProcess:true},function(err,C){
	      console.log(C,'inProcess:true in generation'+actualGeneration);
	      
	    
    
    generateRandomPositions(realAmmount,function(randomPositions){
      console.log('randomPositions',JSON.stringify(randomPositions.sort(sortNumbers)));
      console.log(randomPositions.length);
      var queryByGenerationAndPosition = {
	'generation':actualGeneration,
	'position':{'$in':randomPositions}      
      };
      
      var projection = {
	'chromosome':1,
	  '_id':1  
      };
      
      populationCollection.find(queryByGenerationAndPosition,projection).toArray(function(err,individuals){
	if(err)console.log(err,'err');
	
	var oldIds = new Array();
	var chromosomes = new Array();
	for(var i=0;i<individuals.length;i++)
	{
	  chromosomes.push(individuals[i].chromosome);
	  oldIds.push(individuals[i]._id);	  
	}
		
	var update = {
	  $set:{
	    'inProcess':true,
	    'timestamp':new Date()
	  }
	};  
	
	populationCollection.update(queryByGenerationAndPosition,update,updateOptions,function(err,countModified){
	    if(err)console.error(err);
	    console.log(countModified,'update inProcess timestamp');
	    
	    populationCollection.count({generation:actualGeneration,inProcess:true},function(err,C){
	      console.log(C,'inProcess:true in generation'+actualGeneration);
	      callback(chromosomes,oldIds);
	    });
	    

	    
	  });
	
      });
    });

});    
  }
  
  function searchNextGeneration(callback){
//     console.log("searchNextGeneration");
    var nextGeneration = actualGeneration+1;
    populationCollection.count({generation:nextGeneration},function(err,countNextGeneration){
      if(err)console.log("ERROR! "+err);
//       console.log("Hay "+countNextGeneration+" en la generation "+nextGeneration+" en la BD");
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
	generateSubpopulation(difference,function(subPopulation,oldIds){
		console.log("ENVIO "+subPopulation.length+ " individuos");
		callback(subPopulation,oldIds,project,actualGeneration);
	    });
      });
    }
    else{
      ///No more work
      callback(null,null);
    }
  };
  
  function requestToIndividuals(request,countIndividualsInGeneration){
    var individuals = new Array();
    var limit = Math.min(project.populationTotal,request.newChromosomes.length+countIndividualsInGeneration);
	  
    for(var i=countIndividualsInGeneration;i<limit;i++){
      
	var aIndividual={
	  generation:parseInt(request.generation),
	  position:i,
	  chromosome:request.newChromosomes[i-countIndividualsInGeneration],
	  inProcess:false
	};
	individuals.push(aIndividual);
    }
    return individuals;
  }
  
  ///TODO:Update statics
  this.handleDeliver= function(request,callback){
    console.log("Llegaron "+request.newChromosomes.length);
    
    updateInProcess(request.oldIds);
    updateFitness(request.oldIds,request.fitness);
    
    var queryByGeneration = {generation:request.generation};
    
    populationCollection.count(queryByGeneration,function(err,countIndividualsInGeneration){
      console.log("Hay"+ countIndividualsInGeneration+" en la generation "+request.generation+" en la BD");
      
      var individuals =  requestToIndividuals(request,countIndividualsInGeneration);
      
      if(individuals.length > 0){
	
	populationCollection.insert(individuals,insertOptions,function(err,docs){
	  if(err)console.error("ERROR populationCollection.insert "+err);
	    
	  populationCollection.count(queryByGeneration,function(err,countIndividualsInGeneration){
	    if(err)console.error("ERROR populationCollection.count "+ err);
 	    console.log("Ahora hay"+ countIndividualsInGeneration+" en la generation "+request.generation+" en la BD");
	    callback();
	  });
	  
	});
	
      }else{
	callback();
      }
    });
  };
  
  function updateInProcess(ids){
    
    var queryById = {'_id':{'$in':ids}};
    var update = {'$set':{'inProcess':false}};
    
    populationCollection.update(queryById,update,function(err,something){
      if(err)console.error(err);
				console.log("inProcess update "+something);
    });
    
  }
  
  function updateFitness(ids,fitness){    
    for(var i=0;i<fitness.length;i++){
      var queryById = {'_id':ids[i]};
      var update = {'$set':{'fitness':fitness[i]}};
      
      populationCollection.update(queryById,update,function(err,something){
	if(err)console.error(err);
				  console.log("fitness update "+something);
      });
    }    
  }
  
  this.processCommunication= function (request,callback){
    
//     console.log("\n---ACTION "+request.action+'---');
    
    if(typeof request.action != 'undefined'){
      switch(request.action){
	case 'request':
	    this.handleRequest(request,function(subPopulation,oldIds,project,actualGeneration){
	      
	      var respuesta = {finalized:true};
	      
	      if(project != null)
	      {
// 		console.log("Envio "+subPopulation.length+" individuos");
		var respuesta = {
		  generation:actualGeneration,
		  subPopulation:subPopulation,
		  estimatedTime:project.estimatedTime,
		  oldIds: oldIds
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
	    request.fitness = JSON.parse(request.fitness);    
	    request.oldIds = JSON.parse(request.oldIds);
	    request.generation = parseInt(request.generation);
	    
	    this.handleDeliver(request,function(){
	      callback(null,JSON.stringify({ok:true}));
	    });
	  break;
      }
    }
  }  
}

module.exports = Server;