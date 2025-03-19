# Xbox Games Local Development Setup

This guide will help you set up the Xbox Games project locally on a WSL Ubuntu instance.

## Prerequisites

1. Windows 10 or 11 with WSL2 installed
2. Ubuntu 22.04 LTS or later installed via WSL
3. Git installed on Windows

## Step-by-Step Setup Instructions

### 1. Install Required System Packages

Open your WSL Ubuntu terminal and run:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git
```

### 2. Set Up Python Virtual Environment

```bash
# Navigate to your project directory
cd /path/to/XboxGames

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate
```

### 3. Install Python Dependencies

```bash
# Make sure you're in the virtual environment (you should see (venv) in your prompt)
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
touch .env
```

Add the following content to your `.env` file:

```
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1
```

### 5. Run the Application

```bash
# Make sure your virtual environment is activated
flask run --host=0.0.0.0
```

The application will be available at `http://localhost:5000`

## Development Tips

1. Always activate the virtual environment before running the application:
   ```bash
   source venv/bin/activate
   ```

2. To deactivate the virtual environment when you're done:
   ```bash
   deactivate
   ```

3. If you need to install new dependencies:
   ```bash
   pip install package_name
   pip freeze > requirements.txt
   ```

## Troubleshooting

1. If you get permission errors:
   ```bash
   sudo chown -R $USER:$USER .
   ```

2. If the port 5000 is already in use:
   ```bash
   # Find the process using port 5000
   sudo lsof -i :5000
   # Kill the process
   sudo kill -9 <PID>
   ```

3. If you can't access the application from Windows:
   - Make sure you're using `0.0.0.0` as the host
   - Check if your Windows firewall is blocking the connection
   - Try accessing via `http://localhost:5000` in your Windows browser

## Additional Resources

- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Python Virtual Environment Documentation](https://docs.python.org/3/tutorial/venv.html) 