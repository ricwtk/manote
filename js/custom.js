const separator = "\n" + "-".repeat(10) + "0qp4BCBHLoHfkIi6N1hgeXNaZg20BB0sNZ4k8tE6eWKmTa1CkE" + "-".repeat(10) + "\n\n";

var currentUser = {
  name: null,
  email: null,
  profilePic: null
}

var stored = {
  fileList: []  
}

class Field {
  constructor(type, content) {
    this.type = type ? type : "single"; // single, multiple, datetime, tags
    switch (this.type) {
      default:
      case "single": 
        this.content = content ? content : "";
        break;
      case "multiple":
        this.content = content ? content : "";
        break;
      case "datetime":
        this.content = content ? content : (new Date()).toISOString().substr(0,16);
        break;
      case "tags":
        this.content = content ? [ ...Array.isArray(content) ? content : [ content ] ] : [];
        break;
    }
  }
}

class Note {
  constructor(id, createdOn, modifiedOn, Title, Content, others) {
    this.id = id;
    this.createdOn = createdOn ? createdOn : new Date();
    this.modifiedOn = modifiedOn ? modifiedOn : this.createdOn;
    this.addNewField("Title", "single", Title ? Title : "Untitled");
    this.addNewField("Content", "multiple", Content ? Content : "");
    this.addNewField("Categories", "tags");
    if (others) {
      Object.keys(others).forEach((el) => {
        if (others[el].type) this.addNewField(el, others[el].type, others[el].content);
      })
    }
  }

  addNewField(name, type, content) {
    Vue.set(this, name, new Field(type, content));
    // this[name] = new Field(type, content);
  }

  updateField(name, content) {
    if (!this[name]) return null;
    if (content == undefined) {
      console.error("content must be specified in Note.updateField(name, content)");
    }
    switch (this[name].type) {
      default:
      case "single": 
      case "multiple":
        this[name].content = content;
        break;
      case "tags":
        this[name].content = [ ...Array.isArray(content) ? content : [ content ] ];
        break;
    }
  }

  removeField(name) {
    Vue.delete(this, name);
  }

  copy() {
    return new Note(this.id, this.createdOn, this.modifiedOn, null, null, this);
  }

  updateFrom(anotherNote) {
    let keysInAnotherNote = Object.keys(anotherNote);
    keysInAnotherNote.map(aNkey => {
      if (!["id", "createdOn", "modifiedOn"].includes(aNkey)) {
        if (!this[aNkey]) {
          console.log(aNkey);
          this.addNewField(aNkey, anotherNote[aNkey].type, anotherNote[aNkey].content);
        } else if (JSON.stringify(this[aNkey]) != JSON.stringify(anotherNote[aNkey])) {
          this.updateField(aNkey, anotherNote[aNkey].content);
        }
      }
    });
    Object.keys(this).filter(key => !keysInAnotherNote.includes(key)).forEach(key => {
      this.removeField(key);
    })
  }
}

function generateRandomId(n, except) {
  let rand;
  do {
    rand = Math.random().toString(36).substr(2);
    while (rand.length < n) {
      rand += Math.random().toString(36).substr(2);
    }
  } while (except.includes(rand))
  return rand;
}

function showErr(err) {
  console.log(err);
}

new Vue({
  el: "#navbar",
  data: {
    currentUser: currentUser
  },
  methods: {
    toggleSidebar: function () {
      if (currentUser.name) {
        this.$refs.sidebar.classList.toggle("active");
      }
    },
    signInGoogle: function () {
      gd.handleSignInClick();
    },
    signOutGoogle: function () {
      gd.handleSignOutClick();
    }
  }
})

Vue.component("file-item", {
  props: ["file"],
  data: function () {
    return {
    }
  },
  methods: {
    openFile: function (ev) {
      this.$emit("open-file", this.file, this.$refs.root);
    },
    tickFile: function (ev) {
      if (ev.target == this.$refs.ticked) {
        if (ev.target.checked) this.$emit("add-tick", this.file.id);
        else this.$emit("remove-tick", this.file.id);
      }
    }
  },
  template: `
  <div class="tile tile-centered p-2" @click="openFile" ref="root">
    <div class="tile-icon">
      <label class="form-checkbox" @click.stop="tickFile">
        <input type="checkbox" ref="ticked">
        <i class="form-icon"></i>
      </label>
    </div>
    <div class="tile-content">
      <div class="tile-title">{{ file.Title.content }}</div>
      <div class="tile-subtitle text-gray text-ellipsis">{{ file.Content.content }}</div>
    </div>
  </div>
  `
})

Vue.component("input-header", {
  props: ["title", "removable", "label-for"],
  methods: {
    remove: function (ev) {
      console.log(ev.target);
      this.$emit("remove");
    }
  },
  template: `
    <label class="input-header divider" :for="labelFor" data-content="">
      <div class="content text-gray">
        <div>{{ title }}</div>
        <div class="mdi mdi-close" v-if="removable" @click.prevent="remove"></div>
      </div>
    </label>
  `
})

Vue.component("input-datetime", {
  props: ["value"],
  data: function () {
    return {
      removedDate: "",
      removedTime: "",
      limits: {
        year: [1970, 2100],
        month: [1, 12],
        day: [1, 31],
        hour: [0, 23],
        minute: [0, 59]
      },
      ndig: {
        year: 4,
        month: 2,
        day: 2,
        hour: 2,
        minute: 2
      }
    }
  },
  computed: {
    dateDisabled: function () {
      return this.value.substr(0,10) == "-".repeat(10);
    },
    timeDisabled: function () {
      return this.value.substr(-5) == "-".repeat(5);
    }
  },
  methods: {
    getCurrentDate: function () {
      return this.$refs.year.value + "-" + this.$refs.month.value + "-" + this.$refs.day.value;
    },
    getCurrentTime: function () {
      return this.$refs.hour.value + ":" + this.$refs.minute.value;
    },
    selectThis: function (ev) {
      ev.target.selectionStart = 0;
      ev.target.selectionEnd = -1;
    },
    toggleDate: function () {
      if (this.dateDisabled) {
        if (this.removedDate !== "") {
          this.$emit("input", this.removedDate + "T" + this.getCurrentTime());
        } else {
          this.$emit("input", new Date().toISOString().substr(0,10) + "T" + this.getCurrentTime());
        }
      } else {
        this.removedDate = this.value.substr(0,10);
        this.$emit("input", "-".repeat(10) + "T" + this.getCurrentTime());
      }
    },
    toggleTime: function () {
      if (this.timeDisabled) {
        if (this.removedTime !== "") {
          this.$emit("input", this.getCurrentDate() + "T" + this.removedTime);
        } else {
          this.$emit("input", this.getCurrentDate() + "T" + new Date().toISOString().substr(11,5));
        }
      } else {
        this.removedTime = this.value.substr(-5);
        this.$emit("input", this.getCurrentDate() + "T" + "-".repeat(5));
      }
    },
    limitValue: function (val, sect) {
      val = val < this.limits[sect][0] ? this.limits[sect][0] : val;
      val = val > this.limits[sect][1] ? this.limits[sect][1] : val;
      return val.toString().padStart(2, "0");
    },
    updateLimits: function (changedSect) {
      if (changedSect == "year" || changedSect == "month") {
        let year = parseInt(this.$refs.year.value);
        let month = parseInt(this.$refs.month.value);
        this.limits.day[1] = new Date(year, month, 0).getDate();
        this.$refs.day.value = this.limitValue(this.$refs.day.value, "day");
      }
    }, 
    updateInput: function (ev, sect) {
      let newVal, newLoc;
      if (ev.keyCode > 47 && ev.keyCode < 58) { // 0-9
        let loc = ev.target.selectionStart;
        let val = ev.target.value.split("");
        if (loc >= this.ndig[sect]) {
          loc = 0;
        }
        val.splice(loc, 1, ev.key);
        newLoc = loc + 1;
        newVal = val.join("");
      }
      if (ev.keyCode == 38) // up
        newVal = parseInt(ev.target.value) + 1;
      if (ev.keyCode == 40) // down
        newVal = parseInt(ev.target.value) - 1;

      if (newVal) {
        ev.target.value = this.limitValue(newVal, sect);
        this.updateLimits(sect);
      }
      if (newLoc) {
        ev.target.selectionStart = newLoc;
        ev.target.selectionEnd = newLoc;
      }
      if (![9,18,35,36,37,39].includes(ev.keyCode) && !(ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey)) { // tab, alt, end, home, left, right
        ev.preventDefault();
      }
      this.$emit("input", this.$refs.year.value + "-" + this.$refs.month.value + "-" + this.$refs.day.value + "T" + this.$refs.hour.value + ":" + this.$refs.minute.value);
    }
  },
  mounted: function () {
    this.updateLimits("year");
  },
  template: `
    <div class="input-datetime form-input">
      <div class="input-group col-6 col-md-12">
        <div :class="['mdi', 'mdi-calendar', dateDisabled ? 'text-error' : 'text-success']" @click="toggleDate"></div>
        <input type="text" ref="year" :disabled="dateDisabled" class="invisible-form-input text-center four-digits" :value="value.substr(0,4)" @keydown="updateInput($event,'year')" @click="selectThis">
        <div>-</div>
        <input type="text" ref="month" :disabled="dateDisabled" class="invisible-form-input text-center two-digits" :value="value.substr(5,2)" @keydown="updateInput($event,'month')" @click="selectThis">
        <div>-</div>
        <input type="text" ref="day" :disabled="dateDisabled" class="invisible-form-input text-center two-digits" :value="value.substr(8,2)" @keydown="updateInput($event,'day')" @click="selectThis">
      </div>
      <div class="input-group col-6 col-md-12">
        <div :class="['mdi', 'mdi-clock', timeDisabled ? 'text-error' : 'text-success']" @click="toggleTime"></div>
        <input type="text" ref="hour" :disabled="timeDisabled" class="invisible-form-input text-center two-digits" :value="value.substr(-5,2)" @keydown="updateInput($event,'hour')" @click="selectThis">
        <div>:</div>
        <input type="text" ref="minute" :disabled="timeDisabled" class="invisible-form-input text-center two-digits" :value="value.substr(-2)" @keydown="updateInput($event,'minute')" @click="selectThis">
      </div>
    </div>
  `
});

Vue.component("display-datetime", {
  props: ["value"],
  computed: {
    dateDisabled: function () {
      return this.value.substr(0,10) == "-".repeat(10);
    },
    timeDisabled: function () {
      return this.value.substr(-5) == "-".repeat(5);
    }
  },
  template: `
  <div class="input-datetime">
    <div class="input-group col-6 col-md-12">
      <div :class="['mdi', 'mdi-calendar', dateDisabled ? 'text-error' : 'text-success']"></div>
      <div class="text-center four-digits">{{ value.substr(0,4) }}</div>
      <div>-</div>
      <div class="text-center two-digits">{{ value.substr(5,2) }}</div>
      <div>-</div>
      <div class="text-center two-digits">{{ value.substr(8,2) }}</div>
    </div>
    <div class="input-group col-6 col-md-12">
      <div :class="['mdi', 'mdi-clock', timeDisabled ? 'text-error' : 'text-success']"></div>
      <div class="text-center two-digits">{{ value.substr(-5,2) }}</div>
      <div>:</div>
      <div class="text-center two-digits">{{ value.substr(-2) }}</div>
    </div>
  </div>
  `
})

new Vue({
  el: "#note-list-and-display",
  data: {
    tickedFiles: [],
    stored: stored,
    openedFile: {},
    unsaved: {},
    viewEdit: false,
    fieldnameError: "",
    mdconvert: new showdown.Converter()
  },
  methods: {
    addTick: function (fileId) {
      console.log("ticking", fileId);
      this.tickedFiles.push(fileId);
    },
    removeTick: function (fileId) {
      console.log("remove tick", fileId);
      this.tickedFiles = this.tickedFiles.filter(item => item !== fileId);
    },
    openFile: function (file, el) {
      console.log("opening", file.id);
      this.openedFile = file;
      // this.unsaved = JSON.parse(JSON.stringify(file));
      this.unsaved = file.copy();
      let previousselected = this.$el.querySelector(".tile.selected")
      if (previousselected)
        previousselected.classList.remove("selected");
      el.classList.add("selected");
    },
    discardSelection: function () {
      document.querySelectorAll(".list-container input[type='checkbox']").forEach(el => {
        el.checked = false;
      });
      this.tickedFiles = [];
    },
    addNewNote: function () {
      this.stored.fileList.push(new Note(generateRandomId(10, this.stored.fileList.map(el => el.id))));
      
      // gd.createFile(defaultContent)
      //   .then((res) => {
      //     console.log(res);
      //   }, showErr)
      //   .then(updateList, showErr);
    },
    deleteNotes: function () {
      // Promise.all(this.tickedFiles.map((fid) => {
      //   return gd.deleteFile(fid)
      // }))
      //   .then((results) => {
      //     console.log(results);
      //   }, showErr)
      //   .then(this.discardSelection, showErr)
      //   .then(() => {
      //     this.tickFiles = [];
      //   }, showErr)
      //   .then(updateList, showErr);
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
    addNewField: function () {
      let modalNewField = this.$refs.modalNewField;
      let newName = modalNewField.querySelector("#newfieldname").value;
      if (newName !== "") {
        if (!this.unsaved[newName]) {
          document.getElementsByName("entry-type").forEach(el => {
            if (el.checked) {
              this.unsaved.addNewField(newName, el.dataset.type);
              console.log(JSON.stringify(this.unsaved), this.unsaved);
              this.toggleNewFieldEntry();
            }
          });
        } else {
          this.fieldnameError = "No duplicated field name is allowed. Please provide another name.";
        }
      } else {
        this.fieldnameError = "Please provide a field name";
      }
    },
    toggleNewFieldEntry: function () {
      this.$refs.modalNewField.classList.toggle("active");
      this.$refs.modalNewField.querySelector("#newfieldname").value = "";
      this.fieldnameError = "";
    },
    removeField: function (name) {
      console.log(name);
      console.log(JSON.stringify(this.unsaved));
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
      this.openedFile.updateFrom(this.unsaved);
      console.log(JSON.stringify(this.unsaved), JSON.stringify(this.openedFile));
      // Object.assign(this.openedFile, JSON.parse(JSON.stringify(this.unsaved)));
    },
    discardUnsaved: function () {
      this.unsaved.updateFrom(this.openedFile);
      // Object.assign(this.unsaved, JSON.parse(JSON.stringify(this.openedFile)));
      console.log(JSON.stringify(this.unsaved), JSON.stringify(this.openedFile));
    }
  }
})

function updateList() {
  // return gd.getFullData().then();
  // return gd.getFullList().then((files) => {
  //   if (files.length > 0) {
  //     return files.map((f) => {
  //       return gd.getFileContent(f.id)
  //         .then((res) => {
  //           return {
  //             id: f.id,
  //             createdTime: f.createdTime,
  //             modifiedlTime: f.modifiedTime,
  //             content: res.result
  //           }
  //         })
  //     })
  //   } else {
  //     return [];
  //   }
  // }, showErr).then((promises) => {
  //   return Promise.all(promises);
  // }, showErr).then((values) => {
  //   stored.fileList = values;
  // }, showErr);
}

function refreshList() {
  return gd.getData().then((res) => {
    if (res.status == 200) {
      return decodeData(res.body);
    } else {
      throw res.status;
    }
  }).then((res) => {
    console.log(res);
  }, showErr);
}

function decodeData(dataString) {
  let notes = dataString
    .split(separator)
    .map(val => val.trim())
    .filter(val => val != "");
  return notes;
}

function initApis() {
  gd = new GDrive();
  gd.signedInFunction = () => {
    let gUser = gd.getUserProfile();
    currentUser.name = gUser.getName();
    currentUser.email = gUser.getEmail();
    currentUser.profilePic = gUser.getImageUrl();
    // updateList();
    // refreshList();
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