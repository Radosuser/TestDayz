const $ = require('jquery');
const child_process = require('child_process');
const fs = require('fs');
const eapp = require('electron').remote.app;
const {ipcRenderer} = require('electron');

//Navbar actions
$("#ext").click(() => {
	require('electron').remote.app.quit();
});

$("#minim").click(() => {
	require('electron').remote.getCurrentWindow().minimize();
});

//Handle events from main.js
ipcRenderer.on("download complete", (event, data) => {
	$("#progressdiv").hide();
	$( "#dlstatus" ).text("Download completed. You now have mod version v"+data.version);
	$( "#version" ).text(data.version);
	launchGame(data.ip, data.port, data.join);
});
ipcRenderer.on("download progress", (event, progress) => {
	$("#dlrow").show();
	$( "#dlstatus" ).text("Downloading...");
    console.log(event);
    console.log(progress);
    const cleanProgressInPercentages = Math.floor(progress * 100);
	if (cleanProgressInPercentages<=100) {
		$("#progress").css( "width", cleanProgressInPercentages );
	} else {
		$("#progress").hide();
	}
	
});

ipcRenderer.on("serverup", (event, data) => {
	$( "#status" ).text(`${data.name} (${data.raw.numplayers} Players)`);
});
ipcRenderer.on("serverdown", (event, data) => {
	if (data.download)
		$( "#status" ).text("Mod download server seems to be down");
	else
		$( "#status" ).text("Server seems to be down");
});

const launchGame = (ip, port, join) => {
	let dayzpath = $('#dayzpath').val();
	let charname = $('#charname').val();
	
	let file = `"${dayzpath}\\DayZ_BE.exe" "-name=${charname}" -mod=dayzrp -connect=${ip} -port=${port}`;
	if (!join) file = `"${dayzpath}\\DayZ_BE.exe" "-name=${charname}" -mod=dayzrp`;
	
	let path = eapp.getPath("userData") + '\\launch.bat';
	fs.writeFile(path, file, (err) => {
		if (err) throw err;
		console.log(`DayZ startup file created at ${path} with ${file}`);
		child_process.exec(path, function(error, stdout, stderr) {});
	});
};
$( "#launch" ).click(() => {
	ipcRenderer.send("download", {
		dayzpath: $('#dayzpath').val(),
		charname: $('#charname').val(),
		join: false
	});
});
$( "#join" ).click(() => {
	ipcRenderer.send("download", {
		dayzpath: $('#dayzpath').val(),
		charname: $('#charname').val(),
		join: true
	});
});
$( "#refresh" ).click(() => {
	ipcRenderer.send("refresh", {});
});
ipcRenderer.send("refresh", {});