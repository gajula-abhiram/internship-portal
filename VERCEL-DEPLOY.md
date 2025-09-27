# Vercel Deployment Guide for Internship Portal

## 🚀 Quick Deploy to Vercel

### 1. Prepare Your Repository
```bash
# Initialize git repository if not already done
git init
git add .
git commit -m "Initial commit: Production-ready internship portal"

# Push to GitHub
git branch -M main
git remote add origin https://github.com/yourusername/internship-portal.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 3. Configure Environment Variables in Vercel Dashboard
Set these required environment variables in Vercel:

**Essential Variables:**
```bash
JWT_SECRET=your-secure-32-character-jwt-secret-here
NEXTAUTH_SECRET=another-secure-32-character-secret
NODE_ENV=production
VERCEL=1
VERCEL_ENV=production
```

**Database Configuration:**
```bash
DATABASE_URL=memory://
ENABLE_MEMORY_DB=true
```

**Optional Email Configuration:**
```bash
ENABLE_EMAIL_SERVICE=false
# Set to true and configure these for email notifications:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@domain.com
# SMTP_PASS=your-app-password
# SMTP_FROM=noreply@yourorganization.edu
```

**Security & Performance:**
```bash
ENABLE_RATE_LIMIT=true
MAX_REQUESTS_PER_MINUTE=100
ENABLE_CSRF=true
ENABLE_AUDIT_LOG=true
ENABLE_METRICS=true
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
SESSION_TIMEOUT=86400
```

### 4. Generate Secure Secrets
Use this command to generate secure secrets:
```bash
# For JWT_SECRET and NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy
Click "Deploy" in Vercel dashboard. The build should complete successfully.

### 6. Verify Deployment
1. Visit your Vercel app URL
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
3. Register a new user
4. Login and test functionality

## 🔧 Production Database Options

### Option 1: In-Memory Database (Current Setup)
- ✅ **Pros**: Zero configuration, works immediately
- ❌ **Cons**: Data resets on each deployment
- 🎯 **Best for**: Demos, testing, development

### Option 2: External Database (Recommended for Production)
For persistent data, consider these options:

**PlanetScale (MySQL)**
```bash
DATABASE_URL=mysql://username:password@host:port/database?sslaccept=strict
ENABLE_MEMORY_DB=false
```

**Supabase (PostgreSQL)**
```bash
DATABASE_URL=postgresql://username:password@host:port/database
ENABLE_MEMORY_DB=false
```

**Neon (PostgreSQL)**
```bash
DATABASE_URL=postgresql://username:password@host:port/database
ENABLE_MEMORY_DB=false
```

## 🛡️ Security Features Enabled

- ✅ JWT-based authentication
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Security headers
- ✅ Input validation
- ✅ XSS protection
- ✅ Audit logging

## 📊 Monitoring & Analytics

Access these endpoints after deployment:
- `/api/health` - System health status
- `/api/analytics/dashboard` - Performance metrics (admin only)

## 🚨 Troubleshooting

### Build Fails
1. Check Vercel build logs
2. Ensure all dependencies are in `package.json`
3. Verify environment variables are set

### API Errors
1. Check function logs in Vercel dashboard
2. Ensure JWT_SECRET is configured
3. Verify API routes are accessible

### Login Issues
1. Generate new JWT_SECRET if needed
2. Check browser console for errors
3. Verify memory database is initializing

## 📈 Performance Optimization

The application includes:
- Response compression
- Static asset optimization
- Efficient caching strategies
- Optimized database queries
- Security middleware

## 🎯 Next Steps After Deployment

1. **Test All Features**: Registration, login, internship creation, applications
2. **Monitor Performance**: Check `/api/health` regularly
3. **Set Up External Database**: For production persistence
4. **Configure Email**: Enable SMTP for notifications
5. **Custom Domain**: Add your organization's domain in Vercel
6. **Team Access**: Invite team members in Vercel dashboard

## 📞 Support

- Check the `/api/health` endpoint for system status
- Review Vercel function logs for debugging
- Consult the production documentation in README-PRODUCTION.md

---

🎉 **Your internship portal is now live and production-ready!**