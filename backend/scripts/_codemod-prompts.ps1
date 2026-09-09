# One-off codemod: wire usePrompt() into admin pages that used window.prompt().
# Usage: powershell -NoProfile -File _codemod-prompts.ps1  (run from anywhere)
$ErrorActionPreference = "Stop"
$root = "D:\HRMS_new\HRMS_new\HRMS\HRMS Merging\admin\src"

# file, component decl line, top return line, closing line
$targets = @(
  @{ f = "pages\dashboard\LeaveManagement.jsx";       decl = 73; ret = 223; close = 806 },
  @{ f = "pages\dashboard\SalaryRevisions.jsx";       decl = 82; ret = 219; close = 574 },
  @{ f = "pages\verification\VerificationPortal.jsx"; decl = 26; ret = 98;  close = 185 },
  @{ f = "pages\dashboard\HRDocuments.jsx";           decl = 35; ret = 148; close = 416 },
  @{ f = "pages\webForms\WebFormsInbox.jsx";          decl = 29; ret = 123; close = 307 }
)

foreach ($t in $targets) {
  $path = Join-Path $root $t.f
  $l = [System.Collections.Generic.List[string]](Get-Content $path)

  if ($l[$t.close - 1].Trim() -ne ");") { throw "close mismatch in $($t.f): '$($l[$t.close-1])'" }
  if ($l[$t.ret - 1].Trim()   -ne "return (") { throw "return mismatch in $($t.f)" }
  if ($l[$t.decl - 1] -notmatch "^export default function") { throw "decl mismatch in $($t.f)" }

  # work bottom-up so indices stay valid
  $l.Insert($t.close - 1, "    </>")
  $l.Insert($t.close - 1, "      <PromptDialog />")
  $l.Insert($t.ret, "    <>")
  $l.Insert($t.decl, "  const { ask, PromptDialog } = usePrompt();")
  $l.Insert(0, 'import usePrompt from "../../hooks/usePrompt";')

  Set-Content -Path $path -Value ($l -join "`r`n") -Encoding UTF8 -NoNewline
  Add-Content -Path $path -Value "" -Encoding UTF8
  Write-Host "patched $($t.f)"
}
