/**
 * Question bank — replace with your own questions
 */

export interface Question {
  text: string;
  options: string[];
  correct: number; // index into options
}

export const QUESTIONS: Question[] = [
  { text: '1 + 1 = ?', options: ['1', '2', '3', '4'], correct: 1 },
  { text: 'Which is the largest planet?', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], correct: 2 },
  { text: 'H2O is...', options: ['Oxygen', 'Water', 'Hydrogen', 'Salt'], correct: 1 },
  { text: 'Speed of light?', options: ['300 km/s', '300,000 km/s', '3,000 km/s', '30,000 km/s'], correct: 1 },
  { text: 'Largest ocean?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2 },
  { text: 'CO2 stands for?', options: ['Carbon monoxide', 'Carbon dioxide', 'Calcium oxide', 'Copper oxide'], correct: 1 },
  { text: 'Boiling point of water?', options: ['50C', '100C', '150C', '200C'], correct: 1 },
  { text: 'Earth has how many moons?', options: ['0', '1', '2', '3'], correct: 1 },
];
