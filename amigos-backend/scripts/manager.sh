#!/bin/bash

# Amigos Printer Bridge Manager
# This script manages the printer bridge as a background process using PM2

# Open your terminal in the scripts folder and run:

# To START the printer: ./manager.sh start
# To STOP the printer: ./manager.sh stop
# To check IF it is running: ./manager.sh status
# To see the live printer logs: ./manager.sh logs

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null
then
    echo "PM2 is not installed. Installing PM2 globally..."
    npm install pm2 -g
fi

case "$1" in
    start)
        echo "Starting Amigos Printer Bridge in background..."
        pm2 start ecosystem.config.js
        ;;
    stop)
        echo "Stopping Amigos Printer Bridge..."
        pm2 stop amigos-printer-bridge
        ;;
    restart)
        echo "Restarting Amigos Printer Bridge..."
        pm2 restart amigos-printer-bridge
        ;;
    status)
        pm2 status amigos-printer-bridge
        ;;
    logs)
        pm2 logs amigos-printer-bridge
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo "Example: ./manager.sh start"
        exit 1
esac

exit 0
