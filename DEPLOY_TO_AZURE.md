# Deploying NetMaster to Azure Ubuntu VM

This guide will walk you through deploying the NetMaster application on an Azure Ubuntu Virtual Machine with public IP 20.224.62.1.

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
ExecStart=/home/your-username/netmaster/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 app:app

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
    listen 20.224.62.1:80;
    server_name 20.224.62.1;

    access_log /var/log/nginx/netmaster.access.log;
    error_log /var/log/nginx/netmaster.error.log;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Before enabling the site, verify Nginx configuration:
```bash
sudo nginx -t
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/netmaster /etc/nginx/sites-enabled
sudo systemctl restart nginx
```

## 8. Configure Azure Network Security Group

1. Go to your VM's Network Security Group in Azure Portal
2. Add inbound security rules:
   - Allow TCP port 80 from any source
   - Allow TCP port 443 from any source (if using HTTPS)
   - Priority: 1000 (or lower than your deny rules)

## 9. Verify Public Access

Test the application is accessible:
```bash
curl http://20.224.62.1
```

You should see the HTML content of your application.

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

## Additional Network Configuration

### Configure UFW (Uncomplicated Firewall)
```bash
# Allow specific IP and ports
sudo ufw allow from any to 20.224.62.1 port 80 proto tcp
sudo ufw allow from any to 20.224.62.1 port 443 proto tcp
sudo ufw allow ssh
sudo ufw enable
```

### Verify Network Binding
```bash
# Check if the ports are listening
sudo netstat -tulpn | grep -E ':80|:8000'

# Check Nginx error logs if there are issues
sudo tail -f /var/log/nginx/error.log
```

### Troubleshooting Network Issues

1. **If the site is not accessible:**
   ```bash
   # Check if Gunicorn is running
   sudo systemctl status netmaster
   
   # Check if Nginx is running
   sudo systemctl status nginx
   
   # Check if the port is being used
   sudo lsof -i :80
   sudo lsof -i :8000
   ```

2. **If you get a "bind() failed" error:**
   ```bash
   # Check if the IP is properly configured
   ip addr show
   
   # Verify Nginx has permissions to bind to the IP
   sudo setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx
   ```

3. **Monitor incoming connections:**
   ```bash
   # Watch incoming connections in real-time
   sudo tcpdump -i any port 80
   ```

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