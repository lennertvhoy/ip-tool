# NetMaster - Network Learning Platform

An interactive educational platform for practicing binary, hexadecimal, subnetting, and VLSM concepts.

## Local Development Setup

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
flask run
```

## Azure Deployment Guide

### 1. Prerequisites
```bash
# Install Azure CLI (if not installed)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login
```

### 2. Create Azure Resources
```bash
# Set variables
RESOURCE_GROUP="netmaster-rg"
LOCATION="westeurope"
VM_NAME="netmaster-vm"
ADMIN_USERNAME="azureuser"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create VM
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image Ubuntu2204 \
  --admin-username $ADMIN_USERNAME \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --size Standard_B1s

# Open ports
az vm open-port \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --port 80,443

# Get VM's public IP
VM_IP=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  -d \
  --query publicIps \
  -o tsv)
echo $VM_IP
```

### 3. Deploy Application
```bash
# Create deployment directory and copy files
mkdir -p ~/netmaster-deploy
cd ~/netmaster-deploy
cp -r /path/to/your/netmaster/* .

# Transfer files to VM
scp -r * $ADMIN_USERNAME@$VM_IP:~/netmaster/
```

### 4. Server Setup
SSH into your VM and run these commands:

```bash
# Connect to VM
ssh $ADMIN_USERNAME@$VM_IP

# Update system and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx

# Set up application
cd ~/netmaster
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Set correct permissions for home directory
sudo chmod 755 /home/azureuser

# Create Gunicorn service file
sudo tee /etc/systemd/system/netmaster.service << 'EOF'
[Unit]
Description=NetMaster Gunicorn Service
After=network.target

[Service]
User=azureuser
Group=www-data
WorkingDirectory=/home/azureuser/netmaster
Environment="PATH=/home/azureuser/netmaster/venv/bin"
ExecStart=/home/azureuser/netmaster/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 app:app

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/netmaster << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/azureuser/netmaster/static/;
        expires max;
        add_header Cache-Control "public";
    }
}
EOF

# Set up Nginx
sudo ln -s /etc/nginx/sites-available/netmaster /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t

# Set correct permissions
sudo chown -R azureuser:www-data /home/azureuser/netmaster
sudo chmod -R 755 /home/azureuser/netmaster
sudo chmod 755 /home/azureuser/netmaster/static
sudo chmod -R 644 /home/azureuser/netmaster/static/*
sudo find /home/azureuser/netmaster/static -type d -exec chmod 755 {} \;

# Start and enable services
sudo systemctl daemon-reload
sudo systemctl start netmaster
sudo systemctl enable netmaster
sudo systemctl restart nginx

# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow OpenSSH
sudo ufw --force enable
```

### 5. Verify Deployment
Your application should now be accessible at `http://<your-vm-ip>`.

## Troubleshooting

### Check Service Status
```bash
# Check Gunicorn service status
sudo systemctl status netmaster

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# View application logs
sudo journalctl -u netmaster -f
```

### Common Issues

1. **Static files not loading:**
```bash
# Fix permissions for static files
sudo chmod 755 /home/azureuser
sudo chmod 755 /home/azureuser/netmaster
sudo chmod 755 /home/azureuser/netmaster/static
sudo chmod -R 644 /home/azureuser/netmaster/static/*
sudo find /home/azureuser/netmaster/static -type d -exec chmod 755 {} \;
sudo chown -R azureuser:www-data /home/azureuser/netmaster/static

# Restart services
sudo systemctl restart netmaster
sudo systemctl restart nginx
```

2. **Connection refused:**
```bash
# Check if ports are open
sudo netstat -tulpn | grep -E ':80|:8000'

# Verify NSG rule
az network nsg rule list \
  --resource-group netmaster-rg \
  --nsg-name netmaster-vmNSG \
  --query "[].{Name:name, Priority:priority, Port:destinationPortRange, Access:access}" \
  -o table
```

## Updating the Application

```bash
# SSH into VM
ssh azureuser@<your-vm-ip>

# Navigate to app directory
cd ~/netmaster

# Pull latest changes (if using git)
git pull

# Install any new dependencies
source venv/bin/activate
pip install -r requirements.txt

# Restart services
sudo systemctl restart netmaster
sudo systemctl restart nginx
``` 