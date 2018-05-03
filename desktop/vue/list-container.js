const path = require("path");

module.exports = {
  props: ["noteLocation", "noteList", "openedDir", "id"],
  data: function () {
    return {      
      filter: {
        sort: "",
        group: "",
        show: ""
      },
      searchQuery: "",
      hasTick: false,
    }
  },
  computed: {
    displayNoteList: function () {
      if (this.noteLocation.local) return this.noteList.local;
      else return this.noteList.remote;
    },
    sortedNoteIdx: function () {
      let indices = [...this.displayNoteList.keys()];
      return indices;
    },
  },
  components: {
    "search-bar": require(path.join(__dirname, "search-bar.js")),
    "file-item": require(path.join(__dirname, "file-item.js")),
    "list-selection": require(path.join(__dirname, "list-selection.js"))
  },
  methods: {
    addNewNote: function () {
      if (this.noteLocation.local) {
        this.$refs.dirOfNew.toggle();
      }
    },
    selectFileItem: function (el) {
      this.$refs.fileItems.forEach(fi => {
        if (fi.$el == el) fi.setSelect();
        else fi.clearSelect();
      });
    },
    selectFile: function (f) {
      this.$refs.fileItems.forEach(fi => {
        if (fi.file == f) fi.setSelect();
        else fi.clearSelect();
      });
      this.$emit("open-local-file", f);
    },
    openFile: function (el, f) {
      this.selectFileItem(el);
      this.$emit("open-file", f);
    },
    selectDirOfNew: function (dirOfNew) {
      this.$emit("create-local-note", dirOfNew);
    },
    addOpenedDir: function () {
      this.$emit("add-opened-dir");
    },
    discardSelection: function () {
      this.$refs.fileItems.forEach(fi => { fi.isTicked = false; });
    },
    deleteNotes: function () {
      if (this.noteLocation.local) {
        this.$emit("delete-local-notes", this.$refs.fileItems.filter(fi => fi.isTicked).map(fi => fi.file));
      }
    },
    checkTick: function () {
      this.$nextTick(() => {
        this.hasTick = this.$refs.fileItems ? this.$refs.fileItems.some(fi => fi.isTicked) : false;
      });
    },
    getFileItemTitle: function (filepath) {
      console.log(path.parse(filepath).name);
      return path.parse(filepath).name;
    },
    getFileItemSubtitle: function (filepath) {
      return this.openedDir.getShortened(path.dirname(filepath));
    }
  },
  template: `
  <div class="list-container column col-4 col-md-12 panel" :id="id">

    <div class="panel-header">
      <div class="panel-title navbar">
        <div class="navbar-section">
          <div :class="['mdi', 'mdi-24px', ...(filter.sort || filter.group) ? ['mdi-filter', 'text-primary'] : ['mdi-filter-outline']]" @click=""></div>
          <search-bar v-model="searchQuery"></search-bar>
        </div>
        <div class="my-button c-hand mdi mdi-24px mdi-plus" @click="addNewNote"></div>
      </div>
      <div class="bg-primary my-1 sort-group-display" v-if="filter.sort || filter.group">
        <span v-if="filter.sort" class="text-center">
          <span class="mdi mdi-sort mx-1"></span>
          {{ filter.sort }}
        </span>
        <span v-if="filter.group" class="text-center">
          <span class="mdi mdi-group mx-1"></span>
          {{ filter.group }}
        </span>
      </div>
    </div>

    <div class="panel-body">
      <template v-if="displayNoteList.length < 1">
        <div class="divider"></div>
        <div class="empty">
          Click <i class="mdi mdi-plus"></i> to add note
        </div>
      </template>
      <template v-else v-for="i in sortedNoteIdx">
        <div class="divider"></div>
        <file-item ref="fileItems"
          :file="displayNoteList[i]"
          :title="getFileItemTitle(displayNoteList[i].id)"
          :subtitle="getFileItemSubtitle(displayNoteList[i].id)"
          @click="openFile"
          @tick="checkTick"
        >
        </file-item>
      </template>
    </div>

    <div class="panel-footer navbar" v-if="hasTick">
      <div class="navbar-section">
        <button class="btn" @click="discardSelection">Discard selection</button>
      </div>
      <button class="btn ml-1" @click="deleteNotes">Delete</button>
    </div>

    <list-selection ref="dirOfNew"
      header-text="Choose from opened directories to create new note in"
      :list="openedDir.list"
      :allow-new="true"
      @selected="selectDirOfNew"
      @add-new="addOpenedDir"
    ></list-selection>

  </div>
  `
}

{/* <div class="list-container column col-4 col-md-12 panel" ref="listContainer">
  <div class="panel-header">
    <div class="panel-title navbar">
      <div class="navbar-section">
        <div :class="['mdi', 'mdi-24px', ...(filter.sort || filter.group) ? ['mdi-filter', 'text-primary'] : ['mdi-filter-outline']]" @click="showFilter=true"></div>
        <search-bar v-model="searchQuery"></search-bar>
      </div>
      <div class="my-button c-hand mdi mdi-24px mdi-plus" @click="addNewNote"></div>
    </div>
    <div class="bg-primary my-1 sort-group-display" v-if="filter.sort || filter.group">
      <span v-if="filter.sort" class="text-center">
        <span class="mdi mdi-sort mx-1"></span>
        {{ filter.sort }}
      </span>
      <span v-if="filter.group" class="text-center">
        <span class="mdi mdi-group mx-1"></span>
        {{ filter.group }}
      </span>
    </div>
  </div>
  <div class="panel-body">
    <template v-if="displayNoteList.length < 1">
      <div class="divider"></div>
      <div class="empty">
        Click <i class="mdi mdi-plus"></i> to add note
      </div>
    </template>
    <template v-else v-for="f in displayNoteList">
      <div class="divider"></div>
      <file-item
        :file="f"
      >
      </file-item>
    </template>
    <!-- <template v-else-if="searchQuery">
      <template v-for="i in sortedNoteIdx" v-if="matchSearch(stored.noteList[i])">
        <div class="divider"></div>
        <file-item
          :file="stored.noteList[i]"
          :index="i"
          @add-tick="addTick"
          @remove-tick="removeTick"
          @open-file="openFile"
          ref="fileItem"
          :draggable="false"
          :droppable="false"
        ></file-item>
      </template>
    </template>
    <template v-else-if="filter.group != ''">
      <template v-for="s in filter.show" v-if="s != '-- No field or no group'">
        <div class="divider"></div>
        <div class="text-gray">{{ s }}</div>
        <template v-for="i in sortedNoteIdx" v-if="stored.noteList[i][filter.group] && stored.noteList[i][filter.group].content.includes(s)">
          <div class="divider"></div>
          <file-item
            :file="stored.noteList[i]"
            :index="i"
            @add-tick="addTick"
            @remove-tick="removeTick"
            @open-file="openFile"
            ref="fileItem"
            :draggable="false"
            :droppable="false"
          ></file-item>
        </template>
      </template>
      <template v-if="filter.show.includes('-- No field or no group')">
        <div class="divider"></div>
        <div class="text-gray">-- No field or no group</div>
        <template v-for="i in sortedNoteIdx" v-if="!stored.noteList[i][filter.group] || stored.noteList[i][filter.group].content.length == 0">
          <div class="divider"></div>
          <file-item
            :file="stored.noteList[i]"
            :index="i"
            @add-tick="addTick"
            @remove-tick="removeTick"
            @open-file="openFile"
            ref="fileItem"
            :draggable="false"
            :droppable="false"
          ></file-item>
        </template>
      </template>
    </template>
    <template v-else>
      <template v-for="i in sortedNoteIdx">
        <div class="divider"></div>
        <file-item
          :file="stored.noteList[i]"
          :index="i"
          @add-tick="addTick"
          @remove-tick="removeTick"
          @open-file="openFile"
          @drag-and-drop="sortNotes"
          ref="fileItem"
          :draggable="filter.sort == ''"
          :droppable="filter.sort == ''"
        ></file-item>
      </template>
      <div class="divider"></div>
      <file-item 
        :index="stored.noteList.length"
        @drag-and-drop="sortNotes"
        :draggable="false"
        :droppable="filter.sort == ''"
      ></file-item>
    </template> -->
  </div>
  <div class="panel-footer navbar" v-show="tickedFiles.length > 0">
    <div class="navbar-section">
      <button class="btn" @click="discardSelection">Discard selection</button>
    </div>
    <button class="btn ml-1" @click="deleteNotes">Delete</button>
    <!-- <button class="btn ml-1">Export</button> -->
  </div>
</div> */}