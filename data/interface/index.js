var background = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      background.message[id] = callback;
    }
  },
  "connect": function (port) {
    chrome.runtime.onMessage.addListener(background.listener); 
    /*  */
    if (port) {
      background.port = port;
      background.port.onMessage.addListener(background.listener);
      background.port.onDisconnect.addListener(function () {
        background.port = null;
      });
    }
  },
  "send": function (id, data) {
    if (id) {
      if (context !== "webapp") {
        chrome.runtime.sendMessage({
          "method": id,
          "data": data,
          "path": "interface-to-background"
        }); 
      }
    }
  },
  "post": function (id, data) {
    if (id) {
      if (background.port) {
        background.port.postMessage({
          "method": id,
          "data": data,
          "port": background.port.name,
          "path": "interface-to-background"
        });
      }
    }
  },
  "listener": function (e) {
    if (e) {
      for (var id in background.message) {
        if (background.message[id]) {
          if ((typeof background.message[id]) === "function") {
            if (e.path === "background-to-interface") {
              if (e.method === id) {
                background.message[id](e.data);
              }
            }
          }
        }
      }
    }
  }
};

var config = {
  "url": '',
  "info": null,
  "timeout": {},
  "result": null,
  "relocated": false,
  "keyup": function (e) {
    if ((e.keyCode || e.which) === 37) config.action.left();
    if ((e.keyCode || e.which) === 39) config.action.right();
  },
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "prevent": {
    "drop": function (e) {
      if (e.target.id.indexOf("fileio") !== -1) return;
      e.preventDefault();
    }
  },
  "load": function () {
    config.css = document.createElement("style");
    config.info = document.querySelector(".info");
    config.status = document.getElementById("status");
    config.renderer = document.getElementById("ebook");
    config.loading = document.getElementById("loading");
    /*  */
    config.app.listeners.add();
    document.head.appendChild(config.css);
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          var current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
      }
    }
  },
  "handle": {
    "settings": {
      "click": function (e) {
        switch (e.target.className) {
          case "print": window.print(); break;
          case "serif": config.reader.font.family = "serif"; break;
          case "sans-serif": config.reader.font.family = "sans-serif"; break;
          case "decrease-size": config.reader.font.size = config.reader.font.size > 50 ? config.reader.font.size - 1 : 50; break;
          case "increase-size": config.reader.font.size = config.reader.font.size < 300 ? config.reader.font.size + 1 : 300; break;
          case "decrease-width": config.reader.container.width = config.reader.container.width > 30 ? config.reader.container.width - 1 : 30; break;
          case "increase-width": config.reader.container.width = config.reader.container.width < 100 ? config.reader.container.width + 1 : 100; break;
          case "decrease-height": config.reader.container.line.height = config.reader.container.line.height > 1 ? config.reader.container.line.height - 0.05 : 1; break;
          case "increase-height": config.reader.container.line.height = config.reader.container.line.height < 10 ? config.reader.container.line.height + 0.05 : 10; break;
          default: break;
        }
        /*  */
        config.reader.container.line.height = Number(config.reader.container.line.height.toFixed(2));
        config.style.update();
      }
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "fetch": function (url) {
    if (url !== undefined) {
      config.url = url;
      config.reader.url = config.url;
    }
    /*  */
    if (config.url) {
      config.action.empty();
      if (config.xhr) config.xhr.abort();
      /*  */
      config.xhr = new XMLHttpRequest();
      config.xhr.open("GET", config.url, true);
      config.xhr.responseType = "arraybuffer";
      config.info.textContent = "Fetching document 0% please wait...";
      config.renderer.textContent = "Loading document, please wait...";
      /*  */
      config.xhr.onload = function () {config.render(this.response)};
      config.xhr.onerror = function () {config.info.textContent = "An error has occurred! please try again."};
      config.xhr.onprogress = function (e) {
        var percent = e.total ? Math.floor((e.loaded / e.total) * 100) : '?';
        config.info.textContent = "Fetching document " + percent + "% please wait...";
      };
      /*  */
      config.xhr.send();
    } else {
      config.render('');
    }
  },
  "app": {
    "start": function () {
      if (config.reader.url && config.reader.url !== config.url) config.result = '';
      /*  */
      config.relocated = false;
      config.url = config.reader.url;
      document.getElementById("url").value = config.reader.url;
      document.getElementById("slider").setAttribute("state", config.reader.toggle);
      document.getElementById("toggle").setAttribute("state", config.reader.toggle);
      document.getElementById("toggle").textContent = config.reader.toggle === "show" ? '▲' : '▼';
      /*  */
      document.querySelector(".footer").setAttribute("state", config.reader.toggle);
      document.querySelector(".sidebar").setAttribute("state", config.reader.toggle);
      document.querySelector(".content").setAttribute("state", config.reader.toggle);
      document.querySelector(".toolbar").setAttribute("toggle", config.reader.toggle);
      document.querySelector(".container").setAttribute("state", config.reader.toggle);
      /*  */
      var mobileview = document.querySelector("link[href='resources/mobileview.css']");
      if (!mobileview) {
        mobileview = document.createElement("link");
        mobileview.setAttribute("rel", "stylesheet");
        mobileview.setAttribute("href", "resources/mobileview.css");
        document.head.appendChild(mobileview);
      }
      /*  */
      config[config.result ? "render" : "fetch"]();
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.body.style.width = "760px";
              document.body.style.height = "550px";
            }
            /*  */
            background.connect(chrome.runtime.connect({"name": config.port.name}));
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "reader": {
    "pages": [],
    "chars": 1024,
    "ext": ".mobi",
    "engine": MobiFile,
    "elements": {"chapters": null},
    "current": {"page": {"number": 0}},
    "slider": {"mouse": {"down": false}},
    "theme": {
      set color (val) {if (val) config.storage.write("theme-color", val)},
      get color () {return config.storage.read("theme-color") !== undefined ? config.storage.read("theme-color") : "light"}
    },
    "font": {
      set size (val) {if (val) config.storage.write("font-size", val)},
      set family (val) {if (val) config.storage.write("font-family", val)},
      get size () {return config.storage.read("font-size") !== undefined ? config.storage.read("font-size") : 100},
      get family () {return config.storage.read("font-family") !== undefined ? config.storage.read("font-family") : "serif"}
    },
    "container": {
      set width (val) {if (val) config.storage.write("container-width", val)},
      get width () {return config.storage.read("container-width") !== undefined ? config.storage.read("container-width") : 100},
      "line": {
        set height (val) {if (val) config.storage.write("line-height", val)},
        get height () {return config.storage.read("line-height") !== undefined ? config.storage.read("line-height") : 1.4}
      }
    },
    set url (val) {config.storage.write("bookurl", val)},
    set toggle (val) {config.storage.write("toggle", val)},
    get url () {return config.storage.read("bookurl") !== undefined ? config.storage.read("bookurl") : ''},
    get toggle () {return config.storage.read("toggle") !== undefined ? config.storage.read("toggle") : "show"}
  },
  "style": {
    "update": function () {
      document.documentElement.setAttribute("color", config.reader.theme.color);
      /*  */
      if (config.renderer.getAttribute("empty") === null) {
        var height  = {};
        var footer = document.querySelector(".footer");
        var toolbar = document.querySelector(".toolbar");
        var container = document.querySelector(".container");
        var width = parseInt(window.getComputedStyle(document.documentElement).width);
        /*  */
        height.f = window.getComputedStyle(footer).height;
        height.t = window.getComputedStyle(toolbar).height;
        height.c = window.getComputedStyle(container).height;
        /*  */
        var state = container.getAttribute("state");
        var render = container.getAttribute("render") !== null;
        /*  */
        height.r = "calc(100vh" + " - " + height.t + " - " + height.f + " - " + (state === "hide" ? (width < 600 ? "60px" : "16px") : (render ? "20px" : "9px")) + ')';
        /*  */
        config.renderer.style.margin = "auto";
        config.renderer.style.paddingTop = "0";
        config.renderer.style.marginTop = "2px";
        config.renderer.style.height = height.r;
        config.renderer.style.maxHeight = "100%";
        config.renderer.style.paddingBottom = "0";
        config.renderer.style.paddingLeft = (width < 600 ? 5 : 10) + "px";
        config.renderer.style.paddingRight = (width < 600 ? 5 : 10) + "px";
        config.renderer.style.width = "calc(" + config.reader.container.width + '%' + ' - ' + (width < 600 ? "16px" : "26px") + ')';
        config.loading.textContent = "Font: " + config.reader.font.family + ' ' + config.reader.font.size + '%' + ", width: " + config.reader.container.width + '%' + ", line-height: " + config.reader.container.line.height + "em";
        /*  */
        config.css.textContent = `
          #ebook:not([empty]) {font-size: ${config.reader.font.size}% !important}
          #ebook:not([empty]) {font-family: ${config.reader.font.family} !important}
          #ebook:not([empty]) p {line-height: ${config.reader.container.line.height}em !important}
        `;
        /*  */
        config.action.relocated();
      }
    }
  },
  "action": {
    "slide": function (e) {
      var height = config.renderer.scrollHeight;
      config.renderer.scrollTop = Math.floor(height * (e.target.value / 100));
      /*  */
      config.action.relocated();
    },
    "left": function () {
      var min = 0;
      var scrolltop = config.renderer.scrollTop;
      var height = parseInt(window.getComputedStyle(config.renderer).height);
      config.renderer.scrollTop = (scrolltop - height) < min ? min : scrolltop - height + 42;
      /*  */
      config.action.relocated();
    },
    "right": function () {
      var max = config.renderer.scrollHeight;
      var scrolltop = config.renderer.scrollTop;
      var height = parseInt(window.getComputedStyle(config.renderer).height);
      config.renderer.scrollTop = (scrolltop + height) > max ? max : scrolltop + height - 42;
      /*  */
      config.action.relocated();
    },
    "empty": function () {
      if (config.xhr) config.xhr.abort();
      if (config.book) delete config.book;
      /*  */
      config.info.setAttribute("empty", '');
      config.renderer.setAttribute("empty", '');
      config.info.removeAttribute("chapters", '');
      config.loading.textContent = document.title;
      config.info.textContent = document.title + " is ready";
      config.status.textContent = "Chapter # - 0/0 :: 0/0, 0%";
      config.renderer.textContent = "Please enter a book URL or drag & drop an ebook file above (top-right corner)";
    },
    "relocated": function () {
      if (config.renderer.scrollHeight) {
        if (config.renderer.parentNode.scrollHeight) {
          if (config.renderer.parentNode.scrollHeight) {
            var total = config.renderer.scrollHeight / config.renderer.parentNode.scrollHeight - 1;
            if (total) {
              var percent = config.renderer.scrollTop / config.renderer.scrollHeight;
              var current = total * percent + 1;
              /*  */
              percent = Math.floor(current) === Math.floor(total) ? 100 : Math.round(percent * 100);
              config.status.textContent = "Page " + Math.floor(current) + '/' + Math.floor(total) + ' :: ' + percent + '%';
              document.querySelector("#slider input").value = percent;
            }
          }
        }
      }
    }
  }
};

config.port.connect();

background.receive("reload", function () {
  document.location.reload();
});

window.addEventListener("load", config.load, false);
document.addEventListener("keyup", config.keyup, false);
document.addEventListener("drop", config.prevent.drop, true);
window.addEventListener("resize", config.resize.method, false);
document.addEventListener("dragover", config.prevent.drop, true);
