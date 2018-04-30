const fs = require("fs");
const path = require("path");

module.exports = {
  props: ["file"],
  data: function () {
    return {
      newName: "",
      newExt: ".manote"
    }
  },
  computed: {
    dirname: function () {
      return typeof(this.file) == "string" ? path.dirname(this.file) : "";
    },
    oldName: function () {
      return typeof(this.file) == "string" ? path.parse(this.file).name : "";
    },
    extName: function () {
      return typeof(this.file) == "string" ? path.parse(this.file).ext : "";
    },
    newNameUsed: function () {
      return fs.existsSync(path.join(this.dirname, this.newName + this.newExt));
    },
    renamable: function () {
      return (!(this.oldName + this.extName == this.newName + this.newExt) && !this.newNameUsed);
    },
    error: function () {
      if (!(this.oldName + this.extName == this.newName + this.newExt) && this.newNameUsed) {
        return "A file named " + this.newName + this.newExt + " already exists."
      }
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
      this.newName = this.oldName;
    },
    rename: function () {
      this.$emit("rename", path.join(this.dirname, this.newName + this.newExt));
      this.toggle();
    }
  },
  template: `
  <div class="modal">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container">
      <div class="modal-header">Rename</div>
      <div class="modal-body text-center">
        <div class="text-center text-gray">{{ dirname }}</div>
        <div class="my-2"></div>
        <div class="text-center">{{ oldName + extName }}</div>
        <div class="mdi mdi-arrow-down-bold"></div>
        <div class="h-box v-center">
          <input type="text" class="form-input text-center grow" v-model="newName">
          <div>{{ newExt }}</div>
        </div>
        <div class="my-2"></div>
        <div class="toast toast-error" v-if="error">
          {{ error }}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="rename" :disabled="!renamable">Rename</button>
        <button class="btn" @click="toggle">Cancel</button>
      </div>
    </div>
  </div>
  `
}