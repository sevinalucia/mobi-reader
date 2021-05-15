config.render = function (result) {
  config.action.empty();
  if (result !== undefined) config.result = result;
  /*  */
  if (config.result) {
    var footer = document.querySelector(".footer");
    var content = document.querySelector(".content");
    var toolbar = document.querySelector(".toolbar");
    var container = document.querySelector(".container");
    /*  */
    content.style.opacity = "0.0";
    config.info.textContent = "Loading document, please wait...";
    /*  */
    try {
      config.style.update();
      config.renderer.textContent = '';
      config.info.removeAttribute("empty");
      config.renderer.removeAttribute("empty");
      config.loading.textContent = "Loading book data...";
      /*  */
      config.book = new config.reader.engine(config.result);
      config.book.render_to("ebook");
      content.style.opacity = "1.0";
      footer.setAttribute("render", '');
      toolbar.setAttribute("render", '');
      container.setAttribute("render", '');
      /*  */
      var uid = config.book.header && config.book.header.uid ? ' - UID ' + config.book.header.uid : '';
      var record = config.book.header && config.book.header.record_num ? ', Record# ' + config.book.header.record_num : '';
      var name = config.book.header && config.book.header.name ? config.book.header.name.replace(/\0/g, '').replace(/\_/g, ' ') : "MOBI Reader";
      /*  */
      config.info.textContent = name + uid + record;
      document.title = "MOBI Reader" + (config.book.header && config.book.header.name ? " :: " + config.book.header.name.replace(/\0/g, '') : '');
      /*  */
      config.style.update();
    } catch (e) {
      content.style.opacity = "1.0";
      config.info.textContent = "An error has occurred! please try again.";
    }
  } else {
    config.style.update();
  }
};