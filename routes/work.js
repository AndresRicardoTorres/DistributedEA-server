var WorksDAO = require('../dao/workDAO').WorksDAO;
var ProjectsDAO = require('../dao/projectDAO').ProjectsDAO;
var variables = require("../variables");

function WorkHandler(db) {

    var objWorksDAO = new WorksDAO(db);
    var objProjectsDAO = new ProjectsDAO(db);
    var THIS = this;

    this.chooseProject = function (array_projects) {
        if (array_projects.length > 0) {
            return array_projects[0];
        }
        return null;
    };

    this.handleNewAsign = function (req, res, next) {
        var filtros = {};

        var filtro_proyecto = req.body.proyecto;
        if (filtro_proyecto) {
            filtros.proyecto = filtro_proyecto;
        }

        objProjectsDAO.getAvailableWorks(filtros, function (error, projects_with_work) {
            if (error) throw error;
            var respuesta = {};
            //console.log(filtros,'filtros');
            //console.log(projects_with_work, 'projects_with_work');
            var proyecto_escogido = THIS.chooseProject(projects_with_work);
            //console.log(proyecto_escogido, 'proyecto_escogido');

            if (null === proyecto_escogido) {
                res.status(400);
                respuesta.ok = false;
                
                return res.send(JSON.stringify(respuesta));
            }
            else {
                var aWork = {};
                aWork[variables.llaves_coleccion_trabajos.PROYECTO] = proyecto_escogido[variables.llaves_coleccion_proyectos.NOMBRE];
                aWork[variables.llaves_coleccion_trabajos.TIPO] = proyecto_escogido[variables.llaves_coleccion_proyectos.ESTADO];

                objWorksDAO.newWork(aWork, function (err, doc) {
                    if (err) throw err;
                    if (doc.length === 0) {
                        res.status(400);
                        respuesta.ok = false;
                        return res.send(JSON.stringify(respuesta));
                    }
                    
                    doc = doc[0];

                    res.status(200);
                    respuesta.ok = true;
                    respuesta.id_trabajo = doc.id;
                    respuesta.tipo_trabajo = doc[variables.llaves_coleccion_trabajos.TIPO];
                    respuesta.funcion_creacion = proyecto_escogido[variables.llaves_coleccion_proyectos.FUNCION_CREAR].code;
                    return res.send(JSON.stringify(respuesta));
                });
            }


        });


    };
}
module.exports = WorkHandler;