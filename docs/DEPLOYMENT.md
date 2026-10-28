# Deploy LeetTrack for RVCE

Recommended setup: **one Render Node web service + MongoDB Atlas + Google OAuth**. The Express app serves both the frontend and API, so they share a domain and cookie session. No separate frontend host, Redis, or LeetCode API key is needed for this implementation.

## Connections

| Service | What it does | What you configure |
|---|---|---|
| GitHub/GitLab/Bitbucket | Holds source and triggers deployments | Push this project and connect that repository to Render |
| Render Web Service | Runs Express, serves the frontend, and performs scheduled sync | Build/start commands, HTTPS origin and environment variables |
| MongoDB Atlas | Stores accounts, sessions, statistics, snapshots and groups | Database user, private connection string, and network access list |
| Google Cloud OAuth | Optional Google sign-in; verifies ownership of the RVCE email | Web OAuth client ID/secret, consent configuration and callback URI |
| LeetCode | Public profile statistics | User's required LeetCode username; outbound HTTPS |
| Domain provider | Optional custom address | Connect your domain in Render and then update APP_URL / Google callback |

## 1. Publish the source repository

The source repository is [k-karthik-pai/LeetTrack](https://github.com/k-karthik-pai/LeetTrack). Deploy its `REACT-PORT` branch. Only the **application folder** belongs in this repository; the outer Codex workspace contains local setup tools.

Never upload `.env`, `.data/`, `node_modules/`, or database binaries. Keep the upstream attribution in the repository.

## 2. Configure MongoDB Atlas

1. Create an Atlas cluster and database user with read/write access to the `leettrack` database.
2. Copy its driver connection string and include `/leettrack` before query parameters. URL-encode special characters in the database password.
3. Add Render's documented outbound IP ranges for the service region to the Atlas project's IP access list. The service's **Connect → Outbound** panel lists these ranges. Do not rely on a laptop-only IP entry for the hosted app.
4. Store the URI as `MONGODB_URI` in Render's environment configuration, not in Git.

Atlas offers a free 512 MB cluster for getting started. Select an appropriate database plan and backup policy as the project grows. [Atlas pricing](https://www.mongodb.com/pricing), [Atlas access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/), [Render outbound IPs](https://render.com/docs/outbound-ip-addresses).

## 3. Create a Render Web Service

Choose **New → Web Service**, connect the repository, and use:

| Setting | Value |
|---|---|
| Language | Node |
| Branch | `REACT-PORT` |
| Root directory | Blank when this application is the repository root |
| Build command | `npm ci --include=dev --ignore-scripts && npm run build` |
| Start command | `npm start` |
| Health check | `/api/health` |
| Region | Near your Atlas cluster and users |
| Instances | One for the current built-in scheduler |

Use an always-on paid web-service instance for normal usage and scheduled synchronization. Render Free sleeps after 15 idle minutes, so the app's hourly timer cannot run while it sleeps. Pricing and available compute plans are shown before creation. No paid service is created by the local source package. [Express deployment](https://render.com/docs/deploy-node-express-app), [free-service limits](https://render.com/docs/free), [pricing](https://render.com/pricing).

`--ignore-scripts` skips the unnecessary development MongoDB binary download. Production uses Atlas and does not start an embedded MongoDB.

## 4. Set production environment variables

Use `.env.production.example` as the field list. Set these in Render:

```text
NODE_ENV=production
HOST=0.0.0.0
MONGODB_URI=<your private Atlas connection string>
SESSION_SECRET=<a long random private secret>
COLLEGE_NAME=RV College of Engineering
COLLEGE_EMAIL_DOMAIN=rvce.edu.in
SYNC_INTERVAL_MINUTES=60
SYNC_COOLDOWN_SECONDS=300
MONGOMS_DISABLE_POSTINSTALL=1
```

Render supplies `PORT` and `RENDER_EXTERNAL_URL`; the server reads them automatically. Set `APP_URL` only to override the origin, for example when using a custom domain. It must be the exact HTTPS origin, without a trailing slash. Production cookies require HTTPS and the server trusts one reverse proxy. Keep `SESSION_SECRET` stable across deployments so existing sessions remain valid.

The college-email restriction applies to signup and Google login. All local parts at `rvce.edu.in` are accepted; it does not force a single branch/batch such as `.cs25`. Password signup validates the domain format but does not prove email ownership. Use verified Google sign-in for identity assurance, or add an email-verification provider before treating password registrations as verified college identities. College administrator verification remains separate.

## 5. Connect Google sign-in

1. In Google Cloud, configure the OAuth consent screen for your intended users.
2. Create a **Web application** OAuth client.
3. Register the authorized redirect URI exactly:

```text
https://YOUR-ACTUAL-SERVICE.onrender.com/api/auth/google/callback
```

4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as Render secrets and redeploy.
5. Complete Google's testing/publishing requirements for the audience that will use it. In testing mode, add the intended test users as required by Google.

Google login verifies the returned email; LeetTrack additionally requires the `rvce.edu.in` domain. A first-time Google user must enter a LeetCode username before accessing the dashboard or group APIs. LeetTrack never asks for the user's Google or LeetCode password. [Google OpenID setup](https://developers.google.com/identity/openid-connect/openid-connect), [production OAuth policies](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance).

## 6. Administrator and launch checks

Register the actual administrator account, including its LeetCode username. With `MONGODB_URI` pointing to the same Atlas database, run:

```text
npm run admin -- YOUR-RVCE-EMAIL
```

Run this from a trusted local environment or the service shell where available. No public administrator-promotion endpoint exists. Do not put the database URI in command arguments or commit it.

Before sharing the URL, check this flow against the hosted service:

1. `/api/health` returns HTTP 200 with MongoDB available.
2. Signup rejects a missing LeetCode username and a non-RVCE email.
3. A valid signup loads real LeetCode difficulty counts, calendar, contests and accepted submissions.
4. Logout blocks protected pages; a later login restores the same persisted profile.
5. Google login returns to the correct HTTPS origin and requires linking for a new account.
6. Two actual accounts can create/join a private group; a non-member cannot access it.
7. Manual sync works from the hosted server. Upstream LeetCode availability can differ from the laptop, so local success alone does not verify hosted syncing.

The `render.yaml` at the repository root describes a free Node web service in Singapore and prompts for the Atlas URI. The Atlas project `LeetTrack` and free AWS Singapore cluster `leettrack` have been created. Database-user credentials and Render service configuration are still required before the app is live. Google OAuth remains optional and requires a separate Google Cloud client.

## 7. Keeping the free service awake

Render's free web services sleep after about 15 minutes without traffic. While asleep, the hourly LeetCode sync, daily snapshots and the two-minute contest checker do not run; the first visit wakes the service (this takes up to a minute) and catches up. To keep it awake, create a free monitor on [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) that requests `https://YOUR-SERVICE.onrender.com/api/health` every 10 minutes. This matters most during contests and for building daily progress history.

## 8. When a push does not deploy

`render.yaml` sets `branch: REACT-PORT` and `autoDeployTrigger: commit`, but the Render dashboard decides what actually happens:

1. **Manual Deploy → Deploy latest commit** updates the site immediately and shows whether the build succeeds.
2. **Events:** “Deploy failed” entries mean pushes are detected but the build or health check fails; open that deploy's log.
3. **Settings → Build & Deploy:** the repository must be the one you push to, branch `REACT-PORT`, and Auto-Deploy *On Commit*. Dashboard settings override `render.yaml` unless the service was created from the Blueprint.
4. **GitHub access:** Render's GitHub app must be installed with access to the repository (GitHub → Settings → Applications → Render). Without it, Render never sees new commits.
