max.ui.js
==========

Javascript application to interactuate with max services. This is presented as a standaolne jQuery plugin that autoloads asyncronously on any web page.


Development environment setup
-----------------------------

To use the develop version of the widget, you need a full-stack max development environment. You can set up one following instructions on https://github.com/UPCnet/maxserver/blob/master/README.rst, using the `devel.cfg setup <https://github.com/UPCnet/maxserver/blob/master/docs/devel.rst>`_.

Using the development widget
-----------------------------

If you just set up your environment, you will have a running development widget at `<http://localhost:8081/maxui-dev/>`_. This widget has been configured with a default **timeline** preset during the previous steps, and is ready to use.

You can change to **context** preset by accessing http://localhost:8081/maxui-dev?preset=context. To use this preset, you need to create contexts(s) and subscription(s)::

    ./bin/max.devel add context contexturi contextname
    ./bin/max.devel add subscription username http://contexturi

where ``contexturi`` can be anything (usualy a valid URL) and username is an existing user on max. If you need more users, you can create them::

    ./bin/max.devel add user restricted

Now you can setup this new created context by filling the ``readContext`` option on ``src/max.ui.js/presets/context.json`` with the **contexturi** you used to create the context.

There's one last preset, named **conversations**, that is a clone of the default timeline preset, that shows the conversations UI at loading instead of the timeline UI.

Bypass oauth authentication
---------------------------

It's useful to configure max to bypass oauth authentication, to be able to test and debug the widget with
several users in the same environment/browser. To do so, modify this setting on file ``customizeme.cfg``::

    [max-config]
    oauth_passtrough = true

Once modified, re-run buildout and restart max::

    ./bin/buildout -N -c devel.cfg
    ./bin/supervisorctl restart max


.. note:: Each time you run the buildout, the changes on presets will be lost.

Now you can load several browser tabs with diferent users, by appending the parameter ``user=<username>`` in the url.


Developing instructions
-----------------------

TODO

Releasing a new widget version
------------------------------

TODO
