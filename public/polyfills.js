(function () {
  // WeakRef + FinalizationRegistry — required by React 19
  if (!('WeakRef' in self)) {
    self.WeakRef = function (t) { this._ = t; };
    self.WeakRef.prototype.deref = function () { return this._; };
    self.FinalizationRegistry = function () {};
    self.FinalizationRegistry.prototype.register =
      self.FinalizationRegistry.prototype.unregister = function () {};
  }
  // queueMicrotask
  if (!self.queueMicrotask)
    self.queueMicrotask = function (cb) { Promise.resolve().then(cb); };
  // Promise.allSettled
  if (!Promise.allSettled)
    Promise.allSettled = function (ps) {
      return Promise.all(ps.map(function (p) {
        return Promise.resolve(p).then(
          function (v) { return { status: 'fulfilled', value: v }; },
          function (e) { return { status: 'rejected', reason: e }; }
        );
      }));
    };
  // Object.fromEntries
  if (!Object.fromEntries)
    Object.fromEntries = function (e) {
      return [].slice.call(e).reduce(function (o, r) { o[r[0]] = r[1]; return o; }, {});
    };
  // Array.prototype.flatMap
  if (!Array.prototype.flatMap)
    Array.prototype.flatMap = function (f, t) { return [].concat.apply([], this.map(f, t)); };
  // globalThis
  if (typeof globalThis === 'undefined') self.globalThis = self;
  // structuredClone
  if (!self.structuredClone)
    self.structuredClone = function (v) { return JSON.parse(JSON.stringify(v)); };
})();
