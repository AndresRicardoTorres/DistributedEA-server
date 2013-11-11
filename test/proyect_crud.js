//Pruebas para las funciones basicas de los proyectos
var vows = require('vows');
var assertAPI = require("./assertAPI");
var topicAPI = require("./topicAPI");

vows.describe('creacion_proyecto').addBatch({
    "EL nombre del proyecto es obligatorio":{
        topic: topicAPI.post("nuevo_proyecto",{}),
        "Deberia enviar codigo de error": assertAPI.assertStatus(400)
    }
  //  }).export(module); // Export the Suite;
}).run();

