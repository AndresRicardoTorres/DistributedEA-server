var variables = require("../variables");

/* The DAO must be constructed with a connected database object */
function geneticDAO(db,collection_name) {
    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof geneticDAO)) {
        console.log('Warning: geneticDAO constructor called without "new" operator');
        return new geneticDAO(db);
    }

    var genetic_collection = db.collection(collection_name);

    this.createChromosome = function(data,callback){
        var chromosomes = Array();
        for (var i = 0; i < data.length; i++) {
            var a_chromosome = {};
            a_chromosome.data = data[i];
            a_chromosome.generation = 0;
            chromosomes[i]=a_chromosome;
        }
        
        genetic_collection.insert(chromosomes,function(err,result){
            callback(err,result.length == data.length);
        });
    };
}

module.exports = geneticDAO;