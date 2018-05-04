module.exports = {
  props: ["headerText", "list", "actions"],
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    },
    emitAction: function (action, value) {
      this.$emit(action, value);
    }
  },
  template: `
  <div class="list-display modal">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container bg-dark">
      <div class="modal-header">{{ headerText }}</div>
      <div class="modal-body">
        <div v-for="l in list" class="tile tile-centered bg-gray p-2 my-1">
          <div class="tile-content">
            <div class="tile-title" :title="l.value">{{ l.title }}</div>
            <small class="tile-subtitle text-gray text-ellipsis" :title="l.value">{{ l.subtitle }}</small>
          </div>
          <div class="tile-action btn-group">
            <button v-for="a in actions" class="btn btn-primary btn-sm h-box v-center" @click="emitAction(a.action, l.value)" :title="a.tooltip">
              <i v-if="a.icon" :class="['mdi', a.icon]"></i>
              <div v-if="a.icon && a.display" class="mx-1"></div>
              <template v-if="a.display">
                {{ a.display }}
              </template>
            </button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
      </div>
    </div>
  </div>
  `
}