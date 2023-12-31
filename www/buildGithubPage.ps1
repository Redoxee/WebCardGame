$ErrorActionPreference = "Stop"

$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition
echo $scriptPath
$parcelCache = ".\.parcel-cache"
$workingFolder = ".\dist"
$destinationFolder = ".\build"

$projectUrl = "/WebCardGame/www/build"

# Clean folders
echo "cleaning $workingFolder"
Get-ChildItem $workingFolder | Remove-Item -Force -Verbose

echo "cleaning $destinationFolder"
Get-ChildItem $destinationFolder | Remove-Item -Force -Verbose

echo "cleaning $parcelCache"
Get-ChildItem $parcelCache | Remove-Item -Force -Verbose

# Compile typescript
echo "Compiling code"
tsc --build --verbose 

# Build client
echo "Building project"
npx parcel build --public-url $projectUrl ./index.html

# Copying to build folder
echo "Coyping from $workingFolder to $destinationFolder"
cp "$workingFolder/*" $destinationFolder

echo "Build complete"