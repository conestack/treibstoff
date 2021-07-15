/**
 * Downstripped and modernized version of jquerytools overlay.
 * https://github.com/jquerytools/jquerytools/blob/master/src/overlay/overlay.js
 */
import $ from 'jquery';

let instances = [],
    effects = {};

function add_effect(name, loadFn, closeFn) {
    effects[name] = [loadFn, closeFn];
}

class DefaultConf {

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
    }
}

export class Overlay {

    constructor(trigger, conf) {
        conf = $.extend(true, new DefaultConf(), conf);
        instances.push(this);
        trigger.data('overlay', this);

        this.conf = conf;
        this.fire = trigger.add(this);
        this.w = $(window);
        this.opened = false;
        this.uid = Math.random().toString().slice(10);

        // get overlay and trigger
        let jq = conf.target || trigger.attr('rel');
        let elem = this.elem = jq ? $(jq) : null || trigger;

        // overlay not found. cannot continue
        if (!elem.length) {
            throw 'Could not find Overlay: ' + jq;
        }

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

    load(e) {
        // can be opened only once
        if (this.opened) {
            return this;
        }

        let conf = this.conf;

        // find the effect
        let eff = effects[conf.effect];
        if (!eff) {
            throw "Overlay: cannot find effect : \"" + conf.effect + "\"";
        }

        // close other instances if oneInstance
        if (conf.oneInstance) {
            $.each(instances, function() {
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
        effects[this.conf.effect][1].call(this, function() {
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

add_effect('default',
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

$.fn.overlay = function(conf) {
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
    let inst_count = 0;
    this.each(function() {
        inst = new Overlay($(this), conf);
        inst_count += 1;
    });
    if (conf.api && inst_count != 1) {
        throw 'API requested but overlay not unique.';
    }
    return conf.api ? inst : this;
};
