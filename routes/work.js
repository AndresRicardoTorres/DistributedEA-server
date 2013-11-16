var WorksDAO = require('../dao/workDAO').WorksDAO;
var ProjectsDAO = require('../dao/projectDAO').ProjectsDAO;
var variables = require("../variables");

function WorkHandler (db) {
    
    var objWorksDAO = new WorksDAO(db);
    var objProjectsDAO = new ProjectsDAO(db);
    
    this.handleNewAsign= function(req, res, next) {
        var filtros = {};
        
        var filtro_proyecto = req.body.proyecto;
        if(filtro_proyecto){
            filtros.proyecto=filtro_proyecto;
        }
        
        objProjectsDAO.getAvailableWorks(filtros,function(error,projects_with_work){
            if(error)throw error;
            
            console.log(projects_with_work,'projects_with_work');
            var aWork = {};
            aWork[variables.llaves_coleccion_trabajos.PROYECTO]=projects_with_work[0];
            objWorksDAO.newWork(aWork,function(err,doc){
                
                res.status(400);
                var respuesta = {};
                respuesta.ok = true;
                return res.send(JSON.stringify(respuesta));    
            });
        });
        
        
    }
}
module.exports = WorkHandler;