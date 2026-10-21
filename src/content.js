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

// Paati's short stories (about 30 seconds each). `paati` is the full-body pose shown beside the story.
// Chapters 1, 2 and 4 have no fixed lines: the story is the intro, then one line teaching each question Paati
// will ask (the `teach` lines in QUIZ_BANK), then the outro. src/quiz.js puts them together.
export const STORIES = {
  welcome: {
    paati: PAATI.proud,
    done: 'Let us begin',
    lines: [
      'Come in, dear, the kitchen is ready.',
      'I am Paati. Paati means grandmother.',
      'Today I will tell you about Deepavali, and we will make muruku together.',
      'Answer my questions and you will fill my store with ingredients. Then we cook!',
    ],
  },
  ch1: {
    paati: PAATI.teaching,
    done: 'Start the quiz',
    intro: 'Deepavali is the festival of lights. Let me tell you some things many people do not know.',
    outro: 'Did you catch all of that? Let us see what you remember!',
  },
  ch2: {
    paati: PAATI.teaching,
    done: 'Start the quiz',
    intro: 'Now, muruku! It is crunchy, a little salty, and shaped like a spiral.',
    outro: 'Now, my muruku questions. Each right answer puts an ingredient in my store.',
  },
  ch3: {
    paati: PAATI.teaching,
    done: 'Go to the Store',
    lines: [
      'Our store is full. Now we cook!',
      'Rice flour gives the crunch, urad dal flour makes it light, ghee makes it rich and spices give the taste.',
      'Then we fill the wooden press and twist the dough into a spiral over hot oil.',
      'We fry it until it is golden. In real life, hot oil can burn, so take great care. Younger cooks, ask an adult to help.',
    ],
  },
  ch4: {
    paati: PAATI.celebrating,
    done: 'Start the quiz',
    intro: 'Look at your muruku! You made it with your own hands.',
    outro: 'Now my last two questions, and then we celebrate.',
  },
};

// The six ingredients. `art` is a file in assets/art. Order matches the Store shelves.
export const INGREDIENTS = [
  { id: 'riceFlour', name: 'Rice flour', art: 'rice-flour', artScale: 1.25, note: 'Rice flour gives muruku its crunch.', colour: 0xfffdf7 },
  { id: 'uradFlour', name: 'Urad dal flour', art: 'urad-dal', artScale: 1.25, note: 'Urad dal flour adds flavour and makes it light.', colour: 0xf1e2c0 },
  { id: 'flour', name: 'Flour', art: 'flour-tin', note: 'A little flour helps the dough bind and stay soft.', colour: 0xf7f0e2 },
  { id: 'spices', name: 'Spices', art: 'spice-tin', note: 'Spices give the taste. Many families add sesame seeds too.', colour: 0xc8552a },
  { id: 'ghee', name: 'Ghee', art: 'ghee-jar', note: 'Ghee makes the muruku richer.', colour: 0xf2c14e },
  { id: 'water', name: 'Water', art: 'jar-clay', note: 'Water brings the dough together.', colour: 0x8cc4ea },
];

export const ingredient = (id) => INGREDIENTS.find((i) => i.id === id);

// Paati's order for step 1. Water has its own step.
export const ADD_ORDER = ['riceFlour', 'uradFlour', 'flour', 'spices', 'ghee'];

// The quiz bank. Paati teaches every answer in her story first (`teach`), then asks (`q`).
// Each chapter asks `ask` questions: the `core` ones every time, the rest picked at random (mixing formats, and
// never two from the same `group`), so a replay brings new facts.
// Formats (`type`): 'choice' (default, 3 choices), 'truefalse' (True / Not true), 'picture' (3 choices with `art`),
// 'order' (`items` listed in the right order; the game shuffles them). `why` is what Paati says after a choice,
// or after an order question is complete.
// Sources and reviewer notes for every fact: docs/quiz-research.md. All of it needs the cultural review.
export const QUIZ_BANK = {
  ch1: {
    ask: 3,
    questions: [
      {
        id: 'kolam-rice',
        core: true,
        teach: 'We draw the kolam at the door with rice flour, not chalk. Why? So ants and little birds get a meal too. Sharing starts at the doorstep!',
        q: 'Why is the kolam drawn with rice flour?',
        choices: [
          { text: 'So ants and birds can eat it too', correct: true, why: 'Yes! A rice-flour kolam is a little breakfast for ants and birds. Even the tiniest guests are fed.' },
          { text: 'Because it glows in the dark', why: 'Ha! Rice flour does not glow. Think about who comes to nibble it in the morning.' },
          { text: 'Because chalk is too heavy', why: 'Not that, dear. Remember the tiny visitors at the doorstep?' },
        ],
      },
      {
        id: 'name',
        teach: 'The word Deepavali means a row of lights. Deepa is a lamp, and avali is a row.',
        q: 'What does the word Deepavali mean?',
        choices: [
          { text: 'A row of lights', correct: true, why: 'That is it! Deepa means lamp and avali means row. A row of lamps!' },
          { text: 'A big birthday cake', why: 'Not cake, dear! Think of the lamps lined up at the door.' },
          { text: 'A new school year', why: 'No school in this word! It is all about lamps in a row.' },
        ],
      },
      {
        id: 'new-moon',
        type: 'truefalse',
        teach: 'Deepavali comes on a night with no moon at all, the darkest night of the month. That is why every little lamp shines so bright.',
        q: 'Deepavali comes on a night with a big, bright full moon.',
        choices: [
          { text: 'True', why: 'Not quite! The moon hides on Deepavali night. That is why every lamp matters so much.' },
          { text: 'Not true', correct: true, why: 'Right! There is no moon at all. On the darkest night, our lamps light up the whole street.' },
        ],
      },
      {
        id: 'oil-bath',
        group: 'morning',
        teach: 'In many Tamil homes, Deepavali begins before sunrise with a warm oil bath. Families call it a Ganga bath, as special as a dip in the holy Ganga river.',
        q: 'How do many Tamil families start Deepavali morning?',
        choices: [
          { text: 'With an oil bath before sunrise', correct: true, why: 'Yes! Up early, warm oil in the hair, a bath, and then new clothes.' },
          { text: 'By sleeping until lunchtime', why: 'Oh no, dear! Deepavali starts very early, before the sun is up.' },
          { text: 'With a swim in the sea', why: 'Not the sea. It is a warm oil bath at home, before sunrise.' },
        ],
      },
      {
        id: 'medicine',
        group: 'morning',
        teach: 'After the bath, many Tamil families eat a spoonful of Deepavali medicine, made with ginger, pepper and herbs. It gets tummies ready for all the sweets!',
        q: 'Why do many families eat a herbal paste on Deepavali morning?',
        choices: [
          { text: 'To help the tummy with all the sweets', correct: true, why: 'Exactly. A little medicine first, then sweets and muruku all day!' },
          { text: 'To make their hair grow longer', why: 'Not for hair, dear. It is for the tummy, before all the sweets.' },
          { text: 'To stay awake all night', why: 'Not that one. Think about all the sweets and snacks coming that day.' },
        ],
      },
      {
        id: 'morning-order',
        type: 'order',
        group: 'morning',
        teach: 'In many Tamil homes, Deepavali morning goes like this: a warm oil bath before sunrise, then a spoonful of Deepavali medicine, then new clothes and blessings from the elders.',
        q: 'Put a Tamil Deepavali morning in order.',
        items: ['Oil bath before sunrise', 'Deepavali medicine', 'New clothes and blessings'],
        why: 'Perfect! Bath, medicine, then new clothes and blessings. Now the day can begin!',
      },
      {
        id: 'narakasura',
        teach: 'Many families in South India tell how Krishna and Satyabhama defeated Narakasura. His last wish? That people remember the day with lamps and joy.',
        q: 'In that South Indian story, who wished for the day to be lit up?',
        choices: [
          { text: 'Narakasura himself', correct: true, why: 'Yes! Even at the very end, he asked for the day to be remembered with light.' },
          { text: 'A sleepy cat', why: 'Ha! No cats in this story. It was the one who was defeated.' },
          { text: 'Nobody, it was an accident', why: 'Not an accident. Someone made a last wish. Who was it?' },
        ],
      },
      {
        id: 'rama',
        teach: 'In North India, many families remember Rama, Sita and Lakshmana coming home to Ayodhya. People lit rows of lamps to light their way.',
        q: 'In the North Indian story, why were the lamps lit?',
        choices: [
          { text: 'To welcome Rama and Sita home', correct: true, why: 'Yes. Rows of lamps lit their way home on a dark night.' },
          { text: 'To scare away the rain', why: 'Not the rain, dear. Someone was coming home.' },
          { text: 'To find a lost shoe', why: 'Ha! Not a shoe. They were welcoming someone home.' },
        ],
      },
      {
        id: 'faiths',
        type: 'truefalse',
        teach: 'Deepavali is not only a Hindu festival. Jains remember Mahavira, and Sikhs celebrate Bandi Chhor Divas, the day Guru Hargobind was set free.',
        q: 'Only Hindus celebrate at Deepavali time.',
        choices: [
          { text: 'True', why: 'Not quite, dear. Jains and Sikhs celebrate too, each with their own story.' },
          { text: 'Not true', correct: true, why: 'Right! Jains remember Mahavira, and Sikhs celebrate Bandi Chhor Divas. Many people, the same lights.' },
        ],
      },
      {
        id: 'kolam-maths',
        teach: 'Some kolams are one long line that loops around the dots and never ends. Scientists have even studied kolams to teach computers to draw patterns!',
        q: 'What did scientists learn from kolam patterns?',
        choices: [
          { text: 'How to teach computers to draw', correct: true, why: 'Yes! Kolams from our doorsteps helped computer scientists. Isn\'t that something?' },
          { text: 'How to bake bread faster', why: 'Not bread, dear. Think of computers.' },
          { text: 'How to talk to ants', why: 'Ha! The ants just eat the kolam. Scientists used it for computers.' },
        ],
      },
      {
        id: 'turmeric',
        teach: 'In many homes, new Deepavali clothes get a tiny dab of turmeric on one corner, as a blessing, before anyone wears them.',
        q: 'What goes on a corner of new Deepavali clothes in many homes?',
        choices: [
          { text: 'A tiny dab of turmeric', correct: true, why: 'Yes. A little turmeric is a blessing for the new clothes.' },
          { text: 'A shiny sticker', why: 'Not a sticker. It is a yellow spice, as a blessing.' },
          { text: 'A little bell', why: 'Ha! No bells on clothes. It is a dab of a yellow spice.' },
        ],
      },
      {
        id: 'spot-diya',
        type: 'picture',
        teach: 'A diya is a little clay lamp with oil and a cotton wick. Rows of diyas glow in doorways and windows on Deepavali.',
        q: 'Which one is a diya?',
        choices: [
          { art: 'jar-clay', text: 'Clay pot', why: 'That is a clay pot for water. A diya is small, with a flame on top.' },
          { art: 'diya', text: 'Little lamp', correct: true, why: 'Yes! A little clay lamp with a glowing flame. That is a diya.' },
          { art: 'muruku-golden', text: 'Muruku', why: 'Ha! That one you can eat. Look for the little lamp with a flame.' },
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
          { text: 'Sweet', why: 'Not sweet. Muruku is crunchy and salty. Think about its shape.' },
          { text: 'Twisted', correct: true, why: 'Yes! Muruku means twisted, just like its shape.' },
          { text: 'Round', why: 'It is round, but the name means something else. How do we shape the dough?' },
        ],
      },
      {
        id: 'why-rice',
        core: true,
        teach: 'Why rice flour? Because rice grows all over Tamil Nadu. The Kaveri river lands around Thanjavur are even called the rice bowl of Tamil Nadu!',
        q: 'Why do so many Tamil snacks start with rice flour?',
        choices: [
          { text: 'Rice grows all over Tamil Nadu', correct: true, why: 'Yes! Rice is everywhere here, so it goes into our meals, our snacks and even our kolams.' },
          { text: 'Rice flour tastes like chocolate', why: 'Ha! I wish. It is because of what grows in our fields.' },
          { text: 'It is the only flour in the world', why: 'There are many flours, dear. Think about what grows all over Tamil Nadu.' },
        ],
      },
      {
        id: 'rice-plenty',
        teach: 'Rice also means plenty. Many families use rice in blessings, hoping their home will always have enough to share.',
        q: 'What does rice stand for in many blessings?',
        choices: [
          { text: 'Plenty, so there is always enough', correct: true, why: 'Yes. Rice is a wish that the home will always have enough to share.' },
          { text: 'A rainy day', why: 'Not the rain, dear. Think of a full pot of rice.' },
          { text: 'Bad luck', why: 'Oh no, the opposite! Rice is a happy wish for plenty.' },
        ],
      },
      {
        id: 'urad',
        teach: 'We mix in urad dal flour. Urad dal is a small black lentil that is white inside. It makes muruku light and tasty.',
        q: 'What is urad dal?',
        choices: [
          { text: 'A small black lentil', correct: true, why: 'Yes! Black outside, white inside, and full of flavour.' },
          { text: 'A kind of sugar', why: 'Not sugar. It is a little lentil, black on the outside.' },
          { text: 'A green leaf', why: 'Not a leaf, dear. It is a small lentil.' },
        ],
      },
      {
        id: 'hand',
        type: 'truefalse',
        teach: 'Some grandmothers twist muruku by hand, with no press at all! It is called hand muruku, and it takes years of practice.',
        q: 'Some muruku is twisted by hand, with no press at all.',
        choices: [
          { text: 'True', correct: true, why: 'True! It is called hand muruku. Only practised hands can do it. One day you will too.' },
          { text: 'Not true', why: 'It is true, dear! Skilled hands can twist muruku with no press at all.' },
        ],
      },
      {
        id: 'manapparai',
        teach: 'One town in Tamil Nadu, Manapparai, is famous for its muruku. Hundreds of families there make it, the old way.',
        q: 'Which town is famous for its muruku?',
        choices: [
          { text: 'Manapparai, in Tamil Nadu', correct: true, why: 'Yes! Many travellers take Manapparai muruku home as a treat.' },
          { text: 'London', why: 'Not London, dear. It is a town in Tamil Nadu.' },
          { text: 'The North Pole', why: 'Too cold for frying! It is a town in Tamil Nadu.' },
        ],
      },
      {
        id: 'travels',
        teach: 'Muruku travelled across the sea with Tamil families. Today people munch it in Sri Lanka, Malaysia, Singapore, Fiji and Myanmar.',
        q: 'Where else do people munch muruku?',
        choices: [
          { text: 'In Malaysia, Singapore and Fiji', correct: true, why: 'Yes! Muruku has travelled a long way.' },
          { text: 'Only on the Moon', why: 'Ha! Not the Moon. It travelled across the sea with Tamil families.' },
          { text: 'Nowhere else at all', why: 'Oh, it travelled far! I named many countries.' },
        ],
      },
      {
        id: 'star-plate',
        type: 'picture',
        teach: 'Inside the wooden press goes the star plate. Its star-shaped hole gives every muruku its ridges.',
        q: 'Which plate makes muruku?',
        choices: [
          { art: 'plate-round', text: 'Round hole', why: 'That one makes a smooth, thin snack. Muruku needs the star shape.' },
          { art: 'plate-star', text: 'Star hole', correct: true, why: 'Yes! The star hole gives muruku its ridges. You will use it when we cook.' },
          { art: 'plate-ribbon', text: 'Flat slit', why: 'That one makes flat ribbons. Muruku needs the star shape.' },
        ],
      },
      {
        id: 'make-order',
        type: 'order',
        teach: 'Making muruku has four big steps: mix the flours, knead a soft dough, twist it through the press, and fry it until golden.',
        q: 'Put the muruku steps in order.',
        items: ['Mix the flours', 'Knead the dough', 'Twist the spiral', 'Fry until golden'],
        why: 'That is the recipe! Mix, knead, twist, fry. You are ready for my kitchen.',
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
          { text: 'Nobody, it is kept secret', why: 'Oh no, dear! Muruku is made to be shared.' },
          { text: 'Family, neighbours and visitors', correct: true, why: 'Yes. The jars go to family, neighbours and visitors. Sharing is the best part.' },
          { text: 'Only the cook', why: 'The cook gets a taste, of course! But most of it is given away.' },
        ],
      },
      {
        id: 'together',
        teach: 'Muruku takes hours to make. So grandparents, parents and children make it together, and stories are shared while the press turns.',
        q: 'Why do families often make muruku together?',
        choices: [
          { text: 'So it is finished in one minute', why: 'It takes much longer than a minute! That is why many hands help.' },
          { text: 'Because it is a race', why: 'Not a race, dear. It takes a long time, so everyone helps.' },
          { text: 'It takes time, so many hands help', correct: true, why: 'That is it. Many hands, many stories, and a lot of muruku.' },
        ],
      },
      {
        id: 'keeps',
        type: 'truefalse',
        teach: 'After frying, muruku has almost no water left. In a tightly closed jar it stays crunchy for weeks, so it can be made early and shared for days.',
        q: 'Muruku goes soft after one day, so it cannot be made early.',
        choices: [
          { text: 'True', why: 'Not true, dear! In a closed jar it stays crunchy for weeks.' },
          { text: 'Not true', correct: true, why: 'Right! It stays crunchy for weeks, so we make it early and share it all festival.' },
        ],
      },
      {
        id: 'open-house',
        teach: 'In Malaysia, many families hold an open house at Deepavali. Friends of every background drop in for muruku and sweets.',
        q: 'What is a Deepavali open house?',
        choices: [
          { text: 'A home where friends can drop in', correct: true, why: 'Yes! Everyone is welcome, and nobody leaves without muruku.' },
          { text: 'A house with no roof', why: 'Ha! The roof stays on. It is the door that stays open.' },
          { text: 'A shop that sells lamps', why: 'Not a shop. It is a home that welcomes everyone.' },
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
  { id: 'fill', title: 'Fill the press', chip: 'Fill', full: 'Drag the dough into the wooden press, fit the plunger on top, then choose the star plate.', short: 'Dough in, plunger on, star plate.' },
  { id: 'twist', title: 'Twist', chip: 'Twist', full: 'Hold the press over the hot oil and draw a spiral, starting in the middle. Lift your finger to stop. Or hold the Hold to twist button.', short: 'Hold and draw a spiral from the middle.' },
  { id: 'fry', title: 'Fry', chip: 'Fry', full: 'Watch the colour. Flip it once, then lift it out when it is golden.', short: 'Flip once. Lift when golden.' },
];

// The recipe card shows Paati's order now. The real scoop amounts must come from a trusted family recipe
// (open question 5) — placeholder ratios must not ship.
export const RECIPE_NOTE = 'Amounts will come from Paati\'s family recipe.';

export const RESULT_LINES = {
  3: { words: 'Perfect muruku', tone: 'success', line: 'Very good! Even I could not do better.' },
  2: { words: 'Very good muruku', tone: 'success', line: 'Lovely! A little more practice and it will be perfect.' },
  1: { words: 'A good start', tone: 'warning', line: 'Every muruku teaches us something. Let us try again together.' },
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
  thanks: 'Now we can share this with the whole street. Thank you for cooking with me, dear.',
  more: 'Would you like to make more muruku with me?',
  goodbye: 'Thank you, dear. Come back any time. Happy Deepavali!',
  safety: 'May contain sesame. Younger cooks need an adult near hot oil.',
};
