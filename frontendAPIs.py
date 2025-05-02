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
    tempSystem.saveInstance()
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

@app.route('/api/getUserPermissions', methods=['POST'])
def getUserPermissions():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        permissions = user.getRole().getPermissions()
        response = {
            "message": "Success",
            "permissions": permissions
        }
        return jsonify(response)
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/iam/getUsers', methods=['POST'])
def getUsers():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            users = tempSystem.getSysUsers()
            response = {
                "message": "Success",
                "users": [user.toDict() for user in users]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/home/getUserTasks', methods=['POST'])
def getUserTasks():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        tasks = user.getTasks()
        response = {
            "message": "Success",
            "tasks": [task.toDict() for task in tasks]
        }
        return jsonify(response)
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/getAllRoleNames', methods=['POST'])
def getAllRoles():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            roles = tempSystem.getSysRoles()
            response = {
                "message": "Success",
                "roles": [role.getDetails()[0] for role in roles]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/iam/changeUserRole', methods=['POST'])
def changeUserRole():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            target_username = data.get('target_username')
            new_role_name = data.get('new_role_name')
            tempSystem.changeUserRole(username=target_username, newRoleName=new_role_name)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/iam/createNewUser', methods=['POST'])
def createNewUser():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            new_username = data.get('new_username')
            new_password = data.get('new_password')
            new_role_name = data.get('new_role_name')
            nameOfUser = data.get('nameOfUser')
            tempSystem.createUser(username=new_username, password=new_password, roleName=new_role_name, name=nameOfUser)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/getDomain', methods=['GET'])
def getDomain():
    domain = tempSystem.getDomain()
    return jsonify({"domain": domain})

if __name__ == '__main__':
    app.run(debug=True, port=8080)