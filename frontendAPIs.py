import system.System as System
import system.Role as Role
import system.Group as Group
import system.User as User
import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user
from uuid import uuid4
from datetime import datetime, timezone

app = Flask(__name__)
app.secret_key = "StoreKey1"

CORS(app, supports_credentials=True)

cookies = {}

tempSystem = System.System()

@app.route('/api/homeCheck', methods=['GET'])
def homeCheck():
    if tempSystem.getSetUpStatus():
        return jsonify({"message": "1"})
    else:
        return jsonify({"message": "0"})
    
@app.route('/api/setupInstance', methods=['POST'])
def setupInstance():
    data = request.get_json()
    customer_name = data.get('customerName')
    admin_password = data.get('adminPassword')
    contact_email = data.get('contactEmail')
    domain = data.get('domain')
    tempSystem.setUpInstance(customerName=customer_name, adminPassword=admin_password, contactEmail=contact_email, domain=domain)
    return jsonify({"message": "Instance is Setup"})

@app.route('/api/loginUser', methods=['POST'])
def loginUser():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if tempSystem.loginUser(inputUsername=username, inputPassword=password):
        tempCookie = str(uuid4())
        cookies[tempCookie] = [username, datetime.now(timezone.utc)]
        return jsonify({"message": "Success", "cookie_token": tempCookie})
    else:
        return jsonify({"message": "Failed"})
if __name__ == '__main__':
    app.run(debug=True, port=8080)