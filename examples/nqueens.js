var aProject = {
	  name:'nqueens_project',
	  populationTotal:100,
	  generationLimit:100,
	  mattingPoolPercent:0.60,
	  mutationPercent:0.11,
	  creationFunction:mongo.Code(creationFunction),
	  fitnessFunction:mongo.Code(fitnessFunction),
	  mutationFunction:mongo.Code(mutationFunction),
	  crossoverFunction:mongo.Code(crossoverFunction),
	  creationOptions:{N:10}
}


function creationFunction(options){
  var N = options.N;
  var values = new Array();
  for(var i=0;i<N;i++){
    values[i]=false;
  }
  
  var chromosome = new Array();
  for(var i=0;i<N;i++){
    var idx=parseInt(Math.random()*N);
    while(!values[idx]){
      idx=parseInt(Math.random()*N);
    }
    values[idx]=true;
    chromosome[i]=idx;
  }
  
}

function fitnessFunction(aChromosome){
  var queensInAttack=0;
  var N = aChromosome.length;
  
  //Las horizontales y las verticales están garantizadas por la codificación del cromosoma
  for (var i=0; i< N-2; i++){
    for (var j=i+1; j < N; j++){
      if(aChromosome[i]+i == aChromosome[j]+j){
	queensInAttack+=2;
      }
    }
  }
}

function mutationFunction(aChromosome){
  var N = aChromosome.length;
  var x=parseInt(Math.random()*N);
  var y=parseInt(Math.random()*N);
  
  var tmp=aChromosome[x];
  aChromosome[x]=aChromosome[y];
  aChromosome[y]=tmp;
  
  return aChromosome;
}

function crossoverFunction(aChromosome,otherChromosome){
  var newChromosome = new Array();
  
  var values = new Array();
  for(var i=0;i<N;i++){
    values[i]=true;
  }
  for(var i=0;i<Math.ceil(aChromosome.length/2);i++){
    newChromosome[i]=aChromosome[i];
    values[ aChromosome[i] ] = false;
  }
  
  for(var i=0;i<otherChromosome.length;i++)
  {
    if(values[ otherChromosome[i] ]){
      newChromosome.push(otherChromosome[i]);
      values[ otherChromosome[i] ]=false;
    }
  }
  
  return newChromosome;
}