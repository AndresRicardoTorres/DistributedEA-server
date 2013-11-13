var ProjectsDAO = require('../dao/projectDAO').ProjectsDAO;

function ProjectHandler (db) {
    
    var objProjectsDAO = new ProjectsDAO(db);
    
    this.handleNewProject= function(req, res, next) {
        
        if(typeof req.body.proyecto === "undefined"){
            console.log(400);
            res.status(400);
            var respuesta = {};
            respuesta.error = "Valor de proyecto obligatorio";
            return res.send(JSON.stringify(respuesta));
        }
        
        var nombre = req.body.proyecto;
        var funcion_crear_cromosoma = req.body.crear_cromosoma;
        var tamano_poblacion = parseInt(req.body.tamano_poblacion);
        
        ///TODO: validar los tipos de datos
        
        
        var nuevo_proyecto = {
                                "proyecto":nombre,
                                "funcion_crear_cromosoma":funcion_crear_cromosoma,
                                "tamano_poblacion" : tamano_poblacion
                                };
        
        objProjectsDAO.newProject(nuevo_proyecto,function(error,doc){
            console.log(error,"error");
            console.log(doc,"doc");
            var respuesta = {};
            if(doc){
                respuesta.ok = true;
                res.status(200);
            }else{
                respuesta.ok = false;
                ///TODO: enviar la especificacion de por que es el error
                res.status(400);
            }
            res.send(JSON.stringify(respuesta));        
        });
    }
}
module.exports = ProjectHandler;