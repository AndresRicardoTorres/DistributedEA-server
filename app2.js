var http = require('http');
var qs = require('querystring');
http.createServer(function (request, response) {
  console.log('PING');
  if (request.method == 'POST') {
    var requestBody = '';
    request.on('data', function(data) {
      console.log('ON'+data);
      requestBody += data;
      if(requestBody.length > 1e7) {
        response.writeHead(413, "Request Entity Too Large", {'Content-Type': 'text/html'});
        response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
      }
    });
    request.on('end', function() {
      console.log('end ');
      var formData = qs.parse(requestBody);
      console.log(formData);      
      response.end('</body></html>');
    });
  }
  
  //res.writeHead(200, {'Content-Type': 'text/plain'});
  ///res.end('Hello World\n');
  
  
}).listen(8000);
console.log('Server running at http://127.0.0.1:8000/');