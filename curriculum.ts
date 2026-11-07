/** Transcribed from the supplied teaching-focus tables and lexical lists.
 * Articles, British spellings and complete action phrases are intentional.
 * Slash alternatives and parenthetical aliases are separate searchable entries.
 * No runtime PDF parsing, database access or gameData dependency is required.
 */
export type CurriculumWord = {
  id: string;
  word: string;
  definition: string;
  category: string;
  level: string;
  chapter: number;
  sourcePage: number;
};
export type GrammarTarget = {
  level: string;
  chapter: number;
  topic: string;
  sourcePage: number;
};
export const curriculumSource = "merged.pdf";
export const curriculumWords: CurriculumWord[] = [];
export const grammarTargets: GrammarTarget[] = [];
const fingerprint = (text: string) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
};
/** Compact, explicit source transcription: word~child-friendly clue. */
const words = (
  level: string,
  chapter: number,
  sourcePage: number,
  category: string,
  entries: string
) => {
  for (const entry of entries
    .split("|")
    .map(x => x.trim())
    .filter(Boolean)) {
    const [word, definition] = entry.split("~");
    if (!word || !definition)
      throw new Error(`Missing curriculum clue: ${entry}`);
    curriculumWords.push({
      id: `pdf-${level.toLowerCase()}-${chapter}-${fingerprint(category + ":" + word)}`,
      word,
      definition,
      category,
      level,
      chapter,
      sourcePage,
    });
  }
};
const targets = (
  sourcePage: number,
  topic: string,
  allocations: Record<string, string>
) => {
  for (const [level, chapters] of Object.entries(allocations)) {
    for (const range of chapters.split(",")) {
      const [start, end = start] = range.split("-").map(Number);
      for (let chapter = start; chapter <= end; chapter++)
        grammarTargets.push({ level, chapter, topic, sourcePage });
    }
  }
};
// Pages 1–2: KS1. Each allocation was checked against the visible column grid.
targets(1, "Simple present", {
  "2A": "4-6",
  "2B": "1-6",
  "3A": "1,3,4",
  "3B": "5-6",
});
targets(1, "Present continuous", { "1B": "5-6" });
targets(1, "Simple past", { "3B": "1-4" });
targets(1, "Be", {
  "1A": "1-2",
  "1B": "1",
  "2A": "3",
  "2B": "6",
  "3A": "1",
  "3B": "1",
});
targets(1, "Imperatives", { "1A": "3" });
targets(1, "Have / has (possession)", { "1A": "4", "1B": "2,4" });
targets(1, "Let's", { "2A": "3" });
targets(1, "To-infinitive", { "3A": "5" });
targets(1, "Too (similar feelings / opinions)", { "2A": "3" });
targets(1, "Usually", { "2B": "6" });
targets(1, "First / then / next / finally", { "3A": "5" });
targets(1, "Last … / … ago", { "3B": "1" });
targets(1, "Once upon a time / one day / suddenly / in the end", { "3B": "4" });
targets(1, "How", { "2A": "5" });
targets(1, "How old", { "1A": "1" });
targets(1, "How many", { "1B": "4" });
targets(1, "How much", { "3A": "3" });
targets(1, "What", {
  "1A": "1",
  "1B": "3,5-6",
  "2B": "3,5",
  "3A": "6",
  "3B": "2-3",
});
targets(1, "What colour", { "1A": "5" });
targets(1, "What time", { "2B": "4" });
targets(1, "Where", { "1B": "5", "2A": "1,5", "3A": "6" });
targets(1, "When", { "3A": "2" });
targets(1, "Is there / Are there / Are you", { "2A": "1,3", "3A": "4" });
targets(1, "Do you / Does he / Does she", { "2A": "4,6", "2B": "1" });
targets(1, "Did you", { "3B": "2" });
targets(1, "Why", { "2B": "5" });
targets(1, "Which", { "2B": "6", "3A": "6" });
targets(1, "Who", { "1B": "2" });
targets(2, "Can", { "1B": "3", "3A": "1,3" });
targets(2, "Must", { "2A": "2" });
targets(2, "Singular and plural", { "1A": "4,6", "1B": "1-4", "2A": "4" });
targets(2, "Countable and uncountable nouns", { "1B": "2", "3A": "4" });
targets(2, "Quantifiers", { "3A": "3" });
targets(2, "Subject pronouns", { "1A": "2,4", "1B": "1-2,4" });
targets(2, "Object pronouns", { "3B": "3,6" });
targets(2, "This and that", { "1A": "1" });
targets(2, "There is / There are", { "1B": "4", "2A": "1", "3A": "4" });
targets(2, "Possessive adjectives: my / your", { "1A": "1" });
targets(2, "Possessive adjectives: her / his / our / their", {
  "1A": "6",
  "3B": "3",
});
targets(2, "And", { "1A": "5", "2A": "6", "3A": "1", "3B": "4" });
targets(2, "Because", { "2A": "4", "2B": "5", "3B": "4" });
targets(2, "But", { "3A": "1", "3B": "4" });
targets(2, "Or", { "2A": "6", "3A": "1,6" });
targets(2, "So", { "3B": "2,4" });
targets(2, "Articles: a / an / the", { "1A": "4-5", "1B": "2-3" });
targets(2, "Determiners: this / that / these / those", { "1B": "1" });
targets(2, "Some / any / a lot of", { "1B": "3", "2A": "6", "3A": "4" });
targets(2, "Place prepositions: in / on / under / near / at / to", {
  "1B": "3,5-6",
  "2A": "1-2,5",
});
targets(2, "By bus / on foot", { "2A": "5" });
targets(2, "At / in (times / festivals / seasons)", { "2B": "4-6" });
targets(2, "On / from / to (dates / days)", {
  "2B": "3",
  "3A": "2",
  "3B": "3",
});
targets(2, "Between / in front of / behind / next to / on my …", { "3B": "5" });
targets(2, "Good at", { "3A": "1", "3B": "5" });
targets(2, "Listen to / play with", { "3B": "6" });
targets(2, "Gerunds", { "2B": "5", "3B": "5" });
// Pages 3–4: KS2. Empty cells do not imply a taught target.
targets(3, "Simple present", { "4A": "1", "5B": "4", "6A": "1", "6B": "1" });
targets(3, "Simple past", {
  "4A": "5-6",
  "5A": "6",
  "5B": "1-2,5-6",
  "6B": "2",
});
targets(3, "Future tense", { "4B": "1,6", "6A": "1" });
targets(3, "Going to", { "4B": "6" });
targets(3, "Present perfect", { "5A": "5-6", "5B": "1-2" });
targets(3, "Past continuous", { "5B": "5-6" });
targets(3, "Imperatives", { "5B": "3" });
targets(3, "Indirect speech", { "5B": "1" });
targets(3, "Passive voice", { "6B": "1-2" });
targets(3, "Phrasal verbs", { "6A": "6" });
targets(3, "To-infinitive", { "5B": "1,3", "6A": "1,3", "6B": "6" });
targets(3, "Adverbs of manner", { "5A": "1" });
targets(3, "Already / just / yet", { "5A": "5" });
targets(3, "Always / often / sometimes / seldom / never", { "4A": "1" });
targets(3, "Either (also not)", { "4A": "2" });
targets(3, "Ago", { "5B": "2" });
targets(3, "Once / twice / never / ever", { "4B": "5", "5A": "6" });
targets(
  3,
  "Once upon a time / soon / after a while / at last / suddenly / however / in the end",
  { "6A": "6" }
);
targets(3, "So / very / really / a bit / a little", { "5A": "2" });
targets(3, "Too (degree)", { "6A": "3" });
targets(3, "Too (link positive ideas)", { "4A": "2" });
targets(3, "Comparative adjectives", { "4A": "3-4" });
targets(3, "Superlative adjectives", { "4A": "3-4" });
targets(3, "-ed / -ing adjectives", { "6A": "5" });
targets(3, "Could (past abilities)", { "4A": "5" });
targets(3, "Need to (be)", { "4B": "3", "6A": "2" });
targets(3, "Ought to", { "4B": "5" });
targets(3, "Shall (suggestion)", { "6A": "4" });
targets(3, "Should (obligation and prohibition)", { "5A": "1" });
targets(3, "Would", { "4A": "4" });
targets(3, "How", { "4B": "2" });
targets(3, "How far", { "5B": "4" });
targets(3, "How long (time period)", { "5B": "2,4" });
targets(3, "How many times", { "5A": "6" });
targets(3, "How often", { "4B": "5" });
targets(3, "Which", { "4A": "4" });
targets(3, "What", { "5B": "1" });
targets(3, "Where", { "4B": "2" });
targets(3, "Whose", { "5A": "4" });
targets(4, "Object pronouns", { "5B": "1" });
targets(4, "Possessive pronouns", { "5A": "4" });
targets(4, "Reflexive pronouns", { "4A": "6", "6B": "5" });
targets(4, "Relative pronouns: who / where / which / where", {
  "5A": "3",
  "6A": "5",
  "6B": "2",
});
targets(4, "Nobody / everybody / anybody / anything", { "4A": "5", "5B": "6" });
targets(4, "Countable and uncountable nouns", { "4B": "3-4", "6B": "3" });
targets(4, "Quantifiers", { "4B": "4" });
targets(4, "Although", { "5B": "4" });
targets(4, "Because", { "6A": "1" });
targets(4, "Before / after / until", { "5B": "3" });
targets(4, "But", { "5B": "4" });
targets(4, "Either … or / neither … nor", { "6A": "4" });
targets(4, "First / next / then / after that / finally", { "5B": "3" });
targets(4, "If (conditions)", { "6A": "1,5" });
targets(4, "Or", { "4A": "2,4" });
targets(4, "Since (reason)", { "6A": "3" });
targets(4, "So", { "4B": "6", "6A": "2" });
targets(4, "So that", { "6A": "2" });
targets(4, "Therefore", { "6B": "4" });
targets(4, "Unless", { "6B": "4" });
targets(4, "When / while", { "4A": "6", "5B": "5-6" });
targets(4, "A few / a lot of / a little", { "4B": "3" });
targets(4, "Both … and", { "4A": "2" });
targets(4, "More / less / fewer", { "4B": "3" });
targets(4, "So much / so many", { "6B": "3" });
targets(4, "Such as", { "4B": "4", "6B": "2" });
targets(4, "Too much / too many", { "4B": "4" });
targets(4, "As … as / like (similes)", { "6A": "6" });
targets(4, "At / in (times)", { "5B": "2", "6B": "1" });
targets(4, "At / on (festivals)", { "6B": "1" });
targets(4, "Famous for", { "6B": "2" });
targets(
  4,
  "Directions: go out of / go / walk straight ahead / walk across / turn left / right into / on your left / right / next to / opposite",
  { "4B": "2" }
);
targets(4, "Made of / used for", { "5B": "3" });
targets(4, "Pleased with / proud of / upset about", { "6B": "5" });
targets(4, "Quarrel with / lie to / be jealous of", { "5A": "2" });
targets(4, "Since / for (duration)", { "5B": "2" });
targets(4, "With (body parts / accessories) / in (clothing)", { "5A": "3" });
targets(4, "Thank you for / Sorry for", { "6B": "6" });
targets(4, "Gerunds", { "4A": "1", "5B": "4", "6B": "3,5-6" });

// Page 5 — 1A
words(
  "1A",
  1,
  5,
  "Family",
  `brother~a boy who has the same parents as you|mother~a female parent|father~a male parent|sister~a girl who has the same parents as you`
);
words(
  "1A",
  2,
  5,
  "People at school",
  `a class teacher~the adult responsible for your class|a student~a person learning at school|a friend~someone you like and spend time with|a group leader~the person guiding a small team|an English teacher~an adult who teaches the language used in this game|a classmate~someone in the same class as you`
);
words(
  "1A",
  2,
  5,
  "Places",
  `a classroom~a room where pupils have lessons|a school~a place where children learn together`
);
words(
  "1A",
  3,
  5,
  "Things we see at school",
  `a window~an opening with glass that lets light into a room|a computer~an electronic machine for working with information|a blackboard~a dark surface for writing with chalk|a whiteboard~a pale surface for writing with special markers|a door~the part you open to enter a room|a desk~a table used for schoolwork|a chair~a seat with a back for one person`
);
words(
  "1A",
  3,
  5,
  "Actions",
  `sit~to rest on a chair or the ground|stand~to be upright on your feet|open~to move a lid or door so you can get inside|close~to shut a door or lid|look~to direct your eyes towards something|point~to show something with your finger`
);
words(
  "1A",
  4,
  5,
  "Stationery",
  `a ruler~a straight tool for measuring length|a school bag~a container carried to lessons with books inside|a pen~a tool for writing with ink|a pencil~a writing tool with a grey centre that can be erased|a pencil case~a small container for writing tools|an eraser~a small object that rubs out grey writing|a book~pages joined together with words or pictures`
);
words(
  "1A",
  5,
  5,
  "Toys",
  `a train~a toy vehicle with carriages that runs on tracks|a teddy bear~a soft toy shaped like a furry forest animal|a car~a small model road vehicle with four wheels|a plane~a toy vehicle with wings for flying|an aeroplane~a toy flying vehicle with wings|a robot~a toy machine shaped like a person|a doll~a toy shaped like a baby or person|a ball~a round object for throwing and kicking|a gun~a toy shaped like a weapon that fires bullets`
);
words(
  "1A",
  5,
  5,
  "Colours",
  `red~the colour of ripe strawberries|orange~the colour made by mixing red and yellow|yellow~the colour of a ripe lemon|green~the colour of fresh grass|blue~the colour of a clear daytime sky|purple~the colour made by mixing red and blue|pink~a pale colour made from red and white|white~the colour of fresh snow|black~the darkest colour with no light|brown~the colour of chocolate or tree bark`
);
words(
  "1A",
  6,
  5,
  "Clothes",
  `a blouse~a light upper-body garment often worn by women|a shirt~an upper-body garment often with a collar and buttons|a skirt~clothing hanging from the waist without separate legs|a dress~a one-piece garment covering the body and legs|a T-shirt~a casual short-sleeved top without a collar|a jacket~a short outer layer worn over a top|a hat~a covering worn on the head|shorts~clothing for the legs that ends above the knees|trousers~clothing with two long separate legs|socks~soft coverings worn inside footwear|shoes~outer coverings worn on the feet`
);
// Page 6 — 1B
words(
  "1B",
  1,
  6,
  "Farm animals and pets",
  `a cow~a large farm animal that gives milk|a horse~a large animal people can ride|a pig~a farm animal with a round snout|a rabbit~a small animal with long ears that hops|a turtle~an animal with a hard shell on its back|a cat~a small pet that meows|a dog~a pet that barks|a hamster~a small furry pet with cheek pouches`
);
words(
  "1B",
  1,
  6,
  "Adjectives",
  `thin~having little width or body fat|fat~having a lot of body fat|big~large in size|small~little in size`
);
words(
  "1B",
  2,
  6,
  "Body parts",
  `an arm~the upper limb from shoulder to hand|arms~the two upper limbs used to reach and carry|a hand~the body part with fingers|hands~the two body parts with fingers|a leg~the limb used for standing and walking|legs~the two limbs used for walking|a foot~the body part at the end of a leg|feet~the two body parts you stand on|an eye~the organ you use to see|eyes~the two organs you use to see|a nose~the part of your face used to smell|hair~the strands growing from the skin of your head|a mouth~the opening used for eating and speaking|an ear~the organ used for hearing|ears~the two organs used for hearing`
);
words(
  "1B",
  2,
  6,
  "Body adjectives",
  `tall~having a large height|short~having little height or length|short hair~strands on the head cut to little length|long hair~strands on the head extending far down`
);
words(
  "1B",
  3,
  6,
  "Things in the park",
  `the sky~the space above us where clouds appear|a tree~a tall plant with a woody trunk|the grass~short green plants covering the ground|a flower~the colourful part of a plant|a bench~a long seat for several people|a swing~a hanging seat that moves back and forth|a slide~a smooth slope children go down|a see-saw~a playground board with seats that go up and down|a pond~a small area of still water|an ant~a tiny insect that lives in a colony|a bee~a flying insect that makes honey|a butterfly~an insect with large colourful wings|a bird~an animal with feathers and a beak`
);
words(
  "1B",
  4,
  6,
  "Zoo animals",
  `a zebra~an animal with black and white stripes|a monkey~a tree-climbing animal with hands and usually a tail|a tiger~a large wild cat with dark stripes|a giraffe~an animal with a very long neck|a lion~a large wild cat whose male has a mane|a panda~a black-and-white animal that eats bamboo|a hippo~a huge animal that spends much time in rivers|an elephant~a huge animal with a trunk`
);
words(
  "1B",
  4,
  6,
  "Body parts",
  `a tail~the body part sticking out behind an animal|fur~the thick soft hair covering an animal|a neck~the part joining the head and body|wings~body parts that birds use to fly`
);
words(
  "1B",
  5,
  6,
  "Places at home",
  `bedroom~a room for sleeping|bathroom~a room for washing your body|living room~a room for relaxing with the family|dining room~a room for eating meals|kitchen~a room for preparing food`
);
words(
  "1B",
  5,
  6,
  "Home activities",
  `talk~to say words to another person|sleep~to rest with your eyes closed|read~to understand written words|draw~to make a picture with a pen or pencil|sing~to make music with your voice|wash~to clean with water|laugh~to make a happy sound when something is funny|play~to enjoy a game|drink~to take liquid into your mouth|eat~to take food into your mouth|cook~to prepare food with heat`
);
words(
  "1B",
  6,
  6,
  "Fun places",
  `pool~a man-made place filled with water for exercise|hill~an area of land rising above the ground nearby|rink~a smooth area of ice for skating`
);
words(
  "1B",
  6,
  6,
  "Fun activities",
  `swim~to move through water using arms and legs|hike~to walk a long way in the countryside|ice-skate~to glide on frozen water with special boots|make a model~to build a small copy of an object|ride a bicycle~to travel on a two-wheeled pedal vehicle|dance~to move your body to music|run~to move quickly on your feet|skip~to jump repeatedly over a rope`
);
// Page 7 — 2A. Both sides of place–activity and job–duty pairs are retained.
words(
  "2A",
  1,
  7,
  "Places at school",
  `a classroom~a room where a class learns|a music room~a school room for practising songs and instruments|a computer room~a room with electronic machines for lessons|an art room~a room for creative painting and drawing lessons|a library~a place to borrow books|toilets~rooms with facilities for going to the bathroom|a lift~a machine carrying people between floors|a playground~an outdoor area where pupils play|a tuck shop~a small school shop selling snacks|a garden~an area where flowers and other plants grow`
);
words(
  "2A",
  1,
  7,
  "School activities",
  `have lessons~to attend teaching sessions|sing~to make musical sounds with your voice|use the computers~to work on electronic information machines|paint pictures~to create images with brushes and colours|borrow books~to take reading material temporarily and return it|wash hands~to clean your fingers and palms with water|play games~to take part in enjoyable activities with rules|buy snacks~to pay for small amounts of food|plant flowers~to put colourful plants into soil to grow`
);
words(
  "2A",
  2,
  7,
  "Things we must and mustn't do",
  `sit still~to stay seated without moving around|line up~to stand one behind another|keep quiet~to avoid making noise|wait for your turn~to be patient until it is your time|keep off the grass~to avoid stepping on the green lawn|spit~to send saliva out of your mouth|litter~to leave rubbish in a public place|pick the flowers~to remove blossoms from growing plants|climb~to move upwards using hands and feet`
);
words(
  "2A",
  3,
  7,
  "Activities",
  `watch a cartoon~to look at an animated programme|read comics~to follow stories told in panels of drawings|take a rest~to stop working and relax|drink some milk~to have some white liquid produced by cows|drink some juice~to have some liquid squeezed from fruit|drink some water~to have some clear liquid your body needs|eat some biscuits~to have small crisp baked snacks|eat some bread~to have food baked from flour dough|eat some cakes~to have sweet baked treats`
);
words(
  "2A",
  3,
  7,
  "Feelings",
  `tired~needing sleep or a rest|bored~not interested in what is happening|hungry~wanting food|thirsty~wanting a drink`
);
words(
  "2A",
  4,
  7,
  "Food",
  `eggs~shell-covered foods laid by birds|bananas~long curved fruits with yellow skins|pears~fruits with narrow tops and wider bottoms|sandwiches~fillings placed between pieces of bread|potatoes~starchy vegetables growing under the soil|mangoes~tropical fruits with orange flesh and a large stone|peaches~soft fruits with fuzzy skins|tomatoes~red juicy fruits often used as vegetables|strawberries~small red fruits with seeds on the outside|cherries~small round red fruits with stones inside`
);
words(
  "2A",
  4,
  7,
  "Food adjectives",
  `sweet~tasting like sugar|sour~having a sharp taste like lemon|juicy~containing plenty of liquid|soft~easy to press or bend|hard~firm and difficult to press or bend`
);
words(
  "2A",
  5,
  7,
  "Going to school",
  `on foot~travelling by walking|walk~to travel by taking steps|by school bus~travelling on a vehicle specially for pupils|by taxi~travelling in a hired car with a driver|by car~travelling in a private four-wheeled vehicle|by minibus~travelling on a small passenger vehicle|by bus~travelling on a large road vehicle with passengers|by tram~travelling on a street vehicle running on rails|by ferry~travelling on a passenger boat|by MTR~travelling on Hong Kong's railway network|by train~travelling in carriages on railway tracks|by Light Rail~travelling on the rail network in the northwestern New Territories`
);
words(
  "2A",
  6,
  7,
  "Jobs",
  `a postman~a person delivering letters|a policeman~a male officer who helps keep people safe|a policewoman~a female officer who helps keep people safe|a fireman~a person who puts out fires|a nurse~a person caring for sick people|a doctor~a person treating illnesses|a waitress~a woman serving meals to customers|a waiter~a man serving meals to customers|a housewife~a woman managing the home and family|a teacher~a person helping children learn|a taxi driver~a person driving a hired passenger car|a bus driver~a person driving a large passenger vehicle`
);
words(
  "2A",
  6,
  7,
  "Job duties",
  `bring letters to people~to deliver written messages to homes|catch bad people~to stop people who break the law|put out fires~to stop dangerous flames burning|look after sick people~to care for people who are unwell|help sick people~to treat people who are unwell|serve food to people~to bring meals to customers|look after the family~to care for people in the home|teach children~to help young people learn|drive a taxi~to operate a hired car for passengers|drive a bus~to operate a large road passenger vehicle`
);
// Page 8 — 2B
words(
  "2B",
  1,
  8,
  "Housework",
  `hang up the washing~to put wet laundry on a line to dry|fold the clothes~to bend garments neatly for storage|mop the floor~to clean the ground indoors with a wet cleaning tool|make the bed~to arrange pillows and covers neatly|water the plants~to give growing flowers and leaves a drink|sweep the floor~to clean the ground indoors with a broom|set the table~to put plates and cutlery out for a meal|clear the table~to remove things after a meal|wash the dishes~to clean plates and bowls with water|dry the dishes~to remove water from plates and bowls|walk the dog~to take a barking pet out for exercise|feed the dog~to give a barking pet its food`
);
words(
  "2B",
  2,
  8,
  "Adjectives",
  `untidy~messy and not well arranged|tidy~neat and well arranged|honest~telling the truth and not cheating|helpful~willing to assist other people|rude~showing bad manners|polite~showing good manners|hard-working~putting much effort into tasks|lazy~unwilling to work or make an effort`
);
words(
  "2B",
  2,
  8,
  "Actions",
  `study~to spend time learning a subject|tidy the room~to put things in their proper places indoors|push others~to press against people and move them|tell lies~to say things you know are untrue`
);
words(
  "2B",
  3,
  8,
  "After-class activities",
  `have piano lessons~to learn to play a large keyboard instrument|have ballet lessons~to learn a formal style of dance|study with my tutor~to learn with a private teacher|go to school choir practice~to rehearse songs with other pupils|go to Brownies~to attend a young girls' guiding group|go to Scouts~to attend a youth group learning outdoor skills|visit my grandparents~to spend time with my parents' parents|go to church~to attend a Christian place of worship`
);
words(
  "2B",
  3,
  8,
  "School clubs",
  `Drama Club~a school group practising acting|Science Club~a school group exploring experiments and nature|Art Club~a school group making creative pictures and objects|Cooking Club~a school group learning to prepare food`
);
words(
  "2B",
  4,
  8,
  "Daily routine",
  `get up~to leave your bed after sleeping|brush my teeth~to clean the hard white parts in my mouth|wash my face~to clean the front of my head with water|have breakfast~to eat the first meal of the day|go to school~to travel to the place where I learn|have lunch~to eat the midday meal|do my homework~to finish learning tasks assigned for home|have dinner~to eat the main evening meal|have a bath~to wash my body sitting in a tub|have a shower~to wash my body under falling water|go to bed~to lie down ready to sleep`
);
words(
  "2B",
  5,
  8,
  "Festivals",
  `Chinese New Year~a celebration beginning a new year in the Chinese calendar|Easter~a Christian festival often celebrated with chocolate eggs|Dragon Boat Festival~a festival with racing boats and rice dumplings|Mid-Autumn Festival~a festival with moon viewing and lanterns|Christmas~a Christian festival celebrated on 25 December`
);
words(
  "2B",
  5,
  8,
  "Celebrations",
  `go to the flower market~to visit stalls selling colourful plants|watch fireworks~to look at bright explosions in the night sky|visit relatives~to spend time with members of your wider family|get red packets~to receive festive envelopes containing money|eat chocolate eggs~to enjoy cocoa sweets shaped like oval shells|watch dragon boat races~to view competitions between long decorated rowing boats|eat rice dumplings~to enjoy wrapped sticky-grain parcels|play with lanterns~to enjoy decorative lights in paper cases|eat moon cakes~to enjoy round filled pastries at a lunar festival|give presents~to hand gifts to other people|get presents~to receive gifts from other people|look at the Christmas lights~to view decorations shining during the December festival`
);
words(
  "2B",
  6,
  8,
  "Seasons",
  `spring~the season after winter when many plants begin growing|summer~the hottest season of the year|autumn~the season when many leaves fall|winter~the coldest season of the year`
);
words(
  "2B",
  6,
  8,
  "Weather",
  `wet~covered with water or having much rain|foggy~with thick mist making it hard to see|warm~pleasantly hot but not too hot|sunny~with bright light from the sun|hot~having a high temperature|cool~slightly cold|windy~with much moving air|cold~having a low temperature|dry~without much water or rain`
);
words(
  "2B",
  6,
  8,
  "Seasonal activities",
  `go to the park~to visit a public green space|go to the beach~to visit the sandy land beside the sea|go hiking~to walk a long way in the countryside|eat hotpot~to cook food in a shared pot of boiling broth`
);
words(
  "2B",
  6,
  8,
  "Clothing items and things",
  `a cap~a soft head covering with a peak|a vest~a sleeveless top|an umbrella~a folding cover held over your head in rain|a raincoat~an outer garment keeping rain off your clothes|boots~footwear covering the ankles or more of the legs|a sweater~a warm knitted upper-body garment|a scarf~a long piece of cloth worn around the neck|gloves~hand coverings with separate spaces for fingers|a coat~a long outer garment for warmth`
);
// Page 9 — 3A
words(
  "3A",
  1,
  9,
  "Sports, music and board games",
  `play football~to kick a ball towards a goal in a team game|play table tennis~to hit a small ball across a net on a table|play basketball~to throw a ball through a high hoop|play badminton~to hit a shuttlecock over a net|play the violin~to make music with a small string instrument and bow|play the recorder~to make music by blowing into a simple tube instrument|play the piano~to make music on a large keyboard instrument|play the guitar~to make music by plucking strings on a wooden instrument|play Chinese checkers~to move pieces across a star-shaped board|play Chinese chess~to move pieces in a traditional strategy game with a general`
);
words(
  "3A",
  2,
  9,
  "School events",
  `Sports Day~a school occasion with athletic competitions|the school picnic~a class outing with food eaten outdoors|Exam Week~a period of major school assessments|Parents’ Day~an occasion for families to meet class teachers|Test Week~a period of shorter school assessments|Open Day~an occasion when visitors can explore the school|English Camp~a group stay with games to practise a language`
);
words(
  "3A",
  2,
  9,
  "School event activities",
  `run in races~to compete to reach a finish line on foot|cheer for friends~to shout encouragement to people you like|win medals~to earn metal awards for success|play hide-and-seek~to enjoy a game where players find hidden people|sit on a mat and share snacks~to rest on a ground covering and eat treats together|have exams~to take major assessments of learning|class teachers meet parents~the adults teaching classes talk with pupils' families|have tests~to take short assessments of learning|welcome guests~to greet visitors warmly|play games and learn English~to practise a language through enjoyable activities|perform English dramas~to act in plays using the language of this game`
);
words(
  "3A",
  3,
  9,
  "Food and drinks",
  `a bottle of water~clear drinking liquid in a narrow-necked container|a cup of lemon tea~a hot leaf-based drink flavoured with sour citrus|a cup of coffee~a hot drink made from roasted beans|a cup of hot chocolate~a warm sweet drink made with cocoa|a can of cola~a fizzy brown drink in a metal container|a slice of pizza~a wedge of baked dough topped with cheese and sauce|a hot dog~a sausage served in a long bread roll|a packet of French fries~a bag of thin fried potato strips|a packet of potato chips~a bag of crisp thin potato slices|a hamburger~a meat patty inside a round bread bun|a bowl of corn~yellow grains served in a round deep dish|an apple pie~a pastry filled with sweet orchard fruit|a slice of cake~a cut portion of a sweet baked dessert|a box of chicken wings~a container of cooked bird limbs`
);
words(
  "3A",
  4,
  9,
  "Food (uncountable)",
  `ham~meat from a pig's leg often served in slices|cheese~a solid food made from milk|butter~a soft yellow spread made from cream|rice~small grains cooked as a staple food|congee~a soft porridge made by cooking grains in much water|soup~a liquid dish with vegetables or meat|sugar~sweet crystals used in cooking|salt~white crystals used to season food|jam~a sweet spread made from boiled fruit`
);
words(
  "3A",
  4,
  9,
  "Food (countable)",
  `mushrooms~fungi with stems and umbrella-shaped tops used as food|onions~layered vegetables that may make your eyes water|sausages~seasoned meat in long thin casings|vegetables~edible plants served with meals|noodles~long thin strips of dough cooked in water`
);
words(
  "3A",
  5,
  9,
  "Outdoor activities",
  `plant vegetables~to put edible plants into soil to grow|pick fruit~to take ripe produce from trees or plants|feed animals~to give food to living creatures|ride a horse~to sit on a large animal while it carries you|build a sandcastle~to shape beach grains into a tiny fortress|look at shells~to examine hard coverings from sea creatures|go swimming~to exercise by moving through water|take photos~to capture images with a camera|have a picnic~to eat a meal outdoors|go camping~to stay outdoors overnight in a tent|have a barbecue~to cook and eat food over an outdoor grill`
);
words(
  "3A",
  6,
  9,
  "Shopping centre places",
  `cafe~a place selling light meals and drinks|restaurant~a place where customers pay for cooked meals|hotel~a building where travellers pay to stay|cinema~a place with a large screen for films|book shop~a store selling reading material|sweet shop~a store selling sugary treats|gift shop~a store selling things to give as presents|sportswear shop~a store selling clothing for exercise|clothes shop~a store selling garments`
);
words(
  "3A",
  6,
  9,
  "Shopping centre activities",
  `have afternoon tea~to enjoy a light meal and hot drink later in the day|eat dim sum~to enjoy small Cantonese dishes|have a buffet lunch~to eat a midday meal choosing from many displayed dishes|watch a film~to view a story shown on a screen|buy a comic~to pay for a story told in panels of drawings|buy sweets and chocolate~to pay for sugary treats and cocoa snacks|buy a card~to pay for a folded greeting message|buy trainers~to pay for shoes used for exercise|buy jeans~to pay for denim trousers`
);
// Page 10 — 3B
words(
  "3B",
  1,
  10,
  "Adjectives to describe people",
  `weak~not having much strength|strong~having great physical power|naughty~behaving badly instead of following rules|good~behaving well and kindly|careless~not paying enough attention|careful~taking care to avoid mistakes|shy~nervous about meeting or speaking to people|outgoing~friendly and enjoying meeting people`
);
words(
  "3B",
  2,
  10,
  "After-school activities",
  `listen to music~to enjoy songs and tunes with your ears|watch online videos~to view moving images on the internet|play mobile games~to enjoy interactive activities on a phone|chat with friends~to talk casually with people you like|study for exams~to prepare for major school assessments|study for tests~to prepare for short school assessments|practise the piano~to improve your skill on a keyboard instrument|play card games~to enjoy activities using a deck of printed rectangles|play board games~to enjoy games using pieces on a flat playing surface`
);
words(
  "3B",
  2,
  10,
  "Adjectives",
  `sick~unwell or ill|lonely~sad because you have no company|busy~having many things to do|free~not occupied with work or other tasks`
);
words(
  "3B",
  3,
  10,
  "Birthday celebrations",
  `make a wish~to think of something you hope will happen|cut the cake~to divide a sweet baked dessert into portions|sing ‘Happy Birthday’~to perform a song celebrating someone's special day|blow out the candles~to put out small flames with your breath|give presents~to hand gifts to other people|watch a clown show~to view a performance by a funny costumed entertainer|watch a magic show~to view tricks that seem impossible`
);
words(
  "3B",
  3,
  10,
  "Gifts",
  `a belt~a strip worn around the waist|a tie~a long narrow piece worn around a shirt collar|a watch~a small time-telling device worn on the wrist|a towel~a piece of cloth for drying your body|a purse~a small bag for money|a wallet~a folding holder for money and cards|a handbag~a bag carried for personal belongings|a mug~a drinking cup with a handle|a key ring~a loop holding tools used to unlock doors`
);
words(
  "3B",
  4,
  10,
  "Adjectives to describe people",
  `foolish~making unwise decisions|clever~quick to learn and understand|poor~having little money|rich~having much money|ugly~unpleasant to look at|beautiful~very pleasant to look at|brave~ready to face danger despite fear|timid~easily frightened and lacking confidence`
);
words(
  "3B",
  4,
  10,
  "Action verbs",
  `appear~to become visible|disappear~to stop being visible|arrive~to reach a place|leave~to go away from a place|drop~to let something fall|find~to discover where something is`
);
words(
  "3B",
  5,
  10,
  "Subjects",
  `English~a language subject used in this game|Chinese~a language subject using characters such as 人|Maths~the study of numbers and calculations|General Studies~a subject about society and the world around us|Computer Studies~a subject about digital machines and their use|PE~a subject involving exercise and sports|Music~a subject about songs and instruments|Putonghua~the standard spoken language of China|Visual Arts~a subject about creating pictures and objects`
);
words(
  "3B",
  5,
  10,
  "Subject activities",
  `speak on stage~to address an audience from a raised platform|recite poems~to say verses from memory|do sums~to calculate with numbers|do projects~to complete extended pieces of schoolwork|use the computer~to work with an electronic information machine|play ball games~to enjoy sports using round objects|sing songs~to perform tunes with your voice|speak Putonghua~to talk in the standard spoken language of China|draw pictures~to create images with a pencil or pen|paint pictures~to create images with brushes and colours`
);
words(
  "3B",
  6,
  10,
  "Actions",
  `play with~to enjoy an activity together with someone|look after~to take care of someone or something|talk to~to speak to another person|listen to~to pay attention with your ears|fight with~to attack or struggle against someone|argue with~to disagree angrily with someone|shout at~to speak angrily and loudly to someone|play tricks on~to fool someone as a joke|laugh at~to make fun of someone`
);
// Page 11 — 4A
words(
  "4A",
  1,
  11,
  "After-school activities",
  `go rock climbing~to scale steep stone surfaces as a sport|go jogging~to run gently for exercise|go cycling~to travel for exercise on a pedal vehicle|go ice-skating~to glide on frozen water with special boots|go to an indoor playground~to visit a covered play area|go to a public library~to visit a community place for borrowing books|play tennis~to hit a ball across a net on a court|play volleyball~to hit a ball over a high net with your hands|play online games~to enjoy interactive activities over the internet|play video games~to enjoy electronic interactive activities|text my friend~to send a written phone message to someone I like|read the newspaper~to look through printed reports of recent events|read magazines~to look through regularly published booklets of articles`
);
words(
  "4A",
  2,
  11,
  "Shows",
  `the news~a programme reporting recent events|the weather report~a programme predicting rain and temperature|a drama~a programme telling a story through acting|a game show~a programme where contestants compete for prizes|a pop music show~a programme featuring popular songs|a documentary~a programme giving facts about a real subject|a sports show~a programme featuring athletic competitions|a cartoon~a programme using animated drawings|a cooking show~a programme demonstrating how to prepare meals|a travel show~a programme exploring different places`
);
words(
  "4A",
  2,
  11,
  "Adjectives about shows (positive)",
  `informative~giving useful facts|exciting~making you feel eager and thrilled|interesting~holding your attention|touching~making you feel sympathy or affection`
);
words(
  "4A",
  2,
  11,
  "Adjectives about shows (negative)",
  `boring~not holding your interest|silly~foolish or not sensible`
);
words(
  "4A",
  3,
  11,
  "Food and drinks",
  `a carton of soya milk~a paper container of drink made from soybeans|a tin of sausages~a metal container of long seasoned meat pieces|a tin of nuts~a metal container of hard-shelled edible seeds|a packet of raisins~a bag of dried grapes|a packet of seaweed~a bag of edible plants from the sea|a bar of chocolate~a solid rectangular cocoa sweet|a jar of honey~a glass container of sweet liquid made by bees|a jar of peanut butter~a glass container of spread made from crushed groundnuts|a loaf of bread~one whole baked shape of flour dough|a bunch of bananas~a group of curved yellow fruits joined at their stems|a bunch of grapes~a group of small round fruits attached to one stem`
);
words(
  "4A",
  3,
  11,
  "Opposite adjectives",
  `cheap~costing little money|expensive~costing much money|light~having little weight|heavy~having much weight|healthy~good for the body|unhealthy~bad for the body|popular~liked by many people|unpopular~not liked by many people|delicious~very pleasant to taste|disgusting~very unpleasant and making you feel sick`
);
words(
  "4A",
  4,
  11,
  "Dishes",
  `noodles with pork chop~long dough strips served with a cut of pig meat|noodles with dumplings~long dough strips served with filled dough parcels|tuna salad~a cold mixed dish containing a large sea fish|prawn salad~a cold mixed dish containing small shellfish|macaroni with mushrooms~curved pasta tubes served with edible fungi|spaghetti with meat sauce~long thin pasta served with a savoury animal-protein topping|beef curry~cow meat cooked in a spiced sauce|chicken curry~poultry cooked in a spiced sauce|mango pudding~a soft dessert flavoured with tropical orange fruit|blueberry cheesecake~a creamy dessert flavoured with small blue fruits`
);
words(
  "4A",
  4,
  11,
  "Adjectives about food",
  `sweet~tasting like sugar|sour~having a sharp taste like lemon|bitter~having a sharp taste like unsweetened cocoa|spicy~having a hot peppery flavour|oily~containing much grease|bland~having very little flavour`
);
words(
  "4A",
  5,
  11,
  "Things people use and do now",
  `use smartphones~to work with mobile phones that run apps|use electronic money~to pay digitally instead of using coins and notes|live on housing estates~to have a home in a group of residential buildings|drive electric cars~to operate road vehicles powered by batteries|work in offices~to do a job in rooms for business tasks|work in factories~to do a job where goods are manufactured|buy food online~to order meals or groceries over the internet|use air-conditioners~to operate machines that cool indoor air|use air-cons~to operate machines that cool rooms|use microwave ovens~to heat food with machines using electromagnetic waves|use microwaves~to heat food in fast electric kitchen appliances|use refrigerators~to keep food cold in electric appliances|use fridges~to keep food cold in kitchen appliances|use washing machines~to clean laundry in automatic appliances`
);
words(
  "4A",
  5,
  11,
  "Places",
  `a supermarket~a large shop selling food and household goods|a shopping centre~a building or area containing many stores|an airport~a place where aircraft take off and land|a theme park~an amusement area with rides and attractions`
);
words(
  "4A",
  6,
  11,
  "Actions",
  `comb my hair~to make strands on my head neat with a toothed tool|get dressed~to put clothes on|do up my buttons~to fasten the small round closures on my clothes|tie my shoelaces~to fasten the strings on my shoes|pack my school bag~to put lesson materials in my carrying container|carry my school bag~to hold and transport my lesson materials|climb the stairs~to move upwards step by step indoors|use a fork~to eat with a tool having several prongs|use a spoon~to eat with a small bowl-shaped tool|use chopsticks~to eat with a pair of thin sticks|cut food with a knife~to divide something edible with a sharp blade|pour drinks~to make liquids flow into cups`
);
// Page 12 — 4B
words(
  "4B",
  1,
  12,
  "Things to do",
  `look at the beautiful view~to enjoy attractive scenery|visit a museum and look at the displays~to explore exhibits in a building preserving important objects|ride on the cable car~to travel in a cabin hanging from a wire|watch the birds~to observe feathered animals|watch a show~to view a performance|watch a concert~to view a musical performance|visit a theme park~to go to an amusement area with attractions|go on the rides~to enjoy moving amusement attractions|take photos of the harbour~to capture images of a sheltered area for ships|take photos of the statue~to capture images of a sculpted figure|try street food~to taste meals sold by outdoor vendors|eat seafood~to enjoy fish and shellfish as a meal`
);
words(
  "4B",
  2,
  12,
  "Places in our neighbourhood",
  `a post office~a place to send letters and parcels|a bank~a place that keeps and lends money|a bakery~a shop making and selling bread and cakes|a jewellery shop~a store selling rings and other precious ornaments|a clinic~a small place for medical treatment|a department store~a large shop with sections for many kinds of goods|a sports centre~a building with exercise and game facilities|a supermarket~a large shop selling food and household goods|a train station~a place to get on or off a railway vehicle|a health and beauty store~a shop selling personal-care products|a learning centre~a place providing extra courses and lessons|a convenience store~a small shop open long hours for everyday goods|a hospital~a large place treating sick and injured people`
);
words(
  "4B",
  2,
  12,
  "Neighbourhood activities",
  `post a parcel~to send a wrapped package through the mail|post a letter~to send a written message through the mail|buy furniture~to pay for tables, chairs or other household fittings|buy groceries~to pay for food and everyday household supplies|take a course~to attend a series of lessons`
);
words(
  "4B",
  3,
  12,
  "Meat",
  `meat~food from the flesh of animals|steak~a thick cut of meat often grilled|pork~meat from a pig|beef~meat from a cow|chicken~meat from a common farm bird`
);
words(
  "4B",
  3,
  12,
  "Fruit",
  `fruit~sweet edible produce containing seeds|grapes~small round fruits growing in bunches|cherries~small red fruits with stones inside|lychees~small fruits with bumpy skins and white flesh|longans~small brown-skinned fruits with white flesh and a dark seed`
);
words(
  "4B",
  3,
  12,
  "Noodles / pasta",
  `noodles~long strips of dough cooked in water|pasta~Italian food made from shaped dough|spaghetti~long thin strands of Italian dough food|macaroni~short curved tubes of Italian dough food`
);
words(
  "4B",
  3,
  12,
  "Vegetables",
  `vegetables~edible plants served with meals|carrots~long orange root vegetables|tomatoes~juicy red produce often eaten in salads|potatoes~starchy root vegetables|lettuce~leafy greens often used in salads|broccoli~a green vegetable with branching flower heads|peas~small round green seeds eaten as food|beans~edible seeds or long pods from climbing plants`
);
words(
  "4B",
  4,
  12,
  "Sugary food",
  `sugary food~edible treats containing much sweetener|cookies~small sweet crisp baked treats|pancakes~flat cakes cooked in a frying pan`
);
words(
  "4B",
  4,
  12,
  "Salty food",
  `salty food~edible items with much seasoning made of white crystals|bacon~thin cured strips of pig meat|instant noodles~dried dough strips that cook very quickly`
);
words(
  "4B",
  4,
  12,
  "Fried food",
  `fried food~edible items cooked in hot oil|fried fish balls~round seafood pieces cooked in hot oil|fried drumsticks~lower bird legs cooked in hot oil`
);
words(
  "4B",
  4,
  12,
  "Food pyramid",
  `food pyramid~a triangular guide to balanced eating|oil~liquid fat used in cooking|salt and sugar~white crystals for savoury and sweet flavours|dairy products~foods made from milk|milk~a white drink produced by cows|cheese~a solid food made from milk|yoghurt~a thick cultured milk food|meat and fish~animal foods that supply protein|vegetables~edible plants served with meals|fruit~sweet edible produce containing seeds|grain products~foods made from cereals such as wheat and rice`
);
words(
  "4B",
  4,
  12,
  "Advantages to health",
  `give us energy~to supply the power our bodies need|give us strong bones~to help make the skeleton firm|keep us healthy~to help our bodies stay well|help our muscles grow~to support development of the tissues that move our bodies`
);
words(
  "4B",
  4,
  12,
  "Disadvantages to health",
  `cause heart disease~to lead to illness in the organ that pumps blood|cause skin problems~to lead to trouble on the body's outer covering|make us fat~to cause excessive body weight`
);
words(
  "4B",
  5,
  12,
  "Good habits",
  `wash my hair~to clean the strands on my head|wash my sports shoes~to clean my exercise footwear|go to the dentist~to visit a professional who cares for teeth|help with the housework~to assist with jobs around the home|change my handkerchief~to replace my small cloth for wiping my nose|change my socks~to replace my soft foot coverings|change my uniform~to replace my standard school clothes|cut my fingernails~to trim the hard tips of my fingers`
);
words(
  "4B",
  5,
  12,
  "Bad habits",
  `eat junk food~to have snacks with little nutritional value|have soft drinks~to drink sweet fizzy beverages|skip breakfast~to miss the first meal of the day|be picky about my food~to refuse many foods because I dislike them`
);
words(
  "4B",
  6,
  12,
  "Resolutions",
  `pay attention in class~to listen carefully during lessons|do Maths exercises~to practise calculations in written tasks|do English exercises~to practise the language used in this game|do Chinese exercises~to practise a language written in characters|do revision~to review lessons before an assessment|study hard~to put much effort into learning|watch less TV~to spend a smaller amount of time viewing programmes|spend less time on my phone~to reduce the hours using my mobile device|go to bed early~to start sleeping before it is late|keep a diary~to write a regular personal record|tidy my bookshelf~to arrange one shelf of books neatly|tidy my bookshelves~to arrange several shelves of books neatly|tidy my room~to put my belongings in their proper places|pass my tests~to achieve satisfactory assessment results|fail my tests~to get unsatisfactory assessment results|get high marks in my exams~to achieve strong scores in major assessments|get low marks in my exams~to achieve weak scores in major assessments|lose my books~to misplace my reading materials|find my books~to discover my misplaced reading materials|be early for school~to arrive before lessons start|be late for school~to arrive after lessons start`
);
// Page 13 — 5A
words(
  "5A",
  1,
  13,
  "Things we should and shouldn't do",
  `arrive at school early~to reach lessons before the starting time|arrive at school late~to reach lessons after the starting time|dress tidily~to wear clothes neatly|dress untidily~to wear clothes messily|wait patiently~to stay calm until it is your turn|wait impatiently~to become annoyed while something is delayed|eat quietly~to have a meal without making much sound|eat noisily~to have a meal making much sound|speak politely~to talk with good manners|speak rudely~to talk with bad manners|jump the queue~to move ahead of people already waiting|offer your seat~to let another person sit where you were sitting|push other passengers~to shove fellow travellers|rush to the seats~to hurry to places to sit|talk on the phone softly~to speak into a mobile device in a gentle low voice|talk on the phone loudly~to speak into a mobile device with much volume`
);
words(
  "5A",
  2,
  13,
  "Things friends should and shouldn't do",
  `be mean to~to treat someone unkindly|be nice to~to treat someone kindly|say sorry to~to apologise to someone|share (feelings, secrets, things) with~to let another person know your emotions or use your belongings|quarrel with~to have an angry disagreement with someone|argue with~to disagree angrily with someone|discuss (a topic, problem) with~to talk together about a subject or difficulty|agree with~to have the same opinion as someone|disagree with~to have a different opinion from someone|get on with~to have a friendly relationship with someone|help … with (the homework)~to assist someone with tasks assigned for home|lie to~to deliberately say something untrue to someone|be jealous of~to feel unhappy about someone else's advantages|take care of~to look after someone or something`
);
words(
  "5A",
  2,
  13,
  "Feelings",
  `shocked~very surprised by something unexpected|puzzled~confused because you do not understand|embarrassed~feeling awkward or ashamed in front of people|annoyed~slightly angry about something|upset~unhappy or troubled|disappointed~sad because something was worse than hoped`
);
words(
  "5A",
  3,
  13,
  "Clothing items",
  `a vest~a sleeveless upper-body garment|a bow tie~a neck decoration tied into two loops|a suit~matching formal jacket and trousers or skirt|sandals~open footwear held by straps|gloves~hand coverings with separate finger spaces|mittens~hand coverings with one shared finger space`
);
words(
  "5A",
  3,
  13,
  "Accessories and body parts",
  `glasses~two lenses worn to help you see|sunglasses~dark lenses worn to protect eyes from bright light|curly blonde hair~light-coloured head strands forming loops|long straight hair~head strands extending far down without curls|a round face~the front of a head with a circular shape|a long face~the front of a head with an extended oval shape`
);
words(
  "5A",
  4,
  13,
  "Objects",
  `a backpack~a carrying bag worn on the back|a hairbrush~a bristled tool for making head strands neat|a racket~a handled frame with strings for hitting a ball|hair clip~a small fastener holding head strands in place|a mirror~a surface showing your reflection|goggles~protective lenses fitted closely around the eyes|headphones~a device worn over the ears for listening privately`
);
words(
  "5A",
  4,
  13,
  "Materials and objects",
  `a gold necklace~a neck ornament made from a precious yellow metal|a diamond ring~a finger ornament with a very hard precious stone|a crystal bracelet~a wrist ornament made from clear sparkling mineral|silver earrings~ear ornaments made from a precious pale metal|a woollen cardigan~an open-front knitted top made from sheep fibre|a cotton top~an upper-body garment made from a soft plant fibre|a leather coin purse~a small money bag made from animal skin`
);
words(
  "5A",
  5,
  13,
  "Activities",
  `do some sightseeing~to visit interesting places as a tourist|make videos~to record moving images|speak to local people~to talk with residents of the place you visit|send postcards~to mail picture cards with short messages|eat local food~to taste dishes from the area you visit|buy souvenirs~to pay for objects that remind you of a trip|meet relatives~to see members of your wider family`
);
words(
  "5A",
  5,
  13,
  "Preparations",
  `search for information about the country~to find facts about the nation you will visit|exchange some money~to change cash into another currency|book a local tour~to reserve a guided trip in the area|print out the e-ticket~to make a paper copy of an electronic reservation|pack your suitcase~to put travel clothes and belongings in your case`
);
words(
  "5A",
  6,
  13,
  "Activities",
  `take photos with cartoon characters~to capture images beside figures from animated stories|go on a boat trip~to travel on water for pleasure|go skiing~to glide over snow on long narrow boards|explore a cave~to investigate an underground hollow|visit a chocolate factory~to go to a place making cocoa sweets|go on a tour at a castle~to explore a historic fortress with a guide|watch a play at a theatre~to view actors performing a story on stage|visit a temple~to go to a building used for worship|visit a fishing village~to go to a small community earning a living from the sea|eat sushi at a fish market~to enjoy Japanese rice dishes where seafood is sold|take a ride in a hot-air balloon~to travel in a basket below a large heated floating bag`
);
words(
  "5A",
  6,
  13,
  "International cuisines",
  `Chinese~a style of food from China|roast goose~a large water bird cooked in an oven|American~a style of food from the United States|roast turkey~a large farm bird cooked in an oven|Japanese~a style of food from Japan|rice with deep-fried pork chop~cooked grains served with pig meat cooked in hot oil|Thai~a style of food from Thailand|pineapple fried rice~stir-fried grains with sweet tropical yellow fruit`
);
// Page 14 — 5B
words(
  "5B",
  1,
  14,
  "Illnesses",
  `a fever~an unusually high body temperature|a sore throat~pain in the part used for swallowing|a cough~an illness causing repeated forceful air from the lungs|a cold~a mild illness causing a runny nose and sneezing|a toothache~pain in a hard white part of the mouth|a headache~pain in the head|a stomachache~pain in the belly|the flu~an infectious illness causing fever and body aches`
);
words(
  "5B",
  1,
  14,
  "Injuries",
  `bang my head~to hit the top part of my body against something|scrape my knee~to rub skin off the joint in the middle of my leg|scrape my elbow~to rub skin off the joint in the middle of my arm|twist my ankle~to injure the joint above my foot by turning it|break my arm~to fracture a bone in my upper limb|break my leg~to fracture a bone in my lower limb`
);
words(
  "5B",
  2,
  14,
  "Achievements",
  `become a film star~to gain success as a famous movie actor|become famous~to be known by many people|become popular~to be liked by many people|appear in films~to take roles in movies|become a businesswoman~to gain a career as a woman managing commercial work|set up a company~to start a business organisation|become successful~to achieve your aims|become a businessman~to gain a career as a man managing commercial work|set up a charity group~to start an organisation helping people in need|become a scientist~to gain a career studying nature through research|appear in magazines~to be featured in regularly published booklets|receive a prize~to be given an award for success|become an athlete~to gain a career competing in sports|win a competition~to finish first in a contest|win a race~to reach the finish line first|appear in newspapers~to be featured in printed reports of current events|become a writer~to gain a career creating books or articles|win an award~to earn official recognition for success|become a musician~to gain a career performing songs or instruments|perform on stage~to entertain an audience from a raised platform|perform in other countries~to entertain audiences abroad|appear in TV shows~to be featured in television programmes`
);
words(
  "5B",
  3,
  14,
  "Verbs for cooking",
  `boil~to cook in bubbling hot water|chop~to cut food into small pieces|fry~to cook food in hot oil|mix~to combine ingredients together|pour~to make liquid flow from one container to another|beat~to stir ingredients rapidly until smooth|bake~to cook food in an oven`
);
words(
  "5B",
  3,
  14,
  "Verbs for doing crafts",
  `tear~to pull paper or fabric apart|fold~to bend paper so one part lies over another|staple~to join paper with small metal fasteners|cut~to divide material with scissors or a blade|stamp~to press an inked design onto a surface|tie~to fasten things by making a knot|stick~to attach something with glue`
);
words(
  "5B",
  3,
  14,
  "Materials",
  `plastic~a light manufactured material moulded into many shapes|metal~a hard material such as iron or steel|cloth~woven or knitted fabric|cardboard~thick stiff paper often used for boxes|wood~the hard material from tree trunks`
);
words(
  "5B",
  4,
  14,
  "Describing transport",
  `inconvenient~difficult to use or reach|convenient~easy to use or reach|slow~taking a long time to travel|quick~taking little time to travel|fast~moving at high speed|cheap~having a low fare|expensive~having a high fare|not crowded~having plenty of empty seats|crowded~full of people|comfortable~pleasant to sit in with soft seats and cooling|uncomfortable~unpleasant to sit in with hard seats or heat`
);
words(
  "5B",
  5,
  14,
  "Accidents",
  `crash into~to hit something forcefully while moving|spill~to accidentally let liquid fall out of a container|slip~to slide accidentally and lose balance|trip over~to catch your foot on something and stumble|rescue~to save someone from danger|roll over~to turn upside down or onto another side|bump into~to hit someone or something accidentally|fall off~to drop from something you were on`
);
words(
  "5B",
  5,
  14,
  "Vehicles",
  `an ambulance~a vehicle taking ill or injured people to hospital|a fire engine~a large vehicle carrying equipment to put out fires|a van~a road vehicle for goods or small groups of people|a lorry~a large road vehicle carrying heavy goods|a motorcycle~a motor vehicle with two wheels`
);
words(
  "5B",
  6,
  14,
  "Actions",
  `rob~to take money or property using force|set off the alarm~to trigger a warning sound|call the police~to contact officers for help|shoot at~to fire a weapon towards someone or something|faint~to lose consciousness briefly|escape~to get away from danger or captivity|hit~to strike someone or something|cry for help~to shout for assistance|chase~to run after someone to catch them|steal~to take something without permission|arrest~to take a suspected criminal into custody`
);
words(
  "5B",
  6,
  14,
  "People at a crime scene",
  `a robber~a person taking property by force|a security guard~a person employed to protect a place|a witness~a person who saw an event happen|a thief~a person taking things without permission`
);
// Pages 15–16 — 6A. Page 16 continues chapter 5 before chapter 6.
words(
  "6A",
  1,
  15,
  "Jobs and duties",
  `a firefighter~a worker who puts out fires and saves people|a police officer~a worker who protects people and fights crime|a businessman~a man running a company|businesswoman~a woman running a company|a reporter~a person interviewing people and reporting news|a fashion designer~a person creating new styles of clothing|a social worker~a person helping people in difficult situations|a pilot~a person flying aircraft|a flight attendant~a person caring for passengers on an aircraft|an actor~a man performing roles in films or plays|actress~a woman performing roles in films or plays|a model~a person displaying clothes in fashion shows|a lawyer~a person speaking for people in court|a computer programmer~a person writing instructions for digital machines|an astronaut~a person travelling and working in space|an architect~a person designing buildings|a vet~a person treating sick animals`
);
words(
  "6A",
  1,
  15,
  "Job duties",
  `rescue people from fires~to save people from burning buildings|protect people and fight crime~to keep the public safe and stop illegal acts|run a company~to manage a business|interview people and report news~to ask questions and publish recent events|design clothes~to plan new garments|help people in need~to assist people facing difficulties|fly planes~to control aircraft in the sky|take care of passengers~to attend to travellers' needs|act in films~to perform characters in movies|appear in fashion shows~to display clothing at public events|speak for people in court~to represent others during legal cases|design computer programs~to plan instructions for electronic machines|explore space~to investigate beyond Earth's atmosphere|design buildings~to plan structures for people to use|cure sick animals~to treat unwell creatures`
);
words(
  "6A",
  2,
  15,
  "Job requirements",
  `caring~kind and supportive to others|outgoing~enjoying meeting new people|good-looking~attractive in appearance|talkative~liking to speak a lot|patient~not becoming angry easily while waiting|hard-working~putting much effort into a job|creative~able to come up with new ideas|attentive~noticing and considering others' needs|calm~staying relaxed in stressful situations`
);
words(
  "6A",
  3,
  15,
  "Natural disasters",
  `a typhoon~a powerful tropical storm with strong winds|a rainstorm~a period of very heavy rainfall|an earthquake~sudden shaking of the ground|a drought~a long period with too little rain`
);
words(
  "6A",
  3,
  15,
  "Disaster effects",
  `knocks down trees~makes tall woody plants fall|trees block roads~fallen woody plants stop vehicles passing|causes landslides~makes soil and rocks slide down slopes|causes floods~makes water cover normally dry land|destroy ships and boats~damage water vehicles beyond use|destroys houses and buildings~ruins structures where people live and work|damages roads~breaks surfaces used by vehicles|damages gas lines and causes fires~breaks fuel pipes and starts flames|damages power cables and causes outages~breaks electrical wires and stops the electricity supply|soil becomes dry and plants die~the ground loses moisture and growing things perish|kills animals~causes living creatures to die`
);
words(
  "6A",
  3,
  15,
  "Typhoon warning signals",
  `Standby signal no. 1~the first alert that a tropical storm may affect Hong Kong|Strong wind signal no. 3~an alert that strong winds are expected in Hong Kong|Storm signal no. 8~an alert for gale or storm-force winds in Hong Kong|Storm signal no. 9~an alert that gale or storm-force winds are increasing|Hurricane signal no. 10~Hong Kong's highest tropical cyclone wind warning`
);
words(
  "6A",
  3,
  15,
  "Rainstorm warning signals",
  `Amber~the first colour level of Hong Kong's heavy-rain warning|Red~the middle colour level of Hong Kong's heavy-rain warning|Black~the highest colour level of Hong Kong's heavy-rain warning`
);
words(
  "6A",
  4,
  15,
  "Charity activities",
  `run a second-hand stall~to manage a stand selling previously owned goods|run a craft stall~to manage a stand selling handmade objects|organise a charity sale~to arrange selling goods to help a cause|visit the poor~to spend time with people with little money|visit the elderly~to spend time with older people|visit the sick~to spend time with people who are unwell|visit the homeless~to spend time with people without a place to live|sell flags~to exchange charity badges for donations|buy raffle tickets~to pay for entries in a prize draw|go on a charity walk~to join a walking event raising money for a cause|take part in a show~to join a performance|take part in a concert~to join a musical performance|donate books~to give reading materials to a good cause|donate clothes~to give garments to a good cause|donate toys~to give children's playthings to a good cause|donate furniture~to give household fittings to a good cause|donate canned food~to give preserved meals in tins to a good cause`
);
words(
  "6A",
  5,
  15,
  "Adjectives",
  `wealthy~having a lot of money|proud~thinking you are better than other people|handsome~attractive in appearance, usually describing a man|pretty~attractive in a delicate way, often describing a woman|cheerful~usually happy and positive|serious~solemn and seldom laughing|dishonest~telling lies or cheating|wicked~very bad or evil|cruel~unkind and deliberately hurting others|greedy~wanting more than you need|selfish~caring only about yourself`
);
words(
  "6A",
  5,
  16,
  "Feelings",
  `bored~not interested in what is happening|disappointed~sad that something is worse than hoped|amazed~very surprised and impressed|amused~finding something funny|excited~feeling eager and thrilled|interested~wanting to learn more about something|moved~emotionally affected by something touching|touched~feeling sympathy or affection because of something|surprised~feeling wonder at something unexpected`
);
words(
  "6A",
  6,
  16,
  "Phrasal verbs",
  `give up~to stop trying| get into (trouble)~to become involved in difficulties|get away~to escape|make up (a story)~to invent an account of events|set off (for a trip)~to begin a journey|look for~to try to find|turn into~to change into something different|find out~to discover information`
);
words(
  "6A",
  6,
  16,
  "Opposite adjectives",
  `smooth~having an even surface without bumps|rough~having an uneven surface with bumps|hard~firm and difficult to press|soft~easy to press or bend|gentle~kind and not forceful|fierce~aggressive and powerful|wise~showing good judgement from knowledge and experience|silly~foolish and not sensible`
);
// Pages 17–18 — 6B
words(
  "6B",
  1,
  17,
  "Festivals",
  `Chinese New Year~the celebration starting a new year in the Chinese calendar|Ching Ming Festival~a spring festival for remembering ancestors|Mid-Autumn Festival~a lunar festival with lanterns and moon viewing`
);
words(
  "6B",
  1,
  17,
  "Festival activities",
  `visit the flower market and buy good luck flowers~to go to plant stalls for auspicious blossoms|do the spring-cleaning~to clean the whole home thoroughly for a new season|decorate home with red paper~to make rooms festive with scarlet paper ornaments|perform lion dances~to present a traditional dance in a large animal costume|have a reunion dinner~to eat an evening meal with the family gathered together|give red packets~to hand out festive envelopes of money|give lucky money~to offer cash as an auspicious festive gift|visit family and friends~to spend time with relatives and people you like|exchange good wishes~to offer each other hopes for happiness and success|watch firework displays~to view bright explosions lighting the night sky|watch parades~to view processions celebrating an occasion|sweep graves~to clean ancestors' burial places|give special food to ancestors~to offer traditional meals in memory of deceased relatives|tie riddles to lanterns~to attach puzzling questions to decorative lights|light lanterns~to make decorative lamps glow|look at the moon~to observe Earth's natural satellite`
);
words(
  "6B",
  1,
  17,
  "Festival food and objects",
  `tangerines~small easy-to-peel citrus fruits|peach blossoms~pink flowers from a stone-fruit tree|a candy tray~a divided dish holding festive sweets|rice cakes~foods made from ground or sticky cereal grains|melon seeds~small edible kernels from a large juicy fruit|turnip cakes~savoury steamed cakes made from a white root vegetable|roast suckling pig~a young pig cooked whole in an oven|roast pork~pig meat cooked in an oven|pomelo~a very large citrus fruit with a thick rind|starfruit~a yellow fruit whose slices have five points`
);
words(
  "6B",
  2,
  17,
  "Countries",
  `Australia~a country and continent in the southern hemisphere|Egypt~a North African country known for ancient pyramids|Japan~an East Asian island country|China~a large East Asian country whose capital is Beijing|Britain~the island containing England, Scotland and Wales`
);
words(
  "6B",
  2,
  17,
  "Natural features",
  `a harbour~a sheltered area of water where ships stay|an island~land surrounded by water|a coral reef~an underwater ridge formed by tiny sea animals|a desert~a very dry area with little rain|a hot spring~naturally heated water flowing from the ground|a lake~a large area of water surrounded by land|a volcano~a mountain opening that can erupt lava|a mountain~a very high area of land|a river~a long flowing body of water`
);
words(
  "6B",
  2,
  17,
  "Man-made landmarks",
  `a pyramid~an ancient structure with triangular sides meeting at a point|a palace~a large home for a king or queen|a bridge~a structure carrying a path across water or a road|a tower~a tall narrow structure|a square~an open public space among buildings|a stadium~a large sports arena with spectator seats`
);
words(
  "6B",
  2,
  17,
  "Animals at natural features",
  `a dolphin~an intelligent sea mammal with a curved dorsal fin|a kangaroo~an Australian animal that hops and carries young in a pouch|a koala~an Australian tree-living animal eating eucalyptus leaves|a seal~a sea mammal with flippers|an octopus~a sea animal with eight arms|a starfish~a sea animal usually with five arms|a camel~a desert animal with one or two humps`
);
words(
  "6B",
  3,
  17,
  "Actions good for the environment",
  `turn off the tap~to stop water flowing from a faucet|turn off the lights~to stop lamps using electricity|turn down the air-con~to reduce use of a cooling appliance|have showers~to wash under falling water rather than in a full tub|bring your own bag~to carry a reusable shopping container|bring your own water bottle~to carry a refillable drinking container|bring your own handkerchief~to carry a washable cloth for wiping your nose|recycle cans~to process used metal containers into new material|recycle paper~to process used sheets into new material|recycle glass~to process used transparent material into new products|recycle plastic bags~to process used flexible shopping containers into new material|recycle plastic bottles~to process used manufactured drink containers into new material|reuse cans~to use metal containers again|reuse paper~to use sheets again|reuse glass~to use transparent containers again|reuse plastic bags~to use flexible shopping containers again|reuse plastic bottles~to use manufactured drink containers again`
);
words(
  "6B",
  3,
  17,
  "Actions bad for the environment",
  `leave the tap on~to let water flow unnecessarily|leave the lights on~to let lamps keep using electricity unnecessarily|turn up the air-con~to increase use of a cooling appliance|have baths~to wash in a tub full of water|use a lot of plastic bags~to consume many flexible manufactured shopping containers|use a lot of plastic bottles~to consume many manufactured drink containers|use a lot of tissues~to consume many disposable paper wipes|use a lot of disposable products~to consume many items intended for one use|throw away a lot of used cans~to discard many empty metal containers|throw away a lot of used paper~to discard many sheets after use|throw away a lot of used plastic bags~to discard many flexible shopping containers after use|throw away a lot of used plastic bottles~to discard many manufactured drink containers after use`
);
words(
  "6B",
  3,
  17,
  "Types of pollution",
  `air pollution~harmful substances in the atmosphere we breathe|land pollution~harmful waste contaminating the ground|water pollution~harmful substances in rivers, lakes or seas|noise pollution~unwanted or harmful levels of sound`
);
words(
  "6B",
  4,
  17,
  "Actions that harm animals",
  `use animals to test new products~to experiment on living creatures for manufactured goods|force animals to fight against each other~to make creatures attack one another|destroy forests~to ruin large areas of trees|pollute the environment~to contaminate the natural world|dump waste into the sea~to throw rubbish into ocean water|hunt animals for their body parts~to kill creatures to take pieces of their bodies|keep rare animals as pets~to hold uncommon wild creatures at home|catch endangered animals~to capture creatures at risk of disappearing forever`
);
words(
  "6B",
  4,
  17,
  "Animal body parts",
  `sharks' fins~the swimming blades from large predatory fish|crocodiles' skin~the tough outer covering from large reptiles|bears' fur~the thick hair from large forest mammals|rhinos' horns~the pointed growths on large animals' noses`
);
words(
  "6B",
  4,
  17,
  "Rare and endangered animals",
  `an orangutan~a large reddish-brown ape living in trees|a star tortoise~a shelled reptile with radiating patterns on its back|a grey parrot~a pale-coloured bird able to imitate speech|a rhino~a large thick-skinned animal with a horn on its nose|a gorilla~a large powerful African ape|a sea lion~a marine mammal with visible ear flaps|a whale~a very large mammal living in the ocean`
);
words(
  "6B",
  4,
  17,
  "Actions that protect animals",
  `use less plastic~to reduce consumption of manufactured material that persists as waste|think before we buy~to consider how purchases affect living creatures|don't buy leather goods~to avoid purchasing products made from animal skin|don't buy clothes made from the fur of animals~to avoid garments using creatures' thick hair|reduce pollution~to decrease harmful substances in the natural world|support animal charities~to help organisations caring for creatures|be a volunteer~to work for a cause without pay|donate money~to give cash to help a cause`
);
words(
  "6B",
  5,
  18,
  "Adjectives with prepositions",
  `ashamed of~feeling bad about something you did|scared of~afraid of someone or something|worried about~anxious about a possible problem|nervous about~uneasy about a coming event|excited about~eager and thrilled about something|angry with~feeling strong annoyance towards someone|disappointed with~unhappy because someone or something did not meet your hopes|upset about~troubled by a situation|proud of~pleased about an achievement|pleased with~satisfied with someone or something`
);
words(
  "6B",
  5,
  18,
  "Adjectives about experiences",
  `meaningful~having an important purpose|joyful~full of happiness|enjoyable~pleasant and fun|valuable~useful or important|painful~causing physical or emotional hurt|awful~extremely unpleasant|terrible~very bad or unpleasant`
);
words(
  "6B",
  6,
  18,
  "Things we learnt",
  `respect others~to treat people with consideration|care for others~to look after other people's needs|solve problems~to find answers to difficulties|improve my English~to get better at the language used in this game|know right from wrong~to understand good and bad behaviour|make my own choices~to decide for myself|enjoy teamwork~to like cooperating with a group|improve my basketball skills~to get better at a game involving a high hoop|support other classmates~to help fellow pupils|encourage other classmates~to give fellow pupils confidence`
);
words(
  "6B",
  6,
  18,
  "Adjectives about people",
  `confident~believing in your ability|diligent~working carefully with steady effort|generous~happy to give or share with others|humble~not thinking you are better than others|loyal~faithful to people or a cause|responsible~reliable in carrying out duties|punctual~arriving at the expected time|obedient~following instructions and rules`
);
