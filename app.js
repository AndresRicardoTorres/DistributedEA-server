var express = require('express');
var app = express() // Web framework to handle routing requests
var routes = require('./routes'); // Routes for our application

// Express middleware to populate 'req.body' so we can access POST variables
app.use(express.bodyParser());
routes(app);
var port = process.env.PORT || 80;
app.listen(port);
console.log('Express server listening on port '+port);