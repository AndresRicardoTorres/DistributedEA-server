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
	populationCollection.count({},function(err,count){
// 	  console.log(project.populationTotal,'project.populationTotal');
	  
	  for(var i=count;i<project.populationTotal;i++){
	    console.log(i);
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
      }else{
	///TODO:remove this, create a test project
	//projectsCollection.insert({a:1},function(){});
	
	projectsCollection.insert({
	  name:'test_project',
	  populationTotal:100,
	  generationLimit:100,
	  mattingPoolPercent:0.50,
	  mutationPercent:0.11,
	  creationFunction:mongo.Code(function(){
	    var cromosoma = Array();
	      for (var i = 0; i < 10; i++) {
		  cromosoma[i] = Math.ceil(Math.random()*10);
	      }
	      return cromosoma;
	  }),
	  fitnessFunction:mongo.Code(function(aChromosome){
	    var total=0;
	    for (var i = 0; i < 10; i++) {
		total += parseInt(aChromosome[i]);
	    }
	    return Math.abs(total-100)*-1;
	  }),
	  mutationFunction:mongo.Code(function(aChromosome){
	    var a=Math.random();
	    var i = Math.ceil(Math.random()*aChromosome.length);
	    if(i<0)i=0;
	    if(i>aChromosome.length-1)i=aChromosome.length-1;
	    if(a<0.5)
	      aChromosome[i]= parseInt(aChromosome[i])+1;
	    else
	      aChromosome[i]= parseInt(aChromosome[i])-1;
	    return aChromosome;
	  }),
	  crossoverFunction:mongo.Code(function(aChromosome,otherChromosome){
	    var newChromosome = new Array();
	    for (var i = 0; i < 10; i++) {
		if(5>i){
		  newChromosome[i]=aChromosome[i];
		}else{
		  newChromosome[i]=otherChromosome[i];
		}
	    }
	    return newChromosome;
	  })
	},function(err){
	  if(err)console.log("ERROR!"+err);
	});
      }
      getActualGeneration(0,function(){
	  if(project === null || actualGeneration === null){
	    mainCallback(false);
	  }else{
	    mainCallback(true);
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
    
    var randomPositions = new Array();
    for(var i=0;i<realAmmount;i++)
    {
      randomPositions.push(requestRandomInteger(project.populationTotal));
    }
//     console.log(randomPositions,'randomPositions');
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
    var nextGeneration = actualGeneration+1;
    populationCollection.count({generation:nextGeneration},function(err,countNextGeneration){
      var difference = project.populationTotal -countNextGeneration;
      if(difference>0)
      {	
	callback(difference);
      }else{
	actualGeneration++;
	searchNextGeneration(callback);
      }
    });
  }
    
  this.handleRequest= function(request,callback){
    console.log("handleRequest");
    
    if(actualGeneration < project.generationLimit){
      searchNextGeneration(function(difference){
 	console.log(difference,'difference');
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
    console.log(request.newChromosomes.length,'ME LLEGARON');
    populationCollection.count({generation:request.generation},function(err,countGeneration){
    for(var i=0;i<request.newChromosomes.length;i++){
      
	var aIndividual={
	  generation:parseInt(request.generation),
	  position:countGeneration+i+1,
	  chromosome:request.newChromosomes[i],
	  fitness:request.fitness[i]
	};
	populationCollection.insert(aIndividual,function(){
	  callback();
	});
      
      }
    });
  };
  
  
}

module.exports = Server;