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

# 2) Stage + commit + push
git add .
git commit -m $Message
git push

# 3) Move the prod tag to current commit and push it (stable URL stays the same)
git tag -f $Tag
git push -f origin $Tag

## 4) Build jsDelivr URLs + tags (deterministic format)
$results = @()
foreach ($p in $Paths) {
  $cdnUrl = "https://cdn.jsdelivr.net/gh/$ownerRepo@$Tag/$p"
  if ($p -like "*.css") {
    $tag = "<link rel=`"stylesheet`" href=`"$cdnUrl`">"
  } else {
    $tag = "<script src=`"$cdnUrl`"></script>"
  }
  $results += [pscustomobject]@{Path=$p;Url=$cdnUrl;Tag=$tag}
}

# 5) Purge (optional but recommended for moving tags)
$purgeUrl = "https://purge.jsdelivr.net/gh/$ownerRepo@$Tag/$Path"

Write-Host ""
Write-Host "✅ Webflow tags (stable):"
foreach ($r in $results) {
  Write-Host $r.Tag
}
Write-Host ""
Write-Host "🧹 Purge URLs:"
foreach ($r in $results) {
  Write-Host "https://purge.jsdelivr.net/gh/$ownerRepo@$Tag/$($r.Path)"
}
Write-Host ""

if ($Copy) {
  # copy all tags separated by newline
  ($results | ForEach-Object { $_.Tag }) -join "`n" | Set-Clipboard
  Write-Host "📋 Copied tags to clipboard!"
}

if ($Purge) {
  foreach ($r in $results) {
      $purgeUrl = "https://purge.jsdelivr.net/gh/$ownerRepo@$Tag/$($r.Path)"
      Invoke-WebRequest -UseBasicParsing $purgeUrl | Out-Null
  }
  Write-Host "🔥 Purge triggered for all paths!"
}