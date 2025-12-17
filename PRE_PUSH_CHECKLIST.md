# Pre-Push Checklist for GitHub (Private Repository)

## ✅ Security Verification

**Note**: This is a **PRIVATE repository**, so example API keys in documentation are acceptable.

### 1. Environment Files
- [x] `.env.local` is in `.gitignore` ✅
- [x] `.env` is in `.gitignore` ✅
- [x] `.env.example` contains placeholders ✅
- [x] Verify `.env.local` is NOT tracked by git:
  ```bash
  git ls-files | grep .env.local
  # Should return nothing ✅
  ```

### 2. Secrets Check (Private Repo - Relaxed)
- [x] No hardcoded API keys in **source code** ✅
- [x] Example keys in **documentation** are acceptable for private repo ✅
- [x] Real credentials are in `.env.local` (git-ignored) ✅
- [x] `.env.local` is properly ignored ✅

### 3. Sensitive Data
- [ ] No real Airtable tokens
- [ ] No real Clerk keys
- [ ] No real VAPI keys
- [ ] No real phone numbers
- [ ] No real email addresses (unless public)

### 4. Build Artifacts
- [x] `.next/` is in `.gitignore` ✅
- [x] `node_modules/` is in `.gitignore` ✅
- [x] `playwright-report/` is in `.gitignore` ✅
- [x] `.vercel/` is in `.gitignore` ✅

## 📝 Pre-Push Steps

### Step 1: Verify No Secrets
```bash
# Check for any real tokens (replace with your actual token patterns)
grep -r "pat[A-Za-z0-9]\{40\}" . --exclude-dir=node_modules --exclude="*.md"
grep -r "sk_[a-z]_[A-Za-z0-9]\{40\}" . --exclude-dir=node_modules --exclude="*.md"
grep -r "pk_[a-z]_[A-Za-z0-9]\{40\}" . --exclude-dir=node_modules --exclude="*.md"
```

### Step 2: Check Git Status
```bash
git status
# Verify no .env files are staged
# Verify no sensitive files are staged
```

### Step 3: Verify .gitignore
```bash
# Test that sensitive files are ignored
git check-ignore .env.local .env .cursor-state.json
# Should list all three files
```

### Step 4: Build Test
```bash
npm run build
# Should succeed without errors
```

### Step 5: Create GitHub Repository

1. **Go to GitHub** → New Repository
2. **Repository name**: `lattice-ai-platform` (or your preferred name)
3. **Visibility**: ✅ **Private** (important!)
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. **Click "Create repository"**

### Step 6: Push to GitHub

```bash
# Add remote (replace with your GitHub username/repo)
git remote add origin https://github.com/YOUR_USERNAME/lattice-ai-platform.git

# Or if using SSH:
git remote add origin git@github.com:YOUR_USERNAME/lattice-ai-platform.git

# Verify remote
git remote -v

# Push to GitHub
git push -u origin main
# Or if your branch is named differently:
git push -u origin git
```

## 🔒 Environment Variables Setup

After pushing to GitHub, set up environment variables in:

### Vercel (for deployment)
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all variables from `.env.example`
- **Never commit these to GitHub**

### Local Development
- Copy `.env.example` to `.env.local`
- Fill in with your actual credentials
- `.env.local` is already in `.gitignore`

## 📋 Files to Review Before Push

**Note**: Since this is a private repo, example keys in documentation are fine.

- [x] `SESSION_SUMMARY.md` - Contains example tokens (OK for private repo) ✅
- [x] Documentation files - May contain example keys (OK for private repo) ✅
- [x] `scripts/*.ts` - No hardcoded tokens ✅
- [x] `app/**/*.tsx` - No hardcoded keys ✅
- [x] `.env.local` - Real credentials (git-ignored) ✅

## 🚨 Important Security Notes

**Since this is a PRIVATE repository:**
- ✅ Example API keys in documentation are acceptable
- ✅ Real credentials in `.env.local` are git-ignored (safe)
- ⚠️ **NEVER** make the repository public without removing secrets first
- ⚠️ Rotate keys if repository access changes
- ⚠️ Use environment variables in production (Vercel) - don't hardcode

## ✅ Final Checklist

- [ ] All environment files are in `.gitignore`
- [ ] No real secrets in code or documentation
- [ ] Build succeeds locally
- [ ] GitHub repository created as **Private**
- [ ] Remote added correctly
- [ ] Ready to push

## After Pushing

1. **Connect to Vercel**:
   - Go to Vercel Dashboard
   - Import from GitHub
   - Select your repository

2. **Set Environment Variables in Vercel**:
   - Add all required variables
   - Mark as Production, Preview, Development

3. **Deploy**:
   - Vercel will auto-deploy on push to main
   - Or manually deploy from dashboard
