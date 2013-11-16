var mongo = require('mongodb');

/* The DAO must be constructed with a connected database object */
function WorksDAO(db) {
     /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof WorksDAO)) {
        console.log('Warning: ProjectsDAO constructor called without "new" operator');
        return new WorksDAO(db);
    }

    this.newWork = function(work,callback){

    }
}

module.exports.WorksDAO = WorksDAO;