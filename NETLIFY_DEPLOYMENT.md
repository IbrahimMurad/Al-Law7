# Netlify Deployment Guide

This guide will help you deploy your Al-Law7 application to Netlify without errors.

## Prerequisites

1. A Netlify account (sign up at https://netlify.com)
2. Your project repository on GitHub, GitLab, or Bitbucket
3. A PostgreSQL database (optional - currently using in-memory storage)

## Setup Steps

### 1. Install Dependencies

First, install the required dependency for Netlify Functions:

```bash
npm install
```

This will install `serverless-http` which is required for the Netlify function wrapper.

### 2. Environment Variables

In your Netlify dashboard, go to **Site settings** → **Environment variables** and add:

- `DATABASE_URL` (optional): Your PostgreSQL connection string if you want to use a database instead of in-memory storage
  - Example: `postgresql://user:password@host:5432/database`
  - If not set, the app will use in-memory storage (data won't persist between deployments)

### 3. Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your Git repository
4. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/public`
5. Click **Deploy site**

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 4. Verify Deployment

After deployment, your site should be available at `https://your-site-name.netlify.app`

- The React frontend will be served as static files
- API routes (`/api/*`) will be handled by Netlify Functions
- All other routes will redirect to `index.html` for SPA routing

## Configuration Files

### `netlify.toml`

This file configures:
- Build command and publish directory
- Node.js version (20)
- Redirects for API routes to Netlify Functions
- SPA routing redirects

### `netlify/functions/server.ts`

This is the Netlify Function wrapper that:
- Wraps your Express app with `serverless-http`
- Handles all API routes
- Serves as the serverless function entry point

## Troubleshooting

### Build Errors

If you encounter build errors:

1. **TypeScript errors**: Make sure all dependencies are installed
   ```bash
   npm install
   ```

2. **Missing dependencies**: Ensure `serverless-http` is in `package.json`
   ```bash
   npm install serverless-http
   ```

3. **Function not found**: Verify the function is in `netlify/functions/server.ts`

### Runtime Errors

1. **API routes not working**: Check that the redirect in `netlify.toml` is correct
2. **Database connection errors**: Verify `DATABASE_URL` is set correctly in Netlify environment variables
3. **Static files not loading**: Ensure the build outputs to `dist/public`

### Function Timeout

Netlify Functions have a default timeout of 10 seconds (26 seconds for Pro plans). If your API calls take longer, consider:
- Optimizing database queries
- Using Netlify's background functions
- Upgrading to a Pro plan

## Current Limitations

- **In-memory storage**: The app currently uses in-memory storage by default. Data will not persist between function invocations or deployments. To enable persistence, set up a PostgreSQL database and configure `DATABASE_URL`.

## Next Steps

1. Set up a PostgreSQL database (e.g., Neon, Supabase, or Railway)
2. Configure `DATABASE_URL` in Netlify environment variables
3. Run database migrations if needed
4. Test all API endpoints after deployment

