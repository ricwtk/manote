const os = require("os");
const path = require("path");
const fs = require("fs");

appFolderName = "manote";
recentFileName = "recent";
defaultFileName = ".manote.default";

function getAppFolder() {
  let settingFolder = "";
  switch (os.platform()) {
    case "linux":
      settingFolder = path.join(os.homedir(), ".local", "share");
      break;
    default:
      settingFolder = os.homedir();
  }
  let appFolder = path.join(settingFolder, appFolderName);
  if (!fs.statSync(appFolder).isDirectory) fs.mkdirSync();
  return appFolder;
}

function updateRecent(recent) {
  fs.writeFile(
    path.join(getAppFolder(), recentFileName), 
    Array.isArray(recent) ? recent.join(os.EOL) :  recent, 
    (err) => { if (err) throw err; } 
  );
}

function getRecent() {
  let fullRecentFile = path.join(getAppFolder(), recentFileName);
  if (fs.existsSync(fullRecentFile)) {
    return fs.readFileSync(fullRecentFile).toString().split(os.EOL);
  }
  return []
}

function setDefault(folderPath, defaultFormat) {
  fs.writeFile(
    path.join(folderPath, defaultFileName),
    JSON.stringify(defaultFormat, null, 2),
    (err) => { if (err) throw err; }
  );
}

function setGlobalDefault(defaultFormat) {
  setDefault(getAppFolder(), defaultFormat);
}

function getDefault(folderPath) {

}


module.exports = {
  getAppFolder: getAppFolder,
  updateRecent: updateRecent,
  getRecent: getRecent,
  setDefault: setDefault,
  setGlobalDefault: setGlobalDefault,
  getDefault: getDefault
}