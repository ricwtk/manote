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

    this.getUserProfile = () => {
      if (this.signedIn) {
        return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      } else {
        return "";
      }
    }

    this.getFullList = (files, nextPageToken) => {
      if (this.signedIn) {
        if (!files) {
          files = [];
        }
        let config = {
          spaces: "appDataFolder",
          fields: "nextPageToken, files(id, createdTime, modifiedTime)"
        };
        if (nextPageToken) {
          config[pageToken] = nextPageToken;
        }
        return gapi.client.drive.files.list(config).then((res) => {
          if (res.result.nextPageToken) {
            return this.getFullList([...files, ...res.result.files], res.nextPageToken);
          } else {
            return [...files, ...res.result.files];
          }
        });
      } else {
        return null;
      }
    }

    this.getFileContent = (fileId) => {
      if (this.signedIn) {
        return gapi.client.drive.files.get({
          fileId: fileId,
          alt: "media"
        });
      } else {
        return null;
      }
    }

    this.createFile = (fileContent) => {
      if (this.signedIn) {
        return gapi.client.request({
          path: "/upload/drive/v3/files",
          method: "POST",
          params: {
            uploadType: "multipart"
          },
          headers: {
            "Content-Type": "multipart/related; boundary=bounding"
          },
          body: "--bounding\n"
            + "Content-Type: application/json; charset=UTF-8\n\n"
            + JSON.stringify({
                mimeType: "application/json",
                parents: ["appDataFolder"]
              })
            + "\n\n"
            + "--bounding\n"
            + "Content-Type: application/json\n\n"
            + fileContent + "\n\n"
            + "--bounding--"
        })
      }
    }

    this.updateFileContent = (fileId, newContent) => {
      if (this.signedIn) {
        return gapi.client.request({
          path: "/upload/drive/v3/files/" + fileId,
          method: "PATCH",
          params: {
            uploadType: "media"
          },
          body: newContent
        })
      } else {
        return null;
      }
    }

    this.deleteFile = (fileId) => {
      if (this.signedIn) {
        return gapi.client.drive.files.delete({
          fileId: fileId
        });
      } else {
        return null;
      }
    }



    this.init();
  }

  if(typeof(window.GDrive) === 'undefined'){
    window.GDrive = GDrive;
  }


})(window)