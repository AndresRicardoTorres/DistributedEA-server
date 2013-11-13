//Pruebas para las funciones de asignacion de trabajos
var vows = require('vows');
var topicAPI = require("./topicAPI");

var nombre_proyecto_prueba = "__proyecto_pruebas_correcto";
var ruta_nuevo_asignacion = 'asignar_trabajo';

vows.describe('asignacion_trabajos').addBatch({
	"Asignacion de un trabajo" : {
		topic : topicAPI.post(ruta_nuevo_asignacion, {"proyecto":nombre_proyecto_prueba}),
		"Debe devolver un id de trabajo" : {}
	}
}).export(module);
