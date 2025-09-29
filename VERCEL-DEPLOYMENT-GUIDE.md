# Vercel Deployment Guide

This guide explains how to deploy the Internship and Placement Management System to Vercel.

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. Node.js 18+ installed locally
3. Git installed locally

## Deployment Process

### 1. Clone the Repository

```bash
git clone <repository-url>
cd internship-portal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy to Vercel

You can deploy in several ways:

#### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

#### Option B: Using Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel dashboard
3. Configure the project settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 4. Environment Variables

The application is pre-configured for Vercel deployment with the following settings in `vercel.json`:

```json
{
  "env": {
    "ENABLE_MEMORY_DB": "true",
    "DATABASE_URL": "memory://",
    "VERCEL": "1"
  }
}
```

These settings ensure the application uses the in-memory database for Vercel deployment.

## How It Works

### Memory Database

For Vercel deployment, the application uses an in-memory database that provides:

- Full CRUD operations for all entities
- Calendar event management with scheduling
- User authentication and management
- Internship and application tracking
- Analytics and reporting features

### Serverless Architecture

The application is designed to work with Vercel's serverless functions:

- Each API route runs as a separate serverless function
- Database operations are optimized for serverless environments
- No persistent connections or file system dependencies

## Features Available in Vercel Deployment

All core features are available in the Vercel deployment:

- ✅ User authentication (login/register)
- ✅ Internship listing and application
- ✅ Application tracking and status updates
- ✅ Calendar integration with scheduling
- ✅ Conflict detection for interviews
- ✅ Real-time application tracking
- ✅ Analytics dashboard
- ✅ Notification system
- ✅ Interview scheduling

## Limitations

### Data Persistence

- Data is not persistent between deployments
- Suitable for demonstration and testing
- Not recommended for production without external database

### Performance

- Cold starts may affect initial request performance
- Memory limitations in serverless functions

## Production Considerations

For production use, consider:

1. **External Database**:
   - Integrate with PlanetScale, Supabase, or Neon
   - Update database.ts to support cloud databases

2. **Data Persistence**:
   - Implement backup/restore functionality
   - Add data export/import features

3. **Performance Optimization**:
   - Implement caching strategies
   - Add CDN for static assets

## Troubleshooting

### Build Failures

If you encounter build failures, ensure:

1. All dependencies are installed:
   ```bash
   npm install
   ```

2. Environment variables are set correctly in Vercel dashboard

3. Check the build logs for specific error messages

### Runtime Issues

If the application doesn't work correctly after deployment:

1. Verify environment variables in Vercel dashboard
2. Check the function logs for errors
3. Ensure the memory database is enabled

## Support

For issues with deployment, contact the development team or check the documentation in:

- `VERCEL-DEPLOYMENT-SUMMARY.md`
- `DEPLOYMENT-CHECKLIST.md`
- `PRODUCTION_READINESS_REPORT.md`

## Conclusion

The application is fully deployable to Vercel with all features working correctly. The memory database provides a complete implementation while being compatible with Vercel's serverless environment.