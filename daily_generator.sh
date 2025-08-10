#!/bin/bash
# Daily Image Generator Script
# This script runs the image generator and can be scheduled with cron

# Change to the project directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the image generator
echo "🕐 $(date): Starting daily image generation..."
python3 image_generator.py

# Check if generation was successful
if [ $? -eq 0 ]; then
    echo "✅ $(date): Image generation completed successfully"
    
    # Signal session reset to all connected clients
    echo "🔄 $(date): Signaling session reset to connected clients..."
    if command -v curl >/dev/null 2>&1; then
        curl -s "http://localhost:8080/reset-sessions" >/dev/null 2>&1
        echo "✅ $(date): Session reset signal sent"
    else
        echo "⚠️  $(date): curl not available, cannot signal session reset"
    fi
else
    echo "❌ $(date): Image generation failed"
fi
