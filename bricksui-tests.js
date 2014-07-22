/*!
 * @overview  Bricks - a widget library based on Ember
 * @copyright Copyright 2014-2014 e-vada.com and contributors
 * @license   Licensed under MIT license
 *            See https://raw.github.com/innobricks/bricksui/master/LICENSE
 * @version   0.0.1-beta.1+canary.41154633
 */

(function() {
var define, requireModule, require, requirejs, BricksUI;

(function () {
    BricksUI = this.BricksUI = this.BricksUI || {};
    if (typeof BricksUI === 'undefined') {
        BricksUI = {}
    }
    ;

    if (typeof BricksUI.__loader === 'undefined') {
        var registry = {}, seen = {};

        define = function (name, deps, callback) {
            registry[name] = { deps: deps, callback: callback };
        };

        requirejs = require = requireModule = function (name) {
            if (seen.hasOwnProperty(name)) {
                return seen[name];
            }
            seen[name] = {};

            if (!registry[name]) {
                throw new Error("Could not find module " + name);
            }

            var mod = registry[name],
                deps = mod.deps,
                callback = mod.callback,
                reified = [],
                exports;

            for (var i = 0, l = deps.length; i < l; i++) {
                if (deps[i] === 'exports') {
                    reified.push(exports = {});
                } else {
                    reified.push(requireModule(resolve(deps[i])));
                }
            }

            var value = callback.apply(this, reified);
            return seen[name] = exports || value;

            function resolve(child) {
                if (child.charAt(0) !== '.') {
                    return child;
                }
                var parts = child.split("/");
                var parentBase = name.split("/").slice(0, -1);

                for (var i = 0, l = parts.length; i < l; i++) {
                    var part = parts[i];

                    if (part === '..') {
                        parentBase.pop();
                    }
                    else if (part === '.') {
                        continue;
                    }
                    else {
                        parentBase.push(part);
                    }
                }

                return parentBase.join("/");
            }
        };
        requirejs._eak_seen = registry;

        BricksUI.__loader = {define: define, require: require, registry: registry};
    } else {
        define = BricksUI.__loader.define;
        requirejs = require = requireModule = BricksUI.__loader.require;
    }
})();

define("bricksui-form.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - .');
    test('bricksui-form.js should pass jshint', function() { 
      ok(true, 'bricksui-form.js should pass jshint.'); 
    });
  });
define("bricksui-form/bu-datepicker.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/bu-datepicker.js should pass jshint', function() { 
      ok(true, 'bricksui-form/bu-datepicker.js should pass jshint.'); 
    });
  });
define("bricksui-form/bu-daterange.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/bu-daterange.js should pass jshint', function() { 
      ok(true, 'bricksui-form/bu-daterange.js should pass jshint.'); 
    });
  });
define("bricksui-form/bu-editor.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/bu-editor.js should pass jshint', function() { 
      ok(true, 'bricksui-form/bu-editor.js should pass jshint.'); 
    });
  });
define("bricksui-form/bu-tree.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/bu-tree.js should pass jshint', function() { 
      ok(true, 'bricksui-form/bu-tree.js should pass jshint.'); 
    });
  });
define("bricksui-form/checkbox.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/checkbox.js should pass jshint', function() { 
      ok(true, 'bricksui-form/checkbox.js should pass jshint.'); 
    });
  });
define("bricksui-form/chosen-select.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/chosen-select.js should pass jshint', function() { 
      ok(true, 'bricksui-form/chosen-select.js should pass jshint.'); 
    });
  });
define("bricksui-form/controllers/checkbox_item.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form/controllers');
    test('bricksui-form/controllers/checkbox_item.js should pass jshint', function() { 
      ok(true, 'bricksui-form/controllers/checkbox_item.js should pass jshint.'); 
    });
  });
define("bricksui-form/controllers/radio_item.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form/controllers');
    test('bricksui-form/controllers/radio_item.js should pass jshint', function() { 
      ok(true, 'bricksui-form/controllers/radio_item.js should pass jshint.'); 
    });
  });
define("bricksui-form/ember-validations.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/ember-validations.js should pass jshint', function() { 
      ok(true, 'bricksui-form/ember-validations.js should pass jshint.'); 
    });
  });
define("bricksui-form/form-config.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/form-config.js should pass jshint', function() { 
      ok(true, 'bricksui-form/form-config.js should pass jshint.'); 
    });
  });
define("bricksui-form/form-docs.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/form-docs.js should pass jshint', function() { 
      ok(true, 'bricksui-form/form-docs.js should pass jshint.'); 
    });
  });
define("bricksui-form/form-setup.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/form-setup.js should pass jshint', function() { 
      ok(true, 'bricksui-form/form-setup.js should pass jshint.'); 
    });
  });
define("bricksui-form/helpers/checkbox.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form/helpers');
    test('bricksui-form/helpers/checkbox.js should pass jshint', function() { 
      ok(true, 'bricksui-form/helpers/checkbox.js should pass jshint.'); 
    });
  });
define("bricksui-form/helpers/radio.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form/helpers');
    test('bricksui-form/helpers/radio.js should pass jshint', function() { 
      ok(true, 'bricksui-form/helpers/radio.js should pass jshint.'); 
    });
  });
define("bricksui-form/initializer.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/initializer.js should pass jshint', function() { 
      ok(true, 'bricksui-form/initializer.js should pass jshint.'); 
    });
  });
define("bricksui-form/radio-button.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/radio-button.js should pass jshint', function() { 
      ok(true, 'bricksui-form/radio-button.js should pass jshint.'); 
    });
  });
define("bricksui-form/radio.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/radio.js should pass jshint', function() { 
      ok(true, 'bricksui-form/radio.js should pass jshint.'); 
    });
  });
define("bricksui-form/swap-helpers.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form');
    test('bricksui-form/swap-helpers.js should pass jshint', function() { 
      ok(true, 'bricksui-form/swap-helpers.js should pass jshint.'); 
    });
  });
define("bricksui-form/tests/main",
  [],
  function() {
    "use strict";
    /**
     * Created by jiangwy on 14-6-12.
     */
  });
define("bricksui-form/tests/main.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-form/tests');
    test('bricksui-form/tests/main.js should pass jshint', function() { 
      ok(true, 'bricksui-form/tests/main.js should pass jshint.'); 
    });
  });
define("bricksui-i18n.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - .');
    test('bricksui-i18n.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/helpers/translation.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n/helpers');
    test('bricksui-i18n/helpers/translation.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/helpers/translation.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/i18n-docs.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n');
    test('bricksui-i18n/i18n-docs.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/i18n-docs.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/i18n-support.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n');
    test('bricksui-i18n/i18n-support.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/i18n-support.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/i18n-validator.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n');
    test('bricksui-i18n/i18n-validator.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/i18n-validator.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/initializer.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n');
    test('bricksui-i18n/initializer.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/initializer.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/lang/en.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n/lang');
    test('bricksui-i18n/lang/en.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/lang/en.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/lang/zh-cn.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n/lang');
    test('bricksui-i18n/lang/zh-cn.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/lang/zh-cn.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/tests/i18n-support_test",
  ["bricksui-i18n/i18n-support"],
  function(__dependency1__) {
    "use strict";
    var initLang = __dependency1__.initLang;
    var setLang = __dependency1__.setLang;

    /***
     * JUST FOR TESTING
     */


    /* jshint ignore:start */
    var define, requireModule, require, requirejs;

    (function () {
        var registry = {}, seen = {}, state = {};
        var FAILED = false;

        define = function (name, deps, callback) {
            registry[name] = {
                deps: deps,
                callback: callback
            };
        };

        function reify(deps, name, seen) {
            var length = deps.length;
            var reified = new Array(length);
            var dep;
            var exports;

            for (var i = 0, l = length; i < l; i++) {
                dep = deps[i];
                if (dep === 'exports') {
                    exports = reified[i] = seen;
                } else {
                    reified[i] = require(resolve(dep, name));
                }
            }

            return {
                deps: reified,
                exports: exports
            };
        }

        requirejs = require = requireModule = function (name) {
            if (state[name] !== FAILED &&
                seen.hasOwnProperty(name)) {
                return seen[name];
            }

            if (!registry[name]) {
                throw new Error('Could not find module ' + name);
            }

            var mod = registry[name];
            var reified;
            var module;
            var loaded = false;

            seen[name] = { }; // placeholder for run-time cycles

            try {
                reified = reify(mod.deps, name, seen[name]);
                module = mod.callback.apply(this, reified.deps);
                loaded = true;
            } finally {
                if (!loaded) {
                    state[name] = FAILED;
                }
            }

            return reified.exports ? seen[name] : (seen[name] = module);
        };

        function resolve(child, name) {
            if (child.charAt(0) !== '.') {
                return child;
            }

            var parts = child.split('/');
            var nameParts = name.split('/');
            var parentBase;

            if (nameParts.length === 1) {
                parentBase = nameParts;
            } else {
                parentBase = nameParts.slice(0, -1);
            }

            for (var i = 0, l = parts.length; i < l; i++) {
                var part = parts[i];

                if (part === '..') {
                    parentBase.pop();
                }
                else if (part === '.') {
                    continue;
                }
                else {
                    parentBase.push(part);
                }
            }

            return parentBase.join('/');
        }

        requirejs.entries = requirejs._eak_seen = registry;
        requirejs.clear = function () {
            requirejs.entries = requirejs._eak_seen = registry = {};
            seen = state = {};
        };
    })();

    window.define = define;
    window.requireModule = requireModule;
    window.require = require;
    window.requirejs = requirejs;
    /* jshint ignore:end */
    /***
     * END
     */

    define("appkit/lang/en",
        ["exports"],
        function (__exports__) {
            "use strict";
            __exports__["default"] = {
                "foo": "bar",
                errors: {
                    "foo": "bar",
                    foo1: {
                        "foo2": "bar"
                    }
                }
            };
        });

    define("appkit/lang/zh-CN",
        ["exports"],
        function (__exports__) {
            "use strict";
            __exports__["default"] = {
                "foo": "变量",
                errors: {
                    "foo": "变量",
                    foo1: {
                        "foo2": "变量"
                    }
                }
            };
        });


    QUnit.module("i18n-support_test", {
        setup: function () {
            Ember.set(BricksUI, "ENV.MODULE_PREFIX", "appkit");
            Ember.set(BricksUI, "ENV.LANG_FOLDER_NAME", "lang");
        },
        teardown: function () {
            // 在每个测试之后运行
        }
    });


    test("set Lang Test", function () {
        setLang("en");
        ok(Ember.I18n.translations.foo === "bar", "deep one success");
        ok(Ember.I18n.translations.errors.foo === "bar", "deep one success");
        ok(Ember.I18n.translations.errors.foo1.foo2 === "bar", "deep one success");
    });


    test("initial Lang Test", function () {
        initLang();
        ok(Ember.I18n.translations.foo === "bar", "deep one success");
        ok(Ember.I18n.translations.errors.foo === "bar", "deep one success");
        ok(Ember.I18n.translations.errors.foo1.foo2 === "bar", "deep one success");
    });
  });
define("bricksui-i18n/tests/i18n-support_test.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n/tests');
    test('bricksui-i18n/tests/i18n-support_test.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/tests/i18n-support_test.js should pass jshint.'); 
    });
  });
define("bricksui-i18n/tests/main",
  [],
  function() {
    "use strict";
    /**
     * Created by jiangwy on 14-6-12.
     */
  });
define("bricksui-i18n/tests/main.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-i18n/tests');
    test('bricksui-i18n/tests/main.js should pass jshint', function() { 
      ok(true, 'bricksui-i18n/tests/main.js should pass jshint.'); 
    });
  });
define("bricksui-metal.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - .');
    test('bricksui-metal.js should pass jshint', function() { 
      ok(true, 'bricksui-metal.js should pass jshint.'); 
    });
  });
define("bricksui-metal/core.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-metal');
    test('bricksui-metal/core.js should pass jshint', function() { 
      ok(true, 'bricksui-metal/core.js should pass jshint.'); 
    });
  });
define("bricksui-metal/event_manager.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-metal');
    test('bricksui-metal/event_manager.js should pass jshint', function() { 
      ok(true, 'bricksui-metal/event_manager.js should pass jshint.'); 
    });
  });
define("bricksui-metal/helper-support.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-metal');
    test('bricksui-metal/helper-support.js should pass jshint', function() { 
      ok(true, 'bricksui-metal/helper-support.js should pass jshint.'); 
    });
  });
define("bricksui-metal/state_handler.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-metal');
    test('bricksui-metal/state_handler.js should pass jshint', function() { 
      ok(true, 'bricksui-metal/state_handler.js should pass jshint.'); 
    });
  });
define("bricksui-metal/stateable.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-metal');
    test('bricksui-metal/stateable.js should pass jshint', function() { 
      ok(true, 'bricksui-metal/stateable.js should pass jshint.'); 
    });
  });
define("bricksui-metal/tests/core_test",
  [],
  function() {
    "use strict";
    /**
     * Created by jiangwy on 14-6-12.
     */
  });
define("bricksui-metal/tests/core_test.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-metal/tests');
    test('bricksui-metal/tests/core_test.js should pass jshint', function() { 
      ok(true, 'bricksui-metal/tests/core_test.js should pass jshint.'); 
    });
  });
define("bricksui-metal/view.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-metal');
    test('bricksui-metal/view.js should pass jshint', function() { 
      ok(true, 'bricksui-metal/view.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - .');
    test('bricksui-thirdpart.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-alert.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-alert.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-alert.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-growl-notifications.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-growl-notifications.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-growl-notifications.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-modal.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-modal.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-modal.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-pagination.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-pagination.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-pagination.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-panel.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-panel.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-panel.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-progress.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-progress.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-progress.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-table.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-table.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-table.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-tabs.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-tabs.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-tabs.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/bu-wizard.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/bu-wizard.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/bu-wizard.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/initializer.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart');
    test('bricksui-thirdpart/initializer.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/initializer.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/mixins/pageable.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart/mixins');
    test('bricksui-thirdpart/mixins/pageable.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/mixins/pageable.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/tests/bu-tabs-routes_test",
  ["bricksui-metal/core"],
  function(__dependency1__) {
    "use strict";
    var BricksUI = __dependency1__["default"];

    var App, $fixture, router, container;

    function bootApplication() {
        router = container.lookup("router:main");
        Ember.run(App, "advanceReadiness");
    }
    function handleURL(path) {
        return Ember.run(function () {
            return router.handleURL(path).then(function (value) {
                ok(true, 'url: `' + path + '` was handled');
                return value;
            }, function (reason) {
                ok(false, 'failed to visit:`' + path + '` reason: `' + QUnit.jsDump.parse(reason));
                throw reason;
            });
        });
    }
    QUnit.module("bu-tabs-routes", {
        setup: function () {
            Ember.run(function () {
                App = Ember.Application.create({
                    name: "App",
                    rootElement: "#qunit-fixture"
                });
                App.deferReadiness();

                container = App.__container__;


                Ember.TEMPLATES.application = Ember.Handlebars.compile("{{outlet}}");


            });
            $fixture = Ember.$("#qunit-fixture");
        },
        teardown: function () {
            Ember.run(function () {
                App.destroy();
            });
            App = null;
            $fixture = null;
        }
    });

    test("test bu-tabs is still exist", function () {
        Ember.TEMPLATES.user = Ember.Handlebars.compile('{{bs-tabs id="tabs1" contentBinding="tabsMeta" default="Foo" justified=true}}{{outlet}}');

        App.Router.map(function () {
            this.resource('user', function () {
                this.route('general');
                this.route('privacy');
                this.route('activities');
            });
        });

        App.UserController = Ember.Controller.extend({
            tabsMeta: [
                Ember.Object.create({title: 'General', linkTo: 'user.general'}),
                Ember.Object.create({title: 'Privacy', linkTo: 'user.privacy'}),
                Ember.Object.create({title: 'Activities', linkTo: 'user.activities'})
            ]
        });

        try {
            bootApplication();

            var transition = handleURL("/");
            Ember.run(function () {
                transition.then(function () {
                    router.transitionTo("user").then(function (value) {
                        ok(true, 'expected transition');
                    }, function (reason) {
                        ok(false, 'failed to visit:user,and reason is ' + reason);
                    });
                });
            });
        } catch (e) {
            ok(true, "the bs-tabs helper is not exist yet !");
        }

    });

    test("test bs-tabs with routes and transition to sub tab", function () {
        Ember.TEMPLATES.user = Ember.Handlebars.compile('{{bu-tabs id="tabs1" contentBinding="tabsMeta" default="Foo" justified=true}}{{outlet}}');

        App.Router.map(function () {
            this.resource('user', function () {
                this.route('general');
                this.route('privacy');
                this.route('activities');
            });
        });

        App.UserController = Ember.Controller.extend({
            tabsMeta: [
                Ember.Object.create({title: 'General', linkTo: 'user.general'}),
                Ember.Object.create({title: 'Privacy', linkTo: 'user.privacy'}),
                Ember.Object.create({title: 'Activities', linkTo: 'user.activities'})
            ]
        });
        bootApplication();

        var transition = handleURL("/");
        Ember.run(function () {
            transition.then(function () {
                router.transitionTo("user.general").then(function (value) {
                    ok(true, 'expected transition');
                }, function (reason) {
                    ok(false, 'unexpected transition failure: ', QUnit.jsDump.parse(reason));
                });
            });
        });

    });
  });
define("bricksui-thirdpart/tests/bu-tabs-routes_test.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart/tests');
    test('bricksui-thirdpart/tests/bu-tabs-routes_test.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/tests/bu-tabs-routes_test.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/tests/bu-tabs_test",
  ["bricksui-metal/core"],
  function(__dependency1__) {
    "use strict";
    var BricksUI = __dependency1__["default"];

    var App;
    QUnit.module("bu-tabs", {
        setup: function () {
            Ember.run(function () {
                App = Ember.Application.create();
            });
        }
    });
  });
define("bricksui-thirdpart/tests/bu-tabs_test.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart/tests');
    test('bricksui-thirdpart/tests/bu-tabs_test.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/tests/bu-tabs_test.js should pass jshint.'); 
    });
  });
define("bricksui-thirdpart/tests/main",
  [],
  function() {
    "use strict";
    /**
     * Created by nav4e on 14-6-26.
     */
  });
define("bricksui-thirdpart/tests/main.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui-thirdpart/tests');
    test('bricksui-thirdpart/tests/main.js should pass jshint', function() { 
      ok(true, 'bricksui-thirdpart/tests/main.js should pass jshint.'); 
    });
  });
define("bricksui.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - .');
    test('bricksui.js should pass jshint', function() { 
      ok(true, 'bricksui.js should pass jshint.'); 
    });
  });
define("bricksui/tests/main",
  [],
  function() {
    "use strict";
    /**
     * Created by jiangwy on 14-6-12.
     */
  });
define("bricksui/tests/main.jshint",
  [],
  function() {
    "use strict";
    module('JSHint - bricksui/tests');
    test('bricksui/tests/main.js should pass jshint', function() { 
      ok(true, 'bricksui/tests/main.js should pass jshint.'); 
    });
  });
Ember.TEMPLATES['bootstrap-checkbox'] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = '';
  data.buffer.push("\n        <div class=\"checkbox block\">\n            <label>\n                ");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "Ember.Checkbox", {hash:{
    'checkedBinding': ("selected")
  },hashTypes:{'checkedBinding': "STRING"},hashContexts:{'checkedBinding': depth0},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\n                ");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "label", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\n            </label>\n        </div>\n    ");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        ");
  data.buffer.push(escapeExpression((helper = helpers['error-field'] || (depth0 && depth0['error-field']),options={hash:{
    'propertyBinding': ("view.property")
  },hashTypes:{'propertyBinding': "STRING"},hashContexts:{'propertyBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "error-field", options))));
  data.buffer.push("\n    ");
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        ");
  data.buffer.push(escapeExpression((helper = helpers['hint-field'] || (depth0 && depth0['hint-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.hint")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "hint-field", options))));
  data.buffer.push("\n    ");
  return buffer;
  }

  data.buffer.push(escapeExpression((helper = helpers['label-field'] || (depth0 && depth0['label-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.fieldLabel")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "label-field", options))));
  data.buffer.push("\n<div class=\"");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "view.wrapperConfig.controlsWrapperClass", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\">\n    ");
  stack1 = helpers.each.call(depth0, "item", "in", "view.elements", {hash:{
    'itemController': ("checkboxItem")
  },hashTypes:{'itemController': "STRING"},hashContexts:{'itemController': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n\n    ");
  stack1 = helpers['if'].call(depth0, "view.showError", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n    ");
  stack1 = helpers['if'].call(depth0, "view.hint", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(5, program5, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n</div>");
  return buffer;
  
});

Ember.TEMPLATES['bootstrap-input'] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  data.buffer.push(escapeExpression((helper = helpers['label-field'] || (depth0 && depth0['label-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.label")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "label-field", options))));
  data.buffer.push("\n<div class=\"");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "view.wrapperConfig.controlsWrapperClass", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\">\n    ");
  data.buffer.push(escapeExpression((helper = helpers.partial || (depth0 && depth0.partial),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "easyForm/inputControls", options) : helperMissing.call(depth0, "partial", "easyForm/inputControls", options))));
  data.buffer.push("\n</div>");
  return buffer;
  
});

Ember.TEMPLATES['bootstrap-radio'] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = '';
  data.buffer.push("\n        <div class=\"radio\">\n            <label>\n                ");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "Ember.RadioButton", {hash:{
    'nameBinding': ("view.property"),
    'checkedBinding': ("selected"),
    'selectionBinding': ("selected"),
    'valueBinding': ("item.name")
  },hashTypes:{'nameBinding': "STRING",'checkedBinding': "STRING",'selectionBinding': "STRING",'valueBinding': "STRING"},hashContexts:{'nameBinding': depth0,'checkedBinding': depth0,'selectionBinding': depth0,'valueBinding': depth0},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\n                ");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "label", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\n            </label>\n        </div>\n    ");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        ");
  data.buffer.push(escapeExpression((helper = helpers['error-field'] || (depth0 && depth0['error-field']),options={hash:{
    'propertyBinding': ("view.property")
  },hashTypes:{'propertyBinding': "STRING"},hashContexts:{'propertyBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "error-field", options))));
  data.buffer.push("\n    ");
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        ");
  data.buffer.push(escapeExpression((helper = helpers['hint-field'] || (depth0 && depth0['hint-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.hint")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "hint-field", options))));
  data.buffer.push("\n    ");
  return buffer;
  }

  data.buffer.push(escapeExpression((helper = helpers['label-field'] || (depth0 && depth0['label-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.fieldLabel")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "label-field", options))));
  data.buffer.push("\n<div class=\"");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "view.wrapperConfig.controlsWrapperClass", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\">\n    ");
  stack1 = helpers.each.call(depth0, "item", "in", "view.elements", {hash:{
    'itemController': ("radioItem")
  },hashTypes:{'itemController': "STRING"},hashContexts:{'itemController': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n\n    ");
  stack1 = helpers['if'].call(depth0, "view.showError", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n    ");
  stack1 = helpers['if'].call(depth0, "view.hint", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(5, program5, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n</div>");
  return buffer;
  
});

Ember.TEMPLATES['bootstrap-validation-input'] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        ");
  data.buffer.push(escapeExpression((helper = helpers['error-field'] || (depth0 && depth0['error-field']),options={hash:{
    'propertyBinding': ("view.property")
  },hashTypes:{'propertyBinding': "STRING"},hashContexts:{'propertyBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "error-field", options))));
  data.buffer.push("\n    ");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', helper, options;
  data.buffer.push("\n        ");
  data.buffer.push(escapeExpression((helper = helpers['hint-field'] || (depth0 && depth0['hint-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.hint")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "hint-field", options))));
  data.buffer.push("\n    ");
  return buffer;
  }

  data.buffer.push(escapeExpression((helper = helpers['label-field'] || (depth0 && depth0['label-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.label")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "label-field", options))));
  data.buffer.push("\n<div class=\"");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "view.wrapperConfig.controlsWrapperClass", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\">\n    ");
  stack1 = helpers._triageMustache.call(depth0, "yield", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n    ");
  stack1 = helpers['if'].call(depth0, "view.showError", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n    ");
  stack1 = helpers['if'].call(depth0, "view.hint", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n</div>");
  return buffer;
  
});

Ember.TEMPLATES['components/bu-pagination'] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var stack1, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', stack1;
  data.buffer.push("\n    <div class=\"pull-right\">\n        <ul class=\"pagination\">\n            <li ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
    'class': ("view.disableFirst:disabled")
  },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
  data.buffer.push("><a ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "firstPage", {hash:{
    'target': ("view")
  },hashTypes:{'target': "STRING"},hashContexts:{'target': depth0},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push(">First</a></li>\n            <li ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
    'class': ("view.disablePrev:disabled")
  },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
  data.buffer.push("><a ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "prevPage", {hash:{
    'target': ("view")
  },hashTypes:{'target': "STRING"},hashContexts:{'target': depth0},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push(">Prev</a></li>\n            ");
  stack1 = helpers.each.call(depth0, "view.pages", {hash:{
    'itemViewClass': ("view.PageButton"),
    'page': ("content")
  },hashTypes:{'itemViewClass': "STRING",'page': "STRING"},hashContexts:{'itemViewClass': depth0,'page': depth0},inverse:self.noop,fn:self.program(2, program2, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            <li ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
    'class': ("view.disableNext:disabled")
  },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
  data.buffer.push("><a ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "nextPage", {hash:{
    'target': ("view")
  },hashTypes:{'target': "STRING"},hashContexts:{'target': depth0},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push(">Next</a></li>\n            <li ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
    'class': ("view.disableLast:disabled")
  },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
  data.buffer.push("><a ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "lastPage", {hash:{
    'target': ("view")
  },hashTypes:{'target': "STRING"},hashContexts:{'target': depth0},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push(">Last</a></li>\n        </ul>\n    </div>\n");
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = '', stack1;
  data.buffer.push("\n                <a ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "goToPage", {hash:{
    'target': ("view")
  },hashTypes:{'target': "STRING"},hashContexts:{'target': depth0},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push(">");
  stack1 = helpers._triageMustache.call(depth0, "", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("</a>\n            ");
  return buffer;
  }

  stack1 = helpers['if'].call(depth0, "view.pages", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  
});

})();