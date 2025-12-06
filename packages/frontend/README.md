# Phoenix Explorer Frontend

Next.js 14 frontend application for Phoenix Network BlockDAG Explorer.

## Features

- ✅ **Cross-Platform**: Web, Mobile (PWA), Desktop (PWA)
- ✅ **Real-time Updates**: WebSocket integration
- ✅ **DAG Visualization**: Interactive graph visualization
- ✅ **Search**: Global search functionality
- ✅ **Dark Mode**: Theme switching support
- ✅ **PWA**: Installable Progressive Web App

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:6663](http://localhost:6663) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:6662
NEXT_PUBLIC_WS_URL=ws://localhost:6662/ws
```

### Build

```bash
npm run build
npm start
```

## Project Structure

```
app/                    # Next.js App Router pages
components/             # React components
  ├── blocks/          # Block-related components
  ├── transactions/    # Transaction-related components
  ├── dag/             # DAG visualization components
  ├── layout/          # Layout components
  └── search/          # Search components
lib/                    # Utilities and hooks
  ├── hooks/           # Custom React hooks
  └── utils/           # Utility functions
public/                 # Static assets
types/                  # TypeScript type definitions
```

## Pages

- `/` - Home page (latest blocks and transactions)
- `/blocks` - Blocks list
- `/blocks/[blockNumber]` - Block detail
- `/blocks/[blockNumber]/dag` - DAG visualization
- `/transactions` - Transactions list
- `/transactions/[hash]` - Transaction detail
- `/addresses/[address]` - Address detail

## Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **TanStack Query**: Data fetching and caching
- **Zustand**: State management
- **vis-network**: DAG graph visualization
- **Axios**: HTTP client

## PWA Support

The app is configured as a Progressive Web App (PWA):
- Installable on mobile and desktop
- Offline support via service worker
- App-like experience

## Dark Mode

Dark mode is supported and can be toggled via the theme toggle in the navigation bar.
