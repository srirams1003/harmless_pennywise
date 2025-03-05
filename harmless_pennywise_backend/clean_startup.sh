docker stop harmless_pennywise_db
docker rm harmless_pennywise_db
docker run --name harmless_pennywise_db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=harmless_pennywise -p 3307:3306 -d mysql:latest
sleep 15
python database.py
uvicorn main:app --reload
