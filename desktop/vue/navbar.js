module.exports = {
  props: ["noteLocation", "stat", "id"],
  methods: {
    toggleSidebar: function () {
      this.$emit("toggle-sidebar");
    },
    reload: function () {
      this.$emit("reload");
    },
    closeWin: function () {
      this.$emit("close-win");
    },
    hide: function () {
      this.$el.classList.add("hide-md");
    },
    show: function () {
      this.$el.classList.remove("hide-md");
    }
  },
  template: `
  <div class="navbar p-1 bg-dark" :id="id" style="-webkit-app-region: drag">
    <div class="navbar-section">
      <div class="c-hand mdi mdi-24px mdi-menu px-2" @click="toggleSidebar" style="-webkit-app-region: no-drag"></div>
    </div>

    <div class="navbar-center">
      <img src="icons/icon.png?v=1.0" style="max-height: 1rem">&nbsp;
      <strong>MaNote</strong><i class="mdi mdi-laptop mx-1" v-if="noteLocation.local"></i><i class="mdi mdi-google-drive mx-1" v-if="noteLocation.remote"></i>
    </div>

    <div class="navbar-section mx-2">
      <span class="mdi mdi-24px mdi-spin mdi-loading text-warning" v-show="stat.running"></span>
      <span class="mdi mdi-24px mdi-reload c-hand" @click="reload" style="-webkit-app-region: no-drag"></span>
      <span class="mdi mdi-24px mdi-close c-hand text-error" @click="closeWin" style="-webkit-app-region: no-drag"></span>
    </div>
  </div>
  `
}