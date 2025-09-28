# Vercel Deployment Guide for Internship Portal

This guide will help you deploy the Internship Portal to Vercel successfully.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A GitHub account with the repository forked or cloned
3. Node.js 18+ installed locally (for testing)

## Deployment Steps

### 1. Generate Secure Secrets

First, generate secure secrets for your production environment:

```bash
# Run this command in your terminal to generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Save these values - you'll need them for Vercel environment variables.

### 2. Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 3. Set Environment Variables

In your Vercel project dashboard, go to Settings > Environment Variables and add:

```
JWT_SECRET=your_generated_jwt_secret_here
NEXTAUTH_SECRET=your_generated_nextauth_secret_here
NODE_ENV=production
VERCEL=1
VERCEL_ENV=production
ENABLE_MEMORY_DB=true
DATABASE_URL=memory://
```

### 4. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your application will be available at your-project.vercel.app

## Default Demo Accounts

The application now automatically creates demo accounts on first access:

- **Admin/Staff**: admin / Password123!
- **Student**: student / Password123!
- **Mentor**: mentor / Password123!
- **Employer**: employer / Password123!

Additional Rajasthan-specific demo accounts:
- **Student**: amit.sharma / Password123!
- **Staff**: rajesh.staff / Password123!
- **Mentor**: vikram.mentor / Password123!
- **Employer**: suresh.employer / Password123!

## Troubleshooting

### "Invalid Credentials" Error

If you're still getting "Invalid credentials" errors:

1. Make sure you're using the correct username/password combinations above
2. Check that your environment variables are set correctly in Vercel
3. Redeploy your application after setting environment variables
4. Clear your browser cache and try again

### Database Issues

The application uses an in-memory database for Vercel deployments. Data will not persist between deployments or server restarts. This is intentional for the serverless environment.

### Build Failures

If you encounter build failures:

1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are correctly installed
3. Verify Node.js version compatibility (18+)

## Security Notes

- Always use strong, randomly generated secrets for JWT_SECRET and NEXTAUTH_SECRET
- Never commit secrets to version control
- Use different secrets for different environments
- Regularly rotate secrets in production

## Custom Domain (Optional)

To use a custom domain:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Vercel will automatically provision an SSL certificate

## Support

For additional help:
- Check the Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Review the Next.js deployment documentation: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- Contact support through the Vercel dashboard