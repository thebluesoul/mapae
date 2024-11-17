
docker-compose up --build

docker-compose down
docker-compose build --no-cache
docker-compose up

docker container prune -f
docker image prune -af

docker run -it --name debug_web docker_web:latest /bin/bash

curl -X POST -H 'Content-Type: application/json' -d '{}' http://localhost:8889/api/v1/cfssl/info

docker exec -it mapae_mysql mysql -u root -p

docker-compose exec mysql mysql -u root -p


mysql> use MAPAEDB
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show TABLES;
+-------------------+
| Tables_in_MAPAEDB |
+-------------------+
| certificates      |
| ocsp_responses    |
+-------------------+
2 rows in set (0.00 sec)

mysql> show variables like 'bind_address';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| bind_address  | *     |
+---------------+-------+
1 row in set (0.01 sec)

mysql> show variables like 'default_authentication_plugin';
+-------------------------------+-----------------------+
| Variable_name                 | Value                 |
+-------------------------------+-----------------------+
| default_authentication_plugin | caching_sha2_password |
+-------------------------------+-----------------------+
1 row in set (0.01 sec)

mysql> 


클라이언트 프로그램(DBeaver, Workbench 등)에서 연결 시 URL에 다음 옵션을 추가:
allowPublicKeyRetrieval=true&useSSL=false


docker-compose stop web
docker-compose build --no-cache web
docker-compose up -d web

