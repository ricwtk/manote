const fs = require("fs");
const path = require("path");
const {google} = require("googleapis");
const OAuth2Client = google.auth.OAuth2;
const local = require(path.join(__dirname, "get-local.js"));
const SCOPES = ["https://www.googleapis.com/auth/drive.appfolder"];
const TOKEN_PATH = path.join(local.getAppFolder(), "credentials.json");
const CS_PATH = path.join(__dirname, "client-secret.json");

class GDrive {
  constructor() {
    try {
      let content = fs.readFileSync(CS_PATH);
      let {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
      this.oauth2client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    } catch (e) {
      this.oauth2client = null;
    }
  }

  checkSignIn() {
    return new Promise((resolve, reject) => {
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) reject(err);
        else resolve(JSON.parse(token));
      });
    });
  }

  getAuthUrl() {
    return new Promise((resolve, reject) => {
      if (!this.oauth2client) reject("OAuth2 client not loaded");
      const authUrl = this.oauth2client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
      });
      resolve(authUrl);
    });
  }

  processToken(code) {
    return new Promise((resolve, reject) => {
      if (!this.oauth2client) reject("OAuth2 client not loaded");
      this.oauth2client.getToken(code, (err, token) => {
        if (err) reject(err);
        else resolve(token);
      })
    });
  }

  setCred(token, shouldStore) {
    return new Promise((resolve, reject) => {
      if (!this.oauth2client) reject("OAuth2 client not loaded");
      this.oauth2client.setCredentials(token);
      if (shouldStore) {
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) reject(err);
          resolve();
        });
      } else {
        resolve();
      }
    }).then(() => {
      let oa2c = this.oauth2client;
      this.drive = google.drive({ version: "v3", auth: this.oauth2client });
    });
  }

  removeCred() {
    return new Promise((resolve, reject) => {
      this.oauth2client.setCredentials();
      fs.unlink(TOKEN_PATH, (err) => {
        if (err) reject(err);
        resolve();
      })
    })
  }

  isSignedIn() {
    return Object.keys(this.oauth2client.credentials).length > 0;
  }

  getUserProfile() {
    return new Promise((resolve, reject) => {
      if (!this.oauth2client) reject("OAuth2 client not loaded");
      if (!this.drive) reject("Drive API not loaded");
      this.drive.about.get({
        fields: "user"
      }, (err, resp) => {
        if (err) reject(err);
        if (resp.status != 200) reject(resp.statusText);
        resolve(resp.data.user);
      });
    });
  }
  
  signInInit() {
    return this.checkSignIn()
      .then((token) => this.setCred(token, false))
      .then(() => this.getUserProfile())
  }
  
  authenticateWith(code) {
    return this.processToken(code)
      .then((token) => this.setCred(token, true))
      .then(() => this.getUserProfile())
  }

  signOut() {
    return this.removeCred();
  }

  createFile(name) {
    return new Promise((resolve, reject) => {
      this.drive.files.create({
        resource: {
          name: name,
          mimeType: "text/plain",
          parents: ["appDataFolder"]
        }
      }, (err, resp) => {
        if (err) reject(err);
        resolve(resp.data.id);
      });
    });
  }

  getFileContent(fileId) {
    return new Promise((resolve, reject) => {
      this.drive.files.get({
        fileId: fileId,
        alt: "media"
      }, (err, resp) => {
        if (err) reject(err);
        resolve({ id: fileId, data: resp.data });
      })
    });
  }

  updateFileContent(fileId, newContent) {
    return new Promise((resolve, reject) => {
      this.drive.files.update({
        fileId: fileId,
        uploadType: "media",
        media: {
          mimeType: "text/plain",
          body: newContent
        },
        fields: 'id'
      }, (err, resp) => {
        if (err) reject(err);
        resolve({ id: resp.data.id, data: newContent });
      });
    });
  }

  deleteFile(fid) {
    return new Promise((resolve, reject) => {
      this.drive.files.delete({
        fileId: fid
      }, err => {
        if (err) reject (err);
        resolve({ id: fid });
      });
    })
  }

  createDataFile() {
    return this.createFile("notes");
  }

  getDataFile() {
    return new Promise((resolve, reject) => {
      this.drive.files.list({
        spaces: "appDataFolder",
        q: "name='notes'"
      }, (err, resp) => {
        if (err) reject(err);
        resolve(resp.data.files);
      });
    }).then(files => {
      if (files.length > 0) {
        return files[0].id;
      } else {
        return this.createDataFile();
      }
    });
  }

  getData() {
    return this.getDataFile().then((fid) => this.getFileContent(fid)).then(resp => {
      return {
        id: resp.id,
        data: resp.data ? resp.data : []
      }
    });
  }

  updateData(newContent) { // untested
    return this.getDataFile()
      .then(fid => {
        return this.updateFileContent(fid, newContent);
      });
  }

  updateNote(newNote) {
    return this.getData().then(resp => {
      let content = resp.data ? resp.data : [];
      let idx = content.findIndex(el => el.id == newNote.id);
      if (idx > -1) {
        content[idx] = JSON.parse(JSON.stringify(newNote));
      } else {
        content.push(JSON.parse(JSON.stringify(newNote)));
      }
      return this.updateFileContent(resp.id, content);
    })
  }

  removeNotes(noteIds) {
    return this.getData().then(resp => {
      let content = resp.data ? resp.data : [];
      noteIds.forEach(noteid => {
        let idx = content.findIndex(el => el.id == noteid);
        if (idx > -1) {
          content.splice(idx, 1);
        }
      });
      return this.updateFileContent(resp.id, content);
    });
  }

  sortNote(noteId, toId) {
    return this.getData().then(resp => {
      let content = resp.data ? resp.data : [];
      let idx = content.findIndex(el => el.id == noteId);
      if (idx > -1) {
        content.splice(toId, 0, content[idx]);
        if (toId < idx) idx += 1;
        content.splice(idx, 1);
      }
      return this.updateFileContent(resp.id, content);
    })
  }

  createArchiveFile() {
    return this.createFile("archive");
  }

  getArchiveFile() {
    return new Promise((resolve, reject) => {
      this.drive.files.list({
        spaces: "appDataFolder",
        q: "name='archive'"
      }, (err, resp) => {
        if (err) reject(err);
        resolve(resp.data.files);
      });
    }).then(files => {
      if (files.length > 0) {
        return files[0].id;
      } else {
        return this.createArchiveFile();
      }
    });
  }

  getArchive() {
    return this.getArchiveFile().then((fid) => this.getFileContent(fid)).then(resp => {
      return {
        id: resp.id,
        data: resp.data ? resp.data : []
      }
    });
  }

  moveToArchive(noteIds) {
    return Promise.all([
      this.getData(), 
      this.getArchive()
    ]).then(resp => {
      return Promise.all(noteIds.filter(nid => resp[0].data.map(n => n.id).includes(nid)).map(nid => {
        return new Promise((resolve, reject) => {
          let noteToArchive = resp[0].data.splice(resp[0].data.findIndex(el => el.id == nid), 1);
          resp[1].data.push(JSON.parse(JSON.stringify(noteToArchive[0])));
          resolve();
        })
      })).then(() => {
        return Promise.all([
          this.updateFileContent(resp[0].id, resp[0].data),
          this.updateFileContent(resp[1].id, resp[1].data)
        ])
      });
    })
  }

  deleteFromArchive(noteIds) {
    return this.getArchive().then(resp => {
      noteIds.filter(nid => resp.data.map(n => n.id).includes(nid)).map(nid => {
        resp.data.splice(resp.data.findIndex(el => el.id == nid), 1);
      })
      return this.updateFileContent(resp.id, resp.data);
    });
  }

  unarchive(noteIds) {
    return Promise.all([
      this.getArchive(),
      this.getData()
    ]).then(resp => {
      noteIds.filter(nid => resp[0].data.map(n => n.id).includes(nid)).map(nid => {
        let noteToRestore = resp[0].data.splice(resp[0].data.findIndex(el => el.id == nid), 1);
        resp[1].data.push(JSON.parse(JSON.stringify(noteToRestore[0])));
      });
      return Promise.all([
        this.updateFileContent(resp[0].id, resp[0].data),
        this.updateFileContent(resp[1].id, resp[1].data)
      ])
    })
  }

  createDefaultFile() {
    return this.createFile("default");
  }

  getDefaultFile() {
    return new Promise((resolve, reject) => {
      this.drive.files.list({
        spaces: "appDataFolder",
        q: "name='default'"
      }, (err, resp) => {
        if (err) reject(err);
        resolve(resp.data.files);
      });
    }).then(files => {
      if (files.length > 0) {
        return files[0].id;
      } else {
        return this.createDefaultFile();
      }
    });
  }

  getDefault() {
    return this.getDefaultFile().then(fid => this.getFileContent(fid)).then(resp => {
      let defaultFormat = {
        Title: { type: "single", content: "Untitled" },
        Content: { type: "multiple", content: "", height: "auto" },
        Categories: { type: "tags", content: "" },
        order: ["Title", "Content", "Categories"]
      };
      if (!resp.data) {
        this.setDefault(defaultFormat);
      }
      return {
        id: resp.id,
        data: resp.data ? resp.data : defaultFormat
      }
    });
  }

  setDefault(format) {
    return this.getDefaultFile().then((fid) => this.updateFileContent(fid, format));
  }
}

module.exports = GDrive;