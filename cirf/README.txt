CIRF Form Comparison
====================

This package contains the four Salesforce/Formstack forms isolated in separate
HTML documents and displayed together from index.html.

Files:
- index.html
- cirf-public.html
- cirf-portal.html
- cirf-public-uat.html
- cirf-portal-uat.html

Deploy all files together in the same directory on an HTTPS web server and open
index.html.

Each embedded form runs in its own iframe document, preventing the repeated
jsFastForms ID and Formstack runtime from conflicting between forms.
