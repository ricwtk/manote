(function (window) {
  function GDrive () {
    this.clientId = "377927036124-36jqb3vhb6quno2u4bc3smlomqmsa77a.apps.googleusercontent.com";
    this.apiKey = "AIzaSyDxq3ahKLV3Q5zBKLC01-_qG3qaCNqwm0U";
    this.discoveryDocs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
    this.scopes = [
      "https://www.googleapis.com/auth/drive.appfolder"
    ].join(" ");
    this.initialised = false;
    this.initialising = false;
    this.signedIn = false;

    this.init = () => {
      this.initialising = true;
      gapi.load('client:auth2', this.initClient);
    }

    this.initClient = () => {
      gapi.client.init({
        apiKey: this.apiKey,
        clientId: this.clientId,
        discoveryDocs: this.discoveryDocs,
        scope: this.scopes
      }).then(() => {
        this.initialised = true;
        this.initialising = false;
        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
          this.signedIn = true;
          this.signedInAtInit();
        } else {
          this.signedOutAtInit();
        }
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);
        // Handle the initial sign-in state.
        this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      });
    }
    this.updateSigninStatus = (signedIn) => {
      console.log("signed in status (Google): ", signedIn);
      if (signedIn) {
        this.signedIn = true;
        this.signedInFunction();
      } else {
        this.signedIn = false;
        this.signedOutFunction();
      }
    }

    this.signedInFunction = () => {}
    this.signedOutFunction = () => {}
    this.signedInAtInit = () => {}
    this.signedOutAtInit = () => {}

    this.handleSignInClick = () => {
      gapi.auth2.getAuthInstance().signIn();
    }

    this.handleSignOutClick = () => {
      gapi.auth2.getAuthInstance().signOut();
    }

    this.notSignedIn = () => Promise.reject("Not signed in");

    this.getUserProfile = () => {
      if (this.signedIn) {
        return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      } else {
        return "";
      }
    }

    this.getDataFile = () => {
      if (this.signedIn) {
        return gapi.client.drive.files.list({
          spaces: "appDataFolder",
          q: "name='notes'"
        });
      } else {
        return this.notSignedIn();
      }
    }

    this.getData = () => {
      if (this.signedIn) {
        return this.getDataFile().then((res) => {
          if (res.result.files.length > 0) {
            return this.getFileContent(res.result.files[0].id);
          } else {
            return this.createDataFile()
            .then(() => {
              return {
                status: 200,
                body: ""
              }
            });
          }
        })
      } else {
        return this.notSignedIn();
      }
    }

    this.createDataFile = () => {
      if (this.signedIn) {
        // return gapi.client.request({
        //   path: "/upload/drive/v3/files",
        //   method: "POST",
        //   params: {
        //     uploadType: "multipart"
        //   },
        //   headers: {
        //     "Content-Type": "multipart/related; boundary=bounding"
        //   },
        //   body: "--bounding\n"
        //     + "Content-Type: application/json; charset=UTF-8\n\n"
        //     + JSON.stringify({
        //         mimeType: "application/json",
        //         parents: ["appDataFolder"],
        //         name: "notes"
        //       })
        //     + "\n\n"
        //     + "--bounding\n"
        //     + "Content-Type: application/json\n\n"
        //     + "" + "\n\n"
        //     + "--bounding--"
        // })
        return gapi.client.drive.files.create({
          resource: {
            name: "notes",
            mimeType: "text/plain",
            parents: ["appDataFolder"]
          }
        })
      } else {
        return this.notSignedIn();
      }
    }

    this.updateData = (newContent) => {
      if (this.signedIn) {
        return this.getDataFile().then((res) => {
          if (res.result.files.length > 0) {
            return gapi.client.request({
              path: "/upload/drive/v3/files/" + res.result.files[0],
              method: "PATCH",
              params: {
                uploadType: "media"
              },
              body: newContent
            })
          } else {
            return this.createDataFile().then(() => this.updateData(newContent));
          }
        })
      } else {
        return this.notSignedIn();
      }
    }

    this.init();
  }

  if(typeof(window.GDrive) === 'undefined'){
    window.GDrive = GDrive;
  }


})(window)