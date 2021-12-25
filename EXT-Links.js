/**
 ** Module : EXT-Links
 ** @bugsounet
 ** ©01-2022
 ** support: http://forum.bugsounet.fr
 **/

logLinks = (...args) => { /* do nothing */ }

Module.register("EXT-Links", {
  defaults: {
    debug: true,
    displayDelay: 60 * 1000,
    scrollActivate: false,
    scrollStep: 25,
    scrollInterval: 1000,
    scrollStart: 5000
  },

  start: function () {
    if (this.config.debug) logLinks = (...args) => { console.log("[LINKS]", ...args) }
    this.Response = {
      photos: {
        displayed: false,
        position: 0,
        urls: null,
        length: 0
      },
      links: {
        displayed: false,
        urls: null,
        length: 0,
        running: false
      }
    }
    this.timerLinks = null
  },

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  getStyles: function () {
    return [
      "EXT-Links.css"
    ]
  },

  notificationReceived: function(noti, payload) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.preparePopup()
        this.sendSocketNotification("INIT", this.config)
        break
      case "EXT_LINKS":
        this.scanResponse(payload)
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
   
    }    
  },

  /*********************/
  /** Popup Displayer **/
  /*********************/

  preparePopup: function() {
    var Links = document.createElement("webview")
    Links.id = "EXT_LINKS"
    Links.scrolling="no"
    Links.classList.add("hidden")
    document.body.appendChild(Links)
  },

  /*******************/
  /** Scan Response **/
  /*******************/

  scanResponse: function(response) {
    let tmp = {}
    logLinks("Response Scan")
    tmp = {
      photos: {
        position: 0,
        urls: response.photos,
        length: response.photos.length,
      },
      links: {
        urls: response.urls,
        length: response.urls.length
      }
    }

    /** the show must go on ! **/
    this.Response = configMerge({}, this.Response, tmp)
    if(this.Response.photos.length > 0) {
      // @To see what i do
    }
    else if (this.Response.links.length > 0) {
      this.urlsScan()
    }
    logLinks("Response Structure:", this.Response)
  },

  /** urls scan : dispatch links, youtube, spotify **/
  /** use the FIRST discover link only **/
  urlsScan: function() {
    let tmp = {}
    /** search YT links **/

    var YouTubeRealLink= this.Response.links.urls[0]
    /** YouTube RegExp **/
    var YouTubeLink = new RegExp("youtube\.com\/([a-z]+)\\?([a-z]+)\=([0-9a-zA-Z\-\_]+)", "ig")
    /** Scan Youtube Link **/
    var YouTube = YouTubeLink.exec(YouTubeRealLink)

    if (YouTube) {
      /** @todo send to EXT-YOUTUBE module **/
      /*
      let Type
      let YouTubeResponse = {}
      if (this.EXT.radioPlayer.play) this.radioStop()
      if (this.EXT.music.connected) {
        this.sendSocketNotification("MUSIC_STOP")
      }
      if (this.EXT.spotify.player && this.config.spotify.useSpotify) {
        this.sendSocketNotification("SPOTIFY_PAUSE")
      }
      if (YouTube[1] == "watch") Type = "id"
      if (YouTube[1] == "playlist") Type = "playlist"
      if (!Type) return console.log("[GA:EXT:YouTube] Unknow Type !" , YouTube)
      YouTubeResponse = {
        "id": YouTube[3],
        "type": Type
      }
      this.EXT.youtube = this.objAssign({}, this.EXT.youtube, YouTubeResponse)
      this.EXTLock()
      if (!this.config.youtube.useVLC) {
        var YT = document.getElementById("EXT_YOUTUBE")
        YT.src= "http://youtube.bugsounet.fr/?id="+ this.EXT.youtube.id + "&username=" + this.config.youtube.username + "&token=" + this.config.youtube.token + "&seed="+Date.now()
      }
      else {
        this.EXT.youtube.displayed = true
        this.showYT()
        this.sendSocketNotification("VLC_YOUTUBE", YouTubeRealLink)
      }
      */
      return
    }

    
    /** scna spotify links **/
    /** Spotify RegExp **/
    var SpotifyLink = new RegExp("open\.spotify\.com\/([a-z]+)\/([0-9a-zA-Z\-\_]+)", "ig")
    var Spotify = SpotifyLink.exec(this.Response.links.urls[0])

    if (Spotify) {
      /** @todo send to EXT-SPOTIFY module **/
      /*
      if (this.EXT.radioPlayer.play) this.radioStop()
      if (this.EXT.music.connected) {
        this.sendSocketNotification("MUSIC_STOP")
      }
      if (!this.EXT.spotify.connected && this.config.deviceName) {
        this.sendSocketNotification("SPOTIFY_TRANSFER", this.config.deviceName)
      }

      setTimeout(() => {
        let type = Spotify[1]
        let id = Spotify[2]
        if (type == "track") {
          // don't know why tracks works only with uris !?
          this.sendSocketNotification("SPOTIFY_PLAY", {"uris": ["spotify:track:" + id ]})
        }
        else {
          this.sendSocketNotification("SPOTIFY_PLAY", {"context_uri": "spotify:"+ type + ":" + id})
        }
      }, this.config.spotify.playDelay)
      */
      return
    }

    //this.EXTLock()
    this.Response.links.displayed = true
    this.linksDisplay()
  },

/** link display **/
  linksDisplay: function() {
    this.Response.links.running = false
    var webView = document.getElementById("EXT_LINKS")
    //this.Informations({message: "LinksOpen" })
    logLinks("Loading", this.Response.links.urls[0])
    this.modulesHide()
    this.linksShow()
    webView.src= this.Response.links.urls[0]

    webView.addEventListener("did-fail-load", () => {
      console.log("[LINKS] Loading error")
    })
    webView.addEventListener("crashed", (event) => {
      console.log("[LINKS] J'ai tout pété mon général !!!")
      console.log("[LINKS]", event)
    })
    webView.addEventListener("console-message", (event) => {
      if (event.level == 1 && this.config.debug) console.log("[LINKS]", event.message)
    })
    webView.addEventListener("did-stop-loading", () => {
      if (this.Response.links.running || (webView.getURL() == "about:blank")) return
      this.Response.links.running = true
      logLinks("URL Loaded", webView.getURL())
      webView.executeJavaScript(`
      var timer = null
      function scrollDown(posY){
        clearTimeout(timer)
        timer = null
        var scrollHeight = document.body.scrollHeight
        if (posY == 0) console.log("Begin Scrolling")
        if (posY > scrollHeight) posY = scrollHeight
        document.documentElement.scrollTop = document.body.scrollTop = posY;
        if (posY == scrollHeight) return console.log("End Scrolling")
        timer = setTimeout(function(){
          if (posY < scrollHeight) {
            posY = posY + ${this.config.scrollStep}
            scrollDown(posY);
          }
        }, ${this.config.scrollInterval});
      };
      if (${this.config.scrollActivate}) {
        setTimeout(scrollDown(0), ${this.config.scrollStart});
      };`)
    })
    this.timerLinks = setTimeout(() => {
      //this.Informations({message: "LinksClose" })
      this.linksHide()
      this.resetLinks()
      this.modulesShow()
    }, this.config.displayDelay)
  },

  resetLinks: function() {
    clearTimeout(this.timerLinks)
    this.timerLinks = null
    let tmp = {
      links: {
        displayed: false,
        urls: null,
        length: 0,
        running: false
      }
    }
    this.Response = configMerge({}, this.Response, tmp)
    var iframe = document.getElementById("EXT_LINKS")
    iframe.src= "about:blank"
    iframe.classList.add
    logLinks("Reset Links", this.Response)
  },

  linksShow: function () {
    logLinks("Show Iframe")
    var iframe = document.getElementById("EXT_LINKS")
    iframe.classList.remove("hidden")
  },

  linksHide: function () {
    logLinks("Hide Iframe")
    var iframe = document.getElementById("EXT_LINKS")
    iframe.classList.add("hidden")
  },

  modulesHide: function () {
    MM.getModules().enumerate((module)=> {
      module.hide(100, {lockString: "EXT_LOCKED"})
    })
  },

  modulesShow: function () {
    MM.getModules().enumerate((module)=> {
      module.show(100, {lockString: "EXT_LOCKED"})
    })
  }
})
