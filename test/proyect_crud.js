//Pruebas para las funciones basicas de los proyectos
var vows = require('vows');
var assertAPI = require("./assertAPI");
var topicAPI = require("./topicAPI");

function make_random_string(length)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
var nombre_proyecto_prueba = make_random_string(10);
var ruta_nuevo_proyecto = "nuevo_proyecto";

vows.describe('creacion_proyecto').addBatch({
    "Creacion correcta con solo opciones obligatorias":{
        topic: topicAPI.post(ruta_nuevo_proyecto,{"proyecto":nombre_proyecto_prueba}),
        "Deberia enviar codigo OK": assertAPI.assertStatus(200),
        "Deberia responder OK en JSON" : assertAPI.assertJSONResponse({"ok":true}),
        "Deberia estar en la BD" : function(){
            
            
        }
    },
    "EL nombre del proyecto es obligatorio":{
        topic: topicAPI.post(ruta_nuevo_proyecto,{}),
        "Deberia enviar codigo de error": assertAPI.assertStatus(400)
    },
    "Crear un proyecto con el nombre de uno ya creado":{}
  //  }).export(module); // Export the Suite;
}).run();

