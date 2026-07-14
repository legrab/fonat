import { z } from 'zod';

export const mathPlotSchema = z.object({
  kind: z.literal('math.2d-plot'),
  viewport: z.object({ x: z.tuple([z.number(), z.number()]), y: z.tuple([z.number(), z.number()]) }),
  axes: z.boolean().default(true),
  points: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        label: z.string().optional(),
        movable: z.boolean().default(false)
      })
    )
    .default([]),
  segments: z
    .array(
      z.object({
        from: z.tuple([z.number(), z.number()]),
        to: z.tuple([z.number(), z.number()]),
        label: z.string().optional()
      })
    )
    .default([]),
  polynomials: z
    .array(z.object({ coefficients: z.array(z.number()).min(1), label: z.string().optional() }))
    .default([]),
  trig: z
    .array(
      z.object({
        function: z.enum(['sin', 'cos']),
        amplitude: z.number().default(1),
        period: z
          .number()
          .positive()
          .default(2 * Math.PI),
        phase: z.number().default(0),
        verticalShift: z.number().default(0),
        label: z.string().optional()
      })
    )
    .default([])
});
export type MathPlot = z.infer<typeof mathPlotSchema>;

const triples = [
  [3, 4, 5],
  [5, 12, 13],
  [6, 8, 10],
  [8, 15, 17],
  [9, 12, 15],
  [7, 24, 25]
] as const;

function seededIndex(seed: string, length: number): number {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return Math.abs(hash) % length;
}

export type GeneratedPythagorean = {
  seed: string;
  form: 'missing-hypotenuse' | 'missing-first-leg' | 'missing-second-leg' | 'context';
  a: number;
  b: number;
  c: number;
  promptHu: string;
  expected: number;
};

export function generatePythagorean(seed: string, form: GeneratedPythagorean['form']): GeneratedPythagorean {
  const [a, b, c] = triples[seededIndex(seed, triples.length)] ?? triples[0];
  const promptHu =
    form === 'missing-hypotenuse'
      ? `Egy derékszögű háromszög befogói ${a} cm és ${b} cm hosszúak. Mekkora az átfogó?`
      : form === 'missing-first-leg'
        ? `Egy derékszögű háromszög átfogója ${c} cm, egyik befogója ${b} cm. Mekkora a másik befogó?`
        : form === 'missing-second-leg'
          ? `Egy derékszögű háromszög átfogója ${c} cm, egyik befogója ${a} cm. Mekkora a másik befogó?`
          : `Egy ${a} m széles és ${b} m hosszú téglalap alakú udvaron átlósan vezetünk át egy kábelt. Milyen hosszú a kábel?`;
  const expected =
    form === 'missing-hypotenuse' || form === 'context' ? c : form === 'missing-first-leg' ? a : b;
  return { seed, form, a, b, c, promptHu, expected };
}

export const mathModuleManifest = {
  id: 'math',
  version: '0.1.0',
  title: 'Mathematics',
  capabilities: ['math.katex', 'math.numeric-grading', 'math.pythagorean-family', 'math.2d-plot'],
  resourceTypes: ['math.2d-plot'],
  exerciseFamilies: ['family.pythagorean-integer-triples']
};
