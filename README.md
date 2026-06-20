# Vendue - Premium Real-Time Auction Marketplace

Vendue is a modern, high-performance real-time auction platform built with Next.js. It allows users to securely list, discover, and bid on unique items with millisecond-precision tracking.

## 🌟 Key Features

- **Real-Time Bidding**: Powered by WebSockets (STOMP), bids are reflected instantly across all connected clients without page reloads.
- **Dynamic Auction Tracking**: Live countdown timers for upcoming, active, and closed auctions.
- **Admin Live Dashboard**: A dedicated dashboard for administrators to monitor global auction activity, track bids in real-time with visual indicators, and manage listings.
- **Advanced Filtering & Search**: Easily find items by category, name, or description.
- **Modern UI/UX**: Built with Tailwind CSS v4, featuring a glassmorphism design, responsive layouts, and smooth animations.
- **Secure Authentication**: JWT-based authentication protecting user bids and admin routes.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Real-time Communication**: `@stomp/stompjs`, `sockjs-client`
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend API**: Connects to a RESTful API with WebSocket support.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm
- A running backend server (set in `.env.local`)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vendue
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and configure your backend API and WebSocket URLs:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:19090
   NEXT_PUBLIC_WS_URL=ws://localhost:19090
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to explore the marketplace.

## 📁 Project Structure

- `src/app/` - Next.js App Router pages and layouts.
  - `/` - Main marketplace landing page.
  - `/listings/[id]` - Individual auction item details and live bidding room.
  - `/admin/auctions` - Admin live monitoring dashboard.
  - `/login` & `/register` - Authentication pages.
- `src/components/` - Reusable React components.
- `public/` - Static assets.

## 🔐 Authentication

The application uses standard JWT tokens stored in `localStorage` for authenticating requests. 
- **Users**: Can view listings, place bids, and view their bid history.
- **Admins**: Have access to the live monitoring dashboard to oversee all marketplace activity.

## 📄 API Documentation

The backend exposes a comprehensive OpenAPI specification. A snapshot of the API schema can be found in `api-docs.json`.
