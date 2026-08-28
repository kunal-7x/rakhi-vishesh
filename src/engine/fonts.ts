export interface FontSpec {
  family: string;
  fallback: string;
  weight: string | number;
}

export const FONT_HEADS: FontSpec = { family: "Anton", fallback: "'Arial Black', sans-serif", weight: 400 };
export const FONT_SCRIPT: FontSpec = { family: "'Billion Dreams'", fallback: "'Dancing Script', cursive", weight: 400 };
export const FONT_HINDI: FontSpec = { family: "'Yatra One'", fallback: "'Tiro Devanagari Hindi', 'Noto Sans Devanagari', serif", weight: 400 };
export const FONT_BODY: FontSpec = { family: "Jost", fallback: "sans-serif", weight: 600 };

export async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    const specs = [
      `400 52px 'Anton'`,
      `400 52px 'Billion Dreams'`,
      `700 52px 'Dancing Script'`,
      `600 52px 'Jost'`,
      `500 52px 'Jost'`,
      `400 52px 'Yatra One'`,
    ];
    for (const s of specs) {
      try {
        await document.fonts.load(s, "Happy Raksha Bandhan");
      } catch {
        // individual load may fail — continue
      }
    }
    await document.fonts.ready;
  } catch {
    // fonts are optional; fallbacks are built in
  }
}

export const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Dancing+Script:wght@500;700&family=Jost:wght@400;500;600;700&family=Yatra+One&display=swap');
  @import url('https://fonts.cdnfonts.com/css/billion-dreams');
`;
