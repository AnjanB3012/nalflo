from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

def stringFunctionMaker(inputFunctionString):
    # Indent each line of the user-supplied function body
    return "\n    ".join(
        repr(line)[1:-1]
        for line in inputFunctionString.split("<break>")
    )

# New APIs go here
@app.route('/test1', methods=['GET', 'POST'])
def test1():
    return jsonify({'message':'api working!'})




# System APIs go here
@app.route("/")
def home():
    return "Welcome to the application!"

@app.route("/addActionAPI", methods=["POST"])
def addActionAPI():
    data = request.get_json()
    if not data or "endpoint" not in data or "function" not in data:
        return jsonify({"error": "Invalid Request"}), 400

    endpointStr = data["endpoint"]
    functionStr = stringFunctionMaker(data["function"])

    # Build the new endpoint definition
    new_endpoint = (
        f"@app.route('/{endpointStr}', methods=['GET', 'POST'])\n"
        f"def {endpointStr}():\n"
        f"    {functionStr}\n"
    )

    # Read the existing file
    with open("hostServer.py", "r") as f:
        content = f.read()

    # Partition on the marker line (including its newline)
    head, sep, tail = content.partition("# New APIs go here\n")
    if not sep:
        return jsonify({"error": "Marker line not found in hostServer.py"}), 500

    # Reassemble: head + marker + new endpoint + blank line + rest
    updated_content = head + sep + new_endpoint + "\n" + tail

    # Write it back
    with open("hostServer.py", "w") as f:
        f.write(updated_content)

    return jsonify({"message": "API created successfully!"})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
