To run the MySQL server database on a docker container, run:
```sh
docker run --name harmless_pennywise_db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=harmless_pennywise -p 3307:3306 -d mysql:latest
```

To install the necessary python packages:
```sh
pip install fastapi uvicorn pymysql python-dotenv 
```

To inspect the database manually:
```sh
docker exec -it harmless_pennywise_db mysql -uroot -p
```
- The password is `root`, as set above.
- Then you can use commands like 
    - `show databases;`
    - `use harmless_pennywise`
    - `show tables;`
    - `select * from users;`
