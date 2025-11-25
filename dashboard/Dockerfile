FROM php:8.2-apache

# Install dependencies for Postgres and Redis extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# Install Redis extension via PECL
RUN pecl install redis && docker-php-ext-enable redis

# Enable Apache mod_rewrite if needed (optional)
RUN a2enmod rewrite

WORKDIR /var/www/html

COPY index.php .
