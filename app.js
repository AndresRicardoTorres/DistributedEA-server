#!/usr/bin/env node

var async       = require('async');
var Commander   = require('commander');
var http        = require('http');
var Mongo       = require('mongodb');
var MongoClient = Mongo.MongoClient;
var qs          = require('querystring');

var Server        = require("./lib/Server.js");
var Timer         = require("./lib/timer.js");

var httpServer     = null;
var aServer        = null;
var aQueue         = null;
var initialTime    = null;
var queueCount     = 0;
var PARALELL_TASKS = 1;

var generalTimer   = new Timer();
var workTimer      = new Timer();
var requestTimer   = new Timer();
var deliverTimer   = new Timer();

var defaultValues = {
  urlMongo    : 'mongodb://localhost:27017/reuse',
  httpPort    : 8000,
  projectName : null
};

Commander
  .version('1.0.1')
  .option('-p, --port <n>', 'Http port for communication with clients',
     parseInt)
  .option('-u, --urlMongo <url>', 'URL for connect with MongoDB')
  .option('-s, --save <file>', 'JS file with project description')
  .option('-r, --run <projectName>', 'Run a specified project')
  .parse(process.argv);

if (Commander.port) {
  defaultValues.httpPort = Commander.port;
}
if (Commander.urlMongo) {
  defaultValues.urlMongo = Commander.urlMongo;
}
if (Commander.run) {
  defaultValues.projectName = Commander.run;
} else {
  if(!Commander.save) {
    Commander.help();
  }
}

function printReport() {
  generalTimer.stop();

  console.info("=== REPORT ===");
  console.info("Initial Time   : " + generalTimer.getInitialDate());
  console.info("End Time       : " + generalTimer.getEndDate());
  console.info("Total Duration : " + generalTimer.getTime());
  console.info("");
  console.info("Time work in server : " + workTimer.getTime());
  console.info("Request time        : " + requestTimer.getTime());
  console.info("Deliver time        : " + deliverTimer.getTime());
  console.info("");
  console.info("Total tasks completed: " + queueCount);
}

function processTask(task, callback) {
  workTimer.start();
  requestTimer.start();
  deliverTimer.start();

  aServer.processCommunication(task.data, function (error, answer) {
    if (error) {
      console.error(error);
    }

    if (answer === JSON.stringify({ok: true})) {
      deliverTimer.stop();
    } else {
      requestTimer.stop();

    }
    task.response.end(answer);

    if (answer === JSON.stringify({finalized: true})) {
      printReport();
    }
    callback();
  });
}

function finishedTask(err) {
  if (err) {
    console.error("ERROR en push " + err);
  }
  queueCount++;
  workTimer.stop();
}

function processHttpRequest(request, response) {
  if (0 === generalTimer.getInitialDate()) {
    generalTimer.start();
  }

  var requestBody = '';
  request.on('data', function (data) {
    requestBody += data;
  });
  request.on('end', function () {
    var formData = qs.parse(requestBody);

    ///Write in database parallel to queue process
    aServer.writeInDB();

    var aTask = {
      data: formData,
      response: response
    };

    /// add a task to the queue process
    aQueue.push(aTask, finishedTask);
  });
}

MongoClient.connect(defaultValues.urlMongo, function (error, database) {
  if (error) {
    console.error(error);
    console.error("Is MongoDB server running ?");
  } else {

    if (Commander.save) {
      /// Save a project
      var projectsCollection = database.collection("projects");
      var projectFile        = Commander.save;
      var project            = require("./" + projectFile);
      var projectName        = project.name;


      projectsCollection.findOne({name: projectName}, function (error, doc) {
        if (error) {
          console.error(error);
        } else {
          if (doc !== null) {
            console.error("The project " + project.name + " already exists");
            database.close();
          } else {
            /// Convert JS functions in Mongo Functions
            var objName = null;
            for (objName in project) {
              if (typeof project[objName] === "function") {
                project[objName] = Mongo.Code(project[objName]);
              }
            }
            /// Insert Project and delete population
            projectsCollection.insert(project, function () {
              database.dropCollection("pop_" + projectName, function () {
                database.close();
              });
            });
          }
        }
      });
    } else {
      /// Start HTTP server
      var projectName = defaultValues.projectName;
      aServer = new Server(database, projectName,function (error) {
        if (error) {
          console.error(error);
        } else {

          // Start queue for client requests
          aQueue = async.queue(processTask, PARALELL_TASKS);
          // Start HTTP server
          httpServer = http.createServer(processHttpRequest);
          httpServer.listen(defaultValues.httpPort);

          console.log('Server listening on port ' + defaultValues.httpPort);
          console.log('Start time :' + new Date());
        }
      });
    }
  }
});
