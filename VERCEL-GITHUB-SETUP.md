# Vercel Project Configuration Guide

## Quick Setup for GitHub + Vercel Deployment

### 1. Initial Vercel Setup

1. **Connect GitHub Repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository: `your-username/internship-portal`

2. **Configure Build Settings:**
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next (auto-detected)
   Install Command: npm ci
   Development Command: npm run dev
   ```

### 2. Environment Variables Setup

**⚠️ CRITICAL: Set these in Vercel Dashboard → Settings → Environment Variables**

#### Required Variables (Production):
```bash
# Security (REQUIRED)
JWT_SECRET=your-secure-32-character-jwt-secret-here
NEXTAUTH_SECRET=another-secure-32-character-secret

# Environment
NODE_ENV=production
VERCEL=1
VERCEL_ENV=production

# Database Configuration
DATABASE_URL=memory://
ENABLE_MEMORY_DB=true
```

#### Optional Performance Variables:
```bash
# Security Features
ENABLE_RATE_LIMIT=true
MAX_REQUESTS_PER_MINUTE=100
ENABLE_CSRF=true
ENABLE_AUDIT_LOG=true
SESSION_TIMEOUT=86400

# Performance
ENABLE_METRICS=true
ENABLE_ERROR_TRACKING=true
ENABLE_COMPRESSION=true
ENABLE_CACHING=true

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png
```

### 3. GitHub Secrets Configuration

**For GitHub Actions workflow, add these secrets in GitHub:**
- Repository Settings → Secrets and variables → Actions

```bash
# Vercel Integration
VERCEL_TOKEN=your-vercel-token-here
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

### 4. Obtaining Vercel Credentials

#### Get Vercel Token:
1. Go to Vercel Dashboard → Settings → Tokens
2. Create new token with appropriate scope
3. Copy the token to GitHub Secrets as `VERCEL_TOKEN`

#### Get Vercel Org ID:
```bash
# Run locally after installing Vercel CLI
npx vercel login
npx vercel link
cat .vercel/project.json
```

#### Get Vercel Project ID:
- Available in the same `.vercel/project.json` file
- Or from Vercel Dashboard → Project Settings

### 5. Domain Configuration (Optional)

If using custom domain:
1. Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 6. Deployment Branches

**Automatic Deployments:**
- `main` or `master` branch → Production deployment
- Feature branches → Preview deployments
- Pull requests → Preview deployments with unique URLs

### 7. Monitoring and Debugging

**Available Endpoints:**
- Health Check: `https://your-app.vercel.app/api/health`
- API Routes: `https://your-app.vercel.app/api/*`

**Logs:**
- Vercel Dashboard → Project → Functions tab
- Real-time logs during deployment
- Runtime logs for debugging

### 8. Production Checklist

- [ ] Repository connected to Vercel
- [ ] Environment variables configured
- [ ] GitHub secrets added
- [ ] Build successful
- [ ] Health check passing
- [ ] Domain configured (if custom)
- [ ] Monitoring setup

### 9. Common Issues & Solutions

**Build Failures:**
- Check Node.js version compatibility (use Node 18+)
- Verify all dependencies are in package.json
- Check TypeScript errors (disabled in build)

**Runtime Errors:**
- Verify environment variables are set
- Check function timeout limits (30s max)
- Monitor memory usage

**Database Issues:**
- Production uses in-memory database
- No persistent storage in serverless environment
- Consider external database for production data

### 10. Security Considerations

- Never commit `.env` files with real secrets
- Use Vercel's environment variables feature
- Enable security headers (already configured)
- Monitor for security updates

### 11. Scaling Considerations

- Vercel automatically scales
- Monitor function execution limits
- Consider upgrading plan for high traffic
- Implement proper error handling and logging

---

## Quick Command Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to Vercel (manual)
npm run deploy:vercel

# Generate secrets
npm run generate-secrets

# Health check
npm run health-check
```