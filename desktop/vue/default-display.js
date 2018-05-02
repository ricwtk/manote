const {Note} = require("../js/note.js");

module.exports = {
  props: ["value", "title", "location"],
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
      return this.fieldList.filter(el => el.name == name).length > 1;
    },
    isEmpty: function (name) {
      return name == "";
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
        <div class="modal-subtitle text-gray">{{ location }}</div>
      </div>
      <div class="modal-body">
        <div class="h-box default-list my-2" v-for="f,i in fieldList">
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