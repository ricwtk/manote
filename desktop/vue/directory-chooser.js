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
    dirList: function () {
      return fs.readdirSync(this.cPath).filter(file => fs.statSync(path.join(this.cPath, file)).isDirectory());
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    },
    upDir: function () {
      this.cPath = path.dirname(this.cPath);
    },
    getTopDiv: function (target) {
      while (target.tagName.toLowerCase() != "div") {
        target = target.parentNode;
      }
      return target;
    },
    clickItem: function (ev) {
      if (this.clickedItem && ev.target == this.clickedItem) {
        console.log(this.getTopDiv(ev.target).textContent.trim());
        this.cPath = path.join(this.cPath, this.getTopDiv(ev.target).textContent.trim());
      } else {
        this.clickedItem = ev.target;
      }
      this.$el.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
      ev.target.classList.add("selected");
      setTimeout(() => {
        this.clickedItem = null
      }, 300);
    }
  },
  template: `
  <div class="dir-chooser modal active">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container bg-dark">
      <div class="modal-header" style="display: flex; border-bottom: 1px solid">
        <span class="mdi mdi-24px mdi-arrow-up-bold c-hand" data-tooltip="Go up one directory" data-tooltip-position="bottom" @click="upDir"></span>
        <div class="modal-title" style="display: flex; align-items: center; margin-left: 1em">
          <span class="label" v-if="cPath.split(path.sep).slice(1).length > 3">
            ...
          </span>
          <span class="label" v-for="p in cPath.split(path.sep).slice(1).slice(-3)">
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
        <button class="btn btn-primary">Select</button> 
        <button class="btn">Cancel</button> 
      </div>
    </div>
  </div>
  `
}