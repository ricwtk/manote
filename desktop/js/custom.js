const {mdconverter, mdguides} = require("./js/md.js");
const Vue = require("./js/vue.js");
const {Note} = require("./js/note.js");
const {generateRandomId,showErr} = require("./js/misc.js");
const fs = require("fs");
const path = require("path");
const localSetting = require("./js/get-local.js");
const {shell} = require("electron");
const GDrive = require("./js/google-drive-access.js");
const LAccess = require("./js/local-access.js");
const Split = require("split.js");
const splitConfig = {
  sizes: [35,65],
  minSize: [230,230],
  gutterSize: 7,
  snapOffset: 0
};

const defaultDefault = [
  { name: "Title", type: "single" },
  { name: "Content", type: "multiple" },
  { name: "Categories", type: "tags"}
];

Vue.component("list-container", require("./vue/list-container.js"));
Vue.component("note-container", require("./vue/note-container.js"));
Vue.component("navbar", require("./vue/navbar.js"));
Vue.component("sidebar", require("./vue/sidebar.js"));
Vue.component("list-selection", require("./vue/list-selection.js"));
Vue.component("modal-loading", require("./vue/modal-loading.js"));
Vue.component("modal-unsavedprompt", require("./vue/modal-unsavedprompt.js"));
Vue.component("md-guide", require("./vue/md-guide.js"));
Vue.component("directory-chooser", require("./vue/directory-chooser.js"));
Vue.component("fields-display", require("./vue/fields-display.js"));
Vue.component("list-display", require("./vue/list-display.js"));
Vue.component("minimal-note-display", require("./vue/minimal-note-display.js"));
Vue.component("sign-in-ui", require("./vue/sign-in-ui.js"));

const separator = "\n" + "-".repeat(10) + "0qp4BCBHLoHfkIi6N1hgeXNaZg20BB0sNZ4k8tE6eWKmTa1CkE" + "-".repeat(10) + "\n\n";
var currentUser = {
  name: null,
  email: null,
  profilePic: null
}

var stored = {
  noteList: []  
}

var misc = {
  authUrl: "",
  authError: ""
}

var stat = {
  atInit: true,
  running: false
}

var openedDir = {
  list: [],
  shortened: [],
  addToList: function(x) {
    if (!this.list.includes(x) && x != "") {
      this.list.push(x);
      this._genShortened();
    }
  },
  _genShortened: function () {
    let listArray = this.list.map(d => d.split(path.sep));
    this.shortened = listArray.map(d => {
      let level = 0;
      while (listArray.filter(el => el.slice(-1-level).join(path.sep) == d.slice(-1-level).join(path.sep)).length > 1) {
        level += 1;
      }
      return d.slice(-1-level).join(path.sep);
    });
  },
  removeFromList: function (x) {
    if (this.list.includes(x)) {
      let xidx = this.list.indexOf(x);
      this.list.splice(xidx, 1);
      this._genShortened();
    }
  },
  getShortened: function (x) {
    if (this.list.includes(x)) {
      return this.shortened[this.list.indexOf(x)];
    } else {
      return -1;
    }
  }
}

var noteLocation = {
  local: true,
  remote: false,
  setLocal: function () {
    this.local = true;
    this.remote = false;
  },
  setRemote: function () {
    this.remote = true;
    this.local = false;
  },
  toggle: function () {
    this.local = !this.local;
    this.remote = !this.remote;
  }
}

var noteList = {
  local: [],
  remote: [],
  archive: {
    local: [],
    remote: []
  },
  updateLocal: function () {
    this.local = [];
    this.archive.local = [];
    openedDir.list.forEach(d => {
      fs.readdir(d, (err, files) => {
        if (err) {
          console.log(err);
          return;
        }
        let notes = 
          files
            .filter(f => f.endsWith(".manote"))
            .map(f => path.join(d, f))
            .filter(f => !this.local.map(el => el.id).includes(f))
            .map(file => {
              try {
                let noteData = JSON.parse(fs.readFileSync(file).toString());
                return new Note(file, noteData.created, noteData.modified, noteData);
              } catch (e) {
                console.log(e);
                return [];
              }
            });
        this.local = [...this.local, ...notes.filter(note => note !== [])];

        // list archive
        if (localSetting.hasArchive(d)) {
          this.archive.local = [...this.archive.local, ...localSetting.getArchive(d)];
        }
      })
    });
  },
  updateLocalArchive: function () {
    this.archive.local = [];
    openedDir.list.forEach(d => {
      fs.readdir(d, (err, files) => {
        if (err) {
          console.log(err);
          return;
        }
        if (localSetting.hasArchive(d)) {
          this.archive.local = [...this.archive.local, ...localSetting.getArchive(d)];
        }
      })
    });
  },
  createLocalNote: function (dirOfNew) {
    return new Promise((resolve, reject) => {
      let newFile = path.join(dirOfNew, "Untitled_");
      let i = 0;
      while (fs.existsSync(newFile + i + ".manote")) {
        i += 1;
      }
      newFile = newFile + i + ".manote";
      let newNote = new Note(newFile, null, null, localSetting.getDefault(dirOfNew));
      this.local.push(newNote);
      resolve(newNote);
    });
  },
  setRemote: function (notes) {
    return new Promise(resolve => {
      this.remote = 
        notes.map(el => new Note(el.id, el.created, el.modified, el)).concat(
          this.remote.filter(el => !notes.map(nt => nt.id).includes(el.id)).map(el => new Note(el.id, el.created, el.modified, el))
        );
      resolve();
    })
  },
  setRemoteArchive: function (notes) {
    return new Promise(resolve => {
      this.archive.remote = notes.map(el => new Note(el.id, el.created, el.modified, el))
      resolve();
    })
  },
  updateRemote: function () {
    return gd.getData().then((resp) => {
      return resp.data;
    }).then(notes => {
      console.log(notes);
      if (notes) {
        this.setRemote(notes);
      }
    }).catch(showErr)
  },
  createRemoteNote: function () {
    return gd.getDefault().then(df => {
      let newNote = new Note(generateRandomId(10,this.remote.map(el => el.id)), null, null, df.data);
      this.remote.push(newNote);
      return newNote;
    })
  },
  updateRemoteArchive: function () {
    return gd.getArchive().then(resp => {
      this.setRemoteArchive(resp.data);
      return resp;
    })
  },
  deleteFromRemoteArchive: function (nid) {
    this.archive.remote.splice(this.archive.remote.findIndex(el => el.id == nid), 1);
    return gd.deleteFromArchive([nid]).then(resp => {
      this.setRemoteArchive(resp.data);
      return resp;
    });
  },
  unarchiveRemote: function (nids) {
    nids.filter(nid => this.archive.remote.map(n => n.id).includes(nid)).map(nid => {
      let noteToRestore = this.archive.remote.splice(this.archive.remote.findIndex(el => el.id == nid), 1);
      this.remote.push(noteToRestore[0]);
    });
    return gd.unarchive(nids).then(resp => {
      console.log(resp);
      return Promise.all([
        this.setRemoteArchive(resp[0].data),
        this.setRemote(resp[1].data)
      ])
    }).then(() => { console.log(this.remote, this.archive.remote); });
  }
}





// new Vue({
//   el: "#body",
//   data: {
//     currentUser: currentUser,
//     stat: stat,
//     openedDir: openedDir,
//     noteLocation: noteLocation
//   },
//   methods: {
//     addDirectory: function (newDir) {
//       this.openedDir.addToList(newDir);
//       noteList.updateLocal();
//     },
//     removeDirectory: function (oldDir) {
//       this.openedDir.removeFromList(oldDir);
//       noteList.updateLocal();
//     },
//     setLocal: function () {
//       this.noteLocation.setLocal();
//     },
//     setRemote: function () {
//       this.noteLocation.setRemote();
//     }
//   }
// })

// new Vue({
//   el: "#navbar",
//   data: {
//     currentUser: currentUser,
//     stat: stat,
//     openedDir: openedDir,
//     noteLocation: noteLocation
//   },
//   methods: {
//     toggleSidebar: function () {
//       this.$refs.sidebar.toggle();
//     },
//     signInGoogle: function () {
//       gd.handleSignInClick();
//     },
//     signOutGoogle: function () {
//       gd.handleSignOutClick();
//     },
//     toggleMarkdownGuide: function () {
//       this.$refs.markdownguide.toggle();
//     },
//     addDirectory: function (newDir) {
//       this.openedDir.addToList(newDir);
//       noteList.updateLocal();
//     },
//     removeDirectory: function (oldDir) {
//       this.openedDir.removeFromList(oldDir);
//       noteList.updateLocal();
//     },
//     setLocal: function () {
//       this.noteLocation.setLocal();
//     },
//     setRemote: function () {
//       this.noteLocation.setRemote();
//     }
//   }
// })











new Vue({
  el: "#body",
  data: {
    currentUser: currentUser,
    stat: stat,
    tickedFiles: [],
    stored: stored,
    showFilter: false,
    filter: {
      sort: "",
      group: "",
      show: []
    },
    openedFile: {},
    fileToOpen: {},
    elToOpen: null,
    unsaved: {},
    viewEdit: false,
    fieldnameError: "",
    mdconverter: mdconverter,
    searchQuery: "",
    noteList: noteList,
    noteLocation: noteLocation,
    openedDir: openedDir,
    ddTitle: "",
    ddLocation: "",
    ddFormat: {},
    splitInst: null,
    archiveLocal: true,
    archiveListActions: [
      {
        action: "delete", 
        icon: "mdi-delete-forever",
        display: "Delete",
        tooltip: "delete"
      }, {
        action: "unarchive", 
        icon: "mdi-delete-restore",
        display: "Unarchive",
        tooltip: "unarchive"
      }, {
        action: "view",
        icon: "mdi-eye",
        tooltip: "view"
      }
    ],
    noteInMinimal: {},
    misc: misc
  },
  computed: {
    displayNoteList: function () {
      if (this.noteLocation.local) return this.noteList.local;
      else return this.noteList.remote;
    },
    hasUnsaved: function () {
      return JSON.stringify(this.unsaved) != JSON.stringify(this.openedFile);
    },
    archiveLocalList: function () {
      return this.noteList.archive.local.map(f => {
        return {
          title: path.parse(f).name,
          subtitle: path.parse(f).dir,
          value: f
        }
      });
    },
    archiveRemoteList: function () {
      return this.noteList.archive.remote.map(n => {
        return {
          title: n.Title ? n.Title.content : "",
          subtitle: "",
          value: n
        }
      })
    }
  },
  mounted: function () {
    window.addEventListener("resize", (ev) => {
      if (ev.currentTarget.innerWidth < 840) {
        if (this.splitInst) {
          this.splitInst.destroy();
          this.splitInst = null;
        }
      } else {
        if (!this.splitInst && this.unsaved.id) {
          this.splitInst = Split(["#list-container", "#note-container"], splitConfig);
        }
      }
    })
  },
  methods: {
    reload: function () {
      this.stat.running = true;
      if (this.noteLocation.local) {
        this.noteList.updateLocal();
        this.stat.running = false;
      } else {
        Promise.all([
          this.noteList.updateRemote(),
          this.noteList.updateRemoteArchive()
        ]).then(() => {
          this.stat.running = false;
        })
      }
    },
    addDirectory: function (newDir) {
      this.openedDir.addToList(newDir);
      noteList.updateLocal();
      localSetting.updateRecent(this.openedDir.list);
    },
    openDirectory: function (dir) {
      shell.openItem(dir);
    },
    removeDirectory: function (oldDir) {
      this.openedDir.removeFromList(oldDir);
      noteList.updateLocal();
      localSetting.updateRecent(this.openedDir.list);
    },
    setLocal: function () {
      this.noteLocation.setLocal();
    },
    setRemote: function () {
      this.noteLocation.setRemote();
    },
    openFile: function (file) {
      if (file.id == this.openedFile.id) {
        return;
      }
      if (Object.keys(this.unsaved).length > 0) {
        if (this.hasUnsaved) {
          this.$refs.modalUnsavedPrompt.toggle();
          this.fileToOpen = file;
          return;
        }
      }
      this.openedFile = file;
      this.unsaved = file.copy();
      this.$nextTick(() => {
        this.$refs.navbar.hide();
        this.$refs.noteContainer.show();
        this.$refs.listContainer.hide();
      });
      if (!this.splitInst && window.innerWidth > 840) 
        this.$nextTick(() => {
          this.splitInst = Split(["#list-container", "#note-container"], splitConfig);
        });
    },
    saveOrNot: function (toSave) {
      if (toSave) {
        this.saveNote();
      }
      this.openedFile = this.fileToOpen;
      this.unsaved = this.fileToOpen.copy();
    },
    navToList: function () {
      this.$refs.listContainer.classList.remove("hide-md");
      this.$refs.noteContainer.classList.add("hide-md");
    },
    discardSelection: function () {
      this.$refs.fileItem.forEach(el => {
        el.untick();
      });
      this.tickedFiles = [];
    },
    createNote: function (dirOfNew) {
      this.stat.running = true;
      if (this.noteLocation.local) {
        this.noteList.createLocalNote(dirOfNew)
          .then(newNote => la.updateNote(newNote))
          .then((nid) => {
            this.noteList.updateLocal();
            this.$nextTick(() => {
              this.$nextTick(() => {
                this.$refs.listContainer.selectFile(nid);
                this.stat.running = false;
              })
            });
          });
      } else {
        this.noteList.createRemoteNote()
          .then(newNote => gd.updateNote(newNote))
          .then(resp => this.noteList.setRemote(resp.data))
          .then(() => {
            this.stat.running = false
          });
      }
    },
    deleteNote: function (nid) {
      this.stat.running = true;
      let loc = this.noteLocation.local ? "local" : "remote";
      this.noteList[loc].splice(this.noteList[loc].findIndex(el => el.id == nid), 1);
      this.closeNote();
      let p;
      if (this.noteLocation.local) {
        p = la.removeNotes([nid]).then(() => this.noteList.updateLocal());
      } else {
        p = gd.removeNotes([nid]).then(resp => this.noteList.setRemote(resp.data));
      }
      p.then(() => {
        this.stat.running = false;
      }).catch(err => {
        console.log(err);
      })
    },
    deleteNotes: function (notes) {
      this.stat.running = true;
      let loc = this.noteLocation.local ? "local" : "remote";
      notes.forEach(note => {
        this.noteList[loc].splice(this.noteList[loc].findIndex(el => el.id == note.id), 1);
      });
      this.$refs.listContainer.discardSelection();
      if (this.noteList[loc].map(n => n.id).includes(this.openedFile.id)) {
        this.$nextTick(() => { this.$refs.listContainer.selectFile(this.openedFile.id) });
      } else {
        this.closeNote();
      }
      let p;
      if (this.noteLocation.local) {
        p = la.removeNotes(notes.map(note => note.id)).then(() => this.noteList.updateLocal());
      } else {
        p = gd.removeNotes(notes.map(note => note.id)).then(resp => this.noteList.setRemote(resp.data));
      }
      p.then(() => { 
        this.stat.running = false;
      });
    },
    addNewFields: function (newFields) {
      newFields.order.forEach(el => {
        this.unsaved.addNewField(el, newFields[el].type);
      });
    },
    saveNote: function () {
      this.unsaved.modifiedOn(new Date());
      this.openedFile.updateFrom(this.unsaved);
      console.log("saving note");
      this.stat.running = true;
      if (this.noteLocation.local) {
        ls.updateNote(this.openFile).then(() => {
          console.log("note saved");
          this.noteList.updateLocal();
        }, showErr).then(() => { this.stat.running = false });
      } else {
        gd.updateNote(this.openedFile).then(res => {
          console.log(res);
          this.noteList.setRemote(res.data);
        }, showErr).then(res => { this.stat.running = false });
      }
    },
    discardUnsaved: function () {
      this.unsaved.updateFrom(this.openedFile);
    },
    sortNotes: function (shiftFrom, shiftTo) {
      this.stat.running = true;
      gd.sortNote(this.noteList.remote[shiftFrom].id, shiftTo).then((resp) => this.noteList.setRemote(resp.data)).then(res => { this.stat.running = false });
      if (this.noteLocation.local) {}
      else {
        this.noteList.remote.splice(shiftTo, 0, this.noteList.remote[shiftFrom]);
        if (shiftTo < shiftFrom) shiftFrom += 1;
        this.noteList.remote.splice(shiftFrom, 1);
      }
    },
    renameOpenedFile: function (newName) {
      fs.rename(this.openedFile.id, newName, (err) => {
        if (err) throw err;
        this.noteList.local.find(el => el.id == this.openedFile.id).id = newName;
        this.$set(this.openedFile, "id", newName);
        this.$set(this.unsaved, "id", newName);
      });
    },
    archive: function (nid) {
      this.stat.running = true;
      let loc = this.noteLocation.local ? "local" : "remote";
      this.noteList[loc].splice(this.noteList[loc].findIndex(el => el.id == nid), 1);
      this.closeNote();
      if (this.noteLocation.local) {
        localSetting.archive(nid)
          .then(() => {
            this.noteList.updateLocalArchive();
            this.stat.running = false;
          });
      } else {
        gd.moveToArchive([nid])
          .then(() => {
            this.noteList.updateRemoteArchive();
            this.stat.running = false;
          });
      }
    },
    archiveNotes: function (notes) {
      this.stat.running = true;
      let loc = this.noteLocation.local ? "local" : "remote";
      notes.forEach(note => {
        this.noteList[loc].splice(this.noteList[loc].findIndex(el => el.id == note.id), 1);
      });
      this.$refs.listContainer.discardSelection();
      if (this.noteList[loc].map(n => n.id).includes(this.openedFile.id)) {
        this.$nextTick(() => { this.$refs.listContainer.selectFile(this.openedFile.id) });
      } else {
        this.closeNote();
      }
      if (this.noteLocation.local) {
        Promise.all(notes.map(note => 
          localSetting.archive(note.id)
        )).then(() => {
          this.noteList.updateLocalArchive();
          this.stat.running = false;
        });
      } else {
        gd.moveToArchive(notes.map(note => note.id)).then(() => {
          this.$nextTick(() => {
            this.noteList.updateRemoteArchive();
          });
          this.stat.running = false;
        })
      }
    },
    unarchive: function (f) {
      this.stat.running = true;
      if (typeof(f) == "string") {
        localSetting.unarchive(f)
          .then((newFile) => {
            this.noteList.updateLocal();
            this.closeNote();
            this.stat.running = false;
          })
      } else {
        this.noteList.unarchiveRemote([f.id])
          .then(() => {
            this.closeNote();
            this.stat.running = false;
          });
      }
    },
    closeNote: function () {
      if (this.$refs.noteContainer) this.$refs.noteContainer.hide();
      this.$refs.navbar.show();
      if (this.$refs.listContainer) {
        this.$refs.listContainer.show();
        this.$refs.listContainer.unselectAllItems();
      }
      this.$set(this, "unsaved", {});
      this.$set(this, "openedFile", {});
      if (this.splitInst) {
        this.splitInst.destroy();
        this.splitInst = null;
      }
    },
    showLocalArchive: function () {
      this.archiveLocal = true;
      this.$nextTick(() => { this.$refs.archive.toggle() });
    },
    showRemoteArchive: function () {
      this.archiveLocal = false;
      this.$nextTick(() => { this.$refs.archive.toggle() });
    },
    getFormat: function () {
      let defaultFormat = this.openedFile.copy();
      for (let k in defaultFormat) {
        if (defaultFormat[k].type) {
          defaultFormat[k].content = "";
        } else if (k !== "order") {
          defaultFormat[k] = "";
        }
      }
      return defaultFormat;
    },
    setDefault: function () {
      this.stat.running = true;
      if (this.noteLocation.local) {
        localSetting.setDefault(path.dirname(this.openedFile.id), this.getFormat());
        this.stat.running = false;
      } else {
        gd.setDefault(this.getFormat()).then(() => {
          this.stat.running = false;
        });
      }
    },
    setGlobalDefault: function () {
      localSetting.setGlobalDefault(this.getFormat());
    },
    showDirDefault: function () {
      this.$refs.selectDirForDefault.toggle();
    },
    showThisDirDefault: function (selectedDir) {
      if (!fs.existsSync(localSetting.getDirDefaultLocation(selectedDir))) {
        localSetting.setDefault(selectedDir, Note.createWithFields(defaultDefault));
        console.log("create directory default in " + selectedDir);
        this.$nextTick(() => { this.showThisDirDefault(selectedDir); });
      } else {
        console.log(localSetting.getDirDefault(selectedDir));
        this.ddTitle = "Directory Default";
        this.ddLocation = localSetting.getDirDefaultLocation(selectedDir);
        this.ddFormat = localSetting.getDirDefault(selectedDir);
        this.$nextTick(() => this.$refs.defaultDisplay.toggle());
      }
    },
    showGlobalDefault: function () {
      if (!fs.existsSync(localSetting.getGlobalDefaultLocation())) {
        localSetting.setGlobalDefault(Note.createWithFields(defaultDefault));
        console.log("create global default");
        this.$nextTick(() => { this.showGlobalDefault(); });
      } else {
        console.log(localSetting.getGlobalDefault());
        this.ddTitle = "Global Default";
        this.ddLocation = localSetting.getGlobalDefaultLocation();
        this.ddFormat = localSetting.getGlobalDefault();
        this.$nextTick(() => this.$refs.defaultDisplay.toggle());
      }
    },
    showRemoteDefault: function () {
      this.stat.running = true;
      gd.getDefault().then(resp => {
        this.ddTitle = "Drive Default";
        this.ddLocation = "Google Drive";
        this.ddFormat = resp.data;
        this.$nextTick(() => {
          this.$refs.defaultDisplay.toggle();
          this.stat.running = false;
        });
      })
    },
    saveDefault: function(x) {
      this.stat.running = true;
      if (this.ddLocation == "Google Drive") {
        gd.setDefault(this.ddFormat).then(() => {
          this.stat.running = false;
        });
      } else {
        localSetting.setDefault(path.dirname(this.ddLocation), this.ddFormat);
        this.stat.running = false;
      }
    },
    deleteArchive: function (f) {
      this.stat.running = true;
      if (typeof(f) == "string") {
        fs.unlinkSync(f);
        this.noteList.updateLocalArchive();
        this.stat.running = false;
      } else {
        this.noteList.deleteFromRemoteArchive(f.id).then(() => {
          this.stat.running = false;
        });
      }
    },
    viewArchive: function (f) {
      if (typeof(f) == "string") {
        this.noteInMinimal = {
          title: path.parse(f).name,
          subtitle: path.parse(f).dir,
          content: JSON.parse(fs.readFileSync(f))
        }
        this.$refs.minimalNote.toggle();
      } else {
        this.noteInMinimal = {
          title: f.Title ? f.Title.content : "",
          subtitle: "",
          content: f
        }
        this.$refs.minimalNote.toggle();
      }
    },
    signInGoogle: function () {
      this.$refs.signInUi.toggle();
    },
    authenticate: function (code) {
      gd.authenticateWith(code)
        .then(afterSignIn)
        .then(() => {
          this.$refs.signInUi.toggle();
          this.misc.authError = "";
        })
        .catch(err => {
          console.error(err);
          this.misc.authError = "Error in token. Please re-authenticate to get new token."
        });
    },
    signOutGoogle: function () {
      gd.signOut()
        .then(() => {
          currentUser.name = null;
          currentUser.email = null;
          currentUser.profilePic = null;
          this.noteList.remote = [];
        })
        .then(() => gd.getAuthUrl())
        .then(authUrl => {
          misc.authUrl = authUrl;
        });
    }
  }
})

// function updateList(notes) {
//   noteList.remote = 
//     notes.map(el => new Note(el.id, el.created, el.modified, el)).concat(
//       noteList.remote.filter(el => !notes.map(nt => nt.id).includes(el.id)).map(el => new Note(el.id, el.created, el.modified, el))
//     )
// }

// function refreshList() {
//   stat.running = true;
//   return gd.getData().then((resp) => {
//     if (resp.status == 200) {
//       return resp.data;
//     } else {
//       throw resp.statusText;
//     }
//   }).then((res) => {
//     console.log(res);
//     if (res) {
//       updateList(res);
//     }
//   }).catch(showErr)
//   .then(res => { 
//     stat.running = false;
//     stat.atInit = false;
//   });
// }

la = new LAccess();

localSetting.getRecent().forEach(d => {
  openedDir.addToList(d);
});
noteList.updateLocal();


// google drive
function afterSignIn(cUser) {
  currentUser.name = cUser.displayName;
  currentUser.email = cUser.emailAddress;
  currentUser.profilePic = cUser.photoLink;
  return Promise.all([ noteList.updateRemote(), noteList.updateRemoteArchive() ]);
}

gd = new GDrive();
gd.signInInit()
.then(afterSignIn)
.catch((err) => {
  console.error(err);
  return gd.getAuthUrl()
    .then(authUrl => {
      misc.authUrl = authUrl;
    });
})