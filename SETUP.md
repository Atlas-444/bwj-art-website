# Setting up your password-protected editor

Your site's code is now saved as a git repository in this folder, and it includes an `/admin` page that lets you edit portfolio pieces, images, the About bio, timeline, Home page text, and Contact info — all from a normal web page, no coding required.

To make that page actually work and live on the internet, follow these steps once. It takes about 10–15 minutes and everything is free.

## 1. Push the code to GitHub

The site folder already has a git repository with one commit in it. Before pushing, there are two leftover lock files that need clearing first (harmless — just an artifact of how this was set up), then commit anything added since (like this file) and push.

Open Terminal and run:

```bash
cd "/path/to/Art website"
rm -f .git/index.lock .git/HEAD.lock
git add -A
git commit -m "Add setup guide"
git remote add origin https://github.com/<your-username>/bwj-art-website.git
git branch -M main
git push -u origin main
```

Before the push will work, create an empty repository on GitHub first:
1. Go to [github.com/new](https://github.com/new)
2. Name it something like `bwj-art-website`
3. Leave it **empty** (don't check "Add a README") — otherwise the push will conflict
4. Click "Create repository", then copy the URL it gives you into the `git remote add origin` command above

> If a future `git add` or `git commit` ever complains about `index.lock` already existing, just delete `.git/index.lock` (and `.git/HEAD.lock` if present) from Finder (Cmd+Shift+. to show hidden files) or Terminal (`rm .git/index.lock`) and try again.

## 2. Connect the repo to Netlify (free hosting)

1. Go to [app.netlify.com](https://app.netlify.com) and sign up / log in (you can use your GitHub account to sign in)
2. Click **Add new site → Import an existing project**
3. Choose **GitHub**, authorize Netlify, and pick the `bwj-art-website` repo
4. Build settings: leave the build command blank and set the publish directory to `.` (this is already configured in `netlify.toml`)
5. Click **Deploy site** — your site goes live at a random address like `https://random-name-123.netlify.app`

Optional: rename that to something nicer under **Site settings → General → Site details → Change site name**.

## 3. Turn on Identity (this is your password login)

1. In your new site's dashboard, go to **Site settings → Identity**
2. Click **Enable Identity**
3. Under **Registration preferences**, choose **Invite only** (so no stranger can sign themselves up)

## 4. Turn on Git Gateway (lets the editor save changes)

1. Still under Identity, scroll to **Services → Git Gateway**
2. Click **Enable Git Gateway**

## 5. Invite yourself as the editor

1. Go to the **Identity** tab (top-level, not settings) and click **Invite users**
2. Enter your own email address and send the invite
3. Check your email — you'll get a link from Netlify. Click it, and you'll be taken to a page where **you set your own password**. This password is real, hosted authentication (not something baked into the code), so it's yours to keep private.

## 6. Log in and start editing

Visit `https://<your-site-name>.netlify.app/admin` and log in with the email + password you just set. You'll see tabs for Portfolio, About Page, Home Page, Contact Page, and Site-Wide — edit any field, upload or swap images, and click **Publish** to save. Netlify commits the change to GitHub automatically and your live site updates within a minute or two.

---

### Notes

- Every future edit through `/admin` is saved as a real commit to your GitHub repo — nothing is ever silently lost, and you can see the full history on GitHub if needed.
- If you ever want to add another portfolio piece, use **Portfolio → Portfolio Pieces → Items → Add item**. Give each new piece a unique `id` (lowercase, no spaces, e.g. `new-piece-name`) so the Home page's "Featured Work" list can reference it if you want.
- To feature a piece on the Home page, add its `id` to **Home Page → Featured Work** (in the same order you want them to appear).
