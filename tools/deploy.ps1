param(
  [Parameter(Mandatory=$true)]
  [string]$Project,

  [Parameter(Mandatory=$true)]
  [string]$Message,

  # Defaults: "<project>-prod"
  [string]$Tag = "",

  # Defaults: "projects/<project>/site.js"; can provide multiple paths separated by commas
  [string[]]$Paths = @(),

  # If set, the script will call the purge URL (recommended for fast updates)
  [switch]$Purge,

  # Copies script tag to clipboard
  [switch]$Copy
)

$ErrorActionPreference = "Stop"

if ($Tag -eq "") { $Tag = "$Project-prod" }
# if no paths were supplied, attempt to auto-discover files
if ($Paths.Count -eq 0) {
  # look for a directory matching the project name under client-projects or projects
  $candidates = @("client-projects/$Project", "projects/$Project")
  foreach ($dir in $candidates) {
    if (Test-Path $dir -PathType Container) {
      # find all js/css files within that directory (non-recursive)
      $found = Get-ChildItem -Path $dir -Include *.js,*.css -File -Recurse |
           ForEach-Object { $_.FullName }
      if ($found) {
        $Paths = $found
        break
      }
    }
  }
}

# fallback default if still empty
if ($Paths.Count -eq 0) {
  $Paths = @("projects/$Project/site.js")
}

# ensure the list is flattened and trimmed
$Paths = $Paths | ForEach-Object { $_ }

# convert any absolute paths to repository-relative paths; jsDelivr expects
# a path inside the repo, not a local filesystem path.
# "git rev-parse" may include a trailing newline; trim it with Trim() which
# handles both `r and `n correctly.
$repoRoot = (git rev-parse --show-toplevel).Trim()
$Paths = $Paths | ForEach-Object {
  $p = $_
  if ([System.IO.Path]::IsPathRooted($p)) {
    # make relative to repo root
    $relative = Resolve-Path -Path $p -Relative -ErrorAction SilentlyContinue
    if (!$relative) {
      # fallback: strip repoRoot prefix manually
      $relative = $p -replace [regex]::Escape($repoRoot + '\\?'), ''
    }
    $p = $relative
  }
  # normalize to forward slashes for CDN URL
  $p -replace '\\', '/'
}

# 1) Get origin remote (OWNER/REPO)
$remote = (git remote get-url origin).Trim()

# Supports:
# https://github.com/OWNER/REPO.git
# git@github.com:OWNER/REPO.git
$ownerRepo = $null
if ($remote -match "github\.com[:/](?<owner>[^/]+?)/(?<repo>[^/]+?)(\.git)?$") {
  $ownerRepo = "$($Matches['owner'])/$($Matches['repo'])"
} else {
  throw "Could not parse OWNER/REPO from remote: $remote"
}

# 2) Stage + commit + push (suppress output for clarity)
git add . 2>&1 | Out-Null
git commit -m $Message 2>&1 | Out-Null
git push 2>&1 | Out-Null

# 3) Move the prod tag to current commit and push it (suppress output)
git tag -f $Tag 2>&1 | Out-Null
git push -f origin $Tag 2>&1 | Out-Null

## 4) Build jsDelivr URLs + tags (deterministic format)
$results = @()
foreach ($p in $Paths) {
  $cdnUrl = "https://cdn.jsdelivr.net/gh/$ownerRepo@$Tag/$p"
  if ($p -like "*.css") {
    $htmlTag = "<link rel=`"stylesheet`" href=`"$cdnUrl`">"
  } else {
    $htmlTag = "<script src=`"$cdnUrl`"></script>"
  }
  $results += [pscustomobject]@{Path=$p;Url=$cdnUrl;Tag=$htmlTag}
}

# 5) Purge (optional but recommended for moving tags)
if ($Purge) {
  foreach ($r in $results) {
      $purgeUrl = "https://purge.jsdelivr.net/gh/$ownerRepo@$Tag/$($r.Path)"
      Invoke-WebRequest -UseBasicParsing $purgeUrl -ErrorAction SilentlyContinue | Out-Null
  }
}

# Copy to clipboard
if ($Copy) {
  ($results | ForEach-Object { $_.Tag }) -join "`n" | Set-Clipboard
}

# Print summary (quiet output, then tags at the end for visibility)
Write-Host ""
Write-Host "[DEPLOY COMPLETE]" -ForegroundColor Green
if ($Purge) {
  Write-Host "[PURGE] Cache invalidated" -ForegroundColor Green
}
if ($Copy) {
  Write-Host "[COPY] Tags copied to clipboard" -ForegroundColor Green
}
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Webflow Tags (Ready to Paste):" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
foreach ($r in $results) {
  Write-Host $r.Tag -ForegroundColor Yellow
}
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""