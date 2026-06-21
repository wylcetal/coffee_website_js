const express = require('express');
const router = express.Router();

// Curated gallery metadata. The actual images live in /images and are served
// as static files. Keeping metadata here lets the frontend render captions
// without scraping the filesystem.
const GALLERY = [
    { src: 'images/gallery-1.jpg', alt: 'Coffee art in a cup',         tag: 'craft' },
    { src: 'images/gallery-2.jpg', alt: 'Cozy corner of the shop',      tag: 'space' },
    { src: 'images/gallery-3.jpg', alt: 'Latte being poured',           tag: 'craft' },
    { src: 'images/gallery-4.jpg', alt: 'Pastries display',             tag: 'food'  },
    { src: 'images/gallery-5.jpg', alt: 'Fresh coffee beans',           tag: 'beans' },
    { src: 'images/gallery-6.jpg', alt: 'Our barista at work',          tag: 'team'  },
];

router.get('/', (req, res) => {
    const { tag } = req.query;
    const items = tag ? GALLERY.filter(g => g.tag === tag) : GALLERY;
    res.json({ count: items.length, items });
});

module.exports = router;
