function Fetch() {
  class MyPromise extends Promise {
    static withResolvers() {
      let resolve, reject;
      const promise = new this((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    toJson(cb = (i) => i) {
      return this.then(({ body }) => cb(JSON.parse(body)));
    }

    toStr(cb = (i) => i) {
      return this.then(({ body }) =>
        typeof body === "string" ? cb(body) : cb(JSON.stringify(body, null, 2))
      );
    }

    toBinaryString(uint8Array) {
      return uint8Array.reduce((a, b) => a + String.fromCharCode(b), "");
    }

    toBase64Image(web) {
      return this.then(({ body, bodyBytes, headers }) => {
        const mime = web ? `data:${headers["Content-Type"]};base64,` : "";

        const bStr = bodyBytes
          ? this.toBinaryString(new Uint8Array(bodyBytes))
          : this.toBinaryString(body);

        return mime + btoa(bStr);
      });
    }
  }

  class Fetch {
    static setResponse(cb) {
      this.#defaultSend = cb.bind(this);
      return this;
    }

    static #requestHandlers = {
      Default(options, resolve) {
        $.http[options.method.toLocaleLowerCase()](options).then(res => resolve(res))
      }
    };

    static #defaultSend = ({ error, body, bodyBytes, status, headers }) => {
      if (error || status < 200 || status > 399) throw new Error(error ?? body);
      return { bodyBytes, body, status, headers };
    };

    constructor(tool) {
      return new Proxy((...args) => this.#request(this.#makeOpts("get", ...args)), {
        get:
          (_, method) =>
            (...args) =>
              this.#request(this.#makeOpts(method, ...args)),
      });
    }

    #request(options) {
      const { promise, resolve } = MyPromise.withResolvers();
      const timeout = options.timeout * ($.isSurge() ? 1 : 1000);
      Fetch.#requestHandlers["Default"]({ ...options, timeout }, resolve);
      const timer = setTimeout(
        () => resolve({ error: "请求超时" }),
        options.timeout * 1000
      );

      return promise
        .then(Fetch.#defaultSend)
        .catch(async (error) => {
          if (options.maxRetries <= 1) throw error;
          await new Promise((resolve) => setTimeout(resolve, options.retryDelay * 1000));
          options.maxRetries--;
          return this.#request(options);
        })
        .finally(() => clearTimeout(timer));
    }

    #makeOpts(method, options, maxRetries = 0, retryDelay = 1) {
      if (typeof options === "string") options = { url: options };
      const { $auto = true, ...op } = options;
      const headers = this.#normalize(options.headers);

      return {
        method,
        headers,
        timeout: 4,
        maxRetries,
        retryDelay,
        ...op,
      };
    }
    //对请求头进行小写脱敏处理
    #normalize(headers = {}) {
      return Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
      );
    }
  }

  return new Fetch();
}
