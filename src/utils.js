export function uuid4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export function json_merge(base, other) {
    let ret = {};
    for (let ob of [base, other]) {
        for (let name in ob) {
            ret[name] = ob[name];
        }
    }
    return ret;
}

export const svg_ns = 'http://www.w3.org/2000/svg';

export function set_svg_attrs(el, opts) {
    for (let n in opts) {
        el.setAttributeNS(null, n, opts[n]);
    }
}

export function create_svg_elem(name, opts, container) {
    let el = document.createElementNS(svg_ns, name);
    set_svg_attrs(el, opts);
    if (container !== undefined) {
        container.appendChild(el);
    }
    return el;
}

export function parse_svg(tmpl, container) {
    var wrapper = create_svg_elem('svg', {});
    wrapper.innerHTML = tmpl.trim();
    let elems = [];
    let children = wrapper.childNodes;
    for (let i = 0; i < children.length; i++) {
        let elem = children[i];
        elems.push(elem);
        wrapper.removeChild(elem);
        if (container !== undefined) {
            container.appendChild(elem);
        }
    }
    return elems;
}

export function load_svg(url, callback) {
    $.get(url, function(data) {
        let svg = $(data).find('svg');
        svg.removeAttr('xmlns:a');
        callback(svg);
    }.bind(this), 'xml');
}
