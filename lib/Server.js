var mongo = require('mongodb');

function Server(database,mainCallback){
  
  var actualGeneration=null;
  var project=null;
  var projectsCollection = database.collection("projects");
  var populationCollection = database.collection("population");
  //   var insertOptions = {w:"majority"};
  var insertOptions = {};
//   var updateOptions = {multi:true,safe:true};
  var population = new Array();
  var sequenceId = null;
  
  function initProject(callback){
    //Should be one for the moment
    projectsCollection.findOne({},function(err,doc){
      if(err)callback(false);
			       
	if(doc != null){
	
	project = {};
	project.populationTotal = doc.populationTotal;
	project.generationLimit = doc.generationLimit;
	project.mutationPercent = doc.mutationPercent;
// 	project.mattingPoolPercent = doc.mattingPoolPercent;
	project.creationOptions = doc.creationOptions;
	project.sleepTime = doc.sleepTime;
	
	project.creationFunctionString = doc.creationFunction.code;
	project.fitnessFunctionString = doc.fitnessFunction.code;
	project.mutationFunctionString = doc.mutationFunction.code;
	project.crossoverFunctionString = doc.crossoverFunction.code;	
	eval("project.creationFunction = "+doc.creationFunction.code);
	eval("project.fitnessFunction = "+doc.fitnessFunction.code);
	eval("project.mutationFunction = "+doc.mutationFunction.code);
	eval("project.crossoverFunction = "+doc.crossoverFunction.code);
	
	///TODO: update estimatedTime, whit a test
	project.estimatedTime=1200;
	
	setSequenceId(function(){callback(true);});
	
      }else callback(false);
    });
    
  }
  
  function setSequenceId(callback){
    var group = {"$group":{_id:{},max:{"$max":"$_id"}}};
    
    populationCollection.aggregate([group],function(err,results){
      if(results.length>0)
	sequenceId = results[0].max;
      else
	sequenceId = 1;
      callback();
    });
  };
  
  // Find on database for population and saves in population array
  // Require a project configured
  function initPopulation(callback){
    
    // Starts all the generation with empty array
    for(var i=0;i<=project.generationLimit;i++){
      population[i]=new Array();
    }
   
    // Maybe be useful sort the population array,but not need now 
    ///var orderByGeneartionAndPosition = {sort:{generation:1,position:1}};
    ///var allDocuments = {};
    
    populationCollection.find().toArray(function(err,documents){
      if(err)callback(false);
						    
      for(var i=0;i<documents.length;i++){
	var aDocument = documents[i];
	population[aDocument.generation].push(aDocument);
      }
      callback(true);
      
    });
  }
  
  function createInitialPopulation(){
    var individuals = new Array();
    var count = countInGeneration(0);
    
    for(var i=count;i<project.populationTotal;i++){    
      var aChromosome=project.creationFunction(project.creationOptions);
      var aIndividual={
	_id:++sequenceId,
	generation:0,
	position:i,
	chromosome:aChromosome,
	inProcess:false
      };
      individuals.push(aIndividual);
    }
    
    if(individuals.length > 0){
      population[0]=individuals;
      populationCollection.insert(individuals,insertOptions,function(err){
	if(err)console.log("ERROR! populationCollection.insert individuals "+err);
	  populationCollection.count({generation:0},function(err,count){
	    if(err)console.log("ERROR! "+err);
	    console.log("createInitialPopulation : "+count+" individuals.");
	  });
      });    
    }
  }
  
  ///Search for a new project a initialize the first generation
  function initialize(){

    initProject(function(projectSuccess){
      
      if(projectSuccess){
	initPopulation(function(populationSuccess){
	  
	  var ammountInGeneration0 = countInGeneration(0);
	  
	  if(ammountInGeneration0 < project.populationTotal){
	    createInitialPopulation();
	  }
	  
	  mainCallback(null);
	  
	});
      }else{
	mainCallback(new Error("Project not found"));
      }
    });
  };
  initialize();
  
  requestRandomInteger = function(max){
    return Math.floor(Math.random()*max);
  }
  
  function calculateAmount(difference){
    ///The client should be busy for a minute
    var idealTime = 60 * 1000;
    
    ///The estimated time for a one job
    var idealAmount = Math.ceil(idealTime/project.estimatedTime);
    ///Hack idealAmount fot tests
    idealAmount = 1000;
    return Math.min(idealAmount,difference);
  }
  
  function getPossiblePositions(callback){
    
    var possiblePositions = new Array();
    var previousGeneration = actualGeneration -1 ;
    var deltaTimestamp = 10000;
    ///TODO update deltaTimestamp with a correct value
    
    for(var i=0;i<population[previousGeneration].length;i++){
      var aIndividual = population[previousGeneration][i];
      if(!aIndividual.inProcess){
	possiblePositions.push(aIndividual.position);
      }else{	
	if(new Date() - aIndividual.timestamp > deltaTimestamp){
	  possiblePositions.push(aIndividual.position);
	}
      }
    }
    
    return possiblePositions;    
  }
  
  function generateRandomPositions(ammount){
    var positions = new Array();
    var randomPositions = new Array();
    
    var possiblePositions = getPossiblePositions();
//     console.log('possiblePositions',JSON.stringify(possiblePositions.sort(sortNumbers)));
    console.log(possiblePositions.length,'possiblePositions.length');
    console.log(ammount,'ammount');
    var limite = Math.min(ammount,possiblePositions.length);
    // Mark positions to use 
    for(var i=0;i<limite;i++)
    {
      positions[i]=false;
      randomPositions[i]=false;
    }
      
    for(var i=0;i<limite;i++)
    {
      var random = requestRandomInteger(possiblePositions.length);
      while(positions[random]){
	random = requestRandomInteger(possiblePositions.length);
      }
      positions[random]=true;
      randomPositions[possiblePositions[random]]=true;
    }
    
    return randomPositions;
        
  }
  
  var sortNumbers = function(a,b){if(a<b)return -1;if(a>b)return 1;return 0};
  
  /// callback for return two variables
  function generateSubpopulation(difference,callback){
    
    var oldIds = new Array();
    var chromosomes = new Array();
    var realAmmount = calculateAmount(difference);    
    var randomPositions = generateRandomPositions(realAmmount);
    var previousGeneration = actualGeneration -1 ;
//     console.log('randomPositions',JSON.stringify(randomPositions.sort(sortNumbers)));
     console.log(randomPositions.length);
//     console.log(JSON.stringify(population));
  
    var populationInGeneration = population[previousGeneration];
     console.log(actualGeneration,'actualGeneration');
     console.log(populationInGeneration.length,'populationInGeneration.length');
    
    for(var i=0;i<populationInGeneration.length;i++){
     var aIndividual = populationInGeneration[i];
     var positionOfIndividual = aIndividual.position;
     
     if( randomPositions[positionOfIndividual] ){
	chromosomes.push(aIndividual.chromosome);
	//oldIds.push(individuals[i]._id);
	
	population[previousGeneration][i].inProcess = true;
	population[previousGeneration][i].timestamp = new Date();
      }
    }
   
    callback(chromosomes,oldIds);
    
  }
 
  function handleRequest(request,callback){
    
    if(actualGeneration <= project.generationLimit){
      
      var difference = project.populationTotal - countInGeneration(actualGeneration);
      if(difference > 0){
      
	generateSubpopulation(difference,function(subPopulation,oldIds){
	  console.log("ENVIO "+subPopulation.length+ " individuos");
	  
	  callback(project,subPopulation,oldIds,actualGeneration-1);
	});
      }else{
	callback(project,null);
      }
     
    }else{
      ///No more work
      callback(null,null);
    }
  };
  
  function requestToIndividuals(request){
    var individuals = new Array();
    var countIndividualsInGeneration = countInGeneration(request.generation);   
    var limit = Math.min(project.populationTotal,request.newChromosomes.length+countIndividualsInGeneration);
    
    for(var i=countIndividualsInGeneration;i<limit;i++){
      
      var aIndividual={
	_id:++sequenceId,
	generation:parseInt(request.generation),
	position:i,
	chromosome:request.newChromosomes[i-countIndividualsInGeneration],
	inProcess:false
      };
      individuals.push(aIndividual);
    }
    return individuals;
  }
  
  function countInGeneration(generationNumber){
    return population[generationNumber].length;
  }
    
  function handleDeliver(request,callback){
        
    updateFitness(request.oldIds,request.fitness,request.generation);
    
    var individuals = requestToIndividuals(request);
    for(var i=0;i<individuals.length;i++){
      population[request.generation] = individuals;
    }
    
    if(countInGeneration(actualGeneration)==countInGeneration(actualGeneration+1)){
      actualGeneration++;
    }
        
    callback();
  };
  
  /*
   * Ids is sorted, and _id inside population too
   */ 
  function updateFitness(ids,fitness,generation){          
    var last = 0;
    var populationInGeneration = population[generation];
    for(var i=0;i<ids.length;i++){
      for(var j=last;j<populationInGeneration.length;j++){
	if(ids[i] == populationInGeneration[j]._id){
	  population[generation][j].fitness = fitness[i];
	  last = j;
	}
      }
    }   
  }
  
  function determineLastGenerationInBD(callback){
    var group = {"$group":{_id:"$generation",count:{"$sum":1}}};
    var sort = {"$sort":{_id:1}};
    var lastGenerationInBD = 0;
    
    populationCollection.aggregate([group,sort],function(err,results){
      
      for(var i=0;i<results.length;i++){
	lastGenerationInBD=results[i]._id;
	if(project.populationTotal>results[i].count){	  
	  i=results.length;
	}
      }
      
      callback(lastGenerationInBD);
    });

  }
  
  this.writeInBD = function(){
//     console.log('writeInBD');
    determineLastGenerationInBD(function(lastGenerationInBD){
// 	  console.log(lastGenerationInBD,'lastGenerationInBD');
      for(var g = lastGenerationInBD;g<actualGeneration;g++){
// 	console.log(g,'g');
	for(var i=0;i<population[g].length;i++){
// 	  console.log(i,'i');
	  var aIndividual = population[g][i];
	  if(!isNaN(aIndividual.fitness)){
	    var query = {generation:aIndividual.generation,position:aIndividual.position};
	    var options = {upsert:true};
	    
	    populationCollection.update(query,aIndividual,options,function(err,docs){
	      if(err)
		console.err("ERROR writeInBD populationCollection.update "+err);
	    });	    
	  }
	}
      }
    });
  }
    
  this.processCommunication= function (request,callback){
    
    //     console.log("\n---ACTION "+request.action+'---');
    console.log(actualGeneration,'actualGeneration');
    if(typeof request.action != 'undefined'){
      switch(request.action){
	case 'request':
	  handleRequest(request,function(project,subPopulation,oldIds,actualGeneration){	    
	    if(project == null){
	      // No more work, so finish
		var response = {finalized:true};
	    }else{
	      if(subPopulation == null){
		// More work, but not right now
		var response = {sleep:true};
	      }
	      else{
		/// More work
		  var response = {
		    generation:actualGeneration,
		    subPopulation:subPopulation,
		    estimatedTime:project.estimatedTime,
		    oldIds: oldIds
		  };
	      }	      
	      if(request.assignedProject == 'false'){
		response.assignedProject=project;
	      }
	    }
	    callback(null,JSON.stringify(response));
	  });
	  break;
	case 'deliver' :
	  request.newChromosomes = JSON.parse(request.newChromosomes)
	  request.fitness = JSON.parse(request.fitness);    
	  request.oldIds = JSON.parse(request.oldIds);
	  request.generation = parseInt(request.generation);
	  
	  handleDeliver(request,function(){
	    callback(null,JSON.stringify({ok:true}));
	  });
	  break;
      }
    }
  }  
}

module.exports = Server;