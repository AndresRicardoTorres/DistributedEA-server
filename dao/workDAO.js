var mongo = require('mongodb');
var variables = require("../variables");

/* The DAO must be constructed with a connected database object */
function WorksDAO(db) {
     /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof WorksDAO)) {
        console.log('Warning: ProjectsDAO constructor called without "new" operator');
        return new WorksDAO(db);
    }

    var works_collection = db.collection(variables.colecciones_mongodb.trabajo);
    var counters_collection = db.collection(variables.colecciones_mongodb.contadores);
    this.newWork = function(work,callback){
        /*
        counters_collection.findAndModify(
          {
            query: { _id: name },
            update: { $inc: { seq: 1 } },
            new: true
          }
          
        */
        
        works_collection.insert(work,callback);
    }
}

module.exports.WorksDAO = WorksDAO;