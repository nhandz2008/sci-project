#!/bin/bash

# SCI Project AWS EC2 Deployment Script
# This script sets up and deploys the SCI application on AWS EC2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="sci-project"
DEPLOY_USER="ubuntu"
DEPLOY_PATH="/opt/sci-production"
BACKUP_PATH="/opt/sci-backups"
LOG_PATH="/var/log/sci"

# Function to print colored output
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

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        exit 1
    fi
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_success "System packages updated"
}

# Function to install required packages
install_packages() {
    print_status "Installing required packages..."
    
    # Install essential packages
    sudo apt install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        htop \
        nginx \
        certbot \
        python3-certbot-nginx \
        fail2ban \
        ufw \
        logrotate \
        cron \
        rsync \
        backup-manager

    print_success "Required packages installed"
}

# Function to install Docker and Docker Compose
install_docker() {
    print_status "Installing Docker and Docker Compose..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Install Docker Compose standalone (if needed)
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker and Docker Compose installed"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Reset UFW
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow Docker ports (if needed for direct access)
    sudo ufw allow 8000/tcp comment "SCI Backend"
    sudo ufw allow 3000/tcp comment "SCI Frontend"
    
    # Enable UFW
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Function to configure fail2ban
configure_fail2ban() {
    print_status "Configuring fail2ban..."
    
    # Create fail2ban configuration
    sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF
    
    # Restart fail2ban
    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban
    
    print_success "Fail2ban configured"
}

# Function to create deployment directories
create_directories() {
    print_status "Creating deployment directories..."
    
    # Create main deployment directory
    sudo mkdir -p $DEPLOY_PATH
    sudo mkdir -p $BACKUP_PATH
    sudo mkdir -p $LOG_PATH
    
    # Create subdirectories
    sudo mkdir -p $DEPLOY_PATH/logs
    sudo mkdir -p $DEPLOY_PATH/backups
    sudo mkdir -p $DEPLOY_PATH/monitoring
    
    # Set ownership
    sudo chown -R $USER:$USER $DEPLOY_PATH
    sudo chown -R $USER:$USER $BACKUP_PATH
    sudo chown -R $USER:$USER $LOG_PATH
    
    print_success "Deployment directories created"
}

# Function to clone and setup project
setup_project() {
    print_status "Setting up project..."
    
    cd $DEPLOY_PATH
    
    # Clone the repository (replace with your actual repository URL)
    if [ ! -d "$PROJECT_NAME" ]; then
        git clone https://github.com/your-username/sci-project.git
    else
        cd $PROJECT_NAME
        git pull origin main
        cd ..
    fi
    
    cd $PROJECT_NAME
    
    # Copy production environment file
    if [ ! -f ".env" ]; then
        cp env.production.example .env
        print_warning "Please edit .env file with your production settings"
    fi
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p backups
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    print_success "Project setup completed"
}

# Function to configure Nginx (fallback)
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Get domain from environment or prompt
    DOMAIN=${DOMAIN:-"your-domain.com"}
    
    if [ "$DOMAIN" = "your-domain.com" ]; then
        read -p "Enter your domain name: " DOMAIN
    fi
    
    # Create initial Nginx configuration (HTTP only)
    sudo tee /etc/nginx/sites-available/sci > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
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
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/sci /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Create webroot for Let's Encrypt
    sudo mkdir -p /var/www/html/.well-known/acme-challenge/
    sudo chown -R www-data:www-data /var/www/html/
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    print_success "Nginx configured (HTTP only - SSL will be added after certificate generation)"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Get domain from environment or prompt
    DOMAIN=${DOMAIN:-"your-domain.com"}
    
    if [ "$DOMAIN" = "your-domain.com" ]; then
        read -p "Enter your domain name: " DOMAIN
    fi
    
    # Get email for SSL certificate
    SSL_EMAIL=${SSL_EMAIL:-"admin@$DOMAIN"}
    if [ "$SSL_EMAIL" = "admin@your-domain.com" ]; then
        read -p "Enter email for SSL certificate notifications: " SSL_EMAIL
    fi
    
    print_status "Obtaining SSL certificate for $DOMAIN..."
    
    # Obtain SSL certificate using webroot method
    sudo certbot certonly --webroot \
        --webroot-path=/var/www/html \
        --email $SSL_EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully"
        
        # Update Nginx configuration to include SSL
        print_status "Updating Nginx configuration with SSL..."
        
        sudo tee /etc/nginx/sites-available/sci > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
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
EOF
        
        # Test and reload Nginx
        sudo nginx -t && sudo systemctl reload nginx
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
        
        print_success "SSL certificates configured and Nginx updated"
    else
        print_error "Failed to obtain SSL certificate"
        print_warning "You can manually run: sudo certbot --nginx -d $DOMAIN"
        return 1
    fi
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    cd $DEPLOY_PATH/$PROJECT_NAME
    
    # Create monitoring configuration
    cat > monitoring/prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'sci-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']
    scrape_interval: 30s
EOF
    
    # Create Grafana datasource configuration
    mkdir -p monitoring/grafana/datasources
    cat > monitoring/grafana/datasources/prometheus.yml <<EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF
    
    print_success "Monitoring configured"
}

# Function to setup backup system
setup_backup() {
    print_status "Setting up backup system..."
    
    # Create backup script
    cat > $DEPLOY_PATH/backup.sh <<'EOF'
#!/bin/bash

# SCI Project Backup Script
BACKUP_DIR="/opt/sci-backups"
PROJECT_DIR="/opt/sci-production/sci-project"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cd $PROJECT_DIR
docker-compose exec -T db pg_dump -U sci_user sci_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C $PROJECT_DIR uploads/

# Backup configuration
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz -C $PROJECT_DIR .env docker-compose.prod.yml

# Remove old backups
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x $DEPLOY_PATH/backup.sh
    
    # Add to crontab (daily at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * $DEPLOY_PATH/backup.sh >> $LOG_PATH/backup.log 2>&1") | crontab -
    
    print_success "Backup system configured"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application..."
    
    cd $DEPLOY_PATH/$PROJECT_NAME
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_success "Application deployed successfully"
    else
        print_error "Application deployment failed"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    # Create logrotate configuration
    sudo tee /etc/logrotate.d/sci > /dev/null <<EOF
$LOG_PATH/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f $DEPLOY_PATH/$PROJECT_NAME/docker-compose.prod.yml restart backend
    endscript
}
EOF
    
    print_success "Log rotation configured"
}

# Function to create systemd service (optional)
create_systemd_service() {
    print_status "Creating systemd service..."
    
    sudo tee /etc/systemd/system/sci.service > /dev/null <<EOF
[Unit]
Description=SCI Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOY_PATH/$PROJECT_NAME
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable sci.service
    
    print_success "Systemd service created"
}

# Function to display deployment summary
display_summary() {
    print_success "Deployment completed successfully!"
    echo
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Project Location: $DEPLOY_PATH/$PROJECT_NAME"
    echo "Backup Location: $BACKUP_PATH"
    echo "Log Location: $LOG_PATH"
    echo
    echo "=== NEXT STEPS ==="
    echo "1. Edit the .env file with your production settings:"
    echo "   nano $DEPLOY_PATH/$PROJECT_NAME/.env"
    echo
    echo "2. Update your domain in Nginx configuration:"
    echo "   sudo nano /etc/nginx/sites-available/sci"
    echo
    echo "3. Setup SSL certificates:"
    echo "   sudo certbot --nginx -d your-domain.com"
    echo
    echo "4. Create admin user:"
    echo "   cd $DEPLOY_PATH/$PROJECT_NAME"
    echo "   docker-compose -f docker-compose.prod.yml exec backend python scripts/create_test_users.py"
    echo
    echo "5. Monitor the application:"
    echo "   docker-compose -f docker-compose.prod.yml logs -f"
    echo
    echo "=== USEFUL COMMANDS ==="
    echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "Restart: docker-compose -f docker-compose.prod.yml restart"
    echo "Update: cd $DEPLOY_PATH/$PROJECT_NAME && git pull && docker-compose -f docker-compose.prod.yml up -d"
    echo "Backup: $DEPLOY_PATH/backup.sh"
    echo
}

# Main deployment function
main() {
    print_status "Starting SCI Project AWS EC2 deployment..."
    
    check_root
    update_system
    install_packages
    install_docker
    configure_firewall
    configure_fail2ban
    create_directories
    setup_project
    configure_nginx
    setup_ssl
    setup_monitoring
    setup_backup
    setup_log_rotation
    create_systemd_service
    deploy_application
    display_summary
}

# Run main function
main "$@" 