# One-off codemod: replace native alert() with react-hot-toast in all portal sources.
$ErrorActionPreference = "Stop"
$root = "D:\HRMS_new\HRMS_new\HRMS\HRMS Merging"
$portals = @("admin", "client", "employee", "HR", "IT", "Sales")

# alerts whose text is a success message -> toast.success
$successPatterns = @(
  'alert\(res\.data\.msg\)',
  'alert\("OTP settings saved"\)',
  'alert\(`Salary sync complete'
)

$changed = 0
foreach ($p in $portals) {
  $files = Get-ChildItem -Path (Join-Path $root "$p\src") -Recurse -Include *.jsx, *.js |
    Where-Object { $_.FullName -notmatch "node_modules|\\dist\\" }
  foreach ($f in $files) {
    $src = Get-Content $f.FullName -Raw
    if ($src -notmatch '(?<![\w.])alert\(') { continue }

    $out = $src
    foreach ($sp in $successPatterns) {
      $out = [regex]::Replace($out, $sp, { param($m) $m.Value -replace '^alert\(', 'toast.success(' })
    }
    # remaining bare alert( -> toast.error(   (skip window.alert? none exist; skip .alert / toast.alert)
    $out = [regex]::Replace($out, '(?<![\w.])alert\(', 'toast.error(')

    if ($out -notmatch 'from\s+"react-hot-toast"' -and $out -notmatch "from\s+'react-hot-toast'") {
      # insert after the last top-of-file import statement
      $lines = [System.Collections.Generic.List[string]]($out -split "`r?`n")
      $lastImport = -1
      for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^import ') { $lastImport = $i }
        elseif ($lastImport -ge 0 -and $lines[$i] -notmatch '^\s*[\w{},*\s]+from\s|^\s*\}|^\s*[\w,]+\s*$|^\s*$' ) { break }
      }
      # walk forward from lastImport to the end of that (possibly multi-line) statement
      $j = $lastImport
      while ($j -lt $lines.Count -and $lines[$j] -notmatch ';\s*$' -and $lines[$j] -notmatch 'from\s+["'']') { $j++ }
      $lines.Insert($j + 1, 'import toast from "react-hot-toast";')
      $out = $lines -join "`r`n"
    }

    if ($out -ne $src) {
      Set-Content -Path $f.FullName -Value $out -Encoding UTF8 -NoNewline
      $changed++
      Write-Host "patched $($f.FullName.Substring($root.Length+1))"
    }
  }
}
Write-Host "files changed: $changed"
