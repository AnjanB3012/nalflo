import system.System as System
import os
from flask import Flask, render_template, request, redirect, url_for, session

app = Flask(__name__)
app.secret_key = "StoreKey1"

tempSystem = System.System()

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method=="POST":
        pass
    return render_template('login.html')

@app.route('/', methods=['GET', 'POST'])
def home():
    if tempSystem.getSetUpStatus() == False:
        return redirect(url_for('setup'))
    return render_template('home.html')

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
    return render_template('onboarding.html')

if __name__ == '__main__':
    app.run(debug=True, port=8080)