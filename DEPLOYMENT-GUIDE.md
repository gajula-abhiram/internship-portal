# Vercel Deployment Guide

This guide explains how to deploy the Internship Portal application to Vercel via GitHub.

## Prerequisites

1. A GitHub account with repository access
2. A Vercel account
3. Repository cloned locally (optional, for local testing)

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 2. Environment Variables

The application is configured to work with Vercel's serverless environment using in-memory database by default. The following environment variables are set in `vercel.json`:

- `VERCEL=1`
- `VERCEL_ENV=production`
- `NODE_ENV=production`
- `ENABLE_MEMORY_DB=true`
- `DATABASE_URL=memory://`

For security, you should set these secrets in Vercel dashboard:
- `JWT_SECRET` - For JWT token signing
- `NEXTAUTH_SECRET` - For NextAuth.js

### 3. Deploy via GitHub Actions

This repository includes a GitHub Actions workflow that automatically deploys to Vercel:

1. On push to `main` or `master` branch: Deploys to production
2. On pull requests to `main` or `master` branch: Creates preview deployments

The workflow requires the following secrets to be set in your GitHub repository:
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID
- `VERCEL_TOKEN` - Your Vercel authentication token

### 4. Manual Deployment (Optional)

If you prefer to deploy manually:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy to production
vercel --prod
```

## Serverless Considerations

This application is optimized for Vercel's serverless environment:

1. **Database**: Uses in-memory database for serverless deployment to avoid filesystem issues
2. **File Uploads**: Not currently implemented for serverless (would require external storage like AWS S3)
3. **Cron Jobs**: Health checks are configured via Vercel Cron jobs
4. **Memory Usage**: Configured with 1024MB memory for API functions

## Troubleshooting

### Common Issues

1. **Build Failures**: Ensure all dependencies are correctly listed in `package.json`
2. **Environment Variables**: Check that all required environment variables are set in Vercel dashboard
3. **Serverless Limits**: Vercel has limits on execution duration (30 seconds) and memory (1024MB)

### Health Check

The application includes a health check endpoint at `/api/health` which verifies:
- Database connectivity
- Service availability
- System metrics

You can monitor this endpoint for deployment health.

## Local Development vs Production

For local development, the application uses SQLite database by default. For production deployment on Vercel, it automatically switches to in-memory database to comply with serverless constraints.

To test production-like environment locally:
```bash
# Set environment variables
export VERCEL=1
export ENABLE_MEMORY_DB=true
export DATABASE_URL=memory://

# Run development server
npm run dev
```

## Monitoring and Logs

Vercel provides built-in monitoring and logs:
1. Visit your project dashboard on Vercel
2. Navigate to the "Logs" tab to view real-time logs
3. Use the "Analytics" tab to monitor performance
4. Set up alerts for error rates and performance issues

## Updating the Application

To update your deployed application:

1. Push changes to your GitHub repository
2. If using GitHub Actions, the deployment will happen automatically
3. If deploying manually, re-run the deployment command

For major updates, consider:
1. Testing in a staging environment first
2. Backing up any persistent data (though this application uses in-memory database)
3. Checking for any breaking changes in dependencies