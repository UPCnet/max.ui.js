max.ui.js
==========

Plugin jQuery per construïr una interfície estil "gadget" per insertar en
qualsevol aplicació web.

Utilització
-------------

Per incloure el max.ui en la nostra aplicació, hem de incloure la llibreria principal max.ui.js
en l'html de la nostra aplicació::

<script type="text/javascript" src="max.ui.js"></script>

I instanciar el plugin en l'element dins el qual volguem renderitzar-lo::

$('#container').maxUI(settings)

`settings` és un objecte javascript amb els paràmetres que necessita el max.ui.js per funcionar


Opcions
-------

``opcio`` [`String:default`]
  Descripció

Requeriments
------------

max.ui.js depèn de:

* jQuery
* jquery.easydate.js
* hogan.js

