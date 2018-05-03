const {Note} = require("../js/note.js");

module.exports = {
  props: ["value", "title", "subtitle", "exceptions"],
  data: function () {
    return {
      fieldList: []
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
      this.fieldList = this.value.order.map(el => { return { name: el, type: this.value[el].type } });
    },
    addNewField: function () {
      this.fieldList.push({ name: "", type: "single"});
    },
    removeField: function (idx) {
      this.fieldList.splice(idx, 1);
    },
    isDuplicated: function (name) {
      let exc = ["id", "created", "modified"];
      if (this.exceptions && Array.isArray(this.exceptions)) {
        exc = Array.from(new Set([...exc, ...this.exceptions]));
      }
      exc = exc.map(el => { return { name: el }});
      return [...exc, ...this.fieldList].filter(el => el.name == name).length > 1;
    },
    isEmpty: function (name) {
      return name == "";
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
      this.fieldList.splice(shiftTo, 0, this.fieldList[shiftFrom]);
      if (shiftTo < shiftFrom) shiftFrom += 1;
      this.fieldList.splice(shiftFrom, 1);
    },
    update: function () {
      this.$emit("input", Note.createWithFields(this.fieldList.filter(el => el.name !== "")));
      this.toggle();
    }
  },
  template: `
  <div class="modal default-display">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-subtitle text-gray">{{ subtitle }}</div>
      </div>
      <div class="modal-body">
        <div class="modal-subtitle text-gray">"id", "created", and "modified" are also not allowed</div>
        <div class="h-box default-list my-2" v-for="f,i in fieldList" :data-index="i"
          draggable="true"
          @dragstart="dragstart"
          @dragenter.prevent="dragover"
          @dragover.prevent="dragover"
          @dragleave.prevent="dragleave"
          @dragend.prevent="dragleave"
          @drop.prevent="drop"
        >
          <div class="mdi mdi-cursor-move v-center"></div>
          <div class="v-box grow">
            <div class="h-box v-center">
              <input type="text" :class="['form-input', 'grow', isDuplicated(f.name) || isEmpty(f.name) ? 'is-error' : '' ]" v-model="f.name">
              <div class="mx-1"></div>
              <select v-model="f.type" class="form-select grow">
                <option value="single">Single</option>
                <option value="multiple">Multiple</option>
                <option value="datetime">Datetime</option>
                <option value="tags">Tags</option> 
              </select>
            </div>
            <div class="h-box grow" v-if="isEmpty(f.name)">
              <div class="form-input-hint text-error">Field with blank name is not allowed</div>
            </div>
            <div class="h-box grow" v-else-if="isDuplicated(f.name)">
              <div class="form-input-hint text-error">Fields with duplicated name are not allowed</div>
            </div>
          </div>
          <div class="mdi mdi-close c-hand v-center" title="remove" @click="removeField(i)"></div>
        </div>
        <div class="my-2" :data-index="fieldList.length" style="height: 1em"
          draggable="false"
          @dragstart="dragstart"
          @dragenter.prevent="dragover"
          @dragover.prevent="dragover"
          @dragleave.prevent="dragleave"
          @dragend.prevent="dragleave"
          @drop.prevent="drop"
        ></div>
        <div class="tile-content text-center c-hand" @click="addNewField">
          <div class="mdi mdi-24px mdi-plus"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="update">Save</button>
        <button class="btn" @click="toggle">Cancel</button>
      </div>
    </div>
  </div>
  `
}