# Enhanced CI/CD Pipeline Documentation

## 📋 Overview

This enhanced GitHub Actions workflow provides comprehensive CI/CD automation for both your **frontend** (Next.js) and **orchestrator** (Node.js/Express API) applications.

**Key Improvements:**
- ✅ Separate testing pipelines for frontend and orchestrator
- ✅ Database and Redis services for orchestrator testing
- ✅ Dependency caching for faster builds
- ✅ Code coverage reporting
- ✅ Better error handling and reporting
- ✅ Automated deployment to GitHub Pages
- ✅ Pipeline status summary

---

## 🔄 Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│  On: Push to main/develop OR Pull Request                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌────────────────────┴────────────────────┐
        ↓                                          ↓
   ┌─────────────┐                        ┌──────────────┐
   │ Frontend    │                        │ Orchestrator │
   │ Tests       │                        │ Tests        │
   └─────────────┘                        └──────────────┘
        ↓                                          ↓
   ┌─────────────┐                        ┌──────────────┐
   │ Linting &   │                        │ Build        │
   │ Code Quality│                        │ Orchestrator │
   └─────────────┘                        └──────────────┘
        ↓                                          
   ┌─────────────┐                        
   │ Build       │                        
   │ Frontend    │                        
   └─────────────┘                        
        ↓
   ┌─────────────────────────────────┐
   │ Deploy to GitHub Pages (main)   │
   └─────────────────────────────────┘
        ↓
   ┌─────────────────────────────────┐
   │ Status Check & Summary          │
   └─────────────────────────────────┘
```

---

## 🔧 Jobs Explained

### **1. Frontend Tests** 🧪
**What:** Runs all frontend unit tests in `/frontend`
- Installs dependencies with pnpm
- Runs `pnpm test` (Vitest tests)
- Generates coverage reports
- Uploads coverage artifacts

**When it runs:**
- Every push to main/develop
- Every pull request

**Fail behavior:** ❌ Stops the pipeline if tests fail

---

### **2. Orchestrator Tests** 🧪
**What:** Runs all orchestrator/API tests in `/orchestrator`
- Starts PostgreSQL service (port 5432)
- Starts Redis service (port 6379)
- Waits for database to be ready
- Initializes test database with migrations
- Runs `pnpm test` (Vitest tests)
- Generates coverage reports
- Uploads coverage artifacts

**Environment variables set:**
```
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/quirk_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key-do-not-use-in-production
```

**When it runs:**
- Every push to main/develop
- Every pull request

**Fail behavior:** ❌ Stops the pipeline if tests fail

---

### **3. Linting & Code Quality** 🔍
**What:** Checks code formatting and quality
- Runs `pnpm lint` for both frontend and orchestrator
- Checks code formatting with Prettier
- Non-blocking (continues even if it fails)

**When it runs:**
- Every push/PR

**Fail behavior:** ⚠️ Doesn't stop the pipeline (informational only)

---

### **4. Build Frontend** 🏗️
**What:** Builds the Next.js frontend as static export
- Depends on: Frontend tests passing
- Clears Next.js cache
- Runs `pnpm run build:pages`
- Uploads to GitHub Pages artifact

**When it runs:**
- Only if frontend tests pass
- Every push/PR

**Fail behavior:** ❌ Stops deployment if build fails

---

### **5. Build Orchestrator** 🏗️
**What:** Compiles TypeScript orchestrator
- Depends on: Orchestrator tests passing
- Runs `pnpm build` (TypeScript compilation)
- Uploads dist artifact

**When it runs:**
- Only if orchestrator tests pass
- Every push/PR

**Fail behavior:** ❌ Stops deployment if build fails

---

### **6. Deploy Frontend** 🚀
**What:** Deploys frontend to GitHub Pages
- Depends on: Build Frontend succeeding
- Only runs on: `main` branch, push events
- Uses: GitHub's built-in Pages deployment

**When it runs:**
- Only when pushing to main (not on PRs)
- Only if all tests and build pass

**Result:** Your frontend is live at GitHub Pages URL

---

### **7. Status Check** ✅
**What:** Generates final pipeline summary
- Shows pass/fail status for all tests
- Creates a visual summary in GitHub
- Final gate to confirm everything passed

**When it runs:**
- After all tests complete
- Every push/PR

---

## 🚀 How to Set It Up

### **Step 1: Replace Your Workflow File**

```bash
# Copy the new workflow
cp /mnt/user-data/outputs/pages.yml .github/workflows/pages.yml

# Or manually update:
# - Replace .github/workflows/pages.yml with the new one
```

### **Step 2: Configure Secrets (Optional)**

If you want to use a custom API base URL:

1. Go to: **GitHub Repo → Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add: `NEXT_PUBLIC_API_BASE` = `https://your-api-url.com`

(Default is `http://localhost:3000`)

### **Step 3: Commit and Push**

```bash
git add .github/workflows/pages.yml
git commit -m "chore: Enhance CI/CD pipeline with separate test jobs"
git push origin main
```

### **Step 4: Watch It Run**

1. Go to: **GitHub → Actions tab**
2. Watch your workflow run in real-time
3. Click on any job to see logs

---

## 📊 Monitoring Your Pipeline

### **View Pipeline Status**
- **GitHub Actions tab:** https://github.com/yourusername/quirk-trade-tool/actions
- **Latest run:** Shows all jobs and their status
- **Logs:** Click any job to see detailed logs

### **Coverage Reports**
After tests pass, coverage reports are available as artifacts:
- **Frontend coverage:** `frontend-coverage/`
- **Orchestrator coverage:** `orchestrator-coverage/`

Download them from the workflow run details.

### **Test Results**
Check the job summary for:
- ✅ Passed tests count
- ❌ Failed tests (with error details)
- 📊 Coverage percentages

---

## 🔔 Pull Request Checks

When you create a PR, GitHub will:
1. ✅ Run all tests
2. ✅ Show pass/fail status on the PR
3. ✅ Block merging if tests fail
4. ✅ Allow merging only if tests pass

---

## 📝 Environment Variables

### **Available in All Jobs**
```
NODE_VERSION=20
PNPM_VERSION=9.15.0
```

### **Orchestrator Test Job Specific**
```
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/quirk_test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quirk_test
DB_USER=test_user
DB_PASSWORD=test_password
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key-do-not-use-in-production
LOG_LEVEL=error
```

---

## 🐛 Troubleshooting

### **Tests fail but work locally**
- Check Node version matches (Node 20)
- Check pnpm version matches (9.15.0)
- Check environment variables are set correctly in setup.ts

### **Database connection timeout**
- The workflow waits 30 seconds for PostgreSQL to start
- If it's still timing out, the DB service might be misconfigured
- Check the job logs for "Waiting for database..." messages

### **Build fails but tests pass**
- This usually means a compilation error in source code
- Check the build logs for TypeScript errors
- Fix the error and push again

### **Deployment doesn't happen**
- Check: Are you pushing to `main` branch?
- Check: Did all tests pass?
- Check: Is it a push event (not a PR)?

---

## 📈 Performance Tips

### **What's Cached**
- Node modules (pnpm packages)
- Dependency lock files
- Build artifacts

### **Speed Up Runs**
1. **Use pnpm:** Already configured (faster than npm)
2. **Keep dependencies up to date:** Reduces install time
3. **Fix test failures quickly:** Don't merge broken code

---

## 🔐 Security

### **Safe by Default**
- Tests run in isolated GitHub-hosted runners
- Database and Redis only accessible within job
- No secrets exposed in logs
- Test environment variables are isolated from production

### **Secrets Management**
- Production secrets stored in GitHub secrets (not in code)
- Test secrets hardcoded (it's a test environment, safe to do)
- Never commit `.env` files

---

## 📚 Files Changed

This requires updating:

```
.github/workflows/pages.yml  ← Replace this file
```

That's it! Everything else stays the same.

---

## ✅ Quick Checklist

- [ ] Download the new `pages.yml` from outputs
- [ ] Replace `.github/workflows/pages.yml`
- [ ] Commit: `git add .github/workflows/pages.yml`
- [ ] Push: `git push origin main`
- [ ] Go to GitHub Actions and watch it run
- [ ] All jobs should show ✅ green

---

## 🎯 Next Steps

1. **Implement this workflow** ← Do this first
2. **Watch your first run** (go to Actions tab)
3. **Fix any issues** that come up
4. **Configure secrets** if needed (NEXT_PUBLIC_API_BASE, etc.)
5. **Set branch protection rules** (require tests to pass before merge)

---

## 📞 Questions?

Check the job logs if something fails:
1. Click the failing job
2. Expand the step that failed
3. Read the error message
4. Fix and push again

The workflow will automatically re-run!
