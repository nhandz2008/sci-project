#!/bin/bash

# Add Domain to SCI Project
# This script helps you add a domain to an existing IP-based deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Adding domain to SCI Project deployment..."

# Get current server name from Nginx config
CURRENT_SERVER=$(grep -o 'server_name [^;]*' /etc/nginx/sites-available/sci | cut -d' ' -f2)

print_status "Current server configuration: $CURRENT_SERVER"

# Get new domain
read -p "Enter your new domain name: " NEW_DOMAIN

if [ -z "$NEW_DOMAIN" ]; then
    print_error "Domain name is required"
    exit 1
fi

# Validate domain format
if [[ "$NEW_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Please enter a valid domain name, not an IP address"
    exit 1
fi

print_status "Adding domain: $NEW_DOMAIN"

# Get email for SSL certificate
read -p "Enter email for SSL certificate notifications: " SSL_EMAIL

if [ -z "$SSL_EMAIL" ]; then
    print_error "Email is required for SSL certificate"
    exit 1
fi

# Create webroot for Let's Encrypt if it doesn't exist
sudo mkdir -p /var/www/html/.well-known/acme-challenge/
sudo chown -R www-data:www-data /var/www/html/

# Update Nginx configuration to include the new domain
print_status "Updating Nginx configuration..."

sudo tee /etc/nginx/sites-available/sci > /dev/null <<EOF
server {
    listen 80;
    server_name $CURRENT_SERVER $NEW_DOMAIN www.$NEW_DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF

# Test and reload Nginx
print_status "Testing Nginx configuration..."
sudo nginx -t

print_status "Reloading Nginx..."
sudo systemctl reload nginx

print_success "Nginx updated with new domain"

# Obtain SSL certificate
print_status "Obtaining SSL certificate for $NEW_DOMAIN..."

sudo certbot certonly --webroot \
    --webroot-path=/var/www/html \
    --email $SSL_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $NEW_DOMAIN \
    -d www.$NEW_DOMAIN

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained successfully"
    
    # Update Nginx configuration to include SSL
    print_status "Updating Nginx configuration with SSL..."
    
    sudo tee /etc/nginx/sites-available/sci > /dev/null <<EOF
server {
    listen 80;
    server_name $CURRENT_SERVER $NEW_DOMAIN www.$NEW_DOMAIN;
    
    # Redirect to HTTPS (only for domain, not IP)
    if (\$host ~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$) {
        # Don't redirect IP addresses
        break;
    }
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $NEW_DOMAIN www.$NEW_DOMAIN;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$NEW_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$NEW_DOMAIN/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTP server for IP address (no SSL)
server {
    listen 80;
    server_name $CURRENT_SERVER;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF
    
    # Test and reload Nginx
    sudo nginx -t && sudo systemctl reload nginx
    
    # Setup auto-renewal if not already configured
    if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
        print_status "SSL auto-renewal configured"
    fi
    
    print_success "Domain $NEW_DOMAIN added successfully with SSL!"
    print_status "Your application is now accessible at:"
    print_status "  HTTP:  http://$CURRENT_SERVER"
    print_status "  HTTPS: https://$NEW_DOMAIN"
    
else
    print_error "Failed to obtain SSL certificate"
    print_warning "You can manually run: sudo certbot --nginx -d $NEW_DOMAIN"
    print_status "Your application is still accessible at: http://$CURRENT_SERVER"
fi

print_success "Domain addition completed!" 