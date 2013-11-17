var mongo = require('mongodb');
var variables = require("../variables");

/* The DAO must be constructed with a connected database object */
function countersDAO(db) {
    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof countersDAO)) {
        console.log('Warning: ProjectsDAO constructor called without "new" operator');
        return new countersDAO(db);
    }

    var counters_collection = db.collection(variables.colecciones_mongodb.contadores);

    this.next = function (counter_name, callback) {
        counters_collection.findAndModify({
            "_id": counter_name
        }, {
            "$inc": {
                "seq": 1
            }
        }, {
            "new": true
        }, function (err, object) {
            if(err)throw err;
            callback(err, object);
        });
    };
}

module.exports.CountersDAO = countersDAO;