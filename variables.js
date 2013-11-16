exports.rutas = {
    nuevo_proyecto: "/nuevo_projecto",
    borrar_proyecto: "/borrar_proyecto",
    asignar_trabajo : "/asignar_trabajo"
};
exports.colecciones_mongodb = {
    configuracion: "configuracion",
    trabajo : "trabajo",
    contadores : 'contadores'
};
exports.proyecto_pruebas = {
    estado_inicial : "__proyecto_pruebas_correcto"
};
exports.estados_proyecto = {
    CREACION:1
};
exports.llaves_coleccion_proyectos = {
    ESTADO : 'estado',
    NOMBRE : 'proyecto',
    ID : 'permalink'
};

exports.llaves_coleccion_trabajos = {
    PROYECTO : 'proyecto'
};