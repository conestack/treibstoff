import ts from '../src/treibstoff.js';

QUnit.module('Test treibstoff', hooks => {

    QUnit.test('Test api members', assert => {
        let members = [];
        for (let prop in ts) {
            members.push(prop);
        }
        assert.deepEqual(members, [
            'Ajax',
            'AjaxAction',
            'AjaxDispatcher',
            'AjaxEvent',
            'AjaxForm',
            'AjaxHandle',
            'AjaxOperation',
            'AjaxOverlay',
            'AjaxParser',
            'AjaxPath',
            'AjaxRequest',
            'AjaxSpinner',
            'AjaxUtil',
            'ajax',
            'Events',
            'KeyState',
            'Motion',
            'Dialog',
            'Message',
            'Overlay',
            'get_overlay',
            'show_dialog',
            'show_error',
            'show_info',
            'show_message',
            'show_warning',
            'HTMLParser',
            'Parser',
            'SVGParser',
            'TemplateParser',
            'compile_svg',
            'compile_template',
            'extract_number',
            'AttrProperty',
            'BoundProperty',
            'ButtonProperty',
            'CSSProperty',
            'DataProperty',
            'InputProperty',
            'Property',
            'SVGProperty',
            'TextProperty',
            'create_svg_elem',
            'deprecate',
            'json_merge',
            'load_svg',
            'parse_path',
            'parse_query',
            'parse_svg',
            'parse_url',
            'set_default',
            'set_svg_attrs',
            'svg_ns',
            'uuid4',
            'HTMLWidget',
            'SVGContext',
            'Widget'
        ]);
    });

});
