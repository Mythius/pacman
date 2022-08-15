const { app, BrowserWindow } = require('electron');

const name = "pacman";

function createWindow () {
  let win = new BrowserWindow({
    width: 700,
    height: 500,
    webPreferences: {
      nodeIntegration: true
    },
    icon: __dirname + '/favicon.ico'
  })
}

function createWindow () {
  let win = new BrowserWindow({
    width: 840,
    height: 650,
    webPreferences: {
      nodeIntegration: true
    },
    // frame: false
    icon: __dirname + '/site/favicon.ico'
  });

  win.loadFile('site/index.html');

  win.setMenu(null);
}

app.on('ready', createWindow);