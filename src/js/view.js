const _ = require('lodash');

class View {
  constructor(params, _this_, fireInit = true) {
    this.params = params;
    this.context = _this_;
    if (fireInit) this.init();
  }

  init() {
    this.context.$v = Object.assign({}, this.params);
    this.context.$v.eq = this.fncEq;
    this.context.$v.exist = this.fncExist;
    this.context.update();
  }

  get(key) {
    return _.get(this.context.$v, key);
  }

  set(key, val, fire = true) {
    _.set(this.context.$v, key, val);
    if (fire) this.context.update();
  }

  sets(values) {
    _.forEach(values, (val, key) => {
      this.set(key, val, false);
    });
    this.context.update();
  }

  restore(key, isUpdate = false) {
    this.context.$v[key] = this.params[key];
    if (isUpdate) this.context.update();
  }

  fire(values = undefined) {
    this.context.update(values);
  }

  fncEq(prop, val = true) {
    return this[prop] === val;
  }

  fncExist(prop) {
    return (!_.isUndefined(this[prop]) && !_.isNull(this[prop]));
  }
}

module.exports = View;
