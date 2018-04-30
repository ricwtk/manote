module.exports = {
  props: ["existedFields"],
  data: function () {
    return {
      fieldnameError: "",
      fieldType: "single"
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
      this.$el.querySelector("#newfieldname").value = "";
      this.fieldnameError = "";
    },
    addNewField: function () {
      let newName = this.$el.querySelector("#newfieldname").value;
      if (newName !== "") {
        if (!this.existedFields.includes(newName)) {
          this.$emit("new-field", newName, this.fieldType);
          this.toggle();
        } else {
          this.fieldnameError = "No duplicated field name is allowed. Please provide another name.";
        }
      } else {
        this.fieldnameError = "Please provide a field name";
      }
    }
  },
  template: `
  <div class="modal">
    <div class="modal-overlay" aria-label="Close" @click="toggle"></div>
    <div class="modal-container">
      <div class="modal-body form-group">
        <label class="divider" for="newfieldname" data-content="Field name"></label>
        <input class="form-input" id="newfieldname">
        <div class="toast toast-error" v-if="fieldnameError">{{ fieldnameError }}</div>
        <label class="divider" data-content="Entry type"></label>
        <label class="form-radio">
          <input type="radio" value="single" v-model="fieldType">
          <i class="form-icon"></i> Single line text
        </label>
        <label class="form-radio">
          <input type="radio" value="multiple" v-model="fieldType">
          <i class="form-icon"></i> Multiple line text
        </label>
        <label class="form-radio">
          <input type="radio" value="datetime" v-model="fieldType">
          <i class="form-icon"></i> Date-time
        </label>
        <label class="form-radio">
          <input type="radio" value="tags" v-model="fieldType">
          <i class="form-icon"></i> Tags
        </label>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="addNewField">Save</button>
        <button class="btn" @click="toggle">Cancel</button>
      </div>
    </div>
  </div>
  `
}