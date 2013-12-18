killall node
echo "clean database"
# mongo agmp --port 37017 --eval "db.population.remove()"
mongo eva05.local:37017/agmp --eval "db.population.remove()"
# mongo agmp --port 27017 --eval "db.population.remove()"
# waiting for clean database
sleep 4
echo "start server"
node /home/andresrtm/Projects/Reuse/agmp_servidor/app.js > /tmp/server.log &
echo "start clients"
#waiting for server starts and create initial population
sleep 4
node /home/andresrtm/Projects/Reuse/agmp_cliente/app.js > /tmp/client1.log &
node /home/andresrtm/Projects/Reuse/agmp_cliente/app.js > /tmp/client2.log &
echo ":)"

