killall node
echo "clean database"
mongo agmp --port 37017 --eval "db.population.remove()"
echo "start server"
node agmp_servidor/app.js > /tmp/server.log &
echo "start clients"
sleep 2
node agmp_cliente/app.js > /tmp/client1.log &
node agmp_cliente/app.js > /tmp/client2.log &
echo ":)"