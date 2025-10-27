#!/usr/bin/env bash
set -e

# Colors for pretty output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo "🔍 Running project structure sanity check..."

# --- 1. Check required folders ---
required_dirs=(
  "src/app/layouts"
  "src/features/dashboard/pages"
  "src/components/ui"
  "src/hooks"
  "src/lib"
)

echo "📁 Checking required directories..."
for dir in "${required_dirs[@]}"; do
  if [ -d "$dir" ]; then
    echo -e "  ✅ ${GREEN}$dir${NC} exists"
  else
    echo -e "  ❌ ${RED}$dir${NC} missing"
  fi
done

# --- 2. Check required files ---
required_files=(
  "src/main.jsx"
  "src/app/routes.jsx"
  "src/app/layouts/Default.jsx"
  "src/features/dashboard/pages/DashboardPage.jsx"
  "src/components/theme-provider.jsx"
  "src/jsconfig.json"
  "src/index.css"
)

echo "🧾 Checking required files..."
for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ✅ ${GREEN}$file${NC} exists"
  else
    echo -e "  ❌ ${RED}$file${NC} missing"
  fi
done

# --- 3. Check for alias configuration ---
echo "🧭 Checking jsconfig.json for alias '@/'..."
if grep -q '"@/*"' jsconfig.json 2>/dev/null; then
  echo -e "  ✅ ${GREEN}Alias '@/’ configured${NC}"
else
  echo -e "  ❌ ${RED}Missing alias '@/’ in jsconfig.json${NC}"
fi

# --- 4. Check imports in main.jsx ---
echo "📌 Checking main.jsx for RouterProvider & ThemeProvider..."
if grep -q 'RouterProvider' src/main.jsx && grep -q 'ThemeProvider' src/main.jsx; then
  echo -e "  ✅ ${GREEN}main.jsx imports look good${NC}"
else
  echo -e "  ⚠️  ${YELLOW}main.jsx might be missing RouterProvider or ThemeProvider${NC}"
fi

# --- 5. Check DefaultLayout for sidebar + header ---
echo "🧭 Checking DefaultLayout.jsx for Outlet and Sidebar..."
if grep -q 'Outlet' src/app/layouts/Default.jsx && grep -q 'AppSidebar' src/app/layouts/Default.jsx; then
  echo -e "  ✅ ${GREEN}DefaultLayout.jsx contains Outlet and Sidebar${NC}"
else
  echo -e "  ⚠️  ${YELLOW}Check DefaultLayout.jsx imports (Outlet, Sidebar, etc.)${NC}"
fi

# --- 6. Check for ThemeProvider in components ---
if grep -q 'ThemeProvider' src/components/theme-provider.jsx; then
  echo -e "  ✅ ${GREEN}ThemeProvider.jsx found${NC}"
else
  echo -e "  ❌ ${RED}ThemeProvider.jsx missing or misnamed${NC}"
fi

# --- 7. Check if DashboardPage is clean (no sidebar duplication) ---
echo "📄 Checking DashboardPage.jsx..."
if grep -q 'SidebarProvider' src/features/dashboard/pages/DashboardPage.jsx; then
  echo -e "  ⚠️  ${YELLOW}DashboardPage still has SidebarProvider — should be removed${NC}"
else
  echo -e "  ✅ ${GREEN}DashboardPage content looks clean${NC}"
fi

echo -e "\n🚀 ${GREEN}Structure check complete.${NC}"
echo -e "If you see ❌ or ⚠️ above, fix those before running: ${YELLOW}npm run dev${NC}"
