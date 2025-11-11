# GitHub Pages Deployment Guide

This guide explains how to deploy the n8n Phone Analytics Dashboard to GitHub Pages.

## ✅ Fixed Issues

The following issues have been resolved:

1. **Fixed package.json scripts** - Changed from `react-scripts` (Create React App) to Vite commands
2. **Added base path configuration** - Set `/n8nBOT/` in `vite.config.ts` for GitHub Pages
3. **Updated React Router** - Added `basename` prop to work with GitHub Pages subdirectory
4. **Created GitHub Actions workflow** - Automated deployment on push to main/master
5. **Added .nojekyll file** - Prevents GitHub Pages from processing files with Jekyll
6. **Fixed TypeScript errors** - Added proper type definitions and excluded test files from build
7. **Fixed build output directory** - Changed from `build` to `dist` (Vite default)

## 🚀 Deployment Methods

### Method 1: GitHub Actions (Recommended - Automated)

The project includes a GitHub Actions workflow that automatically deploys on push to `main` or `master` branch.

**Steps:**
1. Push your code to GitHub
2. Go to your repository Settings → Pages
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically run on every push to main/master
5. Your site will be available at: `https://skygok.github.io/n8nBOT/`

**Workflow file:** `.github/workflows/deploy.yml`

### Method 2: Manual Deployment with gh-pages

If you prefer manual deployment:

```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

This will:
1. Build the project to `dist/` directory
2. Deploy the `dist/` folder to the `gh-pages` branch
3. Make it available at `https://skygok.github.io/n8nBOT/`

## 📝 Important Configuration

### Base Path
The base path is set to `/n8nBOT/` in:
- `vite.config.ts` - `base: '/n8nBOT/'`
- `package.json` - `"homepage": "https://skygok.github.io/n8nBOT"`

If your repository name is different, update both files accordingly.

### React Router
The router is configured to use the base path automatically via `import.meta.env.BASE_URL`.

## 🔧 Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify Vite config: `npm run build`

### 404 Errors on Routes
- Ensure `base` path in `vite.config.ts` matches your repository name
- Verify React Router `basename` is set correctly
- Check that `.nojekyll` file exists in `public/` directory

### Assets Not Loading
- Verify base path is correct in `vite.config.ts`
- Check browser console for 404 errors
- Ensure all assets are in the `dist/` folder after build

### GitHub Actions Not Running
- Check repository Settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is enabled
- Verify workflow file is in `.github/workflows/` directory
- Check Actions tab for workflow run status

## 📦 Build Output

After running `npm run build`, the output will be in the `dist/` directory:
- `dist/index.html` - Main HTML file
- `dist/assets/` - CSS and JavaScript bundles

## 🌐 Live URL

Once deployed, your dashboard will be available at:
**https://skygok.github.io/n8nBOT/**

## 🔄 Updating the Site

Simply push changes to the `main` or `master` branch, and GitHub Actions will automatically rebuild and redeploy the site.

## 📚 Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [React Router Deployment](https://reactrouter.com/en/main/start/overview#deploying)

