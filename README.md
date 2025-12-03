# EZquence-Frontend

A SAAS product meant to help companies streamline their production process from request to delivery

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account
- Access to the EZquence backend API

### Environment Setup

This project uses environment variables for configuration. Copy `.env.example` to `.env.local` for development:

```bash
cp .env.example .env.local
```

#### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_JWT_SECRET="your_supabase_jwt_secret_here"

# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

For production deployment, ensure your `.env.production` file contains:

```env
NEXT_PUBLIC_API_BASE_URL=https://ezquence-backend.onrender.com
```

### Installation

Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The development server will use the API URL specified in `.env.local` (defaults to `http://localhost:8080`).

### Building for Production

Build the application for production:

```bash
npm run build
```

Or use the production build script (sets NODE_ENV=production):

```bash
npm run build:prod
```

### Production Deployment

#### Local Production Server

To run a production build locally:

```bash
npm run build:prod
npm start
```

Or use the combined deploy command:

```bash
npm run deploy
```

This will automatically use the production API URL from `.env.production`.

#### Deployment to Render.com

When deploying to Render.com:

1. Connect your GitHub repository to Render
2. Set the following environment variables in your Render dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_JWT_SECRET`
   - `NEXT_PUBLIC_API_BASE_URL=https://ezquence-backend.onrender.com`
3. Render will automatically detect Next.js and run:
   - Build command: `npm run build`
   - Start command: `npm start`

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (protected)/  # Protected routes (admin, production)
│   │   └── api/          # API test routes
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Library code (auth)
│   └── utils/            # Utility functions
│       ├── apiConfig.ts  # Centralized API configuration
│       └── supabase/     # Supabase client setup
├── .env.example          # Environment variables template
├── .env.local            # Local development environment (not committed)
└── .env.production       # Production environment (not committed)
```

## API Configuration

All API calls use the centralized configuration from `src/utils/apiConfig.ts`:

```typescript
import { getApiBaseUrl } from '@/utils/apiConfig';

// Use in your API calls
const response = await fetch(`${getApiBaseUrl()}/endpoint`, {
  // ... your request options
});
```

The API URL is automatically determined by the environment:
- **Development** (`npm run dev`): Uses `http://localhost:8080`
- **Production** (`npm start`): Uses `https://ezquence-backend.onrender.com`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build with NODE_ENV=production
- `npm start` - Start production server
- `npm run deploy` - Build and start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **State Management**: TanStack Query (React Query)
- **UI Components**: React Icons
- **Charts**: Recharts

## License

This project is proprietary software.
