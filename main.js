/*
* Настройка хоста:
*
* протокол: строка — либо «https://», либо «http://» (для сервера загрузки)
* domain: String - Скачать домен сервера
* port: Integer - Порт сервера загрузки
* path: String — путь к файлу репозитория (он будет извлечен в папку с игрой)
* gameip: String - ip/домен игрового сервера
* gameport: Integer - порт игрового сервера
*
*/
const host = {
	protocol: "https://",
	domain: "cdn.yourserver.com",
	port: 80,
	path: "/mod.zip",
	gameip: "game.yourserver.com",
	gameport: "2302"
}

if (require('electron-squirrel-startup')) return;

// это должно быть размещено в верхней части main.js для быстрой обработки событий установки
if (handleSquirrelEvent()) {
// Событие белки обработано, и приложение закроется через 1000 мс, так что больше ничего не делайте
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
// Дополнительно делаем такие вещи, как:
       // - Добавьте ваш .exe в ПУТЬ
       // - Запись в реестр для таких вещей, как ассоциации файлов и
       // контекстное меню проводника

       // Установить ярлыки на рабочем столе и в меню «Пуск»
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
// Отмените все, что вы сделали в --squirrel-install и
       // --squirrel-обновленные обработчики

       // Удалить ярлыки на рабочем столе и в меню "Пуск"
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
// Это вызывается в исходящей версии вашего приложения перед
       // обновляемся до новой версии - это наоборот
       // --squirrel-обновлено

      app.quit();
      return true;
  }
};

const {app, BrowserWindow, ipcMain} = require("electron");

const path = require('path')
const url = require('url')
const fs = require('fs')
const {download} = require("electron-dl")
const rimraf = require('rimraf')
const http = require('http')
const extract = require('extract-zip')
const gamedig = require('gamedig')

let dlServerUp = true;

//Выясним, существуют ли настройки, и если нет, создадим настройки по умолчанию
const spath = path.join(app.getPath('userData'), 'settings.json')

//let settings = JSON.stringify({"packpath":"RPFramework\\pack.bat","buildpath":"RPFramework\\build.bat","srvrpath":"C:\\Program Files (x86) \\Steam\\steamapps\\common\\Arma 3\\arma3server_x64.exe","params":"-port=2302 \"-config=C:\\Program Files (x86)\\Steam\\steamapps\ \common\\Arma 3\\TADST\\rpf\\TADST_config.cfg\" \"-cfg=C:\\Program Files (x86)\\Steam\\steamapps\\common\\Arma 3\\TADST\ \rpf\\TADST_basic.cfg\" \"-profiles=C:\\Program Files (x86)\\Steam\\steamapps\\common\\Arma 3\\TADST\\rpf\" -name=rpf -pid =pid.log -ranking=ranking.log \"-mod=@extDB3;@RPF_Server;@RPFramework\"","logs":"C:\\Program Files (x86)\\Steam\\steamapps\\common \\Арма 3\\ТАДСТ\\рпф"})let settings = JSON.stringify({"dayzpath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ", "charname": "FirstName LastName", "version": "-1", "last-modified": "-1"})

if (fs.existsSync(spath)) {
	settings = fs.readFileSync(spath)
} else {
	if (!fs.existsSync(app.getPath('userData'))) {
		fs.mkdirSync(app.getPath('userData'))
	}
	fs.writeFile(spath, settings, (err) => {if (err) throw err})
}
let settingsData = JSON.parse(settings)

let version = "-1";
const versionPath = JSON.parse(settings).dayzpath+"\\dayzrp\\VERSION"

if (fs.existsSync(versionPath)) {
	version = fs.readFileSync(versionPath)
}
settingsData.version = version;

const hbs = require('electron-handlebars')({
  title: app.getName(),
  data: settingsData,
  installed: (version != "-1"),
  version: app.getVersion()
})

// Сохраняем глобальную ссылку на объект окна, иначе окно будет
// закрываться автоматически, когда объект JavaScript очищается сборщиком мусора.
let mainWindow

function createWindow () {
	mainWindow = new BrowserWindow({width: 760, height: 380, frame: false/*, resizable: false*/, backgroundColor: '#121212'})

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.hbs'),
		protocol: 'file:',
		slashes: true
	}))
	
	ipcMain.on("download", (event, info) => {
		// сохранить дерьмо
		settingsData.dayzpath = info.dayzpath;
		settingsData.charname = info.charname;
		settings = JSON.stringify(settingsData);
		fs.writeFile(spath, settings, (err) => {if (err) throw err})
		
		//давайте спросим у сервера, было ли обновление
		let req = http.request({method: 'HEAD', host: host.domain, port: host.port, path: host.path}, (res) => {
			if (res.headers["last-modified"] != settingsData["last-modified"] || settingsData.version == "-1") {
				console.log("Mismatch: "+res.headers["last-modified"]+" != "+settingsData["last-modified"]);
				//давайте спросим у сервера, было ли обновление
				settingsData["last-modified"] = res.headers["last-modified"]
				
				if (fs.existsSync(`${info.dayzpath}\\dayzrp`)) {
					rimraf(`${info.dayzpath}\\dayzrp`, (err) => {
						if (err) throw err;
					})
				}
				download(BrowserWindow.getFocusedWindow(), host.protocol+host.domain+host.path, {directory: `${app.getPath("userData")}\\mods`, onProgress: state => mainWindow.webContents.send("download progress", state)})
				.then(dl => {
					let file = dl.getSavePath()
					extract(file, {dir: info.dayzpath}, function (err) {
						if (err) throw err
						fs.unlink(file, (err) => {
						  if (err) throw err
						})
						
						version = fs.readFileSync(info.dayzpath+"\\dayzrp\\VERSION")
						settingsData.version = version
						settings = JSON.stringify(settingsData)
						fs.writeFile(spath, settings, (err) => {if (err) throw err})
						mainWindow.webContents.send("download complete", {version: settingsData.version, ip: host.gameip, port: host.gameport, join: info.join})
					})
				})
				.catch((e) => {
					if (e) console.log(e);
					dlServerUp = false
					mainWindow.webContents.send("serverdown", {download: true})
				})
				/*
				Это более полезно для проверки того, что с cdn не так.
				
				let path = `${app.getPath("userData")}\\mods\\dayzrp.zip`;
				console.log(path);
				console.log(host.protocol+host.domain+host.path);
				var file = fs.createWriteStream(path);
				var sendReq = request.get(host.protocol+host.domain+host.path);

				// verify response code
				sendReq.on('response', function(response) {
					if (response.statusCode != 200) {
						console.log('Response status was ' + response.statusCode);
					}
				});

				// check for request errors
				sendReq.on('error', function (err) {
					fs.unlink(path);
				});

				sendReq.pipe(file);

				file.on('finish', function() {
					file.close(cb);
					extract(path, {dir: info.dayzpath}, function (err) {
						if (err) throw err
						fs.unlink(path)
						
						version = fs.readFileSync(info.dayzpath+"\\dayzrp\\VERSION")
						settingsData.version = version
						settings = JSON.stringify(settingsData)
						fs.writeFile(spath, settings, (err) => {if (err) throw err})
						mainWindow.webContents.send("download complete", {version: settingsData.version, ip: host.gameip, port: host.gameport, join: info.join})
					})
				});

				file.on('error', function(err) { // Handle errors
					fs.unlink(dest); // Delete the file async. (But we don't check the result)
					return cb(err.message);
				});*/
			} else {
				console.log("no mismatch found");
				mainWindow.webContents.send("download complete", {version: settingsData.version, ip: host.gameip, port: host.gameport, join: info.join})
			}
		})
		//Сервер отрублен
		req.on('abort',(e) => {
			dlServerUp = false
			mainWindow.webContents.send("serverdown", {download: true})
		})
		//Сервер отрублен
		req.on('error', (e) => {
			dlServerUp = false
			mainWindow.webContents.send("serverdown", {download: true})
		})
		req.end()
	})
	//Отключаем девтулзы
	// mainWindow.webContents.openDevTools()

	mainWindow.on('closed', function () {
		mainWindow = null
	})
	ipcMain.on("refresh", (event, info) => {
		gamedig.query({
			type: 'dayz',
			host: host.gameip
		},
		function(e,state) {
			if(e) {
				mainWindow.webContents.send("serverdown", {download: false})
			} else {
				if (dlServerUp)
					mainWindow.webContents.send("serverup", state)
				else
					mainWindow.webContents.send("serverdown", {download: true})
			}
		})
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})