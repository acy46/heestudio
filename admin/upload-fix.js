// File inputs with `multiple` are represented by several FormData entries.
// The custom admin expects an iterable, so return all selected files together.
const originalFormDataGet = FormData.prototype.get;
FormData.prototype.get = function (name) {
  return name === 'images' ? this.getAll(name) : originalFormDataGet.call(this, name);
};
