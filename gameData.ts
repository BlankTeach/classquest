import {
  curriculumWords,
  grammarTargets,
  type CurriculumWord,
} from "./curriculum";

export type GameKind = "quiz" | "sort" | "memory";
export type QuizQuestion = {
  id: string;
  mode: "grammar" | "vocabulary";
  level: string;
  chapter?: number;
  sourcePage?: number;
  topic: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type SortLevel = {
  id: string;
  level: string;
  chapter?: number;
  sourcePage?: number;
  title: string;
  baskets: string[];
  words: { word: string; basket: number }[];
};
export type MemoryLevel = {
  id: string;
  level: string;
  chapter?: number;
  sourcePage?: number;
  title: string;
  pairs: { word: string; meaning: string }[];
};

export const textbookLevels: string[] = [
  "1A",
  "1B",
  "2A",
  "2B",
  "3A",
  "3B",
  "4A",
  "4B",
  "5A",
  "5B",
  "6A",
  "6B",
];
export const grammarTopics: string[] = Array.from(
  new Set(grammarTargets.map(target => target.topic))
);

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
// Content-based IDs stay the same when questions are reordered or new content is added.
const fingerprint = (text: string) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
};
const makeOptions = (correct: string, distractors: string[], seed: string) => {
  const answer = parseInt(fingerprint(seed), 36) % (distractors.length + 1);
  const options = [...distractors];
  options.splice(answer, 0, correct);
  return { options, answer };
};

type GrammarRow = [
  level: string,
  question: string,
  correct: string,
  wrongA: string,
  wrongB: string,
  explanation: string,
];
const grammar = (topic: string, rows: GrammarRow[]): QuizQuestion[] =>
  rows.map(([level, question, correct, wrongA, wrongB, explanation]) => {
    const id = `g-${slug(topic)}-${level.toLowerCase()}-${fingerprint(question)}`;
    return {
      id,
      mode: "grammar",
      level,
      topic,
      question,
      ...makeOptions(correct, [wrongA, wrongB], id),
      explanation,
    };
  });

const grammarQuestions: QuizQuestion[] = [
  ...grammar("Simple present", [
    [
      "1A",
      "I ___ a blue school bag.",
      "have",
      "has",
      "having",
      "Use have with I in the simple present.",
    ],
    [
      "1B",
      "She ___ to the park every Sunday.",
      "goes",
      "go",
      "going",
      "Add -es to go with she, he or it.",
    ],
    [
      "2A",
      "We ___ to school by bus every day.",
      "go",
      "goes",
      "went",
      "Use the base verb with we for a daily routine.",
    ],
    [
      "2B",
      "My brother ___ his teeth every morning.",
      "brushes",
      "brush",
      "brushing",
      "A verb ending in -sh takes -es with he or she.",
    ],
    [
      "3A",
      "___ Sam play chess every Friday?",
      "Does",
      "Do",
      "Is",
      "Use Does + subject + base verb for a simple-present question.",
    ],
    [
      "3B",
      "Lily ___ like noisy games.",
      "does not",
      "do not",
      "is not",
      "Use does not + base verb with a singular third-person subject.",
    ],
  ]),
  ...grammar("Simple past", [
    [
      "2B",
      "Yesterday we ___ the classroom.",
      "cleaned",
      "clean",
      "cleaning",
      "Yesterday signals the past. Clean is regular: cleaned.",
    ],
    [
      "3A",
      "Last Saturday I ___ a new board game.",
      "bought",
      "buy",
      "buyed",
      "The past tense of buy is bought.",
    ],
    [
      "3B",
      "She ___ to the party last night.",
      "went",
      "goes",
      "goed",
      "The irregular past tense of go is went.",
    ],
    [
      "4A",
      "Did you ___ the show yesterday?",
      "watch",
      "watched",
      "watching",
      "After did, use the base verb watch.",
    ],
    [
      "4B",
      "We ___ late for school yesterday.",
      "were",
      "are",
      "was",
      "The past form of be with we is were.",
    ],
    [
      "5A",
      "He did not ___ his ticket yesterday.",
      "bring",
      "brought",
      "brings",
      "Use the base verb after did not.",
    ],
  ]),
  ...grammar("Future tense", [
    [
      "3B",
      "I think it ___ rain tomorrow.",
      "will",
      "did",
      "was",
      "Will + base verb can express a prediction about the future.",
    ],
    [
      "4A",
      "The show will ___ at seven tomorrow.",
      "start",
      "starts",
      "started",
      "Use a base verb after will.",
    ],
    [
      "4B",
      "I promise I ___ waste water again.",
      "will not",
      "did not",
      "was not",
      "Will not expresses a promise about a future action.",
    ],
    [
      "5A",
      "The phone is ringing. I ___ answer it!",
      "will",
      "was",
      "have",
      "Will can express a decision made at the moment of speaking.",
    ],
    [
      "6A",
      "___ the volunteers arrive tomorrow?",
      "Will",
      "Did",
      "Were",
      "A future question starts with Will, followed by the subject and base verb.",
    ],
  ]),
  ...grammar("Going to", [
    [
      "3A",
      "We ___ going to go camping this weekend.",
      "are",
      "is",
      "am",
      "Use are going to with we for a plan.",
    ],
    [
      "3B",
      "I am going to ___ a cake tomorrow.",
      "make",
      "made",
      "making",
      "Going to is followed by a base verb.",
    ],
    [
      "4A",
      "She ___ going to sing in the show.",
      "is",
      "are",
      "am",
      "Use is going to with she.",
    ],
    [
      "4B",
      "Look at those dark clouds! It ___ rain.",
      "is going to",
      "was going to",
      "has",
      "Going to can predict something based on evidence we can see now.",
    ],
    [
      "5A",
      "___ you going to pack your suitcase tonight?",
      "Are",
      "Do",
      "Have",
      "Put Are before you to ask about a going-to plan.",
    ],
  ]),
  ...grammar("Present perfect", [
    [
      "4A",
      "I ___ finished my homework, so I can play now.",
      "have",
      "has",
      "am",
      "Use have + past participle with I.",
    ],
    [
      "4B",
      "She has ___ her lunch already.",
      "eaten",
      "eat",
      "ate",
      "The past participle of eat is eaten.",
    ],
    [
      "5A",
      "We ___ visited Japan before.",
      "have",
      "has",
      "are",
      "Use have with we to describe a past experience without a finished time.",
    ],
    [
      "5B",
      "He has ___ his arm.",
      "broken",
      "broke",
      "break",
      "The past participle of break is broken.",
    ],
    [
      "6A",
      "Have you ever ___ money for charity?",
      "raised",
      "raise",
      "raising",
      "Present-perfect questions use have + subject + past participle.",
    ],
    [
      "6B",
      "She has lived here ___ 2020.",
      "since",
      "for",
      "during",
      "Since introduces the starting point; for introduces a duration.",
    ],
  ]),
  ...grammar("Past continuous", [
    [
      "4A",
      "At eight last night, I ___ watching a show.",
      "was",
      "were",
      "am",
      "Use was + -ing with I for an action in progress in the past.",
    ],
    [
      "4B",
      "They ___ playing when it started to rain.",
      "were",
      "was",
      "are",
      "Use were + -ing with they.",
    ],
    [
      "5A",
      "Mum was ___ dinner when I got home.",
      "cooking",
      "cook",
      "cooked",
      "Use the -ing form after was in the past continuous.",
    ],
    [
      "5B",
      "While I was walking, I ___ an accident.",
      "saw",
      "was see",
      "seeing",
      "The completed event saw interrupts the longer action was walking.",
    ],
    [
      "6A",
      "___ you sleeping when the storm began?",
      "Were",
      "Was",
      "Did",
      "A past-continuous question with you starts with Were.",
    ],
  ]),
  ...grammar("Imperatives", [
    [
      "1A",
      "___ your book, please.",
      "Open",
      "Opens",
      "Opening",
      "An instruction begins with the base verb: Open.",
    ],
    [
      "1A",
      "___ down, please.",
      "Sit",
      "Sits",
      "Sitting",
      "Use the base verb sit to give an instruction.",
    ],
    [
      "1B",
      "___ run near the pond.",
      "Do not",
      "Does not",
      "Not to",
      "A negative instruction starts with Do not or Don't.",
    ],
    [
      "2A",
      "___ quiet in the library.",
      "Be",
      "Is",
      "Are",
      "Use Be at the start of this instruction.",
    ],
    [
      "2B",
      "___ your coat on before going outside.",
      "Put",
      "Puts",
      "Putting",
      "Use a base verb when telling someone what to do.",
    ],
  ]),
  ...grammar("Indirect speech", [
    [
      "5A",
      "Mia said, “I am tired.” → Mia said that she ___ tired.",
      "was",
      "is being",
      "were",
      "When reporting a past statement, am usually changes to was.",
    ],
    [
      "5B",
      "Ben said, “I like cooking.” → Ben said that he ___ cooking.",
      "liked",
      "liking",
      "like",
      "In this past reporting context, simple present changes to simple past.",
    ],
    [
      "6A",
      "They said, “We will help.” → They said that they ___ help.",
      "would",
      "will to",
      "did",
      "Will changes to would in this reported statement.",
    ],
    [
      "6B",
      "The guide asked, “Where do you live?” → The guide asked where I ___.",
      "lived",
      "did I live",
      "do live",
      "Reported questions use statement word order, not question word order.",
    ],
    [
      "6A",
      "The teacher said, “Please sit down.” → The teacher asked us ___.",
      "to sit down",
      "sit down",
      "sitting down",
      "Report a request with asked + object + to-infinitive.",
    ],
    [
      "6B",
      "The ranger said, “Do not feed the animals.” → The ranger told us ___.",
      "not to feed the animals",
      "to not fed the animals",
      "do not feed the animals",
      "Report a negative instruction with told + object + not to + base verb.",
    ],
  ]),
  ...grammar("Passive voice", [
    [
      "5A",
      "This scarf ___ made of wool.",
      "is",
      "has",
      "does",
      "The present passive uses is or are + past participle.",
    ],
    [
      "5B",
      "The windows ___ cleaned yesterday.",
      "were",
      "are",
      "have",
      "Yesterday calls for the past passive: were cleaned.",
    ],
    [
      "6A",
      "The injured people were ___ by volunteers.",
      "helped",
      "help",
      "helping",
      "Use a past participle after were in the passive.",
    ],
    [
      "6B",
      "Paper ___ recycled in this factory every day.",
      "is",
      "was",
      "has",
      "Every day describes a present routine: is recycled.",
    ],
    [
      "6B",
      "The trees will ___ planted tomorrow.",
      "be",
      "being",
      "been",
      "The future passive is will be + past participle.",
    ],
  ]),
  ...grammar("Phrasal verbs", [
    [
      "2B",
      "It is cold. Put ___ your jacket.",
      "on",
      "off",
      "out",
      "Put on means to dress in an item of clothing.",
    ],
    [
      "3B",
      "Please look ___ your little sister while Mum is busy.",
      "after",
      "up",
      "off",
      "Look after means take care of someone.",
    ],
    [
      "3B",
      "I like to play ___ my friends after school.",
      "with",
      "off",
      "down",
      "Play with means join someone in a game or activity.",
    ],
    [
      "4A",
      "Please turn ___ the light; it is too dark.",
      "on",
      "off",
      "over",
      "Turn on means make a light or machine start working.",
    ],
    [
      "4B",
      "Pick ___ the litter and put it in the bin.",
      "up",
      "off",
      "away",
      "Pick up means lift something from a surface.",
    ],
    [
      "5A",
      "Please take ___ your muddy shoes before coming in.",
      "off",
      "on",
      "up",
      "Take off means remove an item of clothing.",
    ],
  ]),
  ...grammar("To-infinitive", [
    [
      "3A",
      "I want ___ chess after lunch.",
      "to play",
      "playing",
      "played",
      "Want is followed by a to-infinitive.",
    ],
    [
      "3B",
      "She hopes ___ a new guitar.",
      "to get",
      "getting",
      "got",
      "Hope is followed by to + base verb.",
    ],
    [
      "4A",
      "We went to the theatre ___ a show.",
      "to watch",
      "watching",
      "watched",
      "A to-infinitive can explain the purpose of an action.",
    ],
    [
      "5A",
      "They decided ___ a picnic.",
      "to have",
      "having",
      "had",
      "Decide is followed by a to-infinitive.",
    ],
    [
      "6A",
      "It is important ___ on time for work.",
      "to arrive",
      "arrived",
      "arrive",
      "Use a to-infinitive after It is important.",
    ],
  ]),
  ...grammar("Modals", [
    [
      "1B",
      "A bird ___ fly.",
      "can",
      "cans",
      "is can",
      "Can expresses ability and does not take -s.",
    ],
    [
      "2A",
      "You must ___ quietly in the library.",
      "speak",
      "speaks",
      "speaking",
      "Use the base verb after must.",
    ],
    [
      "2A",
      "You ___ run in the corridor. It is not allowed.",
      "must not",
      "must",
      "can",
      "Must not expresses a rule that forbids an action.",
    ],
    [
      "5A",
      "You ___ help a friend who is upset.",
      "should",
      "should not",
      "cannot",
      "Should gives advice about a helpful action.",
    ],
    [
      "5A",
      "You ___ laugh at other people's mistakes.",
      "should not",
      "should",
      "must to",
      "Should not advises against an unkind action.",
    ],
    [
      "6A",
      "___ you carry this box for me, please?",
      "Could",
      "Must to",
      "Should to",
      "Could can introduce a polite request.",
    ],
  ]),
  ...grammar("Singular and plural", [
    [
      "1A",
      "One pencil, two ___.",
      "pencils",
      "penciles",
      "pencil",
      "Pencil is singular. Most nouns add -s to form the plural.",
    ],
    [
      "1B",
      "One fox, three ___.",
      "foxes",
      "foxs",
      "fox",
      "Nouns ending in -x add -es.",
    ],
    [
      "2A",
      "One baby, two ___.",
      "babies",
      "babys",
      "babyes",
      "Change consonant + y to -ies.",
    ],
    [
      "2B",
      "One child, four ___.",
      "children",
      "childs",
      "childes",
      "Child has the irregular plural children.",
    ],
    [
      "3A",
      "One knife, two ___.",
      "knives",
      "knifes",
      "knife",
      "The plural of knife is knives.",
    ],
    [
      "3B",
      "One person, many ___.",
      "people",
      "person",
      "peoples",
      "People is the usual plural of person when referring to a group.",
    ],
  ]),
  ...grammar("Countable and uncountable nouns", [
    [
      "2A",
      "Which noun is usually uncountable?",
      "rice",
      "apple",
      "egg",
      "Rice is usually uncountable; we can say a bowl of rice.",
    ],
    [
      "3A",
      "Which phrase correctly measures an amount of water?",
      "a glass of water",
      "a glass water",
      "a water of glass",
      "Water is uncountable. A glass measures an amount.",
    ],
    [
      "3A",
      "Which noun can we count individually?",
      "sandwich",
      "milk",
      "bread",
      "Sandwich is countable: we can say one sandwich or two sandwiches.",
    ],
    [
      "3A",
      "I bought two ___ of bread.",
      "loaves",
      "breads",
      "bread",
      "We count bread using units such as loaves or slices.",
    ],
    [
      "4A",
      "Which phrase is correct for a drink?",
      "some juice",
      "a juice of",
      "many juice",
      "Juice is usually uncountable, so some juice is correct.",
    ],
  ]),
  ...grammar("Quantifiers", [
    [
      "2A",
      "How ___ apples are there?",
      "many",
      "much",
      "a little",
      "Use many with plural countable nouns.",
    ],
    [
      "3A",
      "How ___ milk is in the jug?",
      "much",
      "many",
      "a few",
      "Use much with an uncountable noun.",
    ],
    [
      "3A",
      "There are ___ biscuits left: only two.",
      "a few",
      "a little",
      "much",
      "A few goes with plural countable nouns.",
    ],
    [
      "4A",
      "Add ___ salt, not a whole spoonful.",
      "a little",
      "a few",
      "many",
      "A little describes a small amount of an uncountable noun.",
    ],
    [
      "4B",
      "We have ___ food for everyone; nobody will be hungry.",
      "enough",
      "too few",
      "no",
      "Enough means as much as we need.",
    ],
  ]),
  ...grammar("Subject and object pronouns", [
    [
      "1A",
      "Tom is my brother. ___ is six.",
      "He",
      "Him",
      "His",
      "He is a subject pronoun for a boy or man.",
    ],
    [
      "1B",
      "Mia is my friend. I play with ___.",
      "her",
      "she",
      "hers",
      "Use the object pronoun her after with.",
    ],
    [
      "2A",
      "My friends and I are ready. ___ can go now.",
      "We",
      "Us",
      "Our",
      "We is the subject pronoun for my friends and I.",
    ],
    [
      "2B",
      "Please help ___ carry this box.",
      "me",
      "I",
      "my",
      "Me is an object pronoun after the verb help.",
    ],
    [
      "3A",
      "The children are here. Give ___ the games.",
      "them",
      "they",
      "their",
      "Them is the object pronoun for the children.",
    ],
  ]),
  ...grammar("This and that", [
    [
      "1A",
      "___ is my pencil here in my hand.",
      "This",
      "Those",
      "These",
      "This points to one thing near the speaker.",
    ],
    [
      "1A",
      "___ is our school over there.",
      "That",
      "These",
      "Those",
      "That points to one thing farther away.",
    ],
    [
      "1B",
      "___ are my shoes here beside me.",
      "These",
      "This",
      "That",
      "These points to more than one thing near the speaker.",
    ],
    [
      "2A",
      "___ are the buses over there.",
      "Those",
      "That",
      "This",
      "Those points to more than one thing farther away.",
    ],
    [
      "2B",
      "Is ___ your coat on the far wall?",
      "that",
      "those",
      "these",
      "Use that for one distant coat.",
    ],
  ]),
  ...grammar("There is / There are", [
    [
      "1A",
      "There ___ a book on the desk.",
      "is",
      "are",
      "am",
      "Use there is for one thing.",
    ],
    [
      "1B",
      "There ___ three ducks in the pond.",
      "are",
      "is",
      "am",
      "Use there are with a plural noun.",
    ],
    [
      "2A",
      "___ there a library at your school?",
      "Is",
      "Are",
      "Do",
      "Use Is there to ask about one place.",
    ],
    [
      "2B",
      "There ___ any clean socks in the drawer.",
      "are not",
      "is not",
      "am not",
      "Socks is plural, so use there are not.",
    ],
    [
      "3A",
      "There ___ some milk in the fridge.",
      "is",
      "are",
      "have",
      "Use there is with an uncountable noun such as milk.",
    ],
  ]),
  ...grammar("Possessive adjectives", [
    [
      "1A",
      "I have a toy. It is ___ toy.",
      "my",
      "me",
      "I",
      "My is the possessive adjective for I.",
    ],
    [
      "1B",
      "She has a cat. ___ cat is small.",
      "Her",
      "She",
      "Hers",
      "Her comes before a noun to show belonging.",
    ],
    [
      "2A",
      "He is wearing ___ school uniform.",
      "his",
      "he",
      "him",
      "His is the possessive adjective for he.",
    ],
    [
      "2B",
      "We love ___ school.",
      "our",
      "us",
      "we",
      "Our is the possessive adjective for we.",
    ],
    [
      "3A",
      "The children are playing with ___ ball.",
      "their",
      "them",
      "they",
      "Their comes before a noun to show something belongs to them.",
    ],
    [
      "3B",
      "The dog is wagging ___ tail.",
      "its",
      "it's",
      "it",
      "Its shows possession. It's means it is or it has.",
    ],
  ]),
  ...grammar("Comparatives and superlatives", [
    [
      "2B",
      "An elephant is ___ than a mouse.",
      "bigger",
      "biggest",
      "big",
      "Use a comparative before than: bigger.",
    ],
    [
      "3A",
      "This is the ___ building in our town.",
      "tallest",
      "taller",
      "tall",
      "Use the superlative tallest to compare it with all buildings in the town.",
    ],
    [
      "3B",
      "Mia is ___ than her brother.",
      "more careful",
      "most careful",
      "carefuller",
      "Longer adjectives such as careful use more in comparisons.",
    ],
    [
      "4A",
      "This is the ___ exciting show I have ever seen.",
      "most",
      "more",
      "much",
      "Use the most + adjective for a long-adjective superlative.",
    ],
    [
      "4B",
      "Walking is ___ for the environment than driving.",
      "better",
      "best",
      "gooder",
      "The comparative of good is better.",
    ],
    [
      "5A",
      "This was the ___ day of our trip.",
      "worst",
      "worse",
      "baddest",
      "The superlative of bad is worst.",
    ],
  ]),
  ...grammar("Connectives", [
    [
      "1A",
      "I have a pencil ___ a ruler.",
      "and",
      "because",
      "but",
      "And adds another item.",
    ],
    [
      "2A",
      "I am wearing a coat ___ it is cold.",
      "because",
      "or",
      "but",
      "Because introduces a reason.",
    ],
    [
      "2B",
      "The room is small ___ comfortable.",
      "but",
      "because",
      "or",
      "But joins contrasting ideas.",
    ],
    [
      "3A",
      "Would you like milk ___ water?",
      "or",
      "because",
      "so",
      "Or presents a choice.",
    ],
    [
      "3B",
      "It was raining, ___ we stayed indoors.",
      "so",
      "but",
      "or",
      "So introduces a result.",
    ],
  ]),
  ...grammar("Determiners", [
    [
      "1A",
      "I have ___ red bag.",
      "a",
      "an",
      "these",
      "Use a before a singular noun starting with a consonant sound.",
    ],
    [
      "1B",
      "There is ___ elephant at the zoo.",
      "an",
      "a",
      "those",
      "Use an before a vowel sound.",
    ],
    [
      "2A",
      "Please close ___ door beside you.",
      "the",
      "an",
      "these",
      "The identifies the particular door beside the listener.",
    ],
    [
      "2B",
      "___ shoes here are mine.",
      "These",
      "This",
      "That",
      "These goes with a plural noun near the speaker.",
    ],
    [
      "2B",
      "___ coat over there is yours.",
      "That",
      "These",
      "Those",
      "That goes with a singular noun farther away.",
    ],
    [
      "3A",
      "We have ___ sandwiches for lunch.",
      "some",
      "a",
      "an",
      "Some can introduce an unspecified number in a positive statement.",
    ],
    [
      "3A",
      "We do not have ___ eggs left.",
      "any",
      "a",
      "an",
      "Any is normally used with plural nouns in negative statements.",
    ],
    [
      "3B",
      "There are ___ students in the hall; it is almost full.",
      "a lot of",
      "a little",
      "an",
      "A lot of means a large number or amount.",
    ],
    [
      "4A",
      "___ dishes on that far table are hot.",
      "Those",
      "That",
      "This",
      "Those goes with a plural noun farther away.",
    ],
    [
      "1A",
      "___ pencil in my hand is new.",
      "This",
      "These",
      "Those",
      "This goes with a singular noun near the speaker.",
    ],
  ]),
  ...grammar("Prepositions", [
    [
      "1A",
      "The pencils are inside the pencil case. They are ___ it.",
      "in",
      "on",
      "under",
      "In means inside something.",
    ],
    [
      "1A",
      "The book is resting ___ the top of the desk.",
      "on",
      "in",
      "under",
      "On means touching the upper surface.",
    ],
    [
      "1B",
      "The cat is hiding ___ the table, below its top.",
      "under",
      "on",
      "in",
      "Under means below something.",
    ],
    [
      "1B",
      "Our home is ___ the park, only a short walk away.",
      "near",
      "inside",
      "above",
      "Near means not far away.",
    ],
    [
      "2A",
      "We meet ___ the school gate.",
      "at",
      "into",
      "onto",
      "At can show a meeting point.",
    ],
    [
      "2A",
      "We go ___ school every weekday.",
      "to",
      "at",
      "on",
      "To expresses movement towards a destination.",
    ],
    [
      "2A",
      "I go to school ___ bus.",
      "by",
      "in",
      "at",
      "Use by bus to describe the means of transport.",
    ],
    [
      "2A",
      "The school is close, so I go ___ foot.",
      "on",
      "by",
      "in",
      "The fixed expression is on foot.",
    ],
    [
      "2B",
      "We eat breakfast ___ seven o'clock.",
      "at",
      "in",
      "on",
      "Use at for a clock time.",
    ],
    [
      "2B",
      "I do my homework ___ the evening.",
      "in",
      "at",
      "on",
      "Use in with the morning, afternoon or evening.",
    ],
    [
      "3A",
      "The sports day is ___ 12 May.",
      "on",
      "in",
      "at",
      "Use on before a date.",
    ],
    [
      "3A",
      "The book fair runs ___ 3 June to 5 June.",
      "from",
      "on",
      "at",
      "From introduces the start of a date range.",
    ],
    [
      "3B",
      "The camp runs from 8 July ___ 10 July.",
      "to",
      "in",
      "on",
      "To introduces the end of a date range.",
    ],
    [
      "3B",
      "The bank is ___ the library and the supermarket.",
      "between",
      "under",
      "inside",
      "Between places something in the space separating two things.",
    ],
    [
      "4A",
      "The audience sits ___ the stage, facing it.",
      "in front of",
      "behind",
      "inside",
      "In front of means ahead of something, not behind it.",
    ],
    [
      "4A",
      "The garden is ___ the house, at the back.",
      "behind",
      "in front of",
      "inside",
      "Behind means at the back of something.",
    ],
    [
      "4B",
      "The cafe is immediately ___ the bakery; they share a wall.",
      "next to",
      "between",
      "under",
      "Next to means directly beside.",
    ],
    [
      "4B",
      "Our school holidays begin ___ July.",
      "in",
      "at",
      "on",
      "Use in before a month.",
    ],
  ]),
  ...grammar("Gerunds", [
    [
      "2B",
      "I enjoy ___ pictures after school.",
      "drawing",
      "draw",
      "to drew",
      "Enjoy is followed by a gerund: verb + -ing.",
    ],
    [
      "3A",
      "___ is my favourite sport.",
      "Swimming",
      "Swim",
      "Swam",
      "A gerund can be the subject of a sentence.",
    ],
    [
      "3B",
      "She is good at ___ the piano.",
      "playing",
      "play",
      "played",
      "After a preposition such as at, use a gerund.",
    ],
    [
      "4A",
      "We finished ___ the dishes.",
      "washing",
      "wash",
      "to wash",
      "Finish is followed by a gerund.",
    ],
    [
      "4B",
      "Avoid ___ too much food.",
      "wasting",
      "waste",
      "to waste",
      "Avoid is followed by a gerund.",
    ],
    [
      "5A",
      "Would you mind ___ the window?",
      "opening",
      "open",
      "to open",
      "Mind is followed by a gerund.",
    ],
  ]),
  ...grammar("Adverbs", [
    [
      "2A",
      "Please speak ___ so everyone can hear each word.",
      "clearly",
      "clear",
      "clearness",
      "Clearly is an adverb of manner describing speak.",
    ],
    [
      "3B",
      "She is a careful driver. She drives ___.",
      "carefully",
      "careful",
      "carefulness",
      "Many manner adverbs are formed by adding -ly to an adjective.",
    ],
    [
      "4A",
      "I have ___ finished lunch; I finished earlier than expected.",
      "already",
      "yet",
      "never",
      "Already means something has happened before now or earlier than expected.",
    ],
    [
      "4B",
      "The bus has ___ arrived, only a moment ago.",
      "just",
      "never",
      "yet",
      "Just means a very short time ago.",
    ],
    [
      "5A",
      "Have you packed your bag ___?",
      "yet",
      "ago",
      "just",
      "Yet is often used at the end of present-perfect questions.",
    ],
    [
      "2A",
      "I brush my teeth every morning and every night. I ___ brush twice a day.",
      "always",
      "never",
      "seldom",
      "Always means every time.",
    ],
    [
      "2B",
      "I play football most weekends, but not every weekend. I ___ play football.",
      "often",
      "never",
      "always",
      "Often means many times, but not necessarily every time.",
    ],
    [
      "3A",
      "On a few days I walk; on other days I take the bus. I ___ walk to school.",
      "sometimes",
      "always",
      "never",
      "Sometimes means on some occasions.",
    ],
    [
      "3B",
      "I almost never eat sweets. I ___ eat sweets.",
      "seldom",
      "always",
      "often",
      "Seldom means rarely or not often.",
    ],
    [
      "4B",
      "I do not drop litter at any time. I ___ drop litter.",
      "never",
      "always",
      "often",
      "Never means not at any time.",
    ],
    [
      "4A",
      "I do not like onions. My sister does not like them ___.",
      "either",
      "too",
      "neither",
      "Use either at the end of a negative sentence to mean also not.",
    ],
    [
      "3B",
      "We visited the museum two days ___.",
      "ago",
      "soon",
      "yet",
      "Ago follows a duration and measures back from now.",
    ],
    [
      "3A",
      "I have visited the zoo one time. I have been there ___.",
      "once",
      "twice",
      "never",
      "Once means one time.",
    ],
    [
      "4A",
      "I have seen the show two times. I have seen it ___.",
      "twice",
      "once",
      "never",
      "Twice means two times.",
    ],
    [
      "5A",
      "Ask about any past experience: Have you ___ tried sushi?",
      "ever",
      "yet",
      "ago",
      "Ever means at any time and is common in questions about experience.",
    ],
    [
      "5B",
      "I have ___ broken a bone: it has not happened at any time.",
      "never",
      "ever",
      "always",
      "Never with the present perfect means no such experience at any time.",
    ],
    [
      "5A",
      "___, a king lived in a faraway castle.",
      "Once upon a time",
      "Once upon time",
      "Once a time",
      "Once upon a time is a traditional opening for a story set long ago.",
    ],
    [
      "5B",
      "The train will arrive ___; it is only two minutes away.",
      "soon",
      "ago",
      "yesterday",
      "Soon means in a short time from now.",
    ],
    [
      "6A",
      "We waited for a short time. ___, the rain stopped.",
      "After a while",
      "After while",
      "After a whiles",
      "After a while means after some time has passed.",
    ],
    [
      "6A",
      "After hours of searching, ___ they found the missing dog!",
      "at last",
      "yet",
      "ago",
      "At last shows relief when something happens after a long wait.",
    ],
    [
      "6B",
      "Without warning, the lights ___ went out.",
      "suddenly",
      "always",
      "never",
      "Suddenly means quickly and unexpectedly.",
    ],
    [
      "6B",
      "The path was steep. ___, we reached the top safely.",
      "However",
      "Because",
      "Although",
      "However introduces a contrast between two statements.",
    ],
    [
      "6B",
      "They tried several ideas. ___, they solved the problem.",
      "In the end",
      "In end",
      "At the end of",
      "In the end introduces the final outcome.",
    ],
    [
      "3B",
      "The bag was ___ heavy that I could not lift it.",
      "so",
      "very",
      "a bit",
      "Use so + adjective + that to describe a result.",
    ],
    [
      "2B",
      "It is ___ cold today. You need a warm coat.",
      "very",
      "many",
      "much",
      "Very makes an adjective stronger.",
    ],
    [
      "4A",
      "The show was ___ exciting; I loved every minute.",
      "really",
      "real",
      "reality",
      "Really can strengthen an adjective.",
    ],
    [
      "4B",
      "I feel ___ tired, but only slightly.",
      "a bit",
      "much",
      "many",
      "A bit before an adjective means slightly.",
    ],
    [
      "5A",
      "The soup is ___ hot, but only slightly; I can still drink it.",
      "a little",
      "too",
      "many",
      "A little before an adjective means slightly.",
    ],
    [
      "5B",
      "The suitcase is ___ heavy for me to carry.",
      "too",
      "enough",
      "many",
      "Too means more than is possible or suitable: too heavy to carry.",
    ],
    [
      "3A",
      "I like music. My friend likes it ___.",
      "too",
      "either",
      "neither",
      "Too means also at the end of a positive sentence.",
    ],
  ]),
];

// Each textbook includes several curriculum categories, with short, image-free definitions.
// Entries are [word, definition]. Distractors come from the same textbook, never other levels.
type VocabularyGroup = {
  level: string;
  topic: string;
  entries: [string, string][];
};
const vocabularyGroups: VocabularyGroup[] = [
  {
    level: "1A",
    topic: "Family",
    entries: [
      ["mother", "your female parent"],
      ["brother", "a boy who has the same parent as you"],
    ],
  },
  {
    level: "1A",
    topic: "People at school",
    entries: [
      ["teacher", "a person who helps pupils learn"],
      ["classmate", "a pupil in the same class as you"],
    ],
  },
  {
    level: "1A",
    topic: "Places",
    entries: [
      ["school", "a place where children go to learn"],
      ["shop", "a place where you buy things"],
    ],
  },
  {
    level: "1A",
    topic: "Things at school",
    entries: [
      ["desk", "a table where a pupil works"],
      ["school bag", "a bag for carrying books to school"],
    ],
  },
  {
    level: "1A",
    topic: "Actions",
    entries: [
      ["sit", "to rest your body on a chair"],
      ["stand", "to be upright on your feet"],
      ["open", "to move a door so you can go through"],
      ["close", "to shut a door or a book"],
      ["look", "to use your eyes to see something"],
      ["point", "to show something with your finger"],
    ],
  },
  {
    level: "1A",
    topic: "Stationery",
    entries: [
      ["pencil", "a tool for writing that can be rubbed out"],
      ["ruler", "a tool for measuring or drawing straight lines"],
    ],
  },
  {
    level: "1A",
    topic: "Toys",
    entries: [
      ["teddy bear", "a soft toy shaped like a bear"],
      ["yo-yo", "a toy that moves up and down on a string"],
    ],
  },
  {
    level: "1A",
    topic: "Colours",
    entries: [
      ["red", "the colour of a ripe strawberry"],
      ["yellow", "the colour of a ripe banana skin"],
    ],
  },
  {
    level: "1A",
    topic: "Clothes",
    entries: [
      ["shirt", "clothing for the upper body, often with buttons"],
      ["skirt", "clothing that hangs from the waist with no separate legs"],
    ],
  },
  {
    level: "1B",
    topic: "Farm animals",
    entries: [
      ["cow", "a large farm animal that gives us milk"],
      ["pig", "a farm animal with a round snout"],
    ],
  },
  {
    level: "1B",
    topic: "Body parts",
    entries: [
      ["elbow", "the joint in the middle of your arm"],
      ["knee", "the joint in the middle of your leg"],
    ],
  },
  {
    level: "1B",
    topic: "Things in the park",
    entries: [
      ["swing", "a hanging seat that moves backwards and forwards"],
      ["slide", "a smooth slope that children go down"],
    ],
  },
  {
    level: "1B",
    topic: "Zoo animals",
    entries: [
      ["giraffe", "a tall animal with a very long neck"],
      ["zebra", "an animal with black and white stripes"],
    ],
  },
  {
    level: "1B",
    topic: "Home activities and places",
    entries: [
      ["bedroom", "a room where you sleep"],
      ["watch TV", "to look at programmes on a television"],
    ],
  },
  {
    level: "1B",
    topic: "Fun activities and places",
    entries: [
      ["playground", "an outdoor place with equipment for children to play on"],
      ["swim", "to move through water using your arms and legs"],
    ],
  },
  {
    level: "2A",
    topic: "Places at school",
    entries: [
      ["library", "a place at school where you borrow books"],
      ["canteen", "a place at school where meals are served"],
    ],
  },
  {
    level: "2A",
    topic: "Things we must and must not do",
    entries: [
      ["queue up", "to wait in a line for your turn"],
      ["push", "to move someone away by pressing against them"],
    ],
  },
  {
    level: "2A",
    topic: "Activities",
    entries: [
      ["read", "to look at written words and understand them"],
      ["draw", "to make a picture with a pencil or pen"],
    ],
  },
  {
    level: "2A",
    topic: "Feelings",
    entries: [
      ["happy", "feeling pleased or glad"],
      ["sad", "feeling unhappy"],
    ],
  },
  {
    level: "2A",
    topic: "Food",
    entries: [
      ["egg", "food with a shell laid by a hen"],
      ["pear", "a fruit with a narrow top and a wider bottom"],
    ],
  },
  {
    level: "2A",
    topic: "Food adjectives",
    entries: [
      ["sweet", "tasting like sugar"],
      ["sour", "having a sharp taste like a lemon"],
      ["juicy", "containing a lot of liquid"],
      ["soft", "easy to press or bend"],
      ["hard", "firm and not easy to press or bend"],
    ],
  },
  {
    level: "2A",
    topic: "Going to school: transport",
    entries: [
      ["bus", "a large road vehicle that carries many passengers"],
      ["on foot", "travelling by walking"],
    ],
  },
  {
    level: "2A",
    topic: "Jobs",
    entries: [
      ["doctor", "a person who treats people who are ill"],
      ["firefighter", "a person whose job is to put out fires"],
    ],
  },
  {
    level: "2B",
    topic: "Housework",
    entries: [
      ["sweep the floor", "to clean the floor with a broom"],
      ["wash the dishes", "to clean plates, cups and bowls"],
    ],
  },
  {
    level: "2B",
    topic: "Adjectives",
    entries: [
      ["tidy", "neat and well arranged"],
      ["untidy", "messy and not well arranged"],
      ["honest", "telling the truth and not cheating"],
    ],
  },
  {
    level: "2B",
    topic: "After-class activities",
    entries: [
      ["dance", "to move your body to music"],
      ["paint", "to make a picture using colours and a brush"],
    ],
  },
  {
    level: "2B",
    topic: "Daily routine",
    entries: [
      ["brush teeth", "to clean your teeth with a toothbrush"],
      ["get dressed", "to put on your clothes"],
    ],
  },
  {
    level: "2B",
    topic: "Festivals",
    entries: [
      ["Christmas", "a festival celebrated on 25 December"],
      [
        "Chinese New Year",
        "a festival marking the start of a new year in the Chinese calendar",
      ],
    ],
  },
  {
    level: "2B",
    topic: "Weather",
    entries: [
      ["windy", "with a lot of moving air"],
      ["rainy", "with water falling from clouds"],
    ],
  },
  {
    level: "2B",
    topic: "Clothing items",
    entries: [
      ["raincoat", "a coat that keeps rain off your clothes"],
      ["scarf", "a piece of cloth worn around the neck"],
    ],
  },
  {
    level: "3A",
    topic: "Sports, music and board games",
    entries: [
      ["badminton", "a sport played with rackets and a shuttlecock"],
      ["violin", "a string instrument played with a bow"],
      ["chess", "a board game with kings, queens and other pieces"],
    ],
  },
  {
    level: "3A",
    topic: "School events",
    entries: [
      ["sports day", "a school event with races and sports competitions"],
      ["book fair", "an event where books are displayed and sold"],
    ],
  },
  {
    level: "3A",
    topic: "Food and drinks: countable and uncountable",
    entries: [
      ["sandwich", "food made with filling between slices of bread"],
      ["milk", "a white drink that cows produce"],
      ["bread", "food baked from dough, often sold in loaves"],
      ["juice", "a drink made from the liquid in fruit"],
    ],
  },
  {
    level: "3A",
    topic: "Outdoor activities",
    entries: [
      ["camping", "staying outdoors overnight in a tent"],
      ["hiking", "walking a long distance in the countryside"],
    ],
  },
  {
    level: "3A",
    topic: "Shopping centre things",
    entries: [
      ["escalator", "moving stairs that carry people between floors"],
      ["lift", "a machine that carries people up and down between floors"],
    ],
  },
  {
    level: "3B",
    topic: "Adjectives to describe people: opposites",
    entries: [
      ["generous", "happy to give or share with others"],
      ["selfish", "thinking only about yourself"],
      ["polite", "showing good manners"],
      ["rude", "showing bad manners"],
    ],
  },
  {
    level: "3B",
    topic: "After-school activities",
    entries: [
      [
        "practise the piano",
        "to play a keyboard instrument to improve your skill",
      ],
      ["join a club", "to become a member of a group with a shared interest"],
    ],
  },
  {
    level: "3B",
    topic: "Birthday celebrations",
    entries: [
      ["blow out candles", "to put out birthday flames with your breath"],
      ["make a wish", "to think of something you hope will happen"],
    ],
  },
  {
    level: "3B",
    topic: "Gifts",
    entries: [
      ["puzzle", "a game or problem whose pieces or clues you put together"],
      ["bracelet", "a piece of jewellery worn around the wrist"],
    ],
  },
  {
    level: "3B",
    topic: "Action verbs",
    entries: [
      ["catch", "to stop and hold something moving through the air"],
      ["throw", "to send something through the air with your hand"],
    ],
  },
  {
    level: "3B",
    topic: "Subjects",
    entries: [
      ["science", "the study of nature and how things work"],
      ["mathematics", "the study of numbers, shapes and calculations"],
    ],
  },
  {
    level: "3B",
    topic: "Actions: play with and look after",
    entries: [
      ["play with", "to enjoy a game or activity together with someone"],
      ["look after", "to take care of someone or something"],
    ],
  },
  {
    level: "4A",
    topic: "After-school activities",
    entries: [
      ["ballet", "a style of dance with carefully controlled movements"],
      ["drama club", "a group where pupils act in plays"],
    ],
  },
  {
    level: "4A",
    topic: "Shows",
    entries: [
      ["magic show", "a performance of tricks that seem impossible"],
      ["puppet show", "a performance using small figures moved by people"],
    ],
  },
  {
    level: "4A",
    topic: "Food and drinks",
    entries: [
      ["lemonade", "a sweet drink made with lemon juice"],
      ["yoghurt", "a thick food made by adding helpful bacteria to milk"],
    ],
  },
  {
    level: "4A",
    topic: "Dishes",
    entries: [
      ["fried rice", "a dish of cooked rice stir-fried with other ingredients"],
      ["noodle soup", "a dish of long thin strips of food served in broth"],
    ],
  },
  {
    level: "4A",
    topic: "Things people use now",
    entries: [
      [
        "smartphone",
        "a mobile phone that can run apps and connect to the internet",
      ],
      ["tablet", "a flat portable computer with a touchscreen"],
    ],
  },
  {
    level: "4A",
    topic: "Everyday actions",
    entries: [
      ["comb hair", "to make your hair neat with a comb"],
      ["tie shoelaces", "to fasten the strings on your shoes"],
    ],
  },
  {
    level: "4B",
    topic: "Things to do",
    entries: [
      ["borrow a book", "to take a book for a time and return it later"],
      ["post a letter", "to send a written message through the mail"],
    ],
  },
  {
    level: "4B",
    topic: "Places in the neighbourhood",
    entries: [
      ["bakery", "a shop that makes and sells bread and cakes"],
      ["post office", "a place where you buy stamps and send letters"],
    ],
  },
  {
    level: "4B",
    topic: "Types of food",
    entries: [
      ["seafood", "food such as fish and shellfish from the sea"],
      ["vegetarian food", "food that does not include meat or fish"],
    ],
  },
  {
    level: "4B",
    topic: "Food groups",
    entries: [
      ["grains", "foods such as rice, oats and wheat"],
      ["dairy products", "foods made from milk, such as cheese and yoghurt"],
    ],
  },
  {
    level: "4B",
    topic: "Good and bad habits",
    entries: [
      ["litter", "to leave rubbish in a public place"],
      ["exercise regularly", "to be physically active often to stay healthy"],
    ],
  },
  {
    level: "4B",
    topic: "Resolutions",
    entries: [
      ["save water", "to use less water and avoid wasting it"],
      ["keep a promise", "to do what you said you would do"],
    ],
  },
  {
    level: "5A",
    topic: "Things we should and should not do",
    entries: [
      ["wear a seat belt", "to fasten a safety strap when travelling in a car"],
      ["waste food", "to throw away food that could have been eaten"],
    ],
  },
  {
    level: "5A",
    topic: "Things friends should and should not do",
    entries: [
      ["encourage", "to give someone support or confidence"],
      ["tease", "to make fun of someone, sometimes in an unkind way"],
    ],
  },
  {
    level: "5A",
    topic: "Feelings",
    entries: [
      ["anxious", "worried that something bad may happen"],
      ["relieved", "happy because a worry or danger has ended"],
    ],
  },
  {
    level: "5A",
    topic: "Clothing and accessories",
    entries: [
      ["waistcoat", "a sleeveless piece of clothing worn over a shirt"],
      ["necklace", "a piece of jewellery worn around the neck"],
    ],
  },
  {
    level: "5A",
    topic: "Materials",
    entries: [
      ["wool", "a fibre from sheep used to make warm clothes"],
      ["leather", "a material made from animal skin"],
    ],
  },
  {
    level: "5A",
    topic: "Activities",
    entries: [
      ["snorkelling", "swimming near the surface with a breathing tube"],
      ["sightseeing", "visiting interesting places as a tourist"],
    ],
  },
  {
    level: "5A",
    topic: "Preparations",
    entries: [
      ["pack a suitcase", "to put travel clothes and belongings into a case"],
      ["book tickets", "to reserve places for a journey or event"],
    ],
  },
  {
    level: "5A",
    topic: "International cuisines",
    entries: [
      [
        "sushi",
        "a Japanese dish made with seasoned rice and other ingredients",
      ],
      ["tacos", "a Mexican dish of folded tortillas with a filling"],
    ],
  },
  {
    level: "5B",
    topic: "Illnesses",
    entries: [
      ["flu", "an infectious illness that can cause fever, aches and coughing"],
      ["sore throat", "pain in the part of the body you use for swallowing"],
    ],
  },
  {
    level: "5B",
    topic: "Injuries",
    entries: [
      ["sprain", "an injury to the tissue joining bones at a joint"],
      ["bruise", "a dark mark under the skin caused by a bump"],
    ],
  },
  {
    level: "5B",
    topic: "Achievements",
    entries: [
      ["win a medal", "to earn a metal award in a competition"],
      ["break a record", "to do better than the previous best result"],
    ],
  },
  {
    level: "5B",
    topic: "Verbs for cooking",
    entries: [
      ["boil", "to cook food in water that is bubbling from heat"],
      ["chop", "to cut food into smaller pieces"],
    ],
  },
  {
    level: "5B",
    topic: "Verbs for crafts",
    entries: [
      ["fold", "to bend paper so one part lies over another"],
      ["sew", "to join fabric using a needle and thread"],
    ],
  },
  {
    level: "5B",
    topic: "Materials",
    entries: [
      ["cardboard", "thick, stiff paper often used for boxes"],
      ["cotton", "a soft plant fibre used to make cloth"],
    ],
  },
  {
    level: "5B",
    topic: "Describing transport",
    entries: [
      ["convenient", "easy to use and suitable for your needs"],
      ["crowded", "filled with too many people"],
    ],
  },
  {
    level: "5B",
    topic: "Accidents",
    entries: [
      ["collision", "an accident in which two moving objects hit each other"],
      ["slip", "to slide accidentally and lose your balance"],
    ],
  },
  {
    level: "5B",
    topic: "Vehicles",
    entries: [
      ["ambulance", "a vehicle that takes ill or injured people to hospital"],
      ["tram", "a passenger vehicle that runs on rails in city streets"],
    ],
  },
  {
    level: "5B",
    topic: "Crime scene actions and people",
    entries: [
      ["witness", "a person who saw an event happen"],
      ["investigate", "to examine evidence to find out what happened"],
    ],
  },
  {
    level: "6A",
    topic: "Jobs and duties",
    entries: [
      ["architect", "a person who designs buildings"],
      ["paramedic", "a trained worker who gives emergency medical care"],
    ],
  },
  {
    level: "6A",
    topic: "Job requirements",
    entries: [
      ["qualified", "having the training or certificates needed for a job"],
      ["reliable", "able to be trusted to do what is expected"],
    ],
  },
  {
    level: "6A",
    topic: "Natural disasters",
    entries: [
      ["earthquake", "sudden shaking of the ground"],
      ["flood", "water covering land that is usually dry"],
      ["typhoon", "a powerful tropical storm in the northwestern Pacific"],
    ],
  },
  {
    level: "6A",
    topic: "Charity activities",
    entries: [
      ["donate", "to give money or goods to help a cause"],
      ["fundraise", "to collect money for a charity or purpose"],
    ],
  },
  {
    level: "6A",
    topic: "Adjectives",
    entries: [
      ["wealthy", "having a lot of money or valuable possessions"],
      [
        "proud",
        "feeling pleased about something you or another person achieved",
      ],
    ],
  },
  {
    level: "6B",
    topic: "Festivals",
    entries: [
      [
        "Mid-Autumn Festival",
        "a festival celebrated with mooncakes and moon viewing",
      ],
      [
        "Dragon Boat Festival",
        "a festival known for dragon boat races and rice dumplings",
      ],
    ],
  },
  {
    level: "6B",
    topic: "Natural features and landmarks",
    entries: [
      ["waterfall", "water flowing over a steep drop in a river"],
      ["volcano", "a mountain or opening from which lava can erupt"],
      ["landmark", "a well-known feature that helps people recognise a place"],
    ],
  },
  {
    level: "6B",
    topic: "Environmental actions",
    entries: [
      [
        "recycle",
        "to process used materials so they can be made into new products",
      ],
      ["reuse", "to use something again instead of throwing it away"],
    ],
  },
  {
    level: "6B",
    topic: "Types of pollution",
    entries: [
      ["air pollution", "harmful substances in the air we breathe"],
      ["noise pollution", "unwanted or harmful levels of sound"],
      ["water pollution", "harmful substances in rivers, lakes or seas"],
    ],
  },
  {
    level: "6B",
    topic: "Actions that harm or protect animals",
    entries: [
      ["poach", "to hunt or catch wild animals illegally"],
      ["protect habitats", "to keep the natural homes of animals safe"],
    ],
  },
];

const vocabularyQuestions: QuizQuestion[] = vocabularyGroups.flatMap(
  ({ level, topic, entries }) => {
    const pool = vocabularyGroups
      .filter(group => group.level === level)
      .flatMap(group => group.entries.map(([word]) => word));
    return entries.map(([word, meaning]) => {
      const id = `v-${level.toLowerCase()}-${slug(topic)}-${slug(word)}`;
      const remaining = pool.filter(candidate => candidate !== word);
      const offset = parseInt(fingerprint(id), 36) % remaining.length;
      const distractors = [0, 1, 2].map(
        step => remaining[(offset + step) % remaining.length]
      );
      return {
        id,
        mode: "vocabulary" as const,
        level,
        topic,
        question: `Which word or phrase means “${meaning}”?`,
        ...makeOptions(word, distractors, id),
        explanation: `${word}: ${meaning}.`,
      };
    });
  }
);

const legacyQuizQuestions: QuizQuestion[] = [
  ...grammarQuestions,
  ...vocabularyQuestions,
];

// A labelled group supplies both its basket and its words. Interleave baskets so the
// starting pile is mixed, deterministic, and not an answer-key sequence by category.
const sort = (
  level: string,
  title: string,
  groups: [string, string[]][]
): SortLevel => ({
  id: `sort-${level.toLowerCase()}`,
  level,
  title,
  baskets: groups.map(([label]) => label),
  words: Array.from(
    { length: Math.max(...groups.map(([, words]) => words.length)) },
    (_, index) =>
      groups.flatMap(([, words], basket) =>
        words[index] === undefined ? [] : [{ word: words[index], basket }]
      )
  ).flat(),
});
const legacySortLevels: SortLevel[] = [
  sort("1A", "Pack, play and dress", [
    ["Stationery", ["pencil", "ruler", "eraser"]],
    ["Toys", ["teddy bear", "yo-yo", "toy car"]],
    ["Clothes", ["shirt", "skirt"]],
  ]),
  sort("1B", "Farm, zoo and body", [
    ["Farm animals", ["cow", "pig", "hen"]],
    ["Zoo animals", ["giraffe", "zebra", "lion"]],
    ["Body parts", ["elbow", "knee"]],
  ]),
  sort("2A", "Food, feelings and travel", [
    ["Food", ["egg", "pear", "banana"]],
    ["Feelings", ["happy", "sad", "excited"]],
    ["Transport", ["bus", "train"]],
  ]),
  sort("2B", "Chores, weather and clothes", [
    ["Housework", ["sweep the floor", "wash the dishes", "make the bed"]],
    ["Weather", ["windy", "rainy", "sunny"]],
    ["Clothes", ["raincoat", "scarf"]],
  ]),
  sort("3A", "Play, perform and explore", [
    ["Sports and games", ["badminton", "chess", "basketball"]],
    ["Musical instruments", ["violin", "piano", "guitar"]],
    ["Outdoor activities", ["camping", "hiking"]],
  ]),
  sort("3B", "Kind words, subjects and gifts", [
    ["Personal qualities", ["generous", "selfish", "polite"]],
    ["School subjects", ["science", "mathematics", "English"]],
    ["Gifts", ["bracelet", "puzzle"]],
  ]),
  sort("4A", "At the show and at home", [
    ["Shows", ["magic show", "puppet show", "ballet show"]],
    ["Food and drinks", ["lemonade", "yoghurt", "fried rice"]],
    ["Everyday actions", ["comb hair", "tie shoelaces"]],
  ]),
  sort("4B", "Build better habits", [
    [
      "Helpful habits",
      ["save water", "exercise regularly", "keep a promise", "eat vegetables"],
    ],
    [
      "Unhelpful habits",
      ["litter", "waste food", "leave taps running", "stay up too late"],
    ],
  ]),
  sort("5A", "Dress, prepare and taste", [
    ["Materials", ["wool", "leather", "silk"]],
    [
      "Travel preparations",
      ["pack a suitcase", "book tickets", "check a passport"],
    ],
    ["International dishes", ["sushi", "tacos"]],
  ]),
  sort("5B", "Cook, craft and travel", [
    ["Cooking actions", ["boil", "chop", "fry"]],
    ["Craft actions", ["fold", "sew", "glue"]],
    ["Vehicles", ["ambulance", "tram"]],
  ]),
  sort("6A", "People who help", [
    ["Jobs", ["architect", "paramedic", "firefighter"]],
    ["Natural disasters", ["earthquake", "flood", "typhoon"]],
    ["Charity actions", ["donate", "fundraise"]],
  ]),
  sort("6B", "Care for our planet", [
    ["Natural features", ["waterfall", "volcano", "valley"]],
    ["Pollution", ["air pollution", "noise pollution", "water pollution"]],
    ["Protective actions", ["recycle", "protect habitats"]],
  ]),
];

// Card originals 0..7 are words; originals 8..15 are their meanings. Renderers may
// shuffle positions, but submissions must retain these original indices.
const memory = (level: string, title: string, words: string[]): MemoryLevel => {
  const entries = vocabularyGroups
    .filter(group => group.level === level)
    .flatMap(group => group.entries);
  return {
    id: `memory-${level.toLowerCase()}`,
    level,
    title,
    pairs: words.map(word => {
      const entry = entries.find(([candidate]) => candidate === word);
      if (!entry) throw new Error(`Missing definition for ${level}: ${word}`);
      return { word, meaning: entry[1] };
    }),
  };
};
const legacyMemoryLevels: MemoryLevel[] = [
  memory("1A", "My school-day words", [
    "mother",
    "teacher",
    "school",
    "desk",
    "pencil",
    "teddy bear",
    "red",
    "shirt",
  ]),
  memory("1B", "Animals and everyday fun", [
    "cow",
    "pig",
    "elbow",
    "knee",
    "swing",
    "giraffe",
    "bedroom",
    "swim",
  ]),
  memory("2A", "A busy school day", [
    "library",
    "queue up",
    "read",
    "happy",
    "egg",
    "sweet",
    "bus",
    "doctor",
  ]),
  memory("2B", "At home, all year round", [
    "sweep the floor",
    "tidy",
    "honest",
    "dance",
    "brush teeth",
    "Christmas",
    "windy",
    "raincoat",
  ]),
  memory("3A", "Games, food and adventures", [
    "badminton",
    "violin",
    "chess",
    "sports day",
    "sandwich",
    "milk",
    "camping",
    "escalator",
  ]),
  memory("3B", "Friends, parties and learning", [
    "generous",
    "rude",
    "practise the piano",
    "blow out candles",
    "bracelet",
    "catch",
    "science",
    "look after",
  ]),
  memory("4A", "Shows and modern life", [
    "ballet",
    "magic show",
    "puppet show",
    "lemonade",
    "fried rice",
    "smartphone",
    "comb hair",
    "tie shoelaces",
  ]),
  memory("4B", "A healthy neighbourhood", [
    "borrow a book",
    "bakery",
    "post office",
    "seafood",
    "grains",
    "litter",
    "save water",
    "keep a promise",
  ]),
  memory("5A", "Friends and journeys", [
    "wear a seat belt",
    "encourage",
    "anxious",
    "necklace",
    "wool",
    "snorkelling",
    "pack a suitcase",
    "sushi",
  ]),
  memory("5B", "Skills, safety and success", [
    "flu",
    "sprain",
    "win a medal",
    "boil",
    "sew",
    "cardboard",
    "ambulance",
    "witness",
  ]),
  memory("6A", "Working for a better world", [
    "architect",
    "paramedic",
    "qualified",
    "reliable",
    "earthquake",
    "donate",
    "wealthy",
    "proud",
  ]),
  memory("6B", "Celebrate and protect", [
    "Mid-Autumn Festival",
    "Dragon Boat Festival",
    "waterfall",
    "volcano",
    "recycle",
    "air pollution",
    "poach",
    "protect habitats",
  ]),
];

const invalid = (message: string): never => {
  throw new Error(`Invalid submission: ${message}`);
};
const integerInRange = (value: unknown, upperBound: number): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value < upperBound;
const exactArray = (value: unknown, length: number): value is unknown[] =>
  Array.isArray(value) && value.length === length;

export function calculatePoints(correct: number, total: number): number {
  if (
    !Number.isInteger(total) ||
    total <= 0 ||
    !Number.isInteger(correct) ||
    correct < 0 ||
    correct > total
  ) {
    throw new Error(
      "Invalid score: expected integer counts with 0 <= correct <= total and total > 0."
    );
  }
  return correct === total ? 5 : correct <= 1 ? 1 : 3;
}

/** Trust only answer indices and chronological attempts; never a client-supplied score. */
export function gradeSubmission(input: {
  game: GameKind;
  questionIds?: string[];
  answers?: number[];
  levelId?: string;
  assignments?: number[];
  attempts?: [number, number][];
}): { correct: number; total: number } {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return invalid("expected a game object.");
  if (input.game === "quiz") {
    if (!exactArray(input.questionIds, 5) || !exactArray(input.answers, 5))
      return invalid("quiz needs five questions and five answers.");
    const ids = Array.from(input.questionIds);
    if (ids.some(id => typeof id !== "string") || new Set(ids).size !== 5)
      return invalid("quiz question IDs must be five unique strings.");
    let correct = 0;
    for (let index = 0; index < 5; index++) {
      const question = questionAnswerKeys.get(ids[index]);
      if (!question) return invalid("unknown quiz question.");
      const answer = input.answers[index];
      if (!integerInRange(answer, question.options.length))
        return invalid("answer is not a valid option index.");
      if (answer === question.answer) correct++;
    }
    return { correct, total: 5 };
  }
  if (input.game === "sort") {
    const level = sortAnswerKeys.get(input.levelId ?? "");
    if (!level) return invalid("unknown sorting level.");
    if (!exactArray(input.assignments, level.words.length))
      return invalid("sort needs one assignment for every word.");
    let correct = 0;
    for (let index = 0; index < level.words.length; index++) {
      const basket = input.assignments[index];
      if (!integerInRange(basket, level.baskets.length))
        return invalid("assignment is not a valid basket index.");
      if (basket === level.words[index].basket) correct++;
    }
    return { correct, total: level.words.length };
  }
  if (input.game === "memory") {
    const level = memoryAnswerKeys.get(input.levelId ?? "");
    if (!level) return invalid("unknown memory level.");
    if (
      !Array.isArray(input.attempts) ||
      input.attempts.length < level.pairs.length
    )
      return invalid("memory needs a completed attempt history.");
    const pairCount = level.pairs.length;
    const matchedCards = new Set<number>();
    const dirtyPairs = new Set<number>();
    let correct = 0;
    for (const attempt of input.attempts) {
      if (!exactArray(attempt, 2))
        return invalid(
          "each attempt must contain exactly two original card indices."
        );
      const [first, second] = attempt;
      if (
        !integerInRange(first, pairCount * 2) ||
        !integerInRange(second, pairCount * 2) ||
        first === second
      )
        return invalid("invalid memory card indices.");
      if (matchedCards.has(first) || matchedCards.has(second))
        return invalid("a matched card cannot be used again.");
      const firstPair = first % pairCount;
      const secondPair = second % pairCount;
      if (firstPair === secondPair) {
        matchedCards.add(first);
        matchedCards.add(second);
        if (!dirtyPairs.has(firstPair)) correct++;
      } else {
        // Both pairs lose their clean-match mark, even if one card has not been seen before.
        dirtyPairs.add(firstPair);
        dirtyPairs.add(secondPair);
      }
    }
    if (matchedCards.size !== pairCount * 2)
      return invalid("all pairs must be matched before finishing.");
    return { correct, total: pairCount };
  }
  return invalid("unknown game kind.");
}

// Active source-aligned content. Legacy arrays above are grading-only snapshots:
// their option/card ordering is immutable for already-started runs.
type PracticeRow = [
  question: string,
  correct: string,
  wrongA: string,
  wrongB: string,
  explanation: string,
];
const practiceBanks = new Map<string, PracticeRow[]>();
const practice = (topic: string, encoded: string) => {
  practiceBanks.set(
    topic,
    encoded.split("|").map(row => row.trim().split("~") as PracticeRow)
  );
};
practice(
  "Simple present",
  `{name} ___ football every Saturday.~plays~play~playing~A regular action uses the simple present; a singular name takes -s.|
Does {name} ___ music every day?~listen to~listens to~listened to~After does, use the base verb.|
{name} does not ___ coffee.~like~likes~liked~Use the base verb after does not.|
{name} and I ___ to school on foot every day.~go~goes~went~Use the base form with a plural subject for a habit.|
{name} ___ two brothers.~has~have~having~Use has with a singular third-person subject for a present state.`
);
practice(
  "Present continuous",
  `{name} is ___ a picture now.~drawing~draw~draws~An action happening now uses be + verb-ing.|
{name} and I ___ swimming now.~are~is~am~A plural subject uses are + verb-ing.|
Is {name} ___ in the bedroom now?~sleeping~sleep~sleeps~Present-continuous questions keep the -ing verb.|
{name} is not ___ now.~singing~sings~sing~Use is not + verb-ing.|
Look! {name} ___ a bicycle.~is riding~rides~ride~Look signals an action in progress now.`
);
practice(
  "Simple past",
  `Yesterday, {name} ___ to the park.~went~goes~goed~Yesterday is a finished past time; go changes to went.|
Did {name} ___ the cake yesterday?~cut~cuts~cutting~Use the base form after did.|
{name} ___ a film last night.~watched~watch~watching~Add -ed to watch for a completed past action.|
{name} did not ___ the book last week.~buy~bought~buys~Use the base form after did not.|
{name} ___ at home yesterday.~was~is~were~Use was for a singular subject in the past.`
);
practice(
  "Future tense",
  `{name} ___ visit the museum tomorrow.~will~did~was~Will + base verb describes a future action.|
{name} will ___ a photo tomorrow.~take~takes~took~Use the base form after will.|
Will {name} ___ us next week?~help~helps~helped~A will question uses the base verb.|
{name} ___ go to the beach tomorrow; it will be closed.~will not~did not~was not~Will not describes a negative future action.|
I think {name} ___ enjoy the concert tomorrow.~will~did~has~Use will for a prediction about tomorrow.`
);
practice(
  "Going to",
  `{name} ___ going to keep a diary next year.~is~are~am~A singular name uses is going to for a plan.|
{name} and I are going to ___ hard next term.~study~studied~studying~Going to is followed by a base verb.|
Is {name} ___ to tidy the room tonight?~going~go~goes~A planned future question uses be + going to.|
{name} is not going to ___ breakfast tomorrow.~skip~skips~skipped~Use the base verb after going to.|
{name} and I ___ going to do revision tomorrow.~are~is~am~Use are going to with a plural subject.`
);
practice(
  "Present perfect",
  `{name} ___ packed the suitcase already.~has~have~is~Present perfect uses has + past participle with a singular name.|
Has {name} ever ___ a castle?~visited~visit~visits~Present perfect asks about experience using a past participle.|
{name} has not finished the homework ___.~yet~ago~yesterday~Yet goes at the end of a present-perfect negative.|
{name} and I ___ been on a boat trip before.~have~has~are~A plural subject uses have + past participle.|
{name} has ___ an arm.~broken~broke~break~Broken is the past participle of break.`
);
practice(
  "Past continuous",
  `{name} ___ reading at eight last night.~was~were~is~Use was + verb-ing for a singular subject in progress in the past.|
{name} and I ___ walking when the accident happened.~were~was~are~Use were + verb-ing with a plural subject.|
Was {name} ___ when the alarm rang?~sleeping~sleep~slept~Past continuous uses the -ing form after was.|
{name} was not ___ at six yesterday.~cooking~cooked~cook~Use was not + verb-ing.|
While {name} was walking, a cyclist ___ off his bicycle.~fell~was fall~falling~A completed event uses simple past while the longer action uses past continuous.`
);
practice(
  "Be",
  `{name} ___ a student.~is~are~am~A singular name uses is.|
{name} and I ___ classmates.~are~is~am~A plural subject uses are.|
{name} says, “I ___ six.”~am~is~are~Use am with I.|
___ {name} your friend?~Is~Are~Am~A singular be question begins with Is.|
{name} ___ not tired.~is~are~am~Place not after is for a singular negative.`
);
practice(
  "Imperatives",
  `{name}, ___ your book, please.~open~opens~opening~An instruction begins with the base verb.|
{name}, ___ down, please.~sit~sits~sitting~Use the base verb in an imperative.|
{name}, ___ run in the corridor.~do not~does not~not to~A negative instruction starts with do not.|
{name}, ___ quiet, please.~be~is~are~Use the base form be for an instruction.|
{name}, ___ the ingredients together.~mix~mixes~mixing~Instructions use the base verb without a subject.`
);
practice(
  "Have / has (possession)",
  `{name} ___ a pencil case.~has~have~having~Use has for a singular third-person owner.|
{name} says, “I ___ two pencils.”~have~has~having~I takes have for possession.|
{name} and I ___ school bags.~have~has~having~A plural subject takes have.|
{name} ___ long hair.~has~have~is have~Use has to describe a singular person's possession.|
You ___ a ruler, {name}.~have~has~having~You takes have, not has.`
);
practice(
  "Let's",
  `“Let's ___ a rest,” says {name}.~take~takes~taking~Let's is followed by the base verb to make a suggestion.|
“Let's ___ some water,” says {name}.~drink~drinks~drinking~Use a base verb after Let's.|
“Let's ___ a cartoon,” says {name}.~watch~watches~watching~Let's introduces something we can do together.|
“Let's ___ some biscuits,” says {name}.~eat~eats~eating~The verb after Let's has no -s or -ing.|
“Let's ___ comics,” says {name}.~read~reads~reading~Let's + base verb makes a joint suggestion.`
);
practice(
  "To-infinitive",
  `{name} wants ___ a model.~to make~making~made~Want is followed by to + base verb.|
{name} went to the library ___ a book.~to borrow~borrowing~borrowed~A to-infinitive can explain purpose.|
{name} hopes ___ a prize.~to win~winning~won~Hope takes a to-infinitive.|
It is important for {name} ___ careful.~to be~being~been~Use a to-infinitive after It is important.|
{name} decided ___ early.~to leave~leaving~left~Decide is followed by a to-infinitive.`
);
practice(
  "Indirect speech",
  `{name} said, “I am tired.” → {name} said that they ___ tired.~were~are being~be~With a past reporting verb, am changes to was or were; they takes were.|
{name} said, “I like cooking.” → {name} said that they ___ cooking.~liked~liking~likes~Simple present backshifts to simple past in this reported statement.|
{name} said, “I will help.” → {name} said that they ___ help.~would~will to~did~Will changes to would in this past reported statement.|
{name} said, “Please sit down.” → {name} asked us ___.~to sit down~sit down~sitting down~Report a request with asked + object + to-infinitive.|
{name} said, “Do not run.” → {name} told us ___.~not to run~not ran~do not run~Report a negative instruction with told + object + not to + base verb.`
);
practice(
  "Passive voice",
  `The red packets ___ given by {name} every year.~are~is~have~Present passive uses are + past participle with a plural subject.|
The bridge ___ built long ago, says {name}.~was~is~has~A completed past event uses was + past participle for a singular subject.|
The flowers are ___ by {name} every day.~watered~water~watering~A passive verb uses be + past participle.|
The lanterns were ___ by {name} yesterday.~lit~light~lighting~The past passive uses were + past participle; light becomes lit.|
The palace ___ visited by {name} yesterday.~was~were~has~Use was + past participle for a singular past passive.`
);
practice(
  "Phrasal verbs",
  `{name} will not give ___ despite the difficulty.~up~on~in to~Give up means stop trying.|
{name} is looking ___ a missing book.~for~after to~on~Look for means try to find.|
{name} made ___ a funny story.~up~off~at~Make up means invent.|
{name} set ___ for the trip at dawn.~off~on~up to~Set off means begin a journey.|
{name} found ___ the answer.~out~off~at~Find out means discover information.|
{name} got ___ from danger.~away~at~on to~Get away means escape.|
The prince turned ___ a frog in {name}'s story.~into~on~off~Turn into means change into.|
{name} got ___ trouble for telling lies.~into~off~away from to~Get into trouble means become involved in difficulties.`
);
practice(
  "Can",
  `{name} ___ play the piano.~can~cans~is can~Can expresses ability and does not take -s.|
{name} can ___ a model.~make~makes~making~Use the base verb after can.|
Can {name} ___?~swim~swims~swimming~A can question uses the base verb.|
{name} ___ fly like a bird.~cannot~not can~can not to~Cannot is the negative form for lack of ability.|
{name} and I can ___ badminton.~play~plays~played~Can has the same form for every subject.`
);
practice(
  "Must",
  `{name} ___ keep quiet in the library; it is a rule.~must~must to~musts~Must expresses a rule and is followed by the base verb.|
{name} must ___ in the corridor.~walk~walks~walking~Use a base verb after must.|
{name} ___ litter in the park; it is forbidden.~must not~must~must to~Must not expresses prohibition.|
{name} must ___ for a turn.~wait~waits~waiting~Must takes the base verb wait.|
{name} ___ pick the flowers; it is not allowed.~must not~must~must to~Must not forbids an action.`
);
practice(
  "Could (past abilities)",
  `When {name} was five, they ___ swim.~could~can now~could to~Could describes ability in the past.|
{name} could ___ a spoon at age two.~use~uses~using~Use a base verb after could.|
{name} ___ tie shoelaces as a baby.~could not~not could~could not to~Could not describes lack of past ability.|
Could {name} ___ the stairs at age three?~climb~climbs~climbing~A could question uses a base verb.|
At age six, {name} could ___ a bicycle.~ride~rides~riding~Past ability uses could + base verb.`
);
practice(
  "Need to (be)",
  `{name} needs ___ patient for this job.~to be~being~be to~Needs is followed by to + base verb.|
{name} and I need ___ more vegetables.~to eat~eating~ate~Need to expresses something necessary.|
Does {name} need ___ a course?~to take~taking~took~Use need + to-infinitive after does.|
{name} needs ___ attentive.~to be~be~been~Use needs to be before an adjective.|
{name} does not need ___ today.~to work~working~worked~Use does not need + to-infinitive.`
);
practice(
  "Ought to",
  `{name} ___ wash their hair regularly.~ought to~ought~oughts to~Ought to gives advice.|
{name} ought to ___ breakfast.~eat~eats~eating~Use a base verb after ought to.|
{name} ought not to ___ junk food every day.~eat~eats~eaten~Ought not to advises against an action.|
{name} ought to ___ to the dentist.~go~goes~went~Ought to takes a base verb.|
{name} ___ help with the housework.~ought to~oughts to~is ought~Ought to has the same form for all subjects.`
);
practice(
  "Shall (suggestion)",
  `___ we organise a charity sale, {name}?~Shall~Did~Must to~Shall we introduces a joint suggestion.|
Shall we ___ the elderly, {name}?~visit~visits~visited~Use the base verb after Shall we.|
Shall I ___ these books, {name}?~donate~donates~donating~Shall I can offer to do something.|
___ we take part in a concert, {name}?~Shall~Was~Have~Shall we suggests an action together.|
Shall we ___ flags, {name}?~sell~sells~sold~Suggestions with shall use a base verb.`
);
practice(
  "Should (obligation and prohibition)",
  `{name} ___ offer their seat to an elderly passenger.~should~should not~shoulds~Should expresses an appropriate action or obligation.|
{name} should ___ politely.~speak~speaks~speaking~Use a base verb after should.|
{name} ___ jump the queue.~should not~should~should to~Should not says an action is wrong or inadvisable.|
{name} should ___ patiently.~wait~waits~waiting~Should takes the base verb.|
{name} ___ push other passengers.~should not~should~shoulds~Should not discourages unkind behaviour.`
);
practice(
  "Would",
  `{name} ___ like some noodles, please.~would~would to~woulds~Would like expresses a polite wish.|
Would {name} ___ a salad?~like~likes~liked~Use a base verb after would.|
{name} says, “I would ___ the curry, please.”~like~likes~liking~Would like is a polite way to request food.|
{name} would ___ a pudding.~like~likes~liked~Would is followed by the base form.|
{name} ___ not like any more food.~would~woulds~would to~Would not like politely expresses a negative wish.`
);
practice(
  "Subject pronouns",
  `{name} is a boy. ___ is a student.~He~Him~His~He is a subject pronoun for a boy.|
{name} is a girl. ___ is my friend.~She~Her~Hers~She is a subject pronoun for a girl.|
{name} and I are classmates. ___ are ready.~We~Us~Our~We is the subject pronoun for a group including the speaker.|
{name}'s dogs are small. ___ are brown.~They~Them~Their~They is a plural subject pronoun.|
{name} has a cat. ___ is black.~It~Its~Them~It is a subject pronoun for one animal.`
);
practice(
  "Object pronouns",
  `{name} is a boy. I play with ___.~him~he~his~Use the object pronoun him after with.|
{name} is a girl. I talk to ___.~her~she~hers~Use her as an object after to.|
{name} says, “Please help ___.”~me~I~my~Me is the object form of I.|
{name} and I are ready. Please call ___.~us~we~our~Us is an object pronoun for a group including the speaker.|
{name}'s friends are here. Give ___ the books.~them~they~their~Them is the object form of they.`
);
practice(
  "Possessive pronouns",
  `This bag belongs to {name}. It is ___. (Use a pronoun for a girl.)~hers~her~she~Hers stands alone to show possession.|
{name} says, “This racket belongs to me. It is ___.”~mine~my~me~Mine is a possessive pronoun without a following noun.|
These books belong to {name} and me. They are ___.~ours~our~us~Ours replaces our + noun.|
{name} says, “This coat belongs to you. It is ___.”~yours~your~you~Yours stands alone to show belonging to you.|
This watch belongs to {name}. It is ___. (Use a pronoun for a boy.)~his~he~him~His can be a possessive pronoun standing alone.`
);
practice(
  "Reflexive pronouns",
  `{name} is a boy. He dressed ___.~himself~herself~themselves~Himself refers back to he.|
{name} is a girl. She helped ___.~herself~himself~ourselves~Herself refers back to she.|
{name} says, “I did it ___.”~myself~me~mine~Myself refers back to I.|
{name} and I made it ___.~ourselves~myself~themselves~Ourselves refers back to a group including the speaker.|
{name}'s friends made it ___.~themselves~himself~herself~Themselves refers back to a plural third-person subject.`
);
practice(
  "Relative pronouns: who / where / which / where",
  `{name} is the person ___ won the prize.~who~where~when~Who introduces information about a person.|
This is the village ___ {name} lives.~where~who~whose~Where introduces information about a place.|
This is the bag ___ {name} bought.~which~who~where~Which introduces information about a thing.|
The teacher ___ helps {name} is kind.~who~where~when~Use who for a person in a relative clause.|
This is the temple ___ {name} took photos.~where~who~which~Use where for the location of an action.`
);
practice(
  "Nobody / everybody / anybody / anything",
  `{name} was alone; ___ else was there.~nobody~everybody~anything~Nobody means no person.|
{name} invited the whole class; ___ came.~everybody~nobody~anything~Everybody means every person.|
Did ___ see {name}'s missing book?~anybody~anything~everywhere~Anybody asks about an unspecified person.|
{name} did not hear ___.~anything~anybody place~everywhere~Anything refers to an unspecified thing in a negative.|
___ in {name}'s class is ready; all pupils are here.~Everybody~Nobody~Anything~Everybody refers to all people and takes a singular verb.`
);
practice(
  "This and that",
  `{name} says, “___ is my pencil here in my hand.”~This~Those~These~This points to one thing near the speaker.|
{name} says, “___ is our school over there.”~That~These~Those~That points to one distant thing.|
{name} says, “Is ___ your bag here beside me?”~this~these~those~Use this for one nearby object.|
{name} says, “Is ___ your coat over there?”~that~these~those~Use that for one distant object.|
{name} holds a ruler and says, “___ is new.”~This~These~Those~This is singular and near.`
);
practice(
  "There is / There are",
  `There ___ a book beside {name}.~is~are~am~Use there is with a singular noun.|
There ___ three pencils beside {name}.~are~is~am~Use there are with a plural noun.|
___ there a pond near {name}?~Is~Are~Do~Ask Is there with a singular noun.|
There ___ some rice in {name}'s bowl.~is~are~have~Use there is with uncountable rice.|
There ___ not any books on {name}'s desk.~are~is~am~Use there are not with a plural noun.`
);
practice(
  "Possessive adjectives: my / your",
  `{name} says, “I have a book. It is ___ book.”~my~me~I~My comes before a noun to show belonging to I.|
{name} says, “You have a bag. It is ___ bag.”~your~you~yours~Your comes before a noun to show belonging to you.|
{name} says, “This is ___ father.” (The speaker's father.)~my~me~mine~Use my before the noun for the speaker's possession.|
{name} asks you, “Is this ___ pencil?”~your~you~yours~Your is a possessive adjective before pencil.|
{name} says, “I like ___ school.”~my~I~me~My is a possessive adjective before school.`
);
practice(
  "Possessive adjectives: her / his / our / their",
  `{name} is a girl. This is ___ dress.~her~she~hers~Her comes before a noun showing a girl's possession.|
{name} is a boy. This is ___ shirt.~his~he~him~His comes before a noun showing a boy's possession.|
{name} and I like ___ school.~our~us~we~Our comes before a noun for a group including the speaker.|
{name}'s friends carry ___ books.~their~them~they~Their comes before a noun for a plural third-person owner.|
{name} is a girl. ___ hat is red.~Her~She~Hers~Use Her before a noun, not Hers.`
);
practice(
  "How",
  `___ does {name} go to school? — By bus.~How~Who~What colour~How asks about a way or method.|
___ can {name} get to the bank? — Walk straight ahead.~How~Whose~How old~How asks for directions or a method.`
);
practice(
  "How old",
  `___ is {name}? — Six.~How old~How many~What colour~How old asks someone's age.`
);
practice(
  "How many",
  `___ lions can {name} see? — Three.~How many~How much~How old~How many asks the number of countable things.`
);
practice(
  "How much",
  `___ is {name}'s lunch? — Twenty dollars.~How much~How old~How many~How much asks a price or uncountable amount.|
How ___ water does {name} want?~much~many~old~Use much with uncountable water.`
);
practice(
  "What",
  `___ is {name} doing? — Reading.~What~Who~Whose~What asks about an action or thing.|
___ is {name}'s job? — A doctor.~What~Where~When~What asks for the kind of job.`
);
practice(
  "What colour",
  `___ is {name}'s hat? — Blue.~What colour~How old~Where~What colour asks about an object's colour.`
);
practice(
  "What time",
  `___ does {name} get up? — At seven o'clock.~What time~Who~How many~What time asks a clock time.`
);
practice(
  "Where",
  `___ is {name}? — In the kitchen.~Where~Who~What colour~Where asks about a place.|
___ is {name}'s school? — Near the park.~Where~When~How old~Where asks about a location.`
);
practice(
  "When",
  `___ is {name}'s Sports Day? — On Monday.~When~Who~Whose~When asks the date or time of an event.`
);
practice(
  "Is there / Are there / Are you",
  `___ there a library at {name}'s school?~Is~Are~Do~Use Is there with a singular noun.|
___ there any mushrooms in {name}'s bowl?~Are~Is~Does~Use Are there with a plural noun.|
{name} asks, “___ you tired?”~Are~Is~Do~Use Are you before an adjective in a yes/no question.`
);
practice(
  "Do you / Does he / Does she",
  `___ {name} like mangoes?~Does~Do~Is~A singular third-person present question starts with Does.|
{name} asks, “___ you like pears?”~Do~Does~Is~A present question with you starts with Do.|
Does {name} ___ as a teacher?~work~works~worked~Use a base verb after does.`
);
practice(
  "Did you",
  `___ {name} watch a show yesterday?~Did~Does~Is~Did asks about a completed past action.|
Did {name} ___ the party?~enjoy~enjoyed~enjoying~Use the base verb after did.`
);
practice(
  "Why",
  `___ is {name} wearing a coat? — Because it is cold.~Why~Who~Whose~Why asks for a reason, often answered with because.`
);
practice(
  "Which",
  `___ show does {name} prefer, the cartoon or the drama?~Which~Who~How old~Which asks for a choice from named alternatives.`
);
practice(
  "Who",
  `___ is {name}'s teacher? — Miss Lee.~Who~Where~What colour~Who asks about a person.`
);
practice(
  "Whose",
  `___ backpack is this? — It belongs to {name}.~Whose~Who~Where~Whose asks about the owner of something.`
);
practice(
  "How far",
  `___ is {name}'s home from the station? — Two kilometres.~How far~How long~How often~How far asks about distance.`
);
practice(
  "How long (time period)",
  `___ does {name}'s journey take? — Twenty minutes.~How long~How far~How many~How long asks about a period of time.|
___ has {name} been a writer? — For three years.~How long~How far~How many times~How long can ask about duration with the present perfect.`
);
practice(
  "How many times",
  `___ has {name} visited the castle? — Twice.~How many times~How far~How much~How many times asks the number of occasions.`
);
practice(
  "How often",
  `___ does {name} wash their hair? — Every day.~How often~How far~How old~How often asks about frequency.`
);
practice(
  "-ed / -ing adjectives",
  `{name} felt ___ because the show was dull.~bored~boring~bore~An -ed adjective describes a person's feeling.|
The exciting story made {name} feel ___.~excited~exciting~excite~Use -ed for the person experiencing a feeling.|
The ___ film made {name} cry.~touching~touched~touch~Use -ing for the thing causing a feeling.|
{name} was ___ by the amazing view.~amazed~amazing~amaze~Use -ed for the person affected.|
The ___ show made {name} laugh.~amusing~amused~amuse~Use -ing for something that causes amusement.`
);
practice(
  "Although",
  `___ the bus was crowded, {name} got on it.~Although~Because~So~Although introduces a contrast, not a reason.|
{name} walked to school ___ it was raining.~although~because~so~Although joins an unexpected contrast.`
);
practice(
  "Before / after / until",
  `{name} washed their hands ___ cooking; the washing came first.~before~after~until~Before places one event earlier than another.|
{name} ate the cake ___ baking it; the baking came first.~after~before~until~After places one event later than another.|
{name} waited ___ the glue was dry.~until~after of~before of~Until marks the end of a waiting period.`
);
practice(
  "Either … or / neither … nor",
  `{name} can join either the show ___ the concert.~or~nor~and~Either pairs with or to offer alternatives.|
{name} likes neither noise ___ litter.~nor~or~and~Neither pairs with nor to reject both alternatives.|
{name} will either sell flags ___ run a stall.~or~nor~but~Use either … or for a choice.`
);
practice(
  "If (conditions)",
  `___ it rains, {name} will stay indoors.~If~Unless~Although~If introduces the condition for the result.|
{name} will help ___ they have time.~if~unless~although~If gives the condition under which the action will happen.`
);
practice(
  "Since (reason)",
  `___ the road is blocked, {name} must take another route.~Since~Unless~Despite~Since can mean because and introduce a reason.`
);
practice(
  "So that",
  `{name} speaks loudly ___ everyone can hear.~so that~although~unless~So that introduces the purpose of an action.|
{name} saves money ___ they can donate it.~so that~although~unless~So that explains the intended result.`
);
practice(
  "Therefore",
  `The forest was destroyed. ___, {name} could not see any animals there.~Therefore~However~Although~Therefore introduces a consequence of the previous fact.`
);
practice(
  "Unless",
  `{name} will be late ___ they leave now.~unless~if~although~Unless means if not; leaving now prevents lateness.|
The animals will suffer ___ {name} helps them.~unless~if~because~Unless introduces the condition needed to prevent a bad result.`
);
practice(
  "Both … and",
  `{name} likes both cartoons ___ documentaries.~and~or~nor~Both pairs with and to include two things.|
Both {name} ___ I enjoyed the show.~and~or~nor~Both … and links two included people.`
);
practice(
  "As … as / like (similes)",
  `{name} is as brave ___ a lion.~as~than~like~A simile using as has the pattern as + adjective + as.|
{name} runs ___ the wind.~like~as as~than~Like compares one thing to another.|
{name} is as gentle ___ a lamb.~as~than~like~Use as … as to compare a quality.`
);
practice(
  "Famous for",
  `The city {name} visits is famous ___ its palace.~for~with~to~Famous for introduces what makes a place well known.`
);
practice(
  "Made of / used for",
  `{name}'s chair is made ___ wood.~of~for~to~Made of tells the material of an object.|
{name}'s scissors are used ___ cutting paper.~for~of~to cutting~Used for is followed by a noun or gerund describing purpose.`
);
practice(
  "Pleased with / proud of / upset about",
  `{name} is proud ___ their achievement.~of~with~to~Proud of is the correct adjective-preposition pair.|
{name} is pleased ___ the result.~with~of~to~Pleased with means satisfied with something.|
{name} is upset ___ the accident.~about~of~to~Upset about introduces the situation causing unhappiness.`
);
practice(
  "Quarrel with / lie to / be jealous of",
  `{name} should not quarrel ___ friends.~with~of~at~Quarrel with means argue angrily with someone.|
{name} must not lie ___ classmates.~to~of~at~Lie to means tell someone something untrue.|
{name} is jealous ___ a friend's success.~of~to~at~Jealous of is the correct adjective-preposition pair.`
);
practice(
  "Since / for (duration)",
  `{name} has been a writer ___ 2020.~since~for~ago~Since introduces the starting point of a duration.|
{name} has lived here ___ three years.~for~since~ago~For introduces the length of a duration.`
);
practice(
  "With (body parts / accessories) / in (clothing)",
  `{name} is the person ___ glasses.~with~in~on~Use with for accessories or body features.|
{name} is the person ___ a blue suit.~in~with~on~Use in to identify clothing being worn.|
{name} is the child ___ curly hair.~with~in~on~Use with to describe a body feature.`
);
practice(
  "Thank you for / Sorry for",
  `{name} says, “Thank you ___ helping me.”~for~to~of~Thank you for is followed by a noun or gerund.|
{name} says, “Sorry ___ being late.”~for~to~of~Sorry for introduces an action you regret.`
);
practice(
  "Directions: go out of / go / walk straight ahead / walk across / turn left / right into / on your left / right / next to / opposite",
  `{name}, turn left ___ King Street.~into~on to into~at of~Turn into means enter a street.|
The bakery is ___ {name}'s left.~on~in~at~The direction phrase is on your left or right.|
{name}, walk ___ the road to reach the shop on the other side.~across~alongside only~inside~Across means from one side to the other.|
The bank is ___ the bakery; they face each other across the road, says {name}.~opposite~inside~under~Opposite means facing across a space.|
{name}, walk straight ___ until you reach the station.~ahead~behind of~under~Walk straight ahead means continue forward without turning.|
{name}, go out ___ the building first.~of~to of~on of~Go out of means leave an enclosed place.`
);
practice(
  "Good at",
  `{name} is good ___ playing the piano.~at~in~on~Good at introduces a skill, often followed by a gerund.|
{name} is good at ___ sums.~doing~do~did~Use a gerund after the preposition at.`
);
practice(
  "Listen to / play with",
  `{name} listens ___ music.~to~at~of~Listen to is the correct verb-preposition pair.|
{name} plays ___ friends.~with~at~of~Play with means take part in a game together.`
);
practice(
  "More / less / fewer",
  `{name} wants ___ rice than before, not so much.~less~fewer~many~Less compares smaller amounts of an uncountable noun.|
{name} wants ___ apples than before, only two.~fewer~less~much~Fewer compares smaller numbers of countable items.|
{name} wants ___ water than before, a bigger glass.~more~fewer~many~More compares a greater amount.`
);
practice(
  "So much / so many",
  `There are so ___ plastic bags in {name}'s bin.~many~much~little~Use so many with plural countable nouns.|
There is so ___ pollution near {name}'s home.~much~many~few~Use so much with an uncountable noun.`
);
practice(
  "Such as",
  `{name} likes fruit ___ grapes and cherries.~such as~such~as such~Such as introduces examples.|
{name} visits landmarks ___ palaces and towers.~such as~such~as such~Use such as before examples of a group.`
);
practice(
  "Too much / too many",
  `{name} eats too ___ sugar.~much~many~few~Too much describes an excessive uncountable amount.|
{name} eats too ___ cookies.~many~much~little~Too many describes an excessive countable number.`
);
practice(
  "At / on (festivals)",
  `{name} visits family ___ Chinese New Year.~at~in~to~At can refer to a festival period.|
{name} has a reunion dinner ___ New Year's Eve.~on~in~to~Use on for a named festival day.`
);
practice(
  "At / in (times / festivals / seasons)",
  `{name} gets up ___ seven o'clock.~at~in~on~Use at for clock times.|
{name} eats dinner ___ the evening.~in~at~on~Use in for parts of the day.|
{name} goes hiking ___ autumn.~in~at~on~Use in for a season.|
{name} visits relatives ___ Chinese New Year.~at~in~on to~At refers to a festival period.`
);
practice(
  "At / in (times)",
  `{name} left ___ eight o'clock.~at~in~on~Use at before a clock time.|
{name} returned ___ the evening.~in~at~on~Use in with the morning, afternoon or evening.`
);
practice(
  "When / while",
  `{name} was sleeping ___ the alarm rang.~when~while of~during~When can introduce the short event interrupting an ongoing action.|
___ {name} was cooking, the phone rang.~While~During~Until of~While introduces a clause describing an ongoing action.|
{name} was reading ___ their brother was drawing.~while~during~for~While can link two actions in progress at the same time.`
);
practice(
  "Singular and plural",
  `{name} has one pencil and two ___.~pencils~penciles~pencil~Most singular nouns add -s to form the plural.|
{name} sees one fox and three ___.~foxes~foxs~fox~Nouns ending in -x add -es.|
{name} has one baby rabbit and two baby ___.~rabbits~rabbit~rabbites~The plural of rabbit adds -s.|
{name} sees one child and four ___.~children~childs~childes~Child has the irregular plural children.|
{name} has one foot and two ___.~feet~foots~feets~The irregular plural of foot is feet.`
);
practice(
  "Countable and uncountable nouns",
  `{name} wants some ___. Which option is uncountable?~rice~apples~eggs~Rice is usually uncountable; apples and eggs are countable.|
{name} buys two ___ of bread.~loaves~breads~bread~Uncountable bread is measured in units such as loaves.|
{name} drinks a glass ___ water.~of~many~a~Water is uncountable; a glass of measures an amount.|
Which can {name} count individually?~an apple~milk~butter~Apple is countable; milk and butter are uncountable.|
{name} eats ___ cheese.~some~a~many~Use some with uncountable cheese.`
);
practice(
  "Quantifiers",
  `How ___ apples does {name} want?~many~much~little~Use many with plural countable nouns.|
How ___ milk does {name} want?~much~many~few~Use much with an uncountable noun.|
{name} has only two biscuits: a ___ biscuits.~few~little~much~A few goes with plural countable nouns.|
{name} wants a ___ salt, not a whole spoonful.~little~few~many~A little describes a small uncountable amount.|
{name} has ___ food for everyone; nobody will be hungry.~enough~too few~no~Enough means as much as needed.`
);
practice(
  "Comparative adjectives",
  `{name}'s bag is ___ than mine. It weighs more.~heavier~heaviest~heavy~Use a comparative before than; heavy becomes heavier.|
{name}'s lunch is ___ than mine. Mine costs more.~cheaper~cheapest~cheap~Use a comparative to compare two things.|
{name}'s drink is ___ than mine; it has less sugar.~healthier~healthiest~healthy~Change -y to -ier in this comparative.|
{name}'s cake is ___ delicious than mine.~more~most~much~Long adjectives use more for comparisons.|
{name}'s bowl is ___ than mine. It holds more food.~bigger~biggest~big~Double the final consonant in big before adding -er.`
);
practice(
  "Superlative adjectives",
  `{name} chose the ___ bag in the shop; all others cost more.~cheapest~cheaper~cheap~Use the superlative to compare with the whole group.|
{name}'s is the ___ bowl of all; it weighs the most.~heaviest~heavier~heavy~Heavy changes to heaviest in the superlative.|
This is the ___ delicious cake {name} has ever eaten.~most~more~much~Long adjectives use the most for a superlative.|
{name} picked the ___ apple of all; it was larger than every other one.~biggest~bigger~big~The superlative of big is biggest.|
This is the ___ dish on {name}'s menu; every other one has more sugar.~healthiest~healthier~healthy~Healthy changes to healthiest for the whole group.`
);
practice(
  "And",
  `{name} has a pencil ___ a ruler: both items.~and~but~because~And adds another item or similar idea.|
{name} can sing ___ dance; they can do both.~and~or~but~And includes both activities.`
);
practice(
  "Because",
  `{name} wore a coat ___ it was cold.~because~or~but~Because introduces a reason.|
{name} ate a snack ___ they were hungry.~because~or~but~Because answers why an action happened.`
);
practice(
  "But",
  `{name} is weak ___ brave.~but~because~or~But joins contrasting ideas.|
The bus is cheap ___ uncomfortable, says {name}.~but~because~so~But introduces a contrast between two qualities.`
);
practice(
  "Or",
  `{name}, would you like milk ___ water? Choose one.~or~and~because~Or presents alternatives.|
{name} can choose the cartoon ___ the documentary.~or~because~so~Or offers a choice between alternatives.`
);
practice(
  "So",
  `It was raining, ___ {name} stayed indoors.~so~but~or~So introduces the result of the first clause.|
{name} was hungry, ___ they ate lunch.~so~but~or~So links a cause to its result.`
);
practice(
  "Articles: a / an / the",
  `{name} has ___ red bag.~a~an~these~Use a before a consonant sound with a singular noun.|
{name} sees ___ elephant.~an~a~those~Use an before a vowel sound.|
{name}, close ___ door beside you.~the~an~these~The identifies a particular known object.|
{name} has ___ eraser.~an~a~those~Eraser starts with a vowel sound, so use an.|
{name} has ___ book.~a~an~these~Book starts with a consonant sound, so use a.`
);
practice(
  "Determiners: this / that / these / those",
  `{name} says, “___ shoes here beside me are mine.”~These~This~That~These points to plural things nearby.|
{name} says, “___ cats over there are small.”~Those~That~This~Those points to plural things far away.|
{name} says, “___ rabbit here is white.”~This~These~Those~This points to one nearby thing.|
{name} says, “___ dog over there is black.”~That~These~Those~That points to one distant thing.`
);
practice(
  "Some / any / a lot of",
  `{name} has ___ apples.~some~a~an~Some introduces an unspecified plural number.|
{name} does not have ___ eggs.~any~a~an~Use any in a negative with plural nouns.|
{name} has ___ rice; the bowl is nearly full.~a lot of~a few~an~A lot of describes a large amount.|
Are there ___ books in {name}'s bag?~any~a~an~Use any to ask about an unspecified plural number.`
);
practice(
  "A few / a lot of / a little",
  `{name} has a ___ apples, only two.~few~little~much~A few goes with plural countable nouns.|
{name} adds a ___ salt.~little~few~many~A little goes with an uncountable noun.|
{name} has ___ fruit; the basket is full.~a lot of~a~an~A lot of describes a large amount or number.`
);
practice(
  "Place prepositions: in / on / under / near / at / to",
  `{name}'s pencils are ___ the pencil case, inside it.~in~on~under~In means inside.|
{name}'s book rests ___ the top of the table.~on~in~under~On means touching the upper surface.|
{name}'s cat is ___ the table, below it.~under~on~in~Under means below something.|
{name}'s home is ___ the park, a short walk away.~near~inside~above~Near means not far away.|
{name} is waiting ___ the school gate.~at~into~onto~At can identify a meeting point.|
{name} goes ___ school every weekday.~to~at~on~To expresses movement towards a destination.`
);
practice(
  "By bus / on foot",
  `{name} travels ___ bus.~by~on~at~Use by bus for a means of transport.|
{name} goes ___ foot because school is nearby.~on~by~in~The fixed expression for walking is on foot.`
);
practice(
  "On / from / to (dates / days)",
  `{name}'s birthday is ___ 12 May.~on~in~at~Use on with dates.|
{name}'s camp runs ___ Monday to Wednesday.~from~on~at~From introduces the beginning of a date range.|
{name}'s camp runs from Monday ___ Wednesday.~to~in~on~To introduces the end of a date range.|
{name} has lessons ___ Fridays.~on~in~at~Use on before a day of the week.`
);
practice(
  "Between / in front of / behind / next to / on my …",
  `The bank is ___ the library and the supermarket, says {name}.~between~under~inside~Between means in the space separating two things.|
{name} sits ___ the stage, facing it.~in front of~behind~inside~In front of means ahead of something.|
The garden is ___ {name}'s house, at the back.~behind~in front of~inside~Behind means at the back.|
The cafe is ___ {name}'s bakery; they share a wall.~next to~between~under~Next to means immediately beside.|
The shop is ___ {name}'s left.~on~in~at~Use on my left or on my right for position.`
);
practice(
  "Gerunds",
  `{name} enjoys ___ pictures.~drawing~draw~to drew~Enjoy is followed by a gerund, verb + -ing.|
___ is {name}'s favourite sport.~Swimming~Swim~Swam~A gerund can be the subject of a sentence.|
{name} is good at ___ the piano.~playing~play~played~After a preposition, use a gerund.|
{name} finished ___ the dishes.~washing~wash~to wash~Finish takes a gerund.|
{name} avoids ___ water.~wasting~waste~to waste~Avoid is followed by a gerund.`
);
practice(
  "Adverbs of manner",
  `{name} speaks ___ so every word is easy to hear.~clearly~clear~clearness~Clearly is an adverb of manner describing speaks.|
{name} waits ___ without getting angry.~patiently~patient~patience~An adverb of manner describes how an action is done.|
{name} eats ___ without making a sound.~quietly~quiet~quietness~Quietly describes how someone eats.|
{name} speaks ___ with good manners.~politely~polite~politeness~Use an adverb to describe a verb.|
{name} dresses ___ with neat clothes.~tidily~tidy~tidiness~Tidily is the manner adverb from tidy.`
);
practice(
  "Already / just / yet",
  `{name} has ___ finished lunch; they finished earlier than expected.~already~yet~ago~Already means before now or earlier than expected.|
{name} has ___ arrived, only a moment ago.~just~yet~ago~Just means a very short time ago.|
Has {name} packed the suitcase ___?~yet~ago~just~Yet is often placed at the end of a present-perfect question.|
{name} has not finished ___ .~yet~ago~already to~Yet goes at the end of a present-perfect negative.`
);
practice(
  "Always / often / sometimes / seldom / never",
  `{name} ___ brushes twice a day: every day without exception.~always~never~seldom~Always means every time.|
{name} ___ plays tennis: most weekends but not all.~often~never~always~Often means many times.|
{name} ___ walks to school: on some days, but not others.~sometimes~always~never~Sometimes means on some occasions.|
{name} ___ eats sweets: almost never.~seldom~always~often~Seldom means rarely.|
{name} ___ litters: not at any time.~never~always~often~Never means not at any time.`
);
practice(
  "Usually",
  `{name} ___ wears a coat in winter: most days.~usually~never~always~Usually means in most cases, but not necessarily every time.`
);
practice(
  "Either (also not)",
  `{name} does not like the news. I do not like it ___.~either~too~neither~Either at the end of a negative means also not.`
);
practice(
  "Too (similar feelings / opinions)",
  `{name} is hungry. I am hungry ___.~too~either~neither~Too at the end of a positive sentence means also.`
);
practice(
  "Too (link positive ideas)",
  `{name} likes cartoons. I like them ___.~too~either~neither~Too links two positive ideas and means also.`
);
practice(
  "Too (degree)",
  `The water is ___ hot for {name} to drink safely.~too~enough~many~Too before an adjective means more than is suitable.`
);
practice(
  "So / very / really / a bit / a little",
  `{name} is ___ tired; they can hardly stay awake.~very~many~much of~Very intensifies an adjective.|
{name} is ___ upset that they are crying.~so~such~many~So can intensify an adjective in so … that.|
{name} is a ___ worried, but not very worried.~bit~few~many~A bit softens the degree of an adjective.|
{name} is ___ pleased; they are genuinely happy.~really~many~a few~Really intensifies an adjective.|
{name} is a ___ nervous, but not very nervous.~little~few~many~A little can soften an adjective's degree.`
);
practice(
  "Ago",
  `{name} became a writer three years ___.~ago~yet~soon~Ago follows a duration measured back from now.`
);
practice(
  "Last … / … ago",
  `{name} visited the park ___ week.~last~ago~yet~Last comes before a named past time period.|
{name} arrived two days ___.~ago~last~yet~Ago comes after a duration in the past.`
);
practice(
  "Once / twice / never / ever",
  `{name} visits the dentist ___ a year: one time.~once~twice~never~Once means one time.|
{name} brushes teeth ___ a day: two times.~twice~once~never~Twice means two times.|
{name} ___ skips breakfast: not at any time.~never~ever~twice~Never means not at any time.|
Has {name} ___ visited a cave?~ever~ago~yet to~Ever asks about any past experience.`
);
practice(
  "First / then / next / finally",
  `___, {name} plants the seeds; this is the first step.~First~Finally~Ago~First introduces the beginning of a sequence.|
{name} plants seeds. ___, they water them; this is the next step.~Next~Finally already~Ago~Next introduces the following step.|
{name} waters the seeds. ___, they wait for them to grow.~Then~Ago~Yet~Then introduces the next action.|
___, {name} picks the vegetables; this is the last step.~Finally~First~Ago~Finally introduces the last action in a sequence.`
);
practice(
  "First / next / then / after that / finally",
  `___, {name} washes the vegetables; this is the first step.~First~Finally~Ago~First starts a sequence of instructions.|
{name} washes the vegetables. ___, they chop them.~Next~Ago~Yet~Next introduces the following instruction.|
{name} chops the vegetables. ___, they mix them.~Then~Ago~Yet~Then moves the sequence forward.|
{name} mixes the vegetables. ___, they cook them.~After that~Ago~Yet~After that introduces the action following the previous one.|
___, {name} serves the dish; this is the last step.~Finally~First~Ago~Finally marks the last action.`
);
practice(
  "Once upon a time / one day / suddenly / in the end",
  `___, {name} lived in a castle long ago.~Once upon a time~Once upon time~Once a time~Once upon a time is a traditional story opening.|
___, {name} met a dragon on an unexpected day.~One day~One days~Once day~One day introduces an event in a story.|
___, a dragon appeared in front of {name}, without warning.~Suddenly~Usually~At last of~Suddenly means unexpectedly and quickly.|
___, {name} found the treasure; the story finished happily.~In the end~In end~At the end of~In the end introduces the final outcome.`
);
practice(
  "Once upon a time / soon / after a while / at last / suddenly / however / in the end",
  `___, {name} lived in a castle long ago.~Once upon a time~Once upon time~Once a time~Once upon a time begins a traditional tale.|
{name} will arrive ___; they are only two minutes away.~soon~ago~yesterday~Soon means in a short time from now.|
{name} waited. ___, the rain stopped.~After a while~After while~After a whiles~After a while means after some time has passed.|
After hours of searching, ___ {name} found the dog!~at last~yet~ago~At last expresses success after a long wait.|
___, a dragon appeared before {name}, without warning.~Suddenly~Usually~At last of~Suddenly introduces an unexpected event.|
{name} was weak. ___, they were brave.~However~Therefore~Because~However introduces a contrast.|
___, {name} solved the problem; the story ended happily.~In the end~In end~At the end of~In the end introduces a final outcome.`
);

const names = ["Sam", "Mia", "Ben", "Lily", "Alex"];
const activeGrammarQuestions: QuizQuestion[] = grammarTargets.flatMap(
  target => {
    const rows = practiceBanks.get(target.topic);
    if (!rows?.length)
      throw new Error(`Missing practice bank: ${target.topic}`);
    // Each target has at least five contextual sentence examples. A short bank cycles
    // through distinct named subjects; longer banks also retain every listed subtype.
    return Array.from({ length: Math.max(5, rows.length) }, (_, index) => {
      const row = rows[index % rows.length];
      const question = row[0].replaceAll("{name}", names[index % names.length]);
      const id = `pdf-g-${target.level.toLowerCase()}-${target.chapter}-${slug(target.topic)}-${fingerprint(question)}`;
      return {
        id,
        mode: "grammar" as const,
        ...target,
        question,
        ...makeOptions(row[1], [row[2], row[3]], id),
        explanation: row[4],
      };
    });
  }
);
const vocabularyQuestion = (
  entry: CurriculumWord,
  alternate = false
): QuizQuestion => {
  const candidates = Array.from(
    new Set(
      curriculumWords
        .filter(
          word =>
            word.level === entry.level &&
            word.word !== entry.word &&
            word.category !== entry.category
        )
        .map(word => word.word)
    )
  );
  // Family is the only four-entry chapter, but distractors can come from the same
  // textbook. Exclude the correct category to avoid synonym/alias ambiguity.
  const id = `pdf-v-${entry.id}${alternate ? "-match" : ""}`;
  const offset = parseInt(fingerprint(id), 36) % candidates.length;
  const distractors = [0, 1, 2].map(
    step => candidates[(offset + step) % candidates.length]
  );
  return {
    id,
    mode: "vocabulary",
    level: entry.level,
    chapter: entry.chapter,
    sourcePage: entry.sourcePage,
    topic: entry.category,
    question: alternate
      ? `Match the ${entry.category.toLowerCase()} clue: “${entry.definition}”.`
      : `Which word or phrase means “${entry.definition}”?`,
    ...makeOptions(entry.word, distractors, id),
    explanation: `${entry.word}: ${entry.definition}.`,
  };
};
const activeVocabularyQuestions = curriculumWords.map(entry =>
  vocabularyQuestion(entry)
);
for (const level of textbookLevels)
  for (let chapter = 1; chapter <= 6; chapter++) {
    const entries = curriculumWords.filter(
      word => word.level === level && word.chapter === chapter
    );
    if (entries.length < 5)
      activeVocabularyQuestions.push(vocabularyQuestion(entries[0], true));
  }
export const quizQuestions: QuizQuestion[] = [
  ...activeGrammarQuestions,
  ...activeVocabularyQuestions,
];

const uniqueEntries = (entries: CurriculumWord[]) =>
  entries.filter(
    (word, index) =>
      entries.findIndex(candidate => candidate.word === word.word) === index
  );
const roundRobin = (
  groups: CurriculumWord[][],
  count: number
): CurriculumWord[] => {
  const result: CurriculumWord[] = [];
  for (
    let offset = 0;
    result.length < count && groups.some(group => group.length > offset);
    offset++
  )
    for (const group of groups)
      if (group[offset] && result.length < count) result.push(group[offset]);
  return result;
};
const categoriesOf = (entries: CurriculumWord[]) =>
  Array.from(new Set(entries.map(word => word.category)));
const sourceMetadata = (entries: CurriculumWord[]) => ({
  ...(new Set(entries.map(word => word.chapter)).size === 1
    ? { chapter: entries[0].chapter }
    : {}),
  ...(new Set(entries.map(word => word.sourcePage)).size === 1
    ? { sourcePage: entries[0].sourcePage }
    : {}),
});
const sourceSort = (
  level: string,
  entries: CurriculumWord[],
  chapter?: number
): SortLevel | undefined => {
  const baskets = categoriesOf(entries)
    .filter(
      category => entries.filter(word => word.category === category).length >= 2
    )
    .slice(0, 3);
  if (baskets.length < 2) return undefined;
  const selected = roundRobin(
    baskets.map(category => entries.filter(word => word.category === category)),
    8
  );
  if (
    selected.length < 8 ||
    baskets.some(
      category => selected.filter(word => word.category === category).length < 2
    )
  )
    return undefined;
  return {
    id: `sort-${level.toLowerCase()}-pdf${chapter ? `-${chapter}` : ""}`,
    level,
    ...sourceMetadata(selected),
    title: chapter
      ? `${level} Chapter ${chapter}: category sort`
      : `${level}: textbook word groups`,
    baskets,
    words: selected.map(word => ({
      word: word.word,
      basket: baskets.indexOf(word.category),
    })),
  };
};
const sourceMemory = (
  level: string,
  entries: CurriculumWord[],
  chapter?: number
): MemoryLevel => {
  const selected = roundRobin(
    categoriesOf(entries).map(category =>
      entries.filter(word => word.category === category)
    ),
    8
  );
  return {
    id: `memory-${level.toLowerCase()}-pdf${chapter ? `-${chapter}` : ""}`,
    level,
    ...sourceMetadata(selected),
    title: chapter
      ? `${level} Chapter ${chapter}: word meanings`
      : `${level}: textbook meanings`,
    pairs: selected.map(word => ({
      word: word.word,
      meaning: word.definition,
    })),
  };
};
export const sortLevels: SortLevel[] = textbookLevels.map(level => {
  const result = sourceSort(
    level,
    uniqueEntries(curriculumWords.filter(word => word.level === level))
  );
  if (!result) throw new Error(`Insufficient source categories: ${level}`);
  return result;
});
export const memoryLevels: MemoryLevel[] = textbookLevels.map(level =>
  sourceMemory(
    level,
    uniqueEntries(curriculumWords.filter(word => word.level === level))
  )
);
for (const level of textbookLevels)
  for (let chapter = 1; chapter <= 6; chapter++) {
    const entries = uniqueEntries(
      curriculumWords.filter(
        word => word.level === level && word.chapter === chapter
      )
    );
    const sorting = sourceSort(level, entries, chapter);
    if (sorting) sortLevels.push(sorting);
    memoryLevels.push(sourceMemory(level, entries, chapter));
  }
// Versioned PDF level IDs deliberately do not reuse old card/word orders. Original
// IDs remain accepted privately, so retries of legacy runs still grade identically.
const questionAnswerKeys = new Map(
  [...legacyQuizQuestions, ...quizQuestions].map(question => [
    question.id,
    question,
  ])
);
const sortAnswerKeys = new Map(
  [...legacySortLevels, ...sortLevels].map(level => [level.id, level])
);
const memoryAnswerKeys = new Map(
  [...legacyMemoryLevels, ...memoryLevels].map(level => [level.id, level])
);
