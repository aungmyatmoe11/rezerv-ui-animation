/**
 * Centralized copy for sections, chrome, and UI hints.
 * Titles, eyebrows, ledes, and alt text editable without hunting JSX.
 * 
 * မြန်မာဘာသာ မှတ်ချက် - Section များအတွက် စာသားများကို ဗဟိုချုပ်စုထားခြင်း
 */

export interface SectionCopy {
  eyebrow: string;
  title: string;
  lede?: string;
  alt?: string;
  coda?: string;
}

export const SECTION_COPY = {
  design: {
    eyebrow: 'Design',
    title: 'Refined, not replaced.',
    lede: 'iPhone 18 Pro is expected to keep the broad shape and rear camera plateau introduced with iPhone 17 Pro. The meaningful design changes may be subtle.',
    alt: 'Macro concept render of the iPhone 18 Pro camera plateau in Dark Cherry, tracking across the three lenses, the frame edge and the back finish.',
    coda: 'The result could feel evolutionary rather than revolutionary.',
  },
  colors: {
    eyebrow: 'Finishes',
    title: 'Dark Cherry, Sky Blue, Silver.',
    lede: 'Three colours in the expected lineup, measured from mockups and early renders. Dark Cherry is new; a dark grey from early dummies is not expected to ship.',
  },
  dynamicIsland: {
    eyebrow: 'Dynamic Island',
    title: 'Smaller, but not gone.',
    lede: 'The pill may shrink from 20.7 mm to 13.5 mm horizontally if the Face ID array moves under the display. Still visible, narrower.',
  },
  display: {
    eyebrow: 'Display',
    title: '6.3″ and 6.9″. Peak 2,500 nits.',
    lede: 'Pro increases to 6.3″ (from 6.1″), Pro Max to 6.9″ (from 6.7″). ProMotion 1–120 Hz, peak outdoor brightness 2,500 nits, typical 1,200 nits.',
  },
  cameraSensor: {
    eyebrow: 'Sensor',
    title: '1.8″ Sony IMX903. 48 MP.',
    lede: 'A physically larger main sensor delivering more light and lower noise. The module houses four optics.',
  },
  aperture: {
    eyebrow: 'Variable Aperture',
    title: 'f/1.4 to f/4.0, mechanically.',
    lede: 'A reported first for iPhone: a mechanical iris that opens and closes, adapting to light conditions and selective depth of field.',
  },
  a20: {
    eyebrow: 'Performance',
    title: 'A20 Pro chip. 3 nm, second generation.',
    lede: 'A reported 15% CPU gain, 20% GPU gain over A19 Pro. Built on TSMC refined N3P node.',
  },
  c2: {
    eyebrow: 'Connectivity',
    title: 'Qualcomm C2 modem.',
    lede: 'The lineage: C1, C1X and now C2. Faster 5G, Wi-Fi 7, satellite improvements.',
  },
  battery: {
    eyebrow: 'Battery',
    title: '4,288 mAh. Stacked design.',
    lede: 'A reported 10% capacity gain via stacked cell construction. Combined with the efficiency of A20 Pro, all-day battery life.',
  },
  proVsProMax: {
    eyebrow: 'Compare Pro models',
    title: 'Pro and Pro Max.',
    lede: 'Two sizes, otherwise identical cameras, performance and battery per inch.',
  },
  duo: {
    eyebrow: 'iPhone Duo',
    title: 'The foldable.',
    lede: 'A clamshell fold rumoured for 2026. Closed: 5.5″. Open: 7.8″. Thinner than the current Pro, potentially the thinnest iPhone ever made.',
  },
  fold: {
    eyebrow: 'Fold',
    title: '5.5″ closed. 7.8″ open.',
    lede: 'Compact in the pocket. Tablet-sized when unfolded. A hinge mechanism Apple has reportedly prototyped for over three years.',
  },
  thickness: {
    eyebrow: 'Thinness',
    title: 'Under 7 mm. Thinner than any Pro.',
    lede: 'Achieving this while housing a fold mechanism and dual batteries would be a materials and engineering achievement.',
    alt: 'Side profile concept render showing the iPhone Duo thinness, under 7 mm, thinner than the current iPhone Pro.',
  },
  touchId: {
    eyebrow: 'Touch ID',
    title: 'Return of Touch ID. Under-display.',
    lede: 'Face ID when open. Touch ID when closed. Dual biometrics for the first time in iPhone.',
    alt: 'Close-up concept showing under-display Touch ID on the iPhone Duo cover display.',
  },
  duoColors: {
    eyebrow: 'Duo Finishes',
    title: 'Silver, Indigo.',
    lede: 'Two finish options measured from early concept renders. A restrained palette for a premium device.',
  },
  compareDuo: {
    eyebrow: 'Pro vs Duo',
    title: 'Different visions.',
    lede: 'Pro is power and camera in a traditional form. Duo is portability and screen area via the fold.',
  },
  confidence: {
    eyebrow: 'Evidence',
    title: 'How confident are we?',
    lede: 'Every claim carries a grade. Official sources score highest; single-source leaks score lowest. Nothing is presented as fact before Apple announces it.',
  },
  ending: {
    eyebrow: 'Sources',
    title: 'Built from public reporting.',
    lede: 'Every specification, colour and claim traces back to credible sources: journalists, supply chain reports, mockups and leaks.',
  },
} as const satisfies Record<string, SectionCopy>;

// Hero copy
export const HERO_COPY = {
  eyebrow: 'Unofficial concept — September 2026',
  subtitle: 'iPhone 18 Pro and Duo. The rumour, reconstructed.',
  alt: 'Dark Cherry iPhone 18 Pro concept render resolving into an iPhone 18 Pro title card.',
} as const;

// UI hints and chrome
export const UI_COPY = {
  skipLink: 'Skip to content',
  backToTop: 'Back to top',
  loadingLabel: 'Loading the iPhone 18 Pro sequence',
  unofficialBadge: 'Unofficial concept',
  navLabel: 'Sections',
  footerDisclaimer: 'Unofficial concept project. Not affiliated with, sponsored by, or endorsed by Apple Inc. All visuals are independent concept renders.',
} as const;
