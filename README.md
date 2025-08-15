## Getting Started

### Prerequisites

- Node.js 24.6.0 or higher (you have this installed)
- npm (comes with Node.js)

### Installation

Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## GitHub Pages Deployment

### Method 1: Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Push the `dist` folder contents to your GitHub repository's `gh-pages` branch

3. Enable GitHub Pages in your repository settings, selecting the `gh-pages` branch


## Technologies Used

- React 18.3.1
- Vite 5.4.1