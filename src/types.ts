export interface CardItem {
  id: string;
  value: string;
  isFlipped: boolean;
}

export interface WheelSector {
  id: string;
  value: string;
  color: string;
}

export interface MathChallenge {
  num1: number;
  num2: number;
  operator: '+' | '-' | '×' | '÷';
  answer: number;
  options: number[];
  userAnswer: number | null;
  isCorrect: boolean | null;
}
