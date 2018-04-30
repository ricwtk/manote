module.exports = {
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
          Drag and drop to re-arrange
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
}