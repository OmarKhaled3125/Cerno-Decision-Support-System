#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Build Start..."

# 1. Build Frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Build Backend
echo "Building Backend..."
cd backend
pip install -r requirements.txt

# 3. Collect Static (This will now include the frontend build because of our settings.py change)
echo "Collecting Static Files..."
python manage.py collectstatic --no-input

# 4. Migrate Database
echo "Migrating Database..."
python manage.py migrate

echo "Build Finished!"
