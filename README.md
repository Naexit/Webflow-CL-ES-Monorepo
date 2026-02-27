# Webflow-CL-ES-Monorepo

We ship Webflow front‑end updates by keeping our JS/CSS in a single repo and deploying with one repeatable flow: commit + push, move a stable `<project>-prod` tag, output a deterministic jsDelivr embed URL, and (when needed) purge CDN caches. The result is a stable script link per project, faster iteration, and easy rollbacks with a clear audit trail. jsDelivr is a public CDN for open‑source files, so this setup works best with public repos—don’t store secrets or sensitive client data in your repository.

## Deployment helper scripts

Two small helper scripts are provided to simplify the workflow of committing,
creating a stable ``*-prod`` tag, and generating the Webflow script link.  They
also optionally purge the jsDelivr cache so your changes are available
immediately.

### PowerShell (Windows)

The preferred entrypoint on Windows is ``tools/deploy.ps1``.  Example usage:

```powershell
# from repo root
.\tools\deploy.ps1 -Project clpr-x -Message "clpr-x: update navbar logic" -Purge -Copy

// examples:
// Deploy a single file (default path if none specified):
.\tools\deploy.ps1 -Project clpr-x -Message "clpr-x: update navbar logic" -Purge -Copy

// Deploy every `.js`/`.css` file found under the project directory
// (client-projects/<project> or projects/<project>); no -Paths argument needed:
.\tools\deploy.ps1 -Project clpr-isab.nu -Message "pulling in Slater migration" -Purge -Copy

// or explicitly list individual files when you only want a subset:
.\tools\deploy.ps1 -Project clpr-isab.nu -Message "pulling in Slater migration" \
    -Paths "client-projects/clpr-isab.nu/index.js","client-projects/clpr-isab.nu/styling.css" \
    -Purge -Copy
```

The script will:

1. stage all changes, commit with the given message and push to ``origin``
2. move the ``<project>-prod`` tag to the new HEAD and push that tag
3. print the stable Webflow `<script>` tag for the jsDelivr URL
4. optionally copy the script tag to the clipboard (`-Copy`)
5. optionally hit the jsDelivr purge endpoint to invalidate caches (`-Purge`)

Arguments that are not provided will be defaulted as follows:

* ``-Tag`` defaults to ``<project>-prod``
* ``-Paths`` defaults to ``projects/<project>/site.js`` (a single-element array).

You may supply multiple paths as a comma-separated list or by repeating the
``-Paths`` parameter; PowerShell also allows the shorthand ``-Path`` via
partial parameter name matching if you prefer.  The script will generate a
`<script>` tag for each non-`.css` file and a `<link>` tag for stylesheets,
purge each URL individually, and copy all tags to the clipboard.

### Bash (macOS/Linux/Git Bash)

For cross-platform environments the companion script
``tools/deploy.sh`` is available.  Make sure it is executable:

```sh
chmod +x tools/deploy.sh
```

Usage pattern is similar to the PowerShell version:

```sh
./tools/deploy.sh clpr-x "clpr-x: update navbar logic" clpr-x-prod projects/clpr-x/site.js true
```

The arguments behave identically, with the final boolean controlling whether
purging is performed.

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
    -Project clpr-x -Message "auto deploy from hook" -Purge -Copy
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

> **Note:** moving a tag like ``*-prod`` creates an aliased URL.  jsDelivr
> caches those aggressively, so purging is strongly recommended when you
> re‑deploy.  The ``-Purge``/``true`` flags trigger this automatically.

---

Feel free to modify the scripts or adjust the defaults to suit your project
layout.
