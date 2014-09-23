var mongo          = require('mongodb');
var MongoClient    = mongo.MongoClient;
var configuration  = require("../config/config.js");

var aProject =
	{ name               : 'test_external'
	, externalProgram    : './guessNumbersOnePlayer'
	, populationTotal    : 10
	, generationLimit    : 5
	, mattingPoolPercent : 0.60
	, mutationPercent    : 0.11
	, creationFunction   : mongo.Code(creationFunction)
	, externalFunction   : mongo.Code(externalFunction)
	, mutationFunction   : mongo.Code(mutationFunction)
	, crossoverFunction  : mongo.Code(crossoverFunction)
	, fitnessFunction    : mongo.Code("null")
	, creationOptions    : {}
	, sleepTime          : 1 * 60 * 1000
	}

function creationFunction() {
	var aChromosome = Array();
	for (var i = 0; i < 10; i++)
	    aChromosome[i] = Math.ceil(Math.random()*10);
	return aChromosome;
}

function externalFunction(aChromosome){
	var parameters = new Array();
	parameters.push("--secret 23,23");
	var program = aChromosome.join(",");
	parameters.push("--program " + program);
	return parameters;
}

function mutationFunction(aChromosome) {
	var a = Math.random();
	var i = Math.ceil(Math.random() * aChromosome.length);
	if(i < 0)
		i = 0;
	if(i > aChromosome.length-1)
		i = aChromosome.length - 1;
	if( a < 0.5)
	  aChromosome[i] = parseInt(aChromosome[i]) + 1;
	else
	  aChromosome[i] = parseInt(aChromosome[i]) - 1;

	var c = Math.random();
	if( c < 0.5)
		aChromosome.push(Math.ceil(Math.random()*10));
	else
		aChromosome.length = aChromosome.length - 1;

	return aChromosome;
}

function crossoverFunction(aChromosome, otherChromosome) {
	var newChromosome = new Array();
	var which         = aChromosome.length > otherChromosome.length;
	var maxLength     = which ? aChromosome.length : otherChromosome.length;
	var minLength     = which ? otherChromosome.length : aChromosome.length;
	var difference    = Math.abs(aChromosome.length - otherChromosome.length);
	var point         = Math.ceil(Math.random() * difference);

	for (var i=0; i < maxLength; i++) {
	    if(which){
	      newChromosome[i] = aChromosome[i];
	    }else{
	      newChromosome[i] = otherChromosome[i];
	    }
	}

	for(var i=point; i < point + minLength; i++) {
		if(which){
	      newChromosome[i] = otherChromosome[i];
	    }else{
	      newChromosome[i] = aChromosome[i];
	    }
	}

	return newChromosome;
}


MongoClient.connect(configuration.urlMongo, function(err, database) {
 	var projectsCollection  = database.collection("projects");
  	var populationCollection = database.collection("population");

  	projectsCollection.remove({},function(){
    projectsCollection.insert(aProject,function(e,d){
      	if(e)
      		console.log(e);
		database.dropCollection("population",function(){
			database.close();
		});
    });
  });
});
