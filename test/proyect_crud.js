//Pruebas para las funciones basicas de los proyectos
var vows = require('vows');
var assertAPI = require("./assertAPI");
var topicAPI = require("./topicAPI");
var assert = require('assert');

var nombre_proyecto_prueba = "__proyecto_pruebas_correcto";
var ruta_nuevo_proyecto = "nuevo_proyecto";
var ruta_borrar_proyecto = "borrar_proyecto";
var mongodb_collection_config = "configuracion";

vows.describe('creacion_proyecto').addBatch({
    "Borro primero el proyecto de prueba":{
        topic: topicAPI.post(ruta_borrar_proyecto,{"proyecto":nombre_proyecto_prueba}),
        "No debe estar en la BD":{
            topic: topicAPI.findOne(mongodb_collection_config,{"proyecto":nombre_proyecto_prueba}),
            "El documento debe ser null": function(err,doc){
                this.DB.close();
				assert.isNull(doc, "El documento no debe estar vacio");
            }
        }
    }
    });

vows.describe('creacion_proyecto').addBatch({
	"Creacion correcta con solo opciones obligatorias" : {
		topic : topicAPI.post(ruta_nuevo_proyecto, {
			"proyecto" : nombre_proyecto_prueba,
			"tamano_poblacion" : 100,
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
			topic :  topicAPI.findOne(mongodb_collection_config,{
					"proyecto" : nombre_proyecto_prueba
				}),
			"El documento no debe ser null" : function(err, doc) {
				this.DB.close();
				assert.isNotNull(doc, "El documento no debe estar vacio");
			},
			"Debe tener una función ejecutable para crear cromosomas" : function(err, doc) {
				this.DB.close();
				var prueba = null;
				console.log(doc);
				console.log(doc.funcion_crear_cromosoma.code);
				if(doc.funcion_crear_cromosoma.code.length > 0){
				eval("var prueba =" + doc.funcion_crear_cromosoma.code);
				assert.isFunction(prueba);
			},
			"Debe tener una cantidad de poblacion" : function(err, doc) {
				this.DB.close();
				assert.isNumber(doc.tamano_poblacion);
			}
		}
	},
	"El nombre del proyecto es obligatorio" : {
		topic : topicAPI.post(ruta_nuevo_proyecto, {}),
		"Deberia enviar codigo de error" : assertAPI.assertStatus(400)
	},
	"Crear un proyecto con el nombre de uno ya creado" : {}
}).export(module);

