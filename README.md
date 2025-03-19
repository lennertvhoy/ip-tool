# NetMaster - Network Learning Platform

An interactive educational platform for practicing binary, hexadecimal, subnetting, and VLSM concepts.

## Deploying to Azure from WSL

### Prerequisites
- Azure CLI installed on WSL
- Git installed on WSL
- SSH key pair generated on WSL

### 1. Install Azure CLI on WSL (if not installed)
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 2. Login to Azure
```bash
# Login to Azure
az login

# List your subscriptions
az account list --output table

# Set your subscription (if needed)
az account set --subscription <your-subscription-id>
```

### 3. Create Resource Group and VM
```bash
# Set variables
RESOURCE_GROUP="netmaster-rg"
LOCATION="eastus"  # or your preferred region
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
```

### 4. Get VM's Public IP
```bash
VM_IP=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  -d \
  --query publicIps \
  -o tsv)
echo $VM_IP  # Save this IP address
```

### 5. Deploy Application Files
```bash
# Create deployment directory
mkdir -p ~/netmaster-deploy
cd ~/netmaster-deploy

# Copy application files
cp -r /path/to/your/netmaster/* .

# Transfer files to VM
scp -r * $ADMIN_USERNAME@$VM_IP:~/netmaster/
```

### 6. SSH into VM and Set Up Application
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

# Create Gunicorn service
sudo tee /etc/systemd/system/netmaster.service << EOF
[Unit]
Description=NetMaster Gunicorn Service
After=network.target

[Service]
User=$ADMIN_USERNAME
Group=www-data
WorkingDirectory=/home/$ADMIN_USERNAME/netmaster
Environment="PATH=/home/$ADMIN_USERNAME/netmaster/venv/bin"
ExecStart=/home/$ADMIN_USERNAME/netmaster/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 app:app

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/netmaster << EOF
server {
    listen 80;
    server_name $VM_IP;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site and configure Nginx
sudo ln -s /etc/nginx/sites-available/netmaster /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t
sudo systemctl restart nginx

# Start application
sudo systemctl start netmaster
sudo systemctl enable netmaster
```

### 7. Verify Deployment
```bash
# Check service status
sudo systemctl status netmaster
sudo systemctl status nginx

# Test the application
curl http://$VM_IP
```

Your application should now be accessible at `http://<your-vm-ip>`.

## Troubleshooting

### Check Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application logs
sudo journalctl -u netmaster -f
```

### Common Issues

1. **Application not starting:**
```bash
# Check Gunicorn
sudo systemctl status netmaster

# Check permissions
sudo chown -R $ADMIN_USERNAME:www-data /home/$ADMIN_USERNAME/netmaster
sudo chmod -R 755 /home/$ADMIN_USERNAME/netmaster
```

2. **Nginx not serving application:**
```bash
# Verify Nginx config
sudo nginx -t

# Check if Gunicorn is listening
sudo netstat -tulpn | grep 8000
```

3. **Cannot connect to server:**
```bash
# Check firewall
sudo ufw status

# Allow HTTP traffic if needed
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Maintenance

### Updating the Application
```bash
# SSH into VM
ssh $ADMIN_USERNAME@$VM_IP

# Update application files
cd ~/netmaster
# Update your files here

# Restart services
sudo systemctl restart netmaster
sudo systemctl restart nginx
```

### Monitoring
```bash
# Check CPU/Memory usage
htop

# Check disk space
df -h

# Monitor network connections
sudo netstat -tulpn
``` 