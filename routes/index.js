//var ContentHandler = require('./content')
var ErrorHandler = require('./error').errorHandler;
var ProjectHandler = require('./project');
var WorkHandler = require('./work');
var variables = require("../variables");

module.exports = exports = function(app,db) {
    /// handlers
    var projectHandler = new ProjectHandler(db);
    var workHandler= new WorkHandler(db);
  
    ///Common middlewares
    ///app.use(contentHandler.log_coneection);
    
   ///routes    
   
   app.post(variables.rutas.nuevo_proyecto, projectHandler.handleNewProject);
   app.post(variables.rutas.borrar_proyecto, projectHandler.handleDeleteProject)
   
   app.post(variables.rutas.asignar_trabajo, workHandler.handleNewAsign);
   app.post(variables.rutas.entregar_trabajo, workHandler.handleReceiveTask)
   
   app.get('/', function(req, res, next) {
        var body = '{"msg":"Hello World"}';
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', body.length);
        res.end(body);
        });

   // Error handling middleware
   app.use(ErrorHandler);
}