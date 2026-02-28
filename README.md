# Webflow-CL-ES-Monorepo

We ship Webflow front‑end updates by keeping our JS/CSS in a single repo and deploying with one repeatable flow: commit + push, then paste the auto-generated jsDelivr URL into Webflow. The default is **always-fresh content** (commit-based URLs that change on every deploy), with faster iteration and easy rollbacks with a clear audit trail. If you need a stable embedding URL, you can use the tag-based approach at the cost of accepting CDN cache delays. jsDelivr is a public CDN for open‑source files, so this setup works best with public repos—don't store secrets or sensitive client data in your repository.

## Deployment helper scripts

Two small helper scripts are provided to simplify the workflow of committing,
creating a stable ``*-prod`` tag, and generating the Webflow script link.  They
also optionally purge the jsDelivr cache so your changes are available
immediately.

### PowerShell (Windows)

The preferred entrypoint on Windows is ``tools/deploy.ps1``.  Example usage:

```powershell
# from repo root
.\tools\deploy.ps1 -Project clpr-x -Message "clpr-x: update navbar logic" -Copy

// examples:
// Deploy a single file (default path if none specified):
.\tools\deploy.ps1 -Project clpr-x -Message "clpr-x: update navbar logic" -Copy

// Deploy every `.js`/`.css` file found under the project directory
// (client-projects/<project> or projects/<project>); no -Paths argument needed:
.\tools\deploy.ps1 -Project clpr-isab.nu -Message "pulling in Slater migration" -Copy

// or explicitly list individual files when you only want a subset:
.\tools\deploy.ps1 -Project clpr-isab.nu -Message "pulling in Slater migration" \
    -Paths "client-projects/clpr-isab.nu/index.js","client-projects/clpr-isab.nu/styling.css" \
    -Copy
```

The script will:

1. stage all changes, commit with the given message and push to ``origin``
2. generate a jsDelivr URL based on the current commit SHA (always pointing to the latest code)
3. print the `<script>` and `<link>` tags ready to paste into Webflow
4. optionally copy the script tags to the clipboard (`-Copy`)

Because each deploy produces a unique commit SHA, the URL changes on every deployment. This ensures Webflow always loads the latest code without any CDN cache staleness—**no purging required**. Simply paste the new URL from the terminal output into Webflow after each deploy.

Arguments that are not provided will be defaulted as follows:

* ``-Tag`` defaults to ``<project>-prod`` (used if you switch to tag-based deployment)
* ``-Paths`` defaults to ``projects/<project>/site.js`` (a single-element array).

You may supply multiple paths as a comma-separated list or by repeating the
``-Paths`` parameter; PowerShell also allows the shorthand ``-Path`` via
partial parameter name matching if you prefer.  The script will generate a
`<script>` tag for each non-`.css` file and a `<link>` tag for stylesheets.
Copy the generated tags to the clipboard with the ``-Copy`` flag.

### Bash (macOS/Linux/Git Bash)

For cross-platform environments the companion script
``tools/deploy.sh`` is available.  Make sure it is executable:

```sh
chmod +x tools/deploy.sh
```

Usage pattern is similar to the PowerShell version:

```sh
./tools/deploy.sh clpr-x "clpr-x: update navbar logic"
```

The arguments behave identically to PowerShell: project name and commit message are required; tag and paths are optional with sensible defaults.

### Optional Git hook

Because you and your colleague strictly use Windows, the examples below focus
on PowerShell.  The same idea works on other platforms; a Bash sample is also
included for reference.

If you prefer to trigger the helper automatically whenever you push to a
specific branch (for example ``main``), you can install a ``post-push`` hook.
Create a file at ``.git/hooks/post-push`` and make it executable (or simply
symlink one of the templates shipped under ``.githooks``):

```sh
#!/usr/bin/env bash
# run deploy only when DEPLOY=1 is set in the environment and we're
# pushing the main branch.

branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$branch" == "main" && "$DEPLOY" == "1" ]]; then
  # adjust paths/arguments as needed, this example assumes PowerShell on
  # Windows; for Bash call ../tools/deploy.sh instead
  pwsh -File "$(git rev-parse --show-toplevel)/tools/deploy.ps1" \
    -Project clpr-x -Message "auto deploy from hook" -Copy
fi
```

Hooks are not committed to the repository by default; you may store a template
in ``.githooks`` and symlink it if your team shares the pattern.  This repo
provides two templates:

* ``.githooks/post-push`` – a Bash version showing the environment-variable
  guard (useful if you ever run Git Bash).
* ``.githooks/post-push.ps1`` – a PowerShell version that is the natural fit
  for your Windows workflow.

To activate the PowerShell hook locally, run:

```powershell
New-Item -ItemType SymbolicLink -Path .git\hooks\post-push -Target ..\..\.githooks\post-push.ps1
icacls .git\hooks\post-push /grant Everyone:RX # ensure executable
```

or simply configure Git to use the custom hooks directory:

```powershell
git config core.hooksPath .githooks
```

The filename extension matters: PowerShell will execute ``.ps1`` scripts by
default when the hook is invoked with `pwsh`.

Alternatively you can configure Git to use a custom hooks directory globally:

```sh
git config core.hooksPath .githooks
```

The repository already contains a sample script at ``.githooks/post-push``.

> **Note on stable vs. fresh URLs:**  
> By default, the script uses **commit-based URLs** that change on every deploy.  
> This ensures Webflow always loads the latest code immediately (no cache staleness).  
> 
> If you instead want a **stable embedding URL that never changes**, you can modify the script to use the ``<project>-prod`` tag.  
> This provides a single unchanging link but requires you to accept CDN caching delays (jsDelivr caches tag-based URLs for up to 1 year with `immutable` headers).  
> You would need to manually purge or wait for the cache to expire before changes take effect.  
> **Trade-off:** stable URL = slower updates; dynamic URL = no copy/paste hassle.

---

Feel free to modify the scripts or adjust the defaults to suit your project
layout.
