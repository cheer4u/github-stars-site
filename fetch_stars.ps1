param([string]$Out = "starred.json")

$headers = @{ 'User-Agent' = 'dsh'; 'Accept' = 'application/vnd.github+json' }
$token = gh auth token
if ($token) { $headers['Authorization'] = "Bearer $token" }

$all = @()
$page = 1
while ($true) {
  $uri = "https://api.github.com/user/starred?per_page=100&page=$page"
  $resp = Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 60
  if (-not $resp -or $resp.Count -eq 0) { break }
  foreach ($r in $resp) {
    $all += [ordered]@{
      name        = $r.name
      full_name   = $r.full_name
      owner       = $r.owner.login
      url         = $r.html_url
      homepage    = $r.homepage
      description = $r.description
      language    = $r.language
      stars       = $r.stargazers_count
      forks       = $r.forks_count
      pushed_at   = $r.pushed_at
      created_at  = $r.created_at
      archived    = $r.archived
      topics      = @($r.topics)
      license     = $r.license.spdx_id
    }
  }
  if ($resp.Count -lt 100) { break }
  $page++
}

$all | ConvertTo-Json -Depth 5 | Out-File -FilePath $Out -Encoding utf8
"total: $($all.Count)"
