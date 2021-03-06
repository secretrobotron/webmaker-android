var Firebase = require('firebase');
var clone = require('clone');

var config = require('../config');
var utils = require('./utils');
var i18n = require('./i18n');
var templates = require('./templates.json');
var model = require('./model')();
var App = require('./app');

var _firebase = new Firebase(config.FIREBASE_URL + '/apps');
var _appRefs = {};
var _queryRef = null;

var version = require('../package.json').version;

function Store(vm) {
  this._vm = vm;
  this._firebase = _firebase;
}

Store.prototype._log = function (text) {
  console.log('[Store] ', text);
};

Store.prototype._onSync = function _onSync(err) {
  if (!err) {
    return;
  }
  console.error('[Store] ', err);
  this._vm.showAlert('Oops! We\'re having trouble syncing your data');
};

Store.prototype._processSnapshot = function _processSnapshot(snapshot) {
  var res = snapshot.val();
  if (!res) {
    return null;
  }
  res.id = snapshot.key();
  return res;
};

Store.prototype._createAppRef = function (id, fbRef, data) {
  if (_appRefs[id]) {
    this._removeAppRef(id);
  }
  var app = new App({
    store: this,
    id: id,
    data: data,
    firebase: fbRef,
    i18n: i18n
  });
  _appRefs[id] = app;
  return app;
};

Store.prototype._removeAppRef = function _removeAppRef(id) {
  if (!_appRefs[id]) {
    return; // todo: throw? this shouldn't happen
  }
  _appRefs[id].firebase.off('value');
  delete _appRefs[id];
};

// setQuery(userId)
// set up a query for all apps by a certain userId
Store.prototype.setQuery = function setQuery(userId) {
  if (!userId) {
    return; // todo: throw? this shouldn't happen
  }

  if (_queryRef) {
    this.unsetQuery();
  }

  var query = this._firebase
    .orderByChild('userId')
    .equalTo(userId);

  this._log('Query changed');
  this._vm.$broadcast('query_changed', userId);

  query.on('child_added', this.onAdded, this);
  query.on('child_changed', this.onChanged, this);
  query.on('child_removed', this.onRemoved, this);

  _queryRef = query;
};

Store.prototype.onAdded = function (snapshot) {
  var id = snapshot.key();
  if (!_appRefs[id]) {
    this.getApp(id);
  }
  this._log('App added');
  this._vm.$broadcast('app_added', this._processSnapshot(snapshot));
};

Store.prototype.onChanged = function (snapshot) {
  this._log('App changed');
  this._vm.$broadcast('app_changed', this._processSnapshot(snapshot));
};

Store.prototype.onRemoved = function(snapshot) {
  var id = snapshot.key();
  if (_appRefs[id]) {
    this._removeAppRef(id);
  }
  this._log('App removed');
  this._vm.$broadcast('app_removed', this._processSnapshot(snapshot));
};

// unsetQuery
// Removes all event listeners for a query
Store.prototype.unsetQuery = function unsetQuery() {
  if (!_queryRef) {
    return; // todo: throw? this shouldn't happen
  }
  _queryRef.off('child_added');
  _queryRef.off('child_changed');
  _queryRef.off('child_removed');
  _queryRef = null;
  _appRefs = {};
  this._log('Query removed');
  this._vm.$broadcast('query_changed', null);
};

// getApps()
// Returns an array of all apps
Store.prototype.getApps = function getApps() {
  var res = Object.keys(_appRefs).map(function (key) {
    return clone(_appRefs[key].data);
  }).filter(function (item) {
    return !!item && item.author.id === model.data.session.user.id;
  });
  return res;
};

// getApp(id)
// Get an app reference given an ID
Store.prototype.getApp = function getApp(id) {
  if (_appRefs[id]) {
    return _appRefs[id];
  }
  return this._createAppRef(id);
};

Store.prototype.remix = function remix(id, callback) {
  var self = this;
  self._firebase.child(id).once('value', function (snapshot) {
    callback(self.createApp({
      data: snapshot.val()
    }));
  });
};

// createApp(options)
//  - template: id of a template. Will overwrite options.data
//  - data: a set of app data to clone
//  - name: a name for the clone.
Store.prototype.createApp = function createApp(options) {
  var templateId;
  options = options || {};

  var app = {};

  // Get the source of the app template
  if (options.template) {
    templateId = utils.findInArray(templates, 'id', options.template);
    options.data = templates[templateId];
  }
  if (!options.data) {
    return;
  }
  var appTemplate = clone(options.data);

  // Get current user info
  var user = model.data.session.user;
  var guestId = model.data.session.guestId;

  // Name, userId, author, icon
  app.name = options.name || i18n.get('My {{template}} App');
  app.name = app.name.replace('{{template}}', appTemplate.name);
  app.userId = user.id || guestId;
  app.author = {
    id: user.id || guestId,
    username: user.username || i18n.get('Guest'),
    locale: i18n.locale
  };
  app.iconImage = appTemplate.iconImage || 'images/icons/blogger.svg';
  app.iconColor = appTemplate.iconColor || '#1F9CDF';

  // Record which version of webmaker-app was used to generate this app.
  // as well as which save iteration (latter not implemented yet).
  app.version = {
    'webmaker-app': version,
    app: '0.0.0' // not implemented yet
  };

  // Blocks
  app.blocks = appTemplate.blocks.map(function (blockTemplate) {
    var block = {};
    // .id is deprecated
    block.type = blockTemplate.type || blockTemplate.id;
    block.attributes = blockTemplate.attributes;
    return block;
  });

  var ref = _firebase.push(app, this._onSync);
  var key = ref.key();
  return this._createAppRef(key, ref);
};

module.exports = Store;
