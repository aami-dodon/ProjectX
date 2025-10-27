#!/bin/bash

# ========================
# 🏗  Project Structure Setup
# ========================

# Create directories
mkdir -p src/app/layouts
mkdir -p src/app/providers
mkdir -p src/features/home/pages
mkdir -p src/features/home/components
mkdir -p src/shared/components/layout
mkdir -p src/shared/components/ui
mkdir -p src/shared/hooks
mkdir -p src/shared/lib
mkdir -p src/shared/styles
mkdir -p src/assets

# Create base files
touch src/app/routes.jsx
touch src/app/index.jsx
touch src/app/providers/ThemeProvider.jsx

# Feature pages/components
touch src/features/home/pages/HomePage.jsx
touch src/features/home/components/ChartAreaInteractive.jsx
touch src/features/home/components/DataTable.jsx
touch src/features/home/components/SectionCards.jsx

# Layout components
touch src/shared/components/layout/SiteHeader.jsx
touch src/shared/components/layout/AppSidebar.jsx

# UI (shadcn components will go here)
# (intentionally left empty — shadcn CLI will populate this later)

# Shared hooks and utils
touch src/shared/hooks/use-mobile.js
touch src/shared/lib/utils.js
touch src/shared/lib/client.js

# Shared styles
touch src/shared/styles/index.css

# Main entry
touch src/main.jsx
touch src/data.json

# Optional: move old files to backup (if they exist)
mkdir -p _old
if [ -f src/App.jsx ]; then mv src/App.jsx _old/; fi
if [ -d src/components ]; then mv src/components _old/; fi

echo "✅ Folder structure created successfully!"
echo "➡ Your developer can now move existing home page code into:"
echo "   src/features/home/pages/HomePage.jsx"
