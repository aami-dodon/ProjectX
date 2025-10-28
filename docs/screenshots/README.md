# Frontend Screenshot Capture

This folder documents the workflow used to capture the `/health` page screenshot for review. It does not store artifacts directly so that large binary files remain outside the repository history.

## Regenerating the `/health` Screenshot

1. From the project root, start the Vite dev server:
   ```bash
   cd client
   npm run dev -- --host 0.0.0.0 --port 4173
   ```
2. In a separate terminal, install the Playwright CLI (if it is not already available):
   ```bash
   cd client
   npx playwright install chromium
   ```
3. Generate the screenshot with a stable viewport and save it next to this guide:
   ```bash
   cd client
   npx playwright screenshot http://127.0.0.1:4173/health ../docs/screenshots/health-page.png --viewport-size=1280,720
   ```

The resulting `health-page.png` file can be attached to pull requests or manually inspected before uploading. Delete the file afterwards if you do not intend to commit the binary asset.
