#!/usr/bin/env python3
"""
Simple startup script for the Image Reveal Webpage
"""

import os
import sys
from app import app

if __name__ == '__main__':
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("⚠️  Warning: .env file not found!")
        print("Please copy env.example to .env and add your Gemini API key")
        print("You can still run the app, but image generation won't work")
        print()
    
    print("🚀 Starting Image Reveal Webpage...")
    print("📱 Open your browser and go to: http://localhost:8080")
    print("🖱️  Move your mouse over the page to reveal the background image")
    print("🤖 Images are generated automatically in the background")
    print("⚡ Press Ctrl+C to stop the server")
    print()
    
    try:
        app.run(debug=True, host='0.0.0.0', port=8080)
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
