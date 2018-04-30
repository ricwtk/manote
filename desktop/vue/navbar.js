module.exports = {
  props: ["noteLocation", "stat"],
  methods: {
    toggleSidebar: function () {
      this.$emit("toggle-sidebar");
    }
  },
  template: `
  <div class="navbar p-1 bg-dark">
    <div class="navbar-section">
      <div class="c-hand mdi mdi-24px mdi-menu px-2" @click="toggleSidebar"></div>
    </div>

    <div class="navbar-center">
      <img src="icons/icon.png?v=1.0" style="max-height: 1rem">&nbsp;
      <strong>MaNote</strong><i class="mdi mdi-laptop mx-1" v-if="noteLocation.local"></i><i class="mdi mdi-google-drive mx-1" v-if="noteLocation.remote"></i>
    </div>

    <div class="navbar-section mx-2">
      <span class="mdi mdi-24px mdi-spin mdi-loading text-warning" v-show="stat.running"></span>
    </div>
  </div>
  `
}