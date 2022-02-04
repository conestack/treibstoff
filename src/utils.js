import $ from 'jquery';

/**
 * Log deprecation warning.
 *
 * @param {string} dep - Deprecated object
 * @param {string} sub - Substitute for deprecated object.
 * @param {string} as_of - Version when deprecated object gets removed.
 */
export function deprecate(dep, sub, as_of) {
    console.log(
        `DEPRECATED: ${dep} is deprecated ` +
        `and will be removed as of ${as_of}. ` +
        `Use ${sub} instead.`
    );
}

/**
 * Query element by selector from context.
 *
 * @param {string} selector - Lookup selector.
 * @param {(HTMLElement|$)} context - Search context.
 * @param {boolean} unique - Flag whether unique element is requested.
 * @throws If unique is true and more than one element found by selector, an
 * exception gets thrown.
 * @returns {($|null)} jQuery wrapped element. Return null if no element found by
 * given selector.
 */
export function query_elem(selector, context, unique=true) {
    let elem = $(selector, context);
    if (unique && elem.length > 1) {
        throw `Element by selector ${selector} not unique.`;
    } else if (!elem.length) {
        return null;
    }
    return elem;
}

/**
 * Get element by selector from context.
 *
 * @param {string} selector - Lookup selector.
 * @param {(HTMLElement|$)} context - Search context.
 * @param {boolean} unique - Flag whether unique element is requested.
 * @throws If unique is true and more than one element found by selector, an
 * exception gets thrown.
 * @throws If no element is found, and exception gets thrown.
 * @returns {$} jQuery wrapped element.
 */
export function get_elem(selector, context, unique=true) {
    let elem = query_elem(selector, context, unique);
    if (elem === null) {
        throw `Element by selector ${selector} not found.`;
    }
    return elem;
}


/**
 * Set visibility of element.
 *
 * @param {$} elem - jQuery wrapped DOM element.
 * @param {boolean} visible - Flag whether element is visible.
 */
export function set_visible(elem, visible) {
    if (visible) {
        elem.removeClass('hidden');
    } else {
        elem.addClass('hidden');
    }
}


/**
 * Generate uuid 4.
 *
 * @returns {string} UUID string.
 */
export function uuid4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

/**
 * Set property on object with default value if property is undefined.
 *
 * @param {Object} ob - Object to set property if undefined.
 * @param {string} name - Property name.
 * @param {*} val - Default value to set for property.
 * @returns {*} Actual value.
 */
export function set_default(ob, name, val) {
    if (ob[name] === undefined) {
        ob[name] = val;
    }
    return ob[name];
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

function _strip_trailing_char(str, chr) {
    if (str.charAt(str.length - 1) === chr) {
        str = str.substring(0, str.length - 1);
    }
    return str;
}

/**
 * Parse URL without query from string::
 *
 *     >> ts.parse_url('https://tld.com/path?param=value');
 *     <- 'https://tld.com/path'
 *
 * @param {string} url - URL to parse.
 * @returns {string} URL without query.
 */
export function parse_url(url) {
    let parser = document.createElement('a');
    parser.href = url;
    let path = parser.pathname;
    url = parser.protocol + '//' + parser.host + path;
    return _strip_trailing_char(url, '/');
}

/**
 * Parse query parameters from URL string.
 *
 * By default, the query parameters are returned as object::
 *
 *     >> ts.parse_query('http://tld.com?param=value');
 *     <- { param: 'value' }
 *
 * The query parameters can be parsed as string by passing ``true`` to
 * ``parse_query``::
 *
 *     >> ts.parse_query('http://tld.com?param=value', true);
 *     <- '?param=value'
 *
 * @param {string} url - URL to parse.
 * @param {boolean} as_string - Flag whether to return query as string.
 * @returns {(Object|string)} Query parameters.
 */
export function parse_query(url, as_string) {
    let parser = document.createElement('a');
    parser.href = url;
    let search = parser.search;
    if (as_string) {
        return search ? search : '';
    }
    let params = {};
    if (search) {
        let parameters = search.substring(1, search.length).split('&');
        for (let i = 0; i < parameters.length; i++) {
            let param = parameters[i].split('=');
            params[param[0]] = param[1];
        }
    }
    return params;
}

/**
 * Parse relative path from URL string.
 *
 * By default, the query is excluded::
 *
 *     >> ts.parse_path('http://tld.com/some/path?param=value');
 *     <- '/some/path'
 *
 * The query can be included by passing ``true`` to ``parse_path``::
 *
 *     >> ts.parse_path('http://tld.com/some/path?param=value', true);
 *     <- '/some/path?param=value'
 *
 * @param {string} url - URL to parse.
 * @param {boolean} include_query - Flag whether to include query.
 * @returns {string} Path with or without query.
 */
export function parse_path(url, include_query) {
    let parser = document.createElement('a');
    parser.href = url;
    let path = _strip_trailing_char(parser.pathname, '/');
    if (include_query) {
        path += parse_query(url, true);
    }
    return path;
}

export function create_cookie(name, value, days) {
    var date,
        expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = name + "=" + escape(value) + expires + "; path=/;";
}

export function read_cookie(name) {
    var nameEQ = name + "=",
        ca = document.cookie.split(';'),
        i,
        c;
    for(i = 0; i < ca.length;i = i + 1) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return unescape(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
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
