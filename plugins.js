(function(window) {
  var I18n, assert, findTemplate, get, set, isBinding, lookupKey, pluralForm,
      PlainHandlebars, EmHandlebars, keyExists, compileTemplate;

  PlainHandlebars = window.Handlebars;
  EmHandlebars = Ember.Handlebars;
  get = EmHandlebars.get;
  set = Ember.set;
  assert = Ember.assert;

  function warn(msg) { Ember.Logger.warn(msg); }

  if (typeof CLDR !== "undefined" && CLDR !== null) pluralForm = CLDR.pluralForm;

  if (pluralForm == null) {
    warn("CLDR.pluralForm not found. Ember.I18n will not support count-based inflection.");
  }

  lookupKey = function(key, hash) {
    var firstKey, idx, remainingKeys;

    if (hash[key] != null) { return hash[key]; }

    if ((idx = key.indexOf('.')) !== -1) {
      firstKey = key.substr(0, idx);
      remainingKeys = key.substr(idx + 1);
      hash = hash[firstKey];
      if (hash) { return lookupKey(remainingKeys, hash); }
    }
  };

  findTemplate = function(key, setOnMissing) {
    assert("You must provide a translation key string, not %@".fmt(key), typeof key === 'string');
    var result = lookupKey(key, I18n.translations);

    if (setOnMissing) {
      if (result == null) {
        result = I18n.translations[key] = function() { return "Missing translation: " + key; };
        result._isMissing = true;
        warn("Missing translation: " + key);
        I18n[(typeof I18n.trigger === 'function' ? 'trigger' : 'fire')]('missing', key); //Support 0.9 style .fire
      }
    }

    if ((result != null) && !jQuery.isFunction(result)) {
      result = I18n.translations[key] = I18n.compile(result);
    }

    return result;
  };

  keyExists = function(key) {
    var translation = lookupKey(key, I18n.translations);
    return translation != null && !translation._isMissing;
  };

  function eachTranslatedAttribute(object, fn) {
    var isTranslatedAttribute = /(.+)Translation$/,
        isTranslatedAttributeMatch;

    for (var key in object) {
      isTranslatedAttributeMatch = key.match(isTranslatedAttribute);
      if (isTranslatedAttributeMatch) {
        fn.call(object, isTranslatedAttributeMatch[1], I18n.t(object[key]));
      }
    }
  }

  compileTemplate = (function() {
    if (typeof PlainHandlebars.compile === 'function') {
      return function compileWithHandlebars(template) {
        return PlainHandlebars.compile(template);
      };
    } else {
      return function cannotCompileTemplate() {
        throw new Ember.Error('The default Ember.I18n.compile function requires the full Handlebars. Either include the full Handlebars or override Ember.I18n.compile.');
      };
    }
  }());

  I18n = Ember.Evented.apply({
    compile: compileTemplate,

    translations: {},

    // Ember.I18n.eachTranslatedAttribute(object, callback)
    //
    // Iterate over the keys in `object`; for each property that ends in "Translation",
    // call `callback` with the property name (minus the "Translation" suffix) and the
    // translation whose key is the property's value.
    eachTranslatedAttribute: eachTranslatedAttribute,

    template: function(key, count) {
      var interpolatedKey, result, suffix;
      if ((count != null) && (pluralForm != null)) {
        suffix = pluralForm(count);
        interpolatedKey = "%@.%@".fmt(key, suffix);
        result = findTemplate(interpolatedKey, false);
      }
      return result != null ? result : result = findTemplate(key, true);
    },

    t: function(key, context) {
      var template;
      if (context == null) context = {};
      template = I18n.template(key, context.count);
      return template(context);
    },

    exists: keyExists,

    TranslateableProperties: Ember.Mixin.create({
      init: function() {
        var result = this._super.apply(this, arguments);
        eachTranslatedAttribute(this, function(attribute, translation) {
          this.addObserver(attribute + 'Translation', this, function(){
            set(this, attribute, I18n.t(this.get(attribute + 'Translation')));
          });
          set(this, attribute, translation);
        });

        return result;
      }
    }),

    TranslateableAttributes: Ember.Mixin.create({
      didInsertElement: function() {
        var result = this._super.apply(this, arguments);
        eachTranslatedAttribute(this, function(attribute, translation) {
          this.$().attr(attribute, translation);
        });
        return result;
      }
    })
  });

  Ember.I18n = I18n;

  isBinding = /(.+)Binding$/;

  // CRUFT: in v2, which requires Ember 1.0+, Ember.uuid will always be
  //        available, so this function can be cleaned up.
  var uniqueElementId = (function(){
    var id = Ember.uuid || 0;
    return function() {
      var elementId = 'i18n-' + id++;
      return elementId;
    };
  })();

  EmHandlebars.registerHelper('t', function(key, options) {
    var attrs, context, data, elementID, result, tagName, view;
    context = this;
    attrs = options.hash;
    data = options.data;
    view = data.view;
    tagName = attrs.tagName || 'span';
    delete attrs.tagName;
    elementID = uniqueElementId();

    Ember.keys(attrs).forEach(function(property) {
      var bindPath, currentValue, invoker, isBindingMatch, normalized, normalizedPath, observer, propertyName, root, _ref;
      isBindingMatch = property.match(isBinding);

      if (isBindingMatch) {
        propertyName = isBindingMatch[1];
        bindPath = attrs[property];
        currentValue = get(context, bindPath, options);
        attrs[propertyName] = currentValue;
        invoker = null;
        normalized = EmHandlebars.normalizePath(context, bindPath, data);
        _ref = [normalized.root, normalized.path], root = _ref[0], normalizedPath = _ref[1];

        observer = function() {
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

        invoker = function() {
          Ember.run.scheduleOnce('afterRender', observer);
        };

        return Ember.addObserver(root, normalizedPath, invoker);
      }
    });

    result = '<%@ id="%@">%@</%@>'.fmt(tagName, elementID, I18n.t(key, attrs), tagName);
    return new EmHandlebars.SafeString(result);
  });

  var attrHelperFunction = function(options) {
    var attrs, result;
    attrs = options.hash;
    result = [];

    Ember.keys(attrs).forEach(function(property) {
      var translatedValue;
      translatedValue = I18n.t(attrs[property]);
      return result.push('%@="%@"'.fmt(property, translatedValue));
    });

    return new EmHandlebars.SafeString(result.join(' '));
  };

  EmHandlebars.registerHelper('translateAttr', attrHelperFunction);
  EmHandlebars.registerHelper('ta', attrHelperFunction);

}).call(undefined, this);

// ==========================================================================
// Project:   Ember Validations
// Copyright: Copyright 2013 DockYard, LLC. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


 // Version: 1.0.0.beta.2

(function() {
Ember.Validations = Ember.Namespace.create({
  VERSION: '1.0.0.beta.2'
});

})();



(function() {
Ember.Validations.messages = {
  render: function(attribute, context) {
    if (Ember.I18n) {
      return Ember.I18n.t('errors.' + attribute, context);
    } else {
      var regex = new RegExp("{{(.*?)}}"),
          attributeName = "";
      if (regex.test(this.defaults[attribute])) {
        attributeName = regex.exec(this.defaults[attribute])[1];
      }
      return this.defaults[attribute].replace(regex, context[attributeName]);
    }
  },
  defaults: {
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

})();



(function() {
Ember.Validations.Errors = Ember.Object.extend({
  unknownProperty: function(property) {
    this.set(property, Ember.makeArray());
    return this.get(property);
  }
});

})();



(function() {
var setValidityMixin = Ember.Mixin.create({
  isValid: function() {
    return this.get('validators').compact().filterBy('isValid', false).get('length') === 0;
  }.property('validators.@each.isValid'),
  isInvalid: Ember.computed.not('isValid')
});

var pushValidatableObject = function(model, property) {
  var content = model.get(property);

  model.removeObserver(property, pushValidatableObject);
  if (Ember.isArray(content)) {
    model.validators.pushObject(ArrayValidatorProxy.create({model: model, property: property, contentBinding: 'model.' + property}));
  } else {
    model.validators.pushObject(content);
  }
};

var findValidator = function(validator) {
  var klass = validator.classify();
  return Ember.Validations.validators.local[klass] || Ember.Validations.validators.remote[klass];
};

var ArrayValidatorProxy = Ember.ArrayProxy.extend(setValidityMixin, {
  validate: function() {
    return this._validate();
  },
  _validate: function() {
    var promises = this.get('content').invoke('_validate').without(undefined);
    return Ember.RSVP.all(promises);
  }.on('init'),
  validators: Ember.computed.alias('content')
});

Ember.Validations.Mixin = Ember.Mixin.create(setValidityMixin, {
  init: function() {
    this._super();
    this.errors = Ember.Validations.Errors.create();
    this._dependentValidationKeys = {};
    this.validators = Ember.makeArray();
    if (this.get('validations') === undefined) {
      this.validations = {};
    }
    this.buildValidators();
    this.validators.forEach(function(validator) {
      validator.addObserver('errors.[]', this, function(sender, key, value, context, rev) {
        var errors = Ember.makeArray();
        this.validators.forEach(function(validator) {
          if (validator.property === sender.property) {
            errors = errors.concat(validator.errors);
          }
        }, this);
        this.set('errors.' + sender.property, errors);
      });
    }, this);
  },
  buildValidators: function() {
    var property, validator;

    for (property in this.validations) {
      if (this.validations[property].constructor === Object) {
        this.buildRuleValidator(property);
      } else {
        this.buildObjectValidator(property);
      }
    }
  },
  buildRuleValidator: function(property) {
    var validator;
    for (validator in this.validations[property]) {
      if (this.validations[property].hasOwnProperty(validator)) {
        this.validators.pushObject(findValidator(validator).create({model: this, property: property, options: this.validations[property][validator]}));
      }
    }
  },
  buildObjectValidator: function(property) {
    if (Ember.isNone(this.get(property))) {
      this.addObserver(property, this, pushValidatableObject);
    } else {
      pushValidatableObject(this, property);
    }
  },
  validate: function() {
    var self = this;
    return this._validate().then(function(vals) {
      var errors = self.get('errors');
      if (vals.contains(false)) {
        return Ember.RSVP.reject(errors);
      }
      return errors;
    });
  },
  _validate: function() {
    var promises = this.validators.invoke('_validate').without(undefined);
    return Ember.RSVP.all(promises);
  }.on('init')
});

})();



(function() {
Ember.Validations.patterns = Ember.Namespace.create({
  numericality: /^(-|\+)?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/,
  blank: /^\s*$/
});

})();



(function() {
Ember.Validations.validators        = Ember.Namespace.create();
Ember.Validations.validators.local  = Ember.Namespace.create();
Ember.Validations.validators.remote = Ember.Namespace.create();

})();



(function() {
Ember.Validations.validators.Base = Ember.Object.extend({
  init: function() {
    this.set('errors', Ember.makeArray());
    this._dependentValidationKeys = Ember.makeArray();
    this.conditionals = {
      'if': this.get('options.if'),
      unless: this.get('options.unless')
    };
    this.model.addObserver(this.property, this, this._validate);
  },
  addObserversForDependentValidationKeys: function() {
    this._dependentValidationKeys.forEach(function(key) {
      this.model.addObserver(key, this, this._validate);
    }, this);
  }.on('init'),
  pushDependentValidationKeyToModel: function() {
    var model = this.get('model');
    if (model._dependentValidationKeys[this.property] === undefined) {
      model._dependentValidationKeys[this.property] = Ember.makeArray();
    }
    model._dependentValidationKeys[this.property].addObjects(this._dependentValidationKeys);
  }.on('init'),
  call: function () {
    throw 'Not implemented!';
  },
  unknownProperty: function(key) {
    var model = this.get('model');
    if (model) {
      return model.get(key);
    }
  },
  isValid: Ember.computed.empty('errors.[]'),
  validate: function() {
    var self = this;
    return this._validate().then(function(success) {
      // Convert validation failures to rejects.
      var errors = self.get('model.errors');
      if (success) {
        return errors;
      } else {
        return Ember.RSVP.reject(errors);
      }
    });
  },
  _validate: function() {
    this.errors.clear();
    if (this.canValidate()) {
      this.call();
    }
    if (this.get('isValid')) {
      return Ember.RSVP.resolve(true);
    } else {
      return Ember.RSVP.resolve(false);
    }
  }.on('init'),
  canValidate: function() {
    if (typeof(this.conditionals) === 'object') {
      if (this.conditionals['if']) {
        if (typeof(this.conditionals['if']) === 'function') {
          return this.conditionals['if'](this.model, this.property);
        } else if (typeof(this.conditionals['if']) === 'string') {
          if (typeof(this.model[this.conditionals['if']]) === 'function') {
            return this.model[this.conditionals['if']]();
          } else {
            return this.model.get(this.conditionals['if']);
          }
        }
      } else if (this.conditionals.unless) {
        if (typeof(this.conditionals.unless) === 'function') {
          return !this.conditionals.unless(this.model, this.property);
        } else if (typeof(this.conditionals.unless) === 'string') {
          if (typeof(this.model[this.conditionals.unless]) === 'function') {
            return !this.model[this.conditionals.unless]();
          } else {
            return !this.model.get(this.conditionals.unless);
          }
        }
      } else {
        return true;
      }
    } else {
      return true;
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Absence = Ember.Validations.validators.Base.extend({
  init: function() {
    this._super();
    /*jshint expr:true*/
    if (this.options === true) {
      this.set('options', {});
    }

    if (this.options.message === undefined) {
      this.set('options.message', Ember.Validations.messages.render('present', this.options));
    }
  },
  call: function() {
    if (!Ember.isEmpty(this.model.get(this.property))) {
      this.errors.pushObject(this.options.message);
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Acceptance = Ember.Validations.validators.Base.extend({
  init: function() {
    this._super();
    /*jshint expr:true*/
    if (this.options === true) {
      this.set('options', {});
    }

    if (this.options.message === undefined) {
      this.set('options.message', Ember.Validations.messages.render('accepted', this.options));
    }
  },
  call: function() {
    if (this.options.accept) {
      if (this.model.get(this.property) !== this.options.accept) {
        this.errors.pushObject(this.options.message);
      }
    } else if (this.model.get(this.property) !== '1' && this.model.get(this.property) !== 1 && this.model.get(this.property) !== true) {
      this.errors.pushObject(this.options.message);
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Confirmation = Ember.Validations.validators.Base.extend({
  init: function() {
    this.originalProperty = this.property;
    this.property = this.property + 'Confirmation';
    this._super();
    this._dependentValidationKeys.pushObject(this.originalProperty);
    /*jshint expr:true*/
    if (this.options === true) {
      this.set('options', { attribute: this.originalProperty });
      this.set('options', { message: Ember.Validations.messages.render('confirmation', this.options) });
    }
  },
  call: function() {
    if (this.model.get(this.originalProperty) !== this.model.get(this.property)) {
      this.errors.pushObject(this.options.message);
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Exclusion = Ember.Validations.validators.Base.extend({
  init: function() {
    this._super();
    if (this.options.constructor === Array) {
      this.set('options', { 'in': this.options });
    }

    if (this.options.message === undefined) {
      this.set('options.message', Ember.Validations.messages.render('exclusion', this.options));
    }
  },
  call: function() {
    /*jshint expr:true*/
    var message, lower, upper;

    if (Ember.isEmpty(this.model.get(this.property))) {
      if (this.options.allowBlank === undefined) {
        this.errors.pushObject(this.options.message);
      }
    } else if (this.options['in']) {
      if (Ember.$.inArray(this.model.get(this.property), this.options['in']) !== -1) {
        this.errors.pushObject(this.options.message);
      }
    } else if (this.options.range) {
      lower = this.options.range[0];
      upper = this.options.range[1];

      if (this.model.get(this.property) >= lower && this.model.get(this.property) <= upper) {
        this.errors.pushObject(this.options.message);
      }
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Format = Ember.Validations.validators.Base.extend({
  init: function() {
    this._super();
    if (this.options.constructor === RegExp) {
      this.set('options', { 'with': this.options });
    }

    if (this.options.message === undefined) {
      this.set('options.message',  Ember.Validations.messages.render('invalid', this.options));
    }
   },
   call: function() {
    if (Ember.isEmpty(this.model.get(this.property))) {
      if (this.options.allowBlank === undefined) {
        this.errors.pushObject(this.options.message);
      }
    } else if (this.options['with'] && !this.options['with'].test(this.model.get(this.property))) {
      this.errors.pushObject(this.options.message);
    } else if (this.options.without && this.options.without.test(this.model.get(this.property))) {
      this.errors.pushObject(this.options.message);
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Inclusion = Ember.Validations.validators.Base.extend({
  init: function() {
    this._super();
    if (this.options.constructor === Array) {
      this.set('options', { 'in': this.options });
    }

    if (this.options.message === undefined) {
      this.set('options.message', Ember.Validations.messages.render('inclusion', this.options));
    }
  },
  call: function() {
    var message, lower, upper;
    if (Ember.isEmpty(this.model.get(this.property))) {
      if (this.options.allowBlank === undefined) {
        this.errors.pushObject(this.options.message);
      }
    } else if (this.options['in']) {
      if (Ember.$.inArray(this.model.get(this.property), this.options['in']) === -1) {
        this.errors.pushObject(this.options.message);
      }
    } else if (this.options.range) {
      lower = this.options.range[0];
      upper = this.options.range[1];

      if (this.model.get(this.property) < lower || this.model.get(this.property) > upper) {
        this.errors.pushObject(this.options.message);
      }
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Length = Ember.Validations.validators.Base.extend({
  init: function() {
    var index, key;
    this._super();
    /*jshint expr:true*/
    if (typeof(this.options) === 'number') {
      this.set('options', { 'is': this.options });
    }

    if (this.options.messages === undefined) {
      this.set('options.messages', {});
    }

    for (index = 0; index < this.messageKeys().length; index++) {
      key = this.messageKeys()[index];
      if (this.options[key] !== undefined && this.options[key].constructor === String) {
        this.model.addObserver(this.options[key], this, this._validate);
      }
    }

    this.options.tokenizer = this.options.tokenizer || function(value) { return value.split(''); };
    // if (typeof(this.options.tokenizer) === 'function') {
      // debugger;
      // // this.tokenizedLength = new Function('value', 'return '
    // } else {
      // this.tokenizedLength = new Function('value', 'return (value || "").' + (this.options.tokenizer || 'split("")') + '.length');
    // }
  },
  CHECKS: {
    'is'      : '==',
    'minimum' : '>=',
    'maximum' : '<='
  },
  MESSAGES: {
    'is'      : 'wrongLength',
    'minimum' : 'tooShort',
    'maximum' : 'tooLong'
  },
  getValue: function(key) {
    if (this.options[key].constructor === String) {
      return this.model.get(this.options[key]) || 0;
    } else {
      return this.options[key];
    }
  },
  messageKeys: function() {
    return Ember.keys(this.MESSAGES);
  },
  checkKeys: function() {
    return Ember.keys(this.CHECKS);
  },
  renderMessageFor: function(key) {
    var options = {count: this.getValue(key)}, _key;
    for (_key in this.options) {
      options[_key] = this.options[_key];
    }

    return this.options.messages[this.MESSAGES[key]] || Ember.Validations.messages.render(this.MESSAGES[key], options);
  },
  renderBlankMessage: function() {
    if (this.options.is) {
      return this.renderMessageFor('is');
    } else if (this.options.minimum) {
      return this.renderMessageFor('minimum');
    }
  },
  call: function() {
    var check, fn, message, operator, key;

    if (Ember.isEmpty(this.model.get(this.property))) {
      if (this.options.allowBlank === undefined && (this.options.is || this.options.minimum)) {
        this.errors.pushObject(this.renderBlankMessage());
      }
    } else {
      for (key in this.CHECKS) {
        operator = this.CHECKS[key];
        if (!this.options[key]) {
          continue;
        }

        fn = new Function('return ' + this.options.tokenizer(this.model.get(this.property)).length + ' ' + operator + ' ' + this.getValue(key));
        if (!fn()) {
          this.errors.pushObject(this.renderMessageFor(key));
        }
      }
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Numericality = Ember.Validations.validators.Base.extend({
  init: function() {
    /*jshint expr:true*/
    var index, keys, key;
    this._super();

    if (this.options === true) {
      this.options = {};
    } else if (this.options.constructor === String) {
      key = this.options;
      this.options = {};
      this.options[key] = true;
    }

    if (this.options.messages === undefined || this.options.messages.numericality === undefined) {
      this.options.messages = this.options.messages || {};
      this.options.messages = { numericality: Ember.Validations.messages.render('notANumber', this.options) };
    }

    if (this.options.onlyInteger !== undefined && this.options.messages.onlyInteger === undefined) {
      this.options.messages.onlyInteger = Ember.Validations.messages.render('notAnInteger', this.options);
    }

    keys = Ember.keys(this.CHECKS).concat(['odd', 'even']);
    for(index = 0; index < keys.length; index++) {
      key = keys[index];

      var prop = this.options[key];
      if (key in this.options && isNaN(prop)) {
        this.model.addObserver(prop, this, this._validate);
      }

      if (prop !== undefined && this.options.messages[key] === undefined) {
        if (Ember.$.inArray(key, Ember.keys(this.CHECKS)) !== -1) {
          this.options.count = prop;
        }
        this.options.messages[key] = Ember.Validations.messages.render(key, this.options);
        if (this.options.count !== undefined) {
          delete this.options.count;
        }
      }
    }
  },
  CHECKS: {
    equalTo              :'===',
    greaterThan          : '>',
    greaterThanOrEqualTo : '>=',
    lessThan             : '<',
    lessThanOrEqualTo    : '<='
  },
  call: function() {
    var check, checkValue, fn, form, operator, val;

    if (Ember.isEmpty(this.model.get(this.property))) {
      if (this.options.allowBlank === undefined) {
        this.errors.pushObject(this.options.messages.numericality);
      }
    } else if (!Ember.Validations.patterns.numericality.test(this.model.get(this.property))) {
      this.errors.pushObject(this.options.messages.numericality);
    } else if (this.options.onlyInteger === true && !(/^[+\-]?\d+$/.test(this.model.get(this.property)))) {
      this.errors.pushObject(this.options.messages.onlyInteger);
    } else if (this.options.odd  && parseInt(this.model.get(this.property), 10) % 2 === 0) {
      this.errors.pushObject(this.options.messages.odd);
    } else if (this.options.even && parseInt(this.model.get(this.property), 10) % 2 !== 0) {
      this.errors.pushObject(this.options.messages.even);
    } else {
      for (check in this.CHECKS) {
        operator = this.CHECKS[check];

        if (this.options[check] === undefined) {
          continue;
        }

        if (!isNaN(parseFloat(this.options[check])) && isFinite(this.options[check])) {
          checkValue = this.options[check];
        } else if (this.model.get(this.options[check]) !== undefined) {
          checkValue = this.model.get(this.options[check]);
        }

        fn = new Function('return ' + this.model.get(this.property) + ' ' + operator + ' ' + checkValue);

        if (!fn()) {
          this.errors.pushObject(this.options.messages[check]);
        }
      }
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Presence = Ember.Validations.validators.Base.extend({
  init: function() {
    this._super();
    /*jshint expr:true*/
    if (this.options === true) {
      this.options = {};
    }

    if (this.options.message === undefined) {
      this.options.message = Ember.Validations.messages.render('blank', this.options);
    }
  },
  call: function() {
    if (Ember.isEmpty(this.model.get(this.property))) {
      this.errors.pushObject(this.options.message);
    }
  }
});

})();



(function() {
Ember.Validations.validators.local.Url = Ember.Validations.validators.Base.extend({
  regexp: null,
  regexp_ip: null,

  init: function() {
    this._super();

    if (this.get('options.message') === undefined) {
      this.set('options.message', Ember.Validations.messages.render('url', this.options));
    }

    if (this.get('options.protocols') === undefined) {
      this.set('options.protocols', ['http', 'https']);
    }

    // Regular Expression Parts
    var dec_octet = '(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])'; // 0-255
    var ipaddress = '(' + dec_octet + '(\\.' + dec_octet + '){3})';
    var hostname = '([a-zA-Z0-9\\-]+\\.)+([a-zA-Z]{2,})';
    var encoded = '%[0-9a-fA-F]{2}';
    var characters = 'a-zA-Z0-9$\\-_.+!*\'(),;:@&=';
    var segment = '([' + characters + ']|' + encoded + ')*';

    // Build Regular Expression
    var regex_str = '^';

    if (this.get('options.domainOnly') === true) {
      regex_str += hostname;
    } else {
      regex_str += '(' + this.get('options.protocols').join('|') + '):\\/\\/'; // Protocol

      // Username and password
      if (this.get('options.allowUserPass') === true) {
        regex_str += '(([a-zA-Z0-9$\\-_.+!*\'(),;:&=]|' + encoded + ')+@)?'; // Username & passwords
      }

      // IP Addresses?
      if (this.get('options.allowIp') === true) {
        regex_str += '(' + hostname + '|' + ipaddress + ')'; // Hostname OR IP
      } else {
        regex_str += '(' + hostname + ')'; // Hostname only
      }

      // Ports
      if (this.get('options.allowPort') === true) {
        regex_str += '(:[0-9]+)?'; // Port
      }

      regex_str += '(\\/';
      regex_str += '(' + segment + '(\\/' + segment + ')*)?'; // Path
      regex_str += '(\\?' + '([' + characters + '/?]|' + encoded + ')*)?'; // Query
      regex_str += '(\\#' + '([' + characters + '/?]|' + encoded + ')*)?'; // Anchor
      regex_str += ')?';
    }

    regex_str += '$';

    // RegExp
    this.regexp = new RegExp(regex_str);
    this.regexp_ip = new RegExp(ipaddress);
  },
  call: function() {
    var url = this.model.get(this.property);

    if (Ember.isEmpty(url)) {
      if (this.get('options.allowBlank') !== true) {
        this.errors.pushObject(this.get('options.message'));
      }
    } else {
      if (this.get('options.allowIp') !== true) {
        if (this.regexp_ip.test(url)) {
          this.errors.pushObject(this.get('options.message'));
          return;
        }
      }

      if (!this.regexp.test(url)) {
        this.errors.pushObject(this.get('options.message'));
      }
    }
  }
});


})();



(function() {

})();



(function() {

})();


// ==========================================================================
// Project:   Ember EasyForm
// Copyright: Copyright 2013 DockYard, LLC. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


 // Version: 1.0.0.beta.1

(function() {
Ember.EasyForm = Ember.Namespace.create({
  VERSION: '1.0.0.beta.1'
});

})();



(function() {
Ember.EasyForm.Config = Ember.Namespace.create({
  _wrappers: {
    'default': {
      formClass: '',
      fieldErrorClass: 'fieldWithErrors',
      inputClass: 'input',
      errorClass: 'error',
      hintClass: 'hint',
      labelClass: '',
      inputTemplate: 'easyForm/input',
      errorTemplate: 'easyForm/error',
      labelTemplate: 'easyForm/label',
      hintTemplate: 'easyForm/hint',
      wrapControls: false,
      controlsWrapperClass: '',
      buttonClass: ''
    }
  },
  modulePrefix: 'appkit',
  _inputTypes: {},
  _templates: {},
  registerWrapper: function(name, wrapper) {
    this._wrappers[name] = Ember.$.extend({}, this._wrappers['default'], wrapper);
  },
  getWrapper: function(name) {
    var wrapper = this._wrappers[name];
    Ember.assert("The wrapper '" + name + "' was not registered.", wrapper);
    return wrapper;
  },
  registerInputType: function(name, type){
    this._inputTypes[name] = type;
  },
  getInputType: function(name) {
    return this._inputTypes[name];
  },
  registerTemplate: function(name, template) {
    this._templates[name] = template;
  },
  getTemplate: function(name) {
    return this._templates[name];
  }
});

})();



(function() {
Ember.Handlebars.registerHelper('error-field', function(property, options) {
  options = Ember.EasyForm.processOptions(property, options);

  if (options.hash.propertyBinding) {
    options.hash.property = Ember.Handlebars.get(this, options.hash.propertyBinding, options);
  }
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Error, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('form-for', function(object, options) {
  options.data.keywords.formForModelPath = object;
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Form, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('hint-field', function(property, options) {
  options = Ember.EasyForm.processOptions(property, options);

  if (options.hash.text || options.hash.textBinding) {
    return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Hint, options);
  }
});

})();



(function() {
Ember.Handlebars.helpers['ember-input'] = Ember.Handlebars.helpers['input'];

Ember.Handlebars.registerHelper('input', function(property, options) {
  if (arguments.length === 1) {
    return Ember.Handlebars.helpers['ember-input'].call(this, arguments[0]);
  }

  options = Ember.EasyForm.processOptions(property, options);
  options.hash.isBlock = !!(options.fn);
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Input, options);
});

})();



(function() {
var get = Ember.get,
    set = Ember.set;

Ember.Handlebars.registerHelper('input-field', function(property, options) {
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

  var modelPropertyPath = function(property) {
    if(!property) { return null; }

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

  options.hash.valueBinding = modelPropertyPath(property);

  var context = this,
    propertyType = function(property) {
      var constructor = (get(context, 'content') || context).constructor;

      if (constructor.proto) {
        return Ember.meta(constructor.proto(), false).descs[property];
      } else {
        return null;
      }
    };

  options.hash.viewName = 'input-field-'+options.data.view.elementId;

  if (options.hash.inputOptions) {
    var inputOptions = options.hash.inputOptions, optionName;
    for (optionName in inputOptions) {
      if (inputOptions.hasOwnProperty(optionName)) {
       options.hash[optionName] = inputOptions[optionName];
      }
    }
    delete options.hash.inputOptions;
  }

  if (options.hash.as === 'text') {
    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.TextArea, options);
  } else if (options.hash.as === 'select') {
    delete(options.hash.valueBinding);

    options.hash.contentBinding   = modelPropertyPath(options.hash.collection);
    options.hash.selectionBinding = modelPropertyPath(options.hash.selection);
    options.hash.valueBinding     = modelPropertyPath(options.hash.value);

    if (Ember.isNone(options.hash.selectionBinding) && Ember.isNone(options.hash.valueBinding)) {
      options.hash.selectionBinding = modelPropertyPath(property);
    }

    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.Select, options);
  } else if (options.hash.as === 'checkbox') {
    if (Ember.isNone(options.hash.checkedBinding)) {
      options.hash.checkedBinding = modelPropertyPath(property);
    }

    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.Checkbox, options);
  } else {
    if (!options.hash.as) {
      if (property.match(/password/)) {
        options.hash.type = 'password';
      } else if (property.match(/email/)) {
        options.hash.type = 'email';
      } else if (property.match(/url/)) {
        options.hash.type = 'url';
      } else if (property.match(/color/)) {
        options.hash.type = 'color';
      } else if (property.match(/^tel/)) {
        options.hash.type = 'tel';
      } else if (property.match(/search/)) {
        options.hash.type = 'search';
      } else {
        if (propertyType(property) === 'number' || typeof(get(context,property)) === 'number') {
          options.hash.type = 'number';
        } else if (propertyType(property) === 'date' || (!Ember.isNone(get(context,property)) && get(context,property).constructor === Date)) {
          options.hash.type = 'date';
        } else if (propertyType(property) === 'boolean' || (!Ember.isNone(context.get(property)) && get(context,property).constructor === Boolean)) {
          options.hash.checkedBinding = property;
          return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.Checkbox, options);
        }
      }
    } else {
      var inputType = Ember.EasyForm.Config.getInputType(options.hash.as);
      if (inputType) {
        return Ember.Handlebars.helpers.view.call(context, inputType, options);
      }

      options.hash.type = options.hash.as;
    }
    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.TextField, options);
  }
});

})();



(function() {
Ember.Handlebars.registerHelper('label-field', function(property, options) {
  options = Ember.EasyForm.processOptions(property, options);
  options.hash.viewName = 'label-field-'+options.data.view.elementId;
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Label, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('submit', function(value, options) {
  if (typeof(value) === 'object') {
    options = value;
    value = undefined;
  }
  options.hash.context = this;
  options.hash.value = value || 'Submit';
  return (options.hash.as === 'button') ?
    Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Button, options)
    :
    Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Submit, options);
});

})();



(function() {

})();



(function() {
Ember.EasyForm.BaseView = Ember.View.extend({
  classNameBindings: ['property'],
  wrapper: function() {
    var wrapperView = this.nearestWithProperty('wrapper');
    if (wrapperView) {
      return wrapperView.get('wrapper');
    } else {
      return 'default';
    }
  }.property(),
  wrapperConfig: function() {
    return Ember.EasyForm.Config.getWrapper(this.get('wrapper'));
  }.property('wrapper'),
  templateForName: function(name) {
    var template;

    if (this.container) {
      template = this.container.lookup('template:' + name);
    }

    return template || Ember.EasyForm.Config.getTemplate(name);
  },
  formForModel: function(){
    var formForModelPath = this.get('templateData.keywords.formForModelPath');

    if (formForModelPath === 'context' || formForModelPath === 'controller' || formForModelPath === 'this') {
      return this.get('context');
    } else if (formForModelPath) {
      return this.get('context.' + formForModelPath);
    } else {
      return this.get('context');
    }
  }.property()
});

})();



(function() {
Ember.EasyForm.Checkbox = Ember.Checkbox.extend();

})();



(function() {
Ember.EasyForm.Error = Ember.EasyForm.BaseView.extend({
  tagName: 'span',
  classNameBindings: ['wrapperConfig.errorClass'],
  init: function() {
    this._super();
    Ember.Binding.from('formForModel.errors.' + this.property).to('errors').connect(this);
  },
  templateName: Ember.computed.oneWay('wrapperConfig.errorTemplate'),
  errorText: Ember.computed.oneWay('errors.firstObject')
});

})();



(function() {
Ember.EasyForm.Form = Ember.EasyForm.BaseView.extend({
  tagName: 'form',
  attributeBindings: ['novalidate'],
  classNameBindings: ['wrapperConfig.formClass'],
  novalidate: 'novalidate',
  wrapper: 'default',
  init: function() {
    this._super();
    this.action = this.action || 'submit';
  },
  submit: function(event) {
    var _this = this,
        promise;

    if (event) {
      event.preventDefault();
    }

    if (Ember.isNone(this.get('formForModel.validate'))) {
      this.get('controller').send(this.action);
    } else {
      if (!Ember.isNone(this.get('formForModel').validate)) {
        promise = this.get('formForModel').validate();
      } else {
        promise = this.get('formForModel.content').validate();
      }
      promise.then(function() {
        if (_this.get('formForModel.isValid')) {
          _this.get('controller').send(_this.action);
        }
      });
    }
  }
});

})();



(function() {
Ember.EasyForm.Hint = Ember.EasyForm.BaseView.extend({
  tagName: 'span',
  classNameBindings: ['wrapperConfig.hintClass'],
  templateName: Ember.computed.oneWay('wrapperConfig.hintTemplate'),
  hintText: Ember.computed.oneWay('text')
});

})();



(function() {
Ember.EasyForm.Input = Ember.EasyForm.BaseView.extend({
  init: function() {
    this._super();
    this.classNameBindings.push('showError:' + this.get('wrapperConfig.fieldErrorClass'));
    Ember.defineProperty(this, 'showError', Ember.computed.and('canShowValidationError', 'formForModel.errors.' + this.property + '.firstObject'));
    if (!this.isBlock) {
      this.set('templateName', this.get('wrapperConfig.inputTemplate'));
    }
  },
  setupValidationDependencies: function() {
    var keys = this.get('formForModel._dependentValidationKeys'), key;
    if (keys) {
      for(key in keys) {
        if (keys[key].contains(this.property)) {
          this._keysForValidationDependencies.pushObject(key);
        }
      }
    }
  }.on('init'),
  _keysForValidationDependencies: Ember.A(),
  dependentValidationKeyCanTrigger: false,
  tagName: 'div',
  classNames: ['string'],
  classNameBindings: ['wrapperConfig.inputClass'],
  didInsertElement: function() {
    var name = 'label-field-'+this.elementId,
        label = this.get(name);
    if (!label) { return; }
    this.set(name+'.for', this.get('input-field-'+this.elementId+'.elementId'));
  },
  concatenatedProperties: ['inputOptions', 'bindableInputOptions'],
  inputOptions: ['as', 'collection', 'optionValuePath', 'optionLabelPath', 'selection', 'value', 'multiple', 'name'],
  bindableInputOptions: ['placeholder', 'prompt'],
  defaultOptions: {
    name: function(){
      if (this.property) {
        return this.property;
      }
    }
  },
  inputOptionsValues: function() {
    var options = {}, i, key, keyBinding, value, inputOptions = this.inputOptions, bindableInputOptions = this.bindableInputOptions, defaultOptions = this.defaultOptions;
    for (i = 0; i < inputOptions.length; i++) {
      key = inputOptions[i];
      if (this[key]) {
        if (typeof(this[key]) === 'boolean') {
          this[key] = key;
        }

        options[key] = this[key];
      }
    }
    for (i = 0; i < bindableInputOptions.length; i++) {
      key = bindableInputOptions[i];
      keyBinding = key + 'Binding';
      if (this[key] || this[keyBinding]) {
        options[keyBinding] = 'view.' + key;
      }
    }

    for (key in defaultOptions) {
      if (!defaultOptions.hasOwnProperty(key)) { continue; }
      if (options[key]) { continue; }

      if (value = defaultOptions[key].apply(this)) {
        options[key] = value;
      }
    }

    return options;
  }.property(),
  focusOut: function() {
    this.set('hasFocusedOut', true);
    this.showValidationError();
  },
  showValidationError: function() {
    if (this.get('hasFocusedOut')) {
      if (Ember.isEmpty(this.get('formForModel.errors.' + this.property))) {
        this.set('canShowValidationError', false);
      } else {
        this.set('canShowValidationError', true);
      }
    }
  },
  input: function() {
    this._keysForValidationDependencies.forEach(function(key) {
     this.get('parentView.childViews').forEach(function(view) {
       if (view.property === key) {
         view.showValidationError();
       }
     }, this);
    }, this);
  }
});

})();



(function() {
Ember.EasyForm.Label = Ember.EasyForm.BaseView.extend({
  tagName: 'label',
  attributeBindings: ['for'],
  classNameBindings: ['wrapperConfig.labelClass'],
  labelText: function() {
    return this.get('text') || Ember.EasyForm.humanize(this.get('property'));
  }.property('text', 'property'),
  templateName: Ember.computed.oneWay('wrapperConfig.labelTemplate')
});

})();



(function() {
Ember.EasyForm.Select = Ember.Select.extend();

})();



(function() {
Ember.EasyForm.Submit = Ember.EasyForm.BaseView.extend({
  tagName: 'input',
  attributeBindings: ['type', 'value', 'disabled'],
  classNameBindings: ['wrapperConfig.buttonClass'],
  type: 'submit',
  disabled: function() {
    return !this.get('formForModel.isValid');
  }.property('formForModel.isValid'),
  init: function() {
    this._super();
    this.set('value', this.value);
  }
});

})();



(function() {
Ember.EasyForm.Button = Ember.EasyForm.BaseView.extend({
  tagName: 'button',
  template: Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var stack1;


  stack1 = helpers._triageMustache.call(depth0, "text", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  
}),
  attributeBindings: ['type', 'disabled'],
  type: 'submit',
  disabled: function() {
    return !this.get('formForModel.isValid');
  }.property('formForModel.isValid'),
  init: function() {
    this._super();
    this.set('formForModel.text', this.value);
  }
});

})();



(function() {
Ember.EasyForm.TextArea = Ember.TextArea.extend();

})();



(function() {
Ember.EasyForm.TextField = Ember.TextField.extend();

})();



(function() {

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/error', Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var stack1;


  stack1 = helpers._triageMustache.call(depth0, "view.errorText", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  
}));

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/hint', Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var stack1;


  stack1 = helpers._triageMustache.call(depth0, "view.hintText", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  
}));

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/input', Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  data.buffer.push(escapeExpression((helper = helpers['label-field'] || (depth0 && depth0['label-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.label")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "label-field", options))));
  data.buffer.push(escapeExpression((helper = helpers.partial || (depth0 && depth0.partial),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "easyForm/inputControls", options) : helperMissing.call(depth0, "partial", "easyForm/inputControls", options))));
  return buffer;
  
}));

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/inputControls', Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var helper, options;
  data.buffer.push(escapeExpression((helper = helpers['error-field'] || (depth0 && depth0['error-field']),options={hash:{
    'propertyBinding': ("view.property")
  },hashTypes:{'propertyBinding': "STRING"},hashContexts:{'propertyBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "error-field", options))));
  }

function program3(depth0,data) {
  
  var helper, options;
  data.buffer.push(escapeExpression((helper = helpers['hint-field'] || (depth0 && depth0['hint-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'textBinding': ("view.hint")
  },hashTypes:{'propertyBinding': "STRING",'textBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'textBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "hint-field", options))));
  }

  data.buffer.push(escapeExpression((helper = helpers['input-field'] || (depth0 && depth0['input-field']),options={hash:{
    'propertyBinding': ("view.property"),
    'inputOptionsBinding': ("view.inputOptionsValues")
  },hashTypes:{'propertyBinding': "STRING",'inputOptionsBinding': "STRING"},hashContexts:{'propertyBinding': depth0,'inputOptionsBinding': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-field", options))));
  stack1 = helpers['if'].call(depth0, "view.showError", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  stack1 = helpers['if'].call(depth0, "view.hint", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  return buffer;
  
}));

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/label', Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var stack1;


  stack1 = helpers._triageMustache.call(depth0, "view.labelText", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  
}));

})();



(function() {

})();



(function() {
Ember.EasyForm.humanize = function(string) {
  return string.underscore().split('_').join(' ').capitalize();
};

Ember.EasyForm.eachTranslatedAttribute = function(object, fn) {
  var isTranslatedAttribute = /(.+)Translation$/,
      isTranslatedAttributeMatch;

  for (var key in object) {
    isTranslatedAttributeMatch = key.match(isTranslatedAttribute);
    if (isTranslatedAttributeMatch) {
      fn.call(object, isTranslatedAttributeMatch[1], Ember.I18n.t(object[key]));
    }
  }
};

Ember.EasyForm.processOptions = function(property, options) {
  if (options) {
    if (Ember.I18n) {
      var eachTranslatedAttribute = Ember.I18n.eachTranslatedAttribute || Ember.EasyForm.eachTranslatedAttribute;
      eachTranslatedAttribute(options.hash, function (attribute, translation) {
        options.hash[attribute] = translation;
        delete options.hash[attribute + 'Translation'];
      });
    }
    options.hash.property = property;
  } else {
    options = property;
  }

  return options;
};

})();



(function() {

})();


/*!
Chosen, a Select Box Enhancer for jQuery and Prototype
by Patrick Filler for Harvest, http://getharvest.com

Version 1.1.0
Full source at https://github.com/harvesthq/chosen
Copyright (c) 2011 Harvest http://getharvest.com

MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md
This file is generated by `grunt build`, do not edit it by hand.
*/

(function() {
  var $, AbstractChosen, Chosen, SelectParser, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SelectParser = (function() {
    function SelectParser() {
      this.options_index = 0;
      this.parsed = [];
    }

    SelectParser.prototype.add_node = function(child) {
      if (child.nodeName.toUpperCase() === "OPTGROUP") {
        return this.add_group(child);
      } else {
        return this.add_option(child);
      }
    };

    SelectParser.prototype.add_group = function(group) {
      var group_position, option, _i, _len, _ref, _results;
      group_position = this.parsed.length;
      this.parsed.push({
        array_index: group_position,
        group: true,
        label: this.escapeExpression(group.label),
        children: 0,
        disabled: group.disabled
      });
      _ref = group.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        _results.push(this.add_option(option, group_position, group.disabled));
      }
      return _results;
    };

    SelectParser.prototype.add_option = function(option, group_position, group_disabled) {
      if (option.nodeName.toUpperCase() === "OPTION") {
        if (option.text !== "") {
          if (group_position != null) {
            this.parsed[group_position].children += 1;
          }
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            selected: option.selected,
            disabled: group_disabled === true ? group_disabled : option.disabled,
            group_array_index: group_position,
            classes: option.className,
            style: option.style.cssText
          });
        } else {
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            empty: true
          });
        }
        return this.options_index += 1;
      }
    };

    SelectParser.prototype.escapeExpression = function(text) {
      var map, unsafe_chars;
      if ((text == null) || text === false) {
        return "";
      }
      if (!/[\&\<\>\"\'\`]/.test(text)) {
        return text;
      }
      map = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      };
      unsafe_chars = /&(?!\w+;)|[\<\>\"\'\`]/g;
      return text.replace(unsafe_chars, function(chr) {
        return map[chr] || "&amp;";
      });
    };

    return SelectParser;

  })();

  SelectParser.select_to_array = function(select) {
    var child, parser, _i, _len, _ref;
    parser = new SelectParser();
    _ref = select.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      parser.add_node(child);
    }
    return parser.parsed;
  };

  AbstractChosen = (function() {
    function AbstractChosen(form_field, options) {
      this.form_field = form_field;
      this.options = options != null ? options : {};
      if (!AbstractChosen.browser_is_supported()) {
        return;
      }
      this.is_multiple = this.form_field.multiple;
      this.set_default_text();
      this.set_default_values();
      this.setup();
      this.set_up_html();
      this.register_observers();
    }

    AbstractChosen.prototype.set_default_values = function() {
      var _this = this;
      this.click_test_action = function(evt) {
        return _this.test_active_click(evt);
      };
      this.activate_action = function(evt) {
        return _this.activate_field(evt);
      };
      this.active_field = false;
      this.mouse_on_container = false;
      this.results_showing = false;
      this.result_highlighted = null;
      this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
      this.disable_search_threshold = this.options.disable_search_threshold || 0;
      this.disable_search = this.options.disable_search || false;
      this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
      this.group_search = this.options.group_search != null ? this.options.group_search : true;
      this.search_contains = this.options.search_contains || false;
      this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
      this.max_selected_options = this.options.max_selected_options || Infinity;
      this.inherit_select_classes = this.options.inherit_select_classes || false;
      this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
      return this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
    };

    AbstractChosen.prototype.set_default_text = function() {
      if (this.form_field.getAttribute("data-placeholder")) {
        this.default_text = this.form_field.getAttribute("data-placeholder");
      } else if (this.is_multiple) {
        this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
      } else {
        this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
      }
      return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
    };

    AbstractChosen.prototype.mouse_enter = function() {
      return this.mouse_on_container = true;
    };

    AbstractChosen.prototype.mouse_leave = function() {
      return this.mouse_on_container = false;
    };

    AbstractChosen.prototype.input_focus = function(evt) {
      var _this = this;
      if (this.is_multiple) {
        if (!this.active_field) {
          return setTimeout((function() {
            return _this.container_mousedown();
          }), 50);
        }
      } else {
        if (!this.active_field) {
          return this.activate_field();
        }
      }
    };

    AbstractChosen.prototype.input_blur = function(evt) {
      var _this = this;
      if (!this.mouse_on_container) {
        this.active_field = false;
        return setTimeout((function() {
          return _this.blur_test();
        }), 100);
      }
    };

    AbstractChosen.prototype.results_option_build = function(options) {
      var content, data, _i, _len, _ref;
      content = '';
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        data = _ref[_i];
        if (data.group) {
          content += this.result_add_group(data);
        } else {
          content += this.result_add_option(data);
        }
        if (options != null ? options.first : void 0) {
          if (data.selected && this.is_multiple) {
            this.choice_build(data);
          } else if (data.selected && !this.is_multiple) {
            this.single_set_selected_text(data.text);
          }
        }
      }
      return content;
    };

    AbstractChosen.prototype.result_add_option = function(option) {
      var classes, option_el;
      if (!option.search_match) {
        return '';
      }
      if (!this.include_option_in_results(option)) {
        return '';
      }
      classes = [];
      if (!option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("active-result");
      }
      if (option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("disabled-result");
      }
      if (option.selected) {
        classes.push("result-selected");
      }
      if (option.group_array_index != null) {
        classes.push("group-option");
      }
      if (option.classes !== "") {
        classes.push(option.classes);
      }
      option_el = document.createElement("li");
      option_el.className = classes.join(" ");
      option_el.style.cssText = option.style;
      option_el.setAttribute("data-option-array-index", option.array_index);
      option_el.innerHTML = option.search_text;
      return this.outerHTML(option_el);
    };

    AbstractChosen.prototype.result_add_group = function(group) {
      var group_el;
      if (!(group.search_match || group.group_match)) {
        return '';
      }
      if (!(group.active_options > 0)) {
        return '';
      }
      group_el = document.createElement("li");
      group_el.className = "group-result";
      group_el.innerHTML = group.search_text;
      return this.outerHTML(group_el);
    };

    AbstractChosen.prototype.results_update_field = function() {
      this.set_default_text();
      if (!this.is_multiple) {
        this.results_reset_cleanup();
      }
      this.result_clear_highlight();
      this.results_build();
      if (this.results_showing) {
        return this.winnow_results();
      }
    };

    AbstractChosen.prototype.reset_single_select_options = function() {
      var result, _i, _len, _ref, _results;
      _ref = this.results_data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        if (result.selected) {
          _results.push(result.selected = false);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AbstractChosen.prototype.results_toggle = function() {
      if (this.results_showing) {
        return this.results_hide();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.results_search = function(evt) {
      if (this.results_showing) {
        return this.winnow_results();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.winnow_results = function() {
      var escapedSearchText, option, regex, regexAnchor, results, results_group, searchText, startpos, text, zregex, _i, _len, _ref;
      this.no_results_clear();
      results = 0;
      searchText = this.get_search_text();
      escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      regexAnchor = this.search_contains ? "" : "^";
      regex = new RegExp(regexAnchor + escapedSearchText, 'i');
      zregex = new RegExp(escapedSearchText, 'i');
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        option.search_match = false;
        results_group = null;
        if (this.include_option_in_results(option)) {
          if (option.group) {
            option.group_match = false;
            option.active_options = 0;
          }
          if ((option.group_array_index != null) && this.results_data[option.group_array_index]) {
            results_group = this.results_data[option.group_array_index];
            if (results_group.active_options === 0 && results_group.search_match) {
              results += 1;
            }
            results_group.active_options += 1;
          }
          if (!(option.group && !this.group_search)) {
            option.search_text = option.group ? option.label : option.text;  //changed;
            option.search_match = this.search_string_match(option.search_text, regex);
            if (option.search_match && !option.group) {
              results += 1;
            }
            if (option.search_match) {
              if (searchText.length) {
                startpos = option.search_text.search(zregex);
                text = option.search_text.substr(0, startpos + searchText.length) + '</em>' + option.search_text.substr(startpos + searchText.length);
                option.search_text = text.substr(0, startpos) + '<em>' + text.substr(startpos);
              }
              if (results_group != null) {
                results_group.group_match = true;
              }
            } else if ((option.group_array_index != null) && this.results_data[option.group_array_index].search_match) {
              option.search_match = true;
            }
          }
        }
      }
      this.result_clear_highlight();
      if (results < 1 && searchText.length) {
        this.update_results_content("");
        return this.no_results(searchText);
      } else {
        this.update_results_content(this.results_option_build());
        return this.winnow_results_set_highlight();
      }
    };

    AbstractChosen.prototype.search_string_match = function(search_string, regex) {
      var part, parts, _i, _len;
      if (regex.test(search_string)) {
        return true;
      } else if (this.enable_split_word_search && (search_string.indexOf(" ") >= 0 || search_string.indexOf("[") === 0)) {
        parts = search_string.replace(/\[|\]/g, "").split(" ");
        if (parts.length) {
          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            part = parts[_i];
            if (regex.test(part)) {
              return true;
            }
          }
        }
      }
    };

    AbstractChosen.prototype.choices_count = function() {
      var option, _i, _len, _ref;
      if (this.selected_option_count != null) {
        return this.selected_option_count;
      }
      this.selected_option_count = 0;
      _ref = this.form_field.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.selected) {
          this.selected_option_count += 1;
        }
      }
      return this.selected_option_count;
    };

    AbstractChosen.prototype.choices_click = function(evt) {
      evt.preventDefault();
      if (!(this.results_showing || this.is_disabled)) {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.keyup_checker = function(evt) {
      var stroke, _ref;
      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      switch (stroke) {
        case 8:
          if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
            return this.keydown_backstroke();
          } else if (!this.pending_backstroke) {
            this.result_clear_highlight();
            return this.results_search();
          }
          break;
        case 13:
          evt.preventDefault();
          if (this.results_showing) {
            return this.result_select(evt);
          }
          break;
        case 27:
          if (this.results_showing) {
            this.results_hide();
          }
          return true;
        case 9:
        case 38:
        case 40:
        case 16:
        case 91:
        case 17:
          break;
        default:
          return this.results_search();
      }
    };

    AbstractChosen.prototype.clipboard_event_checker = function(evt) {
      var _this = this;
      return setTimeout((function() {
        return _this.results_search();
      }), 50);
    };

    AbstractChosen.prototype.container_width = function() {
      if (this.options.width != null) {
        return this.options.width;
      } else {
        return "" + this.form_field.offsetWidth + "px";
      }
    };

    AbstractChosen.prototype.include_option_in_results = function(option) {
      if (this.is_multiple && (!this.display_selected_options && option.selected)) {
        return false;
      }
      if (!this.display_disabled_options && option.disabled) {
        return false;
      }
      if (option.empty) {
        return false;
      }
      return true;
    };

    AbstractChosen.prototype.search_results_touchstart = function(evt) {
      this.touch_started = true;
      return this.search_results_mouseover(evt);
    };

    AbstractChosen.prototype.search_results_touchmove = function(evt) {
      this.touch_started = false;
      return this.search_results_mouseout(evt);
    };

    AbstractChosen.prototype.search_results_touchend = function(evt) {
      if (this.touch_started) {
        return this.search_results_mouseup(evt);
      }
    };

    AbstractChosen.prototype.outerHTML = function(element) {
      var tmp;
      if (element.outerHTML) {
        return element.outerHTML;
      }
      tmp = document.createElement("div");
      tmp.appendChild(element);
      return tmp.innerHTML;
    };

    AbstractChosen.browser_is_supported = function() {
      if (window.navigator.appName === "Microsoft Internet Explorer") {
        return document.documentMode >= 8;
      }
      if (/iP(od|hone)/i.test(window.navigator.userAgent)) {
        return false;
      }
      if (/Android/i.test(window.navigator.userAgent)) {
        if (/Mobile/i.test(window.navigator.userAgent)) {
          return false;
        }
      }
      return true;
    };

    AbstractChosen.default_multiple_text = "请选择";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "未找到匹配的结果";

    return AbstractChosen;

  })();

  $ = jQuery;

  $.fn.extend({
    chosen: function(options) {
      if (!AbstractChosen.browser_is_supported()) {
        return this;
      }
      return this.each(function(input_field) {
        var $this, chosen;
        $this = $(this);
        chosen = $this.data('chosen');
        if (options === 'destroy' && chosen) {
          chosen.destroy();
        } else if (!chosen) {
          $this.data('chosen', new Chosen(this, options));
        }
      });
    }
  });

  Chosen = (function(_super) {
    __extends(Chosen, _super);

    function Chosen() {
      _ref = Chosen.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Chosen.prototype.setup = function() {
      this.form_field_jq = $(this.form_field);
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.is_rtl = this.form_field_jq.hasClass("chosen-rtl");
    };

    Chosen.prototype.set_up_html = function() {
      var container_classes, container_props;
      container_classes = ["chosen-container"];
      container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
      if (this.inherit_select_classes && this.form_field.className) {
        container_classes.push(this.form_field.className);
      }
      if (this.is_rtl) {
        container_classes.push("chosen-rtl");
      }
      container_props = {
        'class': container_classes.join(' '),
        'style': "width: " + (this.container_width()) + ";",
        'title': this.form_field.title
      };
      if (this.form_field.id.length) {
        container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
      }
      this.container = $("<div />", container_props);
      if (this.is_multiple) {
        this.container.html('<ul class="chosen-choices"><li class="search-field"><input type="text" value="' + this.default_text + '" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chosen-drop"><ul class="chosen-results"></ul></div>');
      } else {
        this.container.html('<a class="chosen-single chosen-default" tabindex="-1"><span>' + this.default_text + '</span><div><b></b></div></a><div class="chosen-drop"><div class="chosen-search"><input type="text" autocomplete="off" /></div><ul class="chosen-results"></ul></div>');
      }
      this.form_field_jq.hide().after(this.container);
      this.dropdown = this.container.find('div.chosen-drop').first();
      this.search_field = this.container.find('input').first();
      this.search_results = this.container.find('ul.chosen-results').first();
      this.search_field_scale();
      this.search_no_results = this.container.find('li.no-results').first();
      if (this.is_multiple) {
        this.search_choices = this.container.find('ul.chosen-choices').first();
        this.search_container = this.container.find('li.search-field').first();
      } else {
        this.search_container = this.container.find('div.chosen-search').first();
        this.selected_item = this.container.find('.chosen-single').first();
      }
      this.results_build();
      this.set_tab_index();
      this.set_label_behavior();
      return this.form_field_jq.trigger("chosen:ready", {
        chosen: this
      });
    };

    Chosen.prototype.register_observers = function() {
      var _this = this;
      this.container.bind('mousedown.chosen', function(evt) {
        _this.container_mousedown(evt);
      });
      this.container.bind('mouseup.chosen', function(evt) {
        _this.container_mouseup(evt);
      });
      this.container.bind('mouseenter.chosen', function(evt) {
        _this.mouse_enter(evt);
      });
      this.container.bind('mouseleave.chosen', function(evt) {
        _this.mouse_leave(evt);
      });
      this.search_results.bind('mouseup.chosen', function(evt) {
        _this.search_results_mouseup(evt);
      });
      this.search_results.bind('mouseover.chosen', function(evt) {
        _this.search_results_mouseover(evt);
      });
      this.search_results.bind('mouseout.chosen', function(evt) {
        _this.search_results_mouseout(evt);
      });
      this.search_results.bind('mousewheel.chosen DOMMouseScroll.chosen', function(evt) {
        _this.search_results_mousewheel(evt);
      });
      this.search_results.bind('touchstart.chosen', function(evt) {
        _this.search_results_touchstart(evt);
      });
      this.search_results.bind('touchmove.chosen', function(evt) {
        _this.search_results_touchmove(evt);
      });
      this.search_results.bind('touchend.chosen', function(evt) {
        _this.search_results_touchend(evt);
      });
      this.form_field_jq.bind("chosen:updated.chosen", function(evt) {
        _this.results_update_field(evt);
      });
      this.form_field_jq.bind("chosen:activate.chosen", function(evt) {
        _this.activate_field(evt);
      });
      this.form_field_jq.bind("chosen:open.chosen", function(evt) {
        _this.container_mousedown(evt);
      });
      this.form_field_jq.bind("chosen:close.chosen", function(evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('blur.chosen', function(evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('keyup.chosen', function(evt) {
        _this.keyup_checker(evt);
      });
      this.search_field.bind('keydown.chosen', function(evt) {
        _this.keydown_checker(evt);
      });
      this.search_field.bind('focus.chosen', function(evt) {
        _this.input_focus(evt);
      });
      this.search_field.bind('cut.chosen', function(evt) {
        _this.clipboard_event_checker(evt);
      });
      this.search_field.bind('paste.chosen', function(evt) {
        _this.clipboard_event_checker(evt);
      });
      if (this.is_multiple) {
        return this.search_choices.bind('click.chosen', function(evt) {
          _this.choices_click(evt);
        });
      } else {
        return this.container.bind('click.chosen', function(evt) {
          evt.preventDefault();
        });
      }
    };

    Chosen.prototype.destroy = function() {
      $(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
      if (this.search_field[0].tabIndex) {
        this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex;
      }
      this.container.remove();
      this.form_field_jq.removeData('chosen');
      return this.form_field_jq.show();
    };

    Chosen.prototype.search_field_disabled = function() {
      this.is_disabled = this.form_field_jq[0].disabled;
      if (this.is_disabled) {
        this.container.addClass('chosen-disabled');
        this.search_field[0].disabled = true;
        if (!this.is_multiple) {
          this.selected_item.unbind("focus.chosen", this.activate_action);
        }
        return this.close_field();
      } else {
        this.container.removeClass('chosen-disabled');
        this.search_field[0].disabled = false;
        if (!this.is_multiple) {
          return this.selected_item.bind("focus.chosen", this.activate_action);
        }
      }
    };

    Chosen.prototype.container_mousedown = function(evt) {
      if (!this.is_disabled) {
        if (evt && evt.type === "mousedown" && !this.results_showing) {
          evt.preventDefault();
        }
        if (!((evt != null) && ($(evt.target)).hasClass("search-choice-close"))) {
          if (!this.active_field) {
            if (this.is_multiple) {
              this.search_field.val("");
            }
            $(this.container[0].ownerDocument).bind('click.chosen', this.click_test_action);
            this.results_show();
          } else if (!this.is_multiple && evt && (($(evt.target)[0] === this.selected_item[0]) || $(evt.target).parents("a.chosen-single").length)) {
            evt.preventDefault();
            this.results_toggle();
          }
          return this.activate_field();
        }
      }
    };

    Chosen.prototype.container_mouseup = function(evt) {
      if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
        return this.results_reset(evt);
      }
    };

    Chosen.prototype.search_results_mousewheel = function(evt) {
      var delta;
      if (evt.originalEvent) {
        delta = -evt.originalEvent.wheelDelta || evt.originalEvent.detail;
      }
      if (delta != null) {
        evt.preventDefault();
        if (evt.type === 'DOMMouseScroll') {
          delta = delta * 40;
        }
        return this.search_results.scrollTop(delta + this.search_results.scrollTop());
      }
    };

    Chosen.prototype.blur_test = function(evt) {
      if (!this.active_field && this.container.hasClass("chosen-container-active")) {
        return this.close_field();
      }
    };

    Chosen.prototype.close_field = function() {
      $(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
      this.active_field = false;
      this.results_hide();
      this.container.removeClass("chosen-container-active");
      this.clear_backstroke();
      this.show_search_field_default();
      return this.search_field_scale();
    };

    Chosen.prototype.activate_field = function() {
      this.container.addClass("chosen-container-active");
      this.active_field = true;
      this.search_field.val(this.search_field.val());
      return this.search_field.focus();
    };

    Chosen.prototype.test_active_click = function(evt) {
      var active_container;
      active_container = $(evt.target).closest('.chosen-container');
      if (active_container.length && this.container[0] === active_container[0]) {
        return this.active_field = true;
      } else {
        return this.close_field();
      }
    };

    Chosen.prototype.results_build = function() {
      this.parsing = true;
      this.selected_option_count = null;
      this.results_data = SelectParser.select_to_array(this.form_field);
      if (this.is_multiple) {
        this.search_choices.find("li.search-choice").remove();
      } else if (!this.is_multiple) {
        this.single_set_selected_text();
        if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
          this.search_field[0].readOnly = true;
          this.container.addClass("chosen-container-single-nosearch");
        } else {
          this.search_field[0].readOnly = false;
          this.container.removeClass("chosen-container-single-nosearch");
        }
      }
      this.update_results_content(this.results_option_build({
        first: true
      }));
      this.search_field_disabled();
      this.show_search_field_default();
      this.search_field_scale();
      return this.parsing = false;
    };

    Chosen.prototype.result_do_highlight = function(el) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
      if (el.length) {
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.addClass("highlighted");
        maxHeight = parseInt(this.search_results.css("maxHeight"), 10);
        visible_top = this.search_results.scrollTop();
        visible_bottom = maxHeight + visible_top;
        high_top = this.result_highlight.position().top + this.search_results.scrollTop();
        high_bottom = high_top + this.result_highlight.outerHeight();
        if (high_bottom >= visible_bottom) {
          return this.search_results.scrollTop((high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0);
        } else if (high_top < visible_top) {
          return this.search_results.scrollTop(high_top);
        }
      }
    };

    Chosen.prototype.result_clear_highlight = function() {
      if (this.result_highlight) {
        this.result_highlight.removeClass("highlighted");
      }
      return this.result_highlight = null;
    };

    Chosen.prototype.results_show = function() {
      if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
        this.form_field_jq.trigger("chosen:maxselected", {
          chosen: this
        });
        return false;
      }
      this.container.addClass("chosen-with-drop");
      this.results_showing = true;
      this.search_field.focus();
      this.search_field.val(this.search_field.val());
      this.winnow_results();
      return this.form_field_jq.trigger("chosen:showing_dropdown", {
        chosen: this
      });
    };

    Chosen.prototype.update_results_content = function(content) {
      return this.search_results.html(content);
    };

    Chosen.prototype.results_hide = function() {
      if (this.results_showing) {
        this.result_clear_highlight();
        this.container.removeClass("chosen-with-drop");
        this.form_field_jq.trigger("chosen:hiding_dropdown", {
          chosen: this
        });
      }
      return this.results_showing = false;
    };

    Chosen.prototype.set_tab_index = function(el) {
      var ti;
      if (this.form_field.tabIndex) {
        ti = this.form_field.tabIndex;
        this.form_field.tabIndex = -1;
        return this.search_field[0].tabIndex = ti;
      }
    };

    Chosen.prototype.set_label_behavior = function() {
      var _this = this;
      this.form_field_label = this.form_field_jq.parents("label");
      if (!this.form_field_label.length && this.form_field.id.length) {
        this.form_field_label = $("label[for='" + this.form_field.id + "']");
      }
      if (this.form_field_label.length > 0) {
        return this.form_field_label.bind('click.chosen', function(evt) {
          if (_this.is_multiple) {
            return _this.container_mousedown(evt);
          } else {
            return _this.activate_field();
          }
        });
      }
    };

    Chosen.prototype.show_search_field_default = function() {
      if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
        this.search_field.val(this.default_text);
        return this.search_field.addClass("default");
      } else {
        this.search_field.val("");
        return this.search_field.removeClass("default");
      }
    };

    Chosen.prototype.search_results_mouseup = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target.length) {
        this.result_highlight = target;
        this.result_select(evt);
        return this.search_field.focus();
      }
    };

    Chosen.prototype.search_results_mouseover = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target) {
        return this.result_do_highlight(target);
      }
    };

    Chosen.prototype.search_results_mouseout = function(evt) {
      if ($(evt.target).hasClass("active-result" || $(evt.target).parents('.active-result').first())) {
        return this.result_clear_highlight();
      }
    };

    Chosen.prototype.choice_build = function(item) {
      var choice, close_link,
        _this = this;
      choice = $('<li />', {
        "class": "search-choice"
      }).html("<span>" + item.html + "</span>");
      if (item.disabled) {
        choice.addClass('search-choice-disabled');
      } else {
        close_link = $('<a />', {
          "class": 'search-choice-close',
          'data-option-array-index': item.array_index
        });
        close_link.bind('click.chosen', function(evt) {
          return _this.choice_destroy_link_click(evt);
        });
        choice.append(close_link);
      }
      return this.search_container.before(choice);
    };

    Chosen.prototype.choice_destroy_link_click = function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!this.is_disabled) {
        return this.choice_destroy($(evt.target));
      }
    };

    Chosen.prototype.choice_destroy = function(link) {
      if (this.result_deselect(link[0].getAttribute("data-option-array-index"))) {
        this.show_search_field_default();
        if (this.is_multiple && this.choices_count() > 0 && this.search_field.val().length < 1) {
          this.results_hide();
        }
        link.parents('li').first().remove();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.results_reset = function() {
      this.reset_single_select_options();
      this.form_field.options[0].selected = true;
      this.single_set_selected_text();
      this.show_search_field_default();
      this.results_reset_cleanup();
      this.form_field_jq.trigger("change");
      if (this.active_field) {
        return this.results_hide();
      }
    };

    Chosen.prototype.results_reset_cleanup = function() {
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.selected_item.find("abbr").remove();
    };

    Chosen.prototype.result_select = function(evt) {
      var high, item;
      if (this.result_highlight) {
        high = this.result_highlight;
        this.result_clear_highlight();
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field_jq.trigger("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        if (this.is_multiple) {
          high.removeClass("active-result");
        } else {
          this.reset_single_select_options();
        }
        item = this.results_data[high[0].getAttribute("data-option-array-index")];
        item.selected = true;
        this.form_field.options[item.options_index].selected = true;
        this.selected_option_count = null;
        if (this.is_multiple) {
          this.choice_build(item);
        } else {
          this.single_set_selected_text(item.text);
        }
        if (!((evt.metaKey || evt.ctrlKey) && this.is_multiple)) {
          this.results_hide();
        }
        this.search_field.val("");
        if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
          this.form_field_jq.trigger("change", {
            'selected': this.form_field.options[item.options_index].value
          });
        }
        this.current_selectedIndex = this.form_field.selectedIndex;
        return this.search_field_scale();
      }
    };

    Chosen.prototype.single_set_selected_text = function(text) {
      if (text == null) {
        text = this.default_text;
      }
      if (text === this.default_text) {
        this.selected_item.addClass("chosen-default");
      } else {
        this.single_deselect_control_build();
        this.selected_item.removeClass("chosen-default");
      }
      return this.selected_item.find("span").text(text);
    };

    Chosen.prototype.result_deselect = function(pos) {
      var result_data;
      result_data = this.results_data[pos];
      if (!this.form_field.options[result_data.options_index].disabled) {
        result_data.selected = false;
        this.form_field.options[result_data.options_index].selected = false;
        this.selected_option_count = null;
        this.result_clear_highlight();
        if (this.results_showing) {
          this.winnow_results();
        }
        this.form_field_jq.trigger("change", {
          deselected: this.form_field.options[result_data.options_index].value
        });
        this.search_field_scale();
        return true;
      } else {
        return false;
      }
    };

    Chosen.prototype.single_deselect_control_build = function() {
      if (!this.allow_single_deselect) {
        return;
      }
      if (!this.selected_item.find("abbr").length) {
        this.selected_item.find("span").first().after("<abbr class=\"search-choice-close\"></abbr>");
      }
      return this.selected_item.addClass("chosen-single-with-deselect");
    };

    Chosen.prototype.get_search_text = function() {
      if (this.search_field.val() === this.default_text) {
        return "";
      } else {
        return $('<div/>').text($.trim(this.search_field.val())).html();
      }
    };

    Chosen.prototype.winnow_results_set_highlight = function() {
      var do_high, selected_results;
      selected_results = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
      do_high = selected_results.length ? selected_results.first() : this.search_results.find(".active-result").first();
      if (do_high != null) {
        return this.result_do_highlight(do_high);
      }
    };

    Chosen.prototype.no_results = function(terms) {
      var no_results_html;
      no_results_html = $('<li class="no-results">' + this.results_none_found + ' "<span></span>"</li>');
      no_results_html.find("span").first().html(terms);
      this.search_results.append(no_results_html);
      return this.form_field_jq.trigger("chosen:no_results", {
        chosen: this
      });
    };

    Chosen.prototype.no_results_clear = function() {
      return this.search_results.find(".no-results").remove();
    };

    Chosen.prototype.keydown_arrow = function() {
      var next_sib;
      if (this.results_showing && this.result_highlight) {
        next_sib = this.result_highlight.nextAll("li.active-result").first();
        if (next_sib) {
          return this.result_do_highlight(next_sib);
        }
      } else {
        return this.results_show();
      }
    };

    Chosen.prototype.keyup_arrow = function() {
      var prev_sibs;
      if (!this.results_showing && !this.is_multiple) {
        return this.results_show();
      } else if (this.result_highlight) {
        prev_sibs = this.result_highlight.prevAll("li.active-result");
        if (prev_sibs.length) {
          return this.result_do_highlight(prev_sibs.first());
        } else {
          if (this.choices_count() > 0) {
            this.results_hide();
          }
          return this.result_clear_highlight();
        }
      }
    };

    Chosen.prototype.keydown_backstroke = function() {
      var next_available_destroy;
      if (this.pending_backstroke) {
        this.choice_destroy(this.pending_backstroke.find("a").first());
        return this.clear_backstroke();
      } else {
        next_available_destroy = this.search_container.siblings("li.search-choice").last();
        if (next_available_destroy.length && !next_available_destroy.hasClass("search-choice-disabled")) {
          this.pending_backstroke = next_available_destroy;
          if (this.single_backstroke_delete) {
            return this.keydown_backstroke();
          } else {
            return this.pending_backstroke.addClass("search-choice-focus");
          }
        }
      }
    };

    Chosen.prototype.clear_backstroke = function() {
      if (this.pending_backstroke) {
        this.pending_backstroke.removeClass("search-choice-focus");
      }
      return this.pending_backstroke = null;
    };

    Chosen.prototype.keydown_checker = function(evt) {
      var stroke, _ref1;
      stroke = (_ref1 = evt.which) != null ? _ref1 : evt.keyCode;
      this.search_field_scale();
      if (stroke !== 8 && this.pending_backstroke) {
        this.clear_backstroke();
      }
      switch (stroke) {
        case 8:
          this.backstroke_length = this.search_field.val().length;
          break;
        case 9:
          if (this.results_showing && !this.is_multiple) {
            this.result_select(evt);
          }
          this.mouse_on_container = false;
          break;
        case 13:
          evt.preventDefault();
          break;
        case 38:
          evt.preventDefault();
          this.keyup_arrow();
          break;
        case 40:
          evt.preventDefault();
          this.keydown_arrow();
          break;
      }
    };

    Chosen.prototype.search_field_scale = function() {
      var div, f_width, h, style, style_block, styles, w, _i, _len;
      if (this.is_multiple) {
        h = 0;
        w = 0;
        style_block = "position:absolute; left: -1000px; top: -1000px; display:none;";
        styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
        for (_i = 0, _len = styles.length; _i < _len; _i++) {
          style = styles[_i];
          style_block += style + ":" + this.search_field.css(style) + ";";
        }
        div = $('<div />', {
          'style': style_block
        });
        div.text(this.search_field.val());
        $('body').append(div);
        w = div.width() + 25;
        div.remove();
        f_width = this.container.outerWidth();
        if (w > f_width - 10) {
          w = f_width - 10;
        }
        return this.search_field.css({
          'width': w + 'px'
        });
      }
    };

    return Chosen;

  })(AbstractChosen);

}).call(this);

/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (value !== undefined && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));
