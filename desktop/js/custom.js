const {mdconverter, mdguides} = require("./js/md.js");
const Vue = require("./js/vue.js");
const GDrive = require("./js/google-drive-access.js");
const {Note} = require("./js/note.js");
const {generateRandomId,showErr} = require("./js/misc.js");
const fs = require("fs");
const path = require("path");
const localSetting = require("./js/get-local.js");
const {shell} = require("electron");
const Split = require("split.js");

// const field = require("./vue/field.js");
// Vue.component("field-single", field.single);
// Vue.component("field-multiple", field.multiple);
// Vue.component("field-datetime", field.datetime);
// Vue.component("field-tags", field.tags);

Vue.component("list-container", require("./vue/list-container.js"));
Vue.component("note-container", require("./vue/note-container.js"));

Vue.component("navbar", require("./vue/navbar.js"));
Vue.component("sidebar", require("./vue/sidebar.js"));
// Vue.component("file-item", require("./vue/file-item.js"));
Vue.component("list-selection", require("./vue/list-selection.js"));
// Vue.component("modal-sortnote", require("./vue/modal-sortnote.js"));
// Vue.component("search-bar", require("./vue/search-bar.js"));
// Vue.component("input-header", require("./vue/input-header.js"));
// Vue.component("input-datetime", require("./vue/input-datetime.js"));
// Vue.component("display-datetime", require("./vue/display-datetime.js"));
// Vue.component("modal-newfield", require("./vue/modal-newfield.js"));
// Vue.component("modal-sortfields", require("./vue/modal-sortfields.js"));
Vue.component("modal-loading", require("./vue/modal-loading.js"));
Vue.component("modal-unsavedprompt", require("./vue/modal-unsavedprompt.js"));
Vue.component("md-guide", require("./vue/md-guide.js"));
Vue.component("directory-chooser", require("./vue/directory-chooser.js"));
Vue.component("fields-display", require("./vue/fields-display.js"));
Vue.component("list-display", require("./vue/list-display.js"));
Vue.component("minimal-note-display", require("./vue/minimal-note-display.js"));

const separator = "\n" + "-".repeat(10) + "0qp4BCBHLoHfkIi6N1hgeXNaZg20BB0sNZ4k8tE6eWKmTa1CkE" + "-".repeat(10) + "\n\n";
var currentUser = {
  name: null,
  email: null,
  profilePic: null
}

var stored = {
  noteList: []  
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
    noteInMinimal: {}
  },
  computed: {
    displayNoteList: function () {
      if (this.noteLocation.local) return this.noteList.local;
      else return this.noteList.remote;
    },
    hasUnsaved: function () {
      return JSON.stringify(this.unsaved) != JSON.stringify(this.openedFile);
    },
    // sortableFields: function () { 
    //   return Array.from( 
    //     new Set(
    //       this.stored.noteList.map(el =>  
    //         Object.keys(el).filter(k => 
    //           ['created', 'modified'].includes(k) || 
    //           ( el[k].type && ["single", "datetime"].includes(el[k].type) )
    //         ) 
    //       ).reduce((acc, el) => acc.concat(el), [])
    //     ) 
    //   ); 
    // }, 
    // groupableFields: function () { 
    //   return Array.from( 
    //     new Set( 
    //       this.stored.noteList.map(el =>  
    //         Object.keys(el).filter(k =>  
    //           el[k].type && ["tags"].includes(el[k].type) 
    //         ) 
    //       ).reduce((acc, el) => acc.concat(el), []) 
    //     ) 
    //   ); 
    // },
    // availableGroups: function () {
    //   return this.groupableFields.map(field => 
    //     [...Array.from(
    //       new Set (
    //         this.stored.noteList.map(el => 
    //           el[field] ? el[field].content : []
    //         ).reduce((acc, el) => acc.concat(el), [])
    //       )
    //     ), "-- No field or no group"]
    //   );
    // },
    sortedNoteIdx: function () {
      let indices = [...this.stored.noteList.keys()];
      if (this.filter.sort) {
        let sortable = indices.filter((v) => this.stored.noteList[v].hasOwnProperty(this.filter.sort));
        let unsortable = indices.filter((v) => !this.stored.noteList[v].hasOwnProperty(this.filter.sort));
        sortable.sort((a,b) => {
          let itemA = this.stored.noteList[a][this.filter.sort];
          let itemB = this.stored.noteList[b][this.filter.sort];
          itemA = itemA.type ? itemA.content : itemA;
          itemB = itemB.type ? itemB.content : itemB;
          if (itemA < itemB) return -1;
          else if (itemA > itemB) return 1;
          else return 0;
        });
        return [...sortable, ...unsortable];
      } else {
        return indices;
      }
    },
    archiveList: function () {
      if (this.noteLocation.local) {
        return this.noteList.archive.local.map(f => {
          return {
            title: path.parse(f).name,
            subtitle: path.parse(f).dir,
            value: f
          }
        });
      } else {
        return [];
      }
    }
  },
  methods: {
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
    addTick: function (fileId) {
      console.log("ticking", fileId);
      this.tickedFiles.push(fileId);
    },
    removeTick: function (fileId) {
      console.log("remove tick", fileId);
      this.tickedFiles = this.tickedFiles.filter(item => item !== fileId);
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
      if (!this.splitInst) 
        this.$nextTick(() => {
          this.splitInst = Split(["#list-container", "#note-container"], {
            sizes: [35,65],
            minSize: [230,230],
            gutterSize: 7,
            snapOffset: 0
          });
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
    addNewNote: function () {
      // this.stored.noteList.push(new Note(generateRandomId(10, this.stored.noteList.map(el => el.id))));
      if (this.noteLocation.local) {
        this.$refs.dirOfNew.toggle();
      }
    },
    createLocalNote: function (dirOfNew) {
      let newFile = path.join(dirOfNew, "Untitled_");
      let i = 0;
      while (fs.existsSync(newFile + i + ".manote")) {
        i += 1;
      }
      newFile = newFile + i + ".manote";
      (new Note(newFile, null, null, localSetting.getDefault(dirOfNew))).saveToFile(newFile);
      noteList.updateLocal();
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$refs.listContainer.selectFile(newFile);
        })
      });
    },
    deleteLocalNotes: function (notes) {
      Promise.all(notes.map(note => {
        return new Promise((resolve, reject) => {
          fs.unlink(note, err => { 
            if (err) reject(err); 
            resolve();
          });
        });
      })).then(() => {
        noteList.updateLocal();
        this.$refs.listContainer.discardSelection();
      });
    },
    deleteNotes: function () {
      this.stored.noteList = this.stored.noteList.filter(el => !this.tickedFiles.includes(el.id));
      this.stat.running = true;
      gd.removeNotes(this.tickedFiles).then(res => {
        console.log(res);
        updateList(res);
      }, showErr).then(res => { this.stat.running = false });
      this.discardSelection();
    },
    updateTags(ev, name) {
      if (ev.key == "," || ev.key == "Enter") {
        ev.preventDefault();
        if (ev.target.value != "") {
          if (!this.unsaved[name].content.includes(ev.target.value)) {
            this.unsaved[name].content.push(ev.target.value);
          }
          ev.target.value = "";
        }
      }
    },
    removeTag(name, tag) {
      this.unsaved[name].content.splice(this.unsaved[name].content.findIndex(el => el == tag), 1);
    },
    changeDateTime(ev, name) {
      console.log(ev.target.value, name);
    },
    addNewFields: function (newFields) {
      newFields.order.forEach(el => {
        this.unsaved.addNewField(el, newFields[el].type);
      });
    },
    removeField: function (name) {
      this.unsaved.removeField(name);
    },
    switchView: function (ev) {
      for (let child of this.$refs.viewSwitcher.children) {
        if (child == ev.target || child.firstElementChild == ev.target) {
          child.classList.add("active");
          this.viewEdit = child == this.$refs.editView;
        } else {
          child.classList.remove("active");
        }
      }
    },
    saveNote: function () {
      this.unsaved.modifiedOn(new Date());
      // console.log("unsaved", JSON.stringify(this.unsaved, null, 2));
      this.openedFile.updateFrom(this.unsaved);
      // console.log("openedFile", JSON.stringify(this.openedFile, null, 2));
      console.log("saving note");
      this.stat.running = true;
      if (this.noteLocation.local) {
        fs.writeFile(this.openedFile.id, JSON.stringify(this.openedFile, null, 2), (err) => {
          if (err) throw err;
          console.log("note saved");
          this.stat.running = false;
        });
      } else {
        gd.updateNote(this.openedFile).then(res => {
          console.log(res);
          updateList(res);
        }, showErr).then(res => { this.stat.running = false });
      }
    },
    discardUnsaved: function () {
      // console.log(JSON.stringify(this.unsaved), JSON.stringify(this.openedFile));
      this.unsaved.updateFrom(this.openedFile);
    },
    sortNotes: function (shiftFrom, shiftTo) {
      this.stat.running = true;
      gd.sortNote(stored.noteList[shiftFrom].id, shiftTo).then(updateList).then(res => { this.stat.running = false });
      stored.noteList.splice(shiftTo, 0, stored.noteList[shiftFrom]);
      if (shiftTo < shiftFrom) shiftFrom += 1;
      stored.noteList.splice(shiftFrom, 1);
    },
    matchSearch: function (note) {
      return this.searchQuery.split().some(el => Object.keys(note).filter(k => note[k].type).map(k => k + " " + note[k].content).join(" ").toLowerCase().indexOf(el.toLowerCase()) > -1);
    },
    resizeTA: function (ev, name) {
      this.$set(this.unsaved[name], "height", window.getComputedStyle(ev.target).height);
    },
    renameOpenedFile: function (newName) {
      fs.rename(this.openedFile.id, newName, (err) => {
        if (err) throw err;
        this.noteList.local.find(el => el.id == this.openedFile.id).id = newName;
        this.$set(this.openedFile, "id", newName);
        this.$set(this.unsaved, "id", newName);
      });
    },
    archive: function (filepath) {
      localSetting.archive(filepath)
        .then(() => {
          this.noteList.local.splice(this.noteList.local.findIndex(el => el.id == filepath), 1);
          this.noteList.updateLocalArchive();
          this.$set(this, "unsaved", {});
          this.$set(this, "openedFile", {});
          this.splitInst.destroy();
          this.splitInst = null;
        });
    },
    archiveLocalNotes: function (notes) {
      this.stat.running = true;
      Promise.all(notes.map(note => 
        localSetting.archive(note.id)
      )).then(() => {  
        this.noteList.updateLocal();
        this.$refs.listContainer.discardSelection();
        this.$set(this, "unsaved", {});
        this.$set(this, "openedFile", {});
        if (this.splitInst) {
          this.splitInst.destroy();
          this.splitInst = null;
        }
        this.stat.running = false;
      });
    },
    unarchive: function (f) {
      localSetting.unarchive(f)
        .then((newFile) => {
          this.noteList.updateLocal();
          this.$set(this, "unsaved", {});
          this.$set(this, "openedFile", {});
          if (this.splitInst) {
            this.splitInst.destroy();
            this.splitInst = null;
          }
        })
    },
    closeNote: function () {
      this.$set(this, "unsaved", {});
      this.$set(this, "openedFile", {});
      this.splitInst.destroy();
      this.splitInst = null;
    },
    showArchive: function () {
      this.$refs.archive.toggle();
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
      localSetting.setDefault(path.dirname(this.openedFile.id), this.getFormat());
    },
    setGlobalDefault: function () {
      localSetting.setGlobalDefault(this.getFormat());
    },
    showDirDefault: function () {
      this.$refs.selectDirForDefault.toggle();
    },
    showThisDirDefault: function (selectedDir) {
      if (!fs.existsSync(localSetting.getDirDefaultLocation(selectedDir))) {
        localSetting.setDefault(selectedDir, new Note("discard"));
        console.log("create directory default in " + selectedDir);
        this.showThisDirDefault(selectedDir);
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
        localSetting.setGlobalDefault(new Note("discard"));
        console.log("create global default");
        this.showGlobalDefault();
      } else {
        console.log(localSetting.getGlobalDefault());
        this.ddTitle = "Global Default";
        this.ddLocation = localSetting.getGlobalDefaultLocation();
        this.ddFormat = localSetting.getGlobalDefault();
        this.$nextTick(() => this.$refs.defaultDisplay.toggle());
      }
    },
    saveDefault: function(x) {
      localSetting.setDefault(path.dirname(this.ddLocation), this.ddFormat);
    },
    deleteArchive: function (f) {
      fs.unlinkSync(f);
      this.noteList.updateLocalArchive();
    },
    viewArchive: function (f) {
      this.noteInMinimal = {
        title: path.parse(f).name,
        subtitle: path.parse(f).dir,
        content: JSON.parse(fs.readFileSync(f))
      }
      this.$refs.minimalNote.toggle();
    }
  }
})

function updateList(notes) {
  stored.noteList = 
    notes.map(el => new Note(el.id, el.created, el.modified, el)).concat(
      stored.noteList.filter(el => !notes.map(nt => nt.id).includes(el.id)).map(el => new Note(el.id, el.created, el.modified, el))
    )
}

function refreshList() {
  stat.running = true;
  return gd.getData().then((res) => {
    if (res.status == 200) {
      return res.result;
    } else {
      throw res.status;
    }
  }).then((res) => {
    console.log(res);
    if (res) {
      updateList(res);
    }
  }, showErr).then(res => { 
    stat.running = false;
    stat.atInit = false;
  });
}

function initApis() {
  gd = new GDrive();
  gd.signedInFunction = () => {
    let gUser = gd.getUserProfile();
    currentUser.name = gUser.getName();
    currentUser.email = gUser.getEmail();
    currentUser.profilePic = gUser.getImageUrl();
    refreshList();
  }

  gd.signedOutFunction = () => {
    currentUser.name = null;
    currentUser.email = null;
    currentUser.profilePic = null;
  }

  gd.signedInAtInit = () => {
    document.querySelectorAll(".sidebar")[0].classList.remove("active");
  }

  gd.signedOutAtInit = () => {
    document.querySelectorAll(".sidebar")[0].classList.add("active");
  }
}

localSetting.getRecent().forEach(d => {
  openedDir.addToList(d);
});
noteList.updateLocal();