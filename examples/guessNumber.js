var mongo          = require('mongodb');
var MongoClient    = mongo.MongoClient;
var configuration  = require("../config/config.js");


function creationFunction() {
  var aChromosome = [];
  var i           = 0;
  for (i = 0; i < 10; i++) {
    aChromosome[i] = Math.ceil(Math.random() * 10);
  }
  return aChromosome;
}

function externalFunction(aChromosome) {
  var parameters = [];
  parameters.push("--secret");
  parameters.push("23,23");

  var program = aChromosome.join(",");
  parameters.push("--program");
  parameters.push(program);
  return parameters;
}

function mutationFunction(aChromosome) {
  var a = Math.random();
  var i = Math.ceil(Math.random() * aChromosome.length);
  if (i < 0) {
    i = 0;
  }
  if (i > aChromosome.length - 1) {
    i = aChromosome.length - 1;
  }
  if (a < 0.5) {
    aChromosome[i] = parseInt(aChromosome[i], 10) + 1;
  } else {
    aChromosome[i] = parseInt(aChromosome[i], 10) - 1;
  }

  var c = Math.random();
  if (c < 0.5) {
    aChromosome.push(Math.ceil(Math.random() * 10));
  } else {
    aChromosome.length = aChromosome.length - 1;
  }

  return aChromosome;
}

function crossoverFunction(aChromosome, otherChromosome) {
  var newChromosome = [];
  var which         = aChromosome.length > otherChromosome.length;
  var maxLength     = which ? aChromosome.length : otherChromosome.length;
  var minLength     = which ? otherChromosome.length : aChromosome.length;
  var difference    = Math.abs(aChromosome.length - otherChromosome.length);
  var point         = Math.ceil(Math.random() * difference);
  var i             = 0;

  for (i = 0; i < maxLength; i++) {
    if (which) {
      newChromosome[i] = aChromosome[i];
    } else {
      newChromosome[i] = otherChromosome[i];
    }
  }

  for (i = point; i < point + minLength; i++) {
    if (which) {
      newChromosome[i] = otherChromosome[i];
    } else {
      newChromosome[i] = aChromosome[i];
    }
  }

  return newChromosome;
}

var aMinute = 60 * 1000;

var aProject =
  { name               : 'guessNumbersOnePlayer',
    externalProgram    : './bin/GuessNumbersOnePlayer',
//    externalProgram    : './bin/test.sh',
    populationTotal    : 100,
    generationLimit    : 500,
    mattingPoolPercent : 0.60,
    mutationPercent    : 0.11,
    sleepTime          : aMinute,
    creationFunction   : mongo.Code(creationFunction),
    externalFunction   : mongo.Code(externalFunction),
    mutationFunction   : mongo.Code(mutationFunction),
    crossoverFunction  : mongo.Code(crossoverFunction),
    fitnessFunction    : mongo.Code("null"),
    creationOptions    : {},
    };

MongoClient.connect(configuration.urlMongo, function (err, database) {
  if (err) {
    console.log(err);
  }
  var projectsCollection   = database.collection("projects");

  projectsCollection.remove({}, function () {
    projectsCollection.insert(aProject, function (e) {
      if (e) {
        console.log(e);
      }
      database.dropCollection("population", function () {
        database.close();
      });
    });
  });
});
