var mongo = require('mongodb');

function Server(database,mainCallback){
  
  var actualGeneration=null;
  var project=null;
  var projectsCollection = database.collection("projects");
  var populationCollection = database.collection("population");
  //   var insertOptions = {w:"majority"};
  var insertOptions = {};
  var updateOptions = {multi:true,safe:true};
  var population = new Array();
  
  
  function initProject(callback){
    //Should be one for the moment
    projectsCollection.findOne({},function(err,doc){
      if(err)callback(false);
			       
	if(doc != null){
	
	project = {};
	project.populationTotal = doc.populationTotal;
	project.generationLimit = doc.generationLimit;
	project.mutationPercent = doc.mutationPercent;
	project.mattingPoolPercent = doc.mattingPoolPercent;
	project.creationOptions = doc.creationOptions;
	
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
	
	callback(true);
      }else callback(false);
    });
    
  }
  
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
	    console.log("Se crearon "+count+" indiviudos inciales.");
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
    ///TODO clean inProcess with timestamp higher
    
    var possiblePositions = new Array();
    var previousGeneration = actualGeneration -1 ;
    
    for(var i=0;i<population[previousGeneration].length;i++){
      var aIndividual = population[previousGeneration][i];
      if(!aIndividual.inProcess){
	possiblePositions.push(aIndividual.position);
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
//     console.log(randomPositions.length);
//     console.log(JSON.stringify(population));
  
    var populationInGeneration = population[previousGeneration];
//     console.log(actualGeneration,'actualGeneration');
//     console.log(populationInGeneration.length,'populationInGeneration.length');
    
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
    console.log(JSON.stringify(chromosomes),'chromosomes chromosomes');
    callback(chromosomes,oldIds);
    
  }
 
  function calculateDifferenceInGeneration(){
    
    if(actualGeneration == null)
      actualGeneration=0;
    
//     console.log('calculateDifferenceInGeneration');
//     console.log(countInGeneration(actualGeneration),'countInGeneration(actualGeneration)');
//     console.log(project.populationTotal,'project.populationTotal');
    
    while(countInGeneration(actualGeneration) >= project.populationTotal){      
      actualGeneration++;
      console.log('AUMENTO GENERACION');      
    }
    var diff = project.populationTotal - countInGeneration(actualGeneration);
    return diff;
  }
  
  function handleRequest(request,callback){
    
    if(actualGeneration < project.generationLimit){
      
      var difference = calculateDifferenceInGeneration();
      console.log('FALTAN '+difference+" EN LA GENERACION "+(actualGeneration));
      
      generateSubpopulation(difference,function(subPopulation,oldIds){
	console.log("ENVIO "+subPopulation.length+ " individuos");
	
	callback(subPopulation,oldIds,project,actualGeneration-1);
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
  
  function countInGeneration(generationNumber){
    return population[generationNumber].length;
  }
  
  ///TODO:Update statics
  function handleDeliver(request,callback){
    console.log("Llegaron "+request.newChromosomes.length);
    
    ///TODO convert syncronius update functions
    //updateInProcess(request.oldIds);
    //updateFitness(request.oldIds,request.fitness);
    
    var countIndividualsInGeneration = countInGeneration(request.generation);   
  
    console.log("Hay"+ countIndividualsInGeneration+" en la generation "+request.generation+" en la BD");
    
    var individuals = requestToIndividuals(request,countIndividualsInGeneration);
    for(var i=0;i<individuals.length;i++){
      population[request.generation] = individuals;
    }
    
    var countIndividualsInGeneration = countInGeneration(request.generation);
    console.log("Ahora hay"+ countIndividualsInGeneration+" en la generation "+request.generation+" en la BD");
   
    callback();
    
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
    console.log(actualGeneration,'actualGeneration');
    if(typeof request.action != 'undefined'){
      switch(request.action){
	case 'request':
	  handleRequest(request,function(subPopulation,oldIds,project,actualGeneration){
	    
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
	  
	  handleDeliver(request,function(){
	    callback(null,JSON.stringify({ok:true}));
	  });
	  break;
      }
    }
  }  
}

module.exports = Server;