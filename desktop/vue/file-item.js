const path = require("path");

module.exports = {
  props: ["file", "index", "draggable", "droppable"],
  data: function () {
    return {
      path: path
    }
  },
  methods: {
    setSelect: function () {
      this.$el.classList.add("selected");
    },
    clearSelect: function () {
      this.$el.classList.remove("selected");
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
      if (this.draggable) ev.dataTransfer.setData("text", ev.target.dataset.index);
    },
    dragover: function (ev) {
      if (this.droppable) this.getActual(ev.target).classList.add("dragover");
    },
    dragleave: function (ev) {
      if (this.droppable) this.getActual(ev.target).classList.remove("dragover");
    },
    drop: function (ev) {
      if (this.droppable) {
        this.dragleave(ev);
        let shiftFrom = parseInt(ev.dataTransfer.getData("text"));
        let shiftTo = parseInt(this.getActual(ev.target).dataset.index);
        this.$emit("drag-and-drop", shiftFrom, shiftTo);
      }
    },
    clickItem: function () {
      this.$emit("click", this.$el, this.file);
    }
  },
  template: `
  <div class="tile tile-centered p-2 file-item" @click="clickItem"
    :draggable="draggable"
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
        <template v-if="typeof(file)=='string'">
          <div class="tile-title" :title="path.parse(file).name">{{ path.parse(file).name }}</div>
          <div class="tile-subtitle text-gray" :title="path.dirname(file)">{{ path.dirname(file) }}</div>          
        </template>
        <template v-else>
          <div class="tile-title">{{ file.Title.content }}</div>
          <div class="tile-subtitle text-gray text-ellipsis">{{ file.Content.content }}</div>
        </template>
      </div>
      <div class="tile-action handle" v-if="draggable">
        <i class="mdi mdi-menu"></i>
      </div>
    </template>
  </div>
  `
}