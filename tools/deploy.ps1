param(
  [Parameter(Mandatory=$true)]
  [string]$Project,

  [Parameter(Mandatory=$true)]
  [string]$Message,

  # Defaults: "<project>-prod"
  [string]$Tag = "",

  # Defaults: "projects/<project>/site.js"
  [string]$Path = "",

  # If set, the script will call the purge URL (recommended for fast updates)
  [switch]$Purge,

  # Copies script tag to clipboard
  [switch]$Copy
)

$ErrorActionPreference = "Stop"

if ($Tag -eq "") { $Tag = "$Project-prod" }
if ($Path -eq "") { $Path = "projects/$Project/site.js" }

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

# 4) Build jsDelivr URL + Webflow script tag (deterministic format)
$cdnUrl = "https://cdn.jsdelivr.net/gh/$ownerRepo@$Tag/$Path"
$scriptTag = "<script src=`"$cdnUrl`"></script>"

# 5) Purge (optional but recommended for moving tags)
$purgeUrl = "https://purge.jsdelivr.net/gh/$ownerRepo@$Tag/$Path"

Write-Host ""
Write-Host "✅ Webflow script tag (stable):"
Write-Host $scriptTag
Write-Host ""
Write-Host "🧹 Purge URL:"
Write-Host $purgeUrl
Write-Host ""

if ($Copy) {
  $scriptTag | Set-Clipboard
  Write-Host "📋 Copied script tag to clipboard!"
}

if ($Purge) {
  # Trigger purge by requesting the purge URL
  Invoke-WebRequest -UseBasicParsing $purgeUrl | Out-Null
  Write-Host "🔥 Purge triggered!"
}