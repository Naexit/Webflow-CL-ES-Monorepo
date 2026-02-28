param(
  # A single project name, or omit to show links for ALL projects
  [string]$Project = "",

  # Copies tags to clipboard
  [switch]$Copy
)

$ErrorActionPreference = "Stop"

# 1) Get origin remote (OWNER/REPO)
$remote = (git remote get-url origin).Trim()
$ownerRepo = $null
if ($remote -match "github\.com[:/](?<owner>[^/]+?)/(?<repo>[^/]+?)(\.git)?$") {
  $ownerRepo = "$($Matches['owner'])/$($Matches['repo'])"
} else {
  throw "Could not parse OWNER/REPO from remote: $remote"
}

# 2) Get latest commit SHA from local HEAD
$commitSha = (git rev-parse HEAD).Trim()

# 3) Discover projects
$allProjects = @()

if ($Project -ne "") {
  # Single project mode
  $allProjects += $Project
} else {
  # Discover all projects from client-projects/ and projects/
  foreach ($root in @("client-projects", "projects")) {
    if (Test-Path $root -PathType Container) {
      Get-ChildItem -Path $root -Directory | ForEach-Object {
        $name = $_.Name
        # Only include if it has .js or .css files
        $files = Get-ChildItem -Path $_.FullName -Include *.js,*.css -File -Recurse
        if ($files) {
          $allProjects += $name
        }
      }
    }
  }
}

if ($allProjects.Count -eq 0) {
  Write-Host "No projects found." -ForegroundColor Red
  return
}

$allTags = @()

foreach ($proj in $allProjects) {
  # Find files for this project
  $paths = @()
  foreach ($dir in @("client-projects/$proj", "projects/$proj")) {
    if (Test-Path $dir -PathType Container) {
      $found = Get-ChildItem -Path $dir -Include *.js,*.css -File -Recurse |
           ForEach-Object { $_.FullName }
      if ($found) {
        $paths = $found
        break
      }
    }
  }

  if ($paths.Count -eq 0) { continue }

  # Convert to relative paths
  $repoRoot = (git rev-parse --show-toplevel).Trim()
  $paths = $paths | ForEach-Object {
    $p = $_
    if ([System.IO.Path]::IsPathRooted($p)) {
      $relative = Resolve-Path -Path $p -Relative -ErrorAction SilentlyContinue
      if (!$relative) {
        $relative = $p -replace [regex]::Escape($repoRoot + '\\?'), ''
      }
      $p = $relative
    }
    $p -replace '\\', '/'
  }

  # Build tags
  Write-Host ""
  Write-Host "[$proj]" -ForegroundColor Cyan
  Write-Host "  Commit: $commitSha" -ForegroundColor Gray

  foreach ($p in $paths) {
    $cdnUrl = "https://cdn.jsdelivr.net/gh/$ownerRepo@$commitSha/$p"
    if ($p -like "*.css") {
      $tag = "<link rel=`"stylesheet`" href=`"$cdnUrl`">"
    } else {
      $tag = "<script src=`"$cdnUrl`"></script>"
    }
    Write-Host "  $tag" -ForegroundColor Yellow
    $allTags += $tag
  }
}

if ($Copy -and $allTags.Count -gt 0) {
  $allTags -join "`n" | Set-Clipboard
  Write-Host ""
  Write-Host "[COPY] All tags copied to clipboard" -ForegroundColor Green
}

Write-Host ""
