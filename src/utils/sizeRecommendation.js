// Simple rule-based size recommendation from height (cm) and weight (kg).
// Uses a BMI-adjacent index to slot the customer into a size band, then
// nudges by height so tall/light or short/heavy edge cases feel sane.

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function recommendSize(heightCm, weightKg) {
  const height = Number(heightCm);
  const weight = Number(weightKg);

  if (!height || !weight || height < 120 || height > 220 || weight < 30 || weight > 180) {
    return null;
  }

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  let index;
  if (bmi < 18.5) index = 0; // XS
  else if (bmi < 21) index = 1; // S
  else if (bmi < 24) index = 2; // M
  else if (bmi < 27.5) index = 3; // L
  else if (bmi < 31) index = 4; // XL
  else index = 5; // XXL

  // Tall frames tend to run a size up regardless of BMI band.
  if (height >= 190) index = Math.min(index + 1, SIZES.length - 1);
  else if (height <= 160) index = Math.max(index - 1, 0);

  return {
    size: SIZES[index],
    bmi: Math.round(bmi * 10) / 10,
  };
}

export const SIZE_CHART = [
  { size: 'XS', chest: '84–88', waist: '66–70', height: '160–168' },
  { size: 'S', chest: '89–93', waist: '71–75', height: '166–174' },
  { size: 'M', chest: '94–98', waist: '76–81', height: '172–180' },
  { size: 'L', chest: '99–104', waist: '82–88', height: '178–186' },
  { size: 'XL', chest: '105–111', waist: '89–95', height: '184–192' },
  { size: 'XXL', chest: '112–118', waist: '96–103', height: '188–196' },
];
