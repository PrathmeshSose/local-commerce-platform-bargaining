# Local catalogue photos — sources & licences

These are the real furniture photos the customer catalogue falls back to when a
listing record carries **no usable image** (empty `images`, or only a reserved
placeholder host such as `example.com` / `example.invalid`).

Every file was downloaded, opened and visually checked against the listing it
is matched to (see the `Used for` column). They are served locally from
`/img/products/…`, so the page does not depend on a remote host staying
reachable or on the browser allowing hot-linked images.

**Licence — all images: [Pexels License](https://www.pexels.com/license/)**
(free for commercial and non-commercial use, no attribution required; keeping
this credit file is a courtesy, not a requirement). No image was altered.

| File | Depicts | Used for | Pexels photo |
|------|---------|----------|--------------|
| `rattan-lounge-chair.jpg` | Rattan peacock lounge chair with cushion | Rattan Lounge Chair | [5825409](https://www.pexels.com/photo/5825409) |
| `study-desk.jpg` | Wooden study desk with hutch and drawers | Sheesham Study Desk | [8135285](https://www.pexels.com/photo/8135285) |
| `wooden-stool.jpg` | Single wooden stool | Disposable Stool | [10557274](https://www.pexels.com/photo/10557274) |
| `writing-desk.jpg` | Wooden writing desk with chair | Phase5 Accept Desk, other unmatched `desk` listings | [8250983](https://www.pexels.com/photo/8250983) |
| `accent-chair.jpg` | Upholstered accent chair (studio shot) | Phase5 Reject Chair, other unmatched `chair` listings | [12269764](https://www.pexels.com/photo/12269764) |
| `counter-shelf.jpg` | Shelf unit with cubbies | Phase5 Counter Shelf | [34117279](https://www.pexels.com/photo/34117279) |
| `leather-recliner.jpg` | Leather recliner chairs | QA Phase4 Recliner, other unmatched `recliner` listings | [8583821](https://www.pexels.com/photo/8583821) |
| `bookshelf.jpg` | Wooden bookshelf filled with books | QA Phase4 Bookshelf, other unmatched `bookshelf` listings | [9572664](https://www.pexels.com/photo/9572664) |
| `fabric-sofa.jpg` | Three-seater fabric sofa | QA Phase6 Sofa, other unmatched `sofa`/`couch` listings | [6758245](https://www.pexels.com/photo/6758245) |
| `wooden-dining-chair.jpg` | Wooden dining chair | QA Phase6 Chair | [29917912](https://www.pexels.com/photo/29917912) |
| `storage-shelf.jpg` | Wooden storage shelf unit | QA7 NoPhoto Shelf, other unmatched `shelf`/`rack` listings | [18620041](https://www.pexels.com/photo/18620041) |
| `grey-sofa.jpg` | Grey fabric sofa | QA7 BrokenPhoto Sofa | [4857775](https://www.pexels.com/photo/4857775) |
| `tan-couch.jpg` | Tan couch with cushions | QA7 Bargain Couch | [9052462](https://www.pexels.com/photo/9052462) |
| `leather-armchair.jpg` | Button-tufted leather armchair | QA7 Validation Chair, other unmatched `armchair` listings | [14110168](https://www.pexels.com/photo/14110168) |
| `teak-wooden-sofa.jpg` | Sofa with solid wood frame | Teak Sofa | [39134599](https://www.pexels.com/photo/39134599) |

Listings that cannot be matched with a suitable photo keep the existing
"Photo coming soon" card placeholder / category graphic on the detail page.
The resolution logic lives in `frontend/src/utils/productPhotos.js`; a photo
uploaded by a merchant always takes precedence over these files.
