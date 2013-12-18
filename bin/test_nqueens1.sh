killall node
# echo "clean database"
# mongo agmp --port 37017 --eval "db.population.remove()"
# mongo eva03.local:37017/nqueens1 --eval "db.population.remove()"
# mongo agmp --port 27017 --eval "db.population.remove()"
# waiting for clean database
# sleep 5
echo "start server"
node /home/andresrtm/Projects/Reuse/agmp_servidor/app.js > /tmp/server.log &

#waiting for server starts and create initial population
sleep 20

echo "start clients"
node /home/andresrtm/Projects/Reuse/agmp_cliente/app.js > /tmp/client1.log &
echo ":)"