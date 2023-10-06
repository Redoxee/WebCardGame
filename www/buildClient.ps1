$ErrorActionPreference = "Stop"
# From https://rkeithhill.wordpress.com/2009/08/03/effective-powershell-item-16-dealing-with-errors/
function CheckLastExitCode {
    param ([int[]]$SuccessCodes = @(0), [scriptblock]$CleanupScript=$null)

    if ($SuccessCodes -notcontains $LastExitCode) {
        if ($CleanupScript) {
            "Executing cleanup script: $CleanupScript"
            &$CleanupScript
        }
        $msg = @"
EXE RETURNED EXIT CODE $LastExitCode
CALLSTACK:$(Get-PSCallStack | Out-String)
"@
        throw $msg
    }
}

$workingFolder = "./dist"
$destinationFolder = "./build"

# Clean folders
echo "cleaning $workingFolder"
Get-ChildItem $workingFolder | Remove-Item -Force -Verbose
echo "cleaning $destinationFolder"
Get-ChildItem $destinationFolder | Remove-Item -Force -Verbose
CheckLastExitCode

# Compile typescript
echo "Compiling code"
tsc --build --verbose
CheckLastExitCode

# Build client
echo "Building project"
npx parcel build ./index.html
CheckLastExitCode

# Copying to build folder
echo "Coyping from $workingFolder to $destinationFolder"
cp "$workingFolder/*" $destinationFolder
CheckLastExitCode

echo "Build complete"