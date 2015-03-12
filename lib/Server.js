/*jslint indent: 2, evil: true, nomen: true*/
'use strict';
var async = require("async");

function Server(database, projectName, mainCallback) {

  var actualGeneration   = null,
    actualGenerationInDB = null,
    functionsCollection  = database.collection("functions"),
    lockWriteInDB        = false,
    population           = [],
    populationCollection = database.collection("population_" + projectName),
    project              = null,
    projectsCollection   = database.collection("projects"),
    sequenceId           = null;

  this.getGeneration = function () {
    return actualGeneration;
  };

  this.getGenerationLimit = function () {
    return project.generationLimit;
  };

  function setSequenceId(callback) {
    var group = {"$group": {'_id': {}, max: {"$max": "$_id"}}};

    populationCollection.aggregate([group], function (err, results) {
      if (err) {
        console.error(err);
      }
      if (results.length > 0) {
        sequenceId = results[0].max;
      } else {
        sequenceId = 1;
      }
      callback();
    });
  }

  function initProject(callback) {
    var filter = {finalized: {"$exists": false}, name: projectName};
    projectsCollection.findOne(filter, function (err, doc) {
      if (err) {
        callback(false);
      }

      if (doc !== null) {

        project = {};
        project.creationOptions    = doc.creationOptions;
        project.externalProgram    = doc.externalProgram;
        project.generationLimit    = doc.generationLimit;
        project.mattingPoolPercent = doc.mattingPoolPercent;
        project.mutationPercent    = doc.mutationPercent;
        project.populationTotal    = doc.populationTotal;
        project.sharedFunctions    = doc.sharedFunctions;
        project.sleepTime          = doc.sleepTime;

        project.creationFunctionString  = doc.creationFunction.code;
        project.fitnessFunctionString   = doc.fitnessFunction.code;
        project.mutationFunctionString  = doc.mutationFunction.code;
        project.crossoverFunctionString = doc.crossoverFunction.code;
        project.externalFunctionString  = doc.externalFunction.code;
        eval("project.creationFunction = "  + doc.creationFunction.code);
        eval("project.fitnessFunction = "   + doc.fitnessFunction.code);
        eval("project.mutationFunction = "  + doc.mutationFunction.code);
        eval("project.crossoverFunction = " + doc.crossoverFunction.code);
        eval("project.externalFunction = "  + doc.externalFunction.code);

        project.estimatedTime = 1200;

        setSequenceId(function () {
          callback(true);
        });

      } else {
        callback(false);
      }
    });
  }

  // Find on database for population and saves in population array
  // Require a project configured
  function loadPopulation(generation, callback) {
    var query     = {generation: generation},
      options   = {sort: {'_id': 1}},
      i         = 0,
      aDocument = null;
    populationCollection.find(query, options)
      .toArray(function (err, documents) {
        if (err) {
          callback(false);
        }
        for (i = 0; i < documents.length; i += 1) {
          aDocument = documents[i];
          population[generation].push(aDocument);
        }
        actualGeneration     = generation;
        actualGenerationInDB = generation;
        callback(true);
      });
  }

  function initPopulation() {
    // Starts all the generation with empty array
    var i = 0;
    for (i = 0; i <= project.generationLimit; i += 1) {
      population[i] = [];
    }
  }

  function countInGeneration(generationNumber) {
    return population[generationNumber].length;
  }

  function createInitialPopulation() {
    var individuals = [],
      count       = countInGeneration(0),
      i           = 0,
      aChromosome = null,
      aIndividual = null;

    for (i = count; i < project.populationTotal; i += 1) {
      aChromosome = project.creationFunction(project.creationOptions);
      aIndividual = {
        '_id'     : sequenceId,
        generation: 0,
        position  : i,
        chromosome: aChromosome,
        inProcess :  false
      };
      sequenceId += 1;
      individuals.push(aIndividual);
    }
    population[0]        = individuals;
    actualGeneration     = 0;
    actualGenerationInDB = -1;
  }
  function createFunction() {
    var aFunction = [],
      i           = 0;
    for (i = 0; i < 10; i += 1) {
      aFunction[i] = Math.ceil(Math.random() * 100);
    }
    return aFunction;
  }

  function createSharedFunctions(callback) {
    if (project.sharedFunctions) {
      functionsCollection.count(function (err, count) {
        if (err) {
          console.error(err);
        }
        var functions = [],
          i           = count,
          aFunction   = null;

        for (i = count; i < 100; i += 1) {
          aFunction = { id: i, counter: 0, code: createFunction()};
          functions.push(aFunction);
        }
        if (functions.length > 0) {
          functionsCollection.insert(functions, function (err) {
            if (err) {
              console.error(err);
            }
            console.log("Created " + functions.length + " shared functions");
            callback();
          });
        } else {
          callback();
        }
      });
    } else {
      callback();
    }
  }

  function determineLastGenerationInBD(callback) {

    var group = {"$group": {'_id': "$generation", count: {"$sum": 1} }},
      sort    = {"$sort": {'_id': 1}},
      limit   = {"$limit": 1},
      lastGenerationInBD = 0;

    populationCollection.aggregate([group, sort, limit],
      function (err, results) {
        if (err) {
          console.error(err);
        }
        lastGenerationInBD = results.length === 0 ? -1 : results[0]._id;
        callback(lastGenerationInBD);
      });
  }

  ///Search for a new project and initialize the first generation
  function initialize() {
    initProject(function (projectSuccess) {
      if (projectSuccess) {
        determineLastGenerationInBD(function (lastGenerationInBD) {
          initPopulation();
          if (lastGenerationInBD === -1) {
            createInitialPopulation();
            createSharedFunctions(function () {
              mainCallback();
            });
          } else {
            loadPopulation(lastGenerationInBD, function (populationSuccess) {
              if (populationSuccess) {
                mainCallback();
              } else {
                mainCallback(new Error("Population not created"));
              }
            });
          }
        });
      } else {
        mainCallback(new Error("Project not found"));
      }
    });
  }

  initialize();

  function requestRandomInteger(max) {
    return Math.floor(Math.random() * max);
  }

  function calculateAmount(difference) {
    ///The client should be busy for a minute
    var idealTime   = 60 * 1000,
    ///The estimated time for a one job
      idealAmount = Math.ceil(idealTime / project.estimatedTime);
    ///Hack idealAmount for tests
    idealAmount     = 498;
    return Math.min(idealAmount, difference);
  }

  function getPossiblePositions() {

    var possiblePositions = [],
      deltaTimestamp    = 10000,
      i                 = 0,
      aIndividual       = null;

    for (i = 0; i < population[actualGeneration].length; i += 1) {
      aIndividual = population[actualGeneration][i];
      if (!aIndividual.inProcess) {
        possiblePositions.push(i);
      } else {
        if (new Date() - aIndividual.timestamp > deltaTimestamp) {
          possiblePositions.push(i);
        }
      }
    }

    return possiblePositions;
  }

  function generateRandomPositions(ammount) {
    var positions         = [],
      randomPositions   = [],
      possiblePositions = getPossiblePositions(),
      limite            = Math.min(ammount, possiblePositions.length),
      i                 = 0,
      random            = 0;

    // Mark positions to use
    for (i = 0; i < limite; i += 1) {
      positions[i] = false;
    }

    for (i = 0; i < limite; i += 1) {
      random = requestRandomInteger(possiblePositions.length);
      while (positions[random]) {
        random = requestRandomInteger(possiblePositions.length);
      }
      positions[random] = true;
      randomPositions.push(possiblePositions[random]);
    }

    return randomPositions;
  }

  /// callback for return two variables
  function generateSubpopulation(realAmmount, callback) {
    var oldIds          = [],
      chromosomes     = [],
      randomPositions = generateRandomPositions(realAmmount),
      aIndividual     = null;

    randomPositions.forEach(function (aRandomPosition) {
      aIndividual = population[actualGeneration][aRandomPosition];
      chromosomes.push(aIndividual.chromosome);
      oldIds.push(aIndividual._id);
      population[actualGeneration][aRandomPosition].inProcess = true;
      population[actualGeneration][aRandomPosition].timestamp = new Date();
    });
    callback(chromosomes, oldIds);
  }

  function handleRequest(callback) {
    if (actualGeneration < project.generationLimit) {
      var realAmmount = 0,
        difference = project.populationTotal
          - countInGeneration(actualGeneration + 1);
      if (difference > 0) {
        realAmmount = calculateAmount(difference);
        generateSubpopulation(realAmmount, function (subPopulation, oldIds) {
          callback(project, subPopulation, oldIds);
        });
      } else {
        callback(project, null);
      }
    } else {
      ///No more work
      callback(null, null);
    }
  }

  function requestToIndividuals(request) {
    var individuals                  = [],
      countIndividualsInGeneration = countInGeneration(request.generation),
      limit                        = Math.min(project.populationTotal,
        request.newChromosomes.length + countIndividualsInGeneration),
      i                            = 0,
      aIndividual                  = null;

    for (i = countIndividualsInGeneration; i < limit; i += 1) {
      aIndividual = {
        '_id'      : sequenceId,
        generation : parseInt(request.generation, 10),
        position   : i,
        chromosome : request.newChromosomes[i - countIndividualsInGeneration],
        inProcess  : false
      };
      sequenceId += 1;
      individuals.push(aIndividual);
    }
    return individuals;
  }

  /*
   * _id inside population too
   */
  function updateFitness(ids, fitness, generation) {
//     var sortNumbers = function(a,b){if(a<b)return -1;if(a>b)return 1;return 0};
    var populationInGeneration = population[generation],
      last                   = 0,
      i                      = 0,
      j                      = 0;

    for (i = 0; i < ids.length; i += 1) {
      for (j = last; j < populationInGeneration.length; j += 1) {
        if (ids[i] === populationInGeneration[j]._id) {
          population[generation][j].fitness = fitness[i];
//    last = j;
          last = 0;
        }
      }
    }
  }

  function mutateFunction(aFunction) {
    var aChromosome = aFunction.code,
      action = Math.random(),
      random = 0,
      select = 0,
      newVal = 0;

    if (action < 0.5) {
      /// Modify a gen plus/minus one
      select = Math.ceil(Math.random() * aChromosome.length);
      newVal = 0;
      random = Math.random();

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

    aFunction.code = aChromosome;
    return aFunction;
  }

  function mutateSharedFunctions(callback) {
    var query = {'used': true}, i = 0;
    functionsCollection.find(query).toArray(function (err, functions) {
      if (err) {
        console.error(err);
      }
      for (i = 0; i < functions.length; i += 1) {
        functions[i] = mutateFunction(functions[i]);
        functions[i].used = false;
        functions[i].counter += 1;
      }
      async.times(functions.length, function (i, next) {
        functionsCollection.update({"_id": functions[i]._id}, functions[i],
          next);
      }, function (err) {
        if (err) {
          console.error(err);
        }
        callback();
      });
    });
  }

  function handleDeliver(request, callback) {

    updateFitness(request.oldIds, request.fitness, request.generation - 1);

    var individuals = requestToIndividuals(request);

    individuals.forEach(function (aIndividual) {
      population[actualGeneration + 1].push(aIndividual);
    });

    if (countInGeneration(actualGeneration) ===
        countInGeneration(actualGeneration + 1)) {
      actualGeneration += 1;
      if (project.sharedFunctions) {
        mutateSharedFunctions(callback);
      } else {
        callback();
      }
    }
  }

/*
  function searchBestIndividuals(beginGeneration, endGeneration) {
    var manyZero = 0;
    var i        = 0;
    for (i = beginGeneration; i < endGeneration; i++) {
      if (typeof population[i]) {
        population[i].forEach(function (aIndividual) {
          if (0 === aIndividual.fitness) {
            manyZero++;
          }
        });
        if (manyZero > 0) {
          console.log(manyZero + " solutions found in generation " + i);
        }
      }
    }
  } */

  this.writeInDB = function () {
    if (!lockWriteInDB) {
      lockWriteInDB = true;
      var insert_population = [],
        limit             = actualGeneration,
      ///limit because population in the actual doesn't have fitness
        i                 = 0;

      for (i = actualGenerationInDB + 1; i < limit; i += 1) {
        insert_population = insert_population.concat(population[i]);
      }
      /// searchBestIndividuals(actualGenerationInDB, limit);
      actualGenerationInDB = limit - 1;
      if (insert_population.length !== 0) {
        populationCollection.insert(insert_population,
          function (err) {
            if (err) {
              console.error(err);
              console.error(insert_population);
            }
            lockWriteInDB = false;
          });
      } else {
        lockWriteInDB = false;
      }
    }
  };

  this.processCommunication = function (request, callback) {

    var response = {};

    if (request.action !== undefined) {
      switch (request.action) {
      case 'request':

        handleRequest(function (project, subPopulation, oldIds) {
          if (project === null) {
            // No more work, so finish
            response = {finalized: true};
          } else {
            if (subPopulation === null) {
            // More work, but not right now
              response = {sleep: true};
            } else {
            /// More work
              response = {
                generation    : actualGeneration,
                subPopulation : subPopulation,
                estimatedTime : project.estimatedTime,
                oldIds        : oldIds
              };
            }
            if (request.assignedProject === 'false') {
              response.assignedProject = project;
            }
          }


          callback(null, JSON.stringify(response));

        });
        break;
      case 'deliver':
        request.newChromosomes = JSON.parse(request.newChromosomes);
        request.fitness        = JSON.parse(request.fitness);
        request.oldIds         = JSON.parse(request.oldIds);
        request.generation     = parseInt(request.generation, 10);


        handleDeliver(request, function () {
          callback(null, JSON.stringify({ok: true}));
        });
        break;
      }
    } else {
      console.error("Please specify action in the request");
    }
  };
}

module.exports = Server;
