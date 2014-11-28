function creationFunction(options) {
  var N      = options.N;
  var chromosome = [];
  var values = [];
  var i      = 0;
  var idx    = 0;

  for (i = 0; i < N; i++) {
    values[i] = false;
  }

  for (i = 0; i < N; i++) {
    idx = parseInt(Math.random() * N, 10);
    while (values[idx]) {
      idx = parseInt(Math.random() * N, 10);
    }
    values[idx]   = true;
    chromosome[i] = idx;
  }
  return chromosome;
}

function fitnessFunction(aChromosome) {
  var N              = aChromosome.length;
  var queensInAttack = 0;
  var i              = 0;
  var j              = 0;

  for (i = 0; i < N - 1; i++) {
    for (j = i + 1; j < N; j++) {
      if (aChromosome[i] + i === aChromosome[j] + j
          || aChromosome[i] - i === aChromosome[j] - j) {
        queensInAttack += 2;
      }
    }
  }
  return queensInAttack * -1;
}

function mutationFunction(aChromosome) {
  var N          = aChromosome.length;
  var X          = parseInt(Math.random() * N, 10);
  var Y          = parseInt(Math.random() * N, 10);
  var tmp        = aChromosome[X];
  aChromosome[X] = aChromosome[Y];
  aChromosome[Y] = tmp;

  return aChromosome;
}

//This is a PMX implementation
function crossoverFunction(aChromosome, otherChromosome) {
  var N             = aChromosome.length;
  var newChromosome = [];
  //Select the points to cross
  var startIdx = parseInt(Math.random() * N, 10);
  var endIdx   = parseInt(Math.random() * N, 10);
  var tmp      = 0;
  var i        = 0;
  var idx      = 0;
  var oldIdx   = 0;

  while (startIdx === endIdx) {
    endIdx = parseInt(Math.random() * N, 10);
  }

  if (startIdx > endIdx) {
    tmp      = endIdx;
    endIdx   = startIdx;
    startIdx = tmp;
  }

  //Construct the new chromosome
  newChromosome = [];
  newChromosome.length = startIdx;
  tmp           = otherChromosome.slice(startIdx, endIdx);
  newChromosome = newChromosome.concat(tmp);
  tmp           = [];
  tmp.length    = N - endIdx;
  newChromosome = newChromosome.concat(tmp);

  for (i = 0; i < N; i++) {
    if (i < startIdx || i >= endIdx) {
      idx = i;
      while (idx !== -1) {
        oldIdx = idx;
        idx    = newChromosome.indexOf(aChromosome[oldIdx]);
      }
      newChromosome[i] = aChromosome[oldIdx];
    }
  }

  return newChromosome;
}

var aProject =
  { name               : 'nqueens_project',
    externalProgram    : null,
    populationTotal    : 1000,
    generationLimit    : 100,
    mattingPoolPercent : 0.60,
    mutationPercent    : 0.11,
    sleepTime          : 60 * 1000,
    creationFunction   : creationFunction,
    fitnessFunction    : fitnessFunction,
    mutationFunction   : mutationFunction,
    crossoverFunction  : crossoverFunction,
    externalFunction   : null,
    creationOptions    : {N : 50}
    };

module.exports = aProject;
