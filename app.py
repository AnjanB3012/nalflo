import system.System as System
import system.Role as Role
import system.Group as Group
import system.User as User
import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = "StoreKey1"

tempSystem = System.System()

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method=="POST":
        inpUsername = request.form['username']
        inpPassword = request.form['password']
        loggedIn = tempSystem.loginUser(inpUsername, inpPassword)
        if loggedIn!=None:
            session['user'] = loggedIn.getUserName()
            return redirect(url_for('home'))
        else:
            return render_template('login.html', loginError=True)
    return render_template('login.html', loginError=False)

@app.route('/', methods=['GET', 'POST'])
def home():
    if tempSystem.getSetUpStatus() == False:
        return redirect(url_for('setup'))
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/onboarding', methods=['GET', 'POST'])
def setup():
    if request.method=="POST":
        cust_name = str(request.form['cust_name'])
        adminPass = str(request.form['adminPass'])
        email = str(request.form['email'])
        domainName = str(request.form['domainName'])
        tempSystem.setUpInstance(
            customerName=cust_name,
            adminPassword=adminPass,
            contactEmail=email,
            domain=domainName
        )
        tempSystem.saveInstance()
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    # change password
    changedPassword = "No"
    if request.method=="POST":
        currentPassword = request.form["current-password"]
        if tempSystem.getUser(session['user']).getPassword() == currentPassword:
            newPassword = request.form["new-password"]
            tempSystem.getUser(session['user']).setPassword(newPassword)
            changedPassword = "Yes"
        else:
            changedPassword = "Error"
    signedInUser = tempSystem.getUser(session['user'])
    username = signedInUser.getUserName()
    roleDet = signedInUser.getRole().getDetails()
    rolename = roleDet[0]
    roledesc = roleDet[1]
    roleperms = signedInUser.getRole().getPermissions()
    rolepermissions = []
    for perm in roleperms:
        if(roleperms[perm] == True):
            rolepermissions.append(perm)
    groups = signedInUser.getGroups()
    groupList = {}
    for i in range(len(groups)):
        groupDet = groups[i].getDetails()
        groupList[groupDet[0]] = groupDet[1]
    return render_template('profile.html', username=username, rolename=rolename, roledesc=roledesc, permissions=rolepermissions, groups=groupList, changedPassword=changedPassword)

@app.route('/iam', methods=['GET', 'POST'])
def iam():
    signedInUser = tempSystem.getUser(session['user'])
    username = signedInUser.getUserName()
    sysGroups = tempSystem.getSysGroups()
    userGroups = signedInUser.getGroups()
    groupList = {}
    for groupi in sysGroups:
        if groupi in userGroups:
            groupList[groupi.getDetails()[0]] = True
        else:
            groupList[groupi.getDetails()[0]] = False

    return render_template('iam.html', username=username, groups=groupList)

@app.route('/iam/users/update_groups', methods=['GET', 'POST'])
def update_groups():
    if request.method == "POST":
        signedInUser = tempSystem.getUser(session['user'])
        username = signedInUser.getUserName()
        data = request.get_json()
        checkedGroups = data['groups']
        tempSystem.addUserToGroups(username, checkedGroups)
        return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=8080)