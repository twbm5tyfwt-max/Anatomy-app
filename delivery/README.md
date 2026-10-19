# Open the Forma anatomy app

Download `forma-preview.zip` from this folder using GitHub’s download-file button, then extract it and open `forma-preview.html` in a desktop browser. This standalone version needs no Node installation or development server. It bundles the anatomy artwork, fonts, quiz engine, and document parsers.

`forma-preview.png` shows the app’s initial screen. The complete editable React project is at the repository root; its README explains development setup, validation, and coverage.

The standalone version passed all 10 browser workflows when served as a single HTML document, with no separate asset requests. The development environment’s managed browser blocks direct `file:` navigation, so opening the file directly must be checked in your own browser.

The app is an introductory 2D atlas, with 51 structure entries and 25 tissue schematics. OpenStax artwork and adapted educational content are CC BY-NC-SA 4.0. Credits and required license notices are included in the ZIP.
