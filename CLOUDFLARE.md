# Running behind Cloudflare Tunnel

If **buttons or forms don’t work** when using the app through your Cloudflare Tunnel (e.g. `maisonnam.fonneygroup.com`), try the following.

## 1. Turn off Rocket Loader (most common fix)

Cloudflare **Rocket Loader** defers JavaScript and can break React, so clicks and form submits stop working.

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Select the domain (e.g. `fonneygroup.com`).
3. Go to **Speed** → **Optimization**.
4. Under **Content Optimization**, **disable “Rocket Loader”**.

Save and test your buttons/forms again.

## 2. Ease off aggressive caching

If the dashboard still caches HTML or API too much:

1. **Rules** → **Page Rules** (or **Cache Rules** in the new dashboard).
2. Add a rule for `*maisonnam.fonneygroup.com/*` (or your hostname).
3. Set **Cache Level** to **Bypass** (or **Standard** with a short TTL).

This avoids stale HTML/JS and odd behaviour after deployments.

## 3. Check the browser console

Open DevTools (**F12**) → **Console**. If you see:

- **Failed to load script** or **404** for `/_next/static/...`  
  → Caching or incorrect asset URLs; bypass cache for this host (step 2).

- **CORS** or **blocked by CORS**  
  → Unusual for same-origin; if it appears, we can add CORS headers.

- **Uncaught (in promise)** or **Hydration** errors  
  → Often related to Rocket Loader or cached HTML; steps 1 and 2 usually fix it.

## 4. What this app already does

- **API routes** send `Cache-Control: no-store` so Cloudflare is less likely to cache API responses.
- All **fetch** calls use relative URLs (e.g. `/api/admin/categories`), so they work behind the tunnel.

After disabling Rocket Loader and adjusting cache, redeploy/restart the app and test again.
