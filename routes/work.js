var WorksDAO = require('../dao/workDAO').WorksDAO;
var ProjectsDAO = require('../dao/projectDAO').ProjectsDAO;

function WorkHandler (db) {
    
    var objWorksDAO = new WorksDAO(db);
    var objProjectsDAO = new ProjectsDAO(db);
    
    this.handleNewAsign= function(req, res, next) {
        var filtros = {};
        
        var filtro_proyecto = req.body.proyecto;
        if(filtro_proyecto){
            filtros.proyecto=filtro_proyecto;
        }
        
        objProjectsDAO.getAvailableWorks(filtros,function(projects_with_work){
            
        });
        
        
    }
}
module.exports = WorkHandler;