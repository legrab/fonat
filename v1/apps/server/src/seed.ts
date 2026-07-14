import { randomUUID } from 'node:crypto';
import type {
  ExercisePayload,
  GraphNode,
  GraphRelation,
  LearnerProfile,
  LessonPayload,
  NodeRevision,
  Submission
} from '@fonat/contracts';
import { generatePythagorean } from '@fonat/math-module';
import type {
  ActivityRecord,
  AssessmentInstanceRecord,
  ClassroomAccess,
  EvidenceRecord,
  LessonRunRecord,
  LiveSessionRecord,
  NotificationRecord
} from './repository/types.js';

const packageId = 'fonat.demo.grade8';
const probabilityPackageId = 'fonat.demo.grade11';
const now = '2026-07-13T12:00:00.000Z';
const later = '2026-07-13T12:05:00.000Z';
const rights = {
  status: 'project-owned' as const,
  license: 'CC BY-NC-SA 4.0',
  attribution: 'Fonat reference content',
  redistributionAllowed: true
};

function text(hu: string, en?: string) {
  return { canonicalLanguage: 'hu', values: { hu, ...(en ? { en } : {}) } };
}

function node(input: {
  id: string;
  type: GraphNode['type'];
  hu: string;
  en?: string;
  summaryHu?: string;
  lifecycle?: GraphNode['lifecycle'];
  quality?: GraphNode['quality'];
  payload?: Record<string, unknown>;
  tags?: string[];
  pkg?: string;
  revision?: number;
}): GraphNode {
  return {
    id: input.id,
    type: input.type,
    title: text(input.hu, input.en),
    summary: input.summaryHu ? text(input.summaryHu) : undefined,
    lifecycle: input.lifecycle ?? 'published',
    quality: input.quality ?? 'classroom-tested',
    currentRevision: input.revision ?? 1,
    payload: input.payload ?? {},
    extensions: {},
    provenance: { origin: 'seed', packageId: input.pkg ?? packageId, localKey: input.id },
    rights,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: later
  };
}

function relation(
  type: GraphRelation['type'],
  sourceId: string,
  targetId: string,
  dimensions: Record<string, number> = {},
  pkg = packageId
): GraphRelation {
  return {
    id: `relation.${type}.${sourceId}.${targetId}`,
    type,
    sourceId,
    targetId,
    dimensions,
    metadata: {},
    provenance: { origin: 'seed', packageId: pkg },
    createdAt: now
  };
}

const difficulty = (cognitive: number, prerequisites = cognitive, independence = 3, collaboration = 1) => ({
  cognitive,
  prerequisites,
  independence,
  teacherPreparation: 1,
  collaboration
});

function exercise(input: {
  id: string;
  hu: string;
  en?: string;
  type: ExercisePayload['exerciseType'];
  concepts: string[];
  duration: number;
  difficulty: ReturnType<typeof difficulty>;
  options?: ExercisePayload['options'];
  expected?: ExercisePayload['expected'];
  accepted?: string[];
  tolerance?: number;
  unit?: string;
  evidence?: ExercisePayload['evidenceIntensity'];
  scaffold?: ExercisePayload['scaffold'];
  lifecycle?: GraphNode['lifecycle'];
  quality?: GraphNode['quality'];
  revision?: number;
  summary?: string;
}): GraphNode {
  const payload: ExercisePayload = {
    exerciseType: input.type,
    prompt: text(input.hu, input.en),
    options: input.options ?? [],
    expected: input.expected,
    acceptedAnswers: input.accepted ?? [],
    tolerance: input.tolerance,
    unit: input.unit,
    durationMinutes: input.duration,
    difficulty: input.difficulty,
    evidenceIntensity: input.evidence ?? 'none',
    concepts: input.concepts,
    purpose: ['practice'],
    scaffold: input.scaffold ?? [],
    grading: {},
    presentation: {}
  };
  return node({
    id: input.id,
    type: 'exercise',
    hu: input.hu.slice(0, 70),
    en: input.en?.slice(0, 70),
    summaryHu: input.summary,
    payload,
    tags: ['matematika', ...input.concepts.map((value) => value.replace('concept.', ''))],
    lifecycle: input.lifecycle,
    quality: input.quality,
    revision: input.revision
  });
}

function makeSections(lessonId: string, parts: Array<[string, number, string[]]>): LessonPayload['sections'] {
  return parts.map(([title, minutes, activityIds], index) => ({
    id: `${lessonId}.section.${index + 1}`,
    title,
    durationMinutes: minutes,
    purpose: title.toLocaleLowerCase('hu-HU'),
    requiredActivityKinds: [],
    activityIds,
    slides: [
      {
        id: `${lessonId}.slide.${index + 1}.intro`,
        type: 'section-intro',
        teacherOnly: false,
        title,
        content: `## ${title}`
      },
      ...activityIds.map((exerciseId, itemIndex) => ({
        id: `${lessonId}.slide.${index + 1}.${itemIndex + 1}`,
        type: 'exercise' as const,
        teacherOnly: false,
        exerciseId
      }))
    ]
  }));
}

export async function buildDemoSeed(hashSecret: (value: string) => Promise<string>) {
  const conceptDefs = [
    ['concept.natural-square', 'Természetes szám négyzete', 'Natural-number square'],
    ['concept.exponent-two', 'Második hatvány', 'Exponent with exponent two'],
    ['concept.square-root', 'Négyzetgyök', 'Square root'],
    ['concept.approx-square-root', 'Közelítő négyzetgyök', 'Approximate square root'],
    ['concept.length-units', 'Hosszúság és mértékegységek', 'Length and units'],
    ['concept.unit-conversion', 'Mértékegység-átváltás', 'Unit conversion'],
    ['concept.triangle', 'Háromszög', 'Triangle'],
    ['concept.right-angle', 'Derékszög', 'Right angle'],
    ['concept.right-triangle', 'Derékszögű háromszög', 'Right triangle'],
    ['concept.leg', 'Befogó', 'Leg of a right triangle'],
    ['concept.hypotenuse', 'Átfogó', 'Hypotenuse'],
    ['concept.square-area', 'Négyzet területe', 'Square area'],
    ['concept.pythagorean', 'Pitagorasz-tétel', 'Pythagorean theorem'],
    ['concept.identify-hypotenuse', 'Az átfogó felismerése', 'Identify the hypotenuse'],
    ['concept.missing-hypotenuse', 'Hiányzó átfogó kiszámítása', 'Calculate a missing hypotenuse'],
    ['concept.missing-leg', 'Hiányzó befogó kiszámítása', 'Calculate a missing leg'],
    ['concept.validate-sides', 'Háromszög oldalainak ellenőrzése', 'Validate triangle side lengths'],
    ['concept.converse', 'A Pitagorasz-tétel megfordítása', 'Converse of the Pythagorean theorem'],
    ['concept.plausibility', 'Becslés és valószerűségi ellenőrzés', 'Estimation and plausibility check'],
    ['concept.math-modelling', 'Matematikai modell szövegből', 'Mathematical modelling from text'],
    ['concept.rectangle-diagonal', 'Téglalap átlója', 'Rectangle diagonal'],
    ['concept.coordinate-plane', 'Koordináta-rendszer', 'Coordinate plane'],
    ['concept.point-distance', 'Két pont távolsága', 'Distance between two points'],
    ['concept.visual-area-proof', 'A tétel területi szemléltetése', 'Visual area interpretation']
  ] as const;
  const nodes: GraphNode[] = conceptDefs.map(([id, hu, en]) =>
    node({ id, type: 'concept', hu, en, tags: ['matematika', 'geometria'] })
  );

  const rightTriangleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" role="img"><title>Derékszögű háromszög befogókkal és átfogóval</title><path d="M40 180 L40 40 L270 180 Z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M40 160 h20 v20" fill="none" stroke="currentColor" stroke-width="3"/><text x="20" y="110" font-size="20">a</text><text x="145" y="205" font-size="20">b</text><text x="170" y="95" font-size="20">c</text></svg>`;
  const proofSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" role="img"><title>A Pitagorasz-tétel területi szemléltetése</title><path d="M90 190 L90 70 L250 190 Z" fill="none" stroke="currentColor" stroke-width="4"/><rect x="40" y="70" width="50" height="120" fill="none" stroke="currentColor"/><rect x="90" y="190" width="160" height="45" fill="none" stroke="currentColor"/><text x="130" y="130" font-size="22">a² + b² = c²</text></svg>`;
  nodes.push(
    node({
      id: 'resource.right-triangle-vocabulary',
      type: 'resource',
      hu: 'Derékszögű háromszög szókincse',
      en: 'Right-triangle vocabulary',
      payload: {
        kind: 'markdown',
        markdown:
          '## Befogók és átfogó\nA derékszöget közrefogó oldalak a **befogók**. A derékszöggel szemközti oldal az **átfogó**.',
        svg: rightTriangleSvg,
        altHu: 'Derékszögű háromszög a, b befogókkal és c átfogóval.'
      },
      tags: ['geometria', 'szókincs']
    }),
    node({
      id: 'resource.pythagorean-visual-proof',
      type: 'resource',
      hu: 'A Pitagorasz-tétel területi képe',
      en: 'Area-based Pythagorean proof',
      payload: {
        kind: 'markdown',
        markdown:
          'A befogókra rajzolt négyzetek területének összege megegyezik az átfogóra rajzolt négyzet területével.',
        svg: proofSvg,
        altHu: 'Négyzetekkel szemléltetett Pitagorasz-tétel.'
      },
      tags: ['bizonyítás', 'vizualizáció']
    }),
    node({
      id: 'resource.missing-hypotenuse-worked-example',
      type: 'resource',
      hu: 'Hiányzó átfogó: kidolgozott példa',
      payload: {
        kind: 'markdown',
        markdown:
          '1. Jelöld az átfogót.\n2. Írd fel: $a^2+b^2=c^2$.\n3. Helyettesíts be.\n4. Vonj gyököt.\n\nPélda: $6^2+8^2=c^2$, ezért $c=10$.'
      },
      tags: ['lépésről-lépésre']
    }),
    node({
      id: 'resource.missing-leg-worked-example',
      type: 'resource',
      hu: 'Hiányzó befogó: kidolgozott példa',
      payload: {
        kind: 'markdown',
        markdown: 'Ha az átfogó ismert: $a^2=c^2-b^2$. Gyakori hiba, hogy a kivonás sorrendje megfordul.'
      },
      tags: ['lépésről-lépésre', 'gyakori-hiba']
    }),
    node({
      id: 'resource.coordinate-distance-bridge',
      type: 'resource',
      hu: 'Koordinátakülönbségekből derékszögű háromszög',
      payload: {
        kind: 'math.2d-plot',
        viewport: { x: [-1, 8], y: [-1, 7] },
        axes: true,
        points: [
          { x: 1, y: 1, label: 'A' },
          { x: 7, y: 5, label: 'B' }
        ],
        segments: [
          { from: [1, 1], to: [7, 1], label: 'Δx' },
          { from: [7, 1], to: [7, 5], label: 'Δy' },
          { from: [1, 1], to: [7, 5], label: 'd' }
        ]
      },
      tags: ['koordináta', 'mafs']
    }),
    node({
      id: 'resource.wolfram-pythagorean-exploration',
      type: 'resource',
      hu: 'Pitagorasz-tétel felfedezése a WolframAlpha segítségével',
      payload: {
        kind: 'external-link',
        provider: 'wolfram-alpha',
        labelHu: 'Nyisd meg az interaktív példát',
        expression: '3^2+4^2=5^2',
        url: 'https://www.wolframalpha.com/input?i=3%5E2%2B4%5E2%3D5%5E2',
        externallyHosted: true
      },
      tags: ['külső', 'wolfram']
    })
  );

  const scaffold = [
    { level: 1, label: 'Első tipp', content: text('Először keresd meg a derékszöggel szemközti oldalt.') },
    { level: 2, label: 'Képlet', content: text('Használd: $a^2+b^2=c^2$.') },
    { level: 3, label: 'Első lépés', content: text('Számítsd ki külön a két befogó négyzetét.') },
    {
      level: 4,
      label: 'Teljes magyarázat',
      content: text('Add össze a négyzeteket, majd vond ki a négyzetgyököt.')
    }
  ];
  const option = (id: string, hu: string, correct = false) => ({ id, text: text(hu), correct });
  const exercises = [
    exercise({
      id: 'exercise.identify-hypotenuse-01',
      hu: 'Melyik oldal az átfogó a derékszögű háromszögben?',
      en: 'Which side is the hypotenuse?',
      type: 'single-choice',
      concepts: ['concept.hypotenuse', 'concept.identify-hypotenuse'],
      duration: 2,
      difficulty: difficulty(1),
      options: [option('a', 'Az a oldal'), option('b', 'A b oldal'), option('c', 'A c oldal', true)]
    }),
    exercise({
      id: 'exercise.identify-hypotenuse-02',
      hu: 'A háromszöget elforgattuk. Jelöld ki az átfogót!',
      type: 'single-choice',
      concepts: ['concept.hypotenuse', 'concept.identify-hypotenuse'],
      duration: 2,
      difficulty: difficulty(1),
      options: [
        option('p', 'A derékszöget közrefogó rövidebb oldal'),
        option('q', 'A derékszöggel szemközti oldal', true),
        option('r', 'Bármelyik leghosszabbnak tűnő oldal')
      ]
    }),
    exercise({
      id: 'exercise.square-values-recap',
      hu: 'Rendezd növekvő sorrendbe: 3², 6², 4², 5².',
      type: 'ordered',
      concepts: ['concept.natural-square', 'concept.exponent-two'],
      duration: 4,
      difficulty: difficulty(1),
      expected: ['3²', '4²', '5²', '6²']
    }),
    exercise({
      id: 'exercise.square-root-recap',
      hu: 'Mennyi $\\sqrt{144}$?',
      type: 'numeric',
      concepts: ['concept.square-root'],
      duration: 4,
      difficulty: difficulty(1),
      expected: 12
    }),
    exercise({
      id: 'exercise.discover-3-4-5',
      hu: 'Hasonlítsd össze a 3, 4 és 5 oldalú derékszögű háromszög oldalaira rajzolt négyzetek területét. Mit veszel észre?',
      type: 'manual-explanation',
      concepts: ['concept.visual-area-proof', 'concept.pythagorean'],
      duration: 8,
      difficulty: difficulty(2, 2, 2, 3),
      evidence: 'light',
      summary: 'Felfedeztető területi feladat.'
    }),
    exercise({
      id: 'exercise.theorem-true-false',
      hu: 'Igaz vagy hamis: a Pitagorasz-tétel minden háromszögre alkalmazható.',
      type: 'true-false',
      concepts: ['concept.pythagorean', 'concept.right-triangle'],
      duration: 4,
      difficulty: difficulty(2),
      options: [option('true', 'Igaz'), option('false', 'Hamis', true)]
    }),
    exercise({
      id: 'exercise.missing-hypotenuse-6-8',
      hu: 'Egy derékszögű háromszög befogói 6 cm és 8 cm hosszúak. Mekkora az átfogó?',
      type: 'numeric',
      concepts: ['concept.missing-hypotenuse', 'concept.pythagorean'],
      duration: 5,
      difficulty: difficulty(2),
      expected: 10,
      unit: 'cm',
      scaffold
    }),
    exercise({
      id: 'exercise.missing-hypotenuse-decimal',
      hu: 'Egy derékszögű háromszög befogói 5 cm és 7 cm. Add meg az átfogót két tizedesre kerekítve!',
      type: 'numeric',
      concepts: ['concept.missing-hypotenuse', 'concept.approx-square-root', 'concept.plausibility'],
      duration: 6,
      difficulty: difficulty(3),
      expected: 8.6,
      tolerance: 0.02,
      unit: 'cm',
      evidence: 'light',
      scaffold
    }),
    exercise({
      id: 'exercise.missing-leg-13-5',
      hu: 'Egy derékszögű háromszög átfogója 13 cm, egyik befogója 5 cm. Mekkora a másik befogó?',
      type: 'numeric',
      concepts: ['concept.missing-leg', 'concept.pythagorean'],
      duration: 6,
      difficulty: difficulty(3),
      expected: 12,
      unit: 'cm',
      scaffold
    }),
    exercise({
      id: 'exercise.missing-leg-common-mistake',
      hu: 'Egy tanuló ezt írta: $a^2=5^2-13^2$. Melyik az első hibás lépés, és hogyan javítanád?',
      type: 'manual-explanation',
      concepts: ['concept.missing-leg', 'concept.plausibility'],
      duration: 6,
      difficulty: difficulty(3),
      evidence: 'standard'
    }),
    exercise({
      id: 'exercise.rectangle-diagonal',
      hu: 'Egy téglalap oldalai 9 cm és 12 cm. Mekkora az átlója?',
      type: 'numeric',
      concepts: ['concept.rectangle-diagonal', 'concept.missing-hypotenuse'],
      duration: 7,
      difficulty: difficulty(2),
      expected: 15,
      unit: 'cm'
    }),
    exercise({
      id: 'exercise.ladder-wall',
      hu: 'Egy 10 m hosszú létra alja 6 m-re van a faltól. Milyen magasra ér fel?',
      type: 'numeric',
      concepts: ['concept.math-modelling', 'concept.missing-leg', 'concept.length-units'],
      duration: 8,
      difficulty: difficulty(3),
      expected: 8,
      unit: 'm',
      evidence: 'light'
    }),
    exercise({
      id: 'exercise.is-right-triangle',
      hu: 'Mely oldalhármasok alkothatnak derékszögű háromszöget?',
      type: 'multi-select',
      concepts: ['concept.validate-sides', 'concept.converse'],
      duration: 7,
      difficulty: difficulty(3),
      options: [
        option('345', '3, 4, 5', true),
        option('5610', '5, 6, 10'),
        option('51213', '5, 12, 13', true),
        option('7810', '7, 8, 10')
      ]
    }),
    exercise({
      id: 'exercise.converse-explanation',
      hu: 'Mutasd meg számítással, hogy az 8, 15, 17 oldalhármas derékszögű háromszöget ad!',
      type: 'manual-explanation',
      concepts: ['concept.converse', 'concept.validate-sides'],
      duration: 8,
      difficulty: difficulty(4),
      evidence: 'deep'
    }),
    exercise({
      id: 'exercise.coordinate-distance-01',
      hu: 'Mekkora az A(1;1) és B(7;9) pontok távolsága?',
      type: 'numeric',
      concepts: ['concept.point-distance', 'concept.coordinate-plane'],
      duration: 7,
      difficulty: difficulty(3),
      expected: 10
    }),
    exercise({
      id: 'exercise.coordinate-distance-02',
      hu: 'Mekkora az A(-1;2) és B(4;8) pontok távolsága két tizedesre?',
      type: 'numeric',
      concepts: ['concept.point-distance', 'concept.approx-square-root'],
      duration: 8,
      difficulty: difficulty(4),
      expected: 7.81,
      tolerance: 0.02
    }),
    exercise({
      id: 'exercise.choose-method',
      hu: 'Melyik módszer kell: hiányzó átfogó, hiányzó befogó vagy nem alkalmazható a tétel?',
      type: 'single-choice',
      concepts: ['concept.identify-hypotenuse', 'concept.pythagorean'],
      duration: 6,
      difficulty: difficulty(2),
      evidence: 'light',
      options: [
        option('hypotenuse', 'Hiányzó átfogó', true),
        option('leg', 'Hiányzó befogó'),
        option('na', 'Nem alkalmazható')
      ]
    }),
    exercise({
      id: 'exercise.exit-ticket',
      hu: 'Egy 9 és 12 egység hosszú befogójú háromszög átfogója? Add meg a választ, majd jelöld a magabiztosságodat.',
      type: 'exit-ticket',
      concepts: ['concept.missing-hypotenuse', 'concept.plausibility'],
      duration: 4,
      difficulty: difficulty(2),
      expected: 15,
      evidence: 'light'
    }),
    exercise({
      id: 'exercise.ambiguous-draft',
      hu: 'Számítsd ki a háromszöget!',
      type: 'manual-explanation',
      concepts: ['concept.triangle'],
      duration: 5,
      difficulty: difficulty(2),
      lifecycle: 'draft',
      quality: 'experimental',
      summary: 'Szándékosan kétértelmű demófeladat.'
    })
  ];
  nodes.push(...exercises);

  const generated = [
    ['generated.pythagoras.a', 'alpha', 'missing-hypotenuse'],
    ['generated.pythagoras.b', 'beta', 'missing-first-leg'],
    ['generated.pythagoras.c', 'gamma', 'missing-second-leg'],
    ['generated.pythagoras.d', 'delta', 'context'],
    ['generated.pythagoras.e', 'epsilon', 'missing-hypotenuse'],
    ['generated.pythagoras.f', 'zeta', 'context']
  ] as const;
  for (const [id, seed, form] of generated) {
    const item = generatePythagorean(seed, form);
    nodes.push(
      exercise({
        id,
        hu: item.promptHu,
        type: 'numeric',
        concepts: [
          'concept.pythagorean',
          form.includes('leg') ? 'concept.missing-leg' : 'concept.missing-hypotenuse'
        ],
        duration: 5,
        difficulty: difficulty(2),
        expected: item.expected,
        unit: form === 'context' ? 'm' : 'cm',
        summary: `Reprodukálható generált példány: ${seed}`
      })
    );
  }
  nodes.push(
    node({
      id: 'family.pythagorean-integer-triples',
      type: 'exercise-family',
      hu: 'Egész Pitagoraszi számhármasok',
      payload: {
        generator: 'math.pythagorean-integer-triples',
        forms: ['missing-hypotenuse', 'missing-first-leg', 'missing-second-leg', 'context'],
        seeds: generated.map(([, seed]) => seed)
      },
      tags: ['generátor', 'pitagorasz']
    })
  );

  nodes.push(
    node({
      id: 'profile.balanced',
      type: 'teaching-profile',
      hu: 'Kiegyensúlyozott normál osztály',
      payload: {
        targetDifficulty: 3,
        repetition: 'moderate',
        evidenceIntensity: 'light',
        participation: ['individual', 'pair', 'whole-class', 'phone'],
        feedback: 'scaffold-first'
      }
    }),
    node({
      id: 'profile.advanced',
      type: 'teaching-profile',
      hu: 'Kis haladó csoport',
      payload: {
        targetDifficulty: 4,
        repetition: 'low',
        transferRatio: 0.3,
        evidenceIntensity: 'standard',
        participation: ['independent', 'discussion'],
        feedback: 'delayed-answer'
      }
    }),
    node({
      id: 'profile.support',
      type: 'teaching-profile',
      hu: 'Támogató fókuszú osztály',
      payload: {
        targetDifficulty: 2,
        repetition: 'high',
        evidenceIntensity: 'light',
        participation: ['guided', 'pair', 'quiet'],
        feedback: 'scaffold-first'
      }
    }),
    node({
      id: 'blueprint.introduction-45',
      type: 'lesson-blueprint',
      hu: '45 perces bevezető óra',
      payload: {
        durationMinutes: 45,
        sections: [
          ['Előkészítés és felidézés', 5],
          ['Problémafelvetés', 8],
          ['Irányított felfedezés', 12],
          ['Formalizálás', 10],
          ['Gyakorlás', 7],
          ['Lezárás', 3]
        ]
      }
    }),
    node({
      id: 'blueprint.practice-45',
      type: 'lesson-blueprint',
      hu: '45 perces gyakorló és megszilárdító óra',
      payload: {
        durationMinutes: 45,
        sections: [
          ['Felidézés', 5],
          ['Kidolgozott példa', 8],
          ['Differenciált gyakorlás', 20],
          ['Interaktív ellenőrzés', 7],
          ['Lezárás és házi feladat', 5]
        ]
      }
    }),
    node({
      id: 'blueprint.recap-20',
      type: 'lesson-blueprint',
      hu: '20 perces ismétlés vagy formatív ellenőrzés',
      payload: {
        durationMinutes: 20,
        sections: [
          ['Felidézés', 3],
          ['Kvíz', 10],
          ['Javítás', 5],
          ['Kilépőkártya', 2]
        ]
      }
    }),
    node({
      id: 'layout.compact',
      type: 'lesson-layout',
      hu: 'Tömör egyoldalas tanári lap',
      payload: {
        template: 'compact',
        fields: ['objective', 'timeline', 'prompts', 'resources', 'answers', 'notes']
      }
    }),
    node({
      id: 'layout.detailed',
      type: 'lesson-layout',
      hu: 'Részletes tanári útmutató',
      payload: {
        template: 'detailed',
        fields: ['instructions', 'differentiation', 'answers', 'misconceptions', 'slides', 'follow-up']
      }
    })
  );

  const classroom8 = node({
    id: 'classroom.grade8.demo',
    type: 'classroom',
    hu: '8. évfolyam – Pitagorasz demó',
    payload: {
      schoolSystem: 'hu',
      grade: 8,
      subject: 'mathematics',
      code: 'FONAT8',
      demo: true,
      style: 'approachable'
    }
  });
  const curriculum8 = node({
    id: 'curriculum.hu.math.grade8',
    type: 'curriculum',
    hu: 'Magyar matematika 8. évfolyam',
    payload: {
      schoolSystem: 'hu',
      grade: 8,
      subject: 'mathematics',
      requirementIds: conceptDefs.map(([id]) => `requirement.${id.replace('concept.', '')}`)
    }
  });
  nodes.push(classroom8, curriculum8);
  for (const [index, [conceptId, hu]] of conceptDefs.entries()) {
    nodes.push(
      node({
        id: `requirement.${conceptId.replace('concept.', '')}`,
        type: 'curriculum-requirement',
        hu: `${hu} – tantervi elvárás`,
        payload: {
          conceptIds: [conceptId],
          requiredDepth: index < 13 ? 'required' : 'extension',
          targetPeriod: index < 16 ? 'first-semester' : 'open',
          weight: 1
        },
        tags: ['tanterv']
      })
    );
  }

  const phase = node({
    id: 'phase.grade8.pythagorean',
    type: 'phase',
    hu: 'Derékszögű háromszögek és Pitagorasz-tétel',
    payload: {
      annualPlanId: 'annual-plan.grade8.demo',
      approximateLessons: 12,
      conceptIds: conceptDefs.map(([id]) => id),
      status: 'active'
    }
  });
  const annualPlan = node({
    id: 'annual-plan.grade8.demo',
    type: 'annual-plan',
    hu: '8. évfolyam 2026/27 – demó éves terv',
    payload: {
      classroomId: classroom8.id,
      curriculumId: curriculum8.id,
      schoolYear: '2026/27',
      weeklyLessons: 3,
      teachingProfileId: 'profile.balanced',
      phaseIds: [phase.id],
      omittedRequirements: [
        {
          requirementId: 'requirement.visual-area-proof',
          justification: 'Másik matematika projektben részletesen feldolgozva.'
        }
      ]
    }
  });
  nodes.push(annualPlan, phase);

  const lessonDefs: Array<{
    id: string;
    title: string;
    intent: string;
    minutes: number;
    status: LessonPayload['status'];
    parts: Array<[string, number, string[]]>;
    date?: string;
    completed?: boolean;
  }> = [
    {
      id: 'lesson.grade8.01',
      title: 'Előismeretek felidézése',
      intent: 'revision',
      minutes: 45,
      status: 'scheduled',
      parts: [
        ['Négyzetek', 10, ['exercise.square-values-recap']],
        ['Négyzetgyökök', 12, ['exercise.square-root-recap']],
        ['Háromszög-szókincs', 15, ['resource.right-triangle-vocabulary', 'exercise.identify-hypotenuse-01']],
        ['Lezárás', 8, ['exercise.exit-ticket']]
      ],
      date: '2026-09-01'
    },
    {
      id: 'lesson.grade8.02',
      title: 'A kapcsolat felfedezése',
      intent: 'introduction',
      minutes: 45,
      status: 'scheduled',
      parts: [
        ['Szókincs', 5, ['resource.right-triangle-vocabulary']],
        ['Átfogó felismerése', 8, ['exercise.identify-hypotenuse-02']],
        ['3–4–5 felfedezés', 15, ['exercise.discover-3-4-5']],
        ['Területi kép', 12, ['resource.pythagorean-visual-proof']],
        ['Bizalomjelzés', 5, ['exercise.exit-ticket']]
      ],
      date: '2026-09-03'
    },
    {
      id: 'lesson.grade8.03',
      title: 'A tétel és jelölése',
      intent: 'formalization',
      minutes: 45,
      status: 'scheduled',
      parts: [
        ['Felidézés', 5, ['exercise.identify-hypotenuse-01']],
        ['Tétel', 10, ['resource.pythagorean-visual-proof']],
        ['Kidolgozott példa', 10, ['resource.missing-hypotenuse-worked-example']],
        ['Igaz-hamis', 10, ['exercise.theorem-true-false']],
        ['Magyarázat és házi', 10, ['exercise.discover-3-4-5']]
      ],
      date: '2026-09-05'
    },
    {
      id: 'lesson.grade8.04',
      title: 'Hiányzó átfogó',
      intent: 'practice',
      minutes: 45,
      status: 'completed',
      parts: [
        ['Felidézés', 5, ['exercise.theorem-true-false']],
        ['Kidolgozott példa', 8, ['resource.missing-hypotenuse-worked-example']],
        ['Egész eredmény', 12, ['exercise.missing-hypotenuse-6-8', 'generated.pythagoras.a']],
        ['Közelítő eredmény', 15, ['exercise.missing-hypotenuse-decimal']],
        ['Kilépőkártya', 5, ['exercise.exit-ticket']]
      ],
      date: '2026-09-08',
      completed: true
    },
    {
      id: 'lesson.grade8.05',
      title: 'Hiányzó befogó',
      intent: 'practice',
      minutes: 45,
      status: 'scheduled',
      parts: [
        ['Felidézés', 5, ['exercise.missing-hypotenuse-6-8']],
        ['Példa', 8, ['resource.missing-leg-worked-example']],
        ['Gyakorlás', 20, ['exercise.missing-leg-13-5', 'exercise.missing-leg-common-mistake']],
        ['Ellenőrzés', 7, ['exercise.choose-method']],
        ['Lezárás', 5, ['exercise.exit-ticket']]
      ],
      date: '2026-09-10'
    },
    {
      id: 'lesson.grade8.06',
      title: 'Gyakorlati szöveges feladatok',
      intent: 'application',
      minutes: 45,
      status: 'scheduled',
      parts: [
        ['Modellezés', 10, ['exercise.rectangle-diagonal']],
        ['Létra', 15, ['exercise.ladder-wall']],
        ['Csoportmunka', 20, ['generated.pythagoras.d', 'generated.pythagoras.f']],
        ['Megbeszélés', 10, ['exercise.choose-method']]
      ],
      date: '2026-09-12'
    },
    {
      id: 'lesson.grade8.07',
      title: 'Koordinátageometriai kapcsolat',
      intent: 'connection',
      minutes: 45,
      status: 'scheduled',
      parts: [
        ['Híd', 10, ['resource.coordinate-distance-bridge']],
        ['Egész távolság', 12, ['exercise.coordinate-distance-01']],
        ['Közelítő távolság', 15, ['exercise.coordinate-distance-02']],
        ['Lezárás', 8, ['exercise.exit-ticket']]
      ],
      date: '2026-09-15'
    },
    {
      id: 'lesson.grade8.08',
      title: 'Differenciált gyakorlás',
      intent: 'practice',
      minutes: 45,
      status: 'scheduled',
      parts: [
        ['Választás', 5, ['exercise.choose-method']],
        ['Alap', 15, ['generated.pythagoras.b', 'generated.pythagoras.c']],
        ['Haladó', 15, ['exercise.converse-explanation']],
        ['Páros ellenőrzés', 10, ['exercise.is-right-triangle']]
      ],
      date: '2026-09-17'
    },
    {
      id: 'lesson.grade8.09',
      title: 'Formatív ellenőrzés',
      intent: 'formative-assessment',
      minutes: 20,
      status: 'completed',
      parts: [
        ['Felidézés', 3, ['exercise.identify-hypotenuse-01']],
        [
          'Kvíz',
          10,
          ['exercise.missing-hypotenuse-6-8', 'exercise.missing-leg-13-5', 'exercise.theorem-true-false']
        ],
        ['Javítás', 5, ['exercise.missing-leg-common-mistake']],
        ['Kilépőkártya', 2, ['exercise.exit-ticket']]
      ],
      date: '2026-09-19',
      completed: true
    },
    {
      id: 'lesson.grade8.10',
      title: 'Javítás és célzott ismétlés',
      intent: 'follow-up',
      minutes: 45,
      status: 'draft',
      parts: [
        ['Négyzetgyök', 10, ['exercise.square-root-recap']],
        ['Hibajavítás', 15, ['exercise.missing-leg-common-mistake']],
        ['Célzott gyakorlás', 15, ['generated.pythagoras.e']],
        ['Lezárás', 5, ['exercise.exit-ticket']]
      ]
    },
    {
      id: 'lesson.grade8.11',
      title: 'Témazáró értékelés',
      intent: 'assessment',
      minutes: 45,
      status: 'scheduled',
      parts: [
        ['Értékelés', 40, ['assessment.grade8.phase-closing']],
        ['Lezárás', 5, []]
      ],
      date: '2026-09-24'
    },
    {
      id: 'lesson.grade8.12',
      title: 'Következő lépés az eredmények alapján',
      intent: 'follow-up',
      minutes: 45,
      status: 'draft',
      parts: [
        ['Célzott ismétlés', 15, []],
        ['Új kapcsolat', 20, []],
        ['Lezárás', 10, []]
      ]
    }
  ];
  for (const def of lessonDefs) {
    const payload: LessonPayload = {
      classroomId: classroom8.id,
      annualPlanId: annualPlan.id,
      phaseId: phase.id,
      date: def.date,
      durationMinutes: def.minutes,
      intent: def.intent,
      teachingProfileId: 'profile.balanced',
      blueprintId:
        def.id === 'lesson.grade8.09'
          ? 'blueprint.recap-20'
          : def.intent === 'introduction'
            ? 'blueprint.introduction-45'
            : 'blueprint.practice-45',
      layoutId: 'layout.compact',
      conceptIds: ['concept.pythagorean'],
      sections: makeSections(def.id, def.parts),
      pinnedRevisions: Object.fromEntries(def.parts.flatMap(([, , ids]) => ids).map((id) => [id, 1])),
      status: def.status,
      teacherNotes: '',
      runtimeSummary: {}
    };
    nodes.push(node({ id: def.id, type: 'lesson', hu: def.title, payload, tags: ['óra', 'pitagorasz'] }));
  }
  nodes.push(
    node({
      id: 'lesson.grade8.04.variant',
      type: 'lesson',
      hu: 'Hiányzó átfogó – javított párhuzamos változat',
      payload: {
        ...(nodes.find((item) => item.id === 'lesson.grade8.04')!.payload as LessonPayload),
        status: 'draft',
        teacherNotes: 'A tizedes feladat előtt rövid becslési lépés került be.',
        sections: makeSections('lesson.grade8.04.variant', [
          ['Felidézés', 5, ['exercise.theorem-true-false']],
          ['Kidolgozott példa', 8, ['resource.missing-hypotenuse-worked-example']],
          ['Egész eredmény', 10, ['exercise.missing-hypotenuse-6-8']],
          ['Becslés', 5, ['exercise.choose-method']],
          ['Közelítő eredmény', 12, ['exercise.missing-hypotenuse-decimal']],
          ['Kilépőkártya', 5, ['exercise.exit-ticket']]
        ])
      },
      tags: ['óra', 'változat']
    }),
    node({
      id: 'assessment.grade8.formative',
      type: 'assessment',
      hu: 'Formatív kvíz: szókincs és hiányzó oldal',
      payload: {
        classroomId: classroom8.id,
        phaseId: phase.id,
        kind: 'formative',
        blueprintSlots: [
          { id: 'vocab', conceptIds: ['concept.hypotenuse'], points: 1 },
          { id: 'hyp', conceptIds: ['concept.missing-hypotenuse'], points: 2 },
          { id: 'leg', conceptIds: ['concept.missing-leg'], points: 2 }
        ],
        exerciseIds: [
          'exercise.identify-hypotenuse-01',
          'exercise.missing-hypotenuse-6-8',
          'exercise.missing-leg-13-5'
        ],
        maxPoints: 5
      }
    }),
    node({
      id: 'assessment.grade8.phase-closing',
      type: 'assessment',
      hu: 'Pitagorasz-tétel témazáró',
      payload: {
        classroomId: classroom8.id,
        phaseId: phase.id,
        kind: 'phase-closing',
        generationProfile: 'phase-closing',
        blueprintSlots: [
          { id: 'elements', conceptIds: ['concept.identify-hypotenuse'], points: 2 },
          { id: 'hypotenuse', conceptIds: ['concept.missing-hypotenuse'], points: 3 },
          { id: 'leg', conceptIds: ['concept.missing-leg'], points: 3 },
          { id: 'word', conceptIds: ['concept.math-modelling'], points: 4 },
          { id: 'validation', conceptIds: ['concept.converse'], points: 3 },
          { id: 'reasoning', conceptIds: ['concept.pythagorean'], points: 5 }
        ],
        variants: {
          A: [
            'exercise.identify-hypotenuse-01',
            'exercise.missing-hypotenuse-6-8',
            'exercise.missing-leg-13-5',
            'exercise.ladder-wall',
            'exercise.is-right-triangle',
            'exercise.converse-explanation'
          ],
          B: [
            'exercise.identify-hypotenuse-02',
            'generated.pythagoras.e',
            'generated.pythagoras.b',
            'exercise.rectangle-diagonal',
            'generated.pythagoras.c',
            'exercise.missing-leg-common-mistake'
          ]
        },
        deferredCoverage: [],
        maxPoints: 20
      }
    }),
    node({
      id: 'assessment.grade8.reduced',
      type: 'assessment',
      hu: 'Rövidített ellenőrzés – halasztott lefedettséggel',
      payload: {
        classroomId: classroom8.id,
        phaseId: phase.id,
        kind: 'reduced',
        exerciseIds: [
          'exercise.identify-hypotenuse-01',
          'exercise.missing-hypotenuse-6-8',
          'exercise.missing-leg-13-5'
        ],
        fulfilledSlots: ['elements', 'hypotenuse', 'leg'],
        deferredCoverage: ['word', 'validation', 'reasoning'],
        maxPoints: 8,
        disclaimer: 'Ez a rövidített értékelés nem teljesíti a teljes témazáró specifikációt.'
      }
    })
  );

  const probabilityConcepts = [
    ['concept.probability.experiment', 'Véletlen kísérlet'],
    ['concept.probability.outcome', 'Kimenetel'],
    ['concept.probability.sample-space', 'Eseménytér'],
    ['concept.probability.event', 'Esemény'],
    ['concept.probability.favorable', 'Kedvező kimenetelek'],
    ['concept.probability.classical', 'Klasszikus valószínűség'],
    ['concept.probability.complement', 'Komplementer esemény'],
    ['concept.probability.mutually-exclusive', 'Kizáró események'],
    ['concept.probability.addition', 'Összeadási szabály'],
    ['concept.probability.repeated', 'Ismételt kísérlet'],
    ['concept.probability.tree', 'Fadiagram'],
    ['concept.probability.independence', 'Függetlenség'],
    ['concept.probability.combinatorics', 'Kombinatorikai előismeret']
  ] as const;
  for (const [id, hu] of probabilityConcepts)
    nodes.push(node({ id, type: 'concept', hu, pkg: probabilityPackageId, tags: ['valószínűség'] }));
  const classroom11 = node({
    id: 'classroom.grade11.demo',
    type: 'classroom',
    hu: '11. évfolyam – valószínűség szerkesztési demó',
    pkg: probabilityPackageId,
    payload: {
      schoolSystem: 'hu',
      grade: 11,
      subject: 'mathematics',
      code: 'FONAT11',
      demo: true,
      style: 'restrained'
    }
  });
  nodes.push(
    classroom11,
    node({
      id: 'resource.probability-basics',
      type: 'resource',
      hu: 'Kísérlet, kimenetel, esemény',
      pkg: probabilityPackageId,
      payload: {
        kind: 'markdown',
        markdown: 'A **véletlen kísérlet** lehetséges eredményei a kimenetelek. Ezek halmaza az eseménytér.'
      }
    }),
    node({
      id: 'resource.probability-tree',
      type: 'resource',
      hu: 'Egyszerű fadiagram két pénzfeldobáshoz',
      pkg: probabilityPackageId,
      payload: {
        kind: 'markdown',
        markdown: '```text\n       F\n     /   \\\n    F     I\n   / \\   / \\\n  F   I F   I\n```'
      }
    }),
    node({
      id: 'resource.math.polynomial-demo',
      type: 'resource',
      hu: 'Polinomgrafikon képességdemó',
      pkg: probabilityPackageId,
      payload: {
        kind: 'math.2d-plot',
        viewport: { x: [-5, 5], y: [-5, 10] },
        axes: true,
        points: [],
        segments: [],
        polynomials: [{ coefficients: [-2, 1, 1], label: 'x²+x−2' }],
        trig: []
      }
    }),
    node({
      id: 'resource.math.trig-demo',
      type: 'resource',
      hu: 'Trigonometrikus grafikon képességdemó',
      pkg: probabilityPackageId,
      payload: {
        kind: 'math.2d-plot',
        viewport: { x: [-6.3, 6.3], y: [-3, 3] },
        axes: true,
        points: [],
        segments: [],
        polynomials: [],
        trig: [
          {
            function: 'sin',
            amplitude: 2,
            period: 6.283185307179586,
            phase: 0,
            verticalShift: 0,
            label: '2 sin(x)'
          }
        ]
      }
    })
  );
  const probabilityExercises = [
    exercise({
      id: 'exercise.probability.sample-space-die',
      hu: 'Sorold fel egy szabályos dobókocka lehetséges kimeneteleit!',
      type: 'short-text',
      concepts: ['concept.probability.sample-space'],
      duration: 4,
      difficulty: difficulty(1),
      accepted: ['{1,2,3,4,5,6}', '1,2,3,4,5,6']
    }),
    exercise({
      id: 'exercise.probability.even-die',
      hu: 'Mekkora a páros szám dobásának valószínűsége szabályos kockával?',
      type: 'numeric',
      concepts: ['concept.probability.classical', 'concept.probability.favorable'],
      duration: 5,
      difficulty: difficulty(2),
      expected: 0.5,
      tolerance: 0.001
    }),
    exercise({
      id: 'exercise.probability.complement',
      hu: 'Ha az eső valószínűsége 0,3, mennyi annak valószínűsége, hogy nem esik?',
      type: 'numeric',
      concepts: ['concept.probability.complement'],
      duration: 4,
      difficulty: difficulty(2),
      expected: 0.7,
      tolerance: 0.001
    }),
    exercise({
      id: 'exercise.probability.coin-two',
      hu: 'Két pénzfeldobásnál melyik kimenetelek tartoznak a pontosan egy fej eseményhez?',
      type: 'multi-select',
      concepts: ['concept.probability.event', 'concept.probability.repeated'],
      duration: 6,
      difficulty: difficulty(2),
      options: [option('FF', 'FF'), option('FI', 'FI', true), option('IF', 'IF', true), option('II', 'II')]
    }),
    exercise({
      id: 'exercise.probability.addition',
      hu: 'Egy kockával mennyi annak valószínűsége, hogy 1-est vagy 6-ost dobunk?',
      type: 'numeric',
      concepts: ['concept.probability.addition', 'concept.probability.mutually-exclusive'],
      duration: 5,
      difficulty: difficulty(2),
      expected: 1 / 3,
      tolerance: 0.001
    }),
    exercise({
      id: 'exercise.probability.tree-manual',
      hu: 'Rajzolj fadiagramot két pénzfeldobás lehetséges kimeneteleihez!',
      type: 'manual-explanation',
      concepts: ['concept.probability.tree', 'concept.probability.repeated'],
      duration: 10,
      difficulty: difficulty(3),
      evidence: 'standard'
    })
  ].map((item) => ({ ...item, provenance: { ...item.provenance, packageId: probabilityPackageId } }));
  nodes.push(...probabilityExercises);
  nodes.push(
    node({
      id: 'annual-plan.grade11.demo',
      type: 'annual-plan',
      hu: '11. évfolyam 2026/27 – szerkesztési demó',
      pkg: probabilityPackageId,
      payload: {
        classroomId: classroom11.id,
        schoolYear: '2026/27',
        phaseIds: ['phase.grade11.probability'],
        teachingProfileId: 'profile.advanced'
      }
    }),
    node({
      id: 'phase.grade11.probability',
      type: 'phase',
      hu: 'Klasszikus valószínűség',
      pkg: probabilityPackageId,
      payload: {
        annualPlanId: 'annual-plan.grade11.demo',
        approximateLessons: 8,
        conceptIds: probabilityConcepts.map(([id]) => id),
        status: 'incomplete',
        missingCoverage: ['concept.probability.independence', 'concept.probability.combinatorics']
      }
    }),
    node({
      id: 'lesson.grade11.01',
      type: 'lesson',
      hu: 'Kísérlet, kimenetel és eseménytér',
      pkg: probabilityPackageId,
      payload: {
        classroomId: classroom11.id,
        annualPlanId: 'annual-plan.grade11.demo',
        phaseId: 'phase.grade11.probability',
        durationMinutes: 45,
        intent: 'introduction',
        teachingProfileId: 'profile.advanced',
        blueprintId: 'blueprint.introduction-45',
        layoutId: 'layout.compact',
        conceptIds: ['concept.probability.experiment', 'concept.probability.sample-space'],
        sections: makeSections('lesson.grade11.01', [
          ['Bevezetés', 10, ['resource.probability-basics']],
          ['Kísérletek', 15, ['exercise.probability.sample-space-die']],
          ['Páros munka', 15, ['exercise.probability.coin-two']],
          ['Lezárás', 5, []]
        ]),
        pinnedRevisions: {},
        status: 'draft',
        teacherNotes: '',
        runtimeSummary: {}
      }
    }),
    node({
      id: 'lesson.grade11.02',
      type: 'lesson',
      hu: 'Klasszikus valószínűség – félkész',
      pkg: probabilityPackageId,
      payload: {
        classroomId: classroom11.id,
        annualPlanId: 'annual-plan.grade11.demo',
        phaseId: 'phase.grade11.probability',
        durationMinutes: 45,
        intent: 'practice',
        teachingProfileId: 'profile.advanced',
        blueprintId: 'blueprint.practice-45',
        layoutId: 'layout.compact',
        conceptIds: ['concept.probability.classical'],
        sections: makeSections('lesson.grade11.02', [
          ['Felidézés', 5, []],
          ['Példa', 10, ['exercise.probability.even-die']],
          ['Gyakorlás', 20, []],
          ['Lezárás', 10, []]
        ]),
        pinnedRevisions: {},
        status: 'draft',
        teacherNotes: 'A hiányzó szakaszok a szerkesztési demó részei.',
        runtimeSummary: {}
      }
    })
  );

  const relations: GraphRelation[] = [
    relation('requires', 'concept.square-root', 'concept.natural-square'),
    relation('requires', 'concept.pythagorean', 'concept.right-triangle'),
    relation('requires', 'concept.pythagorean', 'concept.square-area'),
    relation('requires', 'concept.pythagorean', 'concept.exponent-two'),
    relation('requires', 'concept.missing-leg', 'concept.pythagorean'),
    relation('requires', 'concept.missing-leg', 'concept.square-root'),
    relation('extends', 'concept.point-distance', 'concept.pythagorean'),
    relation('extends', 'concept.rectangle-diagonal', 'concept.pythagorean'),
    relation('alternative-to', 'exercise.identify-hypotenuse-01', 'exercise.identify-hypotenuse-02', {
      similarity: 0.95
    }),
    relation('variant-of', 'lesson.grade8.04.variant', 'lesson.grade8.04')
  ];
  for (const exerciseNode of nodes.filter((item) => item.type === 'exercise')) {
    const payload = exerciseNode.payload as ExercisePayload;
    for (const conceptId of payload.concepts)
      relations.push(
        relation(
          'covers',
          exerciseNode.id,
          conceptId,
          { contribution: Math.min(1, 0.25 + payload.durationMinutes / 20) },
          exerciseNode.provenance.packageId
        )
      );
  }
  for (const [conceptId] of conceptDefs)
    relations.push(
      relation('covers', `requirement.${conceptId.replace('concept.', '')}`, conceptId, { contribution: 1 })
    );
  for (const lesson of nodes.filter((item) => item.type === 'lesson')) {
    const payload = lesson.payload as LessonPayload;
    if (payload.phaseId)
      relations.push(relation('belongs-to', lesson.id, payload.phaseId, {}, lesson.provenance.packageId));
    if (payload.blueprintId)
      relations.push(
        relation('instantiates', lesson.id, payload.blueprintId, {}, lesson.provenance.packageId)
      );
    for (const activityId of payload.sections.flatMap((section) => section.activityIds))
      relations.push(relation('uses', lesson.id, activityId, {}, lesson.provenance.packageId));
  }
  relations.push(relation('belongs-to', phase.id, annualPlan.id));
  relations.push(relation('contains', annualPlan.id, phase.id));
  relations.push(
    relation('contains', 'annual-plan.grade11.demo', 'phase.grade11.probability', {}, probabilityPackageId)
  );

  const revisions: NodeRevision[] = [];
  for (const item of nodes.filter((entry) => entry.lifecycle === 'published'))
    revisions.push({
      id: `${item.id}:1`,
      nodeId: item.id,
      revision: 1,
      compatibility: 'presentation-only',
      payload: structuredClone(item.payload),
      title: item.title,
      summary: item.summary,
      createdAt: now,
      createdBy: 'seed'
    });
  const equivalentlyUpdated = nodes.find((item) => item.id === 'exercise.identify-hypotenuse-01')!;
  equivalentlyUpdated.currentRevision = 2;
  revisions.push({
    id: `${equivalentlyUpdated.id}:2`,
    nodeId: equivalentlyUpdated.id,
    revision: 2,
    compatibility: 'content-equivalent',
    compatibilityReason: 'A megfogalmazás tisztább, a cél és időigény változatlan.',
    payload: {
      ...structuredClone(equivalentlyUpdated.payload),
      prompt: text('Melyik oldal fekszik a derékszöggel szemközt?')
    },
    title: equivalentlyUpdated.title,
    createdAt: later,
    createdBy: 'seed'
  });
  const planningUpdated = nodes.find((item) => item.id === 'exercise.missing-hypotenuse-decimal')!;
  planningUpdated.currentRevision = 2;
  revisions.push({
    id: `${planningUpdated.id}:2`,
    nodeId: planningUpdated.id,
    revision: 2,
    compatibility: 'planning-impacting',
    compatibilityReason: 'Az új változat becslést és hosszabb indoklást is kér, így 6 helyett 10 perc.',
    payload: {
      ...structuredClone(planningUpdated.payload),
      durationMinutes: 10,
      evidenceIntensity: 'standard'
    },
    title: planningUpdated.title,
    createdAt: later,
    createdBy: 'seed'
  });

  const learnerDefs = [
    [
      'learner.red-panda',
      'Vörös Panda',
      '🐼',
      '#b45309',
      { level: 'advanced', note: 'Gyors számolás, néha kihagyja az indoklást.' }
    ],
    ['learner.otter', 'Vidra', '🦦', '#0369a1', { level: 'on-level', note: 'Erős együttműködés.' }],
    ['learner.lynx', 'Hiúz', '🐈', '#7c3aed', { level: 'on-level', note: 'Bizonytalan önértékelés.' }],
    [
      'learner.hedgehog',
      'Sün',
      '🦔',
      '#15803d',
      { level: 'support', note: 'Vizuális és lépéses segítség hasznos.' }
    ],
    ['learner.fox', 'Róka', '🦊', '#be123c', { level: 'inconsistent', note: 'Bevonódva jó teljesítmény.' }]
  ] as const;
  const learners: LearnerProfile[] = learnerDefs.map(([id, nickname, badgeIcon, badgeColor, profile]) => ({
    id,
    classroomId: classroom8.id,
    nickname,
    badgeIcon,
    badgeColor,
    profile,
    createdAt: now
  }));
  const astronomy = [
    ['learner.vega', 'Vega'],
    ['learner.orion', 'Orion'],
    ['learner.lyra', 'Lyra'],
    ['learner.kepler', 'Kepler'],
    ['learner.nova', 'Nova'],
    ['learner.atlas', 'Atlas'],
    ['learner.cygnus', 'Cygnus'],
    ['learner.andromeda', 'Andromeda']
  ] as const;
  learners.push(
    ...astronomy.map(([id, nickname], index) => ({
      id,
      classroomId: classroom11.id,
      nickname,
      badgeIcon: '✦',
      badgeColor: ['#334155', '#475569', '#1e3a8a', '#312e81'][index % 4]!,
      profile: { tone: 'formal' },
      createdAt: now
    }))
  );

  const classroomAccess: ClassroomAccess[] = [];
  for (let index = 0; index < learners.length; index++) {
    const learner = learners[index]!;
    classroomAccess.push({
      classroomId: learner.classroomId,
      classroomCode: learner.classroomId === classroom8.id ? 'FONAT8' : 'FONAT11',
      learnerId: learner.id,
      secretHash: await hashSecret(`demo${index + 1}`),
      mustChangePassword: false
    });
  }

  const lessonRuns: LessonRunRecord[] = [
    {
      id: 'lesson-run.grade8.04',
      lessonId: 'lesson.grade8.04',
      startedAt: '2026-09-08T08:00:00.000Z',
      finishedAt: '2026-09-08T08:47:00.000Z',
      currentSectionIndex: 4,
      currentSlideIndex: 0,
      status: 'finished',
      sectionStartedAt: '2026-09-08T08:42:00.000Z',
      extraMinutes: 2,
      completedSectionIds: makeSections('lesson.grade8.04', lessonDefs[3]!.parts).map(
        (section) => section.id
      ),
      skippedSectionIds: [],
      notes: [
        {
          id: 'note.run.04',
          text: 'A tizedes feladat hosszabb volt; a párhuzamos csoportnál előbb rövid becslést kérek.',
          createdAt: '2026-09-08T08:45:00.000Z'
        }
      ],
      updatedAt: '2026-09-08T08:47:00.000Z'
    },
    {
      id: 'lesson-run.grade8.09',
      lessonId: 'lesson.grade8.09',
      startedAt: '2026-09-19T08:00:00.000Z',
      finishedAt: '2026-09-19T08:21:00.000Z',
      currentSectionIndex: 3,
      currentSlideIndex: 0,
      status: 'finished',
      sectionStartedAt: '2026-09-19T08:18:00.000Z',
      extraMinutes: 1,
      completedSectionIds: makeSections('lesson.grade8.09', lessonDefs[8]!.parts).map(
        (section) => section.id
      ),
      skippedSectionIds: [],
      notes: [
        {
          id: 'note.run.09',
          text: 'A hiányzó befogónál sokan a kivonás sorrendjét tévesztették.',
          createdAt: '2026-09-19T08:20:00.000Z'
        }
      ],
      updatedAt: '2026-09-19T08:21:00.000Z'
    }
  ];

  const liveSessions: LiveSessionRecord[] = [
    {
      id: 'live.demo.formative',
      code: '843921',
      lessonRunId: 'lesson-run.grade8.09',
      assessmentId: 'assessment.grade8.formative',
      exerciseIds: [
        'exercise.identify-hypotenuse-01',
        'exercise.missing-hypotenuse-6-8',
        'exercise.missing-leg-13-5'
      ],
      currentIndex: 2,
      mode: 'teacher-paced',
      status: 'closed',
      allowGuest: true,
      leaderboard: false,
      answerOrderPolicy: 'stable-session',
      participants: learners
        .filter((learner) => learner.classroomId === classroom8.id)
        .map((learner) => ({
          id: `participant.${learner.id}`,
          learnerId: learner.id,
          nickname: learner.nickname,
          badgeIcon: learner.badgeIcon,
          badgeColor: learner.badgeColor,
          joinedAt: '2026-09-19T08:02:00.000Z'
        })),
      createdAt: '2026-09-19T08:01:00.000Z',
      updatedAt: '2026-09-19T08:15:00.000Z'
    }
  ];

  const submissions: Submission[] = [];
  const evidence: EvidenceRecord[] = [];
  const responseMatrix: Record<
    string,
    Array<{ answer: unknown; score: number; confidence?: number; explanation?: string }>
  > = {
    'exercise.identify-hypotenuse-01': [
      { answer: 'c', score: 1 },
      { answer: 'c', score: 1 },
      { answer: 'c', score: 1, confidence: 0.4 },
      { answer: 'c', score: 1 },
      { answer: 'c', score: 1 }
    ],
    'exercise.missing-hypotenuse-6-8': [
      { answer: 10, score: 1, explanation: '' },
      { answer: 10, score: 1 },
      { answer: 10, score: 1, confidence: 0.35 },
      { answer: 9, score: 0 },
      { answer: 10, score: 1 }
    ],
    'exercise.missing-leg-13-5': [
      { answer: 12, score: 1 },
      { answer: 12, score: 1 },
      { answer: 12, score: 1, confidence: 0.3 },
      { answer: 8, score: 0 },
      { answer: '', score: 0 }
    ]
  };
  const grade8Learners = learners.filter((learner) => learner.classroomId === classroom8.id);
  for (const [exerciseId, responses] of Object.entries(responseMatrix)) {
    for (let index = 0; index < grade8Learners.length; index++) {
      const learner = grade8Learners[index]!;
      const response = responses[index]!;
      const id = `submission.formative.${learner.id}.${exerciseId}`;
      submissions.push({
        id,
        learnerId: learner.id,
        exerciseId,
        assessmentId: 'assessment.grade8.formative',
        liveSessionId: 'live.demo.formative',
        attempt: 1,
        answer: response.answer,
        normalizedAnswer: response.answer,
        automaticScore: response.score,
        maxScore: 1,
        status: 'accepted',
        evidence: { confidence: response.confidence, explanation: response.explanation },
        createdAt: '2026-09-19T08:05:00.000Z',
        updatedAt: '2026-09-19T08:12:00.000Z'
      });
      const conceptIds = (nodes.find((item) => item.id === exerciseId)!.payload as ExercisePayload).concepts;
      evidence.push({
        id: `evidence.${id}`,
        learnerId: learner.id,
        conceptIds,
        submissionId: id,
        type: 'answer',
        value: { score: response.score, confidence: response.confidence },
        createdAt: '2026-09-19T08:12:00.000Z'
      });
    }
  }
  submissions.push({
    id: 'submission.hedgehog.correction',
    learnerId: 'learner.hedgehog',
    exerciseId: 'exercise.missing-hypotenuse-6-8',
    assessmentId: 'assessment.grade8.formative',
    attempt: 2,
    answer: 10,
    normalizedAnswer: 10,
    automaticScore: 1,
    teacherScore: 1,
    maxScore: 1,
    status: 'accepted',
    feedback: 'A képlet és a négyzetgyök használata már helyes.',
    evidence: { scaffoldLevelsUsed: [1, 2, 3] },
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-20T10:03:00.000Z'
  });
  evidence.push({
    id: 'evidence.hedgehog.correction',
    learnerId: 'learner.hedgehog',
    conceptIds: ['concept.missing-hypotenuse'],
    submissionId: 'submission.hedgehog.correction',
    type: 'correction',
    value: { improvedFrom: 0, improvedTo: 1, scaffoldLevelsUsed: 3 },
    createdAt: '2026-09-20T10:03:00.000Z'
  });

  const activities: ActivityRecord[] = [
    {
      id: 'activity.seed',
      type: 'demo.reset',
      message: 'A demonstrációs munkatér betöltve.',
      severity: 'success',
      createdAt: now
    },
    {
      id: 'activity.lesson-run.04',
      type: 'lesson.completed',
      message: 'A Hiányzó átfogó óra lezárult.',
      targetId: 'lesson.grade8.04',
      severity: 'success',
      createdAt: '2026-09-08T08:47:00.000Z'
    },
    {
      id: 'activity.assessment',
      type: 'assessment.analyzed',
      message: 'A formatív kvíz elemzése 3 követendő mintát talált.',
      targetId: 'assessment.grade8.formative',
      severity: 'warning',
      createdAt: '2026-09-19T08:22:00.000Z'
    }
  ];
  const notifications: NotificationRecord[] = [];
  const assessmentInstances: AssessmentInstanceRecord[] = grade8Learners.map((learner, index) => ({
    id: `assessment-instance.phase.${learner.id}`,
    assessmentId: 'assessment.grade8.phase-closing',
    learnerId: learner.id,
    variant: index % 2 === 0 ? 'A' : 'B',
    questionOrder:
      index % 2 === 0
        ? ['elements', 'hypotenuse', 'leg', 'word', 'validation', 'reasoning']
        : ['elements', 'leg', 'hypotenuse', 'word', 'validation', 'reasoning'],
    optionOrder: { 'exercise.identify-hypotenuse-01': index % 2 === 0 ? ['a', 'b', 'c'] : ['c', 'a', 'b'] },
    status: 'assigned',
    createdAt: now
  }));

  return {
    nodes,
    relations,
    revisions,
    learners,
    classroomAccess,
    lessonRuns,
    liveSessions,
    submissions,
    evidence,
    activities,
    notifications,
    assessmentInstances
  };
}

export function newActivity(
  type: string,
  message: string,
  targetId?: string,
  severity: ActivityRecord['severity'] = 'info'
): ActivityRecord {
  return { id: randomUUID(), type, message, targetId, severity, createdAt: new Date().toISOString() };
}
