#!/usr/bin/env bash

mkdir -p .docker/mysql/data

# generate .env file
SECRET=$(openssl rand 128 | openssl sha256 | sed 's/(stdin)= //')
sed "s/APP_HASH_SECRET=.*/APP_HASH_SECRET=${SECRET}/" .env.example > .env

# get containers ready
docker-compose pull
docker-compose build app

# install dependencies
docker-compose run app composer install
docker-compose run node yarn install

# start up containers
docker-compose up -d

# set application key
docker-compose exec app php artisan key:generate

# wait until MySQL is really available
maxcounter=60
counter=0
while ! docker exec imagery_mysql bash -c 'mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD}' > /dev/null 2>&1; do
    sleep 1
    counter=`expr $counter + 1`
    if [ $counter -gt $maxcounter ]; then
        >&2 echo "FAILED: We have been waiting for MySQL too long, but we couldn't reach it."
        exit 1
    fi;
    echo "Waiting for MySQL to get ready... ${counter}s"
done
echo "Yay, MySQL is up and ready"

# setup database and seed with demo data
docker-compose exec app php artisan migrate
docker-compose exec app php artisan db:seed --class=DemoSeeder

# fully restart all containers (else there is a problem with the application key)
docker-compose down
docker-compose up -d

# just some user info
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
echo -e "\n"
echo -e "${GREEN}Yupii, installation successfull!${NC}\n"
echo -e "${YELLOW}NOTE:${NC} You'll need to add the proprietary fonts, to get this working properly."
echo -e "Ask ${YELLOW}admin at gruene dot ch${NC} for more information.\n"
echo -e "Now visit ${GREEN}http://localhost:8000${NC}"
echo -e "Login with the email ${GREEN}superadmin@user.login${NC} and ${GREEN}password${NC} as password"