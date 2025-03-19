from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# In-memory storage for leaderboard (in a production environment, use a database)
leaderboard = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    return jsonify(sorted(leaderboard, key=lambda x: x['score'], reverse=True)[:10])

@app.route('/api/leaderboard', methods=['POST'])
def add_score():
    data = request.json
    score_entry = {
        'name': data.get('name', 'Anonymous'),
        'topic': data.get('topic'),
        'difficulty': data.get('difficulty'),
        'score': data.get('score'),
        'timestamp': datetime.now().isoformat()
    }
    leaderboard.append(score_entry)
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 