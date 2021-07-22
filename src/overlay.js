/**
 * Downstripped and modernized version of jquerytools overlay.
 * https://github.com/jquerytools/jquerytools/blob/master/src/overlay/overlay.js
 */
import $ from 'jquery';
import {compile_template} from './parser.js';

let overlay_instances = [],
    overlay_effects = {},
    overlay_templates = {};

class DefaultOverlayConf {

    constructor() {
        this.api = false;
        this.close = null;
        this.closeOnClick = true;
        this.closeOnEsc = true;
        this.closeSpeed = 'fast';
        this.effect = 'default';
        this.fixed = !$.browser.msie || $.browser.version > 6;
        this.left = 'center';
        this.load = false;
        this.oneInstance = true;
        this.speed = 'normal';
        this.target = null;
        this.top = '10%';
        this.template = 'overlay';
    }
}

export class Overlay {

    static add_effect(name, loadFn, closeFn) {
        overlay_effects[name] = [loadFn, closeFn];
    }

    static add_template(name, template) {
        overlay_templates[name] = template;
    }

    constructor(trigger, conf) {
        conf = $.extend(true, new DefaultOverlayConf(), conf);
        overlay_instances.push(this);
        trigger.data('overlay', this);

        this.conf = conf;
        this.fire = trigger.add(this);
        this.w = $(window);
        this.opened = false;
        this.uid = Math.random().toString().slice(10);

        this.compile();
        let elem = this.elem;

        // trigger's click event
        if (trigger && trigger.index(elem) == -1) {
            trigger.click(function(e) {
                this.load(e);
                return e.preventDefault();
            }.bind(this));
        }

        // callbacks
        let cb_names = [
            'onBeforeLoad',
            'onStart',
            'onLoad',
            'onBeforeClose',
            'onClose'
        ];
        $.each(cb_names, function(i, name) {
            // configuration
            if ($.isFunction(conf[name])) {
                $(this).on(name, conf[name]);
            }

            // API
            this[name] = function(fn) {
                if (fn) {
                    $(this).on(name, fn);
                }
                return this;
            }.bind(this);
        }.bind(this));

        // close button
        let closers = this.closers = elem.find(conf.close || '.close');

        if (!closers.length && !conf.close) {
            closers = $('<a class="close"></a>');
            elem.prepend(closers);
        }

        closers.click(function(e) {
            this.close(e);
        }.bind(this));

        // autoload
        if (conf.load) {
            this.load();
        }
    }

    compile() {
        compile_template(this, overlay_templates[this.template], $('body'));
    }

    load(e) {
        // can be opened only once
        if (this.opened) {
            return this;
        }

        let conf = this.conf;

        // find the effect
        let eff = overlay_effects[conf.effect];
        if (!eff) {
            throw "Overlay: cannot find effect : \"" + conf.effect + "\"";
        }

        // close other instances if oneInstance
        if (conf.oneInstance) {
            $.each(overlay_instances, function() {
                this.close(e);
            });
        }

        let fire = this.fire;

        // onBeforeLoad
        e = e || $.Event();
        e.type = 'onBeforeLoad';
        fire.trigger(e);
        if (e.isDefaultPrevented()) {
            return this;
        }

        let elem = this.elem;
        let w = this.w;

        // opened
        let opened = this.opened = true;
        // position & dimensions
        let top = conf.top,
            left = conf.left,
            oWidth = elem.outerWidth({margin: true}),
            oHeight = elem.outerHeight({margin: true});

        if (typeof top == 'string') {
            if (top == 'center') {
                top = Math.max((w.height() - oHeight) / 2, 0);
            } else {
                top = parseInt(top, 10) / 100 * w.height();
            }
        }

        if (left == 'center') {
            left = Math.max((w.width() - oWidth) / 2, 0);
        }

        // load effect
        eff[0].call(this, {top: top, left: left}, function() {
            if (opened) {
                e.type = 'onLoad';
                fire.trigger(e);
            }
        });

        let uid = this.uid;

        // when window is clicked outside overlay, we close
        if (conf.closeOnClick) {
            $(document).on('click.' + uid, function(e) {
                if (!$(e.target).parents(elem).length) {
                    this.close(e);
                }
            }.bind(this));
        }

        // keyboard::escape
        if (conf.closeOnEsc) {
            // one callback is enough if multiple instances are
            // loaded simultaneously
            $(document).on('keydown.' + uid, function(e) {
                if (e.keyCode == 27) {
                    this.close(e);
                }
            }.bind(this));
        }

        return this;
    }

    close(e) {
        if (!this.opened) {
            return this;
        }

        let fire = this.fire;

        e = e || $.Event();
        e.type = 'onBeforeClose';
        fire.trigger(e);
        if (e.isDefaultPrevented()) {
            return;
        }

        this.opened = false;

        // close effect
        // XXX: call first argument might be e.target instead of this
        overlay_effects[this.conf.effect][1].call(this, function() {
            e.type = 'onClose';
            fire.trigger(e);
        });

        // unbind the keyboard / clicking actions
        $(document).off('click.' + uid + ' keydown.' + uid);

        return this;
    }

    getOverlay() {
        return this.elem;
    }

    getTrigger() {
        return this.trigger;
    }

    getClosers() {
        return this.closers;
    }

    isOpened() {
        return this.opened;
    }

    getConf() {
        return this.conf;
    }
}

Overlay.add_effect('default',
    function(pos, onLoad) {
        $('body')
            .css('padding-right', '13px')
            .css('overflow-x', 'hidden')
            .addClass('modal-open');
        this.elem.fadeIn(300, onLoad);
    }, function(onClose) {
        if ($('.modal:visible').length === 1) {
            $('body')
                .css('padding-right', '')
                .css('overflow-x', 'auto')
                .removeClass('modal-open');
        }
        this.elem.fadeOut(300, onClose);
    }
);

Overlay.add_template('form', `
<div class="modal ajax-overlay" id="ajax-form" t-elem="elem">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close">
          <span aria-hidden="true">&times;</span>
          <span class="sr-only">Close</span>
        </button>
        <h5 class="modal-title">&nbsp;</h5>
      </div>
      <div class="modal-body overlay_content">
        Form Content
      </div>
      <div class="modal-footer">
      </div>
    </div>
  </div>
</div>
`);

Overlay.add_template('overlay', `
<div class="modal ajax-overlay" id="ajax-overlay" t-elem="elem">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close">
          <span aria-hidden="true">&times;</span>
          <span class="sr-only">Close</span>
        </button>
        <h5 class="modal-title">&nbsp;</h5>
      </div>
      <div class="modal-body overlay_content">
        Overlay Content
      </div>
      <div class="modal-footer">
      </div>
    </div>
  </div>
</div>
`);

Overlay.add_template('dialog', `
<div class="modal ajax-dialog" id="ajax-dialog" t-elem="elem">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close cancel">
          <span aria-hidden="true">&times;</span>
          <span class="sr-only">Close</span>
        </button>
        <h5 class="modal-title">&nbsp;</h5>
      </div>
      <div class="modal-body text">
        Text
      </div>
      <div class="modal-footer">
        <button class="submit btn btn-default allowMultiSubmit">OK</button>
        <button class="cancel btn btn-default allowMultiSubmit">Cancel</button>
      </div>
    </div>
  </div>
</div>
`);

Overlay.add_template('message', `
<div class="modal ajax-message" id="ajax-message" t-elem="elem">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close">
          <span aria-hidden="true">&times;</span>
          <span class="sr-only">Close</span>
        </button>
        <h5 class="modal-title">&nbsp;</h5>
      </div>
      <div class="modal-body message">
        Message
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="close btn btn-default allowMultiSubmit">Close</button>
      </div>
    </div>
  </div>
</div>
`);

$.fn.overlay = function(conf) {
    if (this.length != 1) {
        throw 'Overlay can only be instanciated on unique element.';
    }
    let inst = this.data('overlay');
    // Always return API if found on this
    if (inst) {
        return inst;
    }
    if ($.isFunction(conf)) {
        conf = {
            onBeforeLoad: conf
        };
    }
    this.each(function() {
        inst = new Overlay($(this), conf);
    });
    return conf.api ? inst : this;
};
