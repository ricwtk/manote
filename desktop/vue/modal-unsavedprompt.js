module.exports = {
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    },
    save: function () {
      this.$emit("to-save", true);
      this.toggle();
    },
    notsave: function () {
      this.$emit("to-save", false);
      this.toggle();
    }
  },
  template: `
  <div class="modal modal-sm">
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