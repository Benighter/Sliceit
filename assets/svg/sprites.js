// Sprite definitions as base64 SVG
const BASE_SPRITES = {
    book: `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
            <rect x="5" y="10" width="70" height="80" fill="#8B4513" />
            <rect x="10" y="15" width="60" height="70" fill="#F4A460" />
            <line x1="40" y1="15" x2="40" y2="85" stroke="#8B4513" stroke-width="2" />
        </svg>
    `)}`,
    
    lightBulb: `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
            <circle cx="40" cy="40" r="30" fill="#FFD700" />
            <path d="M40 70 L40 90 M30 80 H50" stroke="#808080" stroke-width="4" fill="none" />
            <circle cx="40" cy="40" r="15" fill="#FFFFFF" opacity="0.5" />
        </svg>
    `)}`,
    
    coffeeMug: `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M10 30 Q10 10 30 10 H60 Q80 10 80 30 V70 Q80 90 60 90 H30 Q10 90 10 70 Z" fill="#4169E1" />
            <path d="M80 40 H90 Q100 40 100 50 V60 Q100 70 90 70 H80" fill="none" stroke="#4169E1" stroke-width="5" />
        </svg>
    `)}`,
    
    bomb: `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="60" r="35" fill="#000000" />
            <path d="M50 25 Q55 5 70 10 T90 25" fill="none" stroke="#000000" stroke-width="4" />
            <circle cx="90" cy="25" r="8" fill="#FF0000" />
            <circle cx="65" cy="50" r="10" fill="#FFFFFF" opacity="0.3" />
        </svg>
    `)}`
};

// Create Image objects for each sprite
const sprites = {};
Object.entries(BASE_SPRITES).forEach(([key, src]) => {
    sprites[key] = new Image();
    sprites[key].src = src;
});

// Create golden versions
sprites.goldenBook = sprites.book;
sprites.goldenLightBulb = sprites.lightBulb;
sprites.goldenCoffeeMug = sprites.coffeeMug;