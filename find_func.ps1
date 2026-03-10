$lines = Get-Content 'C:\Users\USER\Desktop\Claude\Forg OS Gym V3 - Working version\index.html'
$match = $lines | Select-String -Pattern 'function saveBwWorkout' | Select-Object -First 1
$start = $match.LineNumber
Write-Host "saveBwWorkout starts at line: $start"
$end = $start + 118
for ($i = $start - 1; $i -le $end; $i++) {
    Write-Host ('{0}: {1}' -f ($i + 1), $lines[$i])
}
