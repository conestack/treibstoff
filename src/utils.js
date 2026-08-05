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
            `Use ${sub} instead.`,
    );
}

/**
 * Lookup object by path from window.
 *
 * @param {string} path - Dot separated path to object.
 * @throws If object by given path not exists, an exception gets thrown.
 * @returns {*|null} Return object found by path or null if empty path given.
 */
export function object_by_path(path) {
    if (!path) {
        return null;
    }
    let ob = window;
    for (const part of path.split('.')) {
        ob = ob[part];
        if (ob === undefined) {
            throw `Object by path not exists: ${path}`;
        }
    }
    return ob;
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
export function query_elem(selector, context, unique = true) {
    const elem = $(selector, context);
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
export function get_elem(selector, context, unique = true) {
    const elem = query_elem(selector, context, unique);
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
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
    );
}

/**
 * Set property on object with default value if property is undefined.
 *
 * @param {Object} ob - Object to set property if undefined.
 * @param {string} name - Property name.
 * @param {any} val - Default value to set for property.
 * @returns {any} Actual value.
 */
export function set_default(ob, name, val) {
    if (ob[name] === undefined) {
        ob[name] = val;
    }
    return ob[name];
}

/**
 * Merge two plain objects. Properties from ``other`` override ``base``.
 *
 * @param {Object} base - Base object.
 * @param {Object} other - Object to merge into base.
 * @returns {Object} New merged object.
 */
export function json_merge(base, other) {
    const ret = {};
    for (const ob of [base, other]) {
        for (const name in ob) {
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
    const parser = document.createElement('a');
    parser.href = url;
    const path = parser.pathname;
    url = `${parser.protocol}//${parser.host}${path}`;
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
    const parser = document.createElement('a');
    parser.href = url;
    const search = parser.search;
    if (as_string) {
        return search ? search : '';
    }
    const params = {};
    if (search) {
        const parameters = search.substring(1, search.length).split('&');
        for (let i = 0; i < parameters.length; i++) {
            const param = parameters[i].split('=');
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
    const parser = document.createElement('a');
    parser.href = url;
    let path = _strip_trailing_char(parser.pathname, '/');
    if (include_query) {
        path += parse_query(url, true);
    }
    return path;
}

/**
 * Create a browser cookie.
 *
 * @param {string} name - Cookie name.
 * @param {string} value - Cookie value.
 * @param {number} days - Number of days until expiry. If falsy, creates
 * a session cookie.
 */
export function create_cookie(name, value, days) {
    let date, expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = `; expires=${date.toGMTString()}`;
    } else {
        expires = '';
    }
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API not widely supported
    document.cookie = `${name}=${escape(value)}${expires}; path=/;`;
}

/**
 * Read a browser cookie by name.
 *
 * @param {string} name - Cookie name.
 * @returns {string|null} Cookie value or null if not found.
 */
export function read_cookie(name) {
    let nameEQ = `${name}=`,
        ca = document.cookie.split(';'),
        i,
        c;
    for (i = 0; i < ca.length; i = i + 1) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

/**
 * SVG namespace URI.
 * @type {string}
 */
export const svg_ns = 'http://www.w3.org/2000/svg';

/**
 * Set attributes on an SVG element. Validates ``width`` and ``height``
 * to be non-negative numbers.
 *
 * @param {SVGElement} el - SVG element.
 * @param {Object} opts - Map of attribute names to values.
 */
export function set_svg_attrs(el, opts) {
    for (const n in opts) {
        if (n === 'width' || n === 'height') {
            const val = parseFloat(opts[n]);
            if (val >= 0) {
                el.setAttributeNS(null, n, opts[n]);
            } else {
                console.error(`Invalid value for ${n}:`, opts[n], el);
            }
        } else {
            el.setAttributeNS(null, n, opts[n]);
        }
    }
}

/**
 * Create an SVG element with attributes and optionally append it to a
 * container.
 *
 * @param {string} name - SVG element tag name (e.g. ``'g'``, ``'rect'``).
 * @param {Object} opts - Map of attribute names to values.
 * @param {SVGElement} container - Optional parent element to append to.
 * @returns {SVGElement} The created SVG element.
 */
export function create_svg_elem(name, opts, container) {
    const el = document.createElementNS(svg_ns, name);
    set_svg_attrs(el, opts);
    if (container !== undefined) {
        container.appendChild(el);
    }
    return el;
}

/**
 * Parse an SVG template string into SVG elements and optionally append
 * them to a container.
 *
 * @param {string} tmpl - SVG markup string.
 * @param {SVGElement} container - Optional parent element to append to.
 * @returns {Array<SVGElement>} Array of parsed SVG elements.
 */
export function parse_svg(tmpl, container) {
    const wrapper = create_svg_elem('svg', {});
    wrapper.innerHTML = tmpl.trim();
    const elems = [];
    const children = wrapper.childNodes;
    for (let i = 0; i < children.length; i++) {
        const elem = children[i];
        elems.push(elem);
        wrapper.removeChild(elem);
        if (container !== undefined) {
            container.appendChild(elem);
        }
    }
    return elems;
}

/**
 * Load an SVG file from a URL and pass the parsed SVG element to a
 * callback.
 *
 * @param {string} url - URL of the SVG file.
 * @param {function} callback - Callback receiving the jQuery wrapped
 * SVG element.
 */
export function load_svg(url, callback) {
    $.get(
        url,
        ((data) => {
            const svg = $(data).find('svg');
            svg.removeAttr('xmlns:a');
            callback(svg);
        }).bind(this),
        'xml',
    );
}
