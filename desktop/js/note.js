const Vue = require(path.join(__dirname, "vue.min.js"));
const fs = require("fs");

class Field {
  constructor(type, content, height) {
    this.type = type ? type : "single"; // single, multiple, datetime, tags
    switch (this.type) {
      default:
      case "single": 
        this.content = content ? content : "";
        break;
      case "multiple":
        this.content = content ? content : "";
        this.height = height ? height : "auto";
        break;
      case "datetime":
        this.content = content ? content : (new Date()).toISOString().substr(0,16);
        break;
      case "tags":
        this.content = content ? [ ...Array.isArray(content) ? content : [ content ] ] : [];
        break;
    }
  }
}

class Note {
  constructor(id, createdOn, modifiedOn, others) {
    this.id = id;
    this.created = createdOn ? new Date(createdOn) : new Date();
    this.modified = modifiedOn ? new Date(modifiedOn) : this.created;
    if (others)
      this.order = others.order ? others.order.slice() : [];
    else
      this.order = [];
    if (others) {
      Object.keys(others).forEach((el) => {
        if (others[el] && others[el].type) this.addNewField(el, others[el].type, others[el].content, others[el].height);
      })
    }
  }

  addNewField(name, type, content, height) {
    Vue.set(this, name, new Field(type, content, height));
    if (!this.order.includes(name)) {
      this.order.push(name);
    }
  }

  updateField(name, type, content, height) {
    if (!this[name]) return null;
    if (content == undefined) {
      console.error("content must be specified in Note.updateField(name, type, content, height)");
    }
    this[name].type = type;
    this[name].content = content;
    if (this[name].type == "multiple") {
      Vue.set(this[name], "height", height ? height : "auto");
    } else {
      Vue.delete(this[name], "height");
    }
  }

  removeField(name) {
    if (this[name]) {
      Vue.delete(this, name);
      if (this.order.indexOf(name) > -1) this.order.splice(this.order.indexOf(name), 1);
    }
  }

  copy() {
    return new Note(this.id, this.created, this.modified, this);
  }

  updateFrom(anotherNote) {
    let keysInAnotherNote = Object.keys(anotherNote);
    this.order = anotherNote.order;
    this.modified = anotherNote.modified;
    keysInAnotherNote.forEach(aNkey => {
      if (!["id", "created", "modified", "order"].includes(aNkey)) {
        if (!this[aNkey]) {
          this.addNewField(aNkey, anotherNote[aNkey].type, anotherNote[aNkey].content, anotherNote[aNkey].height);
        } else if (JSON.stringify(this[aNkey]) != JSON.stringify(anotherNote[aNkey])) {
          this.updateField(aNkey, anotherNote[aNkey].type, anotherNote[aNkey].content, anotherNote[aNkey].height);
        }
      }
    });
    Object.keys(this).filter(key => !keysInAnotherNote.includes(key)).forEach(key => {
      this.removeField(key);
    });
  }

  modifiedOn(date) {
    Vue.set(this, "modified", date);
  }

  saveToFile(file) {
    fs.writeFile(file, JSON.stringify(this, null, 2), (err) => {
      if (err) console.log(err);
    })
  }

  static createWithFields(fields) {
    let note = new Note("default");
    ["id", "created", "modified"].forEach(key => {
      note[key] = "";
    });
    fields.forEach(f => {
      note.addNewField(f.name, f.type);
    })
    return note;
  }
}

module.exports = {
  Note: Note
}