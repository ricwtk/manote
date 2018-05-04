const field = require(path.join(__dirname, "field.js"));
const {mdconverter} = require(path.join(__dirname, "..", "js", "md.js"));

module.exports = {
  props: ["data"],
  data: function () {
    return {
      mdconverter: mdconverter
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
    }
  },
  components: {
    "field-single": field.single,
    "field-multiple": field.multiple,
    "field-datetime": field.datetime,
    "field-tags": field.tags
  },
  template: `
  <div class="modal minimal-note">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title text-ellipsis" :title="data.title">{{ data.title }} <i>(In archive)</i></div>
        <div class="modal-subtitle text-gray text-ellipsis" :title="data.subtitle">{{ data.subtitle }}</div>
      </div>
      <div class="modal-body" v-if="data.content">
        <component v-for="key in data.content.order" :key="key" :is="'field-' + data.content[key].type"
          :title="key"
          :removable="false"
          v-model="data.content[key].content"
          :editable="false"
          :displayValue="['single', 'multiple'].includes(data.content[key].type) ? mdconverter.makeHtml(data.content[key].content) : data.content[key].content"
          :height="data.content[key].height ? data.content[key].height : 'auto'"
        ></component>
      </div>
      <div class="modal-footer"></div>
    </div>
  </div>
  `
}