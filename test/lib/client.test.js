import Client from "lib/traitify-client";
import {
  xdrMocks,
  xhrMocks,
  XDomainRequestMock,
  XMLHttpRequestMock
} from "support/xhr";

const responseJSON = `[{"name": "Neo"}]`;

describe("Client", () => {
  let client;

  beforeEach(() => {
    client = new Client();
  });

  describe("constructor", () => {
    it("has default host", () => {
      expect(client.version).toBe("v1");
    });

    it("has default version", () => {
      expect(client.host).toBe("https://api.traitify.com");
    });

    describe("anyIE", () => {
      afterEach(() => {
        delete window.document.documentMode;
      });

      it("should be true", () => {
        window.document.documentMode = "11";
        client = new Client();

        expect(client.anyIE).toBe(true);
      });

      it("should be false", () => {
        expect(client.anyIE).toBe(false);
      });
    });

    describe("oldIE", () => {
      afterEach(() => {
        delete global.XDomainRequest;
      });

      it("should be true", () => {
        global.XDomainRequest = XDomainRequestMock;
        client = new Client();

        expect(client.oldIE).toBe(true);
      });

      it("should be false", () => {
        expect(client.oldIE).toBe(false);
      });
    });
  });

  describe("online", () => {
    let originalValue;

    beforeAll(() => {
      originalValue = navigator.onLine;
      Object.defineProperty(navigator, "onLine", {writable: true, value: true});
    });

    afterAll(() => {
      Object.defineProperty(navigator, "onLine", {writable: false, value: originalValue});
    });

    it("should be true", () => {
      global.navigator.onLine = true;

      expect(client.online()).toBe(true);
    });

    it("should be false", () => {
      global.navigator.onLine = false;

      expect(client.online()).toBe(false);
    });
  });

  describe("setHost", () => {
    it("returns client", () => {
      const returnValue = client.setHost("http://localhost:8080");

      expect(returnValue).toEqual(client);
    });

    it("updates host", () => {
      client.setHost("http://localhost:8080");

      expect(client.host).toBe("http://localhost:8080");
    });

    it("updates host for IE", () => {
      client.oldIE = true;
      client.setHost("http://localhost:8080");

      expect(window.location.protocol).toBe("https:");
      expect(client.host).toBe("https://localhost:8080");
    });
  });

  describe("setPublicKey", () => {
    it("returns client", () => {
      const returnValue = client.setPublicKey("xyz");

      expect(returnValue).toEqual(client);
    });

    it("updates public key", () => {
      client.setPublicKey("xyz");

      expect(client.publicKey).toBe("xyz");
    });
  });

  describe("setVersion", () => {
    it("returns client", () => {
      const returnValue = client.setVersion("v2");

      expect(returnValue).toEqual(client);
    });

    it("updates version", () => {
      client.setVersion("v2");

      expect(client.version).toBe("v2");
    });
  });

  describe("ajax", () => {
    beforeEach(() => {
      client.setPublicKey("xyz");
    });

    describe("graphql", () => {
      let OriginalXMLHttpRequest;
      let params;

      beforeAll(() => {
        OriginalXMLHttpRequest = XMLHttpRequest;
        global.XMLHttpRequest = XMLHttpRequestMock;
      });

      beforeEach(() => {
        XMLHttpRequest.mockClear();
        Object.values(xhrMocks).forEach((mock) => mock.mockClear());

        params = `{ guide(localeKey:"en-US",assessmentId:"xyz") { name competencies { id name } }}`;
        client.post("/interview_guides/graphql", params);
      });

      afterAll(() => {
        global.XMLHttpRequest = OriginalXMLHttpRequest;
      });

      it("includes authorization", () => {
        expect(xhrMocks.setRequestHeader).toHaveBeenCalledWith("Authorization", `Basic ${btoa("xyz:x")}`);
      });

      it("includes headers", () => {
        expect(xhrMocks.setRequestHeader).toHaveBeenCalledWith("Content-type", "application/graphql");
        expect(xhrMocks.setRequestHeader).toHaveBeenCalledWith("Accept", "*/*");
      });

      it("passes params", () => {
        const url = xhrMocks.open.mock.calls[0][1];

        expect(url).toEqual("https://api.traitify.com/v1/interview_guides/graphql");
        expect(xhrMocks.send).toHaveBeenCalledWith(params);
      });
    });

    describe("with oldIE", () => {
      beforeAll(() => {
        global.XDomainRequest = XDomainRequestMock;
      });

      beforeEach(() => {
        XDomainRequest.mockClear();
        Object.values(xdrMocks).forEach((mock) => mock.mockClear());

        client.anyIE = true;
        client.oldIE = true;
      });

      afterAll(() => {
        delete global.XDomainRequest;
      });

      describe("request", () => {
        it("includes authorization", () => {
          client.ajax("GET", "/profiles", {locale_key: "en-us"});
          const url = xdrMocks.open.mock.calls[0][1];

          expect(url).toContain("authorization=xyz");
        });

        it("includes reset cache", () => {
          client.ajax("GET", "/profiles", {locale_key: "en-us"});
          const url = xdrMocks.open.mock.calls[0][1];

          expect(url).toContain("reset_cache=");
        });

        it("includes params", () => {
          client.ajax("GET", "/profiles", {locale_key: "en-us"});
          const url = xdrMocks.open.mock.calls[0][1];

          expect(url).toContain("locale_key=en-us");
        });

        it("doesn't require params", () => {
          client.ajax("GET", "/profiles");
          const url = xdrMocks.open.mock.calls[0][1];

          expect(url).toContain("/profiles?");
        });
      });

      describe("response", () => {
        it("returns parsed responseText", () => {
          const response = client.ajax("GET", "/profiles");
          const xhr = XDomainRequest.mock.results[0].value;

          xhr.status = 200;
          xhr.responseText = responseJSON;
          xhr.onload();

          return expect(response).resolves.toEqual([{name: "Neo"}]);
        });

        it("returns not found error", () => {
          const response = client.ajax("GET", "/profiles");
          const xhr = XDomainRequest.mock.results[0].value;

          xhr.status = 404;
          xhr.responseText = "Error: Not Found";
          xhr.onload();

          return expect(response).rejects.toEqual("Error: Not Found");
        });

        it("returns timeout error", () => {
          const response = client.ajax("GET", "/profiles");
          const xhr = XDomainRequest.mock.results[0].value;

          xhr.responseText = "Error: Timeout";
          xhr.ontimeout();

          return expect(response).rejects.toEqual("Error: Timeout");
        });

        it("returns error", () => {
          const response = client.ajax("GET", "/profiles");
          const xhr = XDomainRequest.mock.results[0].value;

          xhr.responseText = "Error";
          xhr.onerror();

          return expect(response).rejects.toEqual("Error");
        });
      });
    });

    describe("without oldIE", () => {
      let OriginalXMLHttpRequest;

      beforeAll(() => {
        OriginalXMLHttpRequest = XMLHttpRequest;
        global.XMLHttpRequest = XMLHttpRequestMock;
      });

      beforeEach(() => {
        XMLHttpRequest.mockClear();
        Object.values(xhrMocks).forEach((mock) => mock.mockClear());
      });

      afterAll(() => {
        global.XMLHttpRequest = OriginalXMLHttpRequest;
      });

      describe("request", () => {
        it("includes authorization", () => {
          client.ajax("GET", "/profiles", {locale_key: "en-us"});

          expect(xhrMocks.setRequestHeader).toHaveBeenCalledWith("Authorization", `Basic ${btoa("xyz:x")}`);
        });

        it("includes headers", () => {
          client.ajax("GET", "/profiles", {locale_key: "en-us"});

          expect(xhrMocks.setRequestHeader).toHaveBeenCalledWith("Content-type", "application/json");
          expect(xhrMocks.setRequestHeader).toHaveBeenCalledWith("Accept", "application/json");
        });

        it("passes query params", () => {
          client.ajax("GET", "/profiles", {locale_key: "en-us"});
          const url = xhrMocks.open.mock.calls[0][1];

          expect(url).toEqual("https://api.traitify.com/v1/profiles?locale_key=en-us");
          expect(xhrMocks.send).toHaveBeenCalledWith(JSON.stringify(null));
        });

        it("combines query params", () => {
          client.ajax("GET", "/profiles?per_page=10", {locale_key: "en-us"});
          const url = xhrMocks.open.mock.calls[0][1];

          expect(url).toEqual("https://api.traitify.com/v1/profiles?per_page=10&locale_key=en-us");
        });

        it("passes body params", () => {
          client.ajax("POST", "/profiles", {locale_key: "en-us"});
          const url = xhrMocks.open.mock.calls[0][1];

          expect(url).toEqual("https://api.traitify.com/v1/profiles");
          expect(xhrMocks.send).toHaveBeenCalledWith(JSON.stringify({locale_key: "en-us"}));
        });
      });

      describe("response", () => {
        it("returns if offline", () => {
          client.online = jest.fn(() => false);
          const response = client.ajax("GET", "/profiles");

          return expect(response).rejects.toBeUndefined();
        });

        it("returns parsed responseText", () => {
          const response = client.ajax("GET", "/profiles");
          const xhr = XMLHttpRequest.mock.results[0].value;

          xhr.status = 200;
          xhr.response = responseJSON;
          xhr.onload();

          return expect(response).resolves.toEqual([{name: "Neo"}]);
        });

        it("returns not found error", () => {
          const response = client.ajax("GET", "/profiles");
          const xhr = XMLHttpRequest.mock.results[0].value;

          xhr.status = 404;
          xhr.response = "Error: Not Found";
          xhr.onload();

          return expect(response).rejects.toEqual("Error: Not Found");
        });

        it("returns timeout error", () => {
          const response = client.ajax("GET", "/profiles");
          const xhr = XMLHttpRequest.mock.results[0].value;

          xhr.response = "Error: Timeout";
          xhr.ontimeout();

          return expect(response).rejects.toEqual("Error: Timeout");
        });

        it("returns error", () => {
          const response = client.ajax("GET", "/profiles");
          const xhr = XMLHttpRequest.mock.results[0].value;

          xhr.response = "Error";
          xhr.onerror();

          return expect(response).rejects.toEqual("Error");
        });

        it("catches error", () => {
          xhrMocks.send.mockImplementationOnce(() => {
            throw new SyntaxError();
          });

          const response = client.ajax("GET", "/profiles");

          return expect(response).rejects.toThrow(SyntaxError);
        });
      });

      describe("with anyIE", () => {
        beforeEach(() => {
          client.anyIE = true;
        });

        it("includes reset cache", () => {
          client.ajax("GET", "/profiles", {locale_key: "en-us"});
          const url = xhrMocks.open.mock.calls[0][1];

          expect(url).toContain("reset_cache=");
        });

        it("includes params", () => {
          client.ajax("GET", "/profiles", {locale_key: "en-us"});
          const url = xhrMocks.open.mock.calls[0][1];

          expect(url).toContain("locale_key=en-us");
        });

        it("doesn't require params", () => {
          client.ajax("GET", "/profiles");
          const url = xhrMocks.open.mock.calls[0][1];

          expect(url).toContain("/profiles?");
        });
      });
    });
  });

  describe("get", () => {
    it("makes ajax request", () => {
      client.ajax = jest.fn().mockName("ajax");
      client.get("/profiles", {locale_key: "en-us"});

      expect(client.ajax).toHaveBeenCalledWith("GET", "/profiles", {locale_key: "en-us"});
    });
  });

  describe("put", () => {
    describe("with oldIE", () => {
      beforeEach(() => {
        client.oldIE = true;
      });

      it("makes ajax request", () => {
        client.ajax = jest.fn().mockName("ajax");
        client.put("/profiles", {locale_key: "en-us"});

        expect(client.ajax).toHaveBeenCalledWith("POST", "/profiles", {locale_key: "en-us"});
      });
    });

    describe("without oldIE", () => {
      it("makes ajax request", () => {
        client.ajax = jest.fn().mockName("ajax");
        client.put("/profiles", {locale_key: "en-us"});

        expect(client.ajax).toHaveBeenCalledWith("PUT", "/profiles", {locale_key: "en-us"});
      });
    });
  });

  describe("post", () => {
    it("makes ajax request", () => {
      client.ajax = jest.fn().mockName("ajax");
      client.post("/profiles", {locale_key: "en-us"});

      expect(client.ajax).toHaveBeenCalledWith("POST", "/profiles", {locale_key: "en-us"});
    });
  });

  describe("delete", () => {
    it("makes ajax request", () => {
      client.ajax = jest.fn().mockName("ajax");
      client.delete("/profiles", {locale_key: "en-us"});

      expect(client.ajax).toHaveBeenCalledWith("DELETE", "/profiles", {locale_key: "en-us"});
    });
  });
});
