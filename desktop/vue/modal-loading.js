module.exports = {
  props: ["show"],
  data: function () {
    return {
      modalOverlay: {
        "display": "flex",
        "justify-content": "center",
        "align-items": "center",
        "font-size": "800%"
      }
    }
  },
  computed: {
    modalClass: function () {
      return {
        "modal": true,
        "text-primary": true,
        "active": this.show
      }
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    }
  },
  template: `
  <div :class="modalClass">
    <div class="modal-overlay mdi mdi-spin mdi-loading" :style="modalOverlay"></div>
  </div>
  `
}