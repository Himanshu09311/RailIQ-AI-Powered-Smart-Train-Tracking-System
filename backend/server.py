#!/usr/bin/env python3
import os
import time
import json
import sqlite3
import bcrypt
import jwt
import requests
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS

DB_PATH = os.path.join(os.path.dirname(__file__), 'railiq.db')
JWT_SECRET = os.getenv('RAILIQ_JWT_SECRET', 'change-this-secret')
JWT_ALGO = 'HS256'
ALLOWED_ORIGINS = os.getenv('RAILIQ_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,file://').split(',')
TRAIN_API_BASE = os.getenv('TRAIN_API_BASE', 'https://rappid.in/apis/train.php')
TRAIN_API_KEY = os.getenv('TRAIN_API_KEY', '')

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})

RATE_LIMIT = 60
RATE_WINDOW_SECONDS = 60
request_log = defaultdict(deque)


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


def is_rate_limited(ip):
    now = time.time()
    entries = request_log[ip]
    while entries and now - entries[0] > RATE_WINDOW_SECONDS:
        entries.popleft()
    if len(entries) >= RATE_LIMIT:
        return True
    entries.append(now)
    return False


@app.before_request
def limit_requests():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown')
    if is_rate_limited(ip):
        return jsonify({'error': 'Rate limit exceeded. Try again later.'}), 429


def create_jwt(email, name):
    payload = {
        'email': email,
        'name': name,
        'exp': datetime.now(timezone.utc) + timedelta(hours=8),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_jwt(token):
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


def auth_user():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth.replace('Bearer ', '')
    try:
        return decode_jwt(token)
    except jwt.InvalidTokenError:
        return None


@app.get('/api/health')
def health():
    return jsonify({'status': 'ok'})


@app.post('/api/signup')
def signup():
    payload = request.get_json(silent=True) or {}
    name = payload.get('name', '').strip()
    email = payload.get('email', '').strip().lower()
    password = payload.get('password', '').strip()

    if len(name) < 3 or '@' not in email or len(password) < 8:
        return jsonify({'error': 'Invalid signup data'}), 400

    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', (name, email, pw_hash))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 409
    conn.close()
    return jsonify({'message': 'Signup successful'}), 201


@app.post('/api/login')
def login():
    payload = request.get_json(silent=True) or {}
    email = payload.get('email', '').strip().lower()
    password = payload.get('password', '').strip()

    conn = sqlite3.connect(DB_PATH)
    row = conn.execute('SELECT name, email, password_hash FROM users WHERE email=?', (email,)).fetchone()
    conn.close()

    if not row:
        return jsonify({'error': 'Invalid credentials'}), 401

    name, user_email, pw_hash = row
    if not bcrypt.checkpw(password.encode('utf-8'), pw_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_jwt(user_email, name)
    return jsonify({'token': token, 'user': {'name': name, 'email': user_email}})


@app.get('/api/me')
def me():
    user = auth_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'user': {'name': user['name'], 'email': user['email']}})


@app.post('/api/logout')
def logout():
    return jsonify({'message': 'Logged out'})


@app.get('/api/train-status')
def train_status_proxy():
    user = auth_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    train_no = request.args.get('train_no', '').strip()
    if not train_no:
        return jsonify({'error': 'train_no is required'}), 400

    params = {'train_no': train_no}
    if TRAIN_API_KEY:
        params['apikey'] = TRAIN_API_KEY

    try:
        resp = requests.get(TRAIN_API_BASE, params=params, timeout=12)
        return jsonify({'source': TRAIN_API_BASE, 'train_no': train_no, 'data': resp.json()}), resp.status_code
    except requests.RequestException:
        return jsonify({'error': 'Upstream train API unavailable'}), 502
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid response from upstream train API'}), 502


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=8000)
