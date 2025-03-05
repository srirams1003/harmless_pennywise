## Setup for Backend:

First install the necessary python packages:
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


## Starting the backend service:

Now, to run the backend service for the very first time (or if you delete the docker container for MySQL), do:
```sh
./clean_startup.sh
```

If you already have the container created before and just need to start it back up, do:
```sh
./startup.sh
```

Now, you can access the backend endpoints from a browser or API on 
`localhost:8000/users`
and 
`localhost:8000/`


## Setup for Frontend:

First install the necessary frontend packages. From inside the frontend directory, run:
```sh
npm install
```

## Starting the frontend service:

To run the frontend service using React, from inside the frontend directory, run:
```sh
npm run dev
```

You can now access the frontend on `localhost:5173/`



## Additional details about how the startup scripts work for the backend:

This command starts the MySQL server database on a docker container and exposes it on your local port 3307 (we could use port 3306 locally but the local MySQL server runs on it, and therefore, is a conflict):
```sh
docker run --name harmless_pennywise_db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=harmless_pennywise -p 3307:3306 -d mysql:latest
```

If you need to stop the docker container with the MySQL database:
```sh
docker rm harmless_pennywise_db
```

This command imports the data from the csv file into the MySQL database server running on the docker container:
```sh
python database.py
```

This command runs the backend service using FastAPI (execute it from inside the backend directory):
```sh
uvicorn main:app --reload
```

