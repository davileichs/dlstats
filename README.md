# Image Reveal Webpage

A beautiful webpage that displays a background image covered with a black overlay. When users move their mouse over the page, it reveals the image underneath in a circular area around the cursor.

## Features

- **Black Overlay Effect**: The entire page is covered in black
- **Hover Reveal**: Moving the mouse reveals the background image in a circular area
- **Custom Cursor**: Replaces the default cursor with a custom white dot
- **Image Generation**: Integrates with Gemini API to generate new images
- **Daily Limit**: Only generates one new image per day to avoid API overuse
- **Responsive Design**: Works on different screen sizes

## Setup

### Prerequisites

- Python 3.7 or higher
- Gemini API key from Google

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up your configuration:
   - Copy `env.example` to `.env`
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Customize your settings in the `.env` file:
     ```
     GOOGLE_API_KEY=your_actual_api_key_here
     IMAGE_PROMPT=your_desired_image_description
     GENERATION_INTERVAL_HOURS=24
     ```

### Running the Application

1. **Generate initial image** (optional):
   ```bash
   # Generate image if needed (based on interval or missing image)
   python3 image_generator.py
   
   # Check status without generating
   python3 image_generator.py --status
   
   # Show help
   python3 image_generator.py --help
   ```

2. **Start the Flask server**:
   ```bash
   python3 run.py
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:8080
   ```

### Setting Up Daily Image Generation

**Option 1: Automatic Setup**
```bash
./setup_cron.sh
```

**Option 2: Manual Cron Setup**
```bash
# Edit your crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * /path/to/your/project/daily_generator.sh >> /path/to/your/project/generator.log 2>&1
```

## Usage

### Basic Interaction

- **Move your mouse** over the page to reveal the background image
- The image is revealed in a circular area around your cursor
- The black overlay covers the rest of the page

### Image Generation

- **Automatic**: Images are generated automatically in the background
- **No User Interaction**: The system runs independently without user input
- **Smart Detection**: Automatically generates new images if none exist or if interval has passed
- **Configurable**: Set your desired prompt and interval in the `.env` file
- **Daily Limit**: Only generates one new image per configured interval (default: 24 hours)

### Controls

- **Status Display**: Shows the current state of the background image
- **Information Panel**: Displays system information and usage instructions
- **No Manual Controls**: Image generation is fully automated

## Technical Details

### Backend (Flask)

- **Flask Server**: Handles HTTP requests and serves the webpage
- **Simplified Architecture**: No background threads, clean separation of concerns
- **Image Display**: Serves pre-generated background images
- **Status API**: Provides image availability information

### Image Generation (Standalone)

- **Independent Script**: `image_generator.py` runs separately from the web server
- **Gemini API Integration**: Connects to Google's Gemini AI for image generation
- **Cron Integration**: Can be scheduled to run automatically using cron jobs
- **Configurable**: Prompt and interval settings in environment variables
- **Logging**: Tracks generation times and provides detailed output

### Frontend (HTML/CSS/JavaScript)

- **Responsive Design**: Adapts to different screen sizes
- **Custom Cursor**: Replaces the default cursor with a white dot
- **Smooth Animations**: CSS transitions for smooth reveal effects
- **Real-time Updates**: JavaScript handles mouse movement and API calls

### File Structure

```
├── app.py                 # Main Flask application (simplified)
├── image_generator.py     # Standalone image generation script
├── daily_generator.sh     # Shell script for cron jobs
├── setup_cron.sh          # Automatic cron setup script
├── run.py                 # Flask server startup script
├── requirements.txt       # Python dependencies
├── templates/             # HTML templates
│   └── index.html        # Main webpage
├── static/               # Static files
│   └── images/           # Generated background images
├── env.example           # Environment variables template
└── README.md             # This file
```

## API Integration

### Gemini API

The application uses Google's Gemini API for image generation. Currently, it creates placeholder images since Gemini Pro Vision is designed for image analysis rather than generation.

To implement actual image generation, you could:
1. Use DALL-E API for image creation
2. Integrate with Stable Diffusion
3. Use other AI image generation services

### API Rate Limiting

- **Daily Limit**: One image generation per day
- **Storage**: Images are saved locally in `static/images/`
- **Caching**: Generation timestamps are tracked to avoid unnecessary API calls

## Customization

### Changing the Reveal Effect

Modify the CSS in `templates/index.html`:
- **Reveal Area Size**: Change the width/height of `.reveal-area`
- **Reveal Shape**: Modify the `border-radius` for different shapes
- **Animation Speed**: Adjust transition timing in CSS

### Styling

- **Colors**: Modify CSS variables and color values
- **Layout**: Adjust positioning and sizing of elements
- **Typography**: Change fonts and text styling

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your `.env` file contains the correct API key
2. **Image Not Loading**: Check if the `static/images/` folder exists and contains images
3. **Port Already in Use**: Change the port in `app.py` if 8080 is occupied

### Debug Mode

The application runs in debug mode by default. Check the terminal for error messages and debugging information.

## Future Enhancements

- **Multiple Image Support**: Allow users to choose from different backgrounds
- **Advanced Effects**: Add more reveal patterns and animations
- **User Accounts**: Save user preferences and generated images
- **Social Features**: Share generated images with others

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please check the troubleshooting section or create an issue in the project repository.
