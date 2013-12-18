var r = db.population.aggregate([
  {$group:{_id:"$generation",contador:{$max:"$timestamp"}}} ,
  {$sort:{_id:1}}
]);

var docs =  r.result;
var diff = new Array()
for(var i=0;i<docs.length-1;i++){  
  diff[i]=(docs[i+1].contador - docs[i].contador)/1000;
}
printjson(diff);