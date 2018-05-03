module.exports = {
  props: ['value'],
  data: function () {
    return {
      hidden: true
    }
  },
  methods: {
    toggle: function () {
      this.hidden = !this.hidden;
    },
    show: function () {
      this.hidden = false;
      this.$nextTick(() => this.$refs.searchBox.focus());
    },
    hide: function () {
      this.$emit("input", "");
      this.hidden = true;
    },
    update: function (ev) {
      this.$emit("input", ev.target.value);
    }
  },
  template: `
  <div :class="{ 'form-input': !hidden, 'search-bar': true }">
    <span :class="{ 'mdi': true, 'mdi-magnify': true, 'form-icon': !hidden, 'mdi-24px': true }" @click="show"></span>
    <input ref="searchBox" v-show="!hidden" type="text" class="invisible-form-input" @click.stop :value="value" @input="update">
    <span v-show="!hidden" class="form-icon mdi mdi-close" title="clear search entry" @click="hide"></span>
  </div>
  `
}