/**
 ** Module : EXT-Browser
 ** @bugsounet
 ** ©03-2023
 ** support: https://forum.bugsounet.fr
 **/

logBrowser = (...args) => { /* do nothing */ };

Module.register("EXT-Browser", {
  defaults: {
    debug: false,
    displayDelay: 60 * 1000,
    scrollActivate: true,
    scrollStep: 25,
    scrollInterval: 1000,
    scrollStart: 5000
  },

  start () {
    if (this.config.debug) logBrowser = (...args) => { console.log("[BROWSER]", ...args); };
    this.ready = false;
    this.BrowserDisplay = new BrowserDisplay(this);
  },

  getDom () {
    var dom = document.createElement("div");
    dom.style.display = "none";
    return dom;
  },

  getStyles () {
    return [
      "EXT-Browser.css"
    ];
  },

  getScripts () {
    return [
      "/modules/EXT-Browser/components/BrowserDisplay.js"
    ];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json",
      tr: "translations/tr.json"
    };
  },

  notificationReceived (noti, payload, sender) {
    switch(noti) {
      case "GA_READY":
        if (sender.name === "MMM-GoogleAssistant") {
          this.sendSocketNotification("INIT");
          this.BrowserDisplay.preparePopup();
          this.sendNotification("EXT_HELLO", this.name);
          this.ready = true;
        }
        break;
      case "EXT_BROWSER-OPEN":
        if (!payload || !this.ready) return;
        if (payload.startsWith("http://") || payload.startsWith("https://")) {
          this.BrowserDisplay.browser.url= payload;
          this.BrowserDisplay.displayBrowser();
        } else {
          this.sendNotification("EXT_ALERT", {
            message: this.translate("BrowserError"),
            type: "error"
          });
        }
        break;
      case "EXT_STOP":
      case "EXT_BROWSER-CLOSE":
        if (this.BrowserDisplay.browser.running) this.BrowserDisplay.endBrowser(true);
        break;
    }
  }
});
