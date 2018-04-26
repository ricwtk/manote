const fs = require("fs");
const path = require("path");

module.exports = {
  data: function () {
    return {
      clickedItem: null,
      cPath: __dirname,
      path: path
    }
  },
  computed: {
    pathArray: function () {
      return this.cPath.split(path.sep).slice(1);
    },
    dirList: function () {
      return fs.readdirSync(this.cPath).filter(file => {
        try {
          return fs.statSync(path.join(this.cPath, file)).isDirectory();
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
    }
  },
  template: `
  <div class="dir-chooser modal active">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container bg-dark">
      <div class="modal-header" style="display: flex; border-bottom: 1px solid">
        <span class="mdi mdi-24px mdi-arrow-up-bold c-hand" data-tooltip="Go up one directory" data-tooltip-position="bottom" @click="upDir"></span>
        <div class="modal-title" style="display: flex; align-items: center; margin-left: 1em">
          <span class="label c-hand" v-if="pathArray.length > 3" @click="removeAndSetPath(3)">
            ...
          </span>
          <span class="label c-hand" v-for="(p,i) in pathArray.slice(-3)" @click="removeAndSetPath(pathArray.slice(-3).length - i - 1)">
            {{ p }}
          </span>
        </div>
      </div>
      <div class="modal-body">
        <div v-for="n in dirList" @click="clickItem">
          <i class="mdi mdi-24px mdi-folder"></i>
          {{ n }}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="selectDir">Select</button> 
        <button class="btn" @click="toggle">Cancel</button> 
      </div>
    </div>
  </div>
  `
}