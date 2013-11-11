function ProjectHandler () {
    this.handleNewProject= function(req, res, next) {
        if(typeof req.body.proyecto === "undefined"){
            return res.status(400);
        }
        var nombre = req.body.proyecto;
        
    }
}
module.exports = ProjectHandler;