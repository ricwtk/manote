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

class Field {
  constructor(type, content, height) {
    this.type = type ? type : "single"; // single, multiple, datetime, tags
    switch (this.type) {
      default:
      case "single": 
        this.content = content ? content : "";
        break;
      case "multiple":
        this.content = content ? content : "";
        this.height = height ? height : "auto";
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
    this.created = createdOn ? createdOn : new Date();
    this.modified = modifiedOn ? modifiedOn : this.created;
    if (others)
      this.order = others.order ? others.order.slice() : [];
    else
      this.order = [];
    this.addNewField("Title", "single", Title ? Title : "Untitled");
    this.addNewField("Content", "multiple", Content ? Content : "");
    this.addNewField("Categories", "tags");
    if (others) {
      Object.keys(others).forEach((el) => {
        if (others[el].type) this.addNewField(el, others[el].type, others[el].content, others[el].height);
      })
    }
  }

  addNewField(name, type, content, height) {
    Vue.set(this, name, new Field(type, content, height));
    if (!this.order.includes(name)) {
      this.order.push(name);
    }
  }

  updateField(name, content, height) {
    if (!this[name]) return null;
    if (content == undefined) {
      console.error("content must be specified in Note.updateField(name, content, height)");
    }
    switch (this[name].type) {
      default:
        this[name].content = content;
        break;
      case "multiple":
        this[name].content = content;
        if (height) {
          Vue.set(this[name], "height", height);
        }
        break;
      case "tags":
        this[name].content = [ ...Array.isArray(content) ? content : [ content ] ];
        break;
    }
  }

  removeField(name) {
    if (this[name]) {
      Vue.delete(this, name);
      this.order.splice(this.order.indexOf(name), 1);
    }
  }

  copy() {
    return new Note(this.id, this.created, this.modified, null, null, this);
  }

  updateFrom(anotherNote) {
    let keysInAnotherNote = Object.keys(anotherNote);
    this.order = anotherNote.order;
    this.modified = anotherNote.modified;
    keysInAnotherNote.map(aNkey => {
      if (!["id", "created", "modified", "order"].includes(aNkey)) {
        if (!this[aNkey]) {
          console.log(aNkey);
          this.addNewField(aNkey, anotherNote[aNkey].type, anotherNote[aNkey].content, anotherNote[aNkey].height);
        } else if (JSON.stringify(this[aNkey]) != JSON.stringify(anotherNote[aNkey])) {
          this.updateField(aNkey, anotherNote[aNkey].content, anotherNote[aNkey].height);
        }
      }
    });
    Object.keys(this).filter(key => !keysInAnotherNote.includes(key)).forEach(key => {
      this.removeField(key);
    });
  }

  modifiedOn(date) {
    Vue.set(this, "modified", date);
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

Vue.component("md-guide", {
  data: function () {
    return {
      mdconverter: mdconverter,
      mdguides: mdguides,
      display: "",
    }
  },
  methods: {
    toggle: function () {
      this.$refs.modalmarkdownguide.classList.toggle("active");
      if (!this.display) {
        this.updatedisplay(this.mdguides[0].tooltip, this.mdguides[0].guide, 0);
      }
    },
    updatedisplay: function (title, guide, eIdx) {
      this.display = "#" + title + "\n" + guide;
      this.$refs.displaycontent.scrollTop = 0;
      this.$refs.tabItems.forEach((el,idx) => {
        if (idx == eIdx) el.classList.add("active");
        else el.classList.remove("active");
      })
    }
  },
  template: `
  <div class="modal" id="modal-markdownguide" ref="modalmarkdownguide">
    <div class="modal-overlay" aria-label="Close" @click="toggle"></div>
    <div class="modal-container">
      <div class="modal-header">
        <div class="tab">
          <div v-for="(g, index) in mdguides" class="tab-item" ref="tabItems">
            <a :class="['mdi', 'mdi-24px', g.icon]" @click="updatedisplay(g.tooltip, g.guide, index)"></a>
          </div>
        </div>
      </div>
      <div class="modal-body md-default" ref="displaycontent" v-html="mdconverter.makeHtml(display)"></div>
    </div>
  </div>
  `
})

new Vue({
  el: "#navbar",
  data: {
    currentUser: currentUser,
    stat: stat
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
    },
    toggleMarkdownGuide: function () {
      this.$refs.markdownguide.toggle();
    }
  }
})

Vue.component("modal-sortnote", {
  props: ["show", "value", "sortableFields", "groupableFields", "availableGroups"],
  data: function () {
    return {
      filter: {
        sort: "",
        group: "",
        show: []
      }
    }
  },
  computed: {
    groupList: function () {
      let groupIdx = this.groupableFields.indexOf(this.filter.group);
      if (groupIdx < 0) return [];
      else return this.availableGroups[groupIdx];
    }
  },
  methods: {
    hideMe: function () {
      this.$emit("hide");
      Vue.nextTick(() => {
        this.filter = JSON.parse(JSON.stringify(this.value));
      })
    },
    selectAllGroups: function () {
      this.$refs.groupList.childNodes.forEach(g => g.selected = true);
    },
    deselectAllGroups: function () {
      this.$refs.groupList.childNodes.forEach(g => g.selected = false);
    },
    updateFilter: function () {
      this.$emit("input", {
        sort: this.$refs.sortbyList.selectedOptions[0].textContent,
        group: this.$refs.groupbyList.selectedOptions[0].textContent,
        show: Array.from(this.$refs.groupList.selectedOptions).map(el => el.textContent)
      });
      this.hideMe();
    }
  },
  mounted: function () {
    this.filter = JSON.parse(JSON.stringify(this.value));
  },
  template:`
  <div :class="{ 'modal': true, 'active': show }">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal-header">Sort notes</div>
      <div class="modal-body">
        <input-header title="Sort by" :removable="false" label-for=""></input-header>
        <select class="form-select" ref="sortbyList" v-model="filter.sort">
          <option></option>
          <option v-for="sf in sortableFields">{{ sf }}</option>
        </select>
        <input-header title="Group by" :removable="false" label-for=""></input-header>
        <select class="form-select" ref="groupbyList" v-model="filter.group">
          <option></option>
          <option v-for="gf in groupableFields">{{ gf }}</option>
        </select>
        <input-header title="Show group(s)" :removable="false" label-for=""></input-header>
        <div class="col-12">
          <button class="btn" :disabled="groupList.length<1" @click="selectAllGroups">Select all</button>
          <button class="btn" :disabled="groupList.length<1" @click="deselectAllGroups">Deselect all</button>
        </div>
        <select class="form-select my-1" size="5" multiple :disabled="groupList.length<1" ref="groupList" v-model="filter.show">
          <option v-for="ag in groupList">{{ ag }}</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="updateFilter">Filter</button>
        <button class="btn" @click="hideMe">Cancel</button>
      </div>
    </div>
  </div>
  `
})

Vue.component("search-bar", {
  data: function () {
    return {
      hidden: true
    }
  },
  methods: {
    toggle: function () {
      this.hidden = !this.hidden;
    },
    show: function () {
      this.hidden = false;
    },
    hide: function () {
      this.hidden = true;
    }
  },
  template: `
  <div :class="{ 'form-input': !hidden, 'search-bar': true }">
    <span :class="{ 'mdi': true, 'mdi-magnify': true, 'form-icon': !hidden, 'mdi-24px': true }" @click="show"></span>
    <input v-show="!hidden" type="text" class="invisible-form-input" @click.stop>
    <span v-show="!hidden" class="form-icon mdi mdi-close tooltip tooltip-bottom" data-tooltip="clear search entry" @click="hide"></span>
  </div>
  `
})

Vue.component("file-item", {
  props: ["file", "index"],
  methods: {
    openFile: function (ev) {
      this.$emit("open-file", this.file, this.$refs.root);
    },
    tickFile: function (ev) {
      if (ev.target == this.$refs.ticked) {
        if (ev.target.checked) this.$emit("add-tick", this.file.id);
        else this.$emit("remove-tick", this.file.id);
      }
    },
    untick: function () {
      this.$refs.ticked.checked = false;
    },
    getActual: function (x) {
      while (!x.dataset || !x.dataset.index) {
        x = x.parentNode;
      }
      return x;
    },
    dragstart: function (ev) {
      ev.dataTransfer.setData("text", ev.target.dataset.index);
    },
    dragover: function (ev) {
      this.getActual(ev.target).classList.add("dragover");
    },
    dragleave: function (ev) {
      this.getActual(ev.target).classList.remove("dragover");
    },
    drop: function (ev) {
      this.dragleave(ev);
      let shiftFrom = parseInt(ev.dataTransfer.getData("text"));
      let shiftTo = parseInt(this.getActual(ev.target).dataset.index);
      this.$emit("drag-and-drop", shiftFrom, shiftTo);
    }
  },
  template: `
  <div class="tile tile-centered p-2 file-item" @click="openFile" ref="root"
    :draggable="file ? 'true' : 'false'"
    @dragstart="dragstart"
    @dragenter.prevent="dragover"
    @dragover.prevent="dragover"
    @dragleave.prevent="dragleave"
    @dragend.prevent="dragleave"
    @drop.prevent="drop"
    :data-index="index"
  >
    <template v-if="file">
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
      <div class="tile-action handle">
        <i class="mdi mdi-menu"></i>
      </div>
    </template>
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

Vue.component("modal-sortfields", {
  props: ["value"],
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    },
    getActual: function (x) {
      while (!x.dataset || !x.dataset.index) {
        x = x.parentNode;
      }
      return x;
    },
    dragstart: function (ev) {
      ev.dataTransfer.setData("text", ev.target.dataset.index);
    },
    dragover: function (ev) {
      this.getActual(ev.target).classList.add("dragover");
    }, 
    dragleave: function (ev) {
      this.getActual(ev.target).classList.remove("dragover");
    },
    drop: function (ev) {
      this.dragleave(ev);
      let shiftFrom = parseInt(ev.dataTransfer.getData("text"));
      let shiftTo = parseInt(this.getActual(ev.target).dataset.index);
      let newOrder = JSON.parse(JSON.stringify(this.value));
      newOrder.splice(shiftTo, 0, newOrder[shiftFrom]);
      if (shiftTo < shiftFrom) shiftFrom += 1;
      newOrder.splice(shiftFrom, 1);
      this.$emit("input", newOrder);
    },
  },
  template: `
  <div class="modal modal-sm" id="modal-sortfields">
    <div class="modal-overlay" aria-label="Close" @click="toggle()"></div>
    <div class="modal-container">
      <div class="modal-body">
        <div class="text-center my-2">
          Drop onto the item to place before it
        </div>
        <div class="sort-item" v-for="(v,idx) in value" draggable="true"
          @dragstart="dragstart" 
          @dragenter.prevent="dragover"
          @dragover.prevent="dragover"
          @dragleave.prevent="dragleave"
          @dragend.prevent="dragleave"
          @drop.prevent="drop"
          :data-index="idx"
        >
          <i class="mdi mdi-cursor-move"></i>
          <div>{{ v }}</div>
        </div>
        <div class="sort-item-holder"
          @dragenter.prevent="dragover"
          @dragover.prevent="dragover"
          @dragleave.prevent="dragleave"
          @dragend.prevent="dragleave"
          @drop.prevent="drop"
          :data-index="value.length"
        >
        </div>
      </div>
    </div>
  </div>
  `
})

Vue.component("modal-unsavedprompt", {
  props: ["show"],
  methods: {
    save: function () {
      this.$emit("to-save", true);
    },
    notsave: function () {
      this.$emit("to-save", false);
    }
  },
  template: `
  <div :class="['modal', 'modal-sm', show ? 'active' : '']">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal-body">
        There are unsaved changes in current note. <span class="text-bold">Save before switch?</span>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="save">Yes</button>
        <button class="btn" @click="notsave">No</button>
      </div>
    </div>
  </div>
  `
})

new Vue({
  el: "#note-list-and-display",
  data: {
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
    showUnsavedPrompt: false,
    viewEdit: false,
    fieldnameError: "",
    mdconverter: mdconverter
  },
  computed: {
    hasUnsaved: function () {
      return JSON.stringify(this.unsaved) != JSON.stringify(this.openedFile);
    },
    sortableFields: function () { 
      return Array.from( 
        new Set(
          this.stored.noteList.map(el =>  
            Object.keys(el).filter(k => 
              ['created', 'modified'].includes(k) || 
              ( el[k].type && ["single", "datetime"].includes(el[k].type) )
            ) 
          ).reduce((acc, el) => acc.concat(el), [])
        ) 
      ); 
    }, 
    groupableFields: function () { 
      return Array.from( 
        new Set( 
          this.stored.noteList.map(el =>  
            Object.keys(el).filter(k =>  
              el[k].type && ["tags"].includes(el[k].type) 
            ) 
          ).reduce((acc, el) => acc.concat(el), []) 
        ) 
      ); 
    },
    availableGroups: function () {
      return this.groupableFields.map(field => 
        [...Array.from(
          new Set (
            this.stored.noteList.map(el => 
              el[field] ? el[field].content : []
            ).reduce((acc, el) => acc.concat(el), [])
          )
        ), "-- No field or no group"]
      );
    },
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
    }
  },
  methods: {
    // getGroups: function (field) {
    //   this.availableGroups = this.stored.noteList.map(el => el[field] ? el[field].content: []).reduce((acc, el) => acc.concat(el), []);
    // }, 
    addTick: function (fileId) {
      console.log("ticking", fileId);
      this.tickedFiles.push(fileId);
    },
    removeTick: function (fileId) {
      console.log("remove tick", fileId);
      this.tickedFiles = this.tickedFiles.filter(item => item !== fileId);
    },
    openFile: function (file, el) {
      if (file.id == this.openedFile.id) {
        return;
      }
      if (Object.keys(this.unsaved).length > 0) {
        if (this.hasUnsaved) {
          this.showUnsavedPrompt = true;
          this.fileToOpen = file;
          this.elToOpen = el;
          return;
        }
      }
      this.openFileAction(file, el);
    },
    saveOrNot: function (toSave) {
      if (toSave) {
        this.saveNote();
      }
      this.showUnsavedPrompt = false;
      this.openFileAction(this.fileToOpen, this.elToOpen);
    },
    openFileAction: function (file, el) {
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
      this.$refs.fileItem.forEach(el => {
        el.untick();
      });
      this.tickedFiles = [];
    },
    addNewNote: function () {
      this.stored.noteList.push(new Note(generateRandomId(10, this.stored.noteList.map(el => el.id))));
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
      // console.log(JSON.stringify(this.unsaved));
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
      this.openedFile.updateFrom(this.unsaved);
      console.log(JSON.stringify(this.unsaved), JSON.stringify(this.openedFile));
      this.stat.running = true;
      gd.updateNote(this.openedFile).then(res => {
        console.log(res);
        updateList(res);
      }, showErr).then(res => { this.stat.running = false });
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
    resizeTA: function (ev, name) {
      Vue.set(this.unsaved[name], "height", window.getComputedStyle(ev.target).height);
    }
  }
})

function updateList(notes) {
  stored.noteList = 
    notes.map(el => new Note(el.id, el.created, el.modified, null, null, el)).concat(
      stored.noteList.filter(el => !notes.map(nt => nt.id).includes(el.id)).map(el => new Note(el.id, el.created, el.modified, null, null, el))
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