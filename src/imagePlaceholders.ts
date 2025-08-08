// Deterministic inline SVG data URI placeholders to avoid network flicker / blanks
// Colors chosen to differentiate categories; all 300x200 to keep layout stable
function svg(label: string, bg: string): string {
  const safeLabel = label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const raw = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>`+
              `<rect width='300' height='200' fill='${bg}'/>`+
              `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial,Helvetica,sans-serif' font-size='28'>${safeLabel}</text>`+
              `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(raw);
}

const map: Record<string,string> = {
  electronics: svg('Electronics', '#1e88e5'),
  fitness: svg('Fitness', '#43a047'),
  furniture: svg('Furniture', '#6d4c41'),
  footwear: svg('Footwear', '#ab47bc'),
  appliances: svg('Appliance', '#fb8c00'),
  default: svg('Product', '#9e9e9e')
};

export function categoryImage(category?: string | null): string {
  if (!category) return map.default;
  const key = category.toLowerCase();
  // normalize some variants
  if (key.includes('appliance')) return map.appliances;
  return map[key] || map.default;
}

export function productImage(p: { category?: string | null; image?: string | null }): string {
  return p.image && p.image.startsWith('data:') ? p.image : (p.image && p.image.trim() !== '' && !p.image.startsWith('http') ? p.image : (p.image && p.image.length > 10 ? p.image : categoryImage(p.category)));
}
