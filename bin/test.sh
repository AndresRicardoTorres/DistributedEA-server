killall node
echo "clean database"
#mongo agmp --port 37017 --eval "db.population.remove()"
mongo agmp --port 27017 --eval "db.population.remove()"
echo "start server"
node /home/andresrtm/Projects/Reuse/agmp_servidor/app.js > /tmp/server.log &
echo "start clients"
sleep 2
node /home/andresrtm/Projects/Reuse/agmp_cliente/app.js > /tmp/client1.log &
node /home/andresrtm/Projects/Reuse/agmp_cliente/app.js > /tmp/client2.log &
echo ":)"