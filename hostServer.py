from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

def stringFunctionMaker(inputFunctionString):
    return "\n    ".join(repr(line)[1:-1] for line in inputFunctionString.split("<break>"))

@app.route("/")
def home():
    return "Welcome to the application!"

@app.route("/addActionAPI", methods=['POST'])
def addActionAPI():
    data = request.get_json()
    if not data or "endpoint" not in data or "function" not in data:
        return jsonify({"error": "Invalid Request"}), 400

    endpointStr = data["endpoint"]
    functionStr = stringFunctionMaker(data["function"])  # Indent properly

    new_endpoint = f"""
@app.route('/{endpointStr}', methods=['GET', 'POST'])
def {endpointStr}():
    {functionStr}
"""

    with open("actionServer.py", "r") as f:
        lines = f.readlines()

    insert_index = len(lines)
    for i, line in enumerate(lines):
        if 'if __name__=="__main__":' in line:
            insert_index = i
            break

    updated_lines = lines[:insert_index] + [new_endpoint + "\n"] + lines[insert_index:]

    with open("actionServer.py", "w") as f:
        f.writelines(updated_lines)

    return jsonify({"message": "API created successfully!"})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
