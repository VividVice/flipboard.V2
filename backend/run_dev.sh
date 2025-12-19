#!/bin/bash

CONTAINER_NAME="mongo"

# Check if Docker is available
if ! command -v docker &> /dev/null
then
    echo "Error: Docker is not installed or not in PATH."
    exit 1
fi

echo "Checking MongoDB status..."

# Check if container exactly named "mongo" exists
if docker container inspect $CONTAINER_NAME >/dev/null 2>&1; then
    # Check if it is running
    if [ "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
        echo "MongoDB is already running."
    else
        echo "Starting existing MongoDB container..."
        docker start $CONTAINER_NAME
        echo "Waiting 3 seconds for Database to initialize..."
        sleep 3
    fi
else
    echo "Creating and starting new MongoDB container..."
    docker run -d -p 27017:27017 --name $CONTAINER_NAME mongo:latest
    echo "Waiting 3 seconds for Database to initialize..."
    sleep 3
fi

# Activate virtual environment if it exists and we aren't in one
if [ -z "$VIRTUAL_ENV" ] && [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

echo "Starting Backend Server..."
uvicorn app.main:app --reload