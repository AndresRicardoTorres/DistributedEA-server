//Pruebas para las funciones basicas de los proyectos
var vows = require('vows');
var assertAPI = require("./assertAPI");
var topicAPI = require("./topicAPI");

function make_random_string(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

var nombre_proyecto_prueba = make_random_string(10);
var ruta_nuevo_proyecto = "nuevo_proyecto";

///Variables tmp
var MongoClient = require('mongodb').MongoClient;
var uri_mongodb_connection = 'mongodb://177.71.196.106:27017/agmp';
var mongodb_collection_config = 'configuracion';
var assert = require('assert');
var DB = null;
///END variables tmp

vows.describe('creacion_proyecto').addBatch({
	"Creacion correcta con solo opciones obligatorias" : {
		topic : topicAPI.post(ruta_nuevo_proyecto, {
			"proyecto" : nombre_proyecto_prueba,
			"crear_cromosoma" : function() {
				var cromosoma = Array();
				for (var i = 0; i < 10; i++) {
					cromosoma[i] = Math.random();
				}
				return cromosoma;
			}
		}),
		"Deberia enviar codigo OK" : assertAPI.assertStatus(200),
		"Deberia responder OK en JSON" : assertAPI.assertJSONResponse({
			"ok" : true
		}),
		"Deberia estar en la BD" : {
			topic : function(error, response, body) {
				var topicTHIS = this;
				var query = {
					"proyecto" : nombre_proyecto_prueba
				};
				MongoClient.connect(uri_mongodb_connection, function(err, db) {
					DB = db;
					//assert.isNotNull(err,"Hubo error en la conexion de MongoDB");
					if (err) {
						console.log(err);
						return;
					}
					//console.log("44");
					db.collection(mongodb_collection_config).findOne(query, topicTHIS.callback);
				});

			},
			"El documento no debe ser null" : function(err, doc) {
				DB.close();
				assert.isNotNull(doc, "El documento no debe estar vacio");
			},
			"Debe tener una función ejecutable para crear cromosomas" : function(err,doc){
				DB.close();				
				eval("var prueba ="+doc.funcion_crear_cromosoma.code);				
				assert.isFunction(prueba);
			}
		}
	},
	"El nombre del proyecto es obligatorio" : {
		topic : topicAPI.post(ruta_nuevo_proyecto, {}),
		"Deberia enviar codigo de error" : assertAPI.assertStatus(400)
	},
	"Crear un proyecto con el nombre de uno ya creado" : {}
	//  }).export(module); // Export the Suite;
}).run();

