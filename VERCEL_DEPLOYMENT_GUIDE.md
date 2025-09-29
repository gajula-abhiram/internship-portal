# Vercel Deployment Guide for Internship Portal

This guide explains how to deploy the Internship Portal to Vercel with all demo accounts having posted data and working credentials.

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. Node.js 18+ installed locally
3. Git installed locally

## Deployment Process

### 1. Prepare the Repository

Ensure your repository contains all necessary files:
- All source code in `src/` directory
- Synthetic dataset in `internship_portal_synthetic_dataset/dataset/`
- Configuration files (`vercel.json`, `package.json`, etc.)

### 2. Environment Configuration

The application is pre-configured for Vercel deployment with the following settings in `vercel.json`:

```json
{
  "env": {
    "ENABLE_MEMORY_DB": "true",
    "DATABASE_URL": "memory://",
    "VERCEL": "1",
    "NODE_ENV": "production",
    "VERCEL_ENV": "production",
    "JWT_SECRET": "secure-jwt-secret",
    "NEXTAUTH_SECRET": "secure-nextauth-secret"
  }
}
```

These settings ensure the application uses the in-memory database for Vercel deployment.

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

Set these environment variables in your Vercel project dashboard:

```
ENABLE_MEMORY_DB=true
DATABASE_URL=memory://
VERCEL=1
NODE_ENV=production
VERCEL_ENV=production
JWT_SECRET=your-secure-32-character-jwt-secret
NEXTAUTH_SECRET=your-secure-32-character-nextauth-secret
```

## How It Works

### Memory Database

For Vercel deployment, the application uses an in-memory database that provides:

- Full CRUD operations for all entities
- Calendar event management with scheduling
- User authentication and management
- Internship and application tracking
- Analytics and reporting features

The memory database is automatically populated with sample data that represents the synthetic dataset, ensuring all demo accounts have posted data.

### Demo Accounts

The memory database includes the following demo accounts with working credentials:

1. **Admin User**
   - Username: `admin`
   - Password: `Password123!`

2. **Student Users**
   - Username: `student` or `amit.sharma`
   - Password: `Password123!`

3. **Mentor Users**
   - Username: `mentor` or `vikram.mentor`
   - Password: `Password123!`

4. **Employer Users**
   - Username: `employer` or `suresh.employer`
   - Password: `Password123!`

5. **Staff Users**
   - Username: `rajesh.staff`
   - Password: `Password123!`

All accounts have associated data including:
- User profiles with realistic information
- Internship postings
- Applications with various statuses
- Calendar events
- Feedback and analytics data

## Ensuring No "npm exited with 1" Error

To prevent build errors:

1. **Check Node.js Version**: Ensure Node.js 18+ is used
2. **Verify Dependencies**: All required packages are listed in `package.json`
3. **Check Build Scripts**: The `build` script in `package.json` should be `"next build"`
4. **Memory Configuration**: The Vercel configuration includes proper memory allocation

### Common Fixes

If you encounter build errors:

1. **Clear Build Cache**:
   ```bash
   # In Vercel dashboard, redeploy with "Clear Cache and Redeploy"
   ```

2. **Check Logs**:
   - View detailed logs in Vercel dashboard
   - Look for specific error messages

3. **Verify Environment Variables**:
   - Ensure all required environment variables are set
   - Check for typos in variable names

4. **Check File Paths**:
   - Ensure all import paths are correct
   - Verify no missing files

## Testing the Deployment

After deployment:

1. Visit your deployed URL
2. Test login with demo credentials
3. Verify all user roles can access their respective dashboards
4. Check that internships, applications, and other data are displayed
5. Test API endpoints at `/api/health`

## Monitoring and Debugging

### Health Check Endpoint

The application includes a health check endpoint at:
```
GET /api/health
```

This endpoint verifies:
- Database connectivity
- API functionality
- Service status

### Vercel Analytics

Vercel provides built-in analytics for:
- Performance monitoring
- Error tracking
- Usage statistics

## Scaling Considerations

### Memory Database Limitations

The in-memory database:
- Resets on each deployment
- Does not persist data between requests
- Is suitable for demo and testing purposes

For production use with data persistence, consider migrating to:
- PlanetScale (MySQL)
- Supabase (PostgreSQL)
- Neon (PostgreSQL)

### Performance Optimization

The application is optimized for Vercel's serverless environment:
- Functions have appropriate timeout settings
- Memory allocation is optimized
- API routes are efficient

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Solution: Check Node.js version compatibility
   - Solution: Verify all dependencies are installed

2. **Runtime Errors**
   - Solution: Check environment variables
   - Solution: Verify memory database configuration

3. **Authentication Issues**
   - Solution: Ensure JWT secrets are properly set
   - Solution: Check password hashing implementation

### Support

For additional help:
- Check the Vercel documentation
- Review the application's README files
- Contact the development team

## Conclusion

The Internship Portal is fully configured for deployment to Vercel with:
- All demo accounts having working credentials
- Posted data for realistic testing
- No synthetic data indicators in the UI
- Proper error handling to prevent "npm exited with 1" errors
- Optimized performance for serverless environments

Simply follow the deployment steps above to have your internship portal running on Vercel within minutes.