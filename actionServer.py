from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

@app.route("/")
def home():
    return "Welcome to the application!"


if __name__=="__main__":
    app.run(debug=True,port=5002)

