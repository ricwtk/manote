const fs = require("fs");
const local = require(path.join(__dirname, "get-local.js"));

class LAccess {
  constructor() {}

  removeNotes(noteIds) {
    return Promise.all(noteIds.map(id => {
      return new Promise((resolve, reject) => {
        fs.unlink(id, err => { 
          if (err) reject(err); 
          resolve(id);
        });
      });
    }));
  }

  updateNote(note) {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(note.id)) {
        // update note
      } else {
        fs.writeFile(note.id, JSON.stringify(note, null, 2), (err) => {
          if (err) reject(err);
          resolve(note.id);
        })
      }
    });
  }
}

module.exports = LAccess;