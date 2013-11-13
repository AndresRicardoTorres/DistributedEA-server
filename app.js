var express = require('express');
var app = express() // Web framework to handle routing requests
var routes = require('./routes'); // Routes for our application
var MongoClient = require('mongodb').MongoClient // Driver for connecting to MongoDB

MongoClient.connect('mongodb://177.71.196.106:27017/agmp', function(err, db) {
    if(err) {console.log(err);}
    // Express middleware to populate 'req.body' so we can access POST variables
    app.use(express.bodyParser());
    routes(app,db);
    var port = process.env.PORT || 80;
    app.listen(port);
    console.log('Express server listening on port '+port);
});