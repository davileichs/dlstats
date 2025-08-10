#!/bin/bash

# Configuration
SCRIPT_NAME="run.py"
PID_FILE="run.pid"
LOG_FILE="run.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if process is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Function to start the application
start() {
    if is_running; then
        echo -e "${YELLOW}Application is already running (PID: $(cat $PID_FILE))${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Starting application...${NC}"
    nohup python3 "$SCRIPT_NAME" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2
    
    if is_running; then
        echo -e "${GREEN}Application started successfully (PID: $(cat $PID_FILE))${NC}"
        echo -e "${GREEN}Logs are being written to: $LOG_FILE${NC}"
    else
        echo -e "${RED}Failed to start application${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Function to stop the application
stop() {
    if ! is_running; then
        echo -e "${YELLOW}Application is not running${NC}"
        return 1
    fi
    
    pid=$(cat "$PID_FILE")
    echo -e "${YELLOW}Stopping application (PID: $pid)...${NC}"
    
    kill "$pid" 2>/dev/null
    sleep 2
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${YELLOW}Force killing application...${NC}"
        kill -9 "$pid" 2>/dev/null
    fi
    
    rm -f "$PID_FILE"
    echo -e "${GREEN}Application stopped${NC}"
}

# Function to restart the application
restart() {
    echo -e "${YELLOW}Restarting application...${NC}"
    stop
    sleep 1
    start
}

# Function to show status
status() {
    if is_running; then
        echo -e "${GREEN}Application is running (PID: $(cat $PID_FILE))${NC}"
    else
        echo -e "${RED}Application is not running${NC}"
    fi
}

# Function to show logs
logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo -e "${YELLOW}No log file found${NC}"
    fi
}

# Main script logic
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  status  - Show application status"
        echo "  logs    - Show live logs"
        exit 1
        ;;
esac