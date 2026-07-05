# Deployment Guide

This guide covers deploying the CRM Manager application using **Render** for the backend and **Vercel** for the frontend.

## Prerequisites

- GitHub account with the project repository
- Render account (free tier available)
- Vercel account (free tier available)
- PostgreSQL database (Render provides free PostgreSQL)

---

## Part 1: Deploy Backend on Render

### 1. Prepare Backend for Production

#### Create `render.yaml` in `backend/` directory:

```yaml
services:
  - type: web
    name: crm-manager-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: crm-manager-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: BREVO_API_KEY
        sync: false
      - key: BREVO_SENDER_EMAIL
        sync: false
      - key: BREVO_SENDER_NAME
        sync: false
      - key: FRONTEND_URL
        value: https://your-frontend-url.vercel.app

databases:
  - name: crm-manager-db
    databaseName: crm_manager
    user: crm_user
```

#### Update `backend/package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc && npx prisma generate",
    "start": "node dist/server.js",
    "postinstall": "npx prisma generate"
  }
}
```

### 2. Deploy to Render

1. **Push code to GitHub** (if not already done)
2. **Go to [render.com](https://render.com)** and sign up/login
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure the service:**
   - Name: `crm-manager-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. **Add Environment Variables:**
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a secure random string
   - `BREVO_API_KEY`: Your Brevo API key
   - `BREVO_SENDER_EMAIL`: Your verified Brevo sender email
   - `BREVO_SENDER_NAME`: Your sender name
   - `FRONTEND_URL`: Will add after frontend deployment
7. **Deploy** - Render will automatically build and deploy

### 3. Set Up PostgreSQL Database

1. In Render dashboard, click **"New +" → "PostgreSQL"**
2. Name it: `crm-manager-db`
3. Choose region (same as backend)
4. Click **"Create Database"**
5. Copy the **Internal Database URL**
6. Go to your backend service → Settings → Environment Variables
7. Add `DATABASE_URL` with the database URL
8. **Redeploy** the backend service

### 4. Run Database Migrations

After database is set up, you need to run migrations:

1. Go to your backend service in Render
2. Click **"Manual Deploy"** → "Deploy latest commit"
3. Add a **Deploy Hook** or run migrations via Render CLI:
   ```bash
   # In your local terminal with Render CLI installed
   render deploy --service crm-manager-backend
   ```

Or add a migration script to `package.json`:

```json
{
  "scripts": {
    "migrate:deploy": "npx prisma migrate deploy"
  }
}
```

And update the build command in Render to:
```
npm install && npm run migrate:deploy && npm run build
```

---

## Part 2: Deploy Frontend on Vercel

### 1. Prepare Frontend for Production

#### Create `.env.local` in `frontend/` directory (local only):

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

#### Create `vercel.json` in `frontend/` directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-backend-url.onrender.com"
  }
}
```

### 2. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Click "Add New..." → "Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. **Add Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://crm-manager-backend.onrender.com`)
6. **Click "Deploy"**
7. Wait for deployment to complete
8. Copy the deployed URL (e.g., `https://crm-manager.vercel.app`)

### 3. Update Backend CORS

Update your backend's CORS configuration to allow the Vercel frontend:

In `backend/src/server.ts`:
```typescript
app.use(cors({
  origin: ['https://your-frontend-url.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

Update the `FRONTEND_URL` environment variable in Render with your Vercel URL.

---

## Part 3: Configure Email Service (Brevo)

1. **Sign up at [Brevo](https://www.brevo.com)**
2. **Verify your sender email** in Brevo dashboard
3. **Get your API Key** from Settings → API Keys
4. **Add to Render environment variables:**
   - `BREVO_API_KEY`: Your API key (starts with `xkeysib-`)
   - `BREVO_SENDER_EMAIL`: Your verified sender email
   - `BREVO_SENDER_NAME`: Your sender name

---

## Part 4: Test the Deployed Application

1. **Visit your Vercel frontend URL**
2. **Test registration flow**
3. **Test login flow**
4. **Test invitation email sending**
5. **Test deal creation and management**

---

## Troubleshooting

### Backend Issues

**Database connection error:**
- Ensure `DATABASE_URL` is correctly set in Render
- Check PostgreSQL database is running
- Verify database user has correct permissions

**Build fails:**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation succeeds

### Frontend Issues

**API connection error:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is running and accessible
- Ensure CORS is configured on backend

**Build fails:**
- Check Vercel build logs
- Ensure Next.js version is compatible
- Verify all dependencies are installed

---

## Environment Variables Reference

### Backend (Render)
- `NODE_ENV`: `production`
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Random secret string for JWT
- `BREVO_API_KEY`: Brevo API key
- `BREVO_SENDER_EMAIL`: Verified sender email
- `BREVO_SENDER_NAME`: Sender name
- `FRONTEND_URL`: Vercel frontend URL

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Render backend URL

---

## Continuous Deployment

Both Render and Vercel support automatic deployments:

- **Render**: Automatically deploys when you push to the connected GitHub branch
- **Vercel**: Automatically deploys when you push to the connected GitHub branch

To enable:
1. Connect your GitHub repository to both platforms
2. Select the branch to deploy (usually `main`)
3. Enable auto-deploy in settings

---

## Cost Estimate

**Free Tier (both platforms):**
- Render: Free tier includes 750 hours/month of web service + 1GB PostgreSQL
- Vercel: Free tier includes unlimited deployments with 100GB bandwidth

**Paid Tier (if needed):**
- Render: Starting at $7/month for web services
- Vercel: Starting at $20/month for Pro plan

---

## Security Best Practices

1. **Never commit `.env` files** to GitHub
2. **Use strong secrets** for JWT and API keys
3. **Enable HTTPS** (both platforms provide this by default)
4. **Rotate secrets** periodically
5. **Monitor logs** for suspicious activity
6. **Set up alerts** for deployment failures

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Brevo API Documentation](https://developers.brevo.com)
