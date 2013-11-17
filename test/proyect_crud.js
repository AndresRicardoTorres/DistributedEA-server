//Pruebas para las funciones basicas de los proyectos
var vows = require('vows');
var assertAPI = require("./assertAPI");
var topicAPI = require("./topicAPI");
var assert = require('assert');
var variables = require("../variables");

var suite = vows.describe('CRUD proyecto');
suite.addBatch({
    "Borro primero el proyecto de prueba": {
        topic: topicAPI.post(variables.rutas.borrar_proyecto, {
            "proyecto": variables.proyecto_pruebas.estado_inicial
        }),
        "No debe estar en la BD": {
            topic: topicAPI.findOne(variables.colecciones_mongodb.configuracion, {
                "proyecto": variables.proyecto_pruebas.estado_inicial
            }),
            "El documento debe ser null": function (err, doc) {
                //console.log(doc,'doc DELETE');
                this.DB.close();
                assert.isNull(doc, "El documento no debe estar vacio");
            }
        },
        "Tampoco debe haber trabajos en la BD": {
            topic: topicAPI.findOne(variables.colecciones_mongodb.trabajo, {
                "proyecto": variables.proyecto_pruebas.estado_inicial
            }),
            "El documento debe ser null": function (err, doc) {
                //console.log(doc,'doc DELETE');
                this.DB.close();
                assert.isNull(doc, "El documento no debe estar vacio");
            }
        }
    }
});
suite.addBatch({
    "Creacion correcta con solo opciones obligatorias": {
        topic: topicAPI.post(variables.rutas.nuevo_proyecto, {
            "proyecto": variables.proyecto_pruebas.estado_inicial,
            "tamano_poblacion": 100,
            "crear_cromosoma": function () {
                var cromosoma = Array();
                for (var i = 0; i < 10; i++) {
                    cromosoma[i] = Math.random();
                }
                return cromosoma;
            }
        }),
        "Deberia enviar codigo OK": assertAPI.assertStatus(200),
        "Deberia responder OK en JSON": assertAPI.assertJSONResponse({
            "ok": true
        }),
        "Deberia estar en la BD": {
            topic: topicAPI.findOne(variables.colecciones_mongodb.configuracion, {
                "proyecto": variables.proyecto_pruebas.estado_inicial
            }),
            "El documento no debe ser null": function (err, doc) {
                this.DB.close();
                assert.isNotNull(doc, "El documento no debe estar vacio");
            },
            "Debe tener una función ejecutable para crear cromosomas": function (err, doc) {
                this.DB.close();
                var prueba = null;
                if (doc.funcion_crear_cromosoma.code.length > 0) {
                    eval("var prueba =" + doc.funcion_crear_cromosoma.code);
                    assert.isFunction(prueba);
                }
            },
            "Debe tener una cantidad de poblacion": function (err, doc) {
                this.DB.close();
                assert.isNumber(doc.tamano_poblacion);
            },
            "Su estado debe ser de CREACION": function (err, doc) {
                this.DB.close();
                assert.isNumber(doc[variables.llaves_coleccion_proyectos.ESTADO]);
                assert.equal(doc[variables.llaves_coleccion_proyectos.ESTADO], variables.estados_proyecto.CREACION);
            }
        }
    },
    "El nombre del proyecto es obligatorio": {
        topic: topicAPI.post(variables.rutas.nuevo_proyecto, {}),
        "Deberia enviar codigo de error": assertAPI.assertStatus(400)
    },
    "Crear un proyecto con el nombre de uno ya creado": {}
});
//suite.run();
suite.export(module);
