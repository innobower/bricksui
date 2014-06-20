/*!
 * @overview  Bricks - a widget library based on Ember
 * @copyright Copyright 2014-2014 Tilde Inc. and contributors
 * @license   Licensed under MIT license
 *            See https://raw.github.com/innobricks/bricksui/master/LICENSE
 * @version   0.0.1-beta.1+canary.1a51009a
 */

(function() {
var define, requireModule, require, requirejs, BricksUI;

(function() {
    BricksUI = this.BricksUI = this.BricksUI || {};
  if (typeof BricksUI === 'undefined') { BricksUI = {} };

  if (typeof BricksUI.__loader === 'undefined') {
    var registry = {}, seen = {};

    define = function(name, deps, callback) {
      registry[name] = { deps: deps, callback: callback };
    };

    requirejs = require = requireModule = function(name) {
      if (seen.hasOwnProperty(name)) { return seen[name]; }
      seen[name] = {};

      if (!registry[name]) {
        throw new Error("Could not find module " + name);
      }

      var mod = registry[name],
      deps = mod.deps,
      callback = mod.callback,
      reified = [],
      exports;

      for (var i=0, l=deps.length; i<l; i++) {
        if (deps[i] === 'exports') {
          reified.push(exports = {});
        } else {
          reified.push(requireModule(resolve(deps[i])));
        }
      }

      var value = callback.apply(this, reified);
      return seen[name] = exports || value;

      function resolve(child) {
        if (child.charAt(0) !== '.') { return child; }
        var parts = child.split("/");
        var parentBase = name.split("/").slice(0, -1);

        for (var i=0, l=parts.length; i<l; i++) {
          var part = parts[i];

          if (part === '..') { parentBase.pop(); }
          else if (part === '.') { continue; }
          else { parentBase.push(part); }
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

define("bricksui-form",
  ["bricksui-form/initializer","bricksui-form/form-config","bricksui-form/helpers/checkbox","bricksui-form/helpers/radio","bricksui-form/bu-editor","bricksui-form/chosen-select","bricksui-form/checkbox","bricksui-form/radio","bricksui-form/radio-button"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__) {
    "use strict";


    var Checkbox = __dependency7__["default"];
    var Radio = __dependency8__["default"];
    var RadioButton = __dependency9__["default"];

    /**
     BricksUI表单支持模块，对Ember-Easy-Form进行功能拓展，整合Validation与I18n
     @module bricksui
     @submodule bricksui-form
     */
    Ember.EasyForm.Checkbox = Checkbox;
    Ember.EasyForm.Radio = Radio;
    Ember.RadioButton = RadioButton;
  });
define("bricksui-form/bu-editor",
  ["exports"],
  function(__exports__) {
    "use strict";
    var get = Ember.get, set = Ember.set;

    /**
     @module bricksui
     @submodule bricksui-form
     */
    /**
     基于ember与[百度富文本编辑器umeditor](http://ueditor.baidu.com/website/umeditor.html)
     主要增加了数据绑定的功能，config配置项与umeditor一致
     继承自Ember.Component，用法上与Ember.Component保持一致
     使用方式如:
     ```handlebars
     {{bu-editor value=title valueType="contentTxt"}}
     ```
     @class BuEditor
     @namespace Ember
     @extends Ember.Component
     @uses Ember.TextSupport
     */
    var BuEditor = Ember.Component.extend({

      /**
       value类型，分别为content和contentTxt,content包含其中的段落标签,contentTxt则指纯文本内容
       @property valueType
       @type string
       @default "content"
       */
      valueType: "content",

      _valueHandler: {
        content: function (editor) {
          return editor.getContent();
        },
        contentTxt: function (editor) {
          return editor.getContentTxt();
        }
      },


      /**
       用户配置文件
       @property options
       @type object
       */
      options: {},

      /**
       富文本框默认配置文件
       @property defaultSetting
       @type object
       */
      defaultOptions: {
        //这里可以选择自己需要的工具按钮名称
        toolbar: ['fullscreen undo redo bold italic underline'],
        //focus时自动清空初始化时的内容
        autoClearinitialContent: true,
        //关闭字数统计
        wordCount: false,
        //关闭elementPath
        elementPathEnabled: false,
        //默认的编辑区域高度
        initialFrameHeight: 300
        //更多其他参数，请参考umeditor.config.js中的配置项
      },


      /**
       绑定到文本域的字段
       @property value
       @type String
       @default null
       */
      value: "",

      /**
       占位符编号，可根据该编号取得全局唯一编辑器实例
       @property holderId
       @type String
       @default bu-editor+父级ID编号
       */
      holderId: function () {
        return 'bu-editor' + Ember.get(this, 'elementId');
      }.property('elementId'),

      /**
       为UMeditor添加事件监听
       @private
       @method _attachEvent
       @param editor UMeditor实例
       */
      _attachEvent: function (editor) {

        editor.addListener('ready', function () {
          var value = get(this, 'value');
          if (!Ember.isEmpty(value)) editor.setContent(value);

          this.$('.edui-container').css({width: '100%'});

        }.bind(this));

        editor.addListener('contentChange', function () {
          var
            value = get(this, 'value'),
            elementValue = this._valueHandler[this.valueType](this._editor);

          if (value !== elementValue) this._updateValue(elementValue);

        }.bind(this));

      },

      _updateElementValue: Ember.observer('value', function () {
        // We do this check so cursor position doesn't get affected in IE
        var value = get(this, 'value'),
          elementValue = this._valueHandler[this.valueType](this._editor);

        if (elementValue !== value) this._editor.setContent(value);

      }),


      /**
       将textarea转换为UMeditor实例
       @private
       @method _updateDom
       */
      _updateDom: function () {
        var
          options = get(this, 'options'),
          defaultOptions = get(this, 'defaultOptions'),
          editor;

        if (typeof options === 'string') {
          options = JSON.parse(options);
        }
        //TODO toolbar属性合并
        options = $.extend(true, {}, options, defaultOptions);

        editor = this._editor = UM.getEditor(this.get('holderId'), options);

        this._attachEvent(editor);
      }.on('didInsertElement'),


      /**
       在富文本框编辑器内容发生改变时同步value值
       @private
       @method _updateValue
       @param value 富文本编辑器改变后的值
       */
      _updateValue: function (value) {
        set(this, 'value', value);
      },


      /**
       销毁富文本编辑器，销毁组件
       @private
       @method _destroyEditor
       */
      _destroyEditor: function () {
        this._editor.destroy();
        this._editor = null;
      }.on('willDestroyElement')
    });

    __exports__["default"] = BuEditor;
  });
define("bricksui-form/checkbox",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-form
     */
    /**
     拓展Ember.EasyForm.Input的CheckBox功能
     提供复选框按钮组的功能
     使用方式如:
     ```handlebars
     {{checkbox something modelBinding="model" propertyPath="something" elementsBinding="fruits" labelPath="name"}}
     ```
     @class Checkbox
     @namespace Ember.EasyForm
     @extends Ember.EasyForm.Input
     */
    var Checkbox = Ember.EasyForm.Input.extend({
      /**
       *初始化操作，模仿Ember.Component,将视图上下文设置为自身，并从Ember.EasyForm.Config中获取模板
       *@method init
       */
      init: function () {
        this._super.apply(this, arguments);
        this.set('templateName', this.get('wrapperConfig.checkboxTemplate'));
        this.set('context', this);
        this.set('controller', this);
      },
      /**
       * 标签属性
       * 如 elements为 [{key:1,value:"123"},{key:2,value:"234"}]需要将value值作为label展示，则只需设置labelPath为value
       * @property labelPath
       * @default null
       * @type string
       */
      labelPath: null,

      /**
       * 绑定的Ember Data模型
       * @default null
       * @property model
       * @type object
       */
      model: null,

      /**
       * 绑定模型中的hasMany属性，在elements复选框选中的对象将push到该属性中
       * @property propertyPath
       * @type string
       * @default null
       */
      propertyPath: null,

      /**
       * 复选框的模型，必须为一个数组类型
       * 如 elements为 [{key:1,value:"123"},{key:2,value:"234"}]
       * @property elements
       * @default null
       * @type object
       */
      elements: null,

      /**
       * @private
       */
      elementsOfProperty: function () {
        return this.get('model.' + this.get('propertyPath'));
      }.property()

    });

    __exports__["default"] = Checkbox;
  });
define("bricksui-form/chosen-select",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-form
     */

    /**
     * 重置Ember.EasyForm下拉组件行为，将下拉框组件行为转换为chosen组件，用户通常无需直接使用该组件，
     * 应通过Ember-EasyForm的方式使用该组件
     * 可选的参数有 data-placeholder，表示下拉组件的占位符
     * 使用方式如
     ```handlebars
     {{#form-for model wrapper="bootstrap"}}
     {{input author
     as='select'
     data-placeholder="请选择作者"
     collection="category"
     optionLabelPath="content.value"
     }}
     {{input tags as='select'
     data-placeholder="请选标签"
     multiple=true
     collection="category"
     optionLabelPath="content.value"
     }}
     {{/form-for}}
     ```
     * @class Select
     * @namespace Ember.EasyForm
     */
    var ChosenSelect = Ember.EasyForm.Select.reopen({

      classNames: ['form-control'],
      attributeBindings: ['data-placeholder'],

      init: function () {
        this._super();
        this.set('prompt', ' ');  //对于chosen组件，需要存在一个为空的promt

        //once elements trigger blur event,the parentView will show validated result,
        //aim to defer validation
        var parentView = this.get('parentView');
        parentView.focusOut = function () {
          parentView.set(parentView.set('hasFocusedOut', true));
        };

      },

      /**
       * @private
       * @method _elementDestroy
       * @description 在收到通知需进行销毁后，销毁chsen组件
       */
      _elementDestroy: function () {
        this.$().chosen('destroy');
      }.on('willDestroyElement'),


      /**
       * @private
       * @method _updateItem
       * @description 在select的context发生变化后，通知chosen进行视图更新
       */
      _updateItem: function () {
        Ember.run.scheduleOnce('afterRender', this, function () {
          this.$().trigger('chosen:updated');
        });
      }.observes('content.@each'),

      _doShowFocus: function () {
        this.get('parentView').showValidationError();
      },

      _validation: function () {
        var callback = this._doShowFocus.bind(this);
        this.get('parentView.formForModel').validate().then(callback, callback);
      },

      /**
       * @description 在视图渲染完成后，将select组件转换为chosen组件
       * @method _updateDom
       * @private
       */
      _updateDom: function () {

        Ember.run.scheduleOnce('afterRender', this, function () {
          //在select视图渲染成成后，将其转换为chosen下拉框，并监听change事件
          this.$().chosen()
            .on('change chosen:hiding_dropdown', function () {
              //为了取得数组正确的变化，将validate推迟到下一生命周期运行
              Ember.run.next(this, '_validation');
            }.bind(this))
          ;
        });
      }.on('didInsertElement')
    });

    __exports__["default"] = ChosenSelect;
  });
define("bricksui-form/controllers/checkbox_item",
  ["exports"],
  function(__exports__) {
    "use strict";
    var CheckboxItemController = Ember.ObjectController.extend({
        selected: function () {
            var content = this.get('content');
            var list = this.get('parentController.elementsOfProperty');
            return list.contains(content);
        }.property(),
        label: function () {
            return this.get('model.' + this.get('parentController.labelPath'));
        }.property(),
        selectedChanged: function () {
            var content = this.get('content');
            var list = this.get('parentController.elementsOfProperty');
            if (this.get('selected')) {
                list.pushObject(content);
            } else {
                list.removeObject(content);
            }
            //TODO 暂时处理:调用model计算一边
            //原因:property为数组类型,需要监听数组方法
            var parent = this.get('parentController.model');
            parent.validate();
        }.observes('selected')
    });
    __exports__["default"] = CheckboxItemController;
  });
define("bricksui-form/controllers/radio_item",
  ["./checkbox_item","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var CheckboxItemController = __dependency1__["default"];
    var RadioItemController = CheckboxItemController.extend({
        selected: function () {
            return this.get('content') === this.get('parentController.elementsOfProperty');
        }.property(),
        selectedChanged: function () {
            var content = this.get('content');
            var parent = this.get('parentController');
            var model = this.get('parentController.model');
            model.set(parent.get('propertyPath'), content);
            model.validate();
        }.observes('selected')
    });

    __exports__["default"] = RadioItemController;
  });
define("bricksui-form/form-config",
  [],
  function() {
    "use strict";
    /**
     * @description bootstrap横排样式
     * 布局分隔为100%撑满，
     * Label在input左方，验证信息在input下方
     */
    Ember.EasyForm.Config.registerWrapper('bootstrap-horizontal', {
        inputTemplate: 'bootstrap-input',
        checkboxTemplate: "bootstrap-checkbox",
        radioTemplate: "bootstrap-radio",
        controlsWrapperClass: 'col-sm-6',
        formClass: 'form-horizontal form-bordered',
        fieldErrorClass: 'has-error',
        errorClass: 'text-danger',
        hintClass: 'help-block',
        labelClass: 'col-sm-3 control-label',
        inputClass: 'form-group',
        buttonClass: 'btn btn-primary',
        validationLayout:'bootstrap-validation-input'
    });

    /**
     * @description bootstrap默认样式
     * 布局分隔为100%撑满，
     * Label在input上方，验证信息在input下方
     */
    Ember.EasyForm.Config.registerWrapper('bootstrap', {
      checkboxTemplate: "bootstrap-checkbox",
      radioTemplate: "bootstrap-radio",
      labelClass: 'control-label',
      inputClass: 'form-group',
      buttonClass: 'btn btn-primary',
      fieldErrorClass: 'has-error',
      errorClass: 'help-block',
      validationLayout:'validation-layout'
    });


    //禁用submit 按钮的默认disabled属性
    //TODO 改用样式控制
    Ember.EasyForm.Submit.reopen({
        disabled: function () {
            return false;
        }.property('formForModel.isValid')
    });
    //所有组件扩展validate方法,方便form表单submit时统一调度
    Ember.EasyForm.Input.reopen({
        validate: function () {
            this.focusOut();
        }
    });
    //在默认form的submit方法调用完成后,统一调用各个组件的验证方法,先后顺序有待验证
    Ember.EasyForm.Form.reopen({
        submit: function () {
            this._super.apply(this, arguments);
            this.forEachChildView(function (subview) {
                if (subview.validate) {
                    subview.validate();
                }
            });
        }
    });
    //TODO 这里需要根据控件进行修改
    Ember.EasyForm.TextField.reopen({
        classNames: ["form-control"]
    });
    Ember.EasyForm.TextArea.reopen({
        classNames: ["form-control"]
    });

    /**
     * @description 拓展校验字段
     */
    Ember.EasyForm.Input.reopen({
      init:function(){
        this._super();
        if(this.isBlock && this.get('withValidation')){
          this.set('layoutName',this.get('wrapperConfig.validationLayout'));
        }
      }
    });
  });
define("bricksui-form/form-setup",
  ["./controllers/checkbox_item","./controllers/radio_item","./bu-editor","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var CheckboxItemController = __dependency1__["default"];
    var RadioItemController = __dependency2__["default"];
    var BuEditor = __dependency3__["default"];

    /**
     * 向模板中注册
     *  控制器
     *    checkboxItem
     *    radioItem
     *  组件
     *    bu-editor
     */
    __exports__["default"] = function initFormController(container, application) {
        container.register('controller:checkboxItem', CheckboxItemController);
        container.register('controller:radioItem', RadioItemController);
        container.register('component:bu-editor',BuEditor);
    }
  });
define("bricksui-form/helpers/checkbox",
  [],
  function() {
    "use strict";
    //checkbox组
    Ember.Handlebars.registerHelper('checkbox', function (property, options) {
        options = Ember.EasyForm.processOptions(property, options);

        if (options.hash.propertyBinding) {
            options.hash.property = Ember.Handlebars.get(this, options.hash.propertyBinding, options);
        }

        if (options.hash.inputOptionsBinding) {
            options.hash.inputOptions = Ember.Handlebars.get(this, options.hash.inputOptionsBinding, options);
        }

        var modelPath = Ember.Handlebars.get(this, 'formForModelPath', options);
        options.hash.modelPath = modelPath;

        property = options.hash.property;

        var modelPropertyPath = function (property) {
            if (!property) {
                return null;
            }

            var startsWithKeyword = !!options.data.keywords[property.split('.')[0]];

            if (startsWithKeyword) {
                return property;
            }

            if (modelPath) {
                return modelPath + '.' + property;
            } else {
                return property;
            }
        };
        var multiple = false;
        if (options.hash.contentBinding) {
            multiple = true;
        }
        options.hash[(multiple ? "value" : "checked") + "Binding"] = modelPropertyPath(property);

        var context = this;

        options.hash.viewName = 'input-field-' + options.data.view.elementId;

        if (options.hash.inputOptions) {
            var inputOptions = options.hash.inputOptions, optionName;
            for (optionName in inputOptions) {
                if (inputOptions.hasOwnProperty(optionName)) {
                    options.hash[optionName] = inputOptions[optionName];
                }
            }
            delete options.hash.inputOptions;
        }

        options.hash.isBlock = !!(options.fn);

        return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Checkbox, options);
    });
  });
define("bricksui-form/helpers/radio",
  [],
  function() {
    "use strict";
    Ember.Handlebars.registerHelper('radio', function (property, options) {
        options = Ember.EasyForm.processOptions(property, options);

        if (options.hash.propertyBinding) {
            options.hash.property = Ember.Handlebars.get(this, options.hash.propertyBinding, options);
        }

        if (options.hash.inputOptionsBinding) {
            options.hash.inputOptions = Ember.Handlebars.get(this, options.hash.inputOptionsBinding, options);
        }

        var modelPath = Ember.Handlebars.get(this, 'formForModelPath', options);
        options.hash.modelPath = modelPath;

        property = options.hash.property;

        var modelPropertyPath = function (property) {
            if (!property) {
                return null;
            }

            var startsWithKeyword = !!options.data.keywords[property.split('.')[0]];

            if (startsWithKeyword) {
                return property;
            }

            if (modelPath) {
                return modelPath + '.' + property;
            } else {
                return property;
            }
        };
        var multiple = false;
        if (options.hash.contentBinding) {
            multiple = true;
        }
        options.hash[(multiple ? "value" : "checked") + "Binding"] = modelPropertyPath(property);

        var context = this;

        options.hash.viewName = 'input-field-' + options.data.view.elementId;

        if (options.hash.inputOptions) {
            var inputOptions = options.hash.inputOptions, optionName;
            for (optionName in inputOptions) {
                if (inputOptions.hasOwnProperty(optionName)) {
                    options.hash[optionName] = inputOptions[optionName];
                }
            }
            delete options.hash.inputOptions;
        }

        options.hash.isBlock = !!(options.fn);

        return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Radio, options);
    });
  });
define("bricksui-form/initializer",
  ["./form-setup"],
  function(__dependency1__) {
    "use strict";
    var formController = __dependency1__["default"];

    Ember.onLoad("Ember.Application", function (Application) {

        Application.initializer({
            name: "form-controller",
            initialize: formController
        });
    });
  });
define("bricksui-form/radio-button",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-form
     */
    var RadioButton = Ember.View.extend({
        tagName: "input",
        type: "radio",
        attributeBindings: [ "name", "type", "value", "checked:checked:" ],
        click: function () {
            this.set("selection", this.$().val());
        },
        checked: function () {
            return this.get("value") === this.get("selection");
        }.property()
    });

    __exports__["default"] = RadioButton;
  });
define("bricksui-form/radio",
  ["./checkbox","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Checkbox = __dependency1__["default"];

    /**
     @module bricksui
     @submodule bricksui-form
     */
    /**
     拓展Ember.EasyForm.Input的Radio功能
     提供单选按钮组的功能
     ```handlebars
     {{radio something modelBinding="model" propertyPath="something" elementsBinding="fruits" labelPath="name"}}
     ```
     @class Radio
     @namespace Ember.EasyForm
     @extends Ember.EasyForm.Checkbox
     */
    var Radio = Checkbox.extend({
        init: function () {
            this._super.apply(this, arguments);
            this.set('templateName', this.get('wrapperConfig.radioTemplate'));
        }
    });

    __exports__["default"] = Radio;
  });
define("bricksui-i18n",
  ["bricksui-metal/core","bricksui-i18n/initializer","bricksui-i18n/i18n-support","bricksui-i18n/i18n-validator","bricksui-i18n/lang/en","bricksui-i18n/lang/zh-cn","bricksui-i18n/helpers/translation"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__) {
    "use strict";
    var BricksUI = __dependency1__["default"];

    var setLang = __dependency3__.setLang;
    var i18nValidator = __dependency4__["default"];

    //BEGIN IMPORT LANGUAGE
    var en = __dependency5__["default"];
    var zhCN = __dependency6__["default"];

    //END IMPORT LANGUAGE


    var translationHelper = __dependency7__.translationHelper;
    /**
     @module bricksui
     @submodule bricksui-i18n
     @description 国际化支持
     */
    /**
     * @class I18n
     * @namespace BricksUI
     * @type {Object}
     * @static
     */
    var I18n = {};
    /**
     * I18n语言包Hash.
     * ```javascript
     * en :en-us en-hk en-au
     * de :de-dk de-ch de-lu
     * zh-cn : zh-cn
     * zh-tw : zh-tw
     * ```
     * @static
     * @class lang
     * @namespace BricksUI.I18n
     * @type {Object}
     * @default zh-cn
     */
    I18n.lang = {};

    /**
     *  @property en
     *  @type Hash
     */
    I18n.lang['en'] = en;
    /**
     * @property zh-cn
     * @type Hash
     */
    I18n.lang['zh-cn'] = zhCN;

    I18n.I18nableValidationMixin = i18nValidator;

    I18n.setLang = setLang;

    Handlebars.registerHelper("t", translationHelper);


    BricksUI.I18n = I18n;
  });
define("bricksui-i18n/helpers/translation",
  ["bricksui-metal/core","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var BricksUI = __dependency1__["default"];

    var I18n = BricksUI.I18n;
    var isBinding = /(.+)Binding$/,
        uniqueElementId = (function () {
            var id = Ember.uuid || 0;
            return function () {
                var elementId = 'i18n-' + id++;
                return elementId;
            };
        })();
    var get = Ember.get,
        EmHandlebars = Ember.Handlebars
        ;
    __exports__["default"] = function (key, options) {
        var attrs, context, data, elementID, result, tagName, view;
        context = this;
        attrs = options.hash;
        data = options.data;
        view = data.view;
        tagName = attrs.tagName || 'span';
        delete attrs.tagName;
        elementID = uniqueElementId();

        Ember.keys(attrs).forEach(function (property) {
            var bindPath, currentValue, invoker, isBindingMatch, normalized, normalizedPath, observer, propertyName, root, _ref;
            isBindingMatch = property.match(isBinding);

            if (isBindingMatch) {
                propertyName = isBindingMatch[1];
                bindPath = attrs[property];
                currentValue = get(context, bindPath, options);
                attrs[propertyName] = currentValue;
                invoker = null;
                normalized = EmHandlebars.normalizePath(context, bindPath, data);
                _ref = [normalized.root, normalized.path], root = _ref[0], normalizedPath = _ref[1]; //jshint ignore:line

                observer = function () {
                    var elem, newValue;
                    if (view.$() == null) {
                        Ember.removeObserver(root, normalizedPath, invoker);
                        return;
                    }
                    newValue = get(context, bindPath, options);
                    elem = view.$("#" + elementID);
                    attrs[propertyName] = newValue;
                    return elem.html(I18n.t(key, attrs));
                };
                Ember.subscribe("i18nChange", {
                    after: observer
                });

                invoker = function () {
                    Ember.run.scheduleOnce('afterRender', observer);
                };

                return Ember.addObserver(root, normalizedPath, invoker);
            }
        });
        var observer = function () {
            var elem;
            elem = view.$("#" + elementID);
            return elem.html(I18n.t(key, attrs));
        };
        Ember.subscribe("i18nChange", {
            after: observer
        });
        result = '<%@ id="%@">%@</%@>'.fmt(tagName, elementID, I18n.t(key, attrs), tagName);
        return new EmHandlebars.SafeString(result);
    }
  });
define("bricksui-i18n/i18n-support",
  ["bricksui-metal/core","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var BricksUI = __dependency1__["default"];

    /**
     @module bricksui
     @submodule bricksui-i18n
     */
    var langKey = "bricksui-lang";

    /**
     * 从cookie中获取已保留的语言选择情况
     * @returns {*} 如果语言选择已经保存在cookie中，则返回已保存的语言结构，如果不存在则返回空
     */
    var loadLang = function () {
        try {
            return JSON.parse(Ember.$.cookie(langKey));
        } catch (e) {
            return null;
        }
    };

    /**
     * 获取并解析客户端语言
     * @returns {{fullName: *, language, area}}
     */
    var parseLanguage = function () {
        var language = (window.navigator.language || window.navigator.browserLanguage).toLowerCase(),
            match
            ;
        match = language.match(/(.*)-(.*)/);
        return {
            fullName: match[0],
            language: match[1],
            area: match[2]
        };
    };
    /**
     * 根据命名约定，从项目文件中加载语言包
     * @param parsedName
     * @returns {{localeName: ({language: *}|*|set.language|parseLanguage.language|language|string), localeLang: *}}
     */
    var requireLang = function (parsedName) {
        var require = window.require;
        if (typeof parsedName === "string") {
            parsedName = {
                language: parsedName
            };
        }
        var localeLang = require([BricksUI.ENV.MODULE_PREFIX, BricksUI.ENV.LANG_FOLDER_NAME, parsedName.language].join("/"));
        var localeName = parsedName.language;
        if (!localeLang) {
            localeLang = require([BricksUI.ENV.MODULE_PREFIX, BricksUI.ENV.LANG_FOLDER_NAME, parsedName.fullName].join("/"));
            localeName = parsedName.fullName;
        }
        if (localeLang && localeLang['default']) {
            localeLang = localeLang['default'];
        }

        return {
            localeName: localeName,
            localeLang: localeLang
        };
    };

    /**
     * 持久化用户所保存的语言选择
     * @param {object} lang
     */
    var saveLang = function (lang) {
        if (BricksUI.ENV.PERSISTENT_I18N) {
            Ember.$.cookie(langKey, JSON.stringify(lang), { expires: 7 });
        }
    };

    /**
     * 将语言对象合并到BricksUI.I18n.lang Hash下，并同步到Ember.I18n.translations对象下
     * @private
     * @param {object} locale
     */
    var mergeLang = function (locale) {
        var localeName = locale.localeName;
        var localeLang = locale.localeLang;
        var bricksLocale = BricksUI.I18n.lang[localeName];
        Ember.$.extend(true, bricksLocale, localeLang);
        Ember.$.extend(true, Ember.I18n.translations, bricksLocale);
    };

    /**
     * 在项目载入时进行I18n的选择，并根据是否开启语言选择持久化，保存语言选择
     * @private
     * @method initLang
     * @for BricksUI.I18n
     */
    var initLang = function () {
        var parsedName;
        if (BricksUI.ENV.PERSISTENT_I18N) {
            parsedName = loadLang() || parseLanguage();
        }
        var locale = requireLang(parsedName);
        mergeLang(locale);
        saveLang(parsedName);
    };
    /**
     * 语言切换,用户可以通过传入的语言标识符进行语言切换
     * 需要在对应的项目下有对应的语言包
     * app
     *      lang
     *          en.js
     *          zh-cn.js
     *  传入的标识符即为lang下的对应的文件名
     * @method setLang
     * @for BricksUI.I18n
     * @param {String} lang language string ,"en" "zh-cn"
     */
    var setLang = function (lang) {
        var locale = requireLang(lang);
        mergeLang(locale);
        saveLang({
            fullName: lang,
            language: lang,
            area: lang
        });

        var translations = Ember.I18n.translations;
        for (var prop in translations) {
            if (Ember.canInvoke(translations, prop)) {
                delete translations[prop];
            }
        }
        Ember.instrument("i18nChange",null,function(){
            Ember.Logger.warn("no listener for i18nChange! nothing changed!");
        });
    };

    __exports__.initLang = initLang;
    __exports__.setLang = setLang;
  });
define("bricksui-i18n/i18n-validator",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-i18n
     @description 国际化支持
     @constructor
     */
    /**
     * @class I18nableValidationMixin
     * @extends Ember.Validations.Mixin
     * @namespace BricksUI.I18n
     * @description 继承自Ember-Validations,拓展语言切换支持。通过该方法可做到即时的语言切换，缺点在于很难与默认的t.i18n进行交互
     * 该方法订阅 'i18nChange' 事件，在事件触发后，调用自身 validate方法
     * 使用方法为在需要使用校验的对象中参入I18nableValidationMixin
     * 如：
     ```javascript
      var Post=DS.Model.extend(BricksUI.I18n.I18nableValidationMixin,{
        title:DS.attr('string')
        validations: {
          title:{
            presence: true,
            length: { minimum: 5 }
          }
        }
     })
     ```
     */
    var I18nableValidationMixin = Ember.Mixin.create(Ember.Validations.Mixin,{
      init: function () {
        this._super();

        var validatorMixin = this;
        Ember.subscribe("i18nChange", {
          after: function (name, timestamp, payload) {
            validatorMixin.validate();
          }
        });
      }
    });
    __exports__["default"] = I18nableValidationMixin;
  });
define("bricksui-i18n/initializer",
  ["bricksui-metal/core","./i18n-support"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var BricksUI = __dependency1__["default"];
    var initLang = __dependency2__.initLang;

    Ember.onLoad("Ember.Application", function (Application) {

        Application.initializer({
            name: "i18n-setup",
            initialize: function (container, application) {
                BricksUI.ENV.MODULE_PREFIX = application.modulePrefix;
                initLang();
            }
        });
    });
  });
define("bricksui-i18n/lang/en",
  ["exports"],
  function(__exports__) {
    "use strict";
    var en = {
      errors: {
        inclusion: "is not included in the list",
        exclusion: "is reserved",
        invalid: "is invalid",
        confirmation: "doesn't match {{attribute}}",
        accepted: "must be accepted",
        empty: "can't be empty",
        blank: "can't be blank",
        present: "must be blank",
        tooLong: "is too long (maximum is {{count}} characters)",
        tooShort: "is too short (minimum is {{count}} characters)",
        wrongLength: "is the wrong length (should be {{count}} characters)",
        notANumber: "is not a number",
        notAnInteger: "must be an integer",
        greaterThan: "must be greater than {{count}}",
        greaterThanOrEqualTo: "must be greater than or equal to {{count}}",
        equalTo: "must be equal to {{count}}",
        lessThan: "must be less than {{count}}",
        lessThanOrEqualTo: "must be less than or equal to {{count}}",
        otherThan: "must be other than {{count}}",
        odd: "must be odd",
        even: "must be even",
        url: "is not a valid URL"
      }
    };
    __exports__["default"] = en;
  });
define("bricksui-i18n/lang/zh-cn",
  ["exports"],
  function(__exports__) {
    "use strict";
    var zhCN = {
      errors: {
        inclusion: "is not included in the list",
        exclusion: "is reserved",
        invalid: "is invalid",
        confirmation: "不匹配 {{attribute}}",
        accepted: "必须接受",
        empty: "输入不可为空",
        blank: "输入不可为空",
        present: "输入不可为空",
        tooLong: "长度错误 (最大值为 {{count}} 字符)",
        tooShort: "长度错误 (最小为 {{count}} 字符)",
        wrongLength: "长度错误 (必须为 {{count}} 字符)",
        notANumber: "请输入数值",
        notAnInteger: "请输入整数",
        greaterThan: "输入值必须大于 {{count}}",
        greaterThanOrEqualTo: "输入值必须不小于 {{count}}",
        equalTo: "输入值必须等于 {{count}}",
        lessThan: "输入值必须小于 {{count}}",
        lessThanOrEqualTo: "输入值必须不大于 {{count}}",
        otherThan: "请输入不同的值 {{count}}",
        odd: "请输入奇数",
        even: "请输入偶数",
        url: "请输入正确的URL地址"
      }
    };
    __exports__["default"] = zhCN;
  });
define("bricksui-metal",
  ["bricksui-metal/core","bricksui-metal/event_manager","bricksui-metal/state_handler","bricksui-metal/stateable"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var BricksUI = __dependency1__["default"];
    var EventManager = __dependency2__["default"];
    var StateHandler = __dependency3__["default"];
    var Stateable = __dependency4__["default"];
    /**
     * @module bricksui
     * @submodule bricksui-metal
     */
    BricksUI.EventManager = EventManager;
    BricksUI.Stateable = Stateable;
    BricksUI.StateHandler = StateHandler;
  });
define("bricksui-metal/core",
  ["exports"],
  function(__exports__) {
    "use strict";
    /*globals BricksUI:true */
    /**
     * @module bricksui
     * @submodule bricksui-metal
     */
    
    /**
     *  BricksUI ,a widget library on ember.js
     *  @class BricksUI
     *  @static
     *  @version 0.0.1-beta.1+canary.1a51009a
     */
    if ("undefined" === typeof BricksUI) {
        BricksUI = Ember.Namespace.create();
    }
    /**
     @property VERSION
     @type String
     @default '0.0.1-beta.1+canary.1a51009a'
     @static
     */
    BricksUI.VERSION = '0.0.1-beta.1+canary.1a51009a';
    
    var DEFAULT_ENV = {
        /**
         * 是否将语言选择持久化到cookie中，如果设置为true，则将优先获取cookie设置的语言
         * @property PERSISTENT_I18N
         * @for BricksUI.ENV
         * @type Boolean
         * @default true
         */
        PERSISTENT_I18N: true,
        /**
         * 应用前缀
         * @property MODULE_PREFIX
         * @for BricksUI.ENV
         * @type String
         * @default appkit
         */
        MODULE_PREFIX: 'appkit',
        /**
         * 语言包存放路径
         * @property LANG_FOLDER_NAME
         * @for BricksUI.ENV
         * @type String
         * @default lang
         */
        LANG_FOLDER_NAME: "lang"
    };
    
    /**
     *  @description Bricks变量配置
     *  @class ENV
     *  @namespace BricksUI
     *  @type Hash
     */
    if ("undefined" === typeof BricksUI.ENV) {
        BricksUI.ENV = DEFAULT_ENV;
    } else {
        Ember.$.extend(true, BricksUI.ENV, DEFAULT_ENV);
    }
    
    __exports__["default"] = BricksUI;
  });
define("bricksui-metal/event_manager",
  ["bricksui-metal/core","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /**
     * @module bricksui
     * @submodule bricksui-metal
     */

    var BricksUI = __dependency1__["default"];
    var Em = window.Ember;
    /**
     * Ember.View 本身的实现过程就是一个状态机的流转过程
     * Ember 事件绑定流程:
     *  Application.eventDispatcher
     *  Application.setupEventDispatcher
     *      -->eventDispatcher.setup
     *      -->eventDispatcher.setupHandler     //统一绑定在rootElement下
     *
     *  Ember事件触发流程:
     *  jQuery.event.dispatch
     *      -->Ember setupHandler
     *      -->eventDispatcher._findNearestEventManager
     *  在findNearestEventManager会查找视图是否具有事件管理器
     *  属性名称为:eventManager
     *      yes--> 事件统一交给事件管理器可处理的事件处理
     *      no --> 逐级冒泡事件
     *  为了统一管理事件,以及提供使用者统一的事件编码和调用,以及语义化事件变成
     *  将在View上新增eventManager属性,用于统一管理
     */

    var eventHandlers = {
        interpreKeyEvents: function (event) {
            //TODO 将mapping写成用户可以扩展的形式
            var mapping = event.shiftKey ? ModifiedKeyBindings : KeyBindings;
            var eventName = mapping[event.keyCode];
            if (eventName && this[eventName]) {
                var handler = this[eventName];
                if (Ember.typeOf(handler) === "function") {
                    return handler.call(this, event, this);
                }
                return false;
            }
        },
        handleKeyEvent: function (event, view) {
            var emberEvent = null;
            switch (event.type) {
                case "keydown":
                    emberEvent = "keyDown";
                    break;
                case "keypress":
                    emberEvent = "keyPress";
                    break;
            }
            var handler = emberEvent ? this.get(emberEvent) : null;
            if (handler) {
                return !handler.call(BricksUI.keyResponderStack.current(), event, BricksUI.keyResponderStack.current());
            } else if (emberEvent === "keyDown" && this.interpreKeyEvents(event)) {
                return false;
            } else if (this.get("parentView")) {
                return this.get("parentView").handleKeyEvent(event, view);
            }
        }
    };
    //TODO 需要仔细研究Ember内部这个的相关机制,才好扩展,
    Ember.View.reopen(eventHandlers);
    Ember.TextSupport.reopen(eventHandlers);

    /**
     * 用户可进行扩展和修改
     * @type
     */
    var KeyBindings = BricksUI.KeyBindings = {
        8: 'deleteBackward',
        9: 'insertTab',
        13: 'insertNewline',
        27: 'cancel',
        32: 'insertSpace',
        37: 'moveLeft',
        38: 'moveUp',
        39: 'moveRight',
        40: 'moveDown',
        46: 'deleteForward'
    };
    /**
     * 辅助键配合其他按键的修改操作
     * @type
     */
    var ModifiedKeyBindings = BricksUI.ModifiedKeyBindings = {
        8: 'deleteForward',
        9: 'insertBacktab',
        37: 'moveLeftAndModifySelection',
        38: 'moveUpAndModifySelection',
        39: 'moveRightAndModifySelection',
        40: 'moveDownAndModifySelection'
    };


    Ember.mixin(BricksUI, {
        mouseResponderView: null,
        keyResponderStack: Em.Object.extend({
            /**
             * 当前构造器是匿名的,直接创建对象,所以这里直接属性是引用类型不会有影响
             * 如果不是,则引用类型不应该放在这里,而应该直接实例化
             */
            _stack: [],
            currentKeyResponder: function () {
                return this.current();
            }.property().volatile(),
            current: function () {
                var length = this._stack.get('length');
                return length > 0 ? this._stack.objectAt(length - 1) : null;
            },
            push: function (view) {
                if (!Ember.none(view)) {
                    if (view.willBecomeKeyResponder) view.willBecomKeyResponder();
                    //TODO 需要兼容旧版本浏览器才用这种方式添加样式
                    if (view.set && !view.isDestroyed) view.set('isFocused', true);
                    this._stack.push(view);
                    if (view.didBecomeKeyResponder) view.didBecomeKeyResponder();
                    this.propertyDidChange('currentKeyResponder');
                }
                return view;
            },
            pop: function () {
                if (this._stack.get('length') > 0) {
                    var current = this.current();
                    if (current && current.willLoseKeyResponder) current.willLoseKeyResponder();
                    var view = this._stack.pop();

                    if (view.set && !view.isDestroyed) view.set('isFocused', false);
                    if (view.didLoseKeyResponder) view.didLoseKeyResponder();
                    this.propertyDidChange('currentKeyResponder');
                    return view;
                }
                else return null;
            },

            replace: function (view) {
                if (this.current() !== view) {
                    this.pop();
                    return this.push(view);
                }
            }
        }).create()
    });


    var EventManager = {
        acceptKeyResponder: false,

        becomeKeyResponder: function (replace) {
            if (this.get('acceptsKeyResponder') !== false && !this.get('isDisabled')) {
                if (replace === undefined || replace === true) {
                    BricksUI.keyResponderStack.replace(this);
                } else {
                    BricksUI.keyResponderStack.push(this);
                }
            } else {
                var parent = this.get('parentView');
                if (parent && parent.becomeKeyResponder) {
                    return parent.becomeKeyResponder(replace);
                }
            }
        },

        resignKeyResponder: function () {
            BricksUI.keyResponderStack.pop();
        }
    };
    BricksUI.ALLOW_BROWSER_DEFAULT_HANDLING = {};
    /**
     * 分开维护
     * @type {{}}
     */
    EventManager["eventManager"] = {
        mouseDown: function (event, view) {
            view.becomeKeyResponder();  // Becoming a key responder is independent of mouseDown handling
            BricksUI.set('mouseResponderView', undefined);
            var handlingView = this._dispatch('mouseDown', event, view);
            if (handlingView) {
                BricksUI.set('mouseResponderView', handlingView);
            }
            return !handlingView;
        },

        mouseUp: function (event, view) {
            if (BricksUI.get('mouseResponderView') !== undefined) {
                view = BricksUI.get('mouseResponderView');
                BricksUI.set('mouseResponderView', undefined);
            }
            return !this._dispatch('mouseUp', event, view);
        },

        mouseMove: function (event, view) {
            if (BricksUI.get('mouseResponderView') !== undefined) {
                view = BricksUI.get('mouseResponderView');
            }
            return !this._dispatch('mouseMove', event, view);
        },

        doubleClick: function (event, view) {
            if (BricksUI.get('mouseResponderView') !== undefined) {
                view = BricksUI.get('mouseResponderView');
            }
            return !this._dispatch('doubleClick', event, view);
        },

        keyDown: function (event) {
            if (BricksUI.keyResponderStack.current() !== undefined && BricksUI.keyResponderStack.current().get('isVisible')) {
                return BricksUI.keyResponderStack.current().handleKeyEvent(event, BricksUI.keyResponderStack.current());
            }
            return true;
        },

        keyPress: function (event) {
            if (BricksUI.keyResponderStack.current() !== undefined && BricksUI.keyResponderStack.current().get('isVisible')) {
                return BricksUI.keyResponderStack.current().handleKeyEvent(event, BricksUI.keyResponderStack.current());
            }
            return true;
        },

        // For the passed in view, calls the method with the name of the event, if defined. If that method
        // returns true, returns the view. If the method returns false, recurses on the parent view. If no
        // view handles the event, returns false.
        _dispatch: function (eventName, event, view) {
            var handler = view.get(eventName);
            if (handler) {
                var result = handler.call(view, event, view);
                //TODO
                if (result === BricksUI.ALLOW_BROWSER_DEFAULT_HANDLING) return false;
                else if (result) return view;
            }
            var parentView = view.get('parentView');
            if (parentView) return this._dispatch(eventName, event, parentView);
            else return false;
        }
    };

    __exports__["default"] = EventManager;
  });
define("bricksui-metal/state_handler",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     * @module bricksui
     * @submodule bricksui-metal
     */

    /**
     * 状态处理器
     * 在extend时将states属性移到_states属性,
     * 继承该接口,可以实现states在子父类间继承
     *
     *  App.DemoView=BricksUI.View.extend({
     *      states:{
     *
     *      }
     *  });
     *
     *  App.DemoView=BricksUI.View.extend({
     *      states:function(){
     *          return {
     *
     *          };
     *      }
     *  });
     *  TODO
     *  1.状态继承需要处理
     */
    var merge = Ember.merge,
        Mixin = Ember.Mixin,
        get = Ember.get,
        typeOf = Ember.typeOf
        ;
    /**
     * @class StateHandler
     * @namespace BricksUI
     */
    var StateHandler = Mixin.create({
        mergedProperties: ["_states"],

        willMergeMixin: function (props) {
            //TODO 处理 super 方法
            var hashName;
            if (!props._states) {
                if (typeof (props.states) === "function") {
                    props.states = props.states();
                }
                if (typeof (props.states) === "object") {
                    hashName = "states";
                }
                if (hashName) {
                    props._states = Ember.merge(props._states || {}, props[hashName]);
                }
                //这里处理了states属性,后续就不再需要处理,所以删除
                delete props[hashName];
            }
        }
        /*
         send:function(actionName){
         //TODO
         }
         */
    });
    /**
     * TODO
     * 1.从Event入手
     * 2.从Action入手,Action也是有Event入手,但是不用管理Event
     *      需要在模板里面显示指定action
     *      模板也是组件的内部属性,所以模板操作state是合理的
     *  Ember target 有两个内置关键字:controller和 view
     *  现在多加一个内置关键字:states,让用户可以从模板触发
     *  {{action unfold target="states"}}
     */

    __exports__["default"] = StateHandler;
  });
define("bricksui-metal/stateable",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     * @module bricksui
     * @submodule bricksui-metal
     */
    
    /**
     * 有限状态机(Finite State Machine)
     *   有限状态机对行为建模
     *      1、事件：程序对事件进行响应
     *      2、状态：程序在事件间的状态
     *      3、转移：对应于事件，状态间的转移
     *      4、动作：转移过程中采取动作
     *      5、变量：变量保存事件间的动作所需的值
     *   状态设计要点：
     *      1、在该状态下，该事件是否可能发生
     *      2、采取什么动作来处理事件
     *      3、事件过后转移到什么状态
     *      4、在事件之间需要记录什么变量（数据）
     *
     *  现代的UI组件大都是具有可交互性的,不再简单的支持输入输出,总是有内在的状态转换
     *  事件触发,执行动作和行为转换
     *  组件通常都是粗粒度的,有自己内部机制,组合机制等等,BricksUI采用FSM分离行为,作为默认的组合机制
     *  当设计组件时,切面能够帮助有效地帮助切分组件的功能以及帮助开发者精心考虑组件的重用的可能性
     */
    var get = Ember.get,
        set = Ember.set
        ;
    /**
     *
     * @type {void|*}
     */
    var Stateable = Ember.Mixin.create({
        /**
         * 初始状态
         */
        initialState: null,
        /**
         * 公有属性,用户需要以此获得当前状态
         * 当前状态,
         */
        activeState: null,
        /**
         *  触发状态上的事件
         * @param name
         * @param context
         * @returns {*}
         */
        send: function (name, context) {
            var currentState = get(this, 'currentState');
            if (!currentState[name]) {
                this._unhandledEvent(currentState, name, context);
            }
            return currentState[name](this, context);
        },
        /**
         * 状态过度方法
         * @param name
         */
        transitionTo: function (name) {
            var pivotName = name.split(".", 1),
                currentState = get(this, 'currentState'),
                state = currentState;
            do {
                if (state.exit) {
                    state.exit(this);
                }
                state = state.parentState;
            } while (!state.hasOwnProperty(pivotName));
    
            var path = name.split(".");
            var setups = [], enters = [], i, l;
            for (i = 0, l = path.length; i < l; i++) {
                state = state[path[i]];
                if (state.enter) {
                    enters.push(state);
                }
                if (state.setup) {
                    setups.push(state);
                }
            }
    
            for (i = 0, l = enters.length; i < l; i++) {
                enters[i].enter(this);
            }
            set(this, 'currentState', state);
            for (i = 0, l = setups.length; i < l; i++) {
                setups[i].setup(this);
            }
        },
        /**
         * 当前状态没有对应事件，则直接抛出异常
         * @param state
         * @param name
         * @param context
         * @private
         */
        _unhandleEvent: function (state, name, context) {
            var errorMessage = "Attempted to handle event `" + name + "` ";
            errorMessage += "on " + String(this) + " while in state ";
            errorMessage += state.stateName + ". ";
    
            if (context !== undefined) {
                errorMessage += "Called with " + Ember.inspect(context) + ".";
            }
    
            throw new Ember.Error(errorMessage);
        }
    });
    /**
     * 根据指定对象，扩展，类似于具备功能的接口扩展
     * 非深度
     * @param original
     * @param hash
     * @returns {*}
     */
    function mixin(original, hash) {
        for (var prop in hash) {
            original[prop] = hash[prop];
        }
        return original;
    }
    /**
     * 由于状态机不止组件可以使用,其他可以拆分为各种状态的都可以使用,所以该方法需要是公开的API
     * 装配状态
     * 每个状态都添加parentState的引用
     * 每个状态都增加全状态路径名称
     * root
     *     empty    -->root.empty
     *     deleted  -->root.deleted
     */
    function wireState(object, parent, name) {
        object = mixin(parent ? Ember.create(parent) : {}, object);
        object.parentState = parent;
        object.stateName = name;
    
        for (var prop in object) {
            if (!object.hasOwnProperty(prop) || prop === "parentState" || prop === "stateName") {
                continue;
            }
            if (typeof object[prop] === "object") {
                object[prop] = wireState(object[prop], object, name + "." + prop);
            }
        }
    }
    
    
    __exports__.Stateable = Stateable;
    __exports__.wireState = wireState;
  });
define("bricksui-metal/view",
  ["bricksui-metal/core","bricksui-metal/statechart","bricksui-metal/event_manager","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /**
     * @module bricksui-metal
     */

    var BricksUI = __dependency1__["default"];
    var Stateable = __dependency2__["default"];
    var EventManager = __dependency3__["default"];
    /**
     *  Ember.View的创建过程是一个状态机的流转过程,具体如下:
     *  Ember.View.states:
     *    x: _default    默认方法集合,作为其他状态的基类,不作为具体状态使用
     *      preRender   初始化状态,渲染之前
     *      inBuffer    渲染状态,此时正在生成相应的html标签和属性
     *      inDom       已经成为dom节点状态,已经生成并且插入到页面中
     *      hasElement  一切准备就绪,等待接受用户操作
     *      destroying  正在移除中,视图销毁
     *  以上状态是逐个向下的状态
     *
     *  目前用于所使用的标签都是由W3C制定的,存在一定的局限性
     *  Ember Component提供了一种方式来增强自定义标签,增强HTML功能,
     *  而且Ember的这一实现与W3C目前的Custom Elements 工作一致,并且尽可能保持同步
     *  在未来的浏览器版本,一旦Custom Elements普及,则Ember实现的这一套机制本身就与标准看齐,所以可以方便地集成
     *
     *  BricksUI View 要点
     *  1.FSM 分离用户行为和组件行为
     *  2.AOP进行事件切片,以及权限和操作行为控制
     *  3.与W3C Custom Elements (TODO 研究)
     *  TODO:制定组件的生命周期以及使用方式,及与外部交互的基础
     */
    //TODO ES6
    /**
     * 基类具备状态机管理功能
     * 如何将事件传播到state中,执行对应的action
     * 在模板里面添加states的action-->{{action unfoldmenu target="states"}}
     *
     * mouseDown(click)-> view.states["activeState"]["unfoldmenu"]
     * record.loadingData->record.currentState["loadingData"]
     */

    var Em = window.Ember;
    /**
     * TODO
     * 1.用Component来实现组件
     * 2.用模板和action结合来实现组件行为
     */
    var View = Em.View.extend(Stateable, EventManager, {
        init: function () {
            this._super();
        }
        //TODO

    });

    __exports__.View = View;
  });
define("bricksui",
  ["bricksui-metal","bricksui-form","bricksui-i18n"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    /**
     * @description 构建主入口文件
     */
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

Ember.TEMPLATES['components/bu-editor'] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', escapeExpression=this.escapeExpression;


  data.buffer.push("<textarea id=\"");
  data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "view.holderId", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
  data.buffer.push("\"></textarea>");
  return buffer;
  
});

requireModule("bricksui");

})();