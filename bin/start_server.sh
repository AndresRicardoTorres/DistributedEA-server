ssh eva05.local "mongod --replSet reuseThesis --logpath /home/andresrtm/reuseMongoDB/reuseLogpath --dbpath /home/andresrtm/reuseMongoDB --port 37017 --fork"
ssh eva04.local "mongod --replSet reuseThesis --logpath /home/andresrtm/reuseMongoDB/reuseLogpath --dbpath /home/andresrtm/reuseMongoDB --port 37017 --fork"
ssh eva03.local "mongod --replSet reuseThesis --logpath /home/andresrtm/reuseMongoDB/reuseLogpath --dbpath /home/andresrtm/reuseMongoDB --port 37017 --fork"
 