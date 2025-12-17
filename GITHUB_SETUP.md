# GitHub Private Repository Setup

This repository is configured for a **private GitHub repository**. All sensitive files are properly ignored.

## ✅ Pre-Push Verification

### Environment Files (Properly Ignored)
- ✅ `.env.local` - Contains real credentials (git-ignored)
- ✅ `.env` - Git-ignored
- ✅ `.cursor-state.json` - Git-ignored
- ✅ `.env.example` - Contains placeholders (committed)

### Build Artifacts (Properly Ignored)
- ✅ `.next/` - Next.js build output
- ✅ `node_modules/` - Dependencies
- ✅ `playwright-report/` - Test reports
- ✅ `.vercel/` - Vercel config

### Documentation
- ✅ Documentation files may contain example API keys (safe for private repo)
- ✅ All real credentials are in `.env.local` (not committed)

## 🚀 Push to GitHub

### Step 1: Create Private Repository on GitHub

1. Go to **GitHub.com** → Click **"+"** → **"New repository"**
2. **Repository name**: `lattice-ai-platform` (or your preferred name)
3. **Description**: "AI Triage + Booking + Human Handover platform"
4. **Visibility**: ✅ **Private** (IMPORTANT!)
5. **DO NOT** check:
   - ❌ Add a README file (we already have one)
   - ❌ Add .gitignore (we already have one)
   - ❌ Choose a license (unless you want one)
6. Click **"Create repository"**

### Step 2: Add Remote and Push

```bash
# Check current remote (if any)
git remote -v

# If no remote exists, add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/lattice-ai-platform.git

# Or if using SSH:
git remote add origin git@github.com:YOUR_USERNAME/lattice-ai-platform.git

# Verify remote
git remote -v

# Check current branch name
git branch

# Push to GitHub (replace 'main' with your branch name if different)
git push -u origin main

# Or if your branch is named differently (e.g., 'git'):
git push -u origin git:main
# Or:
git checkout -b main
git push -u origin main
```

### Step 3: Verify Push

1. Go to your GitHub repository
2. Verify all files are present
3. Verify `.env.local` is **NOT** in the repository
4. Verify sensitive files are not visible

## 🔒 Security Notes for Private Repo

Since this is a **private repository**, it's acceptable to:
- ✅ Include example API keys in documentation
- ✅ Include configuration examples with real-looking values
- ✅ Share credentials with team members via secure channels

**However, still follow best practices:**
- ❌ Never make the repository public without removing secrets first
- ❌ Never commit `.env.local` or any file with real credentials
- ❌ Rotate keys if repository access changes
- ❌ Use environment variables in production (Vercel, etc.)

## 📋 Files Being Committed

### Safe to Commit (Contains Examples/Placeholders):
- ✅ `.env.example` - Template with placeholders
- ✅ Documentation files - May contain example keys
- ✅ Source code - No hardcoded secrets
- ✅ Configuration files - No real credentials

### NOT Committed (Git-Ignored):
- ❌ `.env.local` - Real credentials
- ❌ `.env` - Real credentials
- ❌ `.cursor-state.json` - Local state
- ❌ `.next/` - Build artifacts
- ❌ `node_modules/` - Dependencies

## 🔄 After Pushing

### Connect to Vercel

1. **Go to Vercel Dashboard** → Add New Project
2. **Import from GitHub** → Select your repository
3. **Configure Project**:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

### Set Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

```bash
# Required
AIRTABLE_TOKEN=pat7chqmohnFCro6Y.da5ac71579f686c6cc8e31807226533002abada87fe6fdc562112108b7116f0d
AIRTABLE_BASE_ID=app4VkcE70EvgCMM5
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
CLERK_SECRET_KEY=sk_test_... (or sk_live_...)
PUBLIC_BASE_URL=https://your-app.vercel.app

# Optional (VAPI)
VAPI_PRIVATE_API_KEY=sk_...
VAPI_ASSISTANT_ID=...
VAPI_PHONE_NUMBER_ID=...
```

**Important**: 
- Add for **Production**, **Preview**, and **Development** environments
- Update `PUBLIC_BASE_URL` after first deploy with your actual Vercel URL

### Deploy

1. Vercel will auto-deploy on push to `main` branch
2. Or manually deploy from Vercel Dashboard
3. Check deployment logs for any issues

## ✅ Verification Checklist

Before pushing:
- [x] `.env.local` is in `.gitignore`
- [x] `.env` is in `.gitignore`
- [x] `.cursor-state.json` is in `.gitignore`
- [x] Build succeeds: `npm run build`
- [x] No sensitive files staged: `git status`
- [x] GitHub repository created as **Private**
- [x] Remote added correctly
- [x] Ready to push

After pushing:
- [ ] Repository is private on GitHub
- [ ] All files present (except ignored ones)
- [ ] `.env.local` is NOT in repository
- [ ] Connected to Vercel
- [ ] Environment variables set in Vercel
- [ ] First deployment successful

## 🛠️ Troubleshooting

### "Repository not found"
- Check repository name matches
- Verify you have access to the repository
- Check if repository is private and you're authenticated

### "Permission denied"
- Use SSH keys or GitHub CLI for authentication
- Or use HTTPS with personal access token

### Build fails on Vercel
- Check environment variables are set
- Check build logs in Vercel Dashboard
- Verify `package.json` has correct build script

## 📝 Next Steps

1. Push to GitHub (private repo)
2. Connect to Vercel
3. Set environment variables
4. Deploy
5. Configure external services (Clerk, Airtable, VAPI webhooks)
6. Test production deployment
