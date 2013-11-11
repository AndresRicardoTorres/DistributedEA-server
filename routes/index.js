//var ContentHandler = require('./content')
var ErrorHandler = require('./error').errorHandler;
var ProjectHandler = require('./project');

module.exports = exports = function(app) {
    /// handlers
    var projectHandler = new ProjectHandler();
    
    ///Common middlewares
    ///app.use(contentHandler.log_coneection);
    
   ///routes    
   app.post('/nuevo_proyecto', projectHandler.handleNewProject);
   
   
   app.get('/', function(req, res, next) {
        var body = '{"msg":"Hello World"}';
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', body.length);
        res.end(body);
        });

   // Error handling middleware
   app.use(ErrorHandler);
}