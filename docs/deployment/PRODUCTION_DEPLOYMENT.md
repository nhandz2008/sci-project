# SCI Project - Production Deployment Guide for AWS EC2

This guide provides step-by-step instructions for deploying the Science Competitions Insight (SCI) project to AWS EC2 with production-grade security, monitoring, and scalability.

## 📋 Prerequisites

Before starting the deployment, ensure you have:

- **AWS Account** with EC2 access
- **Domain Name** pointing to your EC2 instance
- **GitHub Repository** with your SCI project
- **SSH Key Pair** for EC2 access
- **Basic AWS Knowledge** (EC2, Security Groups, etc.)

## 🚀 Quick Start Deployment

### Step 1: Launch EC2 Instance

1. **Launch EC2 Instance:**
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance Type:** t3.medium (2 vCPU, 4 GB RAM) minimum
   - **Storage:** 20 GB GP3 SSD minimum
   - **Security Group:** Configure ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Security Group Configuration:**
   ```
   SSH (22): 0.0.0.0/0 (or your IP for security)
   HTTP (80): 0.0.0.0/0
   HTTPS (443): 0.0.0.0/0
   ```

3. **Connect to Instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

### Step 2: Automated Deployment

1. **Clone the deployment script:**
   ```bash
   wget https://raw.githubusercontent.com/your-username/sci-project/main/scripts/deploy-aws.sh
   chmod +x deploy-aws.sh
   ```

2. **Run the deployment script:**
   ```bash
   ./deploy-aws.sh
   ```

3. **Follow the prompts and configure your domain.**

## 🔧 Manual Deployment Steps

If you prefer manual deployment or need to customize the setup:

### Step 1: System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    curl wget git unzip \
    software-properties-common \
    apt-transport-https ca-certificates \
    gnupg lsb-release htop \
    nginx certbot python3-certbot-nginx \
    fail2ban ufw logrotate cron rsync
```

### Step 2: Install Docker

```bash
# Add Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Configure Security

```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Step 4: Setup Project

```bash
# Create deployment directory
sudo mkdir -p /opt/sci-production
sudo chown $USER:$USER /opt/sci-production
cd /opt/sci-production

# Clone your repository
git clone https://github.com/your-username/sci-project.git
cd sci-project

# Copy production environment
cp env.production.example .env
```

### Step 5: Configure Environment

Edit the `.env` file with your production settings:

```bash
nano .env
```

**Required changes:**
- `DOMAIN=your-domain.com`
- `POSTGRES_PASSWORD=your_secure_password`
- `SECRET_KEY=your_secure_secret_key`
- `SSL_EMAIL=admin@your-domain.com`
- `GITHUB_REPOSITORY=your-username/sci-project`

**Generate secure secrets:**
```bash
# Generate secret key
openssl rand -hex 32

# Generate Traefik auth (username:password)
echo -n "admin:password" | base64
```

### Step 6: Deploy Application

```bash
# Start the application
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 7: Setup SSL Certificates

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔒 Security Hardening

### 1. System Security

```bash
# Update SSH configuration
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
# Set: Port 2222 (optional)

sudo systemctl restart ssh

# Install security updates automatically
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2. Application Security

```bash
# Set proper file permissions
sudo chown -R $USER:$USER /opt/sci-production
chmod 600 /opt/sci-production/.env

# Configure backup encryption
sudo apt install -y encfs
```

### 3. Database Security

```bash
# Create database backup user
docker-compose -f docker-compose.prod.yml exec db psql -U sci_user -d sci_db -c "
CREATE USER backup_user WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE sci_db TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
"
```

## 📊 Monitoring Setup

### 1. Enable Monitoring Stack

```bash
# Start monitoring services
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access monitoring dashboards:
# - Grafana: https://grafana.your-domain.com (admin/admin)
# - Prometheus: https://prometheus.your-domain.com
# - Traefik: https://traefik.your-domain.com
```

### 2. Setup Alerts

Create alert rules in Prometheus:

```yaml
# monitoring/prometheus-rules.yml
groups:
  - name: sci-alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
```

### 3. Log Management

```bash
# Setup log aggregation
sudo apt install -y rsyslog

# Configure log rotation
sudo nano /etc/logrotate.d/sci
```

## 🔄 Backup Strategy

### 1. Automated Backups

```bash
# Create backup script
cat > /opt/sci-production/backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/sci-backups"

# Database backup
docker-compose -f /opt/sci-production/sci-project/docker-compose.prod.yml exec -T db pg_dump -U sci_user sci_db > $BACKUP_DIR/db_$DATE.sql

# Uploads backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /opt/sci-production/sci-project uploads/

# Configuration backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C /opt/sci-production/sci-project .env docker-compose.prod.yml

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x /opt/sci-production/backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/sci-production/backup.sh") | crontab -
```

### 2. Off-site Backup

```bash
# Setup AWS S3 backup (optional)
sudo apt install -y awscli

# Configure AWS credentials
aws configure

# Create S3 backup script
cat > /opt/sci-production/s3-backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/sci-backups"
S3_BUCKET="your-sci-backups-bucket"

# Upload backups to S3
aws s3 sync $BACKUP_DIR s3://$S3_BUCKET/backups/$DATE/

# Clean old S3 backups (keep 90 days)
aws s3 ls s3://$S3_BUCKET/backups/ | awk '{print $2}' | while read folder; do
    folder_date=$(echo $folder | cut -d'/' -f1)
    if [ $(date -d "$folder_date" +%s) -lt $(date -d "90 days ago" +%s) ]; then
        aws s3 rm s3://$S3_BUCKET/backups/$folder --recursive
    fi
done
EOF

chmod +x /opt/sci-production/s3-backup.sh
```

## 🔧 Maintenance Tasks

### 1. Regular Updates

```bash
# Update application
cd /opt/sci-production/sci-project
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker
docker system prune -f
```

### 2. Health Checks

```bash
# Check application health
curl -f https://your-domain.com/api/v1/health

# Check database
docker-compose -f docker-compose.prod.yml exec db pg_isready -U sci_user

# Check disk space
df -h

# Check memory usage
free -h
```

### 3. Performance Monitoring

```bash
# Monitor resource usage
htop

# Check Docker resource usage
docker stats

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start:**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs
   
   # Check environment
   docker-compose -f docker-compose.prod.yml config
   ```

2. **Database connection issues:**
   ```bash
   # Check database status
   docker-compose -f docker-compose.prod.yml exec db pg_isready -U sci_user
   
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs db
   ```

3. **SSL certificate issues:**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificates
   sudo certbot renew --dry-run
   ```

4. **High memory usage:**
   ```bash
   # Check memory usage
   docker stats
   
   # Restart services
   docker-compose -f docker-compose.prod.yml restart
   ```

### Emergency Procedures

1. **Rollback to previous version:**
   ```bash
   cd /opt/sci-production/sci-project
   git log --oneline
   git checkout <previous-commit>
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Restore from backup:**
   ```bash
   # Stop application
   docker-compose -f docker-compose.prod.yml down
   
   # Restore database
   docker-compose -f docker-compose.prod.yml up -d db
   docker-compose -f docker-compose.prod.yml exec -T db psql -U sci_user sci_db < backup.sql
   
   # Restart application
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📈 Scaling Considerations

### 1. Horizontal Scaling

For high traffic, consider:
- **Load Balancer:** AWS Application Load Balancer
- **Multiple Instances:** Auto Scaling Group
- **Database:** RDS PostgreSQL
- **Cache:** ElastiCache Redis

### 2. Vertical Scaling

Increase instance size:
- **t3.medium** → **t3.large** → **t3.xlarge**
- **Add more storage** for uploads and logs
- **Increase memory** for database performance

### 3. CDN Setup

```bash
# Configure CloudFront for static assets
# Update VITE_API_URL to use CDN endpoint
```

## 🔐 Security Checklist

- [ ] SSH key-based authentication only
- [ ] Firewall configured (UFW)
- [ ] Fail2ban enabled
- [ ] SSL certificates installed
- [ ] Regular security updates enabled
- [ ] Database backups encrypted
- [ ] Environment variables secured
- [ ] Monitoring and alerting configured
- [ ] Access logs enabled
- [ ] Rate limiting configured

## 📞 Support

For deployment issues:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify configuration: `docker-compose -f docker-compose.prod.yml config`
3. Check system resources: `htop`, `df -h`, `free -h`
4. Review security group settings in AWS Console

## 🎯 Next Steps

After successful deployment:
1. **Create admin user** using the provided script
2. **Configure monitoring alerts** for critical metrics
3. **Setup automated testing** in CI/CD pipeline
4. **Implement logging aggregation** (ELK stack)
5. **Plan disaster recovery** procedures
6. **Document runbooks** for common issues

---

**Note:** This deployment guide assumes a single-server setup. For production environments with high availability requirements, consider using AWS ECS, EKS, or similar container orchestration services. 