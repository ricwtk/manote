const cb = require("clipboardy");
const {shell} = require("electron");

module.exports = {
  props: ["authUrl", "authError"],
  data: function () {
    return {
      authCode: ""
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    },
    openUrl: function () {
      shell.openExternal(this.authUrl);
    },
    copyUrl: function () {
      cb.write(this.authUrl);
    },
    pasteCode: function () {
      cb.read(this.authUrl)
        .then(code => {
          this.authCode = code;
        })
    },
    clearCode: function () {
      this.authCode = "";
    },
    authenticate: function () {
      this.$emit("authenticate", this.authCode);
    }
  },
  template: `
  <div class="modal">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container">
      <div class="modal-header"></div>
      <div class="modal-body">
        Authorize this app by visiting this url:
        <div class="h-box v-center">
          <pre class="grow mr-1" style="overflow: auto"><code>{{ authUrl }}</code></pre>
          <div class="btn-group no-shrink">
            <button class="btn btn-sm btn-primary mdi mdi-content-copy" @click="copyUrl" title="copy"></button>
            <button class="btn btn-sm btn-primary mdi mdi-open-in-new" @click="openUrl" title="open"></button>
          </div>
        </div>
        Enter the code from that page here: 
        <div class="h-box v-center">
          <input type="text" :class="['form-input', 'input-sm', 'mr-1', 'grow', authError ? 'is-error' : '']" v-model="authCode">
          <div class="btn-group no-shrink">
            <button class="btn btn-sm btn-primary mdi mdi-content-paste" @click="pasteCode" title="paste"></button>
            <button class="btn btn-sm btn-primary mdi mdi-close" @click="clearCode" title="clear"></button>
          </div>
        </div>
        <div class="form-input-hint text-error" v-if="authError">{{ authError }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" :disabled="authCode==''" @click="authenticate">Authenticate</button>
        <button class="btn btn-primary" @click="toggle">Cancel</button>        
      </div>
    </div>
  </div>
  `
}