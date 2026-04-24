#!/bin/bash

# ============================================================
# OutbreakPredict AI - Disease Outbreak Prediction Platform
# Start Script - Sets up and launches the full application
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     OutbreakPredict AI - Disease Outbreak Platform      ║"
echo "║         Starting Application Services...                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
    echo -e "${RED}❌ .env file not found! Please create one.${NC}"
    exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# ============================================================
# Step 1: Clean up used ports
# ============================================================
echo -e "\n${YELLOW}🔧 Cleaning up ports...${NC}"

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}   Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    echo -e "${GREEN}   Port $port is free${NC}"
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ============================================================
# Step 2: Check and setup PostgreSQL database
# ============================================================
echo -e "\n${YELLOW}🗄️  Setting up PostgreSQL database...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
    echo -e "${YELLOW}   Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
fi

# Create database if it doesn't exist
echo -e "${CYAN}   Checking database '${DB_NAME}'...${NC}"
if ! psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "${DB_NAME:-outbreak_predict}"; then
    echo -e "${YELLOW}   Creating database '${DB_NAME}'...${NC}"
    createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} "${DB_NAME:-outbreak_predict}" 2>/dev/null || \
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -c "CREATE DATABASE ${DB_NAME:-outbreak_predict};" 2>/dev/null || true
fi
echo -e "${GREEN}✅ Database ready${NC}"

# ============================================================
# Step 3: Install dependencies
# ============================================================
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"

# Backend dependencies
echo -e "${CYAN}   Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    npm install --silent 2>&1 | tail -1
fi
echo -e "${GREEN}   ✅ Backend dependencies ready${NC}"

# Frontend dependencies
echo -e "${CYAN}   Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    npm install --silent 2>&1 | tail -1
fi
echo -e "${GREEN}   ✅ Frontend dependencies ready${NC}"

cd "$PROJECT_DIR"

# ============================================================
# Step 4: Start Backend (with hot reload via nodemon)
# ============================================================
echo -e "\n${YELLOW}🚀 Starting Backend Server (port $BACKEND_PORT)...${NC}"
cd "$PROJECT_DIR/backend"
npx nodemon --watch src --ext js,json src/server.js &
BACKEND_PID=$!
echo -e "${GREEN}   Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -e "${CYAN}   Waiting for backend to initialize...${NC}"
for i in {1..30}; do
    if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Backend is ready${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}   Backend is still starting up...${NC}"
    fi
done

# ============================================================
# Step 5: Start Frontend (with hot reload via Vite)
# ============================================================
echo -e "\n${YELLOW}🎨 Starting Frontend (port $FRONTEND_PORT)...${NC}"
cd "$PROJECT_DIR/frontend"
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!
echo -e "${GREEN}   Frontend started (PID: $FRONTEND_PID)${NC}"

cd "$PROJECT_DIR"

# ============================================================
# Step 6: Display startup info
# ============================================================
sleep 3
echo -e "\n${PURPLE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║            🎉 Application Started Successfully!          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo -e "║  ${CYAN}Frontend:${NC}  ${GREEN}http://localhost:$FRONTEND_PORT${NC}                    ║"
echo -e "║  ${CYAN}Backend:${NC}   ${GREEN}http://localhost:$BACKEND_PORT${NC}                      ║"
echo -e "║  ${CYAN}API Docs:${NC}  ${GREEN}http://localhost:$BACKEND_PORT/api/health${NC}           ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo -e "║  ${YELLOW}Login Credentials:${NC}                                     ║"
echo -e "║  Email:    ${CYAN}admin@outbreakpredict.com${NC}                      ║"
echo -e "║  Password: ${CYAN}admin123${NC}                                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo -e "║  ${YELLOW}Hot Reload:${NC} Both backend and frontend auto-reload     ║"
echo -e "║  ${YELLOW}Press Ctrl+C to stop all services${NC}                      ║"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# Cleanup on exit
# ============================================================
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    cleanup_port $BACKEND_PORT
    cleanup_port $FRONTEND_PORT
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
