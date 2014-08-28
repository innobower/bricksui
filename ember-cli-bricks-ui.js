/**
 * Created by dis on 2014/7/21.
 */
'use strict';

var path = require('path');
var fs = require('fs');
var walkSync = require('walk-sync');

function EmberCLIBricksUi(project) {
  this.project = project;
  this.name = 'Ember CLI Bricks Ui';
}

function unwatchedTree(dir) {
  return {
    read: function () {
      return dir;
    },
    cleanup: function () {
    }
  };
}

function copyAssetsRecursive(app, base, assets) {
  var dirPath = path.join(base, assets);
  var paths = walkSync(dirPath);
  for (var i = 0; i < paths.length; i++) {
    if (path.extname(paths[i])) {
      var srcDir = path.join(assets, paths[i]).replace(path.sep, '/');
      var destDir = path.join('assets', assets.split('/').pop(), path.dirname(paths[i]));
      app.import(srcDir, {
        destDir: destDir
      });
    }
  }
}

EmberCLIBricksUi.prototype.treeFor = function treeFor(name) {
  var treePath = path.join('node_modules', 'ember-cli-bricks-ui', name);
  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

EmberCLIBricksUi.prototype.included = function included(app) {
  this.app = app;

  this.app.import('vendor/bricksui/bricksUI.vendor.css');

  var assetsPath = 'vendor/bricksui/assets';
  var basePath = path.join('node_modules', 'ember-cli-bricks-ui');
  copyAssetsRecursive(this.app, basePath, assetsPath);

  this.app.import('vendor/bricksui/bricksUI.vendor.js');
  this.app.import('vendor/bricksui/bricksui.js');
};

module.exports = EmberCLIBricksUi;