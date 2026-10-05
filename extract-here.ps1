$dest = "C:\clinte\dyno-snus"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Expand-Archive -Path ".\dyno-snus-LOCAL.zip" -DestinationPath $dest -Force
Write-Host "Ready: $dest"
Write-Host "Next: cd $dest ; npm install ; npm run dev"
