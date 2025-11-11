# GitHub Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Name it: `dual-spectrum` (or any name you prefer)
4. Make it **Public** (or Private if you prefer)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/dual-spectrum.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel from GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New..." → "Project"
4. Import your `dual-spectrum` repository
5. Vercel will auto-detect the settings
6. Click "Deploy"

## Benefits of GitHub Deployment

✅ **All images included** - Images are part of the repository  
✅ **Automatic deployments** - Every push to GitHub auto-deploys  
✅ **Version control** - Track all changes  
✅ **Easy collaboration** - Team members can contribute  
✅ **Better CI/CD** - Vercel automatically builds from GitHub  

## Manual Deployment (Alternative)

If you prefer to keep deploying manually:

```bash
vercel --prod --yes
```

But GitHub integration is recommended for better reliability and automatic deployments!

