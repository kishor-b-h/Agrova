param([ValidateSet('search','download')][string]$Mode = 'search')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$resourceRoot = Join-Path $projectRoot 'resources/crop-photos'
if ($Mode -eq 'search') {
  $plan = Get-Content -LiteralPath (Join-Path $resourceRoot 'plan.json') -Raw | ConvertFrom-Json
  $plan | ForEach-Object -Parallel {
    $entry = $_
    $target = Join-Path $using:resourceRoot ('candidates/' + $entry.key + '.json')
    if (Test-Path -LiteralPath $target) { return }
    Start-Sleep -Milliseconds 1700
    $q = [uri]::EscapeDataString($entry.query + ' filetype:bitmap -filetype:djvu -filetype:pdf')
    $uri = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$q&gsrnamespace=6&gsrlimit=4&prop=imageinfo&iiprop=url%7Cextmetadata%7Csize&iiurlwidth=640&format=json"
    try {
      $r = Invoke-RestMethod -Uri $uri -Headers @{'User-Agent'='AgrovaCropPhotoAudit/1.0 (educational crop guide)'} -TimeoutSec 40 -MaximumRetryCount 3 -RetryIntervalSec 30
      $items = @($r.query.pages.PSObject.Properties.Value | Sort-Object index | ForEach-Object {
        $info = $_.imageinfo[0]
        $meta = $info.extmetadata
        [ordered]@{title=$_.title; url=($info.thumburl -split '\?')[0]; original=($info.url -split '\?')[0]; source=$info.descriptionurl; width=$info.width; height=$info.height; artist=$meta.Artist.value; license=$meta.LicenseShortName.value; licenseUrl=$meta.LicenseUrl.value; description=$meta.ImageDescription.value; categories=$meta.Categories.value}
      })
      ConvertTo-Json -InputObject $items -Depth 8 | Set-Content -LiteralPath $target -Encoding utf8
      Write-Output ($entry.key + ': ' + $items.Count)
    } catch { Write-Output ($entry.key + ': ERROR ' + $_.Exception.Message) }
  } -ThrottleLimit 1
} else {
  $assets = Get-Content -LiteralPath (Join-Path $resourceRoot 'selected.json') -Raw | ConvertFrom-Json
  $photoRoot = Join-Path $projectRoot 'public/images/crops'
  New-Item -ItemType Directory -Force -Path $photoRoot | Out-Null
  $assets | ForEach-Object -Parallel {
    $asset = $_
    $target = Join-Path $using:photoRoot $asset.filename
    if (Test-Path -LiteralPath $target) { return }
    try {
      Invoke-WebRequest -Uri $asset.url -OutFile $target -Headers @{'User-Agent'='AgrovaCropPhotoAudit/1.0'} -TimeoutSec 45
      Write-Output $asset.key
    } catch { Write-Output ($asset.key + ': ERROR ' + $_.Exception.Message) }
  } -ThrottleLimit 4
}
