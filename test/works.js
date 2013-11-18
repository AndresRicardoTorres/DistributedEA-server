//Pruebas para las funciones de asignacion de trabajos
var vows = require('vows');
var topicAPI = require("./topicAPI");
var assertAPI = require("./assertAPI");
var assert = require('assert');
var variables = require("../variables");

var suite = vows.describe('asignacion_trabajos');
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

//suite.run();
suite.export(module);
