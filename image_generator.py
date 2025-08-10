#!/usr/bin/env python3
"""
Standalone Image Generator for Background Images
This script runs independently to generate new background images using Gemini API
"""

import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_MODEL = os.getenv('GOOGLE_MODEL', 'imagen-4.0-generate-preview-06-06')
IMAGE_PROMPT = os.getenv('IMAGE_PROMPT', 'A beautiful, artistic landscape with mountains and sunset')
ASPECT_RATIO = os.getenv('ASPECT_RATIO', '16:9')
GENERATION_INTERVAL_HOURS = int(os.getenv('GENERATION_INTERVAL_HOURS', '24'))


# File paths
LAST_GEN_FILE = 'last_generation.json'
IMAGES_FOLDER = 'static/images'

def ensure_directories():
    """Ensure required directories exist"""
    os.makedirs(IMAGES_FOLDER, exist_ok=True)

def should_generate_new_image():
    """Check if we should generate a new image based on interval or if no image exists"""
    # Check if the actual image file exists
    image_path = os.path.join(IMAGES_FOLDER, 'background.jpg')
    if not os.path.exists(image_path):
        print("📸 No background image found - will generate new one")
        return True
    
    # Check if we need to generate based on time interval
    if not os.path.exists(LAST_GEN_FILE):
        print("⏰ No generation timestamp found - will generate new image")
        return True
    
    try:
        with open(LAST_GEN_FILE, 'r') as f:
            data = json.load(f)
            last_gen = datetime.fromisoformat(data['last_generation'])
            time_since_last = datetime.now() - last_gen
            should_generate = time_since_last > timedelta(hours=GENERATION_INTERVAL_HOURS)
            
            if should_generate:
                print(f"⏰ {time_since_last.total_seconds() / 3600:.1f} hours since last generation - time for new image")
            else:
                hours_remaining = GENERATION_INTERVAL_HOURS - (time_since_last.total_seconds() / 3600)
                print(f"⏳ {hours_remaining:.1f} hours remaining until next generation")
            
            return should_generate
            
    except Exception as e:
        print(f"❌ Error reading last generation file: {e}")
        return True

def update_generation_time():
    """Update the last generation timestamp"""
    data = {'last_generation': datetime.now().isoformat()}
    try:
        with open(LAST_GEN_FILE, 'w') as f:
            json.dump(data, f)
        print(f"✅ Updated generation timestamp: {datetime.now()}")
    except Exception as e:
        print(f"❌ Error updating generation timestamp: {e}")

def generate_image_with_gemini():
    """Generate image using Gemini 2.0 Flash image generation API"""
    try:
        if not GOOGLE_API_KEY:
            print("❌ No Gemini API key found. Please set GOOGLE_API_KEY in .env file")
            return None, "API key not configured"
        
        print(f"🖼️  Generating image with Gemini using model {GOOGLE_MODEL} and prompt: {IMAGE_PROMPT}")
        return generate_with_gemini_2_0(GOOGLE_API_KEY)
        
    except Exception as e:
        print(f"❌ Error generating image: {e}")
        return None, str(e)

def generate_with_gemini_2_0(api_key):
    """Generate image using Gemini OpenAI-compatible endpoint"""
    try:
        from openai import OpenAI
        import httpx
        import base64
        
        # Create the OpenAI-compatible client for Gemini
        base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
        gemini_client = OpenAI(
            api_key=api_key,
            base_url=base_url,
            http_client=httpx.Client(timeout=60.0),
        )
        
        print("🔄 Calling Gemini OpenAI-compatible API...")
        
        # Use the model from environment variable
        response = gemini_client.images.generate(
            model=GOOGLE_MODEL,
            prompt=f"Create a beautiful, high-quality image based on this description: {IMAGE_PROMPT}. Make it artistic and visually appealing.",
            response_format="b64_json",
            n=1,
            size=ASPECT_RATIO,
        )
        
        print("✅ Received response from Gemini API")
        
        if hasattr(response, "data") and response.data:
            first_image = response.data[0]
            b64_data = getattr(first_image, "b64_json", None)
            
            if b64_data:
                # Decode base64 and save the image
                image_path = os.path.join(IMAGES_FOLDER, 'background.jpg')
                image_bytes = base64.b64decode(b64_data)
                
                with open(image_path, 'wb') as f:
                    f.write(image_bytes)
                
                print(f"✅ Gemini image generated and saved to: {image_path}")
                return image_path, None
            else:
                error_msg = "No base64 image data received from Gemini API"
                print(f"❌ {error_msg}")
                return None, error_msg
        else:
            error_msg = "No image data received from Gemini API"
            print(f"❌ {error_msg}")
            return None, error_msg
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Gemini OpenAI-compatible generation failed: {error_msg}")
        return None, error_msg





def check_status():
    """Check the current status without generating"""
    print("📊 Checking Image Generator Status...")
    print(f"📝 Current prompt: {IMAGE_PROMPT}")
    print(f"🤖 Using model: {GOOGLE_MODEL}")
    print(f"📐 Aspect ratio: {ASPECT_RATIO}")
    print(f"⏰ Generation interval: {GENERATION_INTERVAL_HOURS} hours")
    
    # Check if image exists
    image_path = os.path.join(IMAGES_FOLDER, 'background.jpg')
    if os.path.exists(image_path):
        print(f"✅ Background image exists: {image_path}")
        # Get file size
        size = os.path.getsize(image_path)
        print(f"📏 File size: {size / 1024:.1f} KB")
    else:
        print("❌ No background image found")
    
    # Check timestamp
    if os.path.exists(LAST_GEN_FILE):
        try:
            with open(LAST_GEN_FILE, 'r') as f:
                data = json.load(f)
                last_gen = datetime.fromisoformat(data['last_generation'])
                time_since_last = datetime.now() - last_gen
                print(f"🕐 Last generation: {last_gen}")
                print(f"⏰ Time since last: {time_since_last.total_seconds() / 3600:.1f} hours")
                
                if time_since_last > timedelta(hours=GENERATION_INTERVAL_HOURS):
                    print("⏰ Ready for new generation!")
                else:
                    hours_remaining = GENERATION_INTERVAL_HOURS - (time_since_last.total_seconds() / 3600)
                    print(f"⏳ {hours_remaining:.1f} hours until next generation")
        except Exception as e:
            print(f"❌ Error reading timestamp: {e}")
    else:
        print("⏰ No generation timestamp found")

def main():
    """Main function to run the image generator"""
    print("🚀 Starting Image Generator...")
    print(f"📝 Using prompt: {IMAGE_PROMPT}")
    print(f"🤖 Using model: {GOOGLE_MODEL}")
    print(f"⏰ Generation interval: {GENERATION_INTERVAL_HOURS} hours")
    
    # Ensure directories exist
    ensure_directories()
    
    # Check if we should generate a new image
    if should_generate_new_image():
        print("⏰ Time to generate a new image!")
        
        # Generate the image
        image_path, error = generate_image_with_gemini()
        
        if error:
            print(f"❌ Failed to generate image: {error}")
            return False
        else:
            # Update the generation timestamp
            update_generation_time()
            print(f"✅ New image generated successfully at {datetime.now()}")
            return True
    else:
        print("⏳ Image generation not needed yet")
        
        # Show when the next generation will occur
        try:
            with open(LAST_GEN_FILE, 'r') as f:
                data = json.load(f)
                last_gen = datetime.fromisoformat(data['last_generation'])
                next_gen = last_gen + timedelta(hours=GENERATION_INTERVAL_HOURS)
                print(f"🕐 Next generation scheduled for: {next_gen}")
        except:
            print("🕐 Could not determine next generation time")
        
        return False

if __name__ == '__main__':
    import sys
    
    # Check for command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == '--status':
        check_status()
        exit(0)
    elif len(sys.argv) > 1 and sys.argv[1] == '--help':
        print("🖼️  Image Generator Usage:")
        print("  python3 image_generator.py          # Generate image if needed")
        print("  python3 image_generator.py --status # Check status without generating")
        print("  python3 image_generator.py --help   # Show this help message")
        exit(0)
    else:
        # Normal operation - generate image if needed
        success = main()
        if success:
            print("🎉 Image generation completed successfully!")
            exit(0)
        else:
            print("⚠️  Image generation skipped or failed")
            exit(1)
