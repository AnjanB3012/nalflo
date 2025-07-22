import system.System as System
import system.Role as Role
import system.Group as Group
import system.User as User
import system.API as API
import system.ThreadAPI as ThreadAPI
import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager, login_user
from uuid import uuid4
from datetime import datetime, timezone
from pyhold import pyhold
import uuid
import werkzeug
import threading
import signal
import sys
from threading import Event
import time
import textwrap

app = Flask(__name__)
app.secret_key = "StoreKey1"

CORS(app, supports_credentials=True)

cookies = pyhold("cookies.xml")

thisSystem = System.System()

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

active_threads = {}  # Dictionary to track active threads and their stop events

def stringFunctionMaker(inputFunctionString):
    return "\n".join(
        repr(line)[1:-1]
        for line in inputFunctionString.split("<break>")
    )

def start_thread(thread_api, thread_args=None):
    """Helper function to start a single thread"""
    if thread_args is None:
        thread_args = {}
    
    # Create a stop event for this thread
    stop_event = Event()
    
    def thread_function():
        namespace = {'thisSystem': thisSystem, **thread_args}
        # Handle both ThreadAPI objects and dictionaries
        thread_string = thread_api.getThreadString() if hasattr(thread_api, 'getThreadString') else thread_api['threadString']
        
        # Add stop event to namespace
        namespace['stop_event'] = stop_event
        
        # Wrap the thread code in a try-except to handle cleanup
        try:
            # Execute the thread code directly
            exec(thread_string, namespace)
        except Exception as e:
            print(f"Thread {thread_api.getThreadName() if hasattr(thread_api, 'getThreadName') else thread_api['threadName']} error: {str(e)}")
        finally:
            # Clean up thread tracking when it exits
            thread_name = thread_api.getThreadName() if hasattr(thread_api, 'getThreadName') else thread_api['threadName']
            if thread_name in active_threads:
                del active_threads[thread_name]
    
    thread = threading.Thread(target=thread_function, daemon=True)
    thread.start()
    
    # Store thread and stop event
    thread_name = thread_api.getThreadName() if hasattr(thread_api, 'getThreadName') else thread_api['threadName']
    active_threads[thread_name] = {'thread': thread, 'stop_event': stop_event}
    
    return thread

def start_all_threads():
    """Start all threads in the system"""
    if not thisSystem.getSetUpStatus():
        return
        
    threads = thisSystem.getSysThreads()
    for thread_api in threads:
        start_thread(thread_api)

# Start all threads when the app initializes
start_all_threads()

# New APIs go here




# AI Access System APIs go here
@app.route('/ai/getSystemAPIGroups', methods=['POST'])
def getSystemAPIGroups():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        api_groups = thisSystem.getSysAPIGroups()
        # Convert API groups to AI string format
        api_group_strings = [api_group.toAIString() for api_group in api_groups if api_group is not None]
        return jsonify({"message": "Success", "apiGroups": api_group_strings})
    else:
        return jsonify({"message": "access denied"})
    
@app.route('/ai/getAPIGroupInfo', methods=['POST'])
def getAPIGroupInfo():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        api_group = thisSystem.findAPIGroupByName(data.get('apiGroupName'))
        return jsonify({"message": "Success", "apiGroup": api_group.toAIString()})
    else:
        return jsonify({"message": "access denied"})

@app.route('/ai/createTask', methods=['POST'])
def createTask():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        creator = data.get('signedInUser')
        if not creator:
            return jsonify({"message": "Failed", "error": "Creator is required"}), 400
            
        creatorUser = thisSystem.getUser(creator)
        if not creatorUser:
            return jsonify({"message": "Failed", "error": "Creator user not found"}), 400
        
        # Handle reply task if previousTaskId is provided
        previous_task = None
        previous_task_id = data.get('previousTaskId')
        if previous_task_id:
            previous_task = thisSystem.findTaskByID(int(previous_task_id))
            if not previous_task:
                return jsonify({"message": "Failed", "error": "Previous task not found"}), 400
        
        # Create the task
        tempTask = thisSystem.createTask(
            data.get('taskName'), 
            data.get('taskDescription'), 
            data.get('assignees'), 
            creatorUser=creatorUser,
            previousTask=[previous_task] if previous_task else None,
            furtherNalAIProcessingNeeded=data.get('furtherNalAIProcessingNeeded', False)
        )
        
        # If this is a reply task, set the replyTask field on the previous task
        if previous_task:
            previous_task.setReplyTask(tempTask)
        
        return jsonify({"message": "Success", "taskId": tempTask.getTaskId()})
    else:
        return jsonify({"message": "access denied"})
    
@app.route('/ai/replyToTask', methods=['POST'])
def replyToTask():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        if "taskId" not in data:
            return jsonify({"message": "Failed", "error": "Task ID is required"}), 400
        task = thisSystem.findTaskByID(data.get('taskId'))
        if task is None:
            return jsonify({"message": "Failed", "error": "Task not found"}), 400
        if "reply" not in data:
            return jsonify({"message": "Failed", "error": "Reply is required"}), 400
        if "signedInUser" not in data:
            return jsonify({"message": "Failed", "error": "Signed in user is required"}), 400
            
        # Get the creator user object
        creator_user = thisSystem.getUser(data.get('signedInUser'))
        if creator_user is None:
            return jsonify({"message": "Failed", "error": "Creator user not found"}), 400
            
        # Use the proper closeTask method instead of just setting status
        thisSystem.closeTask(data.get('taskId'))
        newTitle = task.getTitle()
        if not newTitle.startswith("Reply to:"):
            newTitle = "Reply to: " + newTitle
            
        # Get usernames from assigned users and creator
        newAssignees = [user.getUserName() for user in task.getAssignedUsers()] + [task.getCreatorUser().getUserName()]
        
        newTask = thisSystem.createTask(newTitle, data.get('reply'), newAssignees, creator_user, [task, *[tempTask for tempTask in task.getPreviousTask()]])
        return jsonify({"message": "Success", "taskId": newTask.getTaskId()})
    else:
        return jsonify({"message":"access denied"})
    
@app.route('/ai/getAccessableUsers', methods=['POST'])
def getAccessableUsers():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        users = thisSystem.getAccessableUsers(data.get('signedInUser'))
        returningStr = ""
        for user in users:
            returningStr += user.toAIString()
        return jsonify({"message": "Success", "users": returningStr})
    else:
        return jsonify({"message": "access denied"})
    
@app.route('/ai/getRoleInfo', methods=['POST'])
def getRoleInfo():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        role_info = thisSystem.getUser(data.get('signedInUser')).getRole().toAIString()
        return jsonify({"message": "Success", "roleInfo": role_info})
    else:
        return jsonify({"message": "access denied"})
    
@app.route('/ai/getAccessableGroups', methods=['POST'])
def getAccessableGroups():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        groups = thisSystem.getAccessableGroups(data.get('signedInUser'))
        returningStr = ""
        for group in groups:
            returningStr += group.toAIString()
        return jsonify({"message": "Success", "groups": returningStr})
    else:
        return jsonify({"message": "access denied"})
    
@app.route('/ai/queryRecentTasks', methods=['POST'])
def queryRecentTasks():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        tasks = thisSystem.queryRecentTasks(signedInUser=data.get('signedInUser'), taskCount=data.get('taskCount'))
        returningStr = ""
        for task in tasks:
            returningStr += task.toAIString()
        return jsonify({"message": "Success", "tasks": returningStr})
    else:
        return jsonify({"message": "access denied"})

@app.route('/ai/queryRecentOpenTasks', methods=['POST'])
def queryRecentOpenTasks():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        tasks = thisSystem.queryRecentOpenTasks(signedInUser=data.get('signedInUser'), taskCount=data.get('taskCount'))
        returningStr = ""
        for task in tasks:
            returningStr += task.toAIString()
        return jsonify({"message": "Success", "tasks": returningStr})
    else:
        return jsonify({"message": "access denied"})
    
@app.route('/ai/closeTask', methods=['POST'])
def aiCloseTask():
    data = request.get_json()
    ai_access_token = data.get('aiAccessToken')
    if ai_access_token == thisSystem.getNalaiAccessToken() or ai_access_token == thisSystem.getNalvaAccessToken():
        thisSystem.closeTask(data.get('taskId'))
        return jsonify({"message": "Success"})
    else:
        return jsonify({"message":"access denied"})

# Communication APIs go here
@app.route('/api/homeCheck', methods=['GET'])
def homeCheck():
    if thisSystem.getSetUpStatus():
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
        
    thisSystem.setUpInstance(customerName=customer_name, adminPassword=admin_password, contactEmail=contact_email, domain=domain)
    return jsonify({
        "message": "Instance is Setup",
    })

@app.route('/api/loginUser', methods=['POST'])
def loginUser():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if thisSystem.loginUser(inputUsername=username, inputPassword=password):
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
        user = thisSystem.getUser(username=username)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            users = thisSystem.getSysUsers()
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
        user = thisSystem.getUser(username=username)
        if user is None:
            return jsonify({"message": "User not found"})
        if user.getRole().getPermissions()['home']:
            try:
                tasks = user.getTasks()
                response = {
                    "message": "Success",
                    "tasks": [task.toDict() for task in tasks]
                }
                return jsonify(response)
            except Exception as e:
                print("Error in getUserTasks:", e)
                import traceback; traceback.print_exc()
                return jsonify({"message": "Internal server error", "error": str(e)}), 500
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            roles = thisSystem.getSysRoles()
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            target_username = data.get('target_username')
            new_role_name = data.get('new_role_name')
            thisSystem.changeUserRole(username=target_username, roleName=new_role_name)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            new_username = data.get('new_username')
            new_password = data.get('new_password')
            new_role_name = data.get('new_role_name')
            nameOfUser = data.get('nameOfUser')
            thisSystem.createUser(username=new_username, password=new_password, roleName=new_role_name, name=nameOfUser)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/getDomain', methods=['GET'])
def getDomain():
    domain = thisSystem.getDomain()
    return jsonify({"domain": domain})

@app.route('/api/iam/viewUser', methods=['POST'])
def viewUser():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            target_username = data.get('target_username')  # Debug print
            target_user = thisSystem.getUser(username=target_username)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            roles = thisSystem.getSysRoles()
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            role_name = data.get('role_name')
            role = thisSystem.findRoleByTitle(role_name)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            role_name = data.get('role_name')
            role_description = data.get('role_description')
            permissions = data.get('permissions')
            thisSystem.createRole(role_name, role_description, permissions)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            role_name = data.get('role_name')
            permissions = data.get('permissions')
            thisSystem.updateRolePermissions(role_name, permissions)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            role_name = data.get('role_name')
            user_name = data.get('user_name')
            thisSystem.changeUserRole(username=user_name, roleName=role_name)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            groups = thisSystem.getSysGroups()
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            group = thisSystem.findGroupByTitle(group_title)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            user_name = data.get('user_name')
            thisSystem.addUserToGroups(username=user_name, groupNames=[group_title])
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            user_name = data.get('user_name')
            thisSystem.removeUserFromGroup(username=user_name, groupName=group_title)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            group_description = data.get('group_description')
            try:
                thisSystem.createGroup(groupTitle=group_title, groupDescription=group_description)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            group_title = data.get('group_title')
            try:
                thisSystem.deleteGroup(group_title)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['iam']:
            target_username = data.get('target_username')
            new_password = data.get('new_password')
            target_user = thisSystem.getUser(username=target_username)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            if user.getRole().getPermissions()['AssignToAll']:
                users = thisSystem.getSysUsers()
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            task_title = data.get('task_title')
            task_description = data.get('task_description')
            task_assignees = data.get('task_assignees')
            previous_task_id = data.get('previous_task_id')
            no_ai_processing = data.get('no_ai_processing', False)
            
            # Validate required fields
            if not task_title or not task_description:
                return jsonify({"message": "Task title and description are required"})
            
            previous_task = None
            if previous_task_id:
                previous_task = thisSystem.findTaskByID(int(previous_task_id))
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
                        thisSystem.closeTask(previous_task.getTaskId())
            
            # Create the task
            try:
                new_task = thisSystem.createTask(
                    task_title, 
                    task_description, 
                    task_assignees, 
                    user,
                    previousTask=[previous_task] if previous_task else [],
                    furtherNalAIProcessingNeeded=not no_ai_processing
                )
                
                # If this is a reply task, set the replyTask field on the previous task
                if previous_task:
                    previous_task.setReplyTask(new_task)
                
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            task_id = data.get('task_id')
            task = thisSystem.findTaskByID(task_id)
            if task and task.getCreatorUser().getUserName() == username:
                thisSystem.removeTask(task)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            task_id = data.get('task_id')
            task = thisSystem.findTaskByID(int(task_id))
            if task:
                # Check if user is creator or assignee
                if (task.getCreatorUser().getUserName() == username or 
                    username in [u.getUserName() for u in task.getAssignedUsers()]):
                    if thisSystem.closeTask(int(task_id)):
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['home']:
            task_id = data.get('task_id')
            new_assignees = data.get('new_assignees')
            if username in new_assignees:
                new_assignees.remove(username)
            task = thisSystem.findTaskByID(int(task_id))
            if task and task.getCreatorUser().getUserName() == username:
                # Get current assignees
                current_assignees = [u.getUserName() for u in task.getAssignedUsers()]
                
                # Remove users that are no longer assigned
                for current_assignee in current_assignees:
                    if current_assignee not in new_assignees:
                        assignee_user = thisSystem.getUser(current_assignee)
                        if assignee_user:
                            task.assignedUsers.remove(assignee_user)
                
                # Add new assignees
                for assignee in new_assignees:
                    if assignee not in current_assignees:
                        assignee_user = thisSystem.getUser(assignee)
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
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            api_name = data.get('api_name')
            api_description = data.get('api_description')
            api_endpoint = data.get('api_endpoint')
            api_string = data.get('api_string')
            api_group = data.get('api_group', 'System APIs')  # Default to System APIs if not specified
            ai_processing_models = data.get('ai_processing_models', [])
            tempAPI = API.API(apiName=api_name, apiDescription=api_description, apiEndpoint=api_endpoint, apiString=api_string, aiProcessingModels=ai_processing_models)
            thisSystem.addAPI(tempAPI, api_group)
            functionStr = stringFunctionMaker(api_string)
            
            # Convert API name to function name format (lowercase with underscores)
            function_name = api_name.lower().replace(' ', '_')
            
            # AI access token logic
            ai_token_check = ""
            if 'NalAI' in ai_processing_models and 'Nalva' in ai_processing_models:
                ai_token_check = (
                    "if data.get('aiAccessToken') == thisSystem.getNalaiAccessToken() or "
                    "data.get('aiAccessToken') == thisSystem.getNalvaAccessToken():\n"
                )
            elif 'NalAI' in ai_processing_models:
                ai_token_check = "if data.get('aiAccessToken') == thisSystem.getNalaiAccessToken():\n"
            elif 'Nalva' in ai_processing_models:
                ai_token_check = "if data.get('aiAccessToken') == thisSystem.getNalvaAccessToken():\n"
            
            # Indent user code for inside the if block (4 spaces per block)
            def indent_code(code, num_spaces):
                return textwrap.indent(code, ' ' * num_spaces)
            
            if ai_token_check:
                user_code = (
                    f"{ai_token_check}"
                    f"{indent_code(functionStr, 12)}\n"
                    f"        else:\n"
                    f"            return jsonify({{'message': 'access denied'}})\n"
                )
            else:
                user_code = indent_code(functionStr, 4) + "\n"
            
            new_endpoint = (
                f"@app.route('{api_endpoint}', methods=['GET', 'POST'])\n"
                f"def {function_name}():\n"
                f"    try:\n"
                f"        data = request.get_json()\n"
                f"        {user_code}"
                f"    except Exception as e:\n"
                f"        return jsonify({{'error': str(e)}}), 500\n"
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
        return jsonify({"message": "access denied"})
    
@app.route('/api/apis/getAllAPIs', methods=['POST'])
def getAllAPIs():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            api_groups = thisSystem.getSysAPIGroups()
            response = {
                "message": "Success",
                "apiGroups": [api_group.toDict() for api_group in api_groups]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/getAllAPIsFlattened', methods=['POST'])
def getAllAPIsFlattened():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            apis = thisSystem.getSysAPIs()
            response = {
                "message": "Success",
                "apis": [api.toDict() for api in apis]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/home/getBusinessRules', methods=['POST'])
def getBusinessRules():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['management']:
            businessRules = thisSystem.getBusinessRules()
            return jsonify({"message": "Success", "businessRules": businessRules})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/home/addBusinessRule', methods=['POST'])
def addBusinessRule():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['management']:
            businessRule = data.get('businessRule')
            thisSystem.addBusinessRule(businessRule)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/home/removeBusinessRule', methods=['POST'])
def removeBusinessRule():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['management']:
            businessRule = data.get('businessRule')
            thisSystem.removeBusinessRule(businessRule)
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/uploadFile', methods=['POST'])
def uploadFile():
    data = request.form
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            if 'file' not in request.files:
                return jsonify({"message": "No file part"})
            file = request.files['file']
            if file.filename == '':
                return jsonify({"message": "No selected file"})
            if file:
                filename = werkzeug.utils.secure_filename(file.filename)
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                thisSystem.uploadFile(filename)
                return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/getFiles', methods=['POST'])
def getFiles():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            files = thisSystem.getFiles()
            return jsonify({"message": "Success", "files": files})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/downloadFile/<filename>', methods=['POST'])
def downloadFile(filename):
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/removeFile', methods=['POST'])
def removeFile():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            filename = data.get('filename')
            try:
                thisSystem.removeFile(filename)
                os.remove(os.path.join(UPLOAD_FOLDER, filename))
                return jsonify({"message": "Success"})
            except Exception as e:
                return jsonify({"message": str(e)})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/viewAPI', methods=['POST'])
def viewAPI():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            api_name = data.get('api_name')
            api = thisSystem.findAPIByName(api_name)
            if api is None:
                return jsonify({"message": "API not found"})
            response = {
                "message": "Success",
                "api": api.toDict()
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/modifyAPI', methods=['POST'])
def modifyAPI():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            api_name = data.get('api_name')
            new_api_string = data.get('new_api_string')
            api = thisSystem.findAPIByName(api_name)
            if api is None:
                return jsonify({"message": "API not found"})
            
            # Update the API string
            api.setAPIString(new_api_string)
            
            # Update the API in app.py
            with open("app.py", "r") as f:
                content = f.read()
            
            # Find the API endpoint in the file
            endpoint = api.getApiEndpoint()
            start_marker = f"@app.route('{endpoint}', methods=['GET', 'POST'])"
            end_marker = "\n\n"
            
            # Split the content to find the API definition
            parts = content.split(start_marker)
            if len(parts) > 1:
                # Get the function body
                function_body = parts[1].split(end_marker)[0]
                
                # Create new API definition with updated string
                functionStr = stringFunctionMaker(new_api_string)
                new_endpoint = (
                    f"@app.route('{endpoint}', methods=['GET', 'POST'])\n"
                    f"def {endpoint}():\n"
                    f"    {functionStr}\n"
                )
                
                # Replace the old API definition with the new one
                updated_content = content.replace(function_body, new_endpoint)
                
                with open("app.py", "w") as f:
                    f.write(updated_content)
                
                return jsonify({"message": "Success"})
            else:
                return jsonify({"message": "Failed to update API in app.py"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/deleteAPI', methods=['POST'])
def deleteAPI():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            api_name = data.get('api_name')
            api = thisSystem.findAPIByName(api_name)
            if api is None:
                return jsonify({"message": "API not found"})
            
            # Remove the API from the system
            thisSystem.removeAPI(api)
            
            # Remove the API from app.py
            with open("app.py", "r") as f:
                content = f.read()
            
            # Find the API endpoint in the file
            endpoint = api.getApiEndpoint()
            start_marker = f"@app.route('{endpoint}', methods=['GET', 'POST'])"
            end_marker = "\n\n"
            
            # Split the content to find the API definition
            parts = content.split(start_marker)
            if len(parts) > 1:
                # Get the function body
                function_body = parts[1].split(end_marker)[0]
                
                # Remove the API definition
                updated_content = content.replace(start_marker + function_body + end_marker, "")
                
                with open("app.py", "w") as f:
                    f.write(updated_content)
                
                return jsonify({"message": "Success"})
            else:
                return jsonify({"message": "Failed to remove API from app.py"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/createAPIGroup', methods=['POST'])
def createAPIGroup():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            group_name = data.get('group_name')
            group_description = data.get('group_description')
            
            try:
                thisSystem.createAPIGroup(group_name, group_description)
                return jsonify({"message": "Success"})
            except ValueError as e:
                return jsonify({"message": str(e)})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/getAllAPIGroups', methods=['POST'])
def getAllAPIGroups():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            api_groups = thisSystem.getSysAPIGroups()
            response = {
                "message": "Success",
                "apiGroups": [api_group.toDict() for api_group in api_groups]
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/viewAPIGroup', methods=['POST'])
def viewAPIGroup():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            group_name = data.get('group_name')
            api_group = thisSystem.findAPIGroupByName(group_name)
            if api_group:
                response = {
                    "message": "Success",
                    "apiGroup": api_group.toDict()
                }
                return jsonify(response)
            else:
                return jsonify({"message": "API group not found"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/apis/deleteAPIGroup', methods=['POST'])
def deleteAPIGroup():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            group_name = data.get('group_name')
            api_group = thisSystem.findAPIGroupByName(group_name)
            if api_group:
                if api_group.apiGroupName == "System APIs":
                    return jsonify({"message": "Cannot delete System APIs group"})
                thisSystem.apiGroups.remove(api_group)
                return jsonify({"message": "Success"})
            else:
                return jsonify({"message": "API group not found"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})
    
@app.route('/api/threads/addThreadAPI', methods=['POST'])
def addThreadAPI():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            thread_name = data.get('thread_name')
            thread_description = data.get('thread_description')
            thread_string = data.get('thread_string')
            thread_args = data.get('thread_args', {})  # Optional arguments to pass to the thread function
            
            # Create the thread API object without debug prints
            thread_api = ThreadAPI.ThreadAPI(
                threadName=thread_name,
                threadDescription=thread_description,
                threadString=thread_string
            )
            
            # Add to system's thread list
            thisSystem.addThreadAPI(thread_api)
            
            # Start the thread
            thread = start_thread(thread_api, thread_args)
            
            return jsonify({"message": "Success", "thread_id": id(thread)})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/threads/modifyThreadAPI', methods=['POST'])
def modifyThreadAPI():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            thread_name = data.get('thread_name')
            new_thread_string = data.get('new_thread_string')
            thread_args = data.get('thread_args', {})  # Optional arguments to pass to the thread function
            
            # Find the thread in the system
            thread_api = thisSystem.findThreadByName(thread_name)
            if thread_api is None:
                return jsonify({"message": "Thread not found"})
            
            # Update the thread string without debug prints
            thread_api.setThreadString(new_thread_string)
            
            # Start the updated thread
            thread = start_thread(thread_api, thread_args)
            
            return jsonify({"message": "Success", "thread_id": id(thread)})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/threads/removeThreadAPI', methods=['POST'])
def removeThreadAPI():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            thread_name = data.get('thread_name')
            
            thread_api = thisSystem.getThreadAPIByName(thread_name)
            if thread_api is None:
                return jsonify({"message": "Thread not found"})
            
            # Stop the thread if it's running
            if thread_name in active_threads:
                print(f"Stopping thread: {thread_name}")
                active_threads[thread_name]['stop_event'].set()
                
                # DON'T WAIT - just remove from tracking immediately
                del active_threads[thread_name]
                print(f"Thread {thread_name} marked for termination")
            
            # Remove the thread from the system
            thisSystem.removeThreadAPI(thread_api)
            
            return jsonify({"message": "Success"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/threads/getAllThreads', methods=['POST'])
def getAllThreads():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            threads = thisSystem.getSysThreads()
            response = {
                "message": "Success",
                "threads": [thread.toDict() for thread in threads]  # Convert ThreadAPI objects to dictionaries
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/threads/viewThread', methods=['POST'])
def viewThread():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['development']:
            thread_name = data.get('thread_name')
            thread = thisSystem.getThreadAPIByName(thread_name)
            if thread is None:
                return jsonify({"message": "Thread not found"})
            response = {
                "message": "Success",
                "thread": thread.toDict()
            }
            return jsonify(response)
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/nalva/newConversation', methods=['POST'])
def newNalvaConversation():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['nalva']:
            first_message = data.get('message')
            if not first_message:
                return jsonify({"message": "Message is required"})
            
            try:
                conversation_id = thisSystem.newNalvaConversation(username, first_message)
                return jsonify({
                    "message": "Success",
                    "conversation_id": conversation_id
                })
            except Exception as e:
                return jsonify({"message": f"Failed to create conversation: {str(e)}"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/nalva/sendMessage', methods=['POST'])
def sendNalvaMessage():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['nalva']:
            conversation_id = data.get('conversation_id')
            message = data.get('message')
            
            if not conversation_id or not message:
                return jsonify({"message": "Conversation ID and message are required"})
            
            try:
                # Start message processing and return immediately
                success = thisSystem.sendNalvaMessage(conversation_id, message)
                if success:
                    return jsonify({
                        "message": "Success",
                        "status": "processing"
                    })
                else:
                    return jsonify({"message": "Failed to send message"})
            except Exception as e:
                return jsonify({"message": f"Failed to send message: {str(e)}"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/nalva/getResponse', methods=['POST'])
def getNalvaResponse():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['nalva']:
            conversation_id = data.get('conversation_id')
            
            if not conversation_id:
                return jsonify({"message": "Conversation ID is required"})
            
            try:
                response = thisSystem.getNalvaResponse(conversation_id)
                if response:
                    return jsonify({
                        "message": "Success",
                        "response": response
                    })
                else:
                    return jsonify({
                        "message": "Success",
                        "status": "processing"
                    })
            except Exception as e:
                return jsonify({"message": f"Failed to get response: {str(e)}"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

@app.route('/api/nalva/getConversationHistory', methods=['POST'])
def getNalvaConversationHistory():
    data = request.get_json()
    cookie_token = data.get('cookie_token')
    if cookie_token in cookies:
        username = cookies[cookie_token][0]
        user = thisSystem.getUser(username=username)
        if user.getRole().getPermissions()['nalva']:
            try:
                history = thisSystem.getConversationHistory(username)
                return jsonify({
                    "message": "Success",
                    "conversations": history
                })
            except Exception as e:
                return jsonify({"message": f"Failed to get conversation history: {str(e)}"})
        else:
            return jsonify({"message": "Permission Denied"})
    else:
        return jsonify({"message": "Failed"})

def signal_handler(signum, frame):
    """Handle termination signals by saving the instance"""
    print("\nSaving instance before exit...")
    thisSystem.saveInstance()
    print("Instance saved successfully!")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == '__main__':
    import os
    from dotenv import load_dotenv
    load_dotenv()
    app.run(debug=True, host="0.0.0.0", port=os.getenv("PORT_SERVER"), use_reloader=False)