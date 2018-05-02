const path = require("path");

module.exports = {
  props: ["file", "index", "draggable", "droppable", "title", "subtitle"],
  data: function () {
    return {
      path: path,
      isTicked: false
    }
  },
  methods: {
    setSelect: function () {
      this.$el.classList.add("selected");
    },
    clearSelect: function () {
      this.$el.classList.remove("selected");
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
        <label class="form-checkbox" @click.stop="$emit('tick')">
          <input type="checkbox" ref="ticked" v-model="isTicked">
          <i class="form-icon"></i>
        </label>
      </div>
      <div class="tile-content">
        <template v-if="typeof(file)=='string'">
          <div class="tile-title" :title="title">{{ title }}</div>
          <div class="tile-subtitle text-gray" :title="subtitle">{{ subtitle }}</div>
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