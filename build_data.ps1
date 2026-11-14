# 从 starred.json（gh api /user/starred 的原始输出）生成 data.js
$raw = Get-Content (Join-Path $PSScriptRoot 'starred.json') -Raw | ConvertFrom-Json

$repos = @()
foreach ($r in $raw) {
  $topics = @($r.topics | Where-Object { $_ })
  $repos += [ordered]@{
    full_name   = $r.full_name
    name        = $r.name
    owner       = "$(if ($r.owner) { $r.owner } else { $r.full_name.Split('/')[0] })"
    url         = $r.url
    homepage    = "$(if ($r.homepage) { $r.homepage } else { '' })"
    description = "$(if ($r.description) { $r.description } else { '' })"
    language    = "$(if ($r.language) { $r.language } else { '' })"
    stars       = [int]$r.stars
    forks       = [int]$r.forks
    pushed_at   = "$(if ($r.pushed_at) { $r.pushed_at } else { '' })"
    created_at  = "$(if ($r.created_at) { $r.created_at } else { '' })"
    archived    = [bool]$r.archived
    topics      = $topics
    license     = "$(if ($r.license) { $r.license } else { '' })"
  }
}

$repos = $repos | Sort-Object { - $_.stars }

$payload = [ordered]@{
  lastUpdated = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  repoCount   = $repos.Count
  repos       = $repos
}

$json = $payload | ConvertTo-Json -Depth 6 -Compress
Set-Content -Path (Join-Path $PSScriptRoot 'data.js') -Value ("window.REPOS_DATA = " + $json + ";") -Encoding UTF8
"repos: $($repos.Count)"
