Clock
=====

Overview
--------

Treibstoff provides a singleton named ``clock`` for scheduling tasks. This
singleton creates clock event objects which are responsible to execute these
tasks at the requested time.

Defer a task before next repaint:

.. code-block:: js

    import {clock} from 'clock';

    // create clock frame event
    evt = clock.schedule_frame((timestamp) => {});

    // cancel clock frame event
    evt.cancel();

Defer a task after timeout:

.. code-block:: js

    // create clock timeout event
    evt = clock.schedule_timeout((timestamp) => {}, 1);

    // cancel clock timeout event
    evt.cancel();

Execute a task periodically:

.. code-block:: js

    // create clock interval event
    evt = clock.schedule_interval((timestamp, event) => {}, 1);

    // cancel clock interval event
    evt.cancel();

API
---

.. js:autoclass:: ClockFrameEvent
    :members: cancel

.. js:autoclass:: ClockTimeoutEvent
    :members: cancel

.. js:autoclass:: ClockIntervalEvent
    :members: cancel

.. js:autoclass:: Clock
    :members: schedule_frame, schedule_timeout, schedule_interval
