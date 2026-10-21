# Can this be sold? Current status

**Today: no, this bundle is for noncommercial educational use only.** The code and the content written for this project (PT/AT text, quiz logic, UI) are original, but some bundled media carry NonCommercial licenses. This is an inventory of what the repository documents, not legal advice.

Run `npm run audit:license` for the current list. At the time of writing:

## Blocks commercial use
| Asset | License | Fix |
| --- | --- | --- |
| 34 OpenStax Anatomy & Physiology 2e figures in `public/anatomy` (tissue plates, microscopy, organ plates) | CC BY-NC-SA 4.0 | Replace with original diagrams or CC0 / CC BY / public-domain microscopy and plates. The tissue and 2D "Published plates" sections depend on them. |
| Inner-ear model (Univ. of Dundee) inside `anatomy.glb` | CC BY-NC-SA 4.0 | Remove from the model build, or ask for permission. |
| Kidney model (Lissie Cowley) inside `anatomy.glb` | CC BY-NC 4.0 | Remove from the model build, or ask for permission. |

## Allowed with conditions
- Z-Anatomy and BodyParts3D geometry (CC BY-SA 4.0 / 2.1 JP): commercial use is allowed with attribution, but ShareAlike applies to adaptations of the model files. Get a lawyer to confirm how that interacts with the license you choose for the app.
- Wikipedia-derived readings (CC BY-SA): attribution and ShareAlike.
- Human Reference Atlas female organs and Uberon definitions (CC BY): attribution.
- Tesseract.js and English OCR data (Apache-2.0): keep notices.
- Fonts and npm packages: see `THIRD_PARTY_LICENSES.txt` in the export.

## Also needed for a paid health-education product
- Clinician review of the PT/AT content, plus a disclaimer and terms reviewed by a lawyer.
- Verified source links and review dates (the build environment could not open the cited sites).
- A privacy statement. Uploads currently stay in the browser (IndexedDB/localStorage) and no analytics or server exists; adding accounts or payments changes that.
- App-store packaging (e.g. Capacitor) and payment handling are not built.

If you keep it noncommercial, nothing above needs to change: keep the credits, license summary and `ASSET_CREDITS.md` with every copy.
