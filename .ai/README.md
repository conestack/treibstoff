# Treibstoff — LLM Instruction Files

This directory contains self-contained instruction files for LLM-assisted
development with treibstoff. Each file can be used as prompt input without
needing additional context.

## Usage

Copy the content of the relevant file(s) into your LLM prompt to provide
context for code generation, review, or explanation tasks.

For general understanding, start with `overview.md`. For specific tasks,
pick the topic file that matches your need.

## Files

| File | Description |
|------|-------------|
| [overview.md](overview.md) | Architecture overview — module map, inheritance hierarchy, all public API members |
| [create-widget.md](create-widget.md) | How to create custom widgets — Widget, HTMLWidget, SVGContext, lifecycle |
| [property-binding.md](property-binding.md) | Reactive property system — all 9 property types, auto-handlers, cascading |
| [event-handling.md](event-handling.md) | Events, listeners, keyboard state — on/off/trigger, create_listener, KeyState |
| [drag-and-drop.md](drag-and-drop.md) | Native HTML5 DnD — DnD class, cross-instance coordination, evt.source |
| [motion-tracking.md](motion-tracking.md) | Drag, resize, selection — Motion class, scope variants, down/move/up |
| [template-parsing.md](template-parsing.md) | Template compilation — compile_template, t-elem, t-prop, t-val, t-type |
| [ssr-integration.md](ssr-integration.md) | SSR via HTML attributes — all ajax:* attributes, 7 patterns |
| [ssr-programmatic.md](ssr-programmatic.md) | Programmatic Ajax API — ajax.action, ajax.trigger, ajax.overlay, ajax.register |
| [build-forms.md](build-forms.md) | Form building — Form, FormInput, FormField, FormSelect, validation |
| [overlays-dialogs.md](overlays-dialogs.md) | Overlays and dialogs — Overlay, Dialog, Message, show_dialog, show_error |
| [svg-graphics.md](svg-graphics.md) | SVG graphics — SVGContext, svg_elem, svg_attrs, two-layer pattern |
| [http-requests.md](http-requests.md) | HTTP requests — http_request, HTTPRequest, spinner, error handling |
| [websocket-realtime.md](websocket-realtime.md) | WebSocket — Websocket class, events, JSON messaging, heartbeat |
| [testing.md](testing.md) | Writing QUnit tests — test patterns, DOM fixtures, mocks, assertions |
