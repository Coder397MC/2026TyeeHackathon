export type Flashcard = {
  term: string;
  definition: string;
};

export type QuizChoice = {
  label: string;
  text: string;
};

export type QuizQuestion = {
  question: string;
  choices: QuizChoice[];
  correct: string;
  explanation: string;
};

export type StudyResult = {
  subject: "math" | "concept" | "off_topic";
  explanation: string;
  tip: string;
  image_prompt: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
};
