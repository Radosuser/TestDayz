![preview](https://cdn.discordapp.com/attachments/489415399230930955/501851442869436446/ac29cb171ed69ee19a048f6d9f094eb1.png)

# DayZSingleServerLauncher

### Contributors
* **Kerkko(h)**

### Installing RPFUtility
1. Just [download](https://github.com/kerkkoh/DayZSingleServerLauncher/releases/latest) the installer and run it.
2. Change the preferences to your own ones and save them
3. OR you can download the source, [download electron](https://github.com/electron/electron/releases/latest) and [nodejs](https://nodejs.org/en/download/) and build the software yourself.

Hosts are hardcoded into main.js atm on the first lines. For example:

```
const host = {
	protocol: "https://",
	domain: "cdn.yourserver.com",
	port: 80,
	path: "/mod.zip",
	gameip: "game.yourserver.com",
	gameport: "2302"
}
```

## Building
1. Install nodejs (and npm)
2. Clone
3. In cmd run `npm install`
4. Do edits you want to do
5. Run test with `npm start`
6. Run `electron-packager . dayzsingleserverlauncher --overwrite --asar=true --platform=win32 --arch=x64 --icon=logo.ico --prune=true --out=release-builds`
7. Run `node installers/windows/createinstaller.js`