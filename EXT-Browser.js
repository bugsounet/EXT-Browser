/**
 ** Module : EXT-Browser
 ** @bugsounet
 ** ©02-2022
 ** support: https://forum.bugsounet.fr
 **/

logBrowser = (...args) => { /* do nothing */ }

Module.register("EXT-Browser", {
  defaults: {
    debug: true,
    displayDelay: 60 * 1000,
    scrollActivate: false,
    scrollStep: 25,
    scrollInterval: 1000,
    scrollStart: 5000
  },

  start: function () {
    if (this.config.debug) logBrowser = (...args) => { console.log("[BROWSER]", ...args) }
    this.browser = {
      url: null,
      running: false
    }
    this.timerBrowser = null
  },

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  getStyles: function () {
    return [
      "EXT-Browser.css"
    ]
  },

  getTranslations: function() {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json"
    }
  },

  notificationReceived: function(noti, payload) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.preparePopup()
        this.sendSocketNotification("INIT")
        this.sendNotification("EXT_HELLO", this.name)
        break
      case "EXT_BROWSER-OPEN":
        if (!payload) return
        if (payload.startsWith("http://") || payload.startsWith("https://")) {
          this.browser.url= payload
          this.displayBrowser()
        } else {
          this.sendNotification("EXT_ALERT", {
            message: this.translate("BrowserError"),
            type: "error"
          })
        }
        break
      case "EXT_STOP":
        if (this.browser.running) this.endBrowser()
        break
      case "EXT_BROWSER-CLOSE":
        if (this.browser.running) this.endBrowser(true)
        break
       
    }
  },

  /*********************/
  /** Popup Displayer **/
  /*********************/

  preparePopup: function() {
    var Browser = document.createElement("webview")
    Browser.id = "EXT_BROWSER"
    Browser.scrolling="no"
    Browser.classList.add("hidden")
    document.body.appendChild(Browser)
  },

  displayBrowser: function() {
    logBrowser("Loading", this.browser.url)
    var webView = document.getElementById("EXT_BROWSER")
    webView.src= this.browser.url
    this.startBrowser()

    webView.addEventListener("did-fail-load", () => {
      console.log("[BROWSER] Loading error")
      this.sendNotification("EXT_ALERT", {
        message: this.translate("BrowserError"),
        type: "error"
      })
      this.endBrowser()
    })
    webView.addEventListener("crashed", (event) => {
      console.log("[BROWSER] J'ai tout pété mon général !!!")
      console.log("[BROWSER]", event)
      this.sendNotification("EXT_ALERT", {
        message: this.translate("BrowserCrash"),
        type: "error"
      })
      this.endBrowser()
    })
    webView.addEventListener("console-message", (event) => {
      if (event.level == 1 && this.config.debug) console.log("[BROWSER]", event.message)
    })
    webView.addEventListener("did-stop-loading", () => {
      if (this.browser.running || (webView.getURL() == "about:blank")) return
      this.browser.running = true
      logBrowser("URL Loaded", webView.getURL())
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
    this.timerBrowser = setTimeout(() => {
      this.endBrowser(true)
    }, this.config.displayDelay)
  },

  startBrowser: function() {
    if (!this.browser.running) this.sendNotification("EXT_ALERT", {
      message: this.translate("BrowserOpen"),
      type: "information"
    })
    clearTimeout(this.timerBrowser)
    this.timerBrowser = null
    this.hideModules()
    this.showBrowser()
  },

  endBrowser: function(extAlert=false) {
    if (extAlert) this.sendNotification("EXT_ALERT", {
      message: this.translate("BrowserClose"),
      type: "information"
    })
    this.hideBrowser()
    this.resetBrowser()
    this.showModules()
  },

  resetBrowser: function() {
    clearTimeout(this.timerBrowser)
    this.timerBrowser = null
    this.browser = {
      url: null,
      running: false
    }
    var iframe = document.getElementById("EXT_BROWSER")
    iframe.src= "about:blank"
  },

  showBrowser: function () {
    logBrowser("Show Iframe")
    var iframe = document.getElementById("EXT_BROWSER")
    iframe.classList.remove("hidden")
  },

  hideBrowser: function () {
    logBrowser("Hide Iframe")
    var iframe = document.getElementById("EXT_BROWSER")
    iframe.classList.add("hidden")
  },

  hideModules: function () {
    MM.getModules().enumerate((module)=> {
      module.hide(100, {lockString: "EXT_LOCKED"})
    })
  },

  showModules: function () {
    MM.getModules().enumerate((module)=> {
      module.show(100, {lockString: "EXT_LOCKED"})
    })
  }
})
