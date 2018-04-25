module.exports = {
  data: function () {
    return {
      mdconverter: mdconverter,
      mdguides: mdguides,
      display: "",
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
      if (!this.display) {
        this.updatedisplay(this.mdguides[0].tooltip, this.mdguides[0].guide, 0);
      }
    },
    updatedisplay: function (title, guide, eIdx) {
      this.display = "#" + title + "\n" + guide;
      this.$refs.DISPLAYCONTENT.scrollTop = 0;
      this.$refs.TABITEMS.forEach((el,idx) => {
        if (idx == eIdx) el.classList.add("active");
        else el.classList.remove("active");
      })
    }
  },
  template: `
  <div class="modal" id="modal-markdownguide">
    <div class="modal-overlay" aria-label="Close" @click="toggle"></div>
    <div class="modal-container">
      <div class="modal-header">
        <div class="tab">
          <div v-for="(g, index) in mdguides" class="tab-item" ref="TABITEMS">
            <a :class="['mdi', 'mdi-24px', g.icon]" @click="updatedisplay(g.tooltip, g.guide, index)"></a>
          </div>
        </div>
      </div>
      <div class="modal-body md-default" ref="DISPLAYCONTENT" v-html="mdconverter.makeHtml(display)"></div>
    </div>
  </div>
  `
}