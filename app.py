from flask import Flask, render_template, jsonify
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
IMAGES_FOLDER = 'static/images'

# Ensure images folder exists
os.makedirs(IMAGES_FOLDER, exist_ok=True)



@app.route('/')
def index():
    """Main page route"""
    return render_template('index.html')

@app.route('/check-image')
def check_image():
    """Check if background image exists"""
    image_path = os.path.join(IMAGES_FOLDER, 'background.jpg')
    if os.path.exists(image_path):
        # Get image modification time for change detection
        mtime = os.path.getmtime(image_path)
        return jsonify({
            'exists': True, 
            'path': '/static/images/background.jpg',
            'modified': mtime
        })
    else:
        return jsonify({'exists': False})

@app.route('/reset-sessions')
def reset_sessions():
    """Reset all user sessions - called when new image is generated"""
    try:
        # This endpoint signals to all connected clients that they should reset their sessions
        # The actual reset happens on the client side via JavaScript
        return jsonify({'success': True, 'message': 'Sessions reset signal sent'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    print("🌐 Starting Flask server...")
    # Try different ports if 8080 is in use
    ports = [8080, 8081, 8082, 8083, 8084]
    
    for port in ports:
        try:
            print(f"🚀 Attempting to start server on port {port}...")
            app.run(debug=True, host='0.0.0.0', port=port)
            break
        except OSError as e:
            if "Address already in use" in str(e):
                print(f"⚠️  Port {port} is in use, trying next port...")
                continue
            else:
                raise e
