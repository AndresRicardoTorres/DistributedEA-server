db.population.aggregate([
  {$group:{_id:"$generation",count:{$sum:1}}}
])