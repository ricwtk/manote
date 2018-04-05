var currentUser = {
  name: null,
  email: null,
  profilePic: null
}

var stored = {
  fileList: [{
    id: "abcdefg",
    title: "title",
    content: "ancdalfjsalsidjaijdsfaldjfaldsjfdicjoiadbsaflhsidoifadsfasdacwdss"
  }]  
}

var defaultContent = `
[
  ["Title", "single", ""],
  ["Content", "multiple", ""],
  ["Categories", "tags", ""]
]
`

new Vue({
  el: "#navbar",
  data: {
    currentUser: currentUser
  },
  methods: {
    toggleSidebar: function () {
      if (currentUser.name) {
        this.$refs.sidebar.classList.toggle("active");
      }
    },
    signInGoogle: function () {
      gd.handleSignInClick();
    },
    signOutGoogle: function () {
      gd.handleSignOutClick();
    }
  }
})

Vue.component("file-item", {
  props: ["file"],
  data: function () {
    return {
    }
  },
  methods: {
    openFile: function (ev) {
      this.$emit("open-file", this.file.id);
    },
    tickFile: function (ev) {
      if (ev.target == this.$refs.ticked) {
        if (ev.target.checked) this.$emit("add-tick", this.file.id);
        else this.$emit("remove-tick", this.file.id);
      }
    }
  },
  template: `
  <div class="tile tile-centered p-2" @click="openFile">
    <div class="tile-icon">
      <label class="form-checkbox" @click.stop="tickFile">
        <input type="checkbox" ref="ticked">
        <i class="form-icon"></i>
      </label>
    </div>
    <div class="tile-content">
      <div class="tile-title">{{ file.title }}</div>
      <div class="tile-subtitle text-gray text-ellipsis">{{ file.content }}</div>
    </div>
  </div>
  `
})

new Vue({
  el: "#note-list-and-display",
  data: {
    tickedFiles: [],
    stored: stored,
    openedFile: {
      id: "",
      content: {}
    },
    unsaved: [
      ["title", "single", "abc"],
      ["content", "multiple", "abcdefghijklmn"]
    ],
    viewEdit: false
  },
  methods: {
    addTick: function (fileId) {
      console.log("ticking", fileId);
      this.tickedFiles.push(fileId);
    },
    removeTick: function (fileId) {
      console.log("remove tick", fileId);
      this.tickedFiles = this.tickedFiles.filter(item => item !== fileId);
    },
    openFile: function (fileId) {
      console.log("opening", fileId);
    },
    discardSelection: function () {
      document.querySelectorAll(".list-container input[type='checkbox']").forEach(el => {
        el.checked = false;
      });
      this.tickedFiles = [];
    },
    addNewNote: function () {
      gd.createFile(defaultContent)
        .then((res) => {
          console.log(res);
        })
        .then(updateList);
    },
    deleteNotes: function () {
      Promise.all(this.tickedFiles.map((fid) => {
        return gd.deleteFile(fid)
      })).then((results) => {
        console.log(results);
        this.tickFiles = [];
      }).then(updateList);
    },
    addNewField: function () {
      this.unsaved.push(["", "single", ""]);
    },
    toggleNewFieldEntry: function () {
      this.$refs.modalNewField.classList.toggle("active");
    },
    switchView: function (ev) {
      for (let child of this.$refs.viewSwitcher.children) {
        if (child == ev.target || child.firstElementChild == ev.target) {
          child.classList.add("active");
          this.viewEdit = child == this.$refs.editView;
          console.log(this.viewEdit);
        } else {
          child.classList.remove("active");
        }
      }
    }
  }
})

function updateList() {
  return gd.getFullList().then((files) => {
    console.log(files);
    stored.fileList = files;
    return files;
  })
}

function initApis() {
  gd = new GDrive();
  gd.signedInFunction = () => {
    let gUser = gd.getUserProfile();
    currentUser.name = gUser.getName();
    currentUser.email = gUser.getEmail();
    currentUser.profilePic = gUser.getImageUrl();
    updateList();
  }

  gd.signedOutFunction = () => {
    currentUser.name = null;
    currentUser.email = null;
    currentUser.profilePic = null;
  }

  gd.signedInAtInit = () => {
    document.querySelectorAll(".sidebar")[0].classList.remove("active");
  }

  gd.signedOutAtInit = () => {
    document.querySelectorAll(".sidebar")[0].classList.add("active");
  }
}