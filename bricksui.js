/*!
 * @overview  Bricks - a widget library based on Ember
 * @copyright Copyright 2014-2014 e-vada.com and contributors
 * @license   Licensed under MIT license
 *            See https://raw.github.com/innobricks/bricksui/master/LICENSE
 * @version   0.0.1-beta.1+canary.4671db49
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

define("bricksui-form",
  ["bricksui-form/initializer","bricksui-form/form-config","bricksui-form/helpers/checkbox","bricksui-form/helpers/radio","bricksui-form/bu-editor","bricksui-form/chosen-select","bricksui-form/ember-validations","bricksui-form/checkbox","bricksui-form/radio","bricksui-form/radio-button"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__) {
    "use strict";

    var Checkbox = __dependency8__["default"];
    var Radio = __dependency9__["default"];
    var RadioButton = __dependency10__["default"];

    /**
     BricksUI表单支持模块，对Ember-Easy-Form进行功能拓展，整合Validation与I18n
     @module bricksui
     @submodule bricksui-form
     */
    Ember.EasyForm.Checkbox = Checkbox;
    Ember.EasyForm.Radio = Radio;
    Ember.RadioButton = RadioButton;
  });
define("bricksui-form/bu-datepicker",
  ["bricksui-metal/core","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var BricksUI = __dependency1__["default"];
    var get = Ember.get,
        set = Ember.set,
        i18n = BricksUI.I18n;
    /**
     @module bricksui
     @submodule bricksui-form
     */

    /**
     Bootstrap时间日期选择插件，可配置的参数有
     ```javascript
     var options={
             minViewMode:null                //可选值为['months','years']纯月份选择/年选择
             viewMode:null                   //可选值为['months','years']纯月份选择/年选择
             pickDate: true,                 //是否启用日期选择
             pickTime: true,                 //是否启用事件选择
             useMinutes: true,               //是否启用分钟选择
             useSeconds: true,               //是否启用秒钟选择
             useCurrent: true,               //当useCurrent设置为true，该组件将默认选择当前日期
             minuteStepping:1,               //分钟间隔设置(可选择的分钟间隔)
             minDate:`1/1/1900`,             //最小可选择的时间
             maxDate: ,                      //最大的可选择事件(默认为当天 100年后)
             showToday: true,                 //shows the today indicator
             language:'en',                  //设置默认语言区
             defaultDate:"",                 //sets a default date, accepts js dates, strings and moment objects
             disabledDates:[],               //an array of dates that cannot be selected
             enabledDates:[],                //an array of dates that can be selected
             icons = {
                    time: 'glyphicon glyphicon-time',
                    date: 'glyphicon glyphicon-calendar',
                    up:   'glyphicon glyphicon-chevron-up',
                    down: 'glyphicon glyphicon-chevron-down'
                }
             useStrict: false,               //use "strict" when validating dates
             sideBySide: false,              //show the date and time picker side by side
             daysOfWeekDisabled:[]          //for example use daysOfWeekDisabled: [0,6] to disable weekends
        }
     ```

     组件使用方式为
     ```handlebars
     {{bu-datepicker value=value}}
     ```
     @class BuDatePicker
     @namespace Ember
     @extends Ember.Component
     */
    __exports__["default"] = Ember.Component.extend({
        classNames: ['form-control'],

        tagName: 'input',

        defaultTemplate: Ember.Handlebars.compile(""),

        /**
         * 外部所绑定的值
         * @property value
         * @type Object
         */
        value: null,

        init: function () {
            this._super.apply(this, arguments);
            this._parseOptions();
            this.attachI18nEvent();
        },

        /**
         * input fix，根据在输入的格式校验失败后，尝试将输入项转换为Date类型，如果成功，则进行格式转换并输出
         * @param {object} event
         */
        error: function (event) {
            var date, elem, format, newFmt , val;
            elem = this.$();
            val = elem.prop('value');
            if (!isNaN((date = new Date(val)).getTime())) {
                elem = this.$();
                format = elem.data('DateTimePicker').format;
                newFmt = moment(date).format(format);
                elem.prop('value', newFmt);
                elem.trigger('change');
            }
        },

        /**
         * 绑定原始值,在输入框内容发生改变时，更新Value的值
         * @method change
         * @private
         */
        change: function () {
            var elem = this.$(),
                picker = elem.data('DateTimePicker');

            set(this, 'value', picker.getDate().toISOString());
        },

        /**
         * 在时间格式校验失败后，进行泛类型时间尝试
         * @private
         */
        _attachEvent: function () {
            this.$().on('dp.error', this.error.bind(this));
            this.$().on('focusout', this.change.bind(this));
        },

        /**
         * 对传入的options参数进行解析，如果传入的参数类型为string，则尝试转换为字符串
         * @method _parseOptions
         * @private
         */
        _parseOptions: function () {
            var options = get(this, 'options');

            if (Ember.typeOf(options) === 'string') {
                try {
                    options = JSON.parse(options);
                    set(this, 'options', options);
                } catch (e) {
                    throw e;
                }
            }
            this.defaultOptions.language = i18n.getLang().language;
        },

        /**
         * 在视图销毁时，清除datepicker Dom 对象
         */
        _destroyElement: function () {
            var elem;
            elem = this.$();
            elem.data('DateTimePicker').destroy();
        }.on('destroyElement'),

        /**
         * 监听全局I18n改变事件，在所选择的语言改变后，重新渲染视图
         * @method attachI18nEvent
         * @private
         */
        attachI18nEvent: function () {
            var datePicker = this;
            Ember.subscribe("i18nChange", {
                after: function (name, timestamp, payload) {
                    datePicker._destroyElement();
                    datePicker.defaultOptions.language = payload.language;
                    datePicker._updateDom();
                }
            });
        },

        /**
         * 默认配置文件，为准确完成日期格式转换，将进行严格日期校验
         * 在所选择语言发生变化后，将进行视图重新渲染
         * @property
         */
        defaultOptions: {
            useStrict: true
        },

        /**
         * 在视图渲染完成后，设置datetimepick组件
         * @method _updateDom
         * @private
         */
        _updateDom: function () {

            Ember.run.scheduleOnce('afterRender', this, function () {
                var options = Ember.$.extend({}, this.defaultOptions, this.get('options'));
                this.$().datetimepicker(options);
                this._attachEvent();
            });
        }.on('didInsertElement')
    });
  });
define("bricksui-form/bu-daterange",
  ["exports"],
  function(__exports__) {
    "use strict";
    var get = Ember.get,
        set = Ember.set;

    /**
     @module bricksui
     @submodule bricksui-form
     */

    /**
     Bootstrap时间日期选择插件，可配置的参数有
     ```javascript
     $('input[name="daterange"]').daterangepicker(
     {
       format: 'YYYY-MM-DD',
       startDate: '2013-01-01',
       endDate: '2013-12-31'
     },
     function(start, end, label) {
              alert('A date range was chosen: ' + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
            }
     );
     //第一个参数为DateRange组件的配置项，第二个参数为值改变后的回调函数，可利用该回调函数进行dom操作等
     ```
     可选的options参数有
     ```html
     startDate: (Date object, moment object or string) 起始日期，值可以为一个Date类型对象或moment类型对象

     endDate: (Date object, moment object or string) 结束日期，值可以为一个Date类型对象或moment类型对象

     minDate: (Date object, moment object or string) 可供选择的最小日期，值可以为一个Date类型对象或moment类型对象

     maxDate: (Date object, moment object or string) 可供选择的最大日期，值可以为一个Date类型对象或moment类型对象

     dateLimit: (object) 起始到结束最大的日期区间，(moment时间区间)

     showDropdowns: (boolean) Show year and month select boxes above calendars to jump to a specific month and year

     showWeekNumbers: (boolean) Show week numbers at the start of each week on the calendars

     timePicker: (boolean) 是否允许具体时间选择

     timePickerIncrement: (number) Increment of the minutes selection list for times (i.e. 30 to allow only selection of times ending in 0 or 30)

     timePicker12Hour: (boolean) Use 12-hour instead of 24-hour times, adding an AM/PM select box

     ranges: (object) Set predefined date ranges the user can select from. Each key is the label for the range, and its value an array with two dates representing the bounds of the range

     opens: (string: 'left'/'right') Whether the picker appears aligned to the left or to the right of the HTML element it's attached to

     buttonClasses: (array) CSS class names that will be added to all buttons in the picker

     applyClass: (string) CSS class string that will be added to the apply button

     cancelClass: (string) CSS class string that will be added to the cancel button

     format: (string) Date/time format string used by moment when parsing or displaying the selected dates

     separator: (string) Separator string to display between the start and end date when populating a text input the picker is attached to

     locale: (object) Allows you to provide localized strings for buttons and labels, and the first day of week for the calendars

     singleDatePicker: (boolean) Show only a single calendar to choose one date, instead of a range picker with two calendars; the start and end dates provided to your callback will be the same single date chosen

     parentEl: (string) jQuery selector of the parent element that the date range picker will be added to, if not provided this will be 'body'
     ```

     组件使用方式为
     ```handlebars
     {{bu-daterange startDate=startDate endDate=endDate}}
     ```
     @class BuDateRange
     @namespace Ember
     @extends Ember.Component
     */
    __exports__["default"] = Ember.Component.extend({

        tagName: 'input',

        defaultTemplate: Ember.Handlebars.compile(""),

        /**
         * 开始日期
         * @type string
         * @default null
         * @property startDate
         */
        startDate: null,

        /**
         * 结束日期
         * @type string
         * @default null
         * @property endDate
         */
        endDate: null,

        init: function () {
            this._super.apply(this, arguments);
            this._parseOptions();
            this._prepareDate();
        },

        /**
         * 如果已经设置了开始日期和结束日期，则将值设置入options中
         * @method _prepareDate
         * @private
         */
        _prepareDate: function () {
            var dateRange, options;

            options = get(this, 'options');
            dateRange = Ember.getProperties(this, 'startDate', 'endDate');

            if (dateRange.startDate) {
                set(options, 'startDate', moment(dateRange.startDate));
            }
            if (dateRange.endDate) {
                set(options, 'endDate', moment(dateRange.endDate));
            }
        },

        /**
         * 如果options是模板中传入的字符串，尝试将字符串转换为options对象
         * @method _parseOptions
         * @private
         */
        _parseOptions: function () {
            var options = get(this, 'options');

            if (options === undefined) {
                set(this, 'options', {});
                return;
            }

            if (Ember.typeOf(options) === 'string') {
                try {
                    JSON.parse(options);
                    set(this, 'options', options);
                } catch (e) {
                    throw e;
                }
            }
        },

        /**
         * 在对象发生改变时，设置开始日期与结束日期
         * @method change
         * @private
         */
        change: function () {
            var dateRange,
                elem = this.$();
            dateRange = elem.data('daterangepicker');

            Ember.setProperties(this, {
                "startDate": dateRange.startDate,
                "endDate": dateRange.startDate
            });

        },

        /**
         * 添加事件监听
         * @method _attachEvent
         * @private
         */
        _attachEvent: function () {
            this.$().on('change.daterangepicker', this.change.bind(this));
        },

        /**
         * 在视图渲染完成后将对象转换为DateRange组件
         * @method _updateDom
         * @private
         */
        _updateDom: function () {
            Ember.run.scheduleOnce('afterRender', this, function () {
                var options = get(this, 'options');
                this.$().daterangepicker(options);
            });
        }.on('didInsertElement')
    });
  });
define("bricksui-form/bu-editor",
  ["exports"],
  function(__exports__) {
    "use strict";
    var get = Ember.get,
        set = Ember.set
        ;

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
     传入的config配置项有
     ```javascript
     toolbar:[
     'source | undo redo | bold italic underline strikethrough | superscript subscript | forecolor backcolor | removeformat |',
     'insertorderedlist insertunorderedlist | selectall cleardoc paragraph | fontfamily fontsize' ,
     '| justifyleft justifycenter justifyright justifyjustify |',
     'link unlink | emotion image video  | map',
     '| horizontal print preview fullscreen', 'drafts', 'formula'
     ]

     //语言配置项,默认是zh-cn。有需要的话也可以使用如下这样的方式来自动多语言切换，当然，前提条件是lang文件夹下存在对应的语言文件：
     //lang值也可以通过自动获取 (navigator.language||navigator.browserLanguage ||navigator.userLanguage).toLowerCase()
     //,lang:"zh-cn"
     //,langPath:URL +"lang/"

     //ie下的链接自动监测
     //,autourldetectinie:false

     //主题配置项,默认是default。有需要的话也可以使用如下这样的方式来自动多主题切换，当然，前提条件是themes文件夹下存在对应的主题文件：
     //现有如下皮肤:default
     //,theme:'default'
     //,themePath:URL +"themes/"



     //针对getAllHtml方法，会在对应的head标签中增加该编码设置。
     //,charset:"utf-8"

     //常用配置项目
     //,isShow : true    //默认显示编辑器

     //,initialContent:'欢迎使用UMEDITOR!'    //初始化编辑器的内容,也可以通过textarea/script给值，看官网例子

     //,initialFrameWidth:500 //初始化编辑器宽度,默认500
     //,initialFrameHeight:500  //初始化编辑器高度,默认500

     //,autoClearinitialContent:true //是否自动清除编辑器初始内容，注意：如果focus属性设置为true,这个也为真，那么编辑器一上来就会触发导致初始化的内容看不到了

     //,textarea:'editorValue' // 提交表单时，服务器获取编辑器提交内容的所用的参数，多实例时可以给容器name属性，会将name给定的值最为每个实例的键值，不用每次实例化的时候都设置这个值

     //,focus:false //初始化时，是否让编辑器获得焦点true或false

     //,autoClearEmptyNode : true //getContent时，是否删除空的inlineElement节点（包括嵌套的情况）

     //,fullscreen : false //是否开启初始化时即全屏，默认关闭

     //,readonly : false //编辑器初始化结束后,编辑区域是否是只读的，默认是false

     //,zIndex : 900     //编辑器层级的基数,默认是900

     //如果自定义，最好给p标签如下的行高，要不输入中文时，会有跳动感
     //注意这里添加的样式，最好放在.edui-editor-body .edui-body-container这两个的下边，防止跟页面上css冲突
     //,initialStyle:'.edui-editor-body .edui-body-container p{line-height:1em}'

     //,autoSyncData:true //自动同步编辑器要提交的数据

     //,emotionLocalization:false //是否开启表情本地化，默认关闭。若要开启请确保emotion文件夹下包含官网提供的images表情文件夹

     //,allHtmlEnabled:false //提交到后台的数据是否包含整个html字符串

     //fontfamily
     //字体设置
     //        ,'fontfamily':[
     //              { name: 'songti', val: '宋体,SimSun'},
     //          ]

     //fontsize
     //字号
     //,'fontsize':[10, 11, 12, 14, 16, 18, 20, 24, 36]

     //paragraph
     //段落格式 值留空时支持多语言自动识别，若配置，则以配置值为准
     //,'paragraph':{'p':'', 'h1':'', 'h2':'', 'h3':'', 'h4':'', 'h5':'', 'h6':''}

     //undo
     //可以最多回退的次数,默认20
     //,maxUndoCount:20
     //当输入的字符数超过该值时，保存一次现场
     //,maxInputCount:1

     //imageScaleEnabled
     // 是否允许点击文件拖拽改变大小,默认true
     //,imageScaleEnabled:true

     //dropFileEnabled
     // 是否允许拖放图片到编辑区域，上传并插入,默认true
     //,dropFileEnabled:true

     //pasteImageEnabled
     // 是否允许粘贴QQ截屏，上传并插入,默认true
     //,pasteImageEnabled:true

     //autoHeightEnabled
     // 是否自动长高,默认true
     //,autoHeightEnabled:true

     //autoFloatEnabled
     //是否保持toolbar的位置不动,默认true
     //,autoFloatEnabled:true

     //浮动时工具栏距离浏览器顶部的高度，用于某些具有固定头部的页面
     //,topOffset:30

     //填写过滤规则
     //,filterRules: {}
     ```
     ####warn:某些情况下，如果umeditor基准路径不正确，可以设置 中的 UMEDITOR_HOME_URL参数
     ```javascrript
     //全局编辑器基准路径
     window.UMEDITOR_CONFIG = {

            //为编辑器实例添加一个路径，这个不能被注释
            UMEDITOR_HOME_URL : URL
     }
     ```
     @class BuEditor
     @namespace Ember
     @extends Ember.Component
     @uses Ember.TextSupport
     */
    var BuEditor = Ember.Component.extend({

        tagName: 'textarea',

        defaultTemplate: Ember.Handlebars.compile(""),

        /**
         value类型，分别为content和contentTxt,content包含其中的段落标签,contentTxt则指纯文本内容
         @property valueType
         @type string
         @default "content"
         */
        valueType: 'content',

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
            initialFrameWidth: "100%",
            //默认的编辑区域高度
            initialFrameHeight: 300
            //更多其他参数，请参考umeditor.config.js中的配置项
        },


        init: function () {
            this._super.apply(this, arguments);
            this._parseOptions();
        },

        /**
         绑定到文本域的字段
         @property value
         @type String
         @default null
         */
        value: "",

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


        _parseOptions: function () {
            var options = get(this, 'options');
            if (typeof options === 'string') {
                try {
                    options = JSON.parse(options);
                    set(this, 'options', options);
                } catch (e) {

                }
            }
        },


        /**
         将textarea转换为UMeditor实例
         @private
         @method _updateDom
         */
        _updateDom: function () {
            var options = get(this, 'options'),
                defaultOptions = get(this, 'defaultOptions'),
                editor;


            //TODO toolbar属性合并
            options = Ember.$.extend(true, {}, options, defaultOptions);

            editor = this._editor = UM.getEditor(this.get('elementId'), options);

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
define("bricksui-form/bu-select",
  ["bricksui-metal/core","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var BricksUI = __dependency1__["default"];
    var get = Ember.get,
        set = Ember.set;
    /**
     @module bricksui
     @submodule bricksui-form
     */
    /*
    组件使用方式为
    ```handlebars
     {{bu-select content=pizzas value=favouritePizza placeholder="select test" queryProperty="id" formatResult=formatResult formatSelection=formatSelection width="350px"}}
    ```
    @class buSelect
    @namespace Ember
    @extends Ember.Component
    */
    var BuSelect = Ember.Component.extend({
      tagName: "input",
      classNames: ["form-control"],
      classNameBindings: ["inputSize"],
      attributeBindings: ["style"],
      style: "display: hidden;",

      // Bindings that may be overwritten in the template
      inputSize: "input-md",
      width:'200px',
      optionValuePath: null,
      placeholder: null,
      multiple: false,
      allowClear: false,
      formatResult : null,
      formatSelection : null,
      queryProperty : "name",
      didInsertElement: function() {
        var self = this,
          options = {};

        // ensure select2 is loaded
        Ember.assert("select2 has to exist on Ember.$.fn.select2", Ember.$.fn.select2);

        // setup
        options.placeholder = this.get('placeholder');
        options.multiple = this.get('multiple');
        options.allowClear = this.get('allowClear');
        options.width = this.get('width');
        options.queryProperty = this.get('queryProperty');
        options.optionValuePath = this.get('optionValuePath');

        // allowClear is only allowed with placeholder
        Ember.assert("To use allowClear, you have to specify a placeholder", !options.allowClear || options.placeholder);

        /*
         Formatting functions that ensure that the passed content is escaped in
         order to prevent XSS vulnerabilities. Escaping can be avoided by passing
         Handlebars.SafeString as "text" or "description" values.
         Generates the html used in the dropdown list (and is implemented to
         include the description html if available).
         */

        options.formatResult = this.formatResult;


        /*
         Generates the html used in the closed select input, displaying the
         currently selected element(s). Works like "formatResult" but
         produces shorter output by leaving out the description.
         */

        options.formatSelection = this.formatSelection;
        /*
         Provides a list of items that should be displayed for the current query
         term. Uses the default select2 matcher (which handles diacritics) with the
         Ember compatible getter method for "text".
         */
        options.query = function(query) {
          var select2 = this,
            queryProperty = this.queryProperty;


          var filteredContent = self.get("content").reduce(function(results, item) {
            // items may contain children, so filter them, too
            var filteredChildren = [];

            if (item.children) {
              filteredChildren = item.children.reduce(function(children, child) {
                if (select2.matcher(query.term, get(child, queryProperty))) {
                  children.push(child);
                }
                return children;
              }, []);
            }

            // apply the regular matcher
            if (select2.matcher(query.term, get(item, queryProperty))) {
              // keep this item either if itself matches
              results.push(item);
            } else if (filteredChildren.length) {
              // or it has children that matched the term
              var result = Ember.$.extend({}, item, { children: filteredChildren });
              results.push(result);
            }
            return results;
          }, []);

          query.callback({
            results: filteredContent
          });
        };

        /*
         Maps "value" -> "object" when using select2 with "optionValuePath" set,
         and one time directly when setting up the select2 plugin even without "oVP".
         (but with empty value, which will just skip the method)
         Provides an object or an array of objects (depending on "multiple") that
         are referenced by the current select2 "val".
         When there are keys that can not be matched to objects, the select2 input
         will be disabled and a warning will be printed on the console.
         This is important in case the "content" has yet to be loaded but the
         "value" is already set and must not be accidentally changed because the
         inout cannot yet display all the options that are required.
         To disable this behaviour, remove those keys from "value" that can't be
         matched by objects from "content".
         */
        options.initSelection = function(element, callback) {
          var value = element.val(),
            content = self.get("content"),
            multiple = self.get("multiple"),
            optionValuePath = self.get("optionValuePath");

          if (!value || !value.length) {
            return callback([]);
          }

          // this method should not be needed without the optionValuePath option
          // but make sure there is an appropriate error just in case.
          Ember.assert("select2#initSelection has been called without an \"" +
            "optionValuePath\" set.", optionValuePath);

          var values = value.split(","),
            filteredContent = [];

          // for every object, check if its optionValuePath is in the selected
          // values array and save it to the right position in filteredContent
          var contentLength = content.length,
            unmatchedValues = values.length,
            matchIndex;

          // START loop over content
          for (var i = 0; i < contentLength; i++) {
            var item = content[i];
            matchIndex = -1;

            if (item.children && item.children.length) {
              // take care of either nested data...
              for (var c = 0; c < item.children.length; c++) {
                var child = item.children[c];
                matchIndex = values.indexOf("" + get(child, optionValuePath));
                if (matchIndex !== -1) {
                  filteredContent[matchIndex] = child;
                  unmatchedValues--;
                }
                // break loop if all values are found
                if (unmatchedValues === 0) {
                  break;
                }
              }
            } else {
              // ...or flat data structure: try to match simple item
              matchIndex = values.indexOf("" + get(item, optionValuePath));
              if (matchIndex !== -1) {
                filteredContent[matchIndex] = item;
                unmatchedValues--;
              }
              // break loop if all values are found
              if (unmatchedValues === 0) {
                break;
              }
            }
          }
          // END loop over content

          if (unmatchedValues === 0) {
            self._select.select2("readonly", false);
          } else {
            // disable the select2 element if there are keys left in the values
            // array that were not matched to an object
            self._select.select2("readonly", true);

            Ember.warn("select2#initSelection was not able to map each \"" +
              optionValuePath +"\" to an object from \"content\". The remaining " +
              "keys are: " + values + ". The input will be disabled until a) the " +
              "desired objects is added to the \"content\" array or b) the " +
              "\"value\" is changed.", !values.length);
          }

          if (multiple) {
            // return all matched objects
            return callback(filteredContent);
          } else {
            // only care about the first match in single selection mode
            return callback(filteredContent.get('firstObject'));
          }
        };

        this._select = this.$().select2(options);

        this._select.on("change", function() {
          // grab currently selected data from select plugin
          var data = self._select.select2("data");
          // call our callback for further processing
          self.selectionChanged(data);
        });

        // trigger initial data sync to set select2 to the external "value"
        this.valueChanged();
      },

      /**
       * Teardown to prevent memory leaks
       */
      willDestroyElement: function() {
        // If an assertion caused the component not to render, we can't remove it from the dom.
        if(this._select) {
          this._select.off("change");
          this._select.select2("destroy");
        }
      },

      /**
       * Respond to selection changes originating from the select2 element. If
       * select2 is working with full objects just use them to set the value,
       * use the optionValuePath otherwise.
       *
       * @param  {String|Object} data   Currently selected value
       */
      selectionChanged: function(data) {
        var value,
          multiple = this.get("multiple"),
          optionValuePath = this.get("optionValuePath");

        // if there is a optionValuePath, don't set value to the complete object,
        // but only the property referred to by optionValuePath
        if (optionValuePath) {
          if (multiple) {
            // data is an array, so use getEach
            value = data.getEach(optionValuePath);
          } else {
            // treat data as a single object
            value = get(data, optionValuePath);
          }
        } else {
          value = data;
        }

        this.set("value", value);
      },

      /**
       * Respond to external value changes. If select2 is working with full objects,
       * use the "data" API, otherwise just set the "val" property and let the
       * "initSelection" figure out which object was meant by that.
       */
      valueChanged: Ember.observer(function() {
        var value = this.get("value"),
          optionValuePath = this.get("optionValuePath");

        if (optionValuePath) {
          // when there is a optionValuePath, the external value is a primitive value
          // so use the "val" method
          this._select.select2("val", value);
        } else {
          // otherwise set the full object via "data"
          this._select.select2("data", value);
        }
      }, "value"),

      /**
       * Respond to changes on the content array and trigger data sync from external
       * value to select2 value. This is needed when the external value points to an
       * object which was not present in the content array until now (because of
       * lazy loading), but which might be there now.
       *
       * Don't worry about triggering an update on the external value property, the
       * valueChanged method prevents feedback loops by not triggering the select2
       * "change" event.
       */
      contentChanged: Ember.observer(function() {
        this.valueChanged();
      }, "content.@each", "content.@each.text")
    });

    __exports__["default"] = BuSelect;
  });
define("bricksui-form/bu-tree",
  ["exports"],
  function(__exports__) {
    "use strict";
    var get = Ember.get,
        set = Ember.set,
        forEach = Ember.EnumerableUtils.forEach,
        slice = Array.prototype.slice
        ;


    /**
     @module bricksui
     @submodule bricksui-form
     */

    /**
     树组件，对Jquery Ztree进行简单的封装

     使用方式
     ```handlebars
     {{bu-tree options=view.treeOptions zNodes=view.zNodes}}
     ```
     对应的View文件为
     ```javascript
     Tree View
     export default Ember.View.extend({

        init: function () {
          this._super.apply(this,arguments);
          this.set('treeOptions', {
            onClick:function(component, event, treeId, treeNode, clickFlag){
              //your code
            }
          });
          this.set('zNodes', [
              { name: "父节点1 - 展开", open: true,
                children: [
                  { name: "父节点11 - 折叠",
                    children: [
                      { name: "叶子节点111"},
                      { name: "叶子节点112"},
                      { name: "叶子节点113"},
                      { name: "叶子节点114"}
                    ]},
                  { name: "父节点12 - 折叠",
                    children: [
                      { name: "叶子节点121"},
                      { name: "叶子节点122"},
                      { name: "叶子节点123"},
                      { name: "叶子节点124"}
                    ]},
                  { name: "父节点13 - 没有子节点", isParent: true}
                ]},
              { name: "父节点2 - 折叠",
                children: [
                  { name: "父节点21 - 展开", open: true,
                    children: [
                      { name: "叶子节点211"},
                      { name: "叶子节点212"},
                      { name: "叶子节点213"},
                      { name: "叶子节点214"}
                    ]},
                  { name: "父节点22 - 折叠",
                    children: [
                      { name: "叶子节点221"},
                      { name: "叶子节点222"},
                      { name: "叶子节点223"},
                      { name: "叶子节点224"}
                    ]},
                  { name: "父节点23 - 折叠",
                    children: [
                      { name: "叶子节点231"},
                      { name: "叶子节点232"},
                      { name: "叶子节点233"},
                      { name: "叶子节点234"}
                    ]}
                ]},
              { name: "父节点3 - 没有子节点", isParent: true}
            ]
          );
        }
      });
     ```

     ```html
     Warning: *组件重写了callback函数方法，加入了一层代理功能，第一个参数为component实例，用于与Ember交互，其他参数与zTree一致
     ```

     ###详细API DEMO 见 [Ztree查看更多...](http://www.ztree.me/v3/main.php#_zTreeInfo)

     @class BuTree
     @namespace Ember
     @extends Ember.Component
     */
    __exports__["default"] = Ember.Component.extend({

        tagName: 'ul',

        /**
         * 默认模板
         * @default ''
         * @property defaultTemplate
         * @type function
         */
        defaultTemplate: Ember.Handlebars.compile(''),

        /**
         * 树所绑定的数据
         * @property zNodes
         * @type object
         * @default null
         */
        zNodes: null,


        classNames: ['ztree'],

        /**
         * elementId的别名
         * @property treeId
         * @default elementId
         * @type string
         */
        treeId: Ember.computed.alias('elementId'),

        /**
         * ztree配置项
         * @property options
         * @default {}
         * @type object
         */
        options: {},


        init: function () {
            this._super.apply(this, arguments);
            this._parseOptions();
        },


        /**
         * 如果options是模板中传入的字符串，尝试将字符串转换为options对象
         * @method _parseOptions
         * @private
         */
        _parseOptions: function () {
            var options = get(this, 'options');
            if (Ember.typeOf(options) === 'string') {
                try {
                    JSON.parse(options);
                    set(this, 'options', options);
                } catch (e) {
                    throw e;
                }
            }
            this._parseCallback(options);
        },

        /**
         * 对传入的callbacks进行切面，织入当前Compoennt对象，作为回调函数的第一个参数，
         * warn: this作用域保留为z-Tree插件作用域，如果需要获取当前的component作为回调函数的作用域，在回调函数中获取第一个参数进行操作
         * @param options
         * @private
         */
        _parseCallback: function (options) {
            var k,
                callbacks = options.callback;

            if (!callbacks) return;

            function curriedProxy(param, fn) {
                param = [param];
                return function () {
                    fn.apply(this, param.concat(slice.apply(arguments)));
                };
            }

            for (k in callbacks) {
                if (callbacks.hasOwnProperty(k)) {
                    callbacks[k] = curriedProxy(this, callbacks[k]);
                }
            }
        },

        /**
         * 返回zTree实例
         * @method getTree
         * @returns {*}
         */
        getTree: function () {
            var treeId = get(this, 'treeId');
            return Ember.$.fn.zTree.getZTreeObj(treeId);
        },

        /**
         * 在Component销毁时，销毁树的实例
         * @method _destroyElement
         * @private
         */
        _destroyElement: function () {
            var treeId = get(this, 'treeId');
            Ember.$.fn.zTree.destroy(treeId);
        }.on('destroyElement'),


        /**
         * 在插入Dom后，生成Tree组件
         * @method _updateDom
         * @private
         */
        _updateDom: function () {
            Ember.run.scheduleOnce('afterRender', this, function () {
                var setting = get(this, 'options'),
                    zNodes = get(this, 'zNodes');
                Ember.$.fn.zTree.init(this.$(), setting, zNodes);
            });
        }.on('didInsertElement')

    });
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
            this._super.apply(this, arguments);
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
define("bricksui-form/ember-validations",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-form
     */
    /**
     #####[Ember.Validations更多内容查看...](https://github.com/dockyard/ember-validations)
     #### 用法

     需要将`Ember.Validations.Mixin`集成到任何你想要添加验证的控制器上

     ```javascript
     var App.UserController = Ember.ObjectController.extend(Ember.Validations.Mixin);
     ```

     需要定义一个validations对象作为控制器的一个属性,用来标识当前模型的验证规则.
     对象的keys要一一映射模型的属性.如果你传入了一个JSON对象作为一个属性的值,则该值将被作为当前属性的验证规则.
     如果你传入了`true`,则该属性将被标记为需要被验证的.如下:

     ```javascript
     App.UserController.reopen({
          validations: {
            firstName: {
              presence: true,
              length: { minimum: 5 }
            },
            age: {
              numericality: true
            },
            profile: true
          }
     });
     ```

     #### 校验器

     当前已经支持的校验器如下所示

     ##### Absence
     验证属性值是`null`,`undefined` 或者是 `''`.

     ###### Options
     * `true` - 设置为`true`将激活控制校验并且使用默认提示信息
     * `message` - 错误提示信息,可以如果提供了,将会覆盖默认的提示信息

     ```javascript
     // Examples
     absence: true
     absence: { message: 'must be blank' }
     ```

     ##### Acceptance
     默认可被接受的值为`'1'`, `1`, and `true`.

     ###### Options
     * `true` - 设置为`true`将激活控制校验并且使用默认提示信息
     * `message` - 错误提示信息,可以如果提供了,将会覆盖默认的提示信息
     * `accept` - 可被接受的值

     ```javascript
     // Examples
     acceptance: true
     acceptance: { message: 'you must accept', accept: 'yes' }
     ```

     ##### Confirmation
     相同值校验

     ###### Options
     * `true` - 设置为`true`将激活控制校验并且使用默认提示信息
     * `message` - 错误提示信息,可以如果提供了,将会覆盖默认的提示信息

     ```javascript
     // Examples
     confirmation: true
     confirmation: { message: 'you must confirm' }
     ```

     ##### Exclusion
     排除校验

     ###### Options
     * `message` - 错误提示信息,可以如果提供了,将会覆盖默认的提示信息
     * `allowBlank` - 如果设置为`true`,值为空将跳过校验
     * `in` - 被允许的数组
     * `range` - 区间

     ```javascript
     // Examples
     exclusion: { in: ['Yellow', 'Black', 'Red'] }
     exclusion: { range: [5, 10], allowBlank: true, message: 'cannot be between 5 and 10' }
     ```

     ##### Format
     正则,格式化校验

     ###### Options
     * `message` - 错误提示信息,可以如果提供了,将会覆盖默认的提示信息
     * `allowBlank` - 如果设置为`true`,值为空将跳过校验
     * `with` - 正则表达式

     ```javascript
     // Examples
     format: { with: /^([a-zA-Z]|\d)+$/, allowBlank: true, message: 'must be letters and numbers only'  }
     ```

     ##### Inclusion
     被允许的值
     熬过校验
     ###### Options
     * `message` - 错误提示信息,可以如果提供了,将会覆盖默认的提示信息.
     * `allowBlank` - 如果设置为`true`,值为空将跳过校验
     * `in` - 被允许的数组
     * `range` - 区间

     ```javascript
     // Examples
     inclusion: { in: ['Yellow', 'Black', 'Red'] }
     inclusion: { range: [5, 10], allowBlank: true, message: 'must be between 5 and 10' }
     ```

     ##### Length
     定义属性的长度

     ###### Options
     * `number` - 跟`is`作用一样,长度必须时指定值
     * `array` - 数组里面有两个值,第一个元素代表最小值,第二个元素达标最大值,即长度的区间
     * `allowBlank` - 如果设置为`true`,值为空将跳过校验
     * `minimum` - 被允许的最小长度
     * `maximum` - 被允许的最大长度
     * `is` - 跟`number`作用一样,长度必须时指定值
     * `tokenizer` - 校验时执行的自定以函数,返回一个代表长度的对象

     ###### Messages
     * `tooShort` - 当不满足最小长度验证规则时,该错误信息将被应用显示,可覆盖默认的提示信息
     * `tooLong` - t当不满足最大长度验证规则时,该错误信息将被应用显示,可覆盖默认的提示信息
     * `wrongLength` - 当校验失败时,该错误信息将被应用显示,可覆盖默认的提示信息

     ```javascript
     // Examples
     length: 5
     length: [3, 5]
     length: { is: 10, allowBlank: true }
     length: { minimum: 3, maximum: 5, messages: { tooShort: 'should be more than 3 characters', tooLong: 'should be less than 5 characters' } }
     length: { is: 5, tokenizer: function(value) { return value.split(''); } }
     ```

     ##### Numericality
     校验是否是一个数值

     ###### Options
     * `true` -设置为`true`将激活控制校验并且使用默认提示信息
     * `allowBlank` - 如果设置为`true`,值为空将跳过校验
     * `onlyInteger` - 只能是整数
     * `greaterThan` - 一定要大于指定数
     * `greaterThanOrEqualTo` - 一定要大于等于指定数
     * `equalTo` - 一定要等于指定数
     * `lessThan` - 一定要小于指定数
     * `lessThanOrEqualTo` - 一定要小于等于指定数
     * `odd` - 一定是奇数
     * `even` - 一定是偶数

     ###### Messages
     * `greaterThan` -当大于校验失败时,该错误信息将被应用显示,可覆盖默认的提示信息
     * `greaterThanOrEqualTo` - 当大于等于校验失败时,该错误信息将被应用显示,可覆盖默认的提示信息
     * `equalTo` - 当等于校验失败时,该错误信息将被应用显示,可覆盖默认的提示信息
     * `lessThan` - 当小于校验失败时,该错误信息将被应用显示,可覆盖默认的提示信息
     * `lessThanOrEqualTo` - 当小于等于校验失败时,该错误信息将被应用显示,可覆盖默认的提示信息
     * `odd` - 当奇数校验失败时,该错误信息将被应用显示,可覆盖默认的提示信息
     * `even` - 当偶数校验失败时,该错误信息将被应用显示,可覆盖默认的提示信息

     ```javascript
     // Examples
     numericality: true
     numericality: { odd: true, messages: { odd: 'must be an odd number' } }
     numericality: { onlyInteger, greaterThan: 5, lessThanOrEqualTo : 10 }
     ```

     ##### Presence
     非空校验`null`, `undefined`, or `''`

     ###### Options
     * `true` - 设置为`true`将激活控制校验并且使用默认提示信息
     * `message` - 错误提示信息,可以如果提供了,将会覆盖默认的提示信息

     ```javascript
     // Examples
     presence: true
     presence: { message: 'must not be blank' }
     ```

     ##### Uniqueness

     *尚未实现*

     ##### URL

     校验是否是一个URL.

     ###### Options
     * `allowBlank` - 如果设置为`true`,值为空将跳过校验
     * `allowIp` - 如果设置为`true`,将使用IP地址进行校验URL,IP地址默认是非法的
     * `allowUserPass` - 如果设置为`true`,将校验URL是否有用户名和密码,默认情况是不允许用户名和密码
     * `allowPort` - 如果设置为`true`,将校验URL是否带有端口号,默认情况是不允许有端口号
     * `domainOnly` - 如果设置为`true`,将校验URL是否时主域名和子域名.
     * `protocols` - 可被接受的协议数组,默认为`http`,`https`

     ```javascript
     // Examples
     url { allowUserPass: true }
     url { allowBlank: true, allowIp: true, allowPort: true, protocols: ['http', 'https', 'ftp'] }
     url { domainOnly: true }
     ```

     ##### Conditional Validators

     每个校验器都可以带有一个`if` 或者 一个`unless`.条件判断.

     ```javascript
     // function form
     firstName: {
          presence: {
            if: function(object, validator) {
              return true;
            }
          }
     }

     // string form
     // if 'canValidate' is a function on the object it will be called
     // if 'canValidate' is a property object.get('canValidate') will be called
     firstName: {
          presence: {
            unless: 'canValidate'
          }
     }
     ```

     ##### Running Validations

     当对象被创建时,校验器将自动运行,以及每个属性改变时,也将自动校验.
     `isValid` 状态将被冒泡,并且帮助确定直接父级的校验状态
     `isInvalid` 状态同样可以被获取

     如果你想强制校验所有,只要在对象上调用`.validate()`方法.
     `isValid` 将被设置为`true` 或者`false`.所有校验的运行将返回promise,所以不是调用完`validate`方法,就是马上校验完毕的.
     `validate`方法返回一个promise,可以调用`then`方法添加完成后的回调

     ```javascript
     user.validate().then(function() {
          user.get('isValid'); // true
          user.get('isInvalid'); // false
     })
     ```

     ##### Inspecting Errors

     当一个对象集成`Ember.Validations.Mixin`后,该对象将同时拥有一个`errors`对象,所有校验的错误信息
     将被放置在该对象上.

     ```javascript
     App.User = Ember.Object.extend(Ember.Validations.Mixin, {
          validations: {
            firstName: { presence: true }
          }
     });

     user = App.User.create();
     user.validate().then(null, function() {
          user.get('isValid'); // false
          user.get('errors.firstName'); // ["can't be blank"]
          user.set('firstName', 'Brian');
          user.validate().then(function() {
             user.get('isValid'); // true
             user.get('errors.firstName'); // []
          })
     })

     ```

     ##### i18n

     国际化I18n默认包含以下的keys

     ```javascript
     Ember.I18n.translations = {
          errors:{
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
            even: "must be even"
          }
    }
     ```
     @namespace Ember
     @class Validations
     @extends Ember.Namespace
     */
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
        validationLayout: 'bootstrap-validation-input'
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
        validationLayout: 'bootstrap-validation-input'
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
        init: function () {
            this._super();
            if (this.isBlock && this.get('withValidation')) {
                this.set('layoutName', this.get('wrapperConfig.validationLayout'));
            }
        }
    });
  });
define("bricksui-form/form-docs",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-form
     */

    /**
     #####[EMBER-EASYFORM](https://github.com/dockyard/ember-easyForm)
     Ember-EasyForm提供对基础表单的封装，同时提供I18n以及字段校验的功能

     #####formFor助手用法
     ```handlebars
     {{#form-for model}}
     {{input firstName}}
     {{input lastName}}
     {{input bio as="text"}}
     {{input country as='select'
          collection="App.countries"
          selection="country"
          optionValuePath="content.id"
          optionLabelPath="content.name"
          prompt="Select Country"
     }}
     {{/form-for}}
     ```
     编译结果

     ```html
     <form>
     <div class="input string">
     <label for="ember1">First name</label>
     <input id="ember1" type="text"/>
     <span class="error"></span>
     </div>
     <div class="input string">
     <label for="ember2">Last name</label>
     <input id="ember2" type="text"/>
     <span class="error"></span>
     </div>
     <div class="input string">
     <label for="ember3">Bio</label>
     <textarea id="ember3"></textarea>
     <span class="error"></span>
     </div>
     <div class="input string">
     <label for="ember4">Country</label>
     <select id="ember4">
     xxx
     </select>
     <span class="error"></span>
     </div>
     </form>
     ```
     --------------------------------------
     Ember.EasyForm 允许通过设置input的as属性改变input组件的行为
     ```handlebars
     {{input secret as="hidden"}}
     ```
     ----------------------------------------
     Ember.EasyForm 可以根据传入的字段名称判断组件的行为，该行为可被as覆盖

     ```handlebars
     {{input email}}
     {{input password}}
     <em>第一个输入框type=email 第二个输入框type=password</em>
     ```
     ------------------------------------------
     传入label属性可以设置对象属性的名称
     ```handlebars
     {{input email label="电子邮箱..."}}
     ```

     label也可以为一个绑定属性
     ```handlebars
     {{input email labelBinding="emailLabel"}}
     ```

     placeholder设置文本框的占位符
     ```handlebars
     {{input firstName placeholder="Enter your first name"}}
     <em>placeholder也可以是一个绑定属性</em>
     ```

     也可在input中设置hint的属性，该属性将在input校验失败时，进行友好的校验提示
     ```handlebars
     {{input firstName hint="Enter your first name"}}
     <em>hint也可以是一个绑定属性</em>
     ```

     ------------------------------------------
     对于复杂的表单属性，也可以将input作为Block Helper使用,其中input-field指代html- input标签
     ```handlebars
     {{#input firstName}}
     {{input-field firstName}}{{label-field firstName}}
     <br/>
     {{error-field firstName}}
     {{/input}}
     ```

     Ember.EasyForm.InputField允许传入一个text作为input的Label

     ```handlebars
     {{label-field firstName text="Your first name"}}
     ```

     input-field也可以制定as字段，as字段的可选值有
     + text  -- textArea
     + email -- type=email
     + password -- type=password
     + url
     + color
     + tel
     + search
     + hidden
     + checkbox

     ```handlebars
     {{input-field bio as="text"}}
     {{input-field email}}
     ```

     ----------------------------

     #####error-field
     error-field指代校验失败后校验的信息
     ```handlebars
     {{error-field firstName}}
     ```

     ---------------------------------
     #####hint-field
     hint-field指代在表单校验失败后出现的用户提示信息（如：“用户名不能未空...”）
     ```handlebars
     {{hint-field firstName text="Your first name"}}
     ```


     ----------------------------------
     #####表单验证
     默认情况下，在表单元素触发了focus-out时，将触发表单的校验

     ----------------------------------
     #####i18n集成
     对于需要进行i18n的表单元素，Ember.EasyForm提供Translation后缀，进行表单国际化的工作

     ```handlebars
     {{input firstName placeholderTranslation="users.attributes.firstname"}}
     {{input firstName labelTranslation="users.attributes.firstname"}}
     {{input firstName hintTranslation="users.hints.firstname"}}
     {{input-field firstName placeholderTranslation="users.attributes.firstname"}}
     {{label-field firstName textTranslation="users.attributes.firstname"}}
     {{hint-field firstName textTranslation="users.hints.firstname"}}
     ```
     __更多I18n内容，见Ember.I18n文档__


     @namespace Ember
     @class EasyForm
     */



    /**
     Ember.EasyForm配置项，可以向Config内注册自定义组件，注册自定义模板等
     @class Config
     @namespace Ember.EasyForm
     */

    /**
     ###Wrapper
     Wrapper定义了EasyForm渲染视图时的样式与模板

     可定制项包括:
     + fieldErrorClass - class used by the field containing errors
     + formClass - class used by the form
     + inputClass - class used by the div containing all elements of the input (label, input, error and hint)
     + errorClass - class used by the error message
     + hintClass - class used by the hint message
     + labelClass - class used by the label
     + inputTemplate - template used by {{input}}
     + labelTemplate - template used by {{label-field}}
     + errorTemplate - template used by {{error-field}}
     + hintTemplate - template used by {{hint-field}}

     ####默认Wrapper配置情况
     + formClass - "" (empty)
     + fieldErrorClass - "fieldWithErrors"
     + inputClass - "input"
     + errorClass - "error"
     + hintClass - "hint"
     + labelClass - "" (empty)
     + inputTemplate - "easyForm/input"
     + labelTemplate - "easyForm/label"
     + errorTemplate - "easyForm/error"
     + hintTemplate - "easyForm/hint"

     @property Wrapper
     @memberOf Ember.EasyForm
     */




    /**
     向Ember.EasyForm Wrapper中注册一个Wraper
     ```javascript
     Ember.EasyForm.Config.registerWrapper('my-wrapper', {
      formClass: 'my-form',
      errorClass: 'my-error',
      hintClass: 'my-hint',
      labelClass: 'my-label'
    });
     ```

     ```handlebars
     {{#form-for model wrapper="my-wrapper"}}
     {{input firstName}}
     {{input lastName}}
     {{/form-for}}
     ```
     编译结果为
     ```html
     <form class="my-form">
     <div class="input string">
     <label for="ember1">First name</label>
     <input id="ember1" type="text"/>
     <span class="error"></span>
     </div>
     <div class="input string">
     <label for="ember2" class="my-label">Last name</label>
     <input id="ember2" type="text"/>
     <span class="error my-error"></span>
     </div>
     </form>
     ```

     ----------------------------------------
     Ember.EasyForm也支持向Wrapper中注册模板
     ```javascript
     Ember.EasyForm.Config.registerWrapper('twitter-bootstrap', {
          // Define the custom template
          inputTemplate: 'bootstrap-input',

          // Define a custom config used by the template
          controlsWrapperClass: 'controls',

          // Define the classes for the form, label, error...
          formClass: 'form-horizontal',
          fieldErrorClass: 'error',
          errorClass: 'help-inline',
          hintClass: 'help-block',
          labelClass: 'control-label',
          inputClass: 'control-group'
        });
     ```
     bootstrap-input模板
     ```handlebars
     {{label-field propertyBinding="view.property" textBinding="view.label"}}
     <div class="{{unbound view.wrapperConfig.controlsWrapperClass}}">
     {{partial "easyForm/inputControls"}}
     </div>
     ```



     @method registerWrapper
     @for Ember.EasyForm.Config
     */
  });
define("bricksui-form/form-setup",
  ["./controllers/checkbox_item","./controllers/radio_item","./bu-editor","./bu-datepicker","./bu-daterange","./bu-tree","./bu-select","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    var CheckboxItemController = __dependency1__["default"];
    var RadioItemController = __dependency2__["default"];
    var BuEditor = __dependency3__["default"];
    var BuDatePicker = __dependency4__["default"];
    var BuDateRange = __dependency5__["default"];
    var BuTree = __dependency6__["default"];
    var BuSelect = __dependency7__["default"];
    /**
     * 向模板中注册
     *  控制器
     *    checkboxItem
     *    radioItem
     *  组件
     *    bu-editor
     *    bu-datepicker
     *    bu-daterange
     *    bu-tree
     */
    __exports__["default"] = function initFormController(container, application) {
      container.register('controller:checkboxItem', CheckboxItemController);
      container.register('controller:radioItem', RadioItemController);
      container.register('component:bu-editor', BuEditor);
      container.register('component:bu-datepicker', BuDatePicker);
      container.register('component:bu-daterange', BuDateRange);
      container.register('component:bu-tree', BuTree);
      container.register('component:bu-select', BuSelect);
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
    var formSetup = __dependency1__["default"];

    Ember.onLoad("Ember.Application", function (Application) {

        Application.initializer({
            name: "form-controller",
            initialize: formSetup
        });

        Application.initializer({
            name: "bu-editor-url-fixed",
            initialize: function(){
                //覆盖默认URL地址的设定
                window.UMEDITOR_CONFIG.UMEDITOR_HOME_URL = "assets/assets/umeditor/";
            }
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
define("bricksui-form/swap-helpers",
  ["bricksui-metal/core"],
  function(__dependency1__) {
    "use strict";
    var BricksUI = __dependency1__["default"];

    var swapHelpers = BricksUI.swapHelpers;

    swapHelpers({
      "input": "bu-input",
      "error-field": "bu-error-field",
      "form-for": "bu-form-for",
      "hint-field": "bu-hint-field",
      "input-field": "bu-input-field",
      "label-field": "bu-label-field",
      "submit": "bu-submit"
    });
  });
define("bricksui-i18n",
  ["bricksui-metal/core","bricksui-i18n/initializer","bricksui-i18n/i18n-support","bricksui-i18n/i18n-validator","bricksui-i18n/lang/en","bricksui-i18n/lang/zh-cn","bricksui-i18n/helpers/translation"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__) {
    "use strict";
    var BricksUI = __dependency1__["default"];

    var setLang = __dependency3__.setLang;
    var getLang = __dependency3__.getLang;
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
    I18n.getLang = getLang;
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
define("bricksui-i18n/i18n-docs",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-i18n
     */

    /**

     ####Ember国际化支持
     #####[Ember.I18n更多内容查看...](https://github.com/jamesarosen/ember-i18n)
     在Ember.I18n.translations中存入你所需要的国际化信息键值对，<br/>
     对于值的类型为字符串的键值对，将会通过Ember.I18n.compile编译为模板<br/>
     __*__默认使用Handlebars.compile进行模板编译(在项目中需要引入完整的Handlebars功能,换言之，需引入__Handlebar.js__
     而不是__Handlebar.runtime.js__)

     ####Example
     给定以下的国际化信息

     ```javascript
     Em.I18n.translations = {
        "user.edit.title": "Edit User",
        "user.followers.title.one": "One Follower",
        "user.followers.title.other": "All {{count}} Followers",
        "button.add_user.title": "Add a user",
        "button.add_user.text": "Add",
        "button.add_user.disabled": "Saving..."
      };
     ```
     在模板中只需引入
     ```handlebars
     <h2>{{t "user.edit.title"}}</h2>
     ```

     编译后结果
     ```html
     <h2><span id="i18n-123">Edit User</span></h2>
     ```

     默认情况下，t助手将使用span作为标签作为渲染，如果需要进行标签进行自定义，只需特别声明标签
     ```handlebars
     {{t "user.edit.title" tagName="h2"}}
     ```
     编译后结果
     ```html
     <h2 id="i18n-123">Edit User</h2>
     ```

     #####信息重载
     默认情况下，可为t助手绑定一个count属性，cout属性将在运行时替换I18n信息
     ######EXample

     直接设置count的值
     ```handlebars
     <h2>{{t "user.followers.title" count="2"}}</h2>
     ```

     编译结果为
     ```html
     <h2><span id="i18n-123">All 2 Followers</span></h2>
     ```

     绑定Count的值
     ```handlebars
     <h2>{{t "user.followers.title" count="2"}}</h2>
     ```

     编译结果为
     ```html
     <h2><span id="i18n-123">All 2 Followers</span></h2>
     ```

     ------------------------

     任意对象信息国际化

     Ember.I18n.TranslateableProperties mixin 会转换所有以Translation开头的属性

     ```javascript
     userButton = Em.Object.extend(Em.I18n.TranslateableProperties, {
        labelTranslation: 'button.add_user.title'
      });

     userButton.get('label');  // "Add a user"
     ```

     ------------------------------

     对于html类型标签，可以使用TranslateAttr 助手进行语言字段绑定

     ```handlebars
     <a {{translateAttr title="button.add_user.title" data-disable-with="button.add_user.disabled"}}>
     {{t "button.add_user.text"}}
     </a>
     ```

     编译结果：

     ```html
     <a title="Add a user" data-disable-with="Saving...">
     Add
     </a>
     ```

     --------------------------------------
     复杂类型国际化语法
     Em.I18n.translations同样支持复杂JSON对象的定义

     ```javascript
     Em.I18n.translations = {
        'user': {
          'edit': {
            'title': 'Edit User'
          },
          'followers': {
            'title': {
              'one': 'One Follower',
              'other': 'All {{count}} Followers'
            }
          }
        },
        'button': {
          'add_user': {
            'title': 'Add a user',
            'text': 'Add',
            'disabled': 'Saving...'
          }
        }
      };
     ```

     ```handlebars
     {{t "button.edit.text"}}
     ```

     编译结果：

     ```html
     <span id="i18n-123">Edit User</span>
     ```
     @namespace Ember
     @class I18n
     */
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

    //临时保存语言对象
    var persistentLang = null;

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

    var tryRequire = function (moduleName) {
        var require = window.require,
            result
            ;

        Ember.assert("global function 'require' can not be undefined", require !== undefined);
        try {
            result = require(moduleName);
        } finally {
            return result;
        }

    };

    /**
     * 根据命名约定，从项目文件中加载语言包
     * @param parsedName
     * @returns {{localeName: ({language: *}|*|set.language|parseLanguage.language|language|string), localeLang: *}}
     */
    var requireLang = function (parsedName) {
        var localeLang, moduleMatcher;

        moduleMatcher = {
            shortMatch: [BricksUI.ENV.MODULE_PREFIX, BricksUI.ENV.LANG_FOLDER_NAME, parsedName.language].join("/"),
            longMatch: [BricksUI.ENV.MODULE_PREFIX, BricksUI.ENV.LANG_FOLDER_NAME, parsedName.fullName].join("/")
        };

        if (typeof parsedName === "string") {
            parsedName = {
                language: parsedName
            };
        }

        localeLang = tryRequire(moduleMatcher.shortMatch);

        var localeName = parsedName.language;
        if (!localeLang) {
            localeLang = tryRequire(moduleMatcher.longMatch);
            localeName = parsedName.fullName;
        }
    //    Ember.warn("Could not find module " + moduleMatcher.shortMatch + " or " + moduleMatcher.shortMatch, localeLang !== undefined);
        if (localeLang && localeLang["default"]) {
            localeLang = localeLang["default"];
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
        persistentLang = lang;
        if (BricksUI.ENV.PERSISTENT_I18N) {
            Ember.$.cookie(langKey, JSON.stringify(lang), { expires: 7 });
        }
    };

    /**
     * 将语言对象合并到BricksUI.I18n.lang Hash下，并同步到Ember.I18n.translations对象下
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
        var parsedName = getLang();
        var locale = requireLang(parsedName);

        if (!locale.localeLang && !BricksUI.I18n.lang[locale.localeName]) {
            locale = requireLang(BricksUI.ENV.DEFAULT_LANG);
        }

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
        var parsedName, locale;

        parsedName = {
            fullName: lang,
            language: lang,
            area: lang
        };

        locale = requireLang(parsedName);

        mergeLang(locale);
        saveLang(parsedName);

        var translations = Ember.I18n.translations;
        for (var prop in translations) {
            if (Ember.canInvoke(translations, prop)) {
                delete translations[prop];
            }
        }
        Ember.instrument("i18nChange", parsedName, function () {
            Ember.Logger.warn("no listener for i18nChange! nothing changed!");
        });
    };

    /**
     * 获取语言内容，如果开启了Cookie语言持久化功能，则优先从cooie内查找语言对象
     * @returns {*}
     */
    var getLang = function () {
        var parsedName;
        if (persistentLang) return persistentLang;

        if (BricksUI.ENV.PERSISTENT_I18N) {
            parsedName = loadLang();
        }
        if (!parsedName) {
            parsedName = parseLanguage();
        }
        return parsedName;
    };

    __exports__.initLang = initLang;
    __exports__.setLang = setLang;
    __exports__.getLang = getLang;
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
    var I18nableValidationMixin = Ember.Mixin.create(Ember.Validations.Mixin, {
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
  ["bricksui-metal/core","bricksui-metal/helper-support"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var BricksUI = __dependency1__["default"];
    //import EventManager from 'bricksui-metal/event_manager';
    //import StateHandler from 'bricksui-metal/state_handler';
    //import Stateable from 'bricksui-metal/stateable';
    var swapHelpers = __dependency2__["default"];
    /**
     * @module bricksui
     * @submodule bricksui-metal
     */
    //BricksUI.EventManager = EventManager;
    //BricksUI.Stateable = Stateable;
    //BricksUI.StateHandler = StateHandler;
    BricksUI.swapHelpers = swapHelpers;
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
     *  @version 0.0.1-beta.1+canary.4671db49
     */
    if ("undefined" === typeof BricksUI) {
        BricksUI = Ember.Namespace.create();
    }
    /**
     @property VERSION
     @type String
     @default '0.0.1-beta.1+canary.4671db49'
     @static
     */
    BricksUI.VERSION = '0.0.1-beta.1+canary.4671db49';
    
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
        LANG_FOLDER_NAME: "lang",
    
        /**
         * @property DEFAULT_LANG
         * @for BricksUI.ENV
         * @type String
         * @default zh-cn
         */
        DEFAULT_LANG: {
            fullName: "zh-cn",
            language: "zh",
            area: "china"
        }
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
define("bricksui-metal/helper-support",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-metal
     */
    /**
     重命名已有的helper

     ```javascript
     // Examples
     BricksUI.swapHelpers("bs-tabs","bu-tabs");
     BricksUI.swapHelper({
        "bs-tabs":"bu-tabs",
        "bs-tas-panes":"bu-tabs-panes"
     });
     ```

     @for BricksUI
     @method swapHelpers
     @param hash {Object}
     */
    __exports__["default"] = function swapHelpers(hash) {
        if (typeof hash === "string") {
            var value = arguments[1];
            Ember.assert("must provide the corresponding helper to replace the older one", value && typeof value === "string");
            var clone = {};
            clone[hash] = value;
            hash = clone;
        }
        var helpers = Ember.Handlebars.helpers;
        for (var helper in hash) {
            var tmp = helpers[helper];
            Ember.assert("helper:" + helper + " does not exist !", tmp);
    //        delete helpers[helper];
            helpers[hash[helper]] = tmp;
        }
    }
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
define("bricksui-thirdpart",
  ["bricksui-thirdpart/initializer","bricksui-thirdpart/bu-pagination","bricksui-thirdpart/mixins/pageable","bricksui-metal/core"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    /**
     基于Bootstrap的扩展组件
     @module bricksui
     @submodule bricksui-thirdpart
     */

    var BuPagination = __dependency2__.BuPagination;
    var TableHeader = __dependency2__.TableHeader;
    var StaticPageable = __dependency3__.StaticPageable;
    var DynamicPageable = __dependency3__.DynamicPageable;

    var BricksUI = __dependency4__["default"];

    BricksUI.BuPagination = BuPagination;
    BricksUI.TableHeader = TableHeader;
    BricksUI.StaticPageable = StaticPageable;
    BricksUI.DynamicPageable = DynamicPageable;
  });
define("bricksui-thirdpart/bu-alert",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     对应Bootstrap alert组件，对Bootstrap alert进行轻量级封装


     ####基本用法
     ```handlebars
     {{bu-alert message="A warning alert with simple message." type="warning"}}
     ```

     ####利用bootstrap的样式
     * type=`primary`
     * type=`success`
     * type=`info`
     * type=`warning`
     * type=`danger`

     ```javascript
     {{#bu-alert message="Primary alert" type="primary"}}
     <p>Panel content.</p>
     {{/bu-alert}}
     {{#bu-alert message="Success alert" type="success"}}
     <p>Panel content.</p>
     {{/bu-alert}}
     {{#bu-alert message="Info alert" type="info"}}
     <p>Panel content.</p>
     {{/bu-alert}}
     {{#bu-alert message="Warning alert" type="warning"}}
     <p>Panel content.</p>
     {{/bu-alert}}
     {{#bu-alert message="Danger alert" type="danger"}}
     <p>Panel content.</p>
     {{/bu-alert}}
     ```

     #### 更多可选配置
     * `message` alert内显示的信息
     * `dismiss` 设定panel是否可以被关闭,`true` `false`
     * `dismissAfter` 配置`dismissAfter` alert会在多少秒后消失 `number`
     * `fade` 配置`fade` ,则在关闭时，会显示淡出动画
     * `close` 在关闭时触发控制器对应的方法
     * `closed` 在关闭完成后触发控制器对应的方法（在淡出动画完成后）
     ```javascript
     {{#bu-alert type="danger"}}
     <h4 class="alert-heading">Oh snap! You got an error!</h4>
     <p>Alert can also be used in a <strong>block form</strong>.</p>
     <p>
     <button class="btn btn-danger" {{action "submit"}}>Take this action</button> <a class="btn btn-default">Or do this</a>
     </p>
     {{/bu-alert}}
     ```

     @namespace BricksUI
     @class BuAlert
     @extends Ember.View
     */
  });
define("bricksui-thirdpart/bu-growl-notifications",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     BuGrowlNotifications是一种标准的通知组件实现，可以实现信息提示的功能
     基本用法:在application Template中放入以下的占位符
     ```handlebars
     {{bu-growl-notifications}}
     ```
     在代码中调用Bootstrap.GNM.push()功能，传入相关的参数，即可实现消息的推送
     ```javascript
     Showcase.ShowComponentsGrowlNotifController = Ember.Controller.extend({
          pushInfo: function() {
            Bootstrap.GNM.push('INFO!', 'Hello, this is just an info message.', 'info');
          },
          pushSuccess: function() {
            Bootstrap.GNM.push('SUCCESS!', 'Successfully performed operation!', 'success');
          },
          pushWarn: function() {
            Bootstrap.GNM.push('WARN!', 'Could not perform operation!', 'warning');
          },
          pushDanger: function() {
            Bootstrap.GNM.push('Danger!', 'System is halting!', 'danger');
          }
        });
     ```

     ----------------------
     可选参数有

     ```html
     showTime {number} 秒   信息提示显示的时间
     ```

     @namespace BricksUI
     @class BuGrowlNotifications
     @extends Ember.View
     */
  });
define("bricksui-thirdpart/bu-modal",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     对应Bootstrap modal组件，对Bootstrap modal进行轻量级封装


     ####基本用法
     ```handlebars
     {{bu-button title="Show Modal" clicked="show"}}
     {{#bu-modal name="myModal" fade=true footerButtonsBinding="myModalButtons" title="My Modal"}}
     <p>Modal content!</p>
     {{/bu-modal}}
     ```

     对应控制器
     ```javascript
     Showcase.ShowComponentsModalController = Ember.Controller.extend({
          myModalButtons: [
              Ember.Object.create({title: 'Submit', clicked:"submit"})
              Ember.Object.create({title: 'Cancel', clicked:"cancel", dismiss: 'modal'})
          ],

          actions: {
            //Submit the modal
            submit: function() {
              Bootstrap.NM.push('Successfully submitted modal', 'success');
              return Bootstrap.ModalManager.hide('myModal');
            },

            //Cancel the modal, we don't need to hide the model manually because we set {..., dismiss: 'modal'} on the button meta data
            cancel: function() {
              return Bootstrap.NM.push('Modal was cancelled', 'info');
            },

            //Show the modal
            show: function() {
              return Bootstrap.ModalManager.show('myModal');
            }
          }
        });
     ```

     ------------------
     #####确认型modal
     ```handlebars
     {{bu-button title="Delete" clicked="confirm"}}
     ```
     对应控制器
     ```javascript
     Showcase.ShowComponentsModalController = Ember.Controller.extend({
        confirm: {
            confirm: {
                Bootstrap.ModalManager.confirm(@);
     },
     //invoked when user press "confirm"
     modalConfirmed: {
                Bootstrap.NM.push('Confirmed!', 'success')
            },
     //invoked when user press "cancel"
     modalCanceled: {
                Bootstrap.NM.push('Cancelled!', 'info')
            }
     }
     })
     ```

     Bootstrap.ModalManager.confirm可接受的参数有

     ```html
     controller 对应的控制器，可手动指定
     title        modal窗口标题
     message    model的内容
     confirmButtonTitle    确定按钮的文本描述
     cancelButtonTitle    取消按钮的文本描述
     ```

     ------------------------------
     #####通过编程方式调用modal

     ```handlebars
     //we only render a button which will programatically create the modal
     {{bu-button title="Create Modal" clicked="createModalProgramatically"}}
     ```

     对应控制器

     ```javascript
     Showcase.ShowComponentsModalController = Ember.Controller.extend({
          manualButtons: [
              Ember.Object.create({title: 'Submit', clicked:"submitManual"})
              Ember.Object.create({title: 'Cancel', dismiss: 'modal'})
          ],

          actions: {
            submitManual: function() {
              Bootstrap.NM.push('Modal destroyed!', 'success');
              return Bootstrap.ModalManager.close('manualModal');
            },
            createModalProgramatically: function() {
                 //@property {string} The name of the modal, required later to close the modal (see submitManual function above)
     //@property {string} The title of the modal.
     //@property {string} The template name to render within the modal body, a View class may also be specified.
     //@property {array} Array of Button meta data
     //@property {object} The controller instance that instantiate the modal.
     Bootstrap.ModalManager.open('manualModal', 'Hello', 'demo-template', this.manualButtons, this);
     }
     }
     });
     ```



     @namespace BricksUI
     @class BuModal
     @extends Ember.View
     */
  });
define("bricksui-thirdpart/bu-pagination",
  ["exports"],
  function(__exports__) {
    "use strict";
    /*globals jQuery:true;Ember:true */
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     分页组件
     分页组件负责视图的呈现,按钮的点击全部委托给`pagerController`,所以必须给分页组件
     配置`pagerController`这个属性
     ####用法
     * `numberOfPages`  显示的页码个数
     * `pagerController` 当前分页组件的控制器,必须配置,并且该控制器必须集成`BricksUI.DynamicPageable`
     ```html
     {{bu-pagination numberOfPages=5 pagerControllerBinding="controller"}}
     ```

     @type {Ember.Component}
     @namespace BricksUI
     @class BuPagination
     @extends Ember.Component
     */
    var BuPagination = Ember.Component.extend({
        init: function () {
            var pagerController = this.get("pagerController");
            Ember.assert("pagerController must be provided", pagerController);
            if (!pagerController.get('store')) {
                pagerController.set('store', this.get('store'));
            }
            this._super.apply(this, arguments);
        },
        /**
         * 默认的模板
         * @property layoutName
         * @type {[type]}
         * @default bu-pagination
         */
        layoutName: "bu-pagination",

        /**
         * 分页组件可显示的页码个数
         * @property numberOfPages
         * @type {Number}
         * @default 10
         */
        numberOfPages: 10,

        /**
         * 计算属性-->'`pagerController.totalPages` `agerController.currentPage`
         * 用于生成页码
         * ```html
         *  First Prev 8 9 10 11 12 |13| 14 15 16 17 Next Last
         *  First Prev 80 81 82 83 84 85 86 |87| 88 89 90 91 92 93 94 Next Last
         * ```
         * @property pages
         * @return {Array}
         */
        pages: function () {
            var result = [],
                totalPages = this.get('pagerController.totalPages'),
                currentPage = this.get('pagerController.currentPage'),
                length = (totalPages >= this.get('numberOfPages')) ? this.get('numberOfPages') : totalPages,
                startPos;

            // If only one page, don't show pagination
            if (totalPages === 1)
                return;

            /*
             * Figure out the starting point.
             *
             * If current page is <= 6, then start from 1, else FFIO
             */
            if (currentPage <= Math.floor(this.get('numberOfPages') / 2) + 1 || totalPages <= this.get('numberOfPages')) {
                startPos = 1;
            } else {
                // Check to see if in the last section of pages
                if (currentPage >= totalPages - (Math.ceil(this.get('numberOfPages') / 2) - 1)) {
                    // Start pages so that the total number of pages is shown and the last page number is the last page
                    startPos = totalPages - ((this.get('numberOfPages') - 1));
                } else {
                    // Start pages so that current page is in the center
                    startPos = currentPage - (Math.ceil(this.get('numberOfPages') / 2) - 1);
                }
            }

            // Go through all of the pages and make an entry into the array
            for (var i = 0; i < length; i++)
                result.push(i + startPos);

            return result;
        }.property('pagerController.totalPages', 'pagerController.currentPage'),

        /**
         * 计算属性,首页按钮是否不可用
         * @property disableFirst
         * @type {Boolean}
         */
        disableFirst: Ember.computed.alias("disablePrev"),
        /**
         * 计算属性,前一页按钮是否不可用
         * @property disablePrev
         * @return {Boolean}
         */
        disablePrev: function () {
            return this.get('pagerController.currentPage') === 1;
        }.property('pagerController.currentPage'),

        /**
         * 计算属性,后一页按钮是否不可用
         * @property disableNext
         * @return {Boolean}
         */
        disableNext: function () {
            return this.get('pagerController.currentPage') === this.get('pagerController.totalPages');
        }.property('pagerController.currentPage', 'pagerController.totalPages'),
        /**
         * 计算属性,尾页按钮是否不可用
         * @property disableLast
         * @return {Boolean}
         */
        disableLast: Ember.computed.alias("disableNext"),
        actions: {
            /**
             * 第一页
             * @method firstPage
             */
            firstPage: function () {
                if (!this.get('disableFirst')) {
                    this.get('pagerController').send('firstPage');
                }
            },
            /**
             * 前一页
             * @method prevPage
             */
            prevPage: function () {
                if (!this.get('disablePrev')) {
                    this.get('pagerController').send('prevPage');
                }
            },

            /**
             * 后一页
             * @method nextPage
             */
            nextPage: function () {
                if (!this.get('disableLast')) {
                    this.get('pagerController').send('nextPage');
                }
            },
            /**
             * 尾页
             * @method lastPage
             */
            lastPage: function () {
                if (!this.get('disableLast')) {
                    this.get('pagerController').send('lastPage');
                }
            }
        },

        /**
         * 按钮视图
         * @property PageButton
         * @type {Ember.View}
         */
        PageButton: Ember.View.extend({
            // Bootstrap page buttons are li elements
            tagName: 'li',

            // Bind to is current to show the button as active
            classNameBindings: ['isCurrent'],

            actions: {
                /**
                 * @private
                 */
                goToPage: function () {
                    // Change the page
                    this.set('parentView.pagerController.currentPage', this.get('content'));
                    var pagerController = this.get('parentView.pagerController');
                    constrain(pagerController.doLoad(((this.get('content') - 1) * pagerController.get('perPage')), 0, pagerController.get('totalCount')));
                }
            },

            /**
             * Computed property to see if the button is active
             * @return {Boolean}
             */
            isCurrent: function () {
                return this.get('content') === this.get('parentView.pagerController.currentPage') ? 'active' : '';
            }.property('parentView.pagerController.currentPage')
        })
    });
    var constrain = function (self, min, max) {
        Math.min(Math.max(self, min), max);
    };
    /**
     表格行头
     @type {Ember.View}
     @namespace BricksUI
     @class TableHeader
     @extends Ember.View
     */
    var TableHeader = Ember.View.extend({
        /**
         * @private
         */
        defaultTemplate: Ember.Handlebars.compile('{{view.text}}'),

        /**
         * It's a header, so render it as a th
         * @type {String}
         */
        tagName: 'th',

        /**
         * Mark the view as clickable
         * @type {Array}
         */
        classNames: ['clickable'],

        /**
         * Define the bound classes.  Used to say if the header is the active sort
         * and what direction the sort is.
         * @type {Array}
         */
        classNameBindings: ['isCurrent:active', 'isAscending:ascending', 'isDescending:descending'],

        /**
         * 该行头所代表的属性名称
         * @property propertyName
         */
        propertyName: '',

        /**
         * Text to be rendered to the view
         * @type {String}
         */
        text: '',

        /**
         * 点击事件,用于调用controller进行排序
         * @method click
         */
        click: function (event) {
            this.get('controller').sortByProperty(this.get('propertyName'));
        },

        /**
         * Computed property for checking to see if the header is the current sort
         * or not.
         *
         * @return {Boolean}
         */
        isCurrent: function () {
            return this.get('controller.sortBy') === this.get('propertyName');
        }.property('controller.sortBy'),

        /**
         * 升序
         * @property isAscending
         */
        isAscending: function () {
            return this.get('isCurrent') && this.get('controller.sortDirection') === 'ascending';
        }.property('controller.sortDirection', 'isCurrent'),

        /**
         * 降序
         * @property isAscending
         */
        isDescending: function () {
            return this.get('isCurrent') && this.get('controller.sortDirection') === 'descending';
        }.property('controller.sortDirection', 'isCurrent')
    });

    __exports__.BuPagination = BuPagination;
    __exports__.TableHeader = TableHeader;
  });
define("bricksui-thirdpart/bu-panel",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     容器组件,可以配置头部和脚注
     * `heading` 头部说明信息
     * `footer` 脚注说明信息

     ####基本用法
     ```javascript
     {{#bs-panel heading="Simple Panel" footer="Panel Footer"}}
     <p>Panel content goes here...!</p>
     {{/bs-panel}}
     ```

     ####利用bootstrap的样式
     * type=`primary`
     * type=`success`
     * type=`info`
     * type=`warning`
     * type=`danger`

     ```javascript
     {{#bs-panel heading="Primary Panel" type="primary"}}
     <p>Panel content.</p>
     {{/bs-panel}}
     {{#bs-panel heading="Success Panel" type="success"}}
     <p>Panel content.</p>
     {{/bs-panel}}
     {{#bs-panel heading="Info Panel" type="info"}}
     <p>Panel content.</p>
     {{/bs-panel}}
     {{#bs-panel heading="Warning Panel" type="warning"}}
     <p>Panel content.</p>
     {{/bs-panel}}
     {{#bs-panel heading="Danger Panel" type="danger"}}
     <p>Panel content.</p>
     {{/bs-panel}}
     ```

     #### 更多可选配置

     * `dismiss` 设定panel是否可以被关闭,`true` `false`
     * `onClose` 配置`onClose` 会触发响应controller的action
     * `clicked` panel被点击后的action
     * `collapsible` 设置为`true`,panel可以收起和展开
     * `open` 设置为`false`,panel默认为收起状态
     ```javascript
     {{#bs-panel
         heading="Primary Panel"
         type="primary"
         collapsible=true
         open=false
         dismiss=true
         onClose="panelClosed"
         clicked="panelClicked"}}
     <p>Panel content.</p>
     {{/bs-panel}}
     ```

     @namespace BricksUI
     @class BuPanel
     @extends Ember.View
     */
  });
define("bricksui-thirdpart/bu-progress",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     对应Bootstrap progress组件，对Bootstrap progress组件进行轻量级封装


     ####基本用法
     ```handlebars
     {{bu-progress progress=60}}
     ```

     ------------------
     ###type
     ```handlebars
     {{!--可根据type的类型，指定progress的呈现行为--}}
     {{bu-progress progress=40 type="success"}}
     {{bu-progress progress=20 type="info"}}
     {{bu-progress progress=60 type="warning"}}
     {{bu-progress progress=80 type="danger"}}
     ```

     ------------------------------

     ###binding

     ```handlebars
     {{bu-progress progressBinding="prog"}}
     {{bu-button clicked="increment" content="Increment!"}}
     ```

     也可以以对progress进行值的绑定
     ```javascript
     Showcase.ShowComponentsProgressbarController = Ember.Controller.extend({
          prog: 0,
          incrementBy: 20,
          increment: function() {
            if (this.prog < 100) {
              return this.incrementProperty("prog", this.incrementBy);
            } else {
              return this.set("prog", this.incrementBy);
            }
          }
        });
     ```
     ---------------------------

     progressbar 堆叠

     ```handlebars
     {{#bu-progress}}
     {{bu-progressbar type="success" progress="35"}}
     {{bu-progressbar type="warning" progress="20"}}
     {{bu-progressbar type="danger" progress="10"}}
     {{/bu-progress}}
     ```


     ------------------------------------

     ```html
     可选的参数有
     + stripped 添加斜线样式 {boolean}
     + animated 是否添加CSS3样式 {boolean}
     ```

     @namespace BricksUI
     @class BuProgress
     @extends Ember.View
     */
  });
define("bricksui-thirdpart/bu-table",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**

     ####基本用法
     ```handlebars
     * hasFooter table是否需要页脚 ,true  false
     * `columns`  table中所显示的列的数组
     * `content` table中的内容
     {{bu-table  hasFooter=false  columnsBinding="columns"  contentBinding="content"}}
     ```

     对应控制器
     ```javascript
     App.ApplicationController = Ember.Controller.extend({
            numRows: 100,
            columns: Ember.computed(function() {
                var closeColumn, dateColumn, highColumn, lowColumn, openColumn;
                dateColumn = Ember.Table.ColumnDefinition.create({
                    columnWidth: 150,
                    textAlign: 'text-align-left',
                    headerCellName: 'Date',
                    getCellContent: function(row) {
                        return row.get('date').toDateString();
                    }
                });
                ...
                return [dateColumn, ...];
            }),
            content: Ember.computed(function() {
                var _i, _ref, _results;
                return (function() {
                    _results = [];
                    for (var _i = 0, _ref = this.get('numRows'); 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
                    return _results;
                }).apply(this).map(function(index) {
                        var date;
                        date = new Date();
                        date.setDate(date.getDate() + index);
                        return {
                            date: date,
                            ...
                        };
                    });
            }).property('numRows')
        });

     ```
     #### 更多可选配置
     ```
     * hasHeader  table的是否需要表头,true  false
     * numFixedColumns  table左边固定的列 number
     * numFooterRow  table页脚的行数  number
     * rowHeight  行高  number
     * numRows  table的行数  number
     * footerHeight   table页脚的高度 number
     * minHeaderHeight   最小表头高度 number
     * enableColumnReorder   配置列是否可以重排列，true false
     * enableContentSelection   配置内容是否可选，true false
     * selection   配置选择的对象
     * tableRowViewClass   配置table中用于渲染行的视图类
     * bodyContent    配置table body中的内容
     * footerContent   配置table页脚的内容
     * fixedColumns   配置table固定的列数
     ```

     ####ColumnDefinition

     ```javascript
     * columnWidth 列的宽度,number
     * textAlign  列中内容的对齐方式，text-align-(left | center | right)
     * headerCellName 该列的表头显示信息
     * getCellContent  获取该列单元格中的内容

      dateColumn = Ember.Table.ColumnDefinition.create({
        columnWidth: 150,
        textAlign: 'text-align-left',
        headerCellName: 'Date',
        getCellContent: function(row) {
            return row.get('date').toDateString();
        }
    });
     ```
     #### ColumnDefinition中更多可选配置
     ```
     * minWidth  最小列宽
     * maxWidth  最大列宽
     * defaultColumnWidth  默认设为150
     * contentPath   单元格中内容的连接路径
     * headerCellViewClass   表头视图类
     * tableCellViewClass   单元格视图类
     * isResizable  配置该列是否可调整大小，true false
     * isSortable   配置该列是否可排序，true false
     * canAutoResize   配置该列是否可以自动的调整大小，true false
     * resize   调整列宽
     * setCellContent  设置该列单元格的内容
     ```
     #### Ember.Table.Row的配置

     ```javascript
     * content 配置行的内容
     * isHovered  配置该行是否处于活跃状态
     * isShowing 配置是否显示该行
     * isSelected  配置该行是否被选中
     App.FinancialTableTreeTableRow = Ember.Table.Row.extend({
        content: null,
        isHovered: true,
        isShowing: true,
        isSelected:true
        ...
        }）
     ```

     #####tree类型的table的配置
     ```handlebars
     application.hbs:
     {{table-component  hasHeader=true  hasFooter=false  numFixedColumns=0  rowHeight=35  columnsBinding="columns"  contentBinding="content"}}
     financial_table_cell.hbs:
         <div class="ember-table-cell-container">
         <span class="ember-table-content">
         {{view.cellContent}}
         </span>
         </div>
     financial_table_tree_cell.hbs:
         <div class="ember-table-cell-container" {{bind-attr style="view.paddingStyle"}}>
         <span {{bind-attr class=":ember-table-toggle-span view.row.isLeaf::ember-table-toggle
            view.row.isCollapsed:ember-table-expand:ember-table-collapse"}}
         {{action toggleCollapse view.row}}>
         <i class="icon-caret-down ember-table-toggle-icon"></i>
         </span>
         <span class="ember-table-content">
         {{view.cellContent}}
         </span>
         </div>
     financial_table_header_cell.hbs：
         <div class="ember-table-cell-container">
         <div class="ember-table-header-content-container">
         <span class="ember-table-content">
         {{view.content.headerCellName}}
         </span>
         </div>
         </div>
     financial_table_header_tree_cell.hbs：
         <div class="ember-table-cell-container">
         <span {{bind-attr class=":ember-table-toggle-span :ember-table-toggle
              isCollapsed:ember-table-expand:ember-table-collapse"}}
         {{action toggleTableCollapse}}>
         <i class="icon-caret-down ember-table-toggle-icon"></i>
         </span>
         <div class="ember-table-header-content-container">
         <span class="ember-table-content">
         {{view.column.headerCellName}}
         </span>
         </div>
         </div>
     ```
     #####对应view
     ```javascript
     App.FinancialTableCell = Ember.Table.TableCell.extend({
        templateName: 'ember_table/financial_table/financial_table_cell'
      });

     App.FinancialTableHeaderCell = Ember.Table.HeaderCell.extend({
        templateName: 'ember_table/financial_table/financial_table_header_cell'
      });

     App.FinancialTableTreeCell = Ember.Table.TableCell.extend({
        templateName: 'ember_table/financial_table/financial_table_tree_cell',
        classNames: 'ember-table-table-tree-cell',
        paddingStyle: Ember.computed(function() {
          return "padding-left:" + (this.get('row.indentation')) + "px;";
        }).property('row.indentation')
      });

     App.FinancialTableHeaderTreeCell = Ember.Table.HeaderCell.extend({
        templateName: 'ember_table/financial_table/financial_table_header_tree_cell',
        classNames: 'ember-table-table-header-tree-cell'
      });
     ```
     #####对应控制代码
     ```javascript
     * children 配置子节点
     * parent   配置父节点
     * isRoot   配置是否是根节点
     * isLeaf   配置是否是叶子节点
     * isCollapsed   配置该行是否处于收缩状态
     * indentationSpacing   配置该行缩进的空格数
     * computeStyles    计算整体的样式
     * computeRowStyle    计算每一行的样式
     * recursiveCollapse  递归每行的缩进
     * getFormattingLevel   格式化层级
     App.FinancialTableTreeTableRow = Ember.Table.Row.extend({
        content:  null,
        isShowing: true,
        children: null,
        parent: null,
        isRoot: false,
        isLeaf: false,
        isCollapsed: false,
        indentationSpacing: 20,
        groupName: null,
        computeStyles: function(parent) {
          var groupingLevel, indentType, indentation, isShowing, pGroupingLevel, spacing;
          groupingLevel = 0;
          indentation = 0;
          isShowing = true;
          if (parent) {
            isShowing = parent.get('isShowing') && !parent.get('isCollapsed');
            pGroupingLevel = parent.get('groupingLevel');
            groupingLevel = pGroupingLevel;
            if (parent.get('groupName') !== this.get('groupName')) {
              groupingLevel += 1;
            }
            indentType = groupingLevel === pGroupingLevel ? 'half' : 'full';
            spacing = this.get('indentationSpacing');
            if (!parent.get('isRoot')) {
              indentation = parent.get('indentation');
              indentation += (indentType === 'half' ? spacing / 2 : spacing);
            }
          }
          this.set('groupingLevel', groupingLevel);
          this.set('indentation', indentation);
          return this.set('isShowing', isShowing);
        },
        computeRowStyle: function(maxLevels) {
          var level;
          level = this.getFormattingLevel(this.get('groupingLevel'), maxLevels);
          return this.set('rowStyle', "ember-table-row-style-" + level);
        },
        recursiveCollapse: function(isCollapsed) {
          this.set('isCollapsed', isCollapsed);
          return this.get('children').forEach(function(child) {
            return child.recursiveCollapse(isCollapsed);
          });
        }，
        getFormattingLevel:function(level, maxLevels) {
        switch (maxLevels)
            case 1:{
                return 5;
            }
            case 2:{
                if(level == 1){
                    return 2;
                }else {
                    return 5;
                }
            }
          ...

        }
      });
     ```
     #####tree类型的table定义组件时的更多配置
     ```javascript
     * isCollapsed 配置是否缩进
     * isHeaderHeightResizable  表头的高度是否可以重新调整
     * sortAscending 配置table的内容是否升序排列
     * groupingColumn 列的分组
     * orderBy 排序
     * createTree  创建树
     * flattenTree  配置树的展开
     App.FinancialTableComponent = Ember.Table.EmberTableComponent.extend({
        numFixedColumns: 1,
        rowHeight: 30,
        hasHeader: true,
        hasFooter: true,
        headerHeight: 70,
        sortColumn: null
        selection: null
        isCollapsed: false,
        isHeaderHeightResizable: true,
        sortAscending: false,
        actions: {
          toggleTableCollapse: function(event) {
            var children, isCollapsed;
            this.toggleProperty('isCollapsed');
            isCollapsed = this.get('isCollapsed');
            children = this.get('root.children');
            if (!(children && children.get('length') > 0)) {
              return;
            }
            children.forEach(function(child) {
              return child.recursiveCollapse(isCollapsed);
            });
            return this.notifyPropertyChange('rows');
          },
          toggleCollapse: function(row) {
            row.toggleProperty('isCollapsed');
            return Ember.run.next(this, function() {
              return this.notifyPropertyChange('rows');
            });
          }
        },
        data: null,
        columns: Ember.computed(function() {
          var columns, data, names;
          data = this.get('data');
          if (!data) {
            return;
          }
          names = this.get('data.value_factors').getEach('display_name');
          columns = names.map(function(name, index) {
            return Ember.Table.ColumnDefinition.create({
              index: index,
              headerCellName: name,
              headerCellViewClass: 'App.FinancialTableHeaderCell',
              tableCellViewClass: 'App.FinancialTableCell',
              getCellContent: function(row) {
               ...
              }
            });
          });
          columns.unshiftObject(this.get('groupingColumn'));
          return columns;
        }).property('data.valueFactors.@each', 'groupingColumn'),
     groupingColumn: Ember.computed(function() {
          var groupingFactors, name;
          groupingFactors = this.get('data.grouping_factors');
          name = groupingFactors.getEach('display_name').join(' ▸ ');
          return Ember.Table.ColumnDefinition.create({
            headerCellName: name,
            columnWidth: 400,
            isTreeColumn: true,
            isSortable: false,
            textAlign: 'text-align-left',
            headerCellViewClass: 'App.FinancialTableHeaderTreeCell',
            tableCellViewClass: 'App.FinancialTableTreeCell',
            contentPath: 'group_value'
          });
        }).property('data.grouping_factors.@each'),
     root: Ember.computed(function() {
          var data;
          data = this.get('data');
          if (!data) {
            return;
          }
          return this.createTree(null, data.root);
        }).property('data', 'sortAscending', 'sortColumn'),
     rows: Ember.computed(function() {
          var maxGroupingLevel, root, rows;
          root = this.get('root');
          if (!root) {
            return Ember.A();
          }
          rows = this.flattenTree(null, root, Ember.A());
          this.computeStyles(null, root);
          maxGroupingLevel = Math.max.apply(rows.getEach('groupingLevel'));
          rows.forEach(function(row) {
            return row.computeRowStyle(maxGroupingLevel);
          });
          return rows;
        }).property('root'),
     bodyContent: Ember.computed(function() {
          var rows;
          rows = this.get('rows');
          if (!rows) {
            return Ember.A();
          }
          rows = rows.slice(1, rows.get('length'));
          return rows.filterProperty('isShowing');
        }).property('rows'),
     footerContent: Ember.computed(function() {
          var rows;
          rows = this.get('rows');
          if (!rows) {
            return Ember.A();
          }
          return rows.slice(0, 1);
        }).property('rows'),
     orderBy: function(item1, item2) {
          var result, sortAscending, sortColumn, value1, value2;
          sortColumn = this.get('sortColumn');
          sortAscending = this.get('sortAscending');
          if (!sortColumn) {
            return 1;
          }
          value1 = sortColumn.getCellContent(item1.get('content'));
          value2 = sortColumn.getCellContent(item2.get('content'));
          result = Ember.compare(value1, value2);
          if (sortAscending) {
            return result;
          } else {
            return -result;
          }
        },
     createTree: function(parent, node) {
          var children, row,
            _this = this;
          row = App.FinancialTableTreeTableRow.create();
          children = (node.children || []).map(function(child) {
            return _this.createTree(row, child);
          });
          row.setProperties({
            isRoot: !parent,
            isLeaf: Ember.isEmpty(children),
            content: node,
            parent: parent,
            children: children,
            groupName: node.group_name,
            isCollapsed: false
          });
          return row;
        },
     flattenTree: function(parent, node, rows) {
          var _this = this;
          rows.pushObject(node);
          (node.children || []).forEach(function(child) {
            return _this.flattenTree(node, child, rows);
          });
          return rows;
        },
     computeStyles: function(parent, node) {
          var _this = this;
          node.computeStyles(parent);
          return node.get('children').forEach(function(child) {
            return _this.computeStyles(node, child);
          });
        }
     });

     ```


     @namespace BricksUI
     @class BuTable
     @extends Ember.Component
     */
  });
define("bricksui-thirdpart/bu-tabs",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     ####`tabs` 组件基本用法
     一个`tab-pane`代表一个tab页签
     `bu-tabs-panes` 需要有一个`contentBinding` 属性,用来生成所有的tab标签页,
     `bu-tabs-panes`与`bu-tabs`是配套使用的,`bu-tabs`生成tab组件页签头,`bu-tabs-panes`生成内容,
     所以两者需要有一个关联,这就是`items-id`.

     ``` html
     <div class="bs-example">
     {{bu-tabs id="tabs1" contentBinding="tabsMeta" default="Foo"}}
     {{bu-tabs-panes items-id="tabs1" contentBinding="tabsMeta"}}
     </div>
     ```

     * `bu-tas`需要配置一个`id`属性
     * `bu-tabs-panes`根据content生成各个内容标签
     * `items-id` 必须要跟`bu-tabs`的id挂钩
     * `default`可以设置tab组件的默认标签页
     * `justified` 设定`tab`组件是否宽度自适应

     配置项如下:

     ``` javascript
     SomeController = Ember.Controller.extend({
        tabsMeta: Ember.A([
                Ember.Object.create({ title: 'Foo', template: 'tabs/foo-tabpane', controller: 'ShowcaseComponentsTabsFoo'}),
                Ember.Object.create({ title: 'Bar', template: 'tabs/bar-tabpane'})
        ]);
    });

     `template` 指定tab内容页的模板
     `controller` 可以指定tabs标签页的控制器
     ```

     ####`tabs` 组件与路由相结合
     定义路由:
     ```javascript
     this.resource('user', function() {
          this.route('general');
          this.route('privacy');
          return this.route('activities');
        });
     ```
     在对应的user的template里面
     ```html
     {{bs-tabs contentBinding="tabsMeta"}}
     {{outlet}}
     ```
     控制器
     ```javascript
     App.UserController = Ember.Controller.extend({
      tabsMeta: [
        Ember.Object.create({title: 'General', linkTo: 'user.general'}),
        Ember.Object.create({title: 'Privacy', linkTo: 'user.privacy'}),
        Ember.Object.create({title: 'Activities', linkTo: 'user.activities'})
      ]
    });
     ```
     然后定义各个tab页签对应的模板

     @namespace BricksUI
     @class BuTabs
     @extends Ember.View
     */
  });
define("bricksui-thirdpart/bu-wizard",
  [],
  function() {
    "use strict";
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     Bootstrap 向导组件，对向导功能提供封装


     ####基本用法
     ```handlebars
     {{bu-wizard contentBinding="steps"}}
     ```
     对应控制器
     ```javascript
     Showcase.ShowComponentsWizardController = Ember.Controller.extend({
          init: function() {
            this._super();
            this.set('steps', Ember.A([
              Ember.Object.create({title: 'Foo', template: 'tabu/foo-tabpane'}),
              Ember.Object.create({title: 'Bar', template: 'tabu/bar-tabpane'}),
              Ember.Object.create({title: 'Baz', template: 'tabu/baz-tabpane'})
            ]));
          }
        });
     ```

     ------------------
     ###禁用Step选择功能
     有些时候，需要特定步骤的Wizard，则可以指定 disabled=true ，禁止Step选择，只允许通过代码改变Step
     ```handlebars
     {{bu-wizard prevAllowed=false contentBinding="stepsNoPrev"}}
     ```

     ```javascript
     Showcase.ShowComponentsWizardController = Ember.Controller.extend({
          init: function() {
            this._super();
            this.set('steps', Ember.A([
              Ember.Object.create({title: 'Step1', template: 'tabu/foo-tabpane', disabled="true"}),
              Ember.Object.create({title: 'Step2', template: 'tabu/bar-tabpane', disabled="true"}),
              Ember.Object.create({title: 'Step3', template: 'tabu/baz-tabpane', disabled="true"})
            ]));
          }
        });
     ```

     ------------------------------
     #####通过编程方式，创建Wizard视图
     ```handlebars
     {{bu-button title="Start Wizard" type="primary" clicked="createWizard"}}
     ```

     ```javascript
     Showcase.ShowComponentsWizardController = Ember.Controller.extend({
          actions: {
            createWizard: function() {
              var body;
              body = Bootstrap.buWizardComponent.extend({
                content: [
                  Ember.Object.create({title: 'Step1', template: 'wizard/step1', disabled: true}),
                  Ember.Object.create({title: 'Step2', template: 'wizard/step2', disabled: true}),
                  Ember.Object.create({title: 'Step3', template: 'wizard/step3', disabled: true})
                ],
                targetObject: this,
                onNext: "onNext",
                onPrev: "onPrev",
                onFinish: 'onFinish'
              });
              Bootstrap.ModalManager.open('manualModal', 'Wizard Title...', body, null, this);
            },
            onNext: function() {
              return console.log('NEXT');
            },
            onPrev: function() {
              return console.log('PREV');
            },
            onFinish: function() {
              Bootstrap.ModalManager.close('manualModal');
              return Bootstrap.NM.push('Wizard completed!');
            }
          }
        });
     ```


     @namespace BricksUI
     @class BuWizard
     @extends Ember.View
     */
  });
define("bricksui-thirdpart/initializer",
  ["bricksui-metal/core","./bu-pagination"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var BricksUI = __dependency1__["default"];
    var BuPagination = __dependency2__.BuPagination;

    var swapHelpers = BricksUI.swapHelpers;
    swapHelpers({
        "bs-alert": "bu-alert",
        "bs-bind-popover": "bu-bind-popover",
        "bs-bind-tooltip": "bu-bind-tooltip",
        "bs-btn-group": "bu-btn-group",
        "bs-btn-toolbar": "bu-btn-toolbar",
        "bs-button": "bu-button",
        "bs-growl-notifications": "bu-growl-notifications",
        "bs-list-group": "bu-list-group",
        "bs-notifications": "bu-notifications",
        "bs-panel": "bu-panel",
        "bs-pills": "bu-pills",
        "bs-popover": "bu-popover",
        "bs-progress": "bu-progress",
        "bs-progressbar": "bu-progressbar",
        "bs-tabs": "bu-tabs",
        "bs-tabs-panes": "bu-tabs-panes",
        "bs-tooltip": "bu-tooltip",
        "bs-wizard": "bu-wizard",
        "table-component": "bu-table"

    });

    Ember.onLoad("Ember.Application", function (Application) {

        Application.initializer({
            name: 'pagination-pager',

            initialize: function (container, application) {
                container.register('component:bu-pagination', BuPagination);
                application.inject('component:bu-pagination', "store", "store:main");
            }
        });
    });
  });
define("bricksui-thirdpart/mixins/pageable",
  ["exports"],
  function(__exports__) {
    "use strict";
    /*globals jQuery:true;Ember:true */
    /**
     @module bricksui
     @submodule bricksui-thirdpart
     */
    /**
     * Normalizes values to be used in a sort for natural sort
     * @private
     * @param  {Mixed} a
     * @param  {Mixed} b
     * @return {Array}
     */
    var normalizeSortValues = function (a, b) {
        // Set unsupported types.  May need to be made into a whitelist instead
        var failTypes = ['function', 'object', 'array', 'date', 'regexp'];

        // Check if `b` can be normalized
        if (jQuery.inArray(jQuery.type(a), failTypes) !== -1) {
            throw new Error('Cannot normalize input `a`! ' + jQuery.type(a) + ' was passed!');
        }

        // Check if `b` can be normalized
        if (jQuery.inArray(jQuery.type(b), failTypes) !== -1) {
            throw new Error('Cannot normalize input `b`! ' + jQuery.type(b) + ' was passed!');
        }

        // Function that does the normalizing
        var norm = function (input) {
            // Some setup
            var ret,
                tests = {
                    // Regex to detect if is number
                    number: /^([0-9]+?)$/
                };

            // Figure out what the value is return the normalized version
            switch (jQuery.type(input)) {
                case 'string':
                    if (tests.number.test(jQuery.trim(input))) {
                        return parseInt(input, 10);
                    }
                    return jQuery.trim(input).toLowerCase();
                case 'null':
                    return '';
                case 'boolean':
                    return input ? '0' : '1';
                default:
                    return input;
            }
        };

        // Normalize variables
        a = norm(a);
        b = norm(b);

        // If types differ, set them both to strings
        if ((typeof a === 'string' && typeof b === 'number') || (typeof b === 'string' && typeof a === 'number')) {
            a = String(a);
            b = String(b);
        }

        // Return normalized values
        return [a, b];
    };


    /**
     静态数据处理扩展,用于分页处理
     @type {Ember.Mixin}
     @namespace BricksUI
     @class StaticPageable
     */
    var StaticPageable = Ember.Mixin.create({
        /**
         * 当前页码
         * @property currentPage
         * @type {Number}
         */
        currentPage: 1,

        /**
         * 每页显示条数
         * @property perPage
         * @type {Number}
         */
        perPage: 100,

        /**
         * 排序字段
         * @property sortBy
         * @type {String}
         */
        sortBy: null,

        /**
         * 排序方向
         * @property sortDirection
         * @type {String}
         */
        sortDirection: 'ascending',


        /**
         * 静态数据本地数据存放的集合
         * @property data
         * @type {Array}
         */
        data: [],

        /**
         * Used for the collection view for which items to show
         *
         * @return {Array}
         */
        content: function () {
            // Get the starting and ending point of the array to slice
            var start = (this.get('currentPage') - 1) * this.get('perPage'),
                end = start + this.get('perPage');

            return this.get('data').slice(start, end);
        }.property('currentPage', 'perPage', 'data.@each'),

        /**
         * 总页数
         * @property totalPages
         * @return int Total Number of Pages
         */
        totalPages: function () {
            return Math.ceil(this.get('data.length') / this.get('perPage'));
        }.property('data.@each', 'perPage'),

        actions: {
            /**
             * 后一页
             * @method nextPage
             */
            nextPage: function () {
                // Make sure you can go forward first
                if (this.get('currentPage') === this.get('totalPages'))
                    return null; // NOOP

                // Set the current page to the next page
                this.set('currentPage', this.get('currentPage') + 1);
            },

            /**
             * 前一页
             * @method prevPage
             */
            prevPage: function () {
                // Make sure you can go backwards first
                if (this.get('currentPage') === 1)
                    return null; // NOOP

                // Set the current page to the previous page
                this.set('currentPage', this.get('currentPage') - 1);
            },
            /**
             * 第一页
             * @method firstPage
             */
            firstPage: function () {
                this.set('currentPage', 1);
            },
            /**
             * 尾页
             * @method lastPage
             */
            lastPage: function () {
                this.set('currentPage', this.get('totalPages'));
            }
        },

        /**
         * Sorts the data by a property
         * @param  {String} property
         * @param  {String} direction
         * @return {Void}
         */
        sortByProperty: function (property, direction) {
            var data = this.get('data').slice();

            // Set up sort direction
            if (direction === undefined) {
                if (this.get('sortBy') === property && this.get('sortDirection') === 'ascending')
                    direction = 'descending';
                else
                    direction = 'ascending';
            }

            // Custom sort to sort alphanumerically
            data.sort(function (a, b) {
                // Normalize values to make sort natural
                var normalizedValues = normalizeSortValues(a.get(property), b.get(property)),
                    va = normalizedValues[0],
                    vb = normalizedValues[1];

                // Do the sorting
                if (va === vb)
                    return 0;
                else {
                    // Reverse if necessary
                    if (direction === 'ascending')
                        return va > vb ? 1 : -1;
                    else
                        return va < vb ? 1 : -1;
                }
            });

            // Now that sort is complete, set the controller
            this.set('sortBy', property);

            // Assign sort direction
            this.set('sortDirection', direction);

            // Assign the data
            this.set('data', data);

            // Reset the current page to 1
            this.set('currentPage', 1);
        }
    });
    /**
     基于Ember-Data的数据处理扩展,用于分页处理
     分页扩展,用于增强控制器的功能,使控制器具备分页管理功能
     * `modelName`  必须配置,当前分页组件所要请求的模型名称
     * `query` 要传入到后台的查询参数,是一个计算属性,需要返回`Object`
     返回的数据必须要有`total`属性
     ```javascript
     {
         "meta":{
             "total":100
         }
     }
     ```
     ```javascript
     App.ApplicationController = Ember.ArrayController.extend(BricksUI.DynamicPageable,{
        perPage: 5,
        modelName:"user",
        firstName:"xx",
        selectedPageSize:5,
        pageSizes: [
           5,10,15,20
        ],
        query:function(){
            return {
                firstName:this.get('firstName'),
                limit:this.get('selectedPageSize')
            }
        }.property("firstName","city").volatile()
    });
     ```
     `BricksUI.DynamicPageable` 用于扩展控制器的分页功能
     `BricksUI.BuPagination` 用于分页组件视图的呈现,并且将`action`委托给控制器

     @namespace BricksUI
     @type {Ember.Mixin}
     @class DynamicPageable
     */
    var DynamicPageable = Ember.Mixin.create({
        /**
         * 当前页码
         * @property currentPage
         * @type {Number}
         */
        currentPage: 1,

        /**
         * 每页显示多少条
         * @property perPage
         * @type {Number}
         */
        perPage: 10,

        /**
         * 排序字段
         * @property sortBy
         * @type {String}
         */
        sortBy: null,

        /**
         * 排序方向,升序或者降序
         * @property sortDirection
         * @type {String}
         * @default ascending
         */
        sortDirection: 'ascending',

        init: function () {
            Ember.assert("the modelName must provided !", this.get('modelName'));
            this.paramNames = Ember.$.extend(this.paramNames || {}, this.defaultParamNames);
            this._super.apply(this, arguments);
            this.send("firstPage");
        },
        /**
         * @private
         * @returns {null}
         */
        getParams: function () {
            return this.paramNames;
        },
        /**
         *  查询参数,可覆盖`defaultParamNames`
         *  @property paramNames
         *  @type {Object}
         *  @default null
         */
        paramNames: null,

        /**
         *  默认的查询参数
         *  @property defaultParamNames
         *  @type {Object}
         *  @default {
         *      start: 'start',
         *      limit: 'limit',
         *      sort: 'sort',
         *      dir: 'dir'
         *  }
         */
        defaultParamNames: {
            start: 'start',
            limit: 'limit',
            sort: 'sort',
            dir: 'dir'
        },
        /**
         * 数据加载中
         * @property loading
         * @type {Boolean}
         * @default false
         */
        loading: false,
        /**
         * 用户的自定以查询参数
         * @property query
         * @type {Object}
         * @default null
         */
        query: null,
        /**
         * @private
         */
        cursor: 0,
        /**
         * @private
         */
        doLoad: function (start) {
            if (!this.get('store')) {
                return [];
            }
            var o = {}, pn = this.getParams(), that = this;
            o[pn.start] = start;
            o[pn.limit] = this.get('perPage');
            o[pn.sort] = this.get("sortBy");
            o[pn.dir] = this.get("sortDirection");

            Ember.$.extend(o, this.get('query'));

            if (this.get('loading')) {
                return false;
            }

            var loadingPromise = this.store.find(this.get('modelName'), o).then(function (models) {
                var perPage = o.limit,
                    len = models.get('length');

                Ember.assert("server return models length is " + models.get('length') + " but the config perPage is " + perPage, len === perPage);
                Ember.assert("the response data has no meta with the total property ", that.store.metadataFor(that.get('modelName')).total);

                that.beginPropertyChanges();
                that.set("content", models);
                that.set("cursor", start);
                that.set("loading", false);
                that.endPropertyChanges();
                that.notifyPropertyChange("totalCount");
            });
            this.set("loading", true);
            return loadingPromise;
        },


        /**
         * 总页数
         * @property totalPages
         */
        totalPages: function () {
            return Math.ceil(this.get('totalCount') / this.get('perPage'));
        }.property('perPage', 'totalCount'),

        actions: {
            /**
             * 下一页
             * @method nextPage
             */
            nextPage: function () {
                // Make sure you can go forward first
                if (this.get('currentPage') === this.get('totalPages'))
                    return null; // NOOP

                // Set the current page to the next page
                var promise = this.doLoad(this.cursor + this.get('perPage'));
                if (promise.then) {
                    var that = this;
                    promise.then(function () {
                        that.set('currentPage', that.get('currentPage') + 1);
                    });
                }
            },

            /**
             * 上一页
             * @method prevPage
             */
            prevPage: function () {
                // Make sure you can go backwards first
                if (this.get('currentPage') === 1)
                    return null; // NOOP

                // Set the current page to the previous page

                var promise = this.doLoad(Math.max(0, this.cursor - this.get('perPage')));
                if (promise.then) {
                    var that = this;
                    promise.then(function () {
                        that.set('currentPage', that.get('currentPage') - 1);
                    });
                }
            },
            /**
             * 首页
             * @method firstPage
             */
            firstPage: function () {
                this.set("currentPage", 1);
                this.doLoad(0);
            },
            /**
             * 尾页
             * @method lastPage
             */
            lastPage: function () {
                var total = this.get('totalCount'),
                    extra = total % this.get('perPage');

                this.set("currentPage", this.get('totalPages'));
                this.doLoad(extra ? (total - extra) : total - this.get('perPage'));
            }
        },
        /**
         * 总条数
         * @property totalCount
         * @returns {*|number}
         */
        totalCount: function () {
            var meta = this.store.metadataFor(this.get('modelName'));
            return meta.total || 0;
        }.property().volatile(),
        /**
         * 根据属性名称排序
         * @method sortByProperty
         */
        sortByProperty: function (property, direction) {
            var data = this.get('content').slice();

            // Set up sort direction
            if (direction === undefined) {
                if (this.get('sortBy') === property && this.get('sortDirection') === 'ascending')
                    direction = 'descending';
                else
                    direction = 'ascending';
            }

            // Custom sort to sort alphanumerically
            data.sort(function (a, b) {
                // Normalize values to make sort natural
                var normalizedValues = normalizeSortValues(a.get(property), b.get(property)),
                    va = normalizedValues[0],
                    vb = normalizedValues[1];

                // Do the sorting
                if (va === vb)
                    return 0;
                else {
                    // Reverse if necessary
                    if (direction === 'ascending')
                        return va > vb ? 1 : -1;
                    else
                        return va < vb ? 1 : -1;
                }
            });

            // Now that sort is complete, set the controller
            this.set('sortBy', property);

            // Assign sort direction
            this.set('sortDirection', direction);

            // Assign the data
            this.set('content', data);

            // Reset the current page to 1
            //this.set('currentPage', 1);
            this.send("firstPage");
        }
    });

    __exports__.StaticPageable = StaticPageable;
    __exports__.DynamicPageable = DynamicPageable;
  });
define("bricksui",
  ["bricksui-metal","bricksui-i18n","bricksui-form","bricksui-thirdpart"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
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

requireModule("bricksui");

})();