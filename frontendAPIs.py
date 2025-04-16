import system.System as System
import system.Role as Role
import system.Group as Group
import system.User as User
import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = "StoreKey1"

tempSystem = System.System()

@app.route('/', methods=['GET', 'POST'])
def home():
    if tempSystem.getSetUpStatus() == False:
        return redirect(url_for('setup'))
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

if __name__ == '__main__':
    app.run(debug=True, port=8080)