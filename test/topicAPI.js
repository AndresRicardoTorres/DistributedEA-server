var request = require('request');   

exports.urlbase = function(){
    //return "http://localhost:3000/";
    return "http://agmp_servidor_-c9-andresricardotorres.c9.io/";
};

exports.post = function (action,object) {
    return function () {
        var options = {"method":"POST","url":exports.urlbase()+action,"form":object};
        request(options, this.callback);
    };
}
  