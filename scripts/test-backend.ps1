$ErrorActionPreference = 'Stop'
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$taskContainer = 'masuk-permissions-' + [guid]::NewGuid().ToString('N').Substring(0, 10)
$taskRoot = Split-Path -Parent $PSScriptRoot
$created = $false
try {
  docker run --detach --name $taskContainer --network none --env POSTGRES_HOST_AUTH_METHOD=trust postgres:17 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Could not create isolated database' }
  $created = $true
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    docker exec $taskContainer pg_isready -U postgres *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Milliseconds 500
  }
  if (!$ready) { throw 'Local database did not become ready' }
  $files = @('tests/backend-fixture.sql', 'supabase/initial_deployment.sql')
  $files += Get-ChildItem -LiteralPath (Join-Path $taskRoot 'supabase/migrations') -Filter '*.sql' | Sort-Object Name | ForEach-Object { $_.FullName }
  $files += @('supabase/bootstrap_super_admin.sql', 'tests/backend-permissions.sql')
  foreach ($file in $files) {
    $path = if ([IO.Path]::IsPathRooted($file)) { $file } else { Join-Path $taskRoot $file }
    Get-Content -Raw -Encoding UTF8 -LiteralPath $path | docker exec -i $taskContainer psql -U postgres -v ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw "Local SQL verification failed: $file" }
  }
  Write-Output 'PASS: fresh migration, verified-owner bootstrap, permissions, shared content, version conflicts and moderation'
} finally {
  if ($created) { docker rm -f $taskContainer | Out-Null }
}
