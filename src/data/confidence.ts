/**
 * The confidence system is the spine of this site.
 *
 * Everything here is pre-announcement reporting, so the honest move is to grade
 * each claim rather than present all of them with equal authority. It is also
 * how the page absorbs its own asset problems: several source clips have
 * unverified figures rendered into the pixels ("Up to 15% Faster", "48MP",
 * "4,288mah"), and rather than crop them out we label them.
 */
export type Confidence = 'official' | 'high' | 'developing' | 'uncertain' | 'concept';

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  official: 'Official',
  high: 'High confidence',
  developing: 'Developing',
  uncertain: 'Uncertain',
  concept: 'Concept',
};

export const CONFIDENCE_NOTE: Record<Confidence, string> = {
  official: 'Confirmed directly by Apple.',
  high: 'Repeated by multiple credible sources, or supported by physical components.',
  developing: 'Credible reporting exists, but details conflict.',
  uncertain: 'Reported once or since contradicted. Treat as unconfirmed.',
  concept: 'A visualisation built from reported information. Not a real product image.',
};
