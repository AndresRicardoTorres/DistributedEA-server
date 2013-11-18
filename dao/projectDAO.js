var mongo = require('mongodb');
var variables = require("../variables");
var WorksDAO = require('../dao/workDAO').WorksDAO;

/* The DAO must be constructed with a connected database object */
function ProjectsDAO(db) {
    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof ProjectsDAO)) {
        console.log('Warning: ProjectsDAO constructor called without "new" operator');
        return new ProjectsDAO(db);
    }

    var objWorksDAO = new WorksDAO(db);
    var projects_collection = db.collection(variables.colecciones_mongodb.configuracion);

    this.newProject = function (project, callback) {

        var name = project.proyecto;
        // fix up the permalink to not include whitespace
        var permalink = name.replace(/\s/g, '_');
        project.permalink = permalink.replace(/\W/g, '');

        project["_id"] = permalink;

        project.date = new Date();

        /// Convert text functions to mongo functions
        project.funcion_crear_cromosoma = mongo.Code(project.funcion_crear_cromosoma);

        projects_collection.insert(project, function (err, doc) {
            callback(err, doc);
        });
    }

    this.remove = function (query, callback) {
        projects_collection.remove(query, function (error, numeroProyectoRemovidos) {
            var query_works = {
                proyecto: query.proyecto
            };
            objWorksDAO.remove(query_works, function (error, numeroTareasRemovidas) {
                callback(error,numeroProyectoRemovidos, numeroTareasRemovidas);
            });
        });
    }

    /*
     * Devuelve una lista de proyectos que tienen trabajos pendientes.
     * @param filter Object  Opciones para filtrar la busqueda de proyectos
     *               - proyecto : Filtra por el nombre del proyecto
     */
    this.getAvailableWorks = function (filter, callback) {
        var query = {};
        if (typeof filter.proyecto === 'string') {
            query.permalink = filter.proyecto;
        }

        query[variables.llaves_coleccion_proyectos.ESTADO] = {
            "$in": [variables.estados_proyecto.CREACION]
        };
        var projection = {};
        projection[variables.llaves_coleccion_proyectos.ID] = 1;

        var cursor = projects_collection.find(query, {})

        cursor.toArray(function (err, docs) {

            if (err) throw err;
            else {
                var projects = [];

                docs.forEach(function (doc, key) {
                    if (typeof doc[variables.llaves_coleccion_proyectos.ID] == 'string') {
                        projects.push(doc);
                    }
                });

                callback(err, projects);
            }
        });
    }
}

module.exports.ProjectsDAO = ProjectsDAO;