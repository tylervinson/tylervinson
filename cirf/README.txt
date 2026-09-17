CIRF Form Dashboard
===================

This package already contains all four supplied Salesforce/Formstack embed scripts.

Keep these files together in one web-server folder and open index.html over HTTPS.

Each form runs inside its own HTML document/iframe. This isolates Formstack runtime globals and the repeated id="jsFastForms" so the four embeds do not collide with one another.
