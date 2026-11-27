param([string]$OutputDirectory = (Join-Path $PSScriptRoot '..\..'))
$ErrorActionPreference = 'Stop'
$clearviewRepo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$clearviewOutput = [IO.Path]::GetFullPath($OutputDirectory)
$clearviewDist = Join-Path $clearviewRepo 'apps\extension\dist'
if (-not (Test-Path -LiteralPath (Join-Path $clearviewDist 'manifest.json'))) { throw 'Build the extension before packaging.' }
New-Item -ItemType Directory -Force -Path $clearviewOutput | Out-Null
$clearviewSourceZip = Join-Path $clearviewOutput 'ClearView-Source-v1.0.0.zip'
$clearviewExtensionZip = Join-Path $clearviewOutput 'ClearView-Extension-v1.0.0.zip'
Push-Location $clearviewRepo
try {
  $clearviewRevision = git rev-parse HEAD
  if ($LASTEXITCODE -ne 0) { throw 'Commit the reviewed source before packaging.' }
  git archive --format=zip --prefix=clearview/ --output=$clearviewSourceZip HEAD
  if ($LASTEXITCODE -ne 0) { throw 'Source archive failed.' }
  Compress-Archive -Path (Join-Path $clearviewDist '*') -DestinationPath $clearviewExtensionZip -Force
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $clearviewArchive = [IO.Compression.ZipFile]::OpenRead($clearviewExtensionZip)
  try {
    $clearviewEntries = @($clearviewArchive.Entries | ForEach-Object { $_.FullName.Replace('\','/') })
    foreach ($clearviewRequired in @('manifest.json','index.html','background.js','contentScript.js')) {
      if ($clearviewEntries -notcontains $clearviewRequired) { throw "Extension archive lacks $clearviewRequired" }
    }
  } finally { $clearviewArchive.Dispose() }
  $clearviewRecords = foreach ($clearviewArtifact in @($clearviewSourceZip, $clearviewExtensionZip)) {
    $clearviewFile = Get-Item -LiteralPath $clearviewArtifact
    [ordered]@{ file=$clearviewFile.Name; bytes=$clearviewFile.Length; sha256=(Get-FileHash -LiteralPath $clearviewArtifact -Algorithm SHA256).Hash.ToLowerInvariant() }
  }
  [ordered]@{ sourceRevision=$clearviewRevision; artifacts=@($clearviewRecords) } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $clearviewOutput 'RELEASE_MANIFEST.json') -Encoding utf8
  $clearviewRecords | Format-Table
} finally { Pop-Location }
