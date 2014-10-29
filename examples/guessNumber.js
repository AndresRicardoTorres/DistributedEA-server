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
  parameters.push("17,13");

  var program = aChromosome.join(",");
  parameters.push("--program");
  parameters.push(program);
  return parameters;
}

function mutationFunction(aChromosome) {
  var action = Math.random();
  var random = 0;

  if (action < 0.5) {
    /// Modify a gen plus/minus one
    var select = Math.ceil(Math.random() * aChromosome.length);
    var newVal = 0;
    random     = Math.random();

    if (select < 0) {
      select = 0;
    }
    if (select > aChromosome.length - 1) {
      select = aChromosome.length - 1;
    }

    if (random < 0.5) {
      newVal = aChromosome[select] + 1;
    } else {
      newVal = aChromosome[select] - 1;
    }

    if (newVal < 0) {
      newVal = 0;
    }
    aChromosome[select] = newVal;
  } else {
    /// Change length chromosome
    random = Math.random();

    if (random < 0.5) {
      aChromosome.push(Math.ceil(Math.random() * 10));
    } else {
      aChromosome.length = aChromosome.length - 1;
    }
  }

  return aChromosome;
}

function crossoverFunction(aChromosome, otherChromosome) {
  var newChromosome = [];
  var which         = aChromosome.length > otherChromosome.length;
  var maxLength     = which ? aChromosome.length : otherChromosome.length;
  var minLength     = which ? otherChromosome.length : aChromosome.length;
  var point         = Math.ceil(Math.random() * minLength);
  var i             = 0;

  for (i = 0; i < maxLength; i++) {
    if (which) {
      newChromosome[i] = aChromosome[i];
    } else {
      newChromosome[i] = otherChromosome[i];
    }
  }

  for (i = point; i < minLength; i++) {
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
    externalProgram    : './bin/GuessNumberOnePlayer',
    populationTotal    : 1000,
    generationLimit    : 1000,
    mattingPoolPercent : 0.8,
    mutationPercent    : 0.3,
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
