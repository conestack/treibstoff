# HTTP Requests

This guide explains how to make HTTP requests using treibstoff's `HTTPRequest`
class and `http_request` convenience function.

## Context

Treibstoff wraps jQuery's `$.ajax` with automatic spinner management, error
display, 403 redirect handling, and URL query parameter parsing. The
`http_request` function is the primary API for application code.

## Key API

| Class/Function | Purpose |
|----------------|---------|
| `ts.http_request(opts)` | Execute HTTP request (convenience function) |
| `ts.HTTPRequest` | Request class with spinner and error handling |
| `ts.spinner` | Loading spinner singleton |

## Pattern 1: Basic GET Request

```javascript
ts.http_request({
    url: '/api/items',
    type: 'json',
    success: function(data, status, request) {
        console.log('Items:', data);
    }
});
```

**Defaults:**
- `type`: `'html'`
- `method`: `'GET'`
- `cache`: `false`
- Spinner is shown during request
- On error: `ts.show_error()` with status code

## Pattern 2: POST Request

```javascript
ts.http_request({
    url: '/api/items/42',
    method: 'POST',
    type: 'json',
    params: {
        title: 'Updated Title',
        status: 'active'
    },
    success: function(data, status, request) {
        console.log('Updated:', data);
    }
});
```

## Pattern 3: URL with Query Parameters

Query parameters in the URL are automatically parsed and merged with `params`.
If the same key exists in both, `params` takes precedence.

```javascript
ts.http_request({
    url: '/api/items?page=1&size=10',
    type: 'json',
    params: {
        size: 25    // overrides size=10 from URL
    },
    success: function(data) {
        // request sent to /api/items with params: {page: '1', size: 25}
    }
});
```

## Pattern 4: Custom Error Handling

```javascript
ts.http_request({
    url: '/api/items/42',
    type: 'json',
    success: function(data) {
        console.log('OK:', data);
    },
    error: function(request, status, error) {
        if (status === 404) {
            console.log('Item not found');
        } else {
            ts.show_error(`Request failed: ${status} ${error}`);
        }
    }
});
```

**Default error behavior:**
- HTTP 403 → Redirect to `/login`
- Other errors → `ts.show_error()` with status and message
- Request abort (status 0) → Silently ignored

## Pattern 5: Without Spinner

```javascript
ts.http_request({
    url: '/api/heartbeat',
    type: 'json',
    spinner: null,   // disable spinner
    success: function(data) {
        // background request without UI feedback
    }
});
```

## Pattern 6: Custom 403 Redirect

```javascript
ts.http_request({
    url: '/api/admin/settings',
    type: 'json',
    default_403: '/unauthorized',  // custom redirect path
    success: function(data) {
        console.log('Settings:', data);
    }
});
```

## Pattern 7: Using HTTPRequest Class Directly

For multiple requests sharing the same configuration:

```javascript
let request = new ts.HTTPRequest({
    spinner: ts.spinner,
    default_403: '/login'
});

request.execute({
    url: '/api/items',
    type: 'json',
    success: function(data) {
        console.log(data);
    }
});

request.execute({
    url: '/api/categories',
    type: 'json',
    success: function(data) {
        console.log(data);
    }
});
```

## Pattern 8: Spinner Management

The spinner tracks a display count — multiple concurrent requests are handled
properly.

```javascript
// Manual spinner control
ts.spinner.show();   // count: 1 → spinner appears
ts.spinner.show();   // count: 2 → still showing
ts.spinner.hide();   // count: 1 → still showing
ts.spinner.hide();   // count: 0 → spinner disappears

// Force hide (resets count)
ts.spinner.hide(true);  // count: 0, spinner removed immediately
```

## Complete Example

```javascript
import ts from 'treibstoff';

class ItemService {
    constructor(base_url) {
        this.base_url = base_url;
    }

    list(params, callback) {
        ts.http_request({
            url: this.base_url,
            type: 'json',
            params: params,
            success: callback
        });
    }

    get(id, callback) {
        ts.http_request({
            url: `${this.base_url}/${id}`,
            type: 'json',
            success: callback,
            error: function(req, status, error) {
                if (status === 404) {
                    ts.show_warning('Item not found.');
                } else {
                    ts.show_error(`Failed to load item: ${error}`);
                }
            }
        });
    }

    save(id, data, callback) {
        ts.http_request({
            url: `${this.base_url}/${id}`,
            method: 'POST',
            type: 'json',
            params: data,
            success: function(response) {
                ts.show_info('Item saved.');
                callback(response);
            }
        });
    }

    delete(id, callback) {
        ts.show_dialog({
            title: 'Delete Item',
            message: 'Are you sure?',
            on_confirm: function() {
                ts.http_request({
                    url: `${this.base_url}/${id}`,
                    method: 'POST',
                    type: 'json',
                    params: {action: 'delete'},
                    success: function(response) {
                        ts.show_info('Item deleted.');
                        callback(response);
                    }
                });
            }.bind(this)
        });
    }
}

let items = new ItemService('/api/items');
items.list({page: 1}, function(data) {
    console.log('Items:', data);
});
```

## Pitfalls

1. **Query parameters in the URL are parsed automatically.** Don't manually
   parse them — pass the full URL with query string and use `params` for
   additional/overriding parameters.

2. **The spinner is shown/hidden automatically** for every request. If you
   don't want it, pass `spinner: null`.

3. **Error handler receives `(request, status, error)`** where `status` is
   the numeric HTTP status code (not the jQuery status string).

4. **Requests with status 0 (aborted) are silently ignored** — the error
   callback is not called and the spinner is force-hidden.

5. **`http_request` creates a new `HTTPRequest` instance per call.** For
   shared configuration, instantiate `HTTPRequest` directly.

6. **Caching is disabled by default** (`cache: false`). Set `cache: true`
   for cacheable GET requests.
