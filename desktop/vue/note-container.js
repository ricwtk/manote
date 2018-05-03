const path = require("path");
const {mdconverter} = require(path.join(__dirname, "..", "js", "md.js"));
const field = require(path.join(__dirname, "field.js"));

module.exports = {
  props: ["openedFile", "unsaved", "id", "noteLocation"],
  data: function () {
    return {
      mdconverter: mdconverter,
      viewEdit: false
    }
  },
  computed: {
    hasUnsaved: function () {
      if (this.openedFile) {
        return JSON.stringify(this.unsaved) != JSON.stringify(this.openedFile);
      } else {
        return false;
      }
    },
    filename: function () {
      if (this.noteLocation.local && this.unsaved.id) return path.parse(this.unsaved.id).name;
      else return "";
    },
    dirname: function () {
      if (this.noteLocation.local && this.unsaved.id) return path.parse(this.unsaved.id).dir;
      else return "";
    }
  },
  components: {
    "field-single": field.single,
    "field-multiple": field.multiple,
    "field-datetime": field.datetime,
    "field-tags": field.tags,
    "modal-newfield": require(path.join(__dirname, "modal-newfield.js")),
    "modal-sortfields": require(path.join(__dirname, "modal-sortfields.js")),
    "modal-rename": require(path.join(__dirname, "modal-rename.js"))
  },
  methods: {
    toggleMore: function () {
      this.$refs.moreActions.classList.toggle("hide");
    },
    navToList: function () {

    },
    startRename: function () {

    },
    saveNote: function () {
      this.$emit("save-note");
    },
    discardUnsaved: function () {
      this.$emit("discard-unsaved");
    },
    addNewField: function (newName, fieldType) {
      this.$emit("add-new-field", newName, fieldType);
    },
    setDefault: function () {
      this.$emit("set-default");
    },
    setGlobalDefault: function () {
      this.$emit("set-global-default");
    },
    archive: function () {
      this.$emit("archive", this.unsaved.id);
    }
  },
  template: `
  <div class="note-container column col-8 col-md-12 panel hide-md" :id="id" v-show="unsaved.id">
    <div class="panel-nav v-box">
      <div class="h-box grow v-center">
        <div class="mdi mdi-chevron-left show-md nav-to-list c-hand text-center" @click="navToList"></div>
        <div v-if="noteLocation.local" class="grow" :title="unsaved.id" style="overflow: auto; white-space: nowrap">
          <div>{{ filename }} <i class="mdi mdi-pencil c-hand" @click="$refs.modalRename.toggle()"></i></div>
          <div class="text-gray" style="font-size:85%">{{ dirname }}</div>
        </div>
        <div class="text-right h-box v-center">
          <div class="mdi mdi-dots-horizontal c-hand" title="More actions" @click="toggleMore"></div>
          <div class="mx-1"></div>
          <div class="form-group v-center">
            <label class="form-switch">
              <input type="checkbox" v-model="viewEdit">
              <i class="form-icon"></i>
              <i class="mdi mdi-pencil"></i>
            </label>
          </div>
        </div>
      </div>
      <div class="h-box grow v-center wrap flex-right hide" ref="moreActions">
        <button class="btn btn-primary btn-sm mx-1 my-1" @click="setDefault">Set as default</button>
        <button class="btn btn-primary btn-sm mx-1 my-1" @click="setGlobalDefault">Set as global default</button>
        <button class="btn btn-primary btn-sm mx-1 my-1" @click="archive">Archive</button>
      </div>
    </div>

    <div class="panel-body form-group">
    
      <component v-for="key in unsaved.order" :key="key" :is="'field-' + unsaved[key].type"
        :title="key"
        :removable="true"
        v-model="unsaved[key].content"
        :editable="viewEdit"
        :displayValue="['single', 'multiple'].includes(unsaved[key].type) ? mdconverter.makeHtml(unsaved[key].content) : unsaved[key].content"
        :height="unsaved[key].height ? unsaved[key].height : 'auto'"
      ></component>

      <div v-if="viewEdit" class="navbar">
        <div class="navbar-section tile tile-centered mt-2 tooltip tooltip-top" 
          data-tooltip="Add new field"
          @click="$refs.modalNewField.toggle()" 
          v-if="Object.keys(unsaved).length > 0">
          <div class="tile-content text-center">
            <div class="mdi mdi-24px mdi-plus"></div>
          </div>
        </div>
        <div class="navbar-section tile tile-centered mt-2 tooltip tooltip-top" 
          data-tooltip="Sort fields"
          @click="$refs.modalSortFields.toggle()" 
          v-if="Object.keys(unsaved).length > 0">
          <div class="tile-content text-center">
            <div class="mdi mdi-24px mdi-sort"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer" v-show="hasUnsaved">
      <div class="toast toast-error">
        <div class="navbar">
          <div class="navbar-section">
            Unsaved
          </div>
          <button class="btn btn-primary ml-2" @click="saveNote">Save</button>
          <button class="btn btn-primary ml-2" @click="discardUnsaved">Discard</button>
        </div>
      </div>
    </div>


    <modal-newfield ref="modalNewField"
      :existed-fields="Object.keys(unsaved)"
      @new-field="addNewField"
    ></modal-newfield>
    
    <modal-sortfields ref="modalSortFields" v-if="unsaved.order" v-model="unsaved.order"></modal-sortfields>

    <modal-rename ref="modalRename" 
      :file="unsaved.id"
      @rename="(newName) => $emit('rename', newName)"
    ></modal-rename>

  </div>
  `

}


{/* <div class="note-container column col-8 col-md-12 panel hide-md" ref="noteContainer">
  <div class="panel-nav tab tab-block">
    <div class="mdi mdi-chevron-left show-md nav-to-list c-hand text-center" @click="navToList"></div>
    <div class="tab tab-block tab-item" ref="viewSwitcher">
      <div class="tab-item active" @click="switchView" ref="viewView">
        <a class="mdi mdi-24px mdi-eye"></a>
      </div>
      <div class="tab-item" @click="switchView" ref="editView">
        <a class="mdi mdi-24px mdi-pencil"></a>
      </div>
    </div>
  </div>
  <div class="panel-body form-group">
    <component v-for="key in unsaved.order" :key="key" :is="'field-' + unsaved[key].type"
      :title="key",
      :removable="!['Title', 'Content', 'Categories'].includes(key)"
      v-model="unsaved[key].content"
      :editable="viewEdit"
      :displayValue="['single', 'multiple'].includes(unsaved[key].type) ? mdconverter.makeHtml(unsaved[key].content) : unsaved[key].content"
    ></component>
  </div>

  <!-- <div class="panel-body form-group" v-if="viewEdit">
    <template v-for="key in unsaved.order">
      <input-header :label-for="'value-' + key" 
        :title="key" 
        :removable="key != 'Title' && key != 'Content' && key != 'Categories'"
        @remove="removeField(key)"></input-header>
      <textarea class="form-input" v-if="unsaved[key].type == 'multiple'" 
        :id="'value-' + key" 
        v-model="unsaved[key].content" 
        :placeholder="key" 
        :style="{ height: unsaved[key].height ? unsaved[key].height : 'auto' }"
        @mouseup="resizeTA($event, key)"
      ></textarea>
      <input class="form-input" v-else-if="unsaved[key].type == 'single'" v-model="unsaved[key].content" :id="'value-' + key" :placeholder="key">
      <div v-else-if="unsaved[key].type == 'tags'">
        <span class="chip" v-for="tag in unsaved[key].content">
          {{ tag }}&nbsp;
          <span class="mdi mdi-close" aria-label="Close" role="button" @click="removeTag(key, tag)"></span>
        </span>
        <input class="form-input" type="text" :id="'value-' + key" :placeholder="key" @keydown="updateTags($event, key)">
      </div>
      <input-datetime v-else-if="unsaved[key].type == 'datetime'" :id="'value-' + key" v-model="unsaved[key].content"></input-datetime>
    </template>
    
    <div class="navbar">
      <div class="navbar-section tile tile-centered mt-2 tooltip tooltip-top" 
        data-tooltip="Add new field"
        @click="$refs.modalNewField.toggle()" 
        v-if="Object.keys(unsaved).length > 0">
        <div class="tile-content text-center">
          <div class="mdi mdi-24px mdi-plus"></div>
        </div>
      </div>
      <div class="navbar-section tile tile-centered mt-2 tooltip tooltip-top" 
        data-tooltip="Sort fields"
        @click="$refs.modalSortFields.toggle()" 
        v-if="Object.keys(unsaved).length > 0">
        <div class="tile-content text-center">
          <div class="mdi mdi-24px mdi-sort"></div>
        </div>
      </div>
    </div>
  </div>
  <div class="panel-body form-group" v-else>
    <template v-for="key in unsaved.order">
      <input-header :title="key" :removable="false"></input-header>
      <div class="display-input md-default" v-if="unsaved[key].type == 'multiple' || unsaved[key].type == 'single'" v-html="mdconverter.makeHtml(unsaved[key].content)"></div>
      <div v-else-if="unsaved[key].type == 'tags'" class="display-input">
        <span class="chip" v-for="tag in unsaved[key].content">
          {{ tag }}
        </span>
      </div>
      <display-datetime v-else-if="unsaved[key].type == 'datetime'" :value="unsaved[key].content"></display-datetime>
    </template>
    <div v-if="unsaved.order" class="text-gray created-modified-display">Created on: {{ unsaved.created.toString() }}
      <br> Last modified: {{ unsaved.modified.toString() }}</div>
  </div> -->
  <div class="panel-footer" v-show="hasUnsaved">
    <div class="toast toast-error">
      <div class="navbar">
        <div class="navbar-section">
          Unsaved
        </div>
        <button class="btn btn-primary ml-2" @click="saveNote">Save</button>
        <button class="btn btn-primary ml-2" @click="discardUnsaved">Discard</button>
      </div>
    </div>
  </div>
</div> */}