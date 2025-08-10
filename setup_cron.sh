#!/bin/bash
# Setup Cron Job for Daily Image Generation
# This script helps you set up a cron job to run the image generator daily

echo "🕐 Setting up daily image generation cron job..."
echo ""

# Make the daily generator script executable
chmod +x daily_generator.sh

# Get the current directory
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAILY_SCRIPT="$CURRENT_DIR/daily_generator.sh"

echo "📁 Project directory: $CURRENT_DIR"
echo "📜 Daily script: $DAILY_SCRIPT"
echo ""

# Create the cron job entry (runs daily at 2 AM)
CRON_JOB="0 2 * * * $DAILY_SCRIPT >> $CURRENT_DIR/generator.log 2>&1"

echo "⏰ Cron job will run daily at 2:00 AM"
echo "📝 Cron entry: $CRON_JOB"
echo ""

# Ask user if they want to add this to their crontab
read -p "Do you want to add this cron job? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    
    if [ $? -eq 0 ]; then
        echo "✅ Cron job added successfully!"
        echo "📋 Current crontab:"
        crontab -l
    else
        echo "❌ Failed to add cron job"
    fi
else
    echo "📋 To add manually, run:"
    echo "crontab -e"
    echo "Then add this line:"
    echo "$CRON_JOB"
fi

echo ""
echo "🔧 Manual setup instructions:"
echo "1. Run: crontab -e"
echo "2. Add this line: $CRON_JOB"
echo "3. Save and exit"
echo ""
echo "📊 To check logs: tail -f $CURRENT_DIR/generator.log"
echo "🗑️  To remove cron job: crontab -e (then delete the line)"
