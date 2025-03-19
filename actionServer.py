from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

"Default Functions for all instances"
@app.route("/")
def home():
    return "Welcome to the application!"

@app.route("/assignToUser",methods=["POST"])
def assignToUser():
    data = request.get_json()
    if not data or "username" not in data or "taskInfo" not in data:
        return jsonify({"error": "Invalid Request"}), 400


@app.route('/deleteUser', methods=['GET', 'POST'])
def deleteUser():
    print('Hi\nWelcome')
    return 'Hi there! workflow is working!'

if __name__=="__main__":
    app.run(debug=True,port=5002)

