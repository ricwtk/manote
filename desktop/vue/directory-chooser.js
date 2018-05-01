const fs = require("fs");
const path = require("path");
const os = require("os");
const {shell} = require("electron");

module.exports = {
  data: function () {
    return {
      clickedItem: null,
      cPath: os.homedir(),
      path: path,
      searchQuery: ""
    }
  },
  computed: {
    pathArray: function () {
      return this.cPath.split(path.sep).slice(1);
    },
    dirList: function () {
      return fs.readdirSync(this.cPath).filter(file => {
        try {
          return fs.statSync(path.join(this.cPath, file)).isDirectory() && file.toLowerCase().includes(this.searchQuery.toLowerCase());
        } catch (e) {
          return false;
        }
      });
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    },
    upDir: function () {
      this.setNewPath(path.dirname(this.cPath));
    },
    getTopDiv: function (target) {
      while (target.tagName.toLowerCase() != "div") {
        target = target.parentNode;
      }
      return target;
    },
    removeAndSetPath: function (nToRemove) {
      if (nToRemove > 0) {
        let removePath = this.pathArray.slice(-nToRemove);
        let newPath = this.cPath.replace(path.join(...removePath), "");
        if (newPath.endsWith(path.sep)) newPath = newPath.slice(0,-1);
        this.setNewPath(newPath);
      }
    },
    setNewPath: function (newPath) {
      fs.stat(newPath, (err, fsStats) => {
        if (err) {
          console.log(err);
          return;
        }
        if (fsStats.isDirectory()) {
          this.cPath = newPath;
          this.$el.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
          this.$el.querySelector(".modal-body").scrollTop = 0;
          this.searchQuery = "";
        }
      });
    },
    clickItem: function (ev) {
      if (this.clickedItem && ev.target == this.clickedItem) {
        this.setNewPath(path.join(this.cPath, this.getTopDiv(ev.target).textContent.trim()));
      } else {
        this.clickedItem = ev.target;
      }
      this.$el.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
      ev.target.classList.add("selected");
      setTimeout(() => {
        this.clickedItem = null
      }, 300);
    },
    selectDir: function () {
      let selected = this.$el.querySelector(".selected");
      if (selected) {
        selected = path.join(this.cPath, selected.textContent.trim());
      } else {
        selected = this.cPath;
      }
      this.$emit("select-dir", selected);
      this.toggle();
    },
    openExternal: function () {
      shell.openItem(this.cPath);
    }
  },
  template: `
  <div class="dir-chooser modal">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container bg-dark">
      <div class="modal-header" style="display: flex; border-bottom: 1px solid">
        <span class="mdi mdi-24px mdi-arrow-up-bold c-hand" data-tooltip="Go up one directory" data-tooltip-position="bottom" @click="upDir"></span>
        <div class="modal-title grow" style="display: flex; align-items: center; margin-left: 1em">
          <span class="label c-hand" v-if="pathArray.length > 3" @click="removeAndSetPath(3)">
            ...
          </span>
          <span class="label c-hand" v-for="(p,i) in pathArray.slice(-3)" @click="removeAndSetPath(pathArray.slice(-3).length - i - 1)">
            {{ p }}
          </span>
        </div>
        <span class="mdi mdi-24px mdi-open-in-new c-hand" title="Open in file manager" @click="openExternal"></span>
      </div>
      <div class="modal-body">
        <div v-for="n in dirList" @click="clickItem">
          <i class="mdi mdi-24px mdi-folder"></i>
          {{ n }}
        </div>
      </div>
      <div class="modal-footer h-box">
        <div class="form-input h-box v-center grow">
          <i class="mdi mdi-magnify"></i>
          <div class="mx-1"></div>
          <input class="invisible-form-input grow" v-model="searchQuery">
        </div>
        <div class="mx-1"></div>
        <button class="btn btn-primary" @click="selectDir">Select</button> 
        <div class="mx-1"></div>
        <button class="btn" @click="toggle">Cancel</button> 
      </div>
    </div>
  </div>
  `
}