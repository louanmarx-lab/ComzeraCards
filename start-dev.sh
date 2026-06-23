#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"

# Color codes for visual styling
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Clear terminal and print a beautiful banner
clear
echo -e "${CYAN}${BOLD}======================================================${NC}"
echo -e "${CYAN}${BOLD}          COMZERA CARDS LAUNCHER (DEV ENGINE)         ${NC}"
echo -e "${CYAN}${BOLD}======================================================${NC}"
echo ""

# 1. Start C# Backend Web API
echo -e "${BLUE}[1/2] Checking C# Backend API...${NC}"
DLL_PATH="backend/Cards.Api/bin/Debug/net8.0/Cards.Api.dll"
NEEDS_BUILD=false

if [ ! -f "$DLL_PATH" ]; then
    NEEDS_BUILD=true
else
    # Check if any .cs file is newer than the compiled DLL
    DLL_TIME=$(stat -f "%m" "$DLL_PATH")
    while IFS= read -r f; do
        F_TIME=$(stat -f "%m" "$f")
        if [ "$F_TIME" -gt "$DLL_TIME" ]; then
            NEEDS_BUILD=true
            break
        fi
    done < <(find backend -name "*.cs")
fi

if [ "$NEEDS_BUILD" = true ]; then
    echo -e "  ${YELLOW}⚙ Changes detected or build missing. Compiling Backend...${NC}"
    dotnet build backend/Cards.Api/Cards.Api.csproj >/dev/null
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Compilation successful.${NC}"
    else
        echo -e "  ${RED}✗ Backend compilation failed. Starting anyway...${NC}"
    fi
else
    echo -e "  ${GREEN}✓ No changes detected in backend. Skipping build step (Fast-Boot).${NC}"
fi

echo -e "  ${GREEN}⚡ Launching Backend API on http://localhost:5001...${NC}"
dotnet run --project backend/Cards.Api/Cards.Api.csproj --launch-profile http --no-build > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to boot up
sleep 2
echo -e "  ${GREEN}✓ Backend is running (PID: $BACKEND_PID)${NC}"
echo ""

# 2. Start Next.js Frontend
echo -e "${BLUE}[2/2] Launching Next.js Frontend on http://localhost:3001...${NC}"
export PATH="/Users/lou-anmarx/Comzera/Bizpro 5/node22/bin:$PATH"

PORT=3001 npm --prefix frontend run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "  ${GREEN}✓ Frontend dev server is running (PID: $FRONTEND_PID)${NC}"
echo ""

echo -e "${CYAN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 Both systems are up!${NC}"
echo -e "  - Frontend: ${BOLD}http://localhost:3001${NC}"
echo -e "  - Backend:  ${BOLD}http://localhost:5001/swagger${NC}"
echo -e "${CYAN}Press [Ctrl+C] to stop both servers at any time.${NC}"
echo -e "${CYAN}${BOLD}======================================================${NC}"

# Handle cleanup on exit (SIGINT/SIGTERM)
cleanup() {
    echo -e "\n\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Done. Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep the script running to stay alive
while true; do
    sleep 1
done
