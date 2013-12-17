var MongoClient = require('mongodb').MongoClient;
var configuration = require("./config.js");

MongoClient.connect(configuration.urlMongo, function(err, db) {
    var projectsCollection = database.collection("projects");
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