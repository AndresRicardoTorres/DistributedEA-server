var MongoClient = require('mongodb').MongoClient;
var configuration = require("../config/config.js");
var mongo = require('mongodb');

var aProject = {
	  name:'nqueens_project',
	  populationTotal:100,
	  generationLimit:100,
	  mattingPoolPercent:0.60,
	  mutationPercent:0.11,
	  creationFunction:mongo.Code(creationFunction),
	  fitnessFunction:mongo.Code(fitnessFunction),
	  mutationFunction:mongo.Code(mutationFunction),
	  crossoverFunction:mongo.Code(crossoverFunction),
	  creationOptions:{N:100},
	  sleepTime : 1 * 60 * 1000
}


function creationFunction(options){
  var N = options.N;
  var values = new Array();
  for(var i=0;i<N;i++){
    values[i]=false;
  }
  
  var chromosome = new Array();
  for(var i=0;i<N;i++){
    var idx=parseInt(Math.random()*N);
    while(values[idx]){      
      idx=parseInt(Math.random()*N);
    }
    values[idx]=true;
    chromosome[i]=idx;
  }
  return chromosome;
}

function fitnessFunction(aChromosome){
  var queensInAttack=0;
  var N = aChromosome.length;
  
  //Las horizontales y las verticales están garantizadas por la codificación del cromosoma
  for (var i=0; i< N-1; i++){
    for (var j=i+1; j < N; j++){
      if(aChromosome[i]+i == aChromosome[j]+j
	|| aChromosome[i]-i == aChromosome[j]-j){
	queensInAttack+=2;
      }
    }
  }
  return queensInAttack;
}

function mutationFunction(aChromosome){
  var N = aChromosome.length;
  var x=parseInt(Math.random()*N);
  var y=parseInt(Math.random()*N);
  
  var tmp=aChromosome[x];
  aChromosome[x]=aChromosome[y];
  aChromosome[y]=tmp;
  
  return aChromosome;
}

function crossoverFunction(aChromosome,otherChromosome){
  //This is a PMX implementation
  var N = aChromosome.length;
  
  //Select the points to cross
  var startIdx = parseInt(Math.random()*N);
  var endIdx = parseInt(Math.random()*N);
  while (startIdx == endIdx){
    endIdx = parseInt(Math.random()*N);
  }
//   console.log(startIdx,endIdx);
  if (startIdx > endIdx){
    var tmp=endIdx;
    endIdx=startIdx;
    startIdx=tmp;
  }
  
  //Construct the new chromosome
  var newChromosome = new Array(startIdx);
  newChromosome=newChromosome.concat(otherChromosome.slice(startIdx,endIdx));
  newChromosome=newChromosome.concat(new Array(N-endIdx));
  
  for (var i=0; i<N; i++){
    if(i < startIdx || i >= endIdx){
      var idx=i;
      var oldIdx;
      while (idx != -1){
	oldIdx=idx;
	idx=newChromosome.indexOf(aChromosome[oldIdx]);
      }
      newChromosome[i] = aChromosome[oldIdx];
    }
  }
  
//   console.log(newChromosome);
  return newChromosome;
}

crossoverFunction([1,2,3,4,5,6,7,8],[5,6,2,3,4,1,7,8]);

MongoClient.connect(configuration.urlMongo, function(err, database) {
  var projectsCollection = database.collection("projects");
  projectsCollection.remove({},function(){
    projectsCollection.insert(aProject,function(e,d){
      if(e)console.log(e);
			      database.close();
    });  
  });
  
});