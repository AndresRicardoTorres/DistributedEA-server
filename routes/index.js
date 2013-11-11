//var ContentHandler = require('./content')
var ErrorHandler = require('./error').errorHandler;

module.exports = exports = function(app) {
/*
    var contentHandler = new ContentHandler();

    app.use(contentHandler.log_coneection);

    app.get('/status', contentHandler.statusProject);
      app.post('/status', contentHandler.statusProject);
    app.get('/', contentHandler.displayMainPage);
  
app.get('*', contentHandler.not_found);
app.post('*', contentHandler.not_found);
*/
    // Error handling middleware
    app.use(ErrorHandler);
}