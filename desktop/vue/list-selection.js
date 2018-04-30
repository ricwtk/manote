module.exports = {
  props: ["headerText", "list", "allowNew"],
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    },
    clickItem: function (ev) {
      this.$el.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
      ev.target.classList.add("selected");
    },
    select: function () {
      let selected = this.$el.querySelector(".selected");
      if (selected) {
        this.$emit("selected", selected.textContent.trim());
        this.toggle();
      }
    },
    addNew: function () {
      this.$emit("add-new");
    }
  },
  template: `
  <div class="list-selection modal">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container bg-dark">
      <div class="modal-header">{{ headerText }}</div>
      <div class="modal-body">
        <div v-for="l in list" class="text-ellipsis" :title="l" @click="clickItem">
          {{ l }}
        </div>
        <div v-if="allowNew" class="mdi mdi-plus text-center" @click="addNew">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="select">Select</button>
        <button class="btn" @click="toggle">Cancel</button>
      </div>
    </div>
  </div>
  `
}