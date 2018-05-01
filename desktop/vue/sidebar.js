const path = require("path");

module.exports = {
  props: ["currentUser", "openedDir", "noteLocation"],
  data: function () {
    return { }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    },
    signOutGoogle: function () {
      this.$emit("signOutGoogle");
    },
    signInGoogle: function () {
      this.$emit("signInGoogle");
    },
    addLocal: function (ev) {
      console.log(ev.target.value)
    },
    toggleMarkdownGuide: function () {
      this.$emit("toggle-markdownguide");
    },
    toggleDirChooser: function () {
      this.$emit("toggle-dirchooser");
    },
    removeDir: function (oldDir) {
      this.$emit("remove-dir", oldDir);
    },
    switchToLocal: function () {
      this.$emit("set-local");
    },
    switchToRemote: function () {
      this.$emit("set-remote");
    },
    showDirDefault: function () {
      this.$emit("show-dir-default");
    },
    showGlobalDefault: function () {
      this.$emit("show-global-default");
    }
  },
  template: `
  <div class="sidebar active">
    <div class="sidebar-overlay" aria-label="Close" @click="toggle"></div>
    <div class="sidebar-container">
      <div class="tile tile-centered bg-dark p-2">
        <div class="tile-icon c-hand" @click="toggle">
          <div class="mdi mdi-24px mdi-chevron-left"></div>
        </div>
        <div class="tile-content">
          <div class="tile tile-centered bg-dark p-2">
            <div class="tile-icon">
              <figure v-if="currentUser.name" class="avatar avatar-lg">
                <img :src="currentUser.profilePic" alt="PP">
              </figure>
              <span v-else class="mdi mdi-48px mdi-account-circle"></span>
            </div>
            <div class="tile-content">
              <div class="tile-title">{{ currentUser.name ? currentUser.name : "Local user" }}</div>
              <div class="tile-subtitle text-gray">{{ currentUser.name ? currentUser.email : "" }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="menu">
        <div class="menu-item c-hand">
          <a v-if="currentUser.name" @click="signOutGoogle">Sign out</a>
          <a v-else @click="signInGoogle">Sign in to Google</a>
        </div>
        <template v-if="currentUser.name">
          <div class="divider"></div>
          <div class="menu-item c-hand">
            <a @click="switchToRemote">Notes on <i class="mdi mdi-google-drive"></i> Google Drive</a>
          </div>
        </template>
        <div class="divider" data-content="Local notes"></div>
        <div class="menu-item">
          <div class="menu-item dir-name" v-for="od in openedDir.list">
            <i class="mdi mdi-folder"></i>
            <span class="text-left" :title="od"> {{ od }}</span>
            <span class="mdi mdi-close c-hand" @click="removeDir(od)"></span>
          </div>
          <div class="menu-item c-hand">
            <a class="text-center" @click="toggleDirChooser"><i class="mdi mdi-plus"></i> Add directory</a>
          </div>
        </div>
        <div class="menu-item c-hand"><a @click="switchToLocal">Show local notes</a></div>
        <div class="menu-item"><a>Directory default</a></div>
        <div class="menu-item c-hand"><a @click="showGlobalDefault">Global default</a></div>
        <div class="divider"></div>
        <div class="menu-item c-hand">
          <a @click="toggleMarkdownGuide">Markdown Guide</a>
        </div>
      </div>
      <div class="sidebar-footer text-gray p-2 text-right">
        Powered by Spectre, Vue, and Showdown
      </div>
    </div>
  </div>
  `
}