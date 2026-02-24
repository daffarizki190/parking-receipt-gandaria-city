# Commit the existing code
git add .
git commit -m "feat: complete vanilla js innovation"
git checkout -b feature/react-migration

# Remove old vanilla files
Remove-Item -Path index.html, history.html, receipt.html, styles.css, script.js, features.js -Force -ErrorAction SilentlyContinue

# Create Vite React app in a temp folder
npx create-vite@latest temp-vite --template react --yes

# Copy contents to current directory
Copy-Item -Path "temp-vite\*" -Destination "." -Recurse -Force

# Remove the temp folder
Remove-Item -Path "temp-vite" -Recurse -Force

# Install base dependencies
npm install

# Install Tailwind and utilities
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install project specific dependencies
npm install react-router-dom lucide-react @tensorflow/tfjs @tensorflow-models/coco-ssd qrcode jsqr html2canvas chart.js react-chartjs-2 clsx tailwind-merge
