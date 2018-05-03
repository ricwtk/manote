module.exports = {
  props: ["value", "sortableFields", "groupableFields", "availableGroups"],
  data: function () {
    return {
      filter: {
        sort: "",
        group: "",
        show: []
      }
    }
  },
  computed: {
    groupList: function () {
      let groupIdx = this.groupableFields.indexOf(this.filter.group);
      if (groupIdx < 0) return [];
      else return this.availableGroups[groupIdx];
    }
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("active");
      this.filter = JSON.parse(JSON.stringify(this.value));
    },
    selectAllGroups: function () {
      this.$refs.groupList.childNodes.forEach(g => g.selected = true);
    },
    deselectAllGroups: function () {
      this.$refs.groupList.childNodes.forEach(g => g.selected = false);
    },
    updateFilter: function () {
      this.$emit("input", {
        sort: this.$refs.sortbyList.selectedOptions[0].textContent,
        group: this.$refs.groupbyList.selectedOptions[0].textContent,
        show: Array.from(this.$refs.groupList.selectedOptions).map(el => el.textContent)
      });
      this.toggle();
    }
  },
  mounted: function () {
    this.filter = JSON.parse(JSON.stringify(this.value));
  },
  template:`
  <div class="modal">
    <div class="modal-overlay" @click="toggle"></div>
    <div class="modal-container">
      <div class="modal-header">Sort notes</div>
      <div class="modal-body">
        <div class="divider" data-content="Sort by"></div>
        <select class="form-select" ref="sortbyList" v-model="filter.sort">
          <option></option>
          <option v-for="sf in sortableFields">{{ sf }}</option>
        </select>
        <div class="divider" data-content="Group by"></div>
        <select class="form-select" ref="groupbyList" v-model="filter.group" @change="$nextTick(() => selectAllGroups())">
          <option></option>
          <option v-for="gf in groupableFields">{{ gf }}</option>
        </select>
        <div class="divider" data-content="Show group(s)"></div>
        <div class="col-12">
          <button class="btn" :disabled="groupList.length<1" @click="selectAllGroups">Select all</button>
          <button class="btn" :disabled="groupList.length<1" @click="deselectAllGroups">Deselect all</button>
        </div>
        <select class="form-select my-1" size="5" multiple :disabled="groupList.length<1" ref="groupList" v-model="filter.show">
          <option v-for="ag in groupList">{{ ag }}</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="updateFilter">Filter</button>
        <button class="btn" @click="toggle">Cancel</button>
      </div>
    </div>
  </div>
  `
}