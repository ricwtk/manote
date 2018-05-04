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
    return {
      "Title": {
        type: "single",
        content: ""
      },
      "Content": {
        type: "multiple",
        content: ""
      },
      "Categories": {
        type: "tags",
        content: []
      }
    };
  }
}

function getArchiveLocation(dirpath) {
  return path.join(dirpath, ".manote.archive");
} 

function hasArchive(dirpath) {
  let al = getArchiveLocation(dirpath);
  return fs.existsSync(al) && fs.statSync(al).isDirectory();
}

function getArchive(dirpath) {
  let al = getArchiveLocation(dirpath);
  return fs.readdirSync(al).filter(f => f.endsWith(".manote")).map(f => path.join(al, f));
}

function copyFile(src, dest) {
  let rs = fs.createReadStream(src);
  let ws = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    rs.on("error", reject);
    ws.on("error", reject);
    ws.on("finish", resolve);
    rs.pipe(ws);
  }).catch(err => {
    rs.destroy();
    ws.end();
    throw err;
  });
}

function moveFile(src, dest) {
  return copyFile(src, dest)
    .then(() => {
      return new Promise((resolve, reject) => {
        fs.unlink(src, (err) => {
          if (err) reject(err);
          resolve(dest);
        });
      })
    });
}

function createDirIfNotExist(dirpath) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirpath, (err) => {
      if (err && err.code != "EEXIST") reject(err);
      resolve();
    })
  })
}

function archive(filepath) {
  let al = getArchiveLocation(path.parse(filepath).dir);
  let newFile = path.join(al, path.parse(filepath).base);
  while (fs.existsSync(newFile)) {
    let nf = path.parse(newFile);
    newFile = path.join(nf.dir, nf.name + "_2" + nf.ext);
  }
  return createDirIfNotExist(al)
    .then(() => moveFile(filepath, newFile));
}

function unarchive(filepath) {
  let newFolder = path.parse(path.parse(filepath).dir).dir;
  let newFile = path.join(newFolder, path.parse(filepath).base);
  while (fs.existsSync(newFile)) {
    let nf = path.parse(newFile);
    newFile = path.join(nf.dir, nf.name + "_2" + nf.ext);
  }
  return moveFile(filepath, newFile);
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
  getDefault: getDefault,
  getArchiveLocation: getArchiveLocation,
  hasArchive: hasArchive,
  getArchive: getArchive,
  archive: archive,
  unarchive: unarchive
}