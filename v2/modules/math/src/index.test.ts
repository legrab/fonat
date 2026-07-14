import { expect, it } from 'vitest';
import { generatePythagorean } from './index.js';

it('generates reproducibly', () => {
  expect(generatePythagorean('a', 'missing-hypotenuse')).toEqual(
    generatePythagorean('a', 'missing-hypotenuse')
  );
});
