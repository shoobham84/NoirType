import os

from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session, jsonify
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import login_required

app = Flask(__name__)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

db = SQL("sqlite:///project.db")

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response



@app.route("/", methods=['GET'])
def index():
    user_id = session.get('user_id')
    return render_template('index.html')



@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get('confirmation')

        if not username:
            flash("Username Rejected")
            return render_template('register.html')
        if not password:
            flash("Password Rejected")
            return render_template('register.html')
        if password != confirmation:
            flash("Passwords do not match")
            return render_template('register.html')

        hash_pw = generate_password_hash(password)

        try:
            id = db.execute('INSERT INTO users (name, hash) VALUES (?, ?)', username, hash_pw)
        except ValueError:
            flash("Username already exists")
            return render_template('register.html')

        session['user_id'] = id
        return redirect('/')
    return render_template('register.html')



@app.route('/login', methods=['GET', 'POST'])
def login():
    session.clear()
    if request.method == 'POST':
        username = request.form.get("username")
        password = request.form.get("password")

        if not username:
            flash("Must provide username")
            return render_template('login.html')
        if not password:
            flash("Must provide password")
            return render_template('login.html')

        rows = db.execute('SELECT * FROM users WHERE name = ?', username)

        if len(rows) != 1:
            flash("Invalid Username")
            return render_template('login.html')

        if not check_password_hash(rows[0]['hash'], password):
            flash("Invalid Password")
            return render_template('login.html')

        session['user_id'] = rows[0]['id']
        return redirect('/')
    return render_template('login.html')



@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')



@app.route('/leaderboard', methods=['GET'])
@login_required
def leaderboard():
    top_scores = db.execute("""
        SELECT users.name, MAX(history.wpm) as max_wpm, history.accuracy, history.mode FROM history
                            JOIN users ON history.user_id = users.id
                            GROUP BY users.id
                            ORDER BY max_wpm DESC
                            LIMIT 10
                            """)
    return render_template('leaderboard.html', scores=top_scores)


@app.route('/profile', methods=['GET'])
@login_required
def profile():
    user_id = session.get('user_id')
    user = db.execute('SELECT name, created_at FROM users WHERE id = ?', user_id)[0]

    stats = db.execute("""SELECT MAX(wpm) as max_wpm, ROUND(AVG(wpm)) as avg_wpm, COUNT(id) as total_tests FROM history WHERE user_id = ?""", user_id)[0]

    history = db.execute('SELECT wpm, accuracy, mode, timestamp FROM history WHERE user_id = ? ORDER BY timestamp DESC', user_id)

    return render_template('profile.html', user=user, stats=stats, history=history)



@app.errorhandler(404)
def page_not_found(error):
    return render_template('notfound.html'), 404



@app.route('/api/save_score', methods=['POST'])
def save_score():
    data = request.get_json()

    if not data:
        return jsonify({"error":"Invalid Request"}), 400

    current_wpm = data.get("wpm")
    accuracy = data.get("accuracy")
    mode = data.get("mode")

    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'max_wpm':current_wpm, 'message':'Guest User'})

    db.execute('INSERT INTO history (user_id, wpm, accuracy, mode) VALUES (?, ?, ?, ?)', user_id, current_wpm, accuracy, mode)

    rows = db.execute('SELECT MAX(wpm) AS max_wpm FROM history WHERE user_id = ? AND mode = ?', user_id, mode)

    max_wpm = rows[0]['max_wpm'] if rows and rows[0]['max_wpm'] is not None else current_wpm

    return jsonify({'max_wpm': max_wpm})



