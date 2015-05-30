function creationFunction(options) {
  var N      = options.N;
  var chromosome = [];
  var values = [];
  var i      = 0;
  var idx    = 0;

  for (i = 0; i < N; i++) {
    chromosome[i] = parseInt(Math.random() * N, 10);
  }
  return chromosome;
}

function fitnessFunction(aChromosome) {
  var N = aChromosome.length;
  var c = 0;
  var i              = 0;
  var j              = 0;

  for (i = 0; i < N - 1; i++) {
    if(aChromosome[i] % 2 == 0){
      c++;
    }
  }
  return c;
}

function mutationFunction(aChromosome) {
  var N          = aChromosome.length;
  var X          = parseInt(Math.random() * N, 10);
  aChromosome[X] = aChromosome[X] + 1;

  return aChromosome;
}

//This is a PMX implementation
function crossoverFunction(aChromosome, otherChromosome) {
  if(Math.random() < 0.5){
    return aChromosome;
  }
  else {
    return otherChromosome;
  }
}

function externalFunction() {
  return "This project does not use extenalFunction nor externalProgram";
}

var aProject =
  { name               : 'simple1',
    externalProgram    : "",
    populationTotal    : 100,
    generationLimit    : 1000,
    mutationPercent    : 0.5,
    sleepTime          : 10 * 1000,
    creationFunction   : creationFunction,
    fitnessFunction    : fitnessFunction,
    mutationFunction   : mutationFunction,
    crossoverFunction  : crossoverFunction,
    externalFunction   : externalFunction,
    creationOptions    : {N : 10},
    stopFitnessZero    : false
    };

module.exports = aProject;
