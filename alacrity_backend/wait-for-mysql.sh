#!/bin/sh
until mysqladmin ping -h "$DJANGO_DATABASE_HOST" -P "$DJANGO_DATABASE_PORT" -u "$DJANGO_DATABASE_USER" -p"$DJANGO_DATABASE_PASSWORD" --silent; do
    echo "Waiting for MySQL..."
    sleep 2
done
echo "MySQL is up - executing command"
exec "$@"