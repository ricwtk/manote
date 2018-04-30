const os = require("os");
const path = require("path");
const fs = require("fs");

appFolderName = "manote";
recentFileName = "recent";

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


module.exports = {
  getAppFolder: getAppFolder,
  updateRecent: updateRecent,
  getRecent: getRecent
}