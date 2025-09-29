# Vercel Deployment Guide for Internship Portal

This guide provides step-by-step instructions for deploying the Internship Portal to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (free tier available)
3. This repository pushed to GitHub

## Deployment Steps

### 1. Push Code to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/internship-portal.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in or create an account
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project settings:
   - Framework Preset: Next.js
   - Root Directory: Leave empty (or `.`)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Environment Variables

The application is configured to work with Vercel's serverless environment using an in-memory database. No additional environment variables are required for basic deployment.

However, if you want to customize the deployment, you can set these optional environment variables in the Vercel dashboard:

- `ENABLE_MEMORY_DB`: Set to `true` to explicitly use memory database
- `DATABASE_URL`: Set to `memory://` to explicitly use memory database

### 4. Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 1-3 minutes)
3. Your application will be available at a `.vercel.app` URL

## How It Works

### Database Handling

The application automatically uses an in-memory database when deployed to Vercel, which is appropriate for serverless environments. This is configured in `src/lib/database.ts`:

```javascript
// Check if we're in Vercel production environment
const isVercelProduction = process.env.VERCEL === '1';

export function getDatabase() {
  // Use memory database for Vercel production or when ENABLE_MEMORY_DB is set
  if (isVercelProduction || process.env.ENABLE_MEMORY_DB === 'true') {
    console.log('Using memory database for serverless environment');
    return null; // Memory database will be handled in getDbQueries
  }
  // ... rest of the database initialization
}
```

### Memory Database

The memory database implementation in `src/lib/memory-database.ts` provides a complete in-memory alternative to SQLite with the same interface. It's pre-populated with realistic sample data for demonstration.

## Custom Domain (Optional)

To use a custom domain:

1. In your Vercel project dashboard, go to Settings > Domains
2. Add your domain
3. Follow the instructions to configure DNS records with your domain provider

## Monitoring and Analytics

Vercel provides built-in analytics and monitoring:

1. Visit your project dashboard on Vercel
2. Click on "Analytics" to view usage statistics
3. Click on "Logs" to view real-time logs
4. Set up alerts in the "Monitoring" section

## Troubleshooting

### Build Failures

If your build fails:

1. Check the build logs in the Vercel dashboard
2. Ensure all dependencies are correctly listed in `package.json`
3. Verify that the build command in `vercel.json` matches `package.json`
4. Check for TypeScript errors by running `npm run type-check` locally

### Runtime Errors

If you encounter runtime errors:

1. Check the logs in the Vercel dashboard
2. Ensure environment variables are correctly set
3. Verify that the memory database is being used in production

### Performance Issues

For performance optimization:

1. Use Vercel's built-in caching features
2. Optimize images with Next.js Image component
3. Implement incremental static regeneration where appropriate

## Recent Fixes

The following issues have been resolved to ensure successful deployment:

1. Fixed TypeScript errors in API routes by ensuring proper export naming conventions
2. Separated cross-department notification functionality into its own route file
3. Verified successful build with `npm run build` command

## Scaling Considerations

This application is designed for Vercel's serverless infrastructure:

1. Each request is handled by a separate serverless function
2. The in-memory database resets with each function invocation
3. For production use with data persistence, consider migrating to a cloud database like:
   - PlanetScale (MySQL)
   - Supabase (PostgreSQL)
   - MongoDB Atlas
   - AWS DynamoDB

## Support

For issues with deployment:

1. Check the [Vercel documentation](https://vercel.com/docs)
2. Review the [Next.js documentation](https://nextjs.org/docs)
3. File an issue in the repository if you find a bug in the application code