import queryString from "query-string";

export default class TraitifyClient {
  constructor() {
    this.host = "https://api.traitify.com";
    this.version = "v1";
    this.anyIE = !!window.document.documentMode;
    this.oldIE = typeof XDomainRequest !== "undefined";
  }
  online() { return navigator.onLine; }
  setHost = (host) => {
    this.host = host;
    if(this.oldIE) {
      this.host = this.host.replace("https://", "").replace("http://", "");
      this.host = `${window.location.protocol}//${this.host}`;
    }
    return this;
  }
  setPublicKey = (key) => {
    this.publicKey = key;
    return this;
  }
  setVersion = (version) => {
    this.version = version;
    return this;
  }
  handlePromise = (requestType, _xhr, params) => {
    const xhr = _xhr;
    const promise = new Promise((resolve, reject) => {
      if(!this.online()) { return reject(); }
      try {
        xhr.onload = () => {
          if(xhr.status >= 400) {
            reject(xhr.response || xhr.responseText);
          } else {
            resolve(JSON.parse(xhr.response || xhr.responseText));
          }
        };
        xhr.onerror = () => { reject(xhr.response || xhr.responseText); };
        xhr.ontimeout = () => { reject(xhr.response || xhr.responseText); };
        const send = requestType === "graphql" ? () => { xhr.send(params); } : () => { xhr.send(JSON.stringify(params)); };

        this.oldIE ? window.setTimeout(send, 0) : send();
      } catch(error) { reject(error); }
    });

    promise.xhr = xhr;
    return promise;
  }
  ajax = (method, path, _params) => {
    let params;
    let url = `${this.host}/${this.version}${path}`;
    let xhr;
    if(_params && ["get", "delete"].includes(method.toLowerCase())) {
      url += url.indexOf("?") === -1 ? "?" : "&";
      url += queryString.stringify(_params);
      params = null;
    } else {
      params = _params;
    }

    if(path.includes("graphql")) {
      xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Authorization", `Basic ${btoa(`${this.publicKey}:x`)}`);
      xhr.setRequestHeader("Content-type", "application/graphql");
      xhr.setRequestHeader("Accept", "*/*");

      return this.handlePromise("graphql", xhr, params);
    }

    if(this.anyIE) {
      url += url.indexOf("?") === -1 ? "?" : "&";
      url += queryString.stringify({reset_cache: (new Date()).getTime()});
    }

    if(this.oldIE) {
      url += queryString.stringify({authorization: this.publicKey});
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Authorization", `Basic ${btoa(`${this.publicKey}:x`)}`);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.setRequestHeader("Accept", "application/json");
    }

    return this.handlePromise("rest", xhr, params);
  }
  get = (path, params) => (this.ajax("GET", path, params))
  put = (path, params) => (this.ajax(this.oldIE ? "POST" : "PUT", path, params))
  post = (path, params) => (this.ajax("POST", path, params))
  delete = (path, params) => (this.ajax("DELETE", path, params))
}
