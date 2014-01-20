function Server(database,mainCallback){
  
  var projectsCollection = database.collection("projects");
  var populationCollection = database.collection("population"); 
  var population = new Array();
  var lockWriteInDB=false;
  var actualGenerationInDB=null;
  var actualGeneration=null;
  var project=null;
  var sequenceId = null;
  initialize();
    
  function initProject(callback){
    console.log('initProject');
    //Should be one for the moment
    projectsCollection.findOne({},function(err,doc){
      if(err)callback(false);
			       
	if(doc != null){
	
	project = {};
	project.populationTotal = doc.populationTotal;
	project.generationLimit = doc.generationLimit;
	project.mutationPercent = doc.mutationPercent;
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
  function loadPopulation(generation,callback){
    console.log('loadPopulation');
    var query = {generation:generation};
    var options = {sort:{_id:1}};
    populationCollection.find(query,options).toArray(function(err,documents){
      if(err)callback(false);	    
      for(var i=0;i<documents.length;i++){
	var aDocument = documents[i];
	population[generation].push(aDocument);
      }
      actualGeneration=generation;
      actualGenerationInDB=generation;
      callback(true);      
    });    
  }
    
  function initPopulation(){    
    // Starts all the generation with empty array
    for(var i=0;i<=project.generationLimit;i++){
      population[i]=new Array();
    }
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
    population[0]=individuals; 
    actualGeneration=0;
    actualGenerationInDB=-1;
  }
  
  function determineLastGenerationInBD(callback){
    console.log('determineLastGenerationInBD');
    var group = {"$group":{_id:"$generation",count:{"$sum":1}}};
    var sort = {"$sort":{_id:1}};
    var limit = {"$limit":1};
    var lastGenerationInBD = 0;
    
    populationCollection.aggregate([group,sort,limit],function(err,results){
      lastGenerationInBD = results.length == 0 ?  -1 : results[0]._id;	
      callback(lastGenerationInBD);
    });
  }
  
  ///Search for a new project a initialize the first generation
  function initialize(){
    initProject(function(projectSuccess){      
      if(projectSuccess){
	determineLastGenerationInBD(function(lastGenerationInBD){
	  console.log(lastGenerationInBD,'lastGenerationInBD');
	  initPopulation();
	  if(lastGenerationInBD == -1){
	    createInitialPopulation();
	    mainCallback();
	  }
	  else{
	    loadPopulation(lastGenerationInBD,function(populationSuccess){
	      if(populationSuccess)
		mainCallback();
	      else
		mainCallback(new Error("Population not created"));
	    });
	  }
	})
      }else{
	mainCallback(new Error("Project not found"));
      }
    });
  };
  
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
    var deltaTimestamp = 10000;
    ///TODO update deltaTimestamp with a correct value
    
    for(var i=0;i<population[actualGeneration].length;i++){
      var aIndividual = population[actualGeneration][i];
      if(!aIndividual.inProcess){
	possiblePositions.push(i);
      }else{	
	if(new Date() - aIndividual.timestamp > deltaTimestamp){
	  possiblePositions.push(i);
	}
      }
    }
    
    return possiblePositions;    
  }
  
  function generateRandomPositions(ammount){
    var positions = new Array();
    var randomPositions = new Array();
    
    var possiblePositions = getPossiblePositions();

    var limite = Math.min(ammount,possiblePositions.length);
    // Mark positions to use 
    for(var i=0;i<limite;i++){
      positions[i]=false;      
    }
      
    for(var i=0;i<limite;i++)
    {
      var random = requestRandomInteger(possiblePositions.length);
      while(positions[random]){
	random = requestRandomInteger(possiblePositions.length);
      }
      positions[random]=true;      
      randomPositions.push(possiblePositions[random]);
    }
    
    return randomPositions;
        
  }
  
  /// callback for return two variables
  function generateSubpopulation(realAmmount,callback){    
    var oldIds = new Array();
    var chromosomes = new Array();        
    var randomPositions = generateRandomPositions(realAmmount);    
    randomPositions.forEach(function(aRandomPosition){
	aIndividual=population[actualGeneration][aRandomPosition];
	chromosomes.push(aIndividual.chromosome);
	oldIds.push(aIndividual._id);
	population[actualGeneration][aRandomPosition].inProcess = true;
	population[actualGeneration][aRandomPosition].timestamp = new Date();
    });
    callback(chromosomes,oldIds);    
  }
 
  function handleRequest(request,callback){    
    if(actualGeneration < project.generationLimit){      
      var difference = project.populationTotal - countInGeneration(actualGeneration+1);
      if(difference > 0){
	var realAmmount = calculateAmount(difference);
	generateSubpopulation(realAmmount,function(subPopulation,oldIds){
	  callback(project,subPopulation,oldIds);
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
        
    updateFitness(request.oldIds,request.fitness,request.generation-1);
    
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
   * _id inside population too
   */ 
  function updateFitness(ids,fitness,generation){
//     var sortNumbers = function(a,b){if(a<b)return -1;if(a>b)return 1;return 0};
    var last = 0;
    var populationInGeneration = population[generation];
    for(var i=0;i<ids.length;i++){
      for(var j=last;j<populationInGeneration.length;j++){
	if(ids[i] == populationInGeneration[j]._id){
	  population[generation][j].fitness = fitness[i];
// 	  last = j;
	  last=0;
	}
      }
    }
  }
  
  this.writeInDB = function(){
    console.log('writeInDB');
    if(!lockWriteInDB){
	lockWriteInDB = true;
	var insert_population = [];
	var limit = actualGeneration;
	///limit because population in the actual doesn't have fitness
	console.log(actualGenerationInDB,'actualGenerationInDB');
	console.log(actualGeneration,'actualGeneration');
	console.log(limit,'limit');
	for(var i=actualGenerationInDB+1;i<limit;i++){
	  console.log(population[i].length,'population[i].length '+i);
	  insert_population = insert_population.concat(population[i]);
	}
	actualGenerationInDB=limit-1;
	console.log(insert_population.length,'insert_population.length');
	populationCollection.insert(insert_population,function(err,documents){
	  lockWriteInDB=false;
	});
    }
  }
    
  this.processCommunication= function (request,callback){
    
    if(typeof request.action != 'undefined'){
      switch(request.action){
	case 'request':
	  handleRequest(request,function(project,subPopulation,oldIds){
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
