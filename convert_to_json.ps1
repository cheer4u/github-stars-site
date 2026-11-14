$lines = Get-Content stars.tsv
$data = @()
for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $cells = $line -split "`t"
    if ($cells.Count -ge 5) {
        $data += [ordered]@{
            'full_name' = $cells[0]
            'language' = $cells[1]
            'stars' = [int32]($cells[2])
            'description' = $cells[3].Replace("`r`n", " ").Replace("`t", " ").Trim()
            'topics' = $cells[4].Split(',').ForEach({ $_.Trim() }) | Where-Object { $_ }
            'url' = "https://github.com/" + $cells[0]
            'name' = $cells[0].Split('/')[1]
            'owner' = $cells[0].Split('/')[0]
            'pushed_at' = (Get-Date).ToString("o")
        }
    }
}
$data = $data | Sort-Object stars -Descending

$categories = @{}
foreach ($item in $data) {
    foreach ($topic in $item.topics) {
        if ($topic) {
            if (-not $categories.ContainsKey($topic)) { $categories[$topic] = @() }
            $categories[$topic] += $item
        }
    }
}

$json = @{
    'lastUpdated' = (Get-Date).ToString("o")
    'categories' = $categories
    'all' = $data
}
$json | ConvertTo-Json -Depth 5 | Out-File -FilePath 'data.json' -Encoding utf8
"Total items: $($data.Count)"
"Total categories: $($categories.Count)"