To run the MySQL server database on a docker container, run:
```sh
docker run --name harmless_pennywise_db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=harmless_pennywise -p 3307:3306 -d mysql:latest
```

If you need to stop the docker container with the MySQL database:
```sh
docker rm harmless_pennywise_db
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

To run the backend service using FastAPI, from inside the backend directory, run:
```sh
uvicorn main:app --reload
```

Now, you can see the preliminary output on 
`localhost:8000/users`
and 
`localhost:8000/`

To first install the necessary frontend packages, from inside the frontend directory, run:
```sh
npm install
```

To run the frontend service using React, from inside the frontend directory, run:
```sh
npm run dev
```

You can now access the frontend on `localhost:5173/`
