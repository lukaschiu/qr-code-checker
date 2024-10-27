from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from api import scan_url
import traceback

app = Flask(__name__)

# Configure CORS with specific origins and methods
CORS(app, resources={
    r"/scan": {
        "origins": [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:3000",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],  # Added comma here
        "supports_credentials": False
    }
})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan', methods=['POST', 'OPTIONS'])
def scan():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        url = data.get('url')
        if not url:
            return jsonify({"error": "No URL provided"}), 400
        
        print(f"Received URL for scanning: {url}")
        
        # Add basic URL validation
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Call the scan_url function
        result = scan_url(url)
        
        if result:
            print(f"Scan results: {result}")
            return jsonify(result)
        else:
            return jsonify({"error": "Scan returned no results"}), 500
            
    except Exception as e:
        print(f"Error during scan: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": "Server error during scan",
            "details": str(e)
        }), 500

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)