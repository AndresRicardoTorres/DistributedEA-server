var mongo = require('mongodb');
var variables = require("../variables");
var CountersDAO = require('../dao/counterDAO').CountersDAO;

/* The DAO must be constructed with a connected database object */
function WorksDAO(db) {
    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof WorksDAO)) {
        console.log('Warning: ProjectsDAO constructor called without "new" operator');
        return new WorksDAO(db);
    }

    var objCountersDAO = new CountersDAO(db);
    var works_collection = db.collection(variables.colecciones_mongodb.trabajo);
    this.newWork = function (work, callback) {
        objCountersDAO.next(variables.secuencias.IDENTIFICADOR_TRABAJO, function (err, secuencia) {
            work.id = secuencia;
            works_collection.insert(work, callback);
        });

    }
    
    this.remove= function(query,callback){
        works_collection.remove(query,callback);
    }
}

module.exports.WorksDAO = WorksDAO;