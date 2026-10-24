// Kept apart from test_websocket.js: this page must not load websocket.js
// itself, otherwise its coverage collides with the iframe module instance.
QUnit.module('treibstoff.websocket.tls', (hooks) => {
    let iframe;

    hooks.afterEach(() => {
        iframe.remove();
    });

    QUnit.test('Test Websocket uri uses wss scheme if not http', async (assert) => {
        // window.location cannot be patched. A srcdoc iframe has protocol
        // ``about:``, so the module gets loaded inside the iframe.
        const module_url = new URL('../src/websocket.js', import.meta.url).href;
        iframe = document.createElement('iframe');
        iframe.srcdoc = `<script type="module">
            import { Websocket } from '${module_url}';
            window.Websocket = Websocket;
        </script>`;
        const loaded = new Promise((resolve) => {
            iframe.addEventListener('load', resolve);
        });
        document.body.appendChild(iframe);
        await loaded;

        const win = iframe.contentWindow;
        assert.strictEqual(win.location.protocol, 'about:');
        const ws = new win.Websocket('/path');
        assert.strictEqual(ws.uri, 'wss:///path');
    });
});
