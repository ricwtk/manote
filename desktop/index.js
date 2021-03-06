const {app, BrowserWindow, shell, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
  
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let splash

function createWindow () {
  // Create the browser window.
  splash = new BrowserWindow({
    icon: path.join(__dirname, "icons", "icon.png"), 
    frame: false,
    width: 250,
    height: 250,
    show: false
  })

  splash.loadURL(url.format({
    pathname: path.join(__dirname, 'splash.html'),
    protocol: 'file:',
    slashes: true
  }))

  // splash.webContents.openDevTools();

  splash.once("ready-to-show", () => { splash.show(); });

  win = new BrowserWindow({
    icon: path.join(__dirname, "icons", "icon.png"), 
    frame: false,
    width: 800, 
    height: 600,
    show: false
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.once("ready-to-show", () => {
    splash.destroy();
    win.show();
  })

  // Open the DevTools.
  // win.webContents.openDevTools()
  var handleRedirect = (e, urlStr) => {
    if(url != win.webContents.getURL()) {
      e.preventDefault();
      shell.openExternal(urlStr);
    }
  };
  
  win.webContents.on('will-navigate', handleRedirect)
  win.webContents.on('new-window', handleRedirect)

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

ipcMain.on("close-window", () => {
  win.close();
})