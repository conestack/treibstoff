import { Events } from './events.js';

/**
 * Drag and Drop tracking class.
 *
 * Provides native HTML5 drag and drop event tracking on configurable
 * DOM scopes. Analogous to Motion for mouse tracking.
 *
 * @fires dragstart - Fired when drag begins. Receives the DOM event.
 * @fires dragover - Fired when dragged over drop target. Receives the DOM
 *     event with `evt.source` set to the DnD instance that initiated the drag.
 * @fires dragleave - Fired when drag leaves drop target. Receives the DOM event.
 * @fires drop - Fired on drop. Receives the DOM event with `evt.source` set
 *     to the DnD instance that initiated the drag.
 * @fires dragend - Fired when drag ends. Receives the DOM event.
 */
export class DnD extends Events {
    static _drag_source = null;

    constructor() {
        super();
        this._drag_scope = null;
        this._drop_scope = null;
        this._dragstart_handle = null;
        this._dragend_handle = null;
        this._dragover_handle = null;
        this._dragleave_handle = null;
        this._drop_handle = null;
    }

    /**
     * Set DOM scopes for drag and drop.
     *
     * Binds dragstart/dragend on drag scope, dragover/dragleave/drop
     * on drop scope. Analogous to Motion.set_scope().
     *
     * @param {jQuery} drag - Element that can be dragged (or null).
     * @param {jQuery} drop - Element that accepts drops (or null).
     */
    set_scope(drag, drop) {
        this.reset_scope();
        this._drag_scope = drag;
        this._drop_scope = drop;
        if (drag) {
            drag.attr('draggable', 'true');
            this._dragstart_handle = this._dragstart.bind(this);
            this._dragend_handle = this._dragend.bind(this);
            drag.on('dragstart', this._dragstart_handle);
            drag.on('dragend', this._dragend_handle);
        }
        if (drop) {
            this._dragover_handle = this._dragover.bind(this);
            this._dragleave_handle = this._dragleave.bind(this);
            this._drop_handle = this._drop.bind(this);
            drop.on('dragover', this._dragover_handle);
            drop.on('dragleave', this._dragleave_handle);
            drop.on('drop', this._drop_handle);
        }
    }

    /**
     * Unbind all drag/drop event handlers and clear scopes.
     */
    reset_scope() {
        if (this._drag_scope) {
            this._drag_scope.off('dragstart', this._dragstart_handle);
            this._drag_scope.off('dragend', this._dragend_handle);
            this._drag_scope.removeAttr('draggable');
        }
        if (this._drop_scope) {
            this._drop_scope.off('dragover', this._dragover_handle);
            this._drop_scope.off('dragleave', this._dragleave_handle);
            this._drop_scope.off('drop', this._drop_handle);
        }
        this._drag_scope = null;
        this._drop_scope = null;
    }

    _dragstart(evt) {
        // Firefox requires dataTransfer.setData to enable drag
        evt.originalEvent.dataTransfer.setData('text/plain', '');
        DnD._drag_source = this;
        this.trigger('dragstart', evt);
    }

    _dragover(evt) {
        evt.originalEvent.preventDefault();
        evt.source = DnD._drag_source;
        this.trigger('dragover', evt);
    }

    _dragleave(evt) {
        this.trigger('dragleave', evt);
    }

    _drop(evt) {
        evt.originalEvent.preventDefault();
        evt.source = DnD._drag_source;
        this.trigger('drop', evt);
    }

    _dragend(evt) {
        DnD._drag_source = null;
        this.trigger('dragend', evt);
    }
}
