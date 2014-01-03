var MongoClient = require('mongodb').MongoClient;
var configuration = require("../config/config.js");
var mongo = require('mongodb');

var aProject = {
	  name:'nqueens_project',
	  populationTotal:1000,
	  generationLimit:10,
	  mattingPoolPercent:0.60,
	  mutationPercent:0.11,
	  creationFunction:mongo.Code(creationFunction),
	  fitnessFunction:mongo.Code(fitnessFunction),
	  mutationFunction:mongo.Code(mutationFunction),
	  crossoverFunction:mongo.Code(crossoverFunction),
	  creationOptions:{N:1000}	  
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
//       console.log("i "+i+"j "+j);
      if(aChromosome[i]+i == aChromosome[j]+j
	|| aChromosome[i]-i == aChromosome[j]-j){
// 	console.log(aChromosome[i]+i == aChromosome[j]+j);
// 	console.log(aChromosome[i]-i == aChromosome[j]-j);
	queensInAttack+=2;
      }
    }
  }
  return queensInAttack;
}

console.log(fitnessFunction([0,1,3,2]));
console.log(fitnessFunction([1,2,3,0]));
console.log(fitnessFunction([2,0,3,1]));
console.log(fitnessFunction([0,1,2,3]));
console.log(fitnessFunction([3,2,1,0]));

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
  return aChromosome;
  var newChromosome = new Array();
  
  var values = new Array();
  for(var i=0;i<aChromosome.length;i++){
    values[i]=true;
  }
  ///TODO hacer aleatorio el punto de corte
  for(var i=0;i<Math.ceil(aChromosome.length/2);i++){
    newChromosome[i]=aChromosome[i];
    values[ aChromosome[i] ] = false;
  }
  
  for(var i=0;i<otherChromosome.length;i++)
  {
    if(values[ otherChromosome[i] ]){
      newChromosome.push(otherChromosome[i]);
      values[ otherChromosome[i] ]=false;
    }
  }
  
  return newChromosome;
}

MongoClient.connect(configuration.urlMongo, function(err, database) {
  var projectsCollection = database.collection("projects");
  projectsCollection.remove({},function(){
    projectsCollection.insert(aProject,function(e,d){
      if(e)console.log(e);
			      database.close();
    });  
  });
  
});