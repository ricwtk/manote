const path = require("path");

module.exports = {
  props: ["noteLocation", "noteList", "openedDir", "id"],
  data: function () {
    return {      
      filter: {
        sort: "",
        group: "",
        show: []
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
      // filter search
      let strForSearch = this.displayNoteList.map(note => 
        [
          note.id, 
          ...Object.keys(note)
            .filter(k => note[k].type)
            .map(k => k + " " + note[k].content)
        ].join(" ").toLowerCase()
      );
      indices = indices.filter(i => this.searchQuery.split(" ").some(el => strForSearch[i].indexOf(el.toLowerCase()) > -1));
      // arrange sort
      if (this.filter.sort) {
        if (["File name", "Directory name"].includes(this.filter.sort)) {
          indices.sort((a,b) => {
            let itemA = path.parse(this.displayNoteList[a].id);
            let itemB = path.parse(this.displayNoteList[b].id);
            itemA = this.filter.sort == "File name" ? itemA.name : itemA.dir;
            itemB = this.filter.sort == "File name" ? itemB.name : itemB.dir;
            if (itemA < itemB) return -1;
            else if (itemA > itemB) return 1;
            else return 0;
          });
        } else {
          let sortable = indices.filter(v => this.displayNoteList[v].hasOwnProperty(this.filter.sort));
          let unsortable = indices.filter(v => !this.displayNoteList[v].hasOwnProperty(this.filter.sort));
          sortable.sort((a,b) => {
            let itemA = this.displayNoteList[a][this.filter.sort];
            let itemB = this.displayNoteList[b][this.filter.sort];
            itemA = itemA.type ? itemA.content : itemA;
            itemB = itemB.type ? itemB.content : itemB;
            if (itemA < itemB) return -1;
            else if (itemA > itemB) return 1;
            else return 0;
          });
          indices = [...sortable, ...unsortable];
        }
      }
      // group
      if (this.filter.group) {
        let groupedIdx = [];
        this.filter.show.forEach(it => {
          groupedIdx = [...groupedIdx, it];
          if (it == "-- No field or no group") {
            groupedIdx = [...groupedIdx, ...indices.filter(i => !this.displayNoteList[i][this.filter.group] || this.displayNoteList[i][this.filter.group].content.length == 0)];
          } else if (this.filter.group == "Directory") {
            groupedIdx = [...groupedIdx, ...indices.filter(i => path.parse(this.displayNoteList[i].id).dir == it)];
          } else {
            groupedIdx = [...groupedIdx, ...indices.filter(i => this.displayNoteList[i][this.filter.group] && this.displayNoteList[i][this.filter.group].content.includes(it))];
          }
        });
        indices = groupedIdx;
      }
      return indices;
    },
    sortableFields: function () { 
      return Array.from( 
        new Set(
          [ 
            ...this.noteLocation.local ? ["File name", "Directory name"] : [],
            ...this.displayNoteList.map(el =>  
              Object.keys(el).filter(k => 
                ['created', 'modified'].includes(k) || 
                ( el[k].type && ["single", "datetime"].includes(el[k].type) )
              ) 
            ).reduce((acc, el) => acc.concat(el), []) 
          ]
        ) 
      ); 
    }, 
    groupableFields: function () { 
      return Array.from( 
        new Set( 
          [
            ...this.noteLocation.local ? ["Directory"] : [],
            ...this.displayNoteList.map(el =>  
              Object.keys(el).filter(k =>  
                el[k].type && ["tags"].includes(el[k].type) 
              ) 
            ).reduce((acc, el) => acc.concat(el), []) 
          ]
        ) 
      ); 
    },
    availableGroups: function () {
      return this.groupableFields.map(field => {
        if (field == "Directory") {
          return Array.from(
            new Set ( 
              this.displayNoteList.map( el => 
                path.parse(el.id).dir
              ) 
            )
          );
        } else {
          return [...Array.from(
            new Set (
              this.displayNoteList.map(el => 
                el[field] ? el[field].content : []
              ).reduce((acc, el) => acc.concat(el), [])
            )
          ), "-- No field or no group"];
        }
      });
    },
  },
  components: {
    "search-bar": require(path.join(__dirname, "search-bar.js")),
    "file-item": require(path.join(__dirname, "file-item.js")),
    "list-selection": require(path.join(__dirname, "list-selection.js")),
    "modal-sortnote": require(path.join(__dirname, "modal-sortnote.js"))
  },
  methods: {
    toggle: function () {
      this.$el.classList.toggle("hide-md")
    },
    show: function () {
      this.$el.classList.remove("hide-md");
    },
    hide: function () {
      this.$el.classList.add("hide-md");
    },
    resetFilter: function () {
      this.filter.sort = "";
      this.filter.group = "";
      this.filter.show = [];
    },
    addNewNote: function () {
      if (this.noteLocation.local) {
        this.$refs.dirOfNew.toggle();
      } else {
        this.$emit("create-note");
      }
    },
    unselectAllItems: function () {
      this.$refs.fileItems.forEach(fi => { fi.clearSelect() });
    },
    selectFileItem: function (el) {
      this.$refs.fileItems.forEach(fi => {
        if (fi.$el == el) fi.setSelect();
        else fi.clearSelect();
      });
    },
    selectFile: function (f) {
      this.$refs.fileItems.forEach(fi => {
        console.log(fi.file.id, f);
        if (fi.file.id == f) {
          fi.setSelect();
          this.$emit("open-file", fi.file);
        }
        else fi.clearSelect();
      });
    },
    openFile: function (el, f) {
      this.selectFileItem(el);
      this.$emit("open-file", f);
    },
    selectDirOfNew: function (dirOfNew) {
      this.$emit("create-note", dirOfNew);
    },
    addOpenedDir: function () {
      this.$emit("add-opened-dir");
    },
    discardSelection: function () {
      this.$refs.fileItems.forEach(fi => { fi.isTicked = false; });
      this.checkTick();
    },
    archiveNotes: function () {
      this.$emit("archive-notes", this.$refs.fileItems.filter(fi => fi.isTicked).map(fi => fi.file));
    },
    deleteNotes: function () {
      this.$emit("delete-notes", this.$refs.fileItems.filter(fi => fi.isTicked).map(fi => fi.file));
    },
    checkTick: function () {
      this.$nextTick(() => {
        this.hasTick = this.$refs.fileItems ? this.$refs.fileItems.some(fi => fi.isTicked) : false;
      });
    },
    getFileItemTitle: function (file) {
      if (this.noteLocation.local) {
        return path.parse(file.id).name;
      } else {
        return file.Title ? file.Title.content : "Untitled -- edit or add 'Title' field";
      }
    },
    getFileItemSubtitle: function (file) {
      if (this.noteLocation.local) {
        return this.openedDir.getShortened(path.parse(file.id).dir);
      } else {
        return "";
      }
    },
    sortNotes: function (shiftFrom, shiftTo) {
      this.$emit("sort-notes", shiftFrom, shiftTo);
    }
  },
  template: `
  <div class="list-container column col-md-12 panel" :id="id">

    <div class="panel-header">
      <div class="panel-title navbar">
        <div class="navbar-section">
          <div :class="['mdi', 'mdi-24px', ...(filter.sort || filter.group) ? ['mdi-filter', 'text-primary'] : ['mdi-filter-outline']]" 
            @click="$refs.sortNoteUi.toggle()"
          ></div>
          <search-bar v-model="searchQuery"></search-bar>
        </div>
        <div class="my-button c-hand mdi mdi-24px mdi-plus" @click="addNewNote"></div>
      </div>
      <div class="bg-primary my-1 h-box" v-if="filter.sort || filter.group" @click="$refs.sortNoteUi.toggle()" style="font-size: 85%">
        <span class="grow no-basis no-break" :title="filter.sort ? 'sort by ' + filter.sort : null">
          <span class="mdi mdi-sort mx-1"></span>
          {{ filter.sort ? filter.sort : "--" }}
        </span>
        <span class="grow no-basis no-break" :title="filter.group ? 'group by ' + filter.group : null">
          <span class="mdi mdi-group mx-1"></span>
          {{ filter.group ? filter.group : "--" }}
        </span>
        <span class="mdi mdi-filter-remove-outline mx-1" @click.stop="resetFilter" title="remove filters"></span>
      </div>
    </div>

    <div class="panel-body">
      <template v-if="displayNoteList.length < 1">
        <div class="divider"></div>
        <div class="empty">
          Click <i class="mdi mdi-plus"></i> to add note
        </div>
      </template>
      <template v-else v-for="v,i in sortedNoteIdx">
        <div v-if="typeof(v) == 'string'" class="divider" :data-content="v"></div>
        <template v-else>
          <div class="divider" v-if="i == 0 || typeof(sortedNoteIdx[i-1]) !== 'string'"></div>
          <file-item ref="fileItems"
            :draggable="!noteLocation.local && !filter.sort && !filter.group"
            :droppable="!noteLocation.local && !filter.sort && !filter.group"
            :index="i"
            :file="displayNoteList[v]"
            :title="getFileItemTitle(displayNoteList[v])"
            :subtitle="getFileItemSubtitle(displayNoteList[v])"
            @click="openFile"
            @tick="checkTick"
            @drag-and-drop="sortNotes"
          >
          </file-item>
        </template>
      </template>
      <div class="divider"></div>
    </div>

    <div class="panel-footer navbar" v-if="hasTick">
      <div class="navbar-section">
      </div>
      <div class="text-right">
        <button class="btn btn-primary my-1" @click="discardSelection">Discard selection</button>
        <button class="btn btn-primary ml-1 my-1" @click="archiveNotes">Archive</button>
        <button class="btn btn-primary ml-1 my-1" @click="deleteNotes">Delete</button>
      </div>
    </div>

    <list-selection ref="dirOfNew"
      header-text="Choose from opened directories to create new note in"
      :list="openedDir.list"
      :allow-new="true"
      @selected="selectDirOfNew"
      @add-new="addOpenedDir"
    ></list-selection>

    <modal-sortnote ref="sortNoteUi"
      v-model="filter"
      :sortable-fields="sortableFields"
      :groupable-fields="groupableFields"
      :available-groups="availableGroups"
    ></modal-sortnote>

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