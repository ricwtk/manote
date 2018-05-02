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

function getGlobalDefaultLocation() {
  return path.join(getAppFolder(), defaultFileName);
}

function getGlobalDefault() {
  return JSON.parse(fs.readFileSync(getGlobalDefaultLocation()));
}

function getDirDefaultLocation(dir) {
  return path.join(dir, defaultFileName);
}

function getDirDefault(dir) {
  return JSON.parse(fs.readFileSync(getDirDefaultLocation(dir)));
}

function getDefault(folderPath) {
  let localDefault = getDirDefaultLocation(folderPath);
  let globalDefault = getGlobalDefaultLocation();
  let defaultFormat;
  if (fs.existsSync(localDefault)) {
    return getDirDefault(folderPath);
  } else if (fs.existsSync(globalDefault)) {
    return getGlobalDefault();
  } else {
    return {};
  }
}


module.exports = {
  getAppFolder: getAppFolder,
  updateRecent: updateRecent,
  getRecent: getRecent,
  setDefault: setDefault,
  setGlobalDefault: setGlobalDefault,
  getGlobalDefaultLocation: getGlobalDefaultLocation,
  getGlobalDefault: getGlobalDefault,
  getDirDefaultLocation: getDirDefaultLocation,
  getDirDefault: getDirDefault,
  getDefault: getDefault
}