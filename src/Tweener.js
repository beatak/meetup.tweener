/*
class: Meetup.Tweener

Meetup.Tweener is a controller object of Tweening Animation. It is
heavily inspired by Zeh Fernando's Tweener and its
JavaScript-ported JSTweener by Yuichi Tateno.

It *requires CSS manupilation library*. Currently MochiKit is
default, jQuery is supported. You can make a adaptor simply by
writing up a wrapper object.

Created on:
  Feburary 4, 2009

Author:
  Takashi Mizohata <takashi@meetup.com>

Require:
  - Style manupilation Library in order to modify Style on DOM Object:
    MochiKit.Style - supported
    jQuery - supported
    Prototype - not yet supported
    MooTools - not yet supported
    Others - or you can implement your own. See the source.

See Also:
  - http://en.wikipedia.org/wiki/Tweening
  - http://hosted.zeh.com.br/tweener/docs/en-us/
  - http://github.com/hotchpotch/hotchpotch.github.com/raw/42bdc6fce9b656a74525e6565f778c93f149839f/javascripts/JSTweener.js

Note:
  Keeping this compatible to Zeh's original AS3 Tweener API is one of
my goal, but make this perfectly compatible to AS3 Tweener API is not
my purpose and doesn't make sense since ActionScript and JavaScript
runs in different implementation.  The following list shows methods
from AS3 Tweener API which are not implemented:
  - addCaller
  - getVersion
  - getTweenCount
  - registerSpecialProperty
  - registerSpecialPropertyModifier
  - registerSpecialPropertySplitter
  - registerTransition
  - updateTime
  - setTimeScale

Todo:
  - recheck style names and Tweenable properties
  - complex easing functions should be inlined?  Is JS smart enough
    to do beta-transform automatically?
*/

if (typeof Meetup.Tweener === 'undefined') {
  Meetup.Tweener = {};
}

Meetup.Tweener.easingFunctionsLowerCase = {};
Meetup.Tweener.frameInterval            = 0;
Meetup.Tweener.isUsing                  = 'MochiKit';
Meetup.Tweener.styleLib                 = null;
Meetup.Tweener.tweens                   = {};
Meetup.Tweener.FPS                      = 55;
Meetup.Tweener.VERSION                  = '0.5.0';

/*
variable: DEFAULT_PARAMS

Default parameters for Tweening

  time - 1 (_number_ in second convention)
  transition - easoutexpo (_string_ or _function_)
  delay - 0 (_number_ in second convention)
  onStart - undefined (_function_)
  onStartParams - undefined (_array_)
  onUpdate - undefined (_function_)
  onUpdateParams - undefined (_array_)
  onComplete - undefined (_function_)
  onCompleteParams - undefined (_array_)
*/
Meetup.Tweener.DEFAULT_PARAMS = {
  'time': 1,
  'transition': 'easeoutcubic',
  'delay': 0,
  'onStart': undefined,
  'onStartParams': undefined,
  'onUpdate': undefined,
  'onUpdateParams': undefined,
  'onComplete': undefined,
  'onCompleteParams': undefined
};

/*
variable: REGEX_NUM

RegularExpression for JavaScript Number literal

  REGEX_NUM - /\-*\d*\.\d+|\-*\d+/
*/
Meetup.Tweener.REGEX_NUM = new RegExp(/\-*\d*\.\d+|\-*\d+/);

/*
variable: STYLE_NAMES

Possible names that uses for CSSStyleObject. FIX ME only Firefox.
Safari way? IE Way?

  STYLE_NAMES - (See source)

NOT tweened properties:
  "background-attachment", "background-position","background-repeat","border-bottom-style", "border-collapse", "border-left-style","border-right-style", "border-top-style",  "caption-side", "clear", "clip", "clip-path", "clip-rule",  "color-interpolation", "color-interpolation-filters",  "counter-increment", "counter-reset", "cursor", "direction", "display",  "dominant-baseline", "empty-cells",  "fill-rule", "filter", "float", "flood-color", "flood-opacity", "font-family",  "font-size-adjust", "font-style", "font-variant",  "ime-mode",  "list-style-type",  "marker-end", "marker-mid","marker-start", "mask",  "outline-style", "overflow", "overflow-x", "overflow-y",   "page-break-after", "page-break-before", "pointer-events", "position", "quotes",  "shape-rendering",  "stroke", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "table-layout", "text-align", "text-anchor", "text-decoration",  "text-rendering", "text-transform",  "unicode-bidi", "vertical-align", "visibility", "white-space",  "-moz-appearance", "-moz-background-clip", "-moz-background-inline-policy", "-moz-background-origin", "-moz-binding",  "-moz-box-align", "-moz-box-direction", "-moz-box-flex", "-moz-box-ordinal-group", "-moz-box-orient", "-moz-box-pack",  "-moz-user-focus", "-moz-user-input", "-moz-user-modify", "-moz-user-select"
*/
Meetup.Tweener.STYLE_NAMES = ["background-color", "background-image",   "border-bottom-color", "border-bottom-width", "border-left-color",  "border-left-width", "border-right-color", "border-right-width", "border-spacing", "border-top-color", "border-top-width", "bottom", "color", "content", "fill", "fill-opacity", "font-size", "font-weight", "height", "left", "letter-spacing", "lighting-color", "line-height", "list-style-image", "list-style-position", "margin-bottom", "margin-left", "margin-right", "margin-top", "marker-offset", "max-height", "max-width", "min-height", "min-width", "opacity", "outline-color", "outline-offset", "outline-width", "padding-bottom", "padding-left", "padding-right", "padding-top", "right", "stop-color", "stop-opacity", "stroke-dashoffset",  "stroke-opacity", "stroke-width", "text-indent", "top", "width", "word-spacing", "z-index", "-moz-border-bottom-colors", "-moz-border-left-colors", "-moz-border-radius-bottomleft", "-moz-border-radius-bottomright", "-moz-border-radius-topleft", "-moz-border-radius-topright", "-moz-border-right-colors", "-moz-border-top-colors", "-moz-box-sizing", "-moz-column-count", "-moz-column-gap", "-moz-column-width", "-moz-float-edge", "-moz-force-broken-image-icon", "-moz-image-region", "-moz-outline-radius-bottomleft", "-moz-outline-radius-bottomright", "-moz-outline-radius-topleft", "-moz-outline-radius-topright"];

/*
method: addTween

Makes a tween instance, and start it immediately.  If you want to
control each tween separately, you should keep a returning instance.
See <Meetup.Tweener.init> for the actual implementation.

argument:
  target - (object) Target DOM Element you want to animate
  params - (object) passing animation params. See: <Meetup.Tweener.DEFAULT_PARAMS>
  notNow - *Optional* (boolean) pass true here, if you don't want to start right away

return:
  (Meetup.Tweener.Tween)
*/
Meetup.Tweener.addTween = function (target, params, notNow) {
  this.init();
  return this.addTween(target, params, notNow);
};

/*
method: getTweens

Returns the name of the properties of a given object that has a 
tweening acting on them. Delayed and paused tweenings are also listed.

argument:
  target - (object)

return:
  (array) - a list of strings containing the name of the properties currently beeing tweened.
*/
Meetup.Tweener.getTweens = function (target) {
  var tween, arr = [];
  tween = this.findTween(target);
  if (tween !== null) {
    var i, j;
    for (i in tween.finishingNormalProperties) {
      arr[arr.length] = i;
    }
    for (j in tween.finishingStyleProperties) {
      arr[arr.length] = j;
    }
  }
  return arr;
};

/*
method: isTweening

Returns whether the object has any tweening acting on one of its
properties or not. Delayed or paused tweenings count as a valid
tweening.

argument:
  target - (object)

return:
  (boolean)
*/
Meetup.Tweener.isTweening = function (target) {
  var result = false;
  if (Meetup.Tweener.findTween(target)) {
    result = true;
  }
  return result;
};

/*
method: pauseAllTweens

Pauses all tweenings for all objects currently taking place, including
tweenings currently delayed. And returns true if any property tweening 
was successfully paused, false if otherwise.

return:
  (boolean)
*/
Meetup.Tweener.pauseAllTweens = function () {
  var i, result = false;
  for (i in this.tweens) {
    if (this.tweens[i] && this.tweens[i].stop()) {
      result = true;
    }
  }
  return result;
};

/*
method: pauseTweens

Pauses tweening of a given object. And returns true if any property 
tweening was successfully paused, false if otherwise.  Not like AS3 
Tweener, this doesn't not accept more than one argument.

argument:
  target - (object)

return:
  (boolean)
*/
Meetup.Tweener.pauseTweens = function (target) {
  var tween, result = false;
  tween = this.findTween(target);
  if ((tween !== null) && (tween.stop())) {
    result = true;
  }
  return result;
};

/*
method: removeAllTweens

Removes all tweenings, so they are not executed anymore, nor are their
events called. All currently existing tweenings are removed, 
including tweenings currently delayed or paused.

return:
  (boolean)
*/
Meetup.Tweener.removeAllTweens = function () {
  var i, result = false;
  for (i in this.tweens) {
    if (this.tweens[i] && this.tweens[i].discard()) {
      result = true;
    }
  }
  this.tweens = {};
  return result;
};

/*
method: removeTweens

Removes specific tween of a given object, so they are not executed 
anymore, nor are their events called.  And returns true if any 
property tweening was successfully removed, false if otherwise.  
Note: removeTweens() does not take more than one argument, not 
like AS3 Tweener.

arguemnt:
  target - (object)

return:
  (boolean)
*/
Meetup.Tweener.removeTweens = function (target) {
  var tween  = Meetup.Tweener.findTween(target),
      result = false;
  if (tween) {
    tween.discard();
    result = true;
  }
  return result;
};

/*
method: resumeAllTweens

Resumes all tweenings that have been paused with 
<Meetup.Tweener.pauseTweens>.  And returns true if any property 
tweening was successfully resumed, false if otherwise.

return:
  (boolean)
*/
Meetup.Tweener.resumeAllTweens = function () {
  var i, result = false;
  for (i in this.tweens) {
    if (this.tweens[i] && this.tweens[i].start()) {
      result = true;
    }
  }
  return result;
};

/*
method: resumeTweens

Resumes specific tweenings of specific objects that have been paused 
with <Meetup.Tweener.pauseTweens>.  Returns true if any property 
tweening was successfully resumed, false if otherwise.

argument:
  target - (object)

return:
  (boolean)
*/
Meetup.Tweener.resumeTweens = function (target) {
  var tween  = Meetup.Tweener.findTween(target),
      result = false;
  if (tween  && tween.start()) {
    result = true;
  }
  return result;
};

/*
method: compileColor

[INTERNAL] Accepts an array and converts it into "#RRGGBB" string.

argument:
  arr - (array) [red, green, blue]

return:
  (string)
*/
Meetup.Tweener.compileColor = function (arr) {
  var i, val, hex, result = ['#'];
  for (i = 0; i < 3; ++i) {
    if (arr[i] < 0) {
      val = 0;
    }
    else if (arr[i] > 255) {
      val = 255;
    }
    else {
      val = Math.round(arr[i]);
    }
    hex = val.toString(16);
    if (hex.length < 2) {
      hex = '0' + hex;
    }
    result[result.length] = hex;
  }
  return result.join('');
};

/*
method: configureStyleLib

[INTERNAL] Sets up CSS manipulation lib for Meetup.Tweener.  In order 
to be supported by Meetup.Tweener, the style lib needs to have 1) a 
method that returns computed style for a given DOM element and its 
property and 2) a method that set a css style value to given DOM 
element.

argument:
  lib - (*)

return:
  (undefined)
*/
Meetup.Tweener.configureStyleLib = function (lib) {
  lib = lib || Meetup.Tweener.isUsing;
  switch (typeof lib) {
    case 'object':
      Meetup.Tweener.styleLib = lib;
    break;
    case 'string':
      Meetup.Tweener.styleLib = {};
      if (lib === 'MochiKit') {
        Meetup.Tweener.styleLib.get = function (elm, prop) {
          return MochiKit.Style.getStyle(elm, prop);
        };
        Meetup.Tweener.styleLib.set = function (elm, prop, value) {
          var obj = {};
          obj[prop] = value;
          return MochiKit.Style.setStyle(elm, obj);
        };
        Meetup.Tweener.styleLib.bulkSet = function (elm, obj) {
          return MochiKit.Style.setStyle(elm, obj);
        };
      }
      else if (lib === 'jQuery') {
        Meetup.Tweener.styleLib.get = function (elm, prop) {
          return jQuery(elm).css(prop);
        };
        Meetup.Tweener.styleLib.set = function (elm, prop, value) {
          return jQuery(elm).css(prop, value);
        };
        Meetup.Tweener.styleLib.bulkSet = function (elm, obj) {
          return jQuery(elm).css(obj);
        };
      }
    break;
  }
  if (Meetup.Tweener.styleLib === null) {
    throw new Error('not right');
  }
};

/*
method: diffColor

[INTERNAL] Accepts two color value arrays and returns an array that is
a difference values of given two.

argument:
  fut - (array)
  cur - (array)

return:
  (array) [red, green, blue]
*/
Meetup.Tweener.diffColor = function (fut, cur) {
  return [
    (fut[0] - cur[0]),
    (fut[1] - cur[1]),
    (fut[2] - cur[2])
  ];
};

/*
method: findTween

[INTERNAL] Returns Meetup.Tweener.Tween instance by a given criteria.

argument:
  criteria - (string) or (object)

return:
  (Meetup.Tweener.Tween) or (null)
*/
Meetup.Tweener.findTween = function (criteria) {
  var result;
  if (typeof criteria === 'string') {
    result = this.tweens[criteria];
  }
  else if (!(criteria instanceof Object) || (criteria === null)) {
    result = null;
  }
  else if (criteria instanceof Meetup.Tweener.Tween) {
    result = criteria;
  }
  else {
    var twid;
    if (Meetup.Tweener.isDOMNode(criteria)) {
      twid = criteria.getAttribute('tweenId');
    }
    else {
      twid = criteria.tweendId;
    }
    console.log('tweenId: ' + twid);
    if (twid) {
      result = this.tweens[twid];
    }
    else {
      result = null;
    }
  }
  if (result === undefined) {
    result = null;
  }
  return result;
};

/*
method: init

[INTERNAL] Initializes Meetup.Tweener.

return:
  (undefined)
*/
Meetup.Tweener.init = function () {
  this.configureStyleLib();
  this.frameInterval = parseInt(1000 / Meetup.Tweener.FPS, 10);

  // redefine addTween for normal loop.
  this.addTween = function (target, params, notNow) {
    notNow = notNow || false;
    var twid = 'MeetupTw' + Meetup.Tweener.now();
    this.tweens[twid] = new Meetup.Tweener.Tween(target, params, twid);
    if (Meetup.Tweener.isDOMNode(target)) {
      target.setAttribute('tweenId', twid);
    }
    else {
      target.tweenId = twid;
    }
    if (!notNow) {
      this.tweens[twid].start();
    }
    return this.tweens[twid];
  };

  delete this.init;
};

/*
method: isDOMNode

[INTERNAL] Returns true when a given object is a DOM element.

argument:
  obj - (object)

return:
  (boolean)
*/
Meetup.Tweener.isDOMNode = function (obj) {
  var result    = false,
      str_type  = typeof obj.getElementsByTagName;
  if (str_type === 'function') {
    result = true;
  }
  else if (str_type === 'object') {
    // IE seems to return 'object' for every DOM function..!
    if (obj.nodeName) {
      result = true;
    }
  }
  return result;
};

/*
method: isStyleTweenable

[INTERNAL] Returns true if a given key is CSS Style name and that
is tweenable property.

argument:
  key - (string)

return:
  (boolean)
*/
Meetup.Tweener.isStyleTweenable = function (key) {
  var SEP     = String.fromCharCode(31),
      styles  = Meetup.Tweener.STYLE_NAMES.join(SEP);
  Meetup.Tweener.isStyleTweenable = function (k) {
    var result = true;
    if (styles.indexOf(k) < 0) {
      result = false;
    }
    return result;
  };
  return Meetup.Tweener.isStyleTweenable(key);
};

/*
method: now

[INTERNAL] Returns epoch millisecond, inspired by jQuery.

return:
  (Number)
*/
Meetup.Tweener.now = function () {
  return +new Date();
};

/*
method: parseColorValue

[INTERNAL] Parses CSS value returns into array. If no values, it will
return [255, 255, 255]

argument:
  val - (string)

return:
  (array) [red, green, blue]
*/
Meetup.Tweener.parseColorValue = function (val) {
  if (typeof val !== 'string' || val === '' || val === 'transparent') {
    return [255, 255, 255];
  }
  var first = val.substring(0, 1);
  if (first === '#') {
    return Meetup.Tweener.parseColorSharp(val);
  }
  else if (first === 'r') {
    return Meetup.Tweener.parseColorRGB(val);
  }
  throw new Error('Unknown value type: ' + val);
};

/*
method: parseColorRGB

[INTERNAL] Parses a color string represented as "rgb(XXX,XXX,XXX)" and
converts into an array.

argument:
  val - (string)

return:
  (array) [red, green, blue]
*/
Meetup.Tweener.parseColorRGB = function (val) {
  var arr = val.slice(4, -1).split(',');
  return [parseInt(arr[0], 10), parseInt(arr[1], 10), parseInt(arr[2], 10)];
};

/*
method: parseColorSharp

[INTERNAL] Parses a color string represented as "#RGB" or "#RRGGBB" 
and converts into an array.

argument:
  val - (string)

return:
  (array) [red, green, blue]
*/
Meetup.Tweener.parseColorSharp = function (val) {
  var result  = [0, 0, 0],
      len     = val.length;
  if (len === 4) {
    var r = val.substring(1, 2),
        g = val.substring(2, 3),
        b = val.substring(3);
    result[0] = parseInt((r+r), 16);
    result[1] = parseInt((g+g), 16);
    result[2] = parseInt((b+b), 16);
  }
  else {
    result[0] = parseInt(val.substring(1, 3), 16);
    result[1] = parseInt(val.substring(3, 5), 16);
    result[2] = parseInt(val.substring(5, 7), 16);
  }
  return result;
};

/*
method: parseValue

[INTERNAL] Parses CSS value returns into value and unit separately.
If no values, it will return {value: 0, unit: null}

argument:
  val - (string)

return:
  (object) {value, unit}
*/
Meetup.Tweener.parseValue = function (val) {
  //console.log('parseValue: ' + val);
  var str, result = {'value': 0, 'unit': null};
  if (typeof val === 'undefined') {
    str = '0';
  }
  else {
    if (val) {
      str = val.toString();
    }
    else {
      str = '0';
    }
  }
  // parsing value ____________________
  if (str.match(/\d/)) {
    result.value = Number(str.match(Meetup.Tweener.REGEX_NUM));
  }
  // parsing unit _____________________
  if (str.match(/in\s*\;*/)) {
    result.unit = 'in';
  }
  else if (str.match(/cm\;*/)) {
    result.unit = 'cm';
  }
  else if (str.match(/mm\;*/)) {
    result.unit = 'mm';
  }
  else if (str.match(/em\;*/)) {
    result.unit = 'em';
  }
  else if (str.match(/ex\;*/)) {
    result.unit = 'ex';
  }
  else if (str.match(/pc\;*/)) {
    result.unit = 'pc';
  }
  else if (str.match(/pt\;*/)) {
    result.unit = 'pt';
  }
  else if (str.match(/px\;*/)) {
    result.unit = 'px';
  }
  else if (str.match(/%\;*/)) {
    result.unit = '%';
  }
  //console.log(result);
  return result;
};

/*
method: removeTweenById

[INTERNAL] Stops tweening for a Meetup.Tweener.Tween instance by a 
given tween id, and delete from Meetup.Tweener's internal list.

argument:
  id - (string)

return:
  (undefined)
*/
Meetup.Tweener.removeTweenById = function (id) {
  var obj = this.tweens[id];
  if (obj && obj.isLooping) {
    obj.stop();
  }
  delete this.tweens[id];
};

/*
method: smoothValue

[INTERNAL] Sees and returns what a given object has on a given 
property and if that is not number, sets an appropriate number to it.

argument:
  obj - (object)
  prop - (string)

return:
  (number)
*/
Meetup.Tweener.smoothValue = function (obj, prop) {
  var result, str_type = typeof obj[prop];
  if (str_type === 'undefined') {
    result = obj[prop] = 0;
  }
  else if (str_type != 'number') {
    result = obj[prop] = Number(obj[prop].toString().match(Meetup.Tweener.REGEX_NUM));
  }
  else {
    result = obj[prop];
  }
  return result;
};


// Internal Class Tween
// ====================

/*
class: Meetup.Tweener.Tween

Meetup.Tweener.Tween is an actual implementation of tweening, based on
Robert Penner's Easing functions, and supports DOM animation.  You
are not expected to call this constructor.  By calling
compensateParams(), default parameters will be copied.  See
also: <Meetup.Tweener.DEFAULT_PARAMS>.

argument:
  target - (object)
  params - (object)
  twid - (string) Tweener internal id

return:
  (Meetup.Tweener.Tween)
*/
Meetup.Tweener.Tween = function (target, params, twid) {
  this.target           = target;
  this.tweenId          = twid;
  this.isLooping        = false;
  this.processes        = [];
  this.timerPointer     = null;
  this.finishingStyleProperties = {};
  this.finishingNormalProperties = {};
  this.easing           = null;
  this.startTime        = null;
  this.endTime          = null;
  this.elapsedTime      = 0;
  this.duration         = null;
  this.innerStart       = null;
  this.innerUpdate      = null;
  this.innerComplete    = null;
  this.innerEventLoop   = null;

  // setting parameters
  Meetup.Tweener.Tween.compensateParams(this, params);
  this.duration   = this.time * 1000;
  this.easing     = (typeof this.transition === 'function') ?
    this.transition :
    Meetup.Tweener.easingFunctionsLowerCase[this.transition.toLowerCase()];
  this.createInners();
  delete this.createInners;

  // setting what properties will be tweened
  // by compensateParams(), params here are now only transitioning params.
  var key, change, current, future, tweentype, func, bucket = null;

  // branching property process
  if (!Meetup.Tweener.isDOMNode(target)) {
    // Process for NOT DOM Node
    for (key in params) {
      current = Meetup.Tweener.smoothValue(target, key);
      future  = Meetup.Tweener.smoothValue(params, key);
      change  =  future - current;
      this.finishingNormalProperties[key] = future;
      this.processes[this.processes.length] = Meetup.Tweener.Tween.generateDirectProcess(
        this.target,
        key,
        this.easing,
        current,
        change,
        this.duration);
    }
  }
  else {
    // Process for DOM Node
    for (key in params) {
      func = null;
      // if the passed key is Tweenable CSS Style?
      if (Meetup.Tweener.isStyleTweenable(key)) {
        if (bucket === null) {
          bucket = {};
        }
        bucket[key] = params[key];
        continue;
      }
      else {
        current = Meetup.Tweener.smoothValue(target, key);
        future  = Meetup.Tweener.smoothValue(params, key);
        change  = future - current;
        func    = Meetup.Tweener.Tween.generateDirectProcess(
          this.target,
          key,
          this.easing,
          current,
          change,
          this.duration);
        this.finishingNormalProperties[key] = future;
      }

      this.processes[this.processes.length] = func;
    }
  }
  if (bucket !== null) {
    this.processes[this.processes.length] = this.createCssProcess(bucket);
  }
  delete this.createCssProcess;
};

Meetup.Tweener.Tween.prototype.createCssProcess = function (params) {
  var key, obj, current, future, change, ms = [];
  for (key in params) {
    obj = {};
    obj.key = key;
    if (key.match(/color/)) {
      current = Meetup.Tweener.parseColorValue(Meetup.Tweener.styleLib.get(this.target, key));
      future  = Meetup.Tweener.parseColorValue(params[key]);
      change  = Meetup.Tweener.diffColor(future, current);
      this.finishingStyleProperties[key] = params[key];
      obj.bg = current;
      obj.cg = change;
    }
    else {
      current = Meetup.Tweener.parseValue(Meetup.Tweener.styleLib.get(this.target, key));
      future  = Meetup.Tweener.parseValue(params[key]);
      if (current.unit === null) {
        if (future.unit === null) {
          current.unit = future.unit = '';
        }
        else {
          current.unit = future.unit;
        }
      }
      else {
        if (future.unit === null) {
          future.unit = current.unit;
        }
      }
      change = future.value - current.value;
      this.finishingStyleProperties[key] = future.value + future.unit;
      obj.bg = current.value;
      obj.cg = change;
      obj.un = future.unit;
    }
    ms[ms.length] = obj;
  }

  var mtsb, mtcc, l, d, tg, es;
  mtsb  = Meetup.Tweener.styleLib.bulkSet;
  mtcc  = Meetup.Tweener.compileColor;
  l     = ms.length;
  d     = this.duration;
  tg    = this.target;
  es    = this.easing;
  return function (tm) {
    var m, r, g, b, i, rs = {};
    for (i = 0; i < l; ++i) {
      m = ms[i];
      if (m.bg instanceof Array) {
        r = es(tm, m.bg[0], m.cg[0], d);
        g = es(tm, m.bg[1], m.cg[1], d);
        b = es(tm, m.bg[2], m.cg[2], d);
        rs[m.key] = mtcc([r, g, b]);
      }
      else {
        rs[m.key] = es(tm, m.bg, m.cg, d) + m.un;
      }
    }
    mtsb(tg, rs);
  };
};

Meetup.Tweener.Tween.prototype.createInners = function () {
  var target = this.target;
  if (this.onStart) {
    var onstart = this.onStart;
    if (this.onStartParams) {
      var onstartparams = this.onStartParams;
      if (!(onstartparams instanceof Array)) {
        this.onStartParams = [onstartparams];
      }
      this.innerStart = function () {
        onstart.apply(target, onstartparams);
      };
    }
    else {
      this.innerStart = function () {
        onstart.apply(target);
      };
    }
  }

  if (this.onUpdate) {
    var onupdate = this.onUpdate;
    if (this.onUpdateParams) {
      var onupdateparams = this.onUpdateParams;
      if (!(this.onUpdateParams instanceof Array)) {
        this.onUpdateParams = [this.onUpdateParams];
      }
      this.innerUpdate = function () {
        onupdate.apply(target, onupdateparams);
      };
    }
    else {
      this.innerUpdate = function () {
        onupdate.apply(target);
      };
    }
  }

  var finishStyle       = this.finishingStyleProperties,
      finishProp        = this.finishingNormalProperties,
      innerupdate       = this.innerUpdate,
      oncomplete        = this.onComplete,
      oncompleteparams  = this.onCompleteParams;
  this.innerComplete = function () {
    var j, k;
    for (j in finishStyle) {
      Meetup.Tweener.styleLib.set(target, j, finishStyle[j]);
    }
    for (k in finishProp) {
      target[k] = finishProp[k];
    }
    if (innerupdate) {
      innerupdate();
    }
    if (oncomplete) {
      if (oncompleteparams) {
        if (!(oncompleteparams instanceof Array)) {
          oncompleteparams = [oncompleteparams];
        }
        oncomplete.apply(target, oncompleteparams);
      }
      else {
        oncomplete.apply(target);
      }
    }
  };

  var s = this,
      e = this.eventLoop;
  this.innerEventLoop = function () {
    e.apply(s);
  };
};

/*
method: discard

discard this tween

return:
  (undefined)
*/
Meetup.Tweener.Tween.prototype.discard = function () {
  this.stop();
  Meetup.Tweener.removeTweenById(this.tweenId);
};


/*
method: dump

this method is marked as OBSOLETE.  Please use discard() instead.

return:
  (undefined)
*/
Meetup.Tweener.Tween.prototype.dump = function () {
  this.discard();
};

Meetup.Tweener.Tween.prototype.eventLoop = function () {
  var n   = Meetup.Tweener.now(),
      ct  = n - this.startTime + this.elapsedTime;

  if (n < this.endTime) {
    // continuing loop!
    var i,
        ps  = this.processes,
        len = ps.length;
    for (i = 0; i < len; ++i) {
      ps[i](ct);
    }
    if (this.innerUpdate) {
      this.innerUpdate();
    }

    this.timerPointer = window.setTimeout(this.innerEventLoop, Meetup.Tweener.frameInterval);
  }
  else {
    // finishing loop!
    this.stop();
    this.innerComplete();
    Meetup.Tweener.removeTweenById(this.tweenId);
  }
};

/*
method: start

starts tweening

return:
  (boolean)
*/
Meetup.Tweener.Tween.prototype.start = function () {
  if (this.isLooping) {
    return false;
  }

  var epoch = Meetup.Tweener.now();
  if (this.startTime === null) {
    this.startTime  = epoch;
    this.endTime    = this.startTime + this.duration;
  }
  else {
    this.startTime  = epoch;
    this.endTime    = epoch + this.duration - this.elapsedTime;
  }
  if (this.endTime <= epoch) {
    return false;
  }

  var s           = this,
      innerstart  = this.innerStart,
      innerloop   = this.innerEventLoop,
      delay       = this.delay * 1000;
  this.timerPointer = window.setTimeout(
    function () {
      if (innerstart) {
        innerstart();
        innerstart = null;
      }
      if (! s.isLooping) {
        s.isLooping = true;
        innerloop();
      }
    },
    delay);
  return true;
};

/*
method: stop

stops tweening

return:
  (boolean)
*/
Meetup.Tweener.Tween.prototype.stop = function () {
  if (this.timerPointer) {
    window.clearTimeout(this.timerPointer);
  }
  this.timerPointer = null;
  if (!this.isLooping) { // really need this??
    return false;
  }
  this.elapsedTime = Meetup.Tweener.now() - this.startTime;
  this.isLooping = false;
  return true;
};

Meetup.Tweener.Tween.compensateParams = function (instance, params) {
  var key, defaults = Meetup.Tweener.DEFAULT_PARAMS;
  for (key in defaults) {
    if (params[key]) {
      if (key === 'time' || key === 'delay') {
        instance[key] = parseFloat(params[key]);
      }
      else if (key === 'transition') {
        var keytype = typeof params[key];
        if (keytype !== 'string' && keytype !== 'function') {
          throw new Error('You have to pass string or function as a transition param. You passed: ' + params[key]);
        }
        instance[key] = params[key];
      }
      else {
        instance[key] = params[key];
      }
      delete params[key];
    }
    else {
      instance[key] = defaults[key];
    }
  }
};

// t: target, k: key, e:easing, b:begin, c:change, d:duration
// tm: time
Meetup.Tweener.Tween.generateDirectProcess = function (t, k, e, b, c, d) {
  return function (tm) {
    t[k] = e(tm, b, c, d);
  };
};


// ====================================
//

// each easingFunction takes four arguments:
// t: Time
// b: begin
// c: change
// d: duration

// Inspired from JSTweener!
// some of equation should be expanded

Meetup.Tweener.easingFunctions = {
  easeNone: function(t, b, c, d) {
    return c * t / d + b;
  },
  easeInQuad: function(t, b, c, d) {
    return c*(t/=d)*t + b;
  },
  easeOutQuad: function(t, b, c, d) {
    return -c *(t/=d)*(t-2) + b;
  },
  easeInOutQuad: function(t, b, c, d) {
    if((t/=d/2) < 1) {
      return c/2*t*t + b;
    }
    return -c/2 *((--t)*(t-2) - 1) + b;
  },
  easeInCubic: function(t, b, c, d) {
    return c*(t/=d)*t*t + b;
  },
  easeOutCubic: function(t, b, c, d) {
    return c*((t=t/d-1)*t*t + 1) + b;
  },
  easeInOutCubic: function(t, b, c, d) {
    if((t/=d/2) < 1) {
      return c/2*t*t*t + b;
    }
    return c/2*((t-=2)*t*t + 2) + b;
  },
  easeOutInCubic: function(t, b, c, d) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutCubic(t*2, b, c/2, d);
    }
    return Meetup.Tweener.easingFunctions.easeInCubic((t*2)-d, b+c/2, c/2, d);
  },
  easeInQuart: function(t, b, c, d) {
    return c*(t/=d)*t*t*t + b;
  },
  easeOutQuart: function(t, b, c, d) {
    return -c *((t=t/d-1)*t*t*t - 1) + b;
  },
  easeInOutQuart: function(t, b, c, d) {
    if((t/=d/2) < 1) {
      return c/2*t*t*t*t + b;
    }
    return -c/2 *((t-=2)*t*t*t - 2) + b;
  },
  easeOutInQuart: function(t, b, c, d) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutQuart(t*2, b, c/2, d);
    }
    return Meetup.Tweener.easingFunctions.easeInQuart((t*2)-d, b+c/2, c/2, d);
  },
  easeInQuint: function(t, b, c, d) {
    return c*(t/=d)*t*t*t*t + b;
  },
  easeOutQuint: function(t, b, c, d) {
    return c*((t=t/d-1)*t*t*t*t + 1) + b;
  },
  easeInOutQuint: function(t, b, c, d) {
    if((t/=d/2) < 1) {
      return c/2*t*t*t*t*t + b;
    }
    return c/2*((t-=2)*t*t*t*t + 2) + b;
  },
  easeOutInQuint: function(t, b, c, d) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutQuint(t*2, b, c/2, d);
    }
    return Meetup.Tweener.easingFunctions.easeInQuint((t*2)-d, b+c/2, c/2, d);
  },
  easeInSine: function(t, b, c, d) {
    return -c * Math.cos(t/d *(Math.PI/2)) + c + b;
  },
  easeOutSine: function(t, b, c, d) {
    return c * Math.sin(t/d *(Math.PI/2)) + b;
  },
  easeInOutSine: function(t, b, c, d) {
    return -c/2 *(Math.cos(Math.PI*t/d) - 1) + b;
  },
  easeOutInSine: function(t, b, c, d) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutSine(t*2, b, c/2, d);
    }
    return Meetup.Tweener.easingFunctions.easeInSine((t*2)-d, b+c/2, c/2, d);
  },
  easeInExpo: function(t, b, c, d) {
    return(t===0) ? b : c * Math.pow(2, 10 *(t/d - 1)) + b - c * 0.001;
  },
  easeOutExpo: function(t, b, c, d) {
    return(t==d) ? b+c : c * 1.001 *(-Math.pow(2, -10 * t/d) + 1) + b;
  },
  easeInOutExpo: function(t, b, c, d) {
    if(t===0) {
      return b;
    }
    if(t==d) {
      return b+c;
    }
    if((t/=d/2) < 1) {
      return c/2 * Math.pow(2, 10 *(t - 1)) + b - c * 0.0005;
    }
    return c/2 * 1.0005 *(-Math.pow(2, -10 * --t) + 2) + b;
  },
  easeOutInExpo: function(t, b, c, d) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutExpo(t*2, b, c/2, d);
    }
    return Meetup.Tweener.easingFunctions.easeInExpo((t*2)-d, b+c/2, c/2, d);
  },
  easeInCirc: function(t, b, c, d) {
    return -c *(Math.sqrt(1 -(t/=d)*t) - 1) + b;
  },
  easeOutCirc: function(t, b, c, d) {
    return c * Math.sqrt(1 -(t=t/d-1)*t) + b;
  },
  easeInOutCirc: function(t, b, c, d) {
    if((t/=d/2) < 1) {
      return -c/2 *(Math.sqrt(1 - t*t) - 1) + b;
    }
    return c/2 *(Math.sqrt(1 -(t-=2)*t) + 1) + b;
  },
  easeOutInCirc: function(t, b, c, d) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutCirc(t*2, b, c/2, d);
    }
    return Meetup.Tweener.easingFunctions.easeInCirc((t*2)-d, b+c/2, c/2, d);
  },
  easeInElastic: function(t, b, c, d, a, p) {
    var s;
    if(t===0) {
      return b;
    }
    if((t/=d)==1) {
      return b+c;
    }
    if(!p) {
      p=d*0.3;
    }
    if(!a || a < Math.abs(c)) {
      a=c; s=p/4;
    }
    else {
      s = p/(2*Math.PI) * Math.asin(c/a);
    }
    return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
  },
  easeOutElastic: function(t, b, c, d, a, p) {
    var s;
    if(t===0) {
      return b;
    }
    if((t/=d)==1) {
      return b+c;
    }
    if(!p) {
      p=d*0.3;
    }
    if(!a || a < Math.abs(c)) {
      a=c; s=p/4;
    }
    else {
      s = p/(2*Math.PI) * Math.asin(c/a);
    }
    return(a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p ) + c + b);
  },
  easeInOutElastic: function(t, b, c, d, a, p) {
    var s;
    if(t===0) {
      return b;
    }
    if((t/=d/2)==2) {
      return b+c;
    }
    if(!p) {
      p=d*(0.3*1.5);
    }
    if(!a || a < Math.abs(c)) {
      a=c; s=p/4;
    }
    else {
      s = p/(2*Math.PI) * Math.asin(c/a);
    }
    if(t < 1) {
      return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
    }
    return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
  },
  easeOutInElastic: function(t, b, c, d, a, p) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutElastic(t*2, b, c/2, d, a, p);
    }
    return Meetup.Tweener.easingFunctions.easeInElastic((t*2)-d, b+c/2, c/2, d, a, p);
  },
  easeInBack: function(t, b, c, d, s) {
    if(s === undefined) {
      s = 1.70158;
    }
    return c*(t/=d)*t*((s+1)*t - s) + b;
  },
  easeOutBack: function(t, b, c, d, s) {
    if(s === undefined) {
      s = 1.70158;
    }
    return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
  },
  easeInOutBack: function(t, b, c, d, s) {
    if(s === undefined) {
      s = 1.70158;
    }
    if((t/=d/2) < 1) {
      return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
    }
    return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
  },
  easeOutInBack: function(t, b, c, d, s) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutBack(t*2, b, c/2, d, s);
    }
    return Meetup.Tweener.easingFunctions.easeInBack((t*2)-d, b+c/2, c/2, d, s);
  },
  easeInBounce: function(t, b, c, d) {
    return c - Meetup.Tweener.easingFunctions.easeOutBounce(d-t, 0, c, d) + b;
  },
  easeOutBounce: function(t, b, c, d) {
    if((t/=d) <(1/2.75)) {
      return c*(7.5625*t*t) + b;
    }
    else if(t <(2/2.75)) {
      return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
    }
    else if(t <(2.5/2.75)) {
      return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
    }
    return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
  },
  easeInOutBounce: function(t, b, c, d) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeInBounce(t*2, 0, c, d) * 0.5 + b;
    }
    return Meetup.Tweener.easingFunctions.easeOutBounce(t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
  },
  easeOutInBounce: function(t, b, c, d) {
    if(t < d/2) {
      return Meetup.Tweener.easingFunctions.easeOutBounce(t*2, b, c/2, d);
    }
    return Meetup.Tweener.easingFunctions.easeInBounce((t*2)-d, b+c/2, c/2, d);
  }
};
Meetup.Tweener.easingFunctions.linear = Meetup.Tweener.easingFunctions.easeNone;
(function(){
  for (var key in Meetup.Tweener.easingFunctions) {
    Meetup.Tweener.easingFunctionsLowerCase[key.toLowerCase()] = Meetup.Tweener.easingFunctions[key];
  }
})();