var express = require('express');
var app = express() // Web framework to handle routing requests
var routes = require('./routes'); // Routes for our application

// Express middleware to populate 'req.body' so we can access POST variables
app.use(express.bodyParser());
//routes(app);

app.listen(process.env.PORT || 80);
console.log('Express server listening on port 80');