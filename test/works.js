//Pruebas para las funciones de asignacion de trabajos
var vows = require('vows');
var topicAPI = require("./topicAPI");
var assertAPI = require("./assertAPI");
var assert = require('assert');
var variables = require("../variables");

var suite = vows.describe('asignacion_trabajos');
var id_trabajo_asignado = null;
suite.addBatch({
	"Asignacion de un trabajo" : {
		topic : topicAPI.post(variables.rutas.asignar_trabajo, {
			"proyecto" : variables.proyecto_pruebas.estado_inicial
		}),
		"Debe estar en la base de datos" : {
			topic : topicAPI.findOne(variables.colecciones_mongodb.trabajo, {
				"proyecto" : variables.proyecto_pruebas.estado_inicial
			}),
			"Debe tener un identificador de trabajo" : function(err, doc) {
				this.DB.close();
				assert.isNotNull(doc, "El documento no debe estar vacio");
				assert.isNumber(doc.id);
				id_trabajo_asignado = parseInt(doc.id);
			},
			"Debe tener un tipo" : function(err, doc) {
				this.DB.close();
				assert.isNumber(doc.tipo);
			}
		},
		"Deberia enviar codigo OK" : assertAPI.assertStatus(200),
		"Deberia responder OK en JSON" : assertAPI.assertJSONResponse({
			"ok" : true
		}),
	},

	"Asignar un trabajo sin filtro" : {
		topic : topicAPI.post(variables.rutas.asignar_trabajo, {}),
		"Deberia enviar codigo OK" : assertAPI.assertStatus(200),
		"Deberia responder OK en JSON" : assertAPI.assertJSONResponse({
			"ok" : true
		}),
	},
	"Asignar un trabajo de un proyecto que no existe" : {
		topic : topicAPI.post(variables.rutas.asignar_trabajo, {
			"proyecto" : "__no_found__"
		}),
		"Deberia enviar codigo ERROR" : assertAPI.assertStatus(400),
		"Deberia responder OK en JSON" : assertAPI.assertJSONResponse({
			"ok" : false
		}),
	}
});

suite.addBatch({
	"Debe ser entregable" : {
		topic : topicAPI.post(variables.rutas.entregar_trabajo, {
			id_trabajo : id_trabajo_asignado,
			resultado : [1, 2, 3]
		}),
		"Deberia enviar codigo OK" : assertAPI.assertStatus(200)
	}
});

//suite.run();
suite.export(module);
