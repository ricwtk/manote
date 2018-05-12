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

  getFileContent(fileId) {
    let content = "";
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

  createDataFile() {
    return new Promise((resolve, reject) => {
      this.drive.files.create({
        resource: {
          name: "notes",
          mimeType: "text/plain",
          parents: ["appDataFolder"]
        }
      }, (err, resp) => {
        if (err) reject(err);
        resolve(resp.data.id);
      });
    })
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
    return this.getDataFile().then((fid) => this.getFileContent(fid));
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

}

module.exports = GDrive;



// (function (window) {
//   function GDrive () {
//     this.clientId = "377927036124-36jqb3vhb6quno2u4bc3smlomqmsa77a.apps.googleusercontent.com"//"377927036124-kkf02atror1adb28746rucvr380pdjss.apps.googleusercontent.com";
//     this.apiKey = "AIzaSyDxq3ahKLV3Q5zBKLC01-_qG3qaCNqwm0U";
//     this.discoveryDocs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
//     this.scopes = [
//       "https://www.googleapis.com/auth/drive.appfolder"
//     ].join(" ");
//     this.initialised = false;
//     this.initialising = false;
//     this.signedIn = false;

//     this.init = () => {
//       this.initialising = true;
//       gapi.load('client:auth2', this.initClient);
//     }

//     this.initClient = () => {
//       gapi.client.init({
//         apiKey: this.apiKey,
//         clientId: this.clientId,
//         discoveryDocs: this.discoveryDocs,
//         scope: this.scopes
//       }).then(() => {
//         this.initialised = true;
//         this.initialising = false;
//         if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
//           this.signedIn = true;
//           this.signedInAtInit();
//         } else {
//           this.signedOutAtInit();
//         }
//         // Listen for sign-in state changes.
//         gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);
//         // Handle the initial sign-in state.
//         this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
//       });
//     }
//     this.updateSigninStatus = (signedIn) => {
//       console.log("signed in status (Google): ", signedIn);
//       if (signedIn) {
//         this.signedIn = true;
//         this.signedInFunction();
//       } else {
//         this.signedIn = false;
//         this.signedOutFunction();
//       }
//     }

//     this.signedInFunction = () => {}
//     this.signedOutFunction = () => {}
//     this.signedInAtInit = () => {}
//     this.signedOutAtInit = () => {}

//     this.handleSignInClick = () => {
//       console.log(gapi.auth2)
//       gapi.auth2.getAuthInstance().signIn();
//     }

//     this.handleSignOutClick = () => {
//       gapi.auth2.getAuthInstance().signOut();
//     }

//     this.notSignedIn = () => Promise.reject("Not signed in");

//     this.getUserProfile = () => {
//       if (this.signedIn) {
//         return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
//       } else {
//         return "";
//       }
//     }

//     this.getFileContent = (fileId) => { 
//       if (this.signedIn) { 
//         return gapi.client.drive.files.get({ 
//           fileId: fileId, 
//           alt: "media" 
//         }); 
//       } else { 
//         return this.notSignedIn(); 
//       }
//     }

//     this.updateFileContent = (fileId, newContent) => {
//       if (this.signedIn) {
//         return gapi.client.request({
//           path: "/upload/drive/v3/files/" + fileId,
//           method: "PATCH",
//           params: {
//             uploadType: "media"
//           },
//           body: newContent
//         });
//       } else {
//         return this.notSignedIn();
//       }
//     }

//     this.getDataFile = () => {
//       if (this.signedIn) {
//         return gapi.client.drive.files.list({
//           spaces: "appDataFolder",
//           q: "name='notes'"
//         });
//       } else {
//         return this.notSignedIn();
//       }
//     }

//     this.getData = () => {
//       if (this.signedIn) {
//         return this.getDataFile().then((res) => {
//           if (res.result.files.length > 0) {
//             return res.result.files[0].id;
//           } else {
//             return this.createDataFile().then(res => res.result.id);
//           }
//         }).then(this.getFileContent);
//       } else {
//         return this.notSignedIn();
//       }
//     }

//     this.createDataFile = () => {
//       if (this.signedIn) {
//         return gapi.client.drive.files.create({
//           resource: {
//             name: "notes",
//             mimeType: "text/plain",
//             parents: ["appDataFolder"]
//           }
//         })
//       } else {
//         return this.notSignedIn();
//       }
//     }

//     this.updateData = (newContent) => {
//       if (this.signedIn) {
//         return this.getDataFile().then((res) => {
//           if (res.result.files.length > 0) {
//             return gapi.client.request({
//               path: "/upload/drive/v3/files/" + res.result.files[0].id,
//               method: "PATCH",
//               params: {
//                 uploadType: "media"
//               },
//               body: newContent
//             })
//           } else {
//             return this.createDataFile().then(() => this.updateData(newContent));
//           }
//         })
//       } else {
//         return this.notSignedIn();
//       }
//     }

//     this.updateNote = (newNote) => {
//       if (this.signedIn) {
//         return this.getDataFile().then(res => {
//           if (res.result.files.length > 0) {
//             return res.result.files[0].id;
//           } else {
//             return this.createDataFile().then(res => res.result.id);
//           }
//         }).then(id => {
//           return this.getFileContent(id).then(res => {  
//             return [id, res.result];
//           });
//         })
//         .then(res => {
//           content = res[1] ? res[1] : [];
//           let idx = content.findIndex(el => el.id == newNote.id);
//           if (idx > -1) {
//             content[idx] = JSON.parse(JSON.stringify(newNote));
//           } else {
//             content.push(JSON.parse(JSON.stringify(newNote)));
//           }
//           return [res[0], content];
//         }).then(res => {
//           return this.updateFileContent(res[0], res[1]).then(() => {
//             return res[1];
//           });
//         });
//       } else {
//         return this.notSignedIn();
//       }
//     }

//     this.removeNotes = (noteIds) => {
//       if (this.signedIn) {
//         return this.getDataFile().then(res => {
//           if (res.result.files.length > 0) {
//             return res.result.files[0].id;
//           } else {
//             return this.createDataFile().then(res => res.result.id);
//           }
//         }).then(id => {
//           return this.getFileContent(id).then(res => {  
//             return [id, res.result];
//           });
//         })
//         .then(res => {
//           content = res[1] ? res[1] : [];
//           noteIds.forEach(noteid => {
//             let idx = content.findIndex(el => el.id == noteid);
//             if (idx > -1) {
//               content.splice(idx, 1);
//             }
//           });
//           return [res[0], content];
//         }).then(res => {
//           return this.updateFileContent(res[0], res[1]).then(() => {
//             return res[1];
//           });
//         });
//       } else {
//         return this.notSignedIn();
//       }
//     }

//     this.sortNote = (noteId, toId) => {
//       if (this.signedIn) {
//         return this.getDataFile().then(res => {
//           if (res.result.files.length > 0) {
//             return res.result.files[0].id;
//           } else {
//             return this.createDataFile().then(res => res.result.id);
//           }
//         }).then(id => {
//           return this.getFileContent(id).then(res => {  
//             return [id, res.result];
//           });
//         })
//         .then(res => {
//           content = res[1] ? res[1] : [];
//           let idx = content.findIndex(el => el.id == noteId);
//           if (idx > -1) {
//             content.splice(toId, 0, content[idx]);
//             if (toId < idx) idx += 1;
//             content.splice(idx, 1);
//           }
//           return [res[0], content];
//         }).then(res => {
//           return this.updateFileContent(res[0], res[1]).then(() => {
//             return res[1];
//           });
//         });
//       } else {
//         return this.notSignedIn();
//       }
//     }

//     this.init();
//   }

//   if (typeof module !== 'undefined' && module.exports) {
//     module.exports = GDrive;
//   } else if(typeof(window.GDrive) === 'undefined'){
//     window.GDrive = GDrive;
//   }


// })(window)