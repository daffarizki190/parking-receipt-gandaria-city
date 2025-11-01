# Parking Tarif Calculator

A modern web application for calculating parking fees with digital receipt generation and QR code support.

## 🚀 Features

- **Smart Tariff Calculation**: Multiple pricing models (flat rate, hourly, per 30 minutes, per minute) including valet services
- **Digital Receipts**: Generate shareable receipt links with Base64 URL encoding and QR codes
- **Transaction History**: Local storage of up to 20 recent transactions
- **Modern UI**: Responsive design with gradient themes and card-based layout
- **Multi-Platform**: Web version and Cordova-ready assets for Android deployment

## 🛠️ Quick Start

### Local Development
```bash
# Ensure Node.js is installed
npx http-server -p 8080

# Open http://127.0.0.1:8080/ in your browser
```

### GitHub Pages Deployment
1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → `main` branch → `/ (root)`
4. Your site will be available at `https://username.github.io/repository-name/`

## 📁 Project Structure

```
├── index.html          # Main calculator page
├── history.html        # Transaction history
├── receipt.html        # Digital receipt viewer
├── script.js          # Core application logic
├── styles.css         # Global styles
├── .nojekyll          # GitHub Pages configuration
└── apk-cordova/       # Cordova assets for Android
    └── www/           # Web assets for mobile app
```

## 🎯 Usage

1. **Calculate Parking Fee**: Select vehicle type, enter duration, choose pricing model
2. **Generate Receipt**: Create digital receipt with QR code for easy sharing
3. **View History**: Access recent transactions stored locally
4. **Share Receipt**: Use generated links or QR codes to share receipts

## 🔧 Technical Details

- **Storage**: Uses `localStorage` with key `parkingHistory` for data persistence
- **QR Generation**: Client-side QR code generation using qrcode.js library
- **URL Encoding**: Base64 URL-safe encoding for receipt data
- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox

## 📱 Mobile App (Cordova)

The `apk-cordova/www/` directory contains assets for building an Android application using Apache Cordova. Ensure consistency between web and mobile versions during development.

## 🤝 About This Project

This application was specifically developed to help friends and colleagues in our local area with quick and accurate parking fee calculations. The project aims to:

- **Simplify parking calculations** for daily commuters and visitors
- **Provide digital receipts** that can be easily shared and verified
- **Support local community** by offering a free, accessible tool
- **Encourage collaboration** - feel free to fork, modify, and adapt for your area's specific parking rates and requirements

Whether you're helping friends calculate parking costs or adapting this tool for your own community, contributions and local customizations are welcome!

## 📄 License

MIT License - Feel free to use and modify for your community needs.
