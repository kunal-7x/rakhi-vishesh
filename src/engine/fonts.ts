export interface FontSpec {
  family: string;
  fallback: string;
  weight: string | number;
}

export const FONT_HEADS: FontSpec = { family: "Rajdhani", fallback: "'Arial Black', sans-serif", weight: 700 };
export const FONT_SCRIPT: FontSpec = { family: "Dancing Script", fallback: "cursive", weight: 700 };
export const FONT_BODY: FontSpec = { family: "Jost", fallback: "sans-serif", weight: 600 };

export async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    const specs = [
      `700 52px 'Rajdhani'`,
      `900 52px 'Rajdhani'`,
      `700 52px 'Dancing Script'`,
      `600 52px 'Jost'`,
      `500 52px 'Jost'`,
    ];
    for (const s of specs) {
      await document.fonts.load(s, "Happy Raksha Bandhan");
    }
    await document.fonts.ready;
  } catch {
    // fonts are optional; fallbacks are built in
  }
}

export const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Dancing+Script:wght@500;700&family=Jost:wght@400;500;600;700&display=swap');
`;
