electron-packager . dayzsingleserverlauncher --overwrite --asar=true --platform=win32 --arch=x64 --icon=logo.ico --prune=true --out=release-builds

node installers/windows/createinstaller.js