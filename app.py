from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')  # Serve the frontend HTML

@app.route('/scan', methods=['POST'])
def scan():
    url = request.form.get('url')  # Get the URL from the frontend
    result = scan_url(url)  # Call your existing API function
    return jsonify(result)  # Return the result as JSON

def scan_url(url):
    # Your existing scan_url function logic here
    return {"status": "success", "data": f"Scanned URL: {url}"}  # Placeholder return

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)  # Run the app
