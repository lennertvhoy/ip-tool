# Deploying NetMaster to Azure Ubuntu VM

This guide will walk you through deploying the NetMaster application on an Azure Ubuntu Virtual Machine.

## 1. Create Azure VM

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" > "Compute" > "Virtual Machine"
3. Fill in the basic details:
   - Subscription: Select your subscription
   - Resource group: Create new or select existing
   - Virtual machine name: `netmaster-vm` (or your preferred name)
   - Region: Choose the closest to your users
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s (1 vCPU, 1 GB RAM) is sufficient for basic usage
   - Authentication:
     - Username: Your preferred username
     - Authentication type: Password or SSH public key
4. Networking:
   - Allow inbound ports: HTTP (80), HTTPS (443), and SSH (22)
5. Review + Create > Create

## 2. Connect to Your VM

### Using SSH (recommended):
```bash
ssh your-username@your-vm-ip
```

Replace `your-username` with the username you set and `your-vm-ip` with your VM's public IP address.

## 3. Install Required Software

Run these commands on your VM:

```bash
# Update package list
sudo apt update
sudo apt upgrade -y

# Install Python and required tools
sudo apt install -y python3 python3-pip python3-venv nginx

# Install Git
sudo apt install -y git
```

## 4. Get the Application Code

### Option 1: Clone from Git (if you have a repository)
```bash
git clone your-repository-url
cd your-repository-name
```

### Option 2: Transfer Files Using SCP (from your local machine)
```bash
# Run this on your local machine, not the VM
scp -r /path/to/your/local/project/* your-username@your-vm-ip:~/netmaster/
```

## 5. Set Up the Application

```bash
# Create and navigate to app directory (if using SCP)
cd ~/netmaster

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file if needed
touch .env
```

## 6. Set Up Gunicorn

Install Gunicorn:
```bash
pip install gunicorn
```

Create a Gunicorn service file:
```bash
sudo nano /etc/systemd/system/netmaster.service
```

Add this content:
```ini
[Unit]
Description=NetMaster Gunicorn Service
After=network.target

[Service]
User=your-username
Group=www-data
WorkingDirectory=/home/your-username/netmaster
Environment="PATH=/home/your-username/netmaster/venv/bin"
ExecStart=/home/your-username/netmaster/venv/bin/gunicorn --workers 3 --bind unix:netmaster.sock -m 007 app:app

[Install]
WantedBy=multi-user.target
```

Replace `your-username` with your actual username.

## 7. Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/netmaster
```

Add this content:
```nginx
server {
    listen 80;
    server_name your-vm-ip-or-domain;

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/your-username/netmaster/netmaster.sock;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/netmaster /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Start the Application

```bash
# Start Gunicorn service
sudo systemctl start netmaster
sudo systemctl enable netmaster

# Check status
sudo systemctl status netmaster
```

## 9. Set Up SSL (Optional but Recommended)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## 10. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## Troubleshooting

### Check Logs
- Application logs: `sudo journalctl -u netmaster`
- Nginx logs: 
  ```bash
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  ```

### Common Issues

1. **Application not starting:**
   - Check Gunicorn service status: `sudo systemctl status netmaster`
   - Verify file permissions
   - Check Python dependencies

2. **502 Bad Gateway:**
   - Verify Gunicorn is running
   - Check socket file permissions
   - Review Nginx configuration

3. **Permission Issues:**
   ```bash
   sudo chown -R your-username:www-data /home/your-username/netmaster
   sudo chmod -R 755 /home/your-username/netmaster
   ```

## Maintenance

### Updating the Application
```bash
# Navigate to app directory
cd ~/netmaster

# Pull new changes (if using Git)
git pull

# Activate virtual environment
source venv/bin/activate

# Update dependencies
pip install -r requirements.txt

# Restart services
sudo systemctl restart netmaster
sudo systemctl restart nginx
```

### Monitoring
- Monitor CPU/Memory: `htop`
- Disk usage: `df -h`
- Process status: `ps aux | grep gunicorn`

## Security Recommendations

1. Keep system updated:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Configure automatic security updates:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

3. Use strong passwords and SSH keys
4. Regularly backup your application data
5. Monitor system logs for suspicious activity
6. Keep Python packages updated
7. Use HTTPS with valid SSL certificates 