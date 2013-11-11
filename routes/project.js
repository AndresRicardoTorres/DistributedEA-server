function ProjectHandler () {
    this.handleNewProject= function(req, res, next) {
        console.log("handleNewProject");
        console.log(typeof req.body.proyecto,"typeof req.body.proyecto");
        if(typeof req.body.proyecto === "undefined"){
            console.log(400);
            res.status(400);
            return res.send("{Valor de proyecto obligatorio}");
            
        }
        var nombre = req.body.proyecto;
        res.status(200);
        res.send('{"ok":false}');
    }
}
module.exports = ProjectHandler;