module.exports = {
  props: ["show"],
  methods: {
    save: function () {
      this.$emit("to-save", true);
    },
    notsave: function () {
      this.$emit("to-save", false);
    }
  },
  template: `
  <div :class="['modal', 'modal-sm', show ? 'active' : '']">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal-body">
        There are unsaved changes in current note. <span class="text-bold">Save before switch?</span>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="save">Yes</button>
        <button class="btn" @click="notsave">No</button>
      </div>
    </div>
  </div>
  `
}