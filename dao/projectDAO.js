/* The DAO must be constructed with a connected database object */
function ProjectsDAO(db) {
     /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof ProjectsDAO)) {
        console.log('Warning: ProjectsDAO constructor called without "new" operator');
        return new ProjectsDAO(db);
    }

    var collection_name = "configuracion";
    var projects_collection = db.collection(collection_name);
    
    this.newProject = function(obj,callback){
        var name = obj.proyecto; 
        
        // fix up the permalink to not include whitespace
        var permalink = name.replace( /\s/g, '_' );
        permalink = permalink.replace( /\W/g, '' );

        // Build a new project
        var project = {"proyecto": name,
                "permalink":permalink,
                "date": new Date()};
                
        projects_collection.insert(project,function(err,doc){
            callback(err,doc);
        });
    }
}

module.exports.ProjectsDAO = ProjectsDAO;