// Everything Paati says and asks lives here, so writers and reviewers can edit it without touching game code.
// All of it is DRAFT. Before launch, Tamil-speaking home cooks review the stories, quiz answers and recipe
// (see "Cultural care" in docs/design-brief.md). The game uses English only for now.

export const CHAPTERS = {
  welcome: { title: 'Welcome', mood: 'festive' },
  ch1: { number: 1, title: 'What is Deepavali?', mood: 'ch1' },
  ch2: { number: 2, title: 'What is muruku?', mood: 'ch2' },
  ch3: { number: 3, title: 'How is it made?', mood: 'kitchen' },
  ch4: { number: 4, title: 'Why muruku at Deepavali?', mood: 'ch4' },
};

// Paati's reactions (brief → "Paati's reactions") → her illustrated poses in assets/paati.
// There is no gentle-correction pose yet, so it borrows the teaching one.
export const PAATI = {
  welcome: 'paati-welcome', // open arms
  teaching: 'paati-teaching', // book in hand, finger raised
  proud: 'paati-proud', // laughing, thumbs up, waving
  gentle: 'paati-teaching',
  celebrating: 'paati-sharing', // holding a plate of sweets to share
};

// Paati's short stories: two or three lines each. `paati` is the full-body pose shown beside the story.
// `act` is a line where Paati asks the player to tap something (`kind`): Next waits until it's done, then the
// story carries on. The stories set the scene without giving any quiz answers away: Paati asks first and
// explains after (QUIZ_BANK).
export const STORIES = {
  welcome: {
    paati: PAATI.proud,
    done: 'Let us begin',
    lines: [
      'Come in, come in. Shoes off, appetite on. I am Paati, which means grandmother, and yes, I am the boss of this kitchen.',
      'First, a kolam at the door, so every guest knows they are welcome. Tap the doorstep, dear.',
      'Beautiful. Answer my questions, fill my store, and then we cook. That is the deal.',
    ],
    act: { at: 1, kind: 'kolam', tap: 'Tap the doorstep' },
  },
  ch1: {
    paati: PAATI.teaching,
    done: 'Start the quiz',
    lines: [
      'Deepavali! New clothes, kolams at the door, and far too many sweets.',
      'But first, my lamps. Light them for me, dear: tap each one.',
      'Lovely. Now, how much do you really know? I ask, you answer, then I tell you the story behind it.',
    ],
    act: { at: 1, kind: 'diyas', tap: 'Tap each lamp' },
  },
  ch2: {
    paati: PAATI.teaching,
    done: 'Start the quiz',
    lines: [
      'Now, muruku. Crunchy, a little salty, and impossible to eat just one.',
      'Now my questions. Every right answer puts an ingredient on my shelf.',
    ],
  },
  ch3: {
    paati: PAATI.teaching,
    done: 'Go to the Store',
    lines: [
      'The store is full. Now the fun part: we cook. I will ask you a few things as we go.',
      'Hot oil does not forgive, so younger cooks, call an adult. Older cooks, call your common sense.',
    ],
  },
  ch4: {
    paati: PAATI.celebrating,
    done: 'Start the quiz',
    lines: [
      'Look at your muruku! Made with your own two hands. I will try not to cry.',
      'Two last questions, and then we celebrate. I saved the good ones.',
    ],
  },
};

// The six ingredients. `art` is a file in assets/art. Order matches the Store shelves.
export const INGREDIENTS = [
  { id: 'riceFlour', name: 'Rice flour', art: 'rice-flour', artScale: 1.25, note: 'Rice flour is the crunch. No crunch, no muruku.', colour: 0xfffdf7 },
  { id: 'uradFlour', name: 'Urad dal flour', art: 'urad-dal', artScale: 1.25, note: 'Urad dal flour makes it light and tasty.', colour: 0xf1e2c0 },
  { id: 'flour', name: 'Flour', art: 'flour-tin', note: 'A little flour helps the dough hold together.', colour: 0xf7f0e2 },
  { id: 'spices', name: 'Spices', art: 'spice-tin', note: 'Spices bring the taste. Many add sesame too.', colour: 0xc8552a },
  { id: 'ghee', name: 'Ghee', art: 'ghee-jar', note: 'Ghee makes it rich. Ghee makes everything rich.', colour: 0xf2c14e },
  { id: 'water', name: 'Water', art: 'jar-clay', note: 'Water brings it all together, slowly.', colour: 0x8cc4ea },
];

export const ingredient = (id) => INGREDIENTS.find((i) => i.id === id);

// Paati's order for step 1. Water has its own step.
export const ADD_ORDER = ['riceFlour', 'uradFlour', 'flour', 'spices', 'ghee'];

// The quiz bank. Paati asks first, then explains: a wrong answer gets a nudge (without giving the answer away) and
// Try again; the right answer's `why` is the explanation. `teach` is the fact on its own, used as a "Did you know?"
// in the free kitchen when the question wasn't asked.
// Each chapter asks `ask` questions: the `core` ones every time, the rest picked at random (mixing formats, and
// never two from the same `group`), so a replay brings new facts.
// Formats (`type`): 'choice' (default, 3 choices), 'truefalse' (True / Not true), 'picture' (3 choices with `art`),
// 'order' (`items` listed in the right order; the game shuffles them). Wrong choices are meant to be believable,
// never silly, and never a dig at a tradition.
// Sources and reviewer notes for every fact: docs/quiz-research.md. All of it needs the cultural review.
export const QUIZ_BANK = {
  ch1: {
    ask: 3,
    questions: [
      {
        id: 'kolam-rice',
        core: true,
        teach: 'We draw the kolam at the door with rice flour, not chalk, so ants and little birds get a meal too. Sharing starts at the doorstep.',
        q: 'Why is the kolam at the door drawn with rice flour?',
        choices: [
          { text: 'So ants and birds can eat it too', correct: true, why: 'Exactly. A rice-flour kolam is breakfast for ants and little birds. Sharing starts at the doorstep, even with the tiniest guests.' },
          { text: 'It shows up brighter than chalk', why: 'It does look lovely, but that is a bonus, not the reason. The real reason is a kind one.' },
          { text: 'It is easier to sweep away', why: 'Easy to sweep, yes, but nobody sweeps it. Look at the doorstep at sunrise: who is having breakfast?' },
        ],
      },
      {
        id: 'name',
        teach: 'The word Deepavali means a row of lights. Deepa is a lamp, and avali is a row.',
        q: 'What does the word Deepavali mean?',
        choices: [
          { text: 'The festival of sweets', why: 'Plenty of sweets, I promise, but the word itself is about something that glows.' },
          { text: 'A row of lights', correct: true, why: 'That is it! Deepa is a lamp and avali is a row. A row of lamps, all along the street.' },
          { text: 'A new year', why: 'Some families do start a new year around now, but the word means something you light.' },
        ],
      },
      {
        id: 'new-moon',
        type: 'truefalse',
        teach: 'Deepavali comes on the new moon, the darkest night of the month. That is why every little lamp shines so bright.',
        q: 'Deepavali comes on a night with a big, bright full moon.',
        choices: [
          { text: 'True', why: 'Think again, dear. Why would we need so many lamps on a bright night?' },
          { text: 'Not true', correct: true, why: 'Right! Deepavali falls on the new moon, the darkest night of the month. That is why every little lamp matters.' },
        ],
      },
      {
        id: 'oil-bath',
        group: 'morning',
        teach: 'In many Tamil homes, Deepavali begins before sunrise with a warm oil bath. Families call it a Ganga bath, as special as a dip in the holy Ganga river.',
        q: 'How do many Tamil families start Deepavali morning?',
        choices: [
          { text: 'With a big breakfast of sweets', why: 'Sweets come later, I promise. Something happens before the sun is even up.' },
          { text: 'By visiting the temple at noon', why: 'Many do visit the temple, but much later. The day starts in the dark, at home.' },
          { text: 'With an oil bath before sunrise', correct: true, why: 'Yes! Up before the sun, warm oil in the hair, a bath, then new clothes. Families call it a Ganga bath, as special as a dip in the holy river.' },
        ],
      },
      {
        id: 'medicine',
        group: 'morning',
        teach: 'After the bath, many Tamil families eat a spoonful of Deepavali medicine, made with ginger, pepper and herbs. It gets tummies ready for all the sweets.',
        q: 'Why do many families eat a herbal paste on Deepavali morning?',
        choices: [
          { text: 'To help the tummy with all the sweets', correct: true, why: 'Exactly. Ginger, pepper and herbs first, so the tummy is ready for a whole day of sweets and muruku.' },
          { text: 'To bring good luck for the year', why: 'Not luck, dear. Something more practical. Think about everything you will eat that day.' },
          { text: 'To keep mosquitoes away', why: 'Mosquitoes are not invited, but no. Think about the day ahead: what will you be eating?' },
        ],
      },
      {
        id: 'morning-order',
        type: 'order',
        group: 'morning',
        teach: 'In many Tamil homes, Deepavali morning goes like this: a warm oil bath before sunrise, then a spoonful of Deepavali medicine, then new clothes and blessings from the elders.',
        q: 'Put a Tamil Deepavali morning in order.',
        items: ['Oil bath before sunrise', 'Deepavali medicine', 'New clothes and blessings'],
        why: 'Perfect! Oil bath, Deepavali medicine, then new clothes and blessings. The day can begin.',
      },
      {
        id: 'narakasura',
        teach: 'Many families in South India tell how Krishna and Satyabhama defeated Narakasura. His last wish was that people remember the day with lamps and joy.',
        q: 'In the South Indian Deepavali story, who asked for the day to be lit up?',
        choices: [
          { text: 'Krishna, the hero', why: 'Krishna is the hero of the story, but the wish came from someone else. Someone with a last wish.' },
          { text: 'Satyabhama, who fought the battle', why: 'Satyabhama fought bravely, but the wish was not hers. Think about a last wish.' },
          { text: 'Narakasura, who was defeated', correct: true, why: 'Yes, Narakasura himself. Krishna and Satyabhama defeated him, and his last wish was that people remember the day with lamps and joy.' },
        ],
      },
      {
        id: 'rama',
        teach: 'In North India, many families remember Rama, Sita and Lakshmana coming home to Ayodhya. People lit rows of lamps to light their way.',
        q: 'In the North Indian Deepavali story, why did people light rows of lamps?',
        choices: [
          { text: 'To welcome Rama and Sita home', correct: true, why: 'Yes. Rama, Sita and Lakshmana came home to Ayodhya, and rows of lamps lit their way on a dark night.' },
          { text: 'To celebrate a good harvest', why: 'Harvests get their own festivals. This story is about a homecoming.' },
          { text: 'To mark the start of winter', why: 'Not the weather, dear. Someone special was on their way.' },
        ],
      },
      {
        id: 'faiths',
        type: 'truefalse',
        teach: 'Deepavali is not only a Hindu festival. Jains remember Mahavira, and Sikhs celebrate Bandi Chhor Divas, the day Guru Hargobind was set free.',
        q: 'Only Hindus celebrate at Deepavali time.',
        choices: [
          { text: 'True', why: 'Not quite. Other faiths light up this time of year too, each with its own story.' },
          { text: 'Not true', correct: true, why: 'Right! Jains remember Mahavira, and Sikhs celebrate Bandi Chhor Divas, the day Guru Hargobind was set free. Many stories, the same lights.' },
        ],
      },
      {
        id: 'kolam-maths',
        teach: 'Some kolams are one long line that loops around the dots and never ends. Scientists have even studied kolams to teach computers to draw patterns.',
        q: 'What have scientists learned from kolam patterns?',
        choices: [
          { text: 'How to predict the weather', why: 'Not the weather. Think of machines that draw.' },
          { text: 'Ways to teach computers to draw', correct: true, why: 'Yes! Some kolams are one long line looping round the dots, and computer scientists have studied them to teach computers to draw. From our doorsteps!' },
          { text: 'Where ants build their nests', why: 'The ants just eat it, dear. Think of machines.' },
        ],
      },
      {
        id: 'turmeric',
        teach: 'In many homes, new Deepavali clothes get a tiny dab of turmeric on one corner, as a blessing, before anyone wears them.',
        q: 'What goes on a corner of new Deepavali clothes in many homes?',
        choices: [
          { text: 'A drop of rose water', why: 'Rose water smells lovely, but this one is yellow and leaves a mark.' },
          { text: 'A pinch of salt', why: 'Not salt. Think of a yellow spice.' },
          { text: 'A tiny dab of turmeric', correct: true, why: 'Yes. A little turmeric on one corner is a blessing, before anyone wears them.' },
        ],
      },
      {
        id: 'spot-diya',
        type: 'picture',
        teach: 'A diya is a little clay lamp with oil and a cotton wick. Rows of diyas glow in doorways and windows on Deepavali.',
        q: 'Which one is a diya?',
        choices: [
          { art: 'jar-clay', text: 'Clay pot', why: 'That clay pot holds water. A diya is smaller, and it glows.' },
          { art: 'diya', text: 'Little lamp', correct: true, why: 'Yes! A diya is a little clay lamp with oil and a cotton wick. Rows of them glow on Deepavali.' },
          { art: 'muruku-golden', text: 'Muruku', why: 'That one you eat, dear. A diya you light.' },
        ],
      },
    ],
  },
  ch2: {
    ask: 3,
    questions: [
      {
        id: 'twisted',
        core: true,
        teach: 'The word muruku means twisted, because we twist the dough into rings.',
        q: 'What does "muruku" mean in Tamil?',
        choices: [
          { text: 'Crunchy', why: 'It is crunchy, but the name is about its shape.' },
          { text: 'Twisted', correct: true, why: 'Yes! Muruku means twisted, because we twist the dough into rings.' },
          { text: 'Little wheel', why: 'Good guess from the shape, but the name is about how we make it.' },
        ],
      },
      {
        id: 'why-rice',
        core: true,
        teach: 'Why rice flour? Because rice grows all over Tamil Nadu. The Kaveri river lands around Thanjavur are even called the rice bowl of Tamil Nadu.',
        q: 'Why do so many Tamil snacks start with rice flour?',
        choices: [
          { text: 'Rice flour keeps longer than others', why: 'Good thinking, but the reason is closer to the fields.' },
          { text: 'Wheat does not grow in India', why: 'Wheat grows in India, mostly in the north. Think about what fills the fields down south.' },
          { text: 'Rice grows all over Tamil Nadu', correct: true, why: 'Yes. Rice grows everywhere here. The Kaveri river lands around Thanjavur are even called the rice bowl of Tamil Nadu.' },
        ],
      },
      {
        id: 'rice-plenty',
        teach: 'Rice also means plenty. Many families use rice in blessings, hoping their home will always have enough to share.',
        q: 'What does rice stand for in many blessings?',
        choices: [
          { text: 'Plenty, so there is always enough', correct: true, why: 'Yes. Rice in a blessing is a wish that the home will always have enough to share.' },
          { text: 'A safe journey', why: 'Not a journey. Think of a pot that never runs empty.' },
          { text: 'Courage', why: 'Not courage, dear. Think of a full pot, with some left over.' },
        ],
      },
      {
        id: 'urad',
        teach: 'We mix in urad dal flour. Urad dal is a small black lentil that is white inside. It makes muruku light and tasty.',
        q: 'What is urad dal?',
        choices: [
          { text: 'A kind of rice', why: 'Not rice, though the two are often together. Think smaller, and darker.' },
          { text: 'A small black lentil', correct: true, why: 'Yes! Black outside, white inside. Ground into flour, it makes muruku light and tasty.' },
          { text: 'A spice for curries', why: 'Not a spice. It is something you would find in a dal.' },
        ],
      },
      {
        id: 'hand',
        type: 'truefalse',
        teach: 'Some grandmothers twist muruku by hand, with no press at all. It is called hand muruku, and it takes years of practice.',
        q: 'Some muruku is twisted by hand, with no press at all.',
        choices: [
          { text: 'True', correct: true, why: 'True! It is called hand muruku, and it takes years of practice. One day, maybe you.' },
          { text: 'Not true', why: 'Never underestimate a grandmother, dear. Think again.' },
        ],
      },
      {
        id: 'manapparai',
        teach: 'One town in Tamil Nadu, Manapparai, is famous for its muruku. Hundreds of families there make it the old way.',
        q: 'Which town is famous for its muruku?',
        choices: [
          { text: 'Mysuru, in Karnataka', why: 'Mysuru has its own famous sweet. The muruku town is closer to home.' },
          { text: 'Kolkata, in West Bengal', why: 'Kolkata is famous for its sweets. Try somewhere in Tamil Nadu.' },
          { text: 'Manapparai, in Tamil Nadu', correct: true, why: 'Yes! Hundreds of families in Manapparai make it the old way, and travellers take it home as a treat.' },
        ],
      },
      {
        id: 'travels',
        teach: 'Muruku travelled across the sea with Tamil families. Today people munch it in Sri Lanka, Malaysia, Singapore, Fiji and Myanmar.',
        q: 'Where else do people munch muruku?',
        choices: [
          { text: 'Only in Tamil Nadu', why: 'It travelled much further than that. Think across the sea.' },
          { text: 'In Malaysia, Singapore and Fiji', correct: true, why: 'Yes! Muruku travelled across the sea with Tamil families, to Sri Lanka, Malaysia, Singapore, Fiji and Myanmar.' },
          { text: 'Mostly in Europe', why: 'A few lucky shops, maybe. Think closer to India, across the sea.' },
        ],
      },
      {
        id: 'star-plate',
        type: 'picture',
        teach: 'Inside the wooden press goes the star plate. Its star-shaped hole gives every muruku its ridges.',
        q: 'Which plate makes muruku?',
        choices: [
          { art: 'plate-round', text: 'Round hole', why: 'That one makes a smooth, thin snack. Muruku has ridges.' },
          { art: 'plate-star', text: 'Star hole', correct: true, why: 'Yes! The star-shaped hole gives every muruku its ridges. You will need it when we cook.' },
          { art: 'plate-ribbon', text: 'Flat slit', why: 'That one makes flat ribbons. Muruku has ridges.' },
        ],
      },
      {
        id: 'make-order',
        type: 'order',
        teach: 'Making muruku has four big steps: mix the flours, knead a soft dough, twist it through the press, and fry it until golden.',
        q: 'Put the muruku steps in order.',
        items: ['Mix the flours', 'Knead the dough', 'Twist the spiral', 'Fry until golden'],
        why: 'That is the recipe! Mix the flours, knead a soft dough, twist it through the press, and fry until golden. You are ready for my kitchen.',
      },
    ],
  },
  ch4: {
    ask: 2,
    questions: [
      {
        id: 'shared',
        core: true,
        teach: 'At Deepavali, the jars of muruku go to family, neighbours and visitors. Sharing is the best part.',
        q: 'Who is muruku shared with?',
        choices: [
          { text: 'Only the family who made it', why: 'Family gets the first handful, but the jars travel much further.' },
          { text: 'Family, neighbours and visitors', correct: true, why: 'Yes. The jars go to family, neighbours and visitors. Sharing is the best part.' },
          { text: 'Only guests at a wedding', why: 'Weddings too, but at Deepavali the jars go much further.' },
        ],
      },
      {
        id: 'together',
        teach: 'Muruku takes hours to make. So grandparents, parents and children make it together, and stories are shared while the press turns.',
        q: 'Why do families often make muruku together?',
        choices: [
          { text: 'It must all be eaten the same day', why: 'Oh, it keeps for weeks. The reason is about time.' },
          { text: 'Each person adds a secret spice', why: 'A lovely idea, but no. Think about how long it takes.' },
          { text: 'It takes hours, so many hands help', correct: true, why: 'That is it. Muruku takes hours, so grandparents, parents and children make it together, and stories go round while the press turns.' },
        ],
      },
      {
        id: 'keeps',
        type: 'truefalse',
        teach: 'After frying, muruku has almost no water left. In a tightly closed jar it stays crunchy for weeks, so it can be made early and shared for days.',
        q: 'Muruku goes soft after one day, so it cannot be made early.',
        choices: [
          { text: 'True', why: 'Not at all, dear. Think of all those jars in the cupboard.' },
          { text: 'Not true', correct: true, why: 'Right! After frying there is almost no water left, so in a closed jar it stays crunchy for weeks. We make it early and share it all festival.' },
        ],
      },
      {
        id: 'open-house',
        teach: 'In Malaysia, many families hold an open house at Deepavali. Friends of every background drop in for muruku and sweets.',
        q: 'What is a Deepavali open house?',
        choices: [
          { text: 'A home where friends can drop in', correct: true, why: 'Yes! In Malaysia, many families open their doors, and friends of every background drop in for muruku and sweets.' },
          { text: 'A temple that stays open all night', why: 'Not a temple, dear. Think of a front door left open.' },
          { text: 'A market for new clothes', why: 'Not a market. It is a home, welcoming everyone.' },
        ],
      },
    ],
  },
};

// The ingredient each right answer earns, by question position (chapters 1 and 2 only).
export const REWARDS = {
  ch1: ['riceFlour', 'uradFlour', 'flour'],
  ch2: ['spices', 'ghee', 'water'],
};

// The six cooking steps. `full` is the journey instruction; `short` is the free-kitchen (and phone) hint;
// `chip` is the label in the step strip.
export const STEPS = [
  { id: 'add', title: 'Add', chip: 'Add', full: 'Drag each ingredient into the bowl in my order: rice flour, urad dal flour, flour, spices, then ghee. You can also tap them.', short: 'Same order as before: rice flour first.' },
  { id: 'water', title: 'Water', chip: 'Water', full: 'Hold the button to pour water. Let go when the meter is in the green zone.', short: 'Hold to pour. Stop in the green.' },
  { id: 'knead', title: 'Knead', chip: 'Knead', full: 'Rub the dough in circles until the ring is full. It should feel soft, like an earlobe.', short: 'Rub in circles until the ring is full.' },
  { id: 'fill', title: 'Fill the press', chip: 'Fill', full: 'Drag the dough into the wooden press, drag the plunger on top, then drag the star plate under the press.', short: 'Dough in, plunger on, star plate.' },
  { id: 'twist', title: 'Twist', chip: 'Twist', full: 'Press and hold Hold to twist, beside the pot, and watch the spiral grow from the middle. Or draw the spiral on the oil with your finger.', short: 'Hold the button, or draw a spiral.' },
  { id: 'fry', title: 'Fry', chip: 'Fry', full: 'Watch the colour. Flip it once, then lift it out when it is golden.', short: 'Flip once. Lift when golden.' },
];

// What Paati says in the quiz, the store and the kitchen. Kitchen lines are [full, short]: the free kitchen uses the
// short one. Functions fill in names. Every line goes through the voice-over hook (src/voice.js), so recordings can
// be added later; the speech bubble always shows the words.
const ORDINAL = ['first', 'second', 'third', 'fourth'];
export const QUIZ_LINES = {
  prompts: {
    choice: 'Take your time, dear. One answer. No pressure. Well, a little pressure.',
    truefalse: 'True, or not? Go with your gut.',
    picture: 'Look closely. One of these is the one.',
    order: 'Tap them in order, first to last. No skipping ahead.',
  },
  next: 'Here comes the next one.',
  orderWrong: (i) => `Patience, dear. Which comes ${ORDINAL[i]}?`,
  orderRight: (i) => `Good. And ${ORDINAL[i]}?`,
  tryAgain: 'Go on, have another look. Second guesses are allowed in my kitchen.',
};

export const STORE_LINES = {
  cook: 'Everything we need is right here. Roll up your sleeves.',
  some: (count) => `${count} of 6 on my shelves already. Not bad! Tap one to hear what it does.`,
  all: 'All six! My shelves have never looked so proud. Tap any of them to hear what it does.',
  fact: (fact) => `Did you know? ${fact}`,
};

export const COOK_LINES = {
  addStart: ['Let us start. Rice flour goes in first. It is the crunch, and the crunch is everything.', 'Rice flour first.'],
  addWrong: (expected) => [`Not yet, dear. The ${expected.name.toLowerCase()} comes first. ${expected.note}`, `${expected.name} comes next.`],
  addNext: (added, next) => [`${added.note} Next, the ${next.name.toLowerCase()}.`, `Next: ${next.name.toLowerCase()}.`],
  allIn: ['All in! It looks like snowfall. Now we bring it together with water.', 'All in!'],
  waterStart: ['Now water. Hold to pour, and let go in the green. Slowly, dear. Nobody can un-water dough.', 'Hold to pour. Stop in the green.'],
  // While pouring, Paati keeps up.
  pourGoing: ['Keep going…', 'Keep going…'],
  pourAlmost: ['Almost… almost…', 'Almost…'],
  pourStop: ['Stop! Just right.', 'Stop! Just right.'],
  pourTooMuch: ['Too much! Let go, let go!', 'Too much!'],
  // When the pour stops.
  waterLow: ['A little more, dear. This is muruku, not sand.', 'A little more.'],
  waterRight: ['Just right. Press Done pouring before you get ideas.', 'Just right.'],
  waterHigh: ['That is not dough, dear, that is soup. Never mind, we will knead it in.', 'That is a lot of water.'],
  kneadStart: ['Now knead. Rub the dough round and round in the bowl. Put some love into it.', 'Rub in circles.'],
  kneadDone: ['Soft like an earlobe. Go on, check yours. I will wait.', 'Soft and smooth.'],
  fillStart: ['Into the press it goes. Drag the dough into the wooden press.', 'Dough into the press.'],
  plunger: ['Now drag the plunger on top. Gently, it is older than you.', 'Plunger on top.'],
  plates: ['Now the plate. Which one makes muruku? Drag it under the press.', 'Drag the right plate under the press.'],
  plateWrong: ['Lovely snack, wrong day. Muruku needs ridges.', 'Not that one. Muruku needs ridges.'],
  plateRight: ['That is the one. The star plate gives muruku its ridges. Very professional.', 'Star plate on.'],
  twistStart: ['The oil is hot, so we keep our distance. Press and hold Hold to twist, beside the pot, or draw the spiral with your finger.', 'Hold the button, or draw a spiral.'],
  twistMore: ['Ooh, lovely. Keep going, or press Done twisting once your spiral is closed.', 'Done when it is closed.'],
  fryStart: ['Now we fry. Watch the colour, flip it once, and lift it out when it is golden. No wandering off.', 'Flip once. Lift when golden.'],
  flipNow: ['Golden underneath. Flip it now, before it gets a tan!', 'Flip now!'],
  flipped: ['Beautiful flip. Now keep an eye on the other side.', 'Flipped!'],
  liftNow: ['Golden all over. Lift it out now!', 'Lift it out!'],
  darkUnder: ['It is getting dark underneath. Flip it, flip it!', 'Getting dark!'],
  darkTop: ['It is getting dark, dear. Lift it out, quickly!', 'Getting dark!'],
};

// Paati asks one question at the start of five kitchen steps (not in the free kitchen). Right on the first try
// unlocks her tip for that step, which makes it a little easier; otherwise there's no tip, and no penalty.
// Each step's card text stays hidden until the question is answered, so it can't give the answer away.
export const COOK_QUESTIONS = {
  add: {
    q: 'Before we start: why does muruku dough get a spoonful of ghee?',
    choices: [
      { text: 'It helps the dough rise', why: 'Muruku never rises, dear. Think about how it feels to bite.' },
      { text: 'It makes muruku crisp, not hard', correct: true, why: 'Exactly. A little ghee keeps muruku crisp and tender, so it snaps instead of fighting back.' },
      { text: 'It stops the dough sticking to the press', why: 'Nice try, but the press is fine. Think about the bite.' },
    ],
    tip: 'I have numbered my jars for you. Do not tell the other cooks.',
  },
  water: {
    q: 'How should the water go into the flour?',
    choices: [
      { text: 'All at once, to save time', why: 'Fast is how soup happens. Think gentler.' },
      { text: 'A little at a time', correct: true, why: 'Yes. You can always add more water, but you can never take it out.' },
      { text: 'As much water as flour, cup for cup', why: 'That much makes soup. Think smaller, and slower.' },
    ],
    tip: 'The pitcher slows down near the green, so you can stop just right.',
  },
  knead: {
    q: 'How soft should muruku dough be?',
    choices: [
      { text: 'Firm, like clay', why: 'Too firm and it cracks in the press. Softer.' },
      { text: 'Runny, like pancake batter', why: 'Runny dough cannot hold a spiral. Firmer than that.' },
      { text: 'Soft, like your earlobe', correct: true, why: 'Yes! Soft and smooth, like an earlobe. Firm dough cracks, and runny dough slumps.' },
    ],
    tip: 'I will knead with you, so every circle counts for more.',
  },
  twist: {
    q: 'Where do you start the muruku spiral?',
    choices: [
      { text: 'In the middle, then round and out', correct: true, why: 'Yes, from the middle outwards, so each ring leans on the one before.' },
      { text: 'At the edge, then round and in', why: 'Then the middle gets crowded. Try it the other way round.' },
      { text: 'Anywhere, it does not matter', why: 'Oh, it matters. Think about which ring holds up which.' },
    ],
    tip: 'I drew a faint spiral on the oil. Follow it.',
  },
  fry: {
    q: 'When do you flip the muruku in the oil?',
    choices: [
      { text: 'As soon as it goes in', why: 'Then it is still raw underneath. Give it a moment.' },
      { text: 'Only once it turns dark brown', why: 'Dark brown is too far. Earlier than that.' },
      { text: 'When the underside turns golden', correct: true, why: 'Yes. Golden underneath, then flip. Your nose will tell you too.' },
    ],
    tip: 'I turned the heat down a touch, so golden lasts a little longer.',
  },
};
export const ASK_LINES = {
  intro: 'One question first. Get it right first time and I will share a tip.',
  eyebrow: 'PAATI ASKS',
  tipLabel: "PAATI'S TIP",
  noTipLabel: 'NOW YOU KNOW',
  noTip: 'No tip this time, but you will not forget it now.',
};

// The recipe card shows Paati's order now. The real scoop amounts must come from a trusted family recipe
// (open question 5) — placeholder ratios must not ship.
export const RECIPE_NOTE = 'Amounts will come from Paati\'s family recipe.';

export const RESULT_LINES = {
  3: { words: 'Perfect muruku', tone: 'success', line: 'Do not tell anyone, but that is better than mine.' },
  2: { words: 'Very good muruku', tone: 'success', line: 'Lovely! A little more practice and I will have to watch my back.' },
  1: { words: 'A good start', tone: 'warning', line: 'Every great cook has made a muruku like this. Most of them were me.' },
};

// Shown between muruku in the free kitchen. Never a quiz. src/quiz.js adds the bank's facts that were not asked.
export const EXTRA_FACTS = [
  'Most of India\'s fireworks are made in one town in Tamil Nadu, called Sivakasi.',
  'Deepavali is a public holiday in many countries, like India, Malaysia, Singapore, Sri Lanka, Mauritius, Fiji and Nepal.',
  'Diyas are little clay lamps. Many families fill them with sesame oil or ghee and a cotton wick.',
  'In many places Deepavali lasts five days, and each day has its own name and meaning.',
  'At Deepavali time, the Golden Temple in Amritsar glows with lamps for Bandi Chhor Divas.',
  'Many families wear bright new clothes on Deepavali and visit their elders for blessings.',
];

export const RECAP = [
  { title: 'Deepavali', text: 'A row of lights on the darkest night: lamps, kolam, and sharing with everyone, even the ants.' },
  { title: 'Muruku', text: 'Its name means twisted. Rice flour gives the crunch, because rice grows all over Tamil Nadu.' },
  { title: 'Together', text: 'It takes many hands and keeps for weeks, so families make it together and share the jars.' },
];

// The remembrance note at the very end (NoteScene). The day before Deepavali, many families set out the favourite
// foods of loved ones who have passed away (docs/quiz-research.md → "Remembering loved ones").
export const NOTE = {
  intro: 'The day before Deepavali, many families set out the favourite foods of loved ones who have passed away.',
  ask: 'It is a way of saying: I remember you. Is there someone you miss? Write them a note.',
  empty: 'Write a few words first, dear. Even just their name is enough.',
  rolling: 'Roll it up from the bottom, nice and snug.',
  tie: 'Now tie it with a string, so your words stay safe inside.',
  send: 'Our pigeon will carry it to them.',
  sent: 'It is on its way. Wherever they are, they know you remember them.',
  privacy: 'Your note is not saved or sent anywhere.',
  signoff: 'I remember you.',
};

export const FINALE = {
  offer: 'Will you offer your muruku to Paati?',
  thanks: 'Now the whole street gets a taste. Thank you for cooking with me, dear.',
  // After the offering: tap each jar to pass it on.
  share: 'Now we share. Tap each jar to pass it on.',
  shareLines: ['One for the neighbours.', 'One for the cousins.', 'And a few crumbs for the ants. Now everyone is fed.'],
  // Bonus for your heart: the page before the note for someone you miss.
  bonusRibbon: 'Bonus for your heart',
  bonusTitle: 'A note for someone you miss',
  bonusText: 'Write a few words to someone you miss, roll them up, and send them off with love.',
  // The last page: more muruku, or finish.
  choiceRibbon: 'Well done, dear!',
  choiceTitle: 'Make more muruku?',
  choiceText: 'In the free kitchen the store is always full, and I always have one more story.',
  goodbye: 'Come back any time, dear. The kitchen is always open.',
  safety: 'May contain sesame. Younger cooks need an adult near hot oil.',
};
