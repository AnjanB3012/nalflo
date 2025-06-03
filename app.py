import system.System as System
import system.Role as Role
import system.Group as Group
import system.User as User
import system.API as API
import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user
from uuid import uuid4
from datetime import datetime, timezone
from pyhold import pyhold
import uuid

app = Flask(__name__)
app.secret_key = "StoreKey1"

CORS(app, supports_credentials=True)

cookies = pyhold("cookies.xml")

tempSystem = System.System()

def stringFunctionMaker(inputFunctionString):
    # Indent each line of the user-supplied function body
    return "\n    ".join(
        repr(line)[1:-1]
        for line in inputFunctionString.split("<break>")
    )

# New APIs go here



# AI Access System APIs go here
@app.route('/ai/getSystemUsers', methods=['POST'])
def getSystemUsers():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        users = tempSystem.getSysUsers()
        return jsonify({"message": "Success", "users": [user.toDict() for user in users]})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/ai/getSystemRoles', methods=['POST'])
def getSystemRoles():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        roles = tempSystem.getSysRoles()
        return jsonify({"message": "Success", "roles": [role.toDict() for role in roles]})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/getSystemGroups', methods=['POST'])
def getSystemGroups():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        groups = tempSystem.getSysGroups()
        return jsonify({"message": "Success", "groups": [group.toDict() for group in groups]})
    
@app.route('/ai/getSystemAPIs', methods=['POST'])
def getSystemAPIs():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        apis = tempSystem.getSysAPIs()
        return jsonify({"message": "Success", "apis": [{k: v for k, v in api.toDict().items() if k != "apiString"} for api in apis]})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/getSystemTasks', methods=['POST'])
def getSystemTasks():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        tasks = tempSystem.getSysTasks()
        return jsonify({"message": "Success", "tasks": [task.toDict() for task in tasks]})

@app.route('/ai/fetchUser', methods=['POST'])
def fetchUser():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        user = tempSystem.getUser(data.get('username'))
        return jsonify({"message": "Success", "user": user.toDict()})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/fetchRole', methods=['POST'])
def fetchRole():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        role = tempSystem.findRoleByTitle(data.get('roleName'))
        return jsonify({"message": "Success", "role": role.toDict()})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/fetchGroup', methods=['POST'])
def fetchGroup():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        group = tempSystem.findGroupByTitle(data.get('groupName'))
        return jsonify({"message": "Success", "group": group.toDict()})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/fetchAPI', methods=['POST'])
def fetchAPI():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        api = tempSystem.findAPIByName(data.get('apiName'))
        return jsonify({"message": "Success", "api": api.toDict()})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/fetchTask', methods=['POST'])
def fetchTask():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        task = tempSystem.findTaskByID(data.get('taskId'))
        return jsonify({"message": "Success", "task": task.toDict()})   
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/createTask', methods=['POST'])
def createTask():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        tempTask = tempSystem.createTask(data.get('taskName'), data.get('taskDescription'), data.get('taskStatus'))
        assignees = data.get('assignees')
        for assignee in assignees:
            tempSystem.assignUserToTask(assignee, tempTask.getTaskId())
        return jsonify({"message": "Success", "taskId": tempTask.getTaskId()})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/updateTask', methods=['POST'])
def updateTask():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        tempSystem.updateTask(data.get('taskId'), data.get('taskName'), data.get('taskDescription'), data.get('taskStatus'))
        return jsonify({"message": "Success"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/deleteTask', methods=['POST'])
def deleteTask1():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        tempSystem.deleteTask(data.get('taskId'))
        return jsonify({"message": "Success"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/ai/closeTask', methods=['POST'])
def closeTask1():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        tempSystem.closeTask(data.get('taskId'))
        return jsonify({"message": "Success"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/ai/assignUsersToTask', methods=['POST'])
def assignUsersToTask1():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == tempSystem.getAIAccessToken():
        for assignee in data.get('assignees'):
            tempSystem.assignUserToTask(assignee, data.get('taskID'))
        return jsonify({"message": "Success"})
    else:
        return jsonify({"message": "Failed"})

# Communication APIs go here
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
    
    # Validate required fields
    if not all([customer_name, admin_password, contact_email, domain]):
        return jsonify({"message": "Error", "error": "All fields (customerName, adminPassword, contactEmail, domain) are required"}), 400
        
    ai_access_token = str(uuid.uuid4())
    tempSystem.setUpInstance(customerName=customer_name, adminPassword=admin_password, contactEmail=contact_email, domain=domain, aiAccessToken=ai_access_token)
    return jsonify({"message": "Instance is Setup", "aiAccessToken": ai_access_token})

@app.route('/api/loginUser', methods=['POST'])
def loginUser():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if tempSystem.loginUser(inputUsername=username, inputPassword=password):
        tempCookie = str(uuid4())
        cookies[tempCookie] = [username, str(datetime.now(timezone.utc))]
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
        if user is None:
            return jsonify({"message": "User not found"})
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
        if user is None:
            return jsonify({"message": "User not found"})
        if user.getRole().getPermissions()['home']:
            tasks = user.getTasks()
            response = {
                "message": "Success",
                "tasks": [task.toDict() for task in tasks]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
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
            tempSystem.changeUserRole(username=target_username, roleName=new_role_name)
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

@app.route('/api/iam/viewUser', methods=['POST'])
def viewUser():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            target_username = data.get('target_username')  # Debug print
            target_user = tempSystem.getUser(username=target_username)
            if target_user is None: # Debug print
                return jsonify({"message": "User not found"})
            response = {
                "message": "Success",
                "user": target_user.toDict()
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/getRoles', methods=['POST'])
def getRoles():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            roles = tempSystem.getSysRoles()
            response = {
                "message": "Success",
                "roles": [role.toDict() for role in roles]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/viewRole', methods=['POST'])
def viewRole():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            role_name = data.get('role_name')
            role = tempSystem.findRoleByTitle(role_name)
            if role is None:
                return jsonify({"message": "Role not found"})
            response = {
                "message": "Success",
                "role": role.toDict()
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/createRole', methods=['POST'])
def createRole():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            role_name = data.get('role_name')
            role_description = data.get('role_description')
            permissions = data.get('permissions')
            tempSystem.createRole(role_name, role_description, permissions)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/updateRolePermissions', methods=['POST'])
def updateRolePermissions():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            role_name = data.get('role_name')
            permissions = data.get('permissions')
            tempSystem.updateRolePermissions(role_name, permissions)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/addUserToRole', methods=['POST'])
def addUserToRole():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            role_name = data.get('role_name')
            user_name = data.get('user_name')
            tempSystem.changeUserRole(username=user_name, roleName=role_name)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/iam/getAllGroups', methods=['POST'])
def getAllGroups():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            groups = tempSystem.getSysGroups()
            response = {
                "message": "Success",
                "groups": [group.toDict() for group in groups]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/iam/viewGroup', methods=['POST'])
def viewGroup():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            group = tempSystem.findGroupByTitle(group_title)
            if group is None:
                return jsonify({"message": "Group not found"})
            response = {
                "message": "Success",
                "group": group.toDict()
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/addUserToGroup', methods=['POST'])
def addUserToGroup():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            user_name = data.get('user_name')
            tempSystem.addUserToGroups(username=user_name, groupNames=[group_title])
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/removeUserFromGroup', methods=['POST'])
def removeUserFromGroup():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            user_name = data.get('user_name')
            tempSystem.removeUserFromGroup(username=user_name, groupName=group_title)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/createGroup', methods=['POST'])
def createGroup():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            group_description = data.get('group_description')
            try:
                tempSystem.createGroup(groupTitle=group_title, groupDescription=group_description)
                return jsonify({"message": "Success"})
            except ValueError as e:
                return jsonify({"message": str(e)})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/deleteGroup', methods=['POST'])
def deleteGroup():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            try:
                tempSystem.deleteGroup(group_title)
                return jsonify({"message": "Success"})
            except ValueError as e:
                return jsonify({"message": str(e)})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/iam/changeUserPassword', methods=['POST'])
def changeUserPassword():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            target_username = data.get('target_username')
            new_password = data.get('new_password')
            target_user = tempSystem.getUser(username=target_username)
            if target_user is None:
                return jsonify({"message": "User not found"})
            target_user.setPassword(new_password)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    

@app.route('/api/home/getAssignableUsersToTask', methods=['POST'])
def getAssignableUsersToTask():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            if user.getRole().getPermissions()['AssignToAll']:
                users = tempSystem.getSysUsers()
                response = {
                    "message": "Success",
                    "users": [user.toDict() for user in users]
                }
                return jsonify(response)
            else:
                userGroups = user.getGroups()
                assignableUsers = []
                for group in userGroups:
                    users1 = group.getUsers()
                    for user1 in users1:
                        if user1 != user and user1 not in assignableUsers:
                            assignableUsers.append(user1)
                response = {
                    "message": "Success",
                    "users": [user.toDict() for user in assignableUsers]
                }
                return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/home/createNewTask', methods=['POST'])
def createNewTask():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            task_title = data.get('task_title')
            task_description = data.get('task_description')
            task_assignees = data.get('task_assignees')
            previous_task_id = data.get('previous_task_id')
            
            # Validate required fields
            if not task_title or not task_description:
                return jsonify({"message": "Task title and description are required"})
            
            previous_task = None
            if previous_task_id:
                previous_task = tempSystem.findTaskByID(int(previous_task_id))
                if not previous_task:
                    return jsonify({"message": "Previous task not found"})
                
                # Check if user has permission to reply to this task
                if (username != previous_task.getCreatorUser().getUserName() and 
                    username not in [u.getUserName() for u in previous_task.getAssignedUsers()]):
                    return jsonify({"message": "You don't have permission to reply to this task"})
                
                # For reply tasks, ensure the creator and original task creator are included
                if previous_task:
                    # Add the original task creator if not already in assignees
                    if previous_task.getCreatorUser().getUserName() not in task_assignees:
                        task_assignees.append(previous_task.getCreatorUser().getUserName())
                    # Add the current user if not already in assignees
                    if username not in task_assignees:
                        task_assignees.append(username)
                    
                    # If this is a reply task, close the previous task
                    # Check if current user is either creator or assignee of previous task
                    if (username == previous_task.getCreatorUser().getUserName() or 
                        username in [u.getUserName() for u in previous_task.getAssignedUsers()]):
                        tempSystem.closeTask(previous_task.getTaskId())
            
            # Create the task
            try:
                tempSystem.createTask(
                    task_title, 
                    task_description, 
                    task_assignees, 
                    user,
                    previousTask=[previous_task] if previous_task else []
                )
                return jsonify({"message": "Success"})
            except Exception as e:
                return jsonify({"message": f"Failed to create task: {str(e)}"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/home/deleteTask', methods=['POST'])
def deleteTask():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            task_id = data.get('task_id')
            task = tempSystem.findTaskByID(task_id)
            if task and task.getCreatorUser().getUserName() == username:
                tempSystem.removeTask(task)
                return jsonify({"message": "Success"})
            else:
                return jsonify({"message": "Permission Denied"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/home/closeTask', methods=['POST'])
def closeTask():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            task_id = data.get('task_id')
            task = tempSystem.findTaskByID(int(task_id))
            if task:
                # Check if user is creator or assignee
                if (task.getCreatorUser().getUserName() == username or 
                    username in [u.getUserName() for u in task.getAssignedUsers()]):
                    if tempSystem.closeTask(int(task_id)):
                        return jsonify({"message": "Success"})
                    else:
                        return jsonify({"message": "Failed to close task"})
                else:
                    return jsonify({"message": "Permission Denied - Not task creator or assignee"})
            else:
                return jsonify({"message": "Task not found"})
        else:
            return jsonify({"message": "Permission Denied - No home permission"})
    else:
        return jsonify({"message": "Failed - Invalid session"})

@app.route('/api/home/assignUsersToTask', methods=['POST'])
def assignUsersToTask():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            task_id = data.get('task_id')
            new_assignees = data.get('new_assignees')
            if username in new_assignees:
                new_assignees.remove(username)
            task = tempSystem.findTaskByID(int(task_id))
            if task and task.getCreatorUser().getUserName() == username:
                # Get current assignees
                current_assignees = [u.getUserName() for u in task.getAssignedUsers()]
                
                # Remove users that are no longer assigned
                for current_assignee in current_assignees:
                    if current_assignee not in new_assignees:
                        assignee_user = tempSystem.getUser(current_assignee)
                        if assignee_user:
                            task.assignedUsers.remove(assignee_user)
                
                # Add new assignees
                for assignee in new_assignees:
                    if assignee not in current_assignees:
                        assignee_user = tempSystem.getUser(assignee)
                        if assignee_user:
                            task.assignUser(assignee_user)
                return jsonify({"message": "Success"})
            else:
                return jsonify({"message": "Permission Denied"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/addNewAPI', methods=['POST'])
def addNewAPI():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            api_name = data.get('api_name')
            api_description = data.get('api_description')
            api_endpoint = data.get('api_endpoint')
            api_string = data.get('api_string')
            tempAPI = API.API(apiName=api_name, apiDescription=api_description, apiEndpoint=api_endpoint, apiString=api_string)
            tempSystem.addAPI(tempAPI)
            functionStr = stringFunctionMaker(api_string)
            new_endpoint = (
                f"@app.route('/{api_endpoint}', methods=['GET', 'POST'])\n"
                f"def {api_endpoint}():\n"
                f"    {functionStr}\n"
            )
            with open("app.py", "r") as f:
                content = f.read()
            head, sep, tail = content.partition("# New APIs go here\n")
            if not sep:
                return jsonify({"error": "Marker line not found in hostServer.py"}), 500
            updated_content = head + sep + new_endpoint + "\n" + tail
            with open("app.py", "w") as f:
                f.write(updated_content)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/apis/getAllAPIs', methods=['POST'])
def getAllAPIs():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = tempSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            apis = tempSystem.getSysAPIs()
            response = {
                "message": "Success",
                "apis": [api.toDict() for api in apis]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=8080, use_reloader=False)