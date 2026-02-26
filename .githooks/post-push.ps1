# PowerShell version of post-push hook for Windows
env:branch = (git rev-parse --abbrev-ref HEAD)
if ($env:branch -eq 'main' -and $env:DEPLOY -eq '1') {
    # adjust project name/message as needed
    $scriptPath = "$(git rev-parse --show-toplevel)\tools\deploy.ps1"
    & pwsh -File $scriptPath -Project clpr-x -Message "auto deploy from hook" -Purge -Copy
}
