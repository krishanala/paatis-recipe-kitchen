# Quiz research: Paati's facts and where they come from

**Paati asks first, then explains** (changed on 22 Oct 2026; before that she taught every answer in her story first). Each chapter draws from a **question bank** in [`src/content.js`](../src/content.js) (`QUIZ_BANK`):

- Paati's story for the chapter is a two-line hook that sets the scene without giving any answer away.
- A wrong answer gets a nudge that doesn't give the answer away, then **Try again**. The right answer gets the full explanation (the "fact" below).
- **Core** questions are asked every time. The rest are picked at random, so replaying the game brings new facts.
- In the free kitchen, the facts that weren't asked come back as Paati's in-between facts, along with a few extras.

| Chapter | Questions asked | In the bank | Always asked |
|---|---|---|---|
| 1 · What is Deepavali? | 3 | 12 | Why the kolam is drawn in rice flour |
| 2 · What is muruku? | 3 | 9 | What "muruku" means · Why rice flour |
| 4 · Why muruku at Deepavali? | 2 | 4 | Who muruku is shared with |

**Four question formats** keep the quiz lively. Each chapter tries to mix them:

| Format | What the player does | Questions |
|---|---|---|
| 3 choices | Picks one of three answers | Most questions |
| True or not? | Taps **True** or **Not true** | new-moon, faiths, hand, keeps |
| Tap the picture | Taps one of three drawings | spot-diya, star-plate |
| Put in order | Taps the items first to last; each gets its number, and a wrong tap gets a gentle hint | morning-order, make-order |

Questions in the same **group** are never asked together. The three Deepavali-morning questions (oil-bath, medicine, morning-order) form one group, so Paati doesn't teach the same morning twice.

**Writing rules followed** (from the [design brief](design-brief.md#accessibility-and-cultural-care)):

- The game is for every age, from young children to grandparents. Questions use simple words a young child can follow, and never talk down to adults.
- Wrong answers are gentle and point back to the story; nothing is shown in red.
- Facts that aren't universal say "many families".
- The text is English only, apart from names and places: Paati, muruku, kolam, urad dal, Deepavali, Narakasura, Manapparai, and so on.

**Status: draft.** Every fact below needs the cultural review by Tamil-speaking home cooks before launch. Notes on what to check closely are at the end.

---

## Chapter 1 · What is Deepavali?

| # | The fact (Paati explains it after you answer) | Answer | Why it's here | Sources |
|---|---|---|---|---|
| ★ kolam-rice | The kolam is drawn with rice flour so ants and little birds get a meal too. | So ants and birds can eat it too | The "why rice?" question. Hardly anyone knows a kolam is a meal for small creatures. | [Wikipedia: Kolam](https://en.wikipedia.org/wiki/Kolam) ("coarse rice flour… ants and birds"); Vijaya Nagarajan, [*Feeding a Thousand Souls*](https://india.oup.com/product/feeding-a-thousand-souls-women-ritual-and-ecology-in-india-an-exploration-of-the-kolam-9780197761137/) (Oxford University Press); [The Better India](https://thebetterindia.com/289974/kolam-rice-powder-traditional-wisdom-heritage-significance) |
| name | Deepavali means *a row of lights*: deepa = lamp, avali = row. | A row of lights | The name explains the festival. | [Wiktionary: Diwali](https://en.wiktionary.com/wiki/Diwali) (Sanskrit *dīpāvali*, "row of lights") |
| new-moon *(true or not)* | Deepavali falls on a night with no moon, the darkest night of the month. | "A big, bright full moon": **not true** | A surprising reason why the lamps matter. | [Wikipedia: Diwali](https://en.wikipedia.org/wiki/Diwali) (new moon, *amavasya*, in Ashvin or Kartika) |
| oil-bath | Many Tamil homes start Deepavali before sunrise with a warm oil bath, called a "Ganga bath". | With an oil bath before sunrise | A Tamil custom many people outside Tamil Nadu don't know. | [Wikipedia: Naraka Chaturdashi](https://en.wikipedia.org/wiki/Naraka_Chaturdashi); [SBS Tamil](https://www.sbs.com.au/language/tamil/en/article/from-oil-baths-to-sweets-and-fireworks-celebrating-deepavali-the-south-indian-way/kobjxxgum) |
| medicine | After the bath, many Tamil families eat a spoonful of "Deepavali medicine" (ginger, pepper, herbs) to help the tummy with all the sweets. | To help the tummy with all the sweets | A fun, little-known custom (*Deepavali marundhu* or *lehiyam*). | [India Currents](https://indiacurrents.com/?p=160719); [My Cooking Journey](https://www.mycookingjourney.com/?p=643); [Goya Journal](https://www.goya.in/blog/leigyam-a-herbal-remedy-for-the-excesses-of-deepavali-feasting) |
| narakasura | In a story told in South India, Krishna and Satyabhama defeat Narakasura, whose last wish is that the day be remembered with lamps and joy. | Narakasura, who was defeated | A twist most people haven't heard. | [Time Out Kuala Lumpur](https://www.timeout.com/kuala-lumpur/things-to-do/deepavali-in-malaysia-the-myths-and-real-stories-behind-its-celebrations); [Sri Sathya Sai Balvikas](https://sssbalvikas.in/kn/lessons/significance-of-deepavali-kn/); [Wikipedia: Naraka Chaturdashi](https://en.wikipedia.org/wiki/Naraka_Chaturdashi) |
| rama | In North India, many families remember Rama, Sita and Lakshmana coming home to Ayodhya, with lamps lighting their way. | To welcome Rama and Sita home | Shows that different regions tell different stories. | [Wikipedia: Diwali](https://en.wikipedia.org/wiki/Diwali); [Science Museum blog](https://blog.sciencemuseum.org.uk/happy-diwali/) |
| faiths *(true or not)* | Jains remember Mahavira; Sikhs celebrate Bandi Chhor Divas, when Guru Hargobind was set free. | "Only Hindus celebrate": **not true** | Deepavali belongs to more than one faith. | [Wikipedia: Diwali](https://en.wikipedia.org/wiki/Diwali); [Religion News Service](https://religionnews.com/2019/10/18/more-than-1-billion-people-celebrate-on-diwali-what-does-it-mean-to-them/) |
| kolam-maths | Some kolams are one endless line looping around the dots, and scientists studied kolams to teach computers to draw patterns. | Ways to teach computers to draw | A "wow" fact. Gift Siromoney's "kolam array grammars" grew out of studying kolams. | [Chennai Mathematical Institute: Gift Siromoney's kolam work](https://www.cmi.ac.in/gift/Kolam/kola_pattern.htm); [Wikipedia: Kolam](https://en.wikipedia.org/wiki/Kolam) |
| turmeric | In many homes, new Deepavali clothes get a tiny dab of turmeric on one corner as a blessing. | A tiny dab of turmeric | A small, warm family detail. | [Women's Web](https://womensweb.in/?p=82838); [Little Day Out](https://www.littledayout.com/interesting-things-to-know-about-deepavali/) |
| morning-order *(put in order)* | A Tamil Deepavali morning: an oil bath before sunrise, then Deepavali medicine, then new clothes and blessings from elders. | Oil bath → medicine → new clothes and blessings | Puts the morning customs together as a sequence. | Same sources as oil-bath and medicine; [Hindutone: Diwali in Chennai](https://hindutone.com/festivals/diwali-celebrations-in-chennai-tamil-nadu-india-2026-a-complete-guide/) (new clothes and elders' blessings after the bath) |
| spot-diya *(tap the picture)* | A diya is a little clay lamp with oil and a cotton wick. | The little lamp | Lets younger players answer with a picture. | [Wikipedia: Diya](https://en.wikipedia.org/wiki/Diya_(lamp)) |

## Chapter 2 · What is muruku?

| # | The fact (Paati explains it after you answer) | Answer | Why it's here | Sources |
|---|---|---|---|---|
| ★ twisted | *Muruku* means twisted, after how the dough is shaped. | Twisted | The name explains the snack. | [Wikipedia: Murukku](https://en.wikipedia.org/wiki/Murukku) (Tamil *muṟukku*, "twisting") |
| ★ why-rice | Rice grows all over Tamil Nadu, and the Kaveri delta around Thanjavur is called "the rice bowl of Tamil Nadu". | Rice grows all over Tamil Nadu | Answers "why rice?" | [Wikipedia: Thanjavur district](https://en.wikipedia.org/wiki/Thanjavur_district); [Anna University: Cauvery Delta Zone](https://www.annauniv.edu/cccdm/ccis/cauverydelta.html) |
| rice-plenty | Rice also means plenty; many families use rice in blessings, hoping the home always has enough. | Plenty, so there is always enough | The meaning of rice, not just the crop. | [Wikipedia: Religious significance of rice in India](https://en.wikipedia.org/wiki/Religious_significance_of_rice_in_India) |
| urad | Urad dal is a small black lentil that is white inside; it makes muruku light and tasty. | A small black lentil | Many children (and adults) have never seen urad dal whole. | [Wikipedia: Murukku](https://en.wikipedia.org/wiki/Murukku); the "flavour and lightness" role is from the design brief |
| hand *(true or not)* | Some grandmothers twist muruku by hand with no press, called "hand muruku" (*kai muruku*), and it takes years of practice. | "Some muruku is twisted by hand": **true** | Celebrates the skill. | [Wikipedia: Murukku](https://en.wikipedia.org/wiki/Murukku) (*kai murukku*, made by hand) |
| manapparai | Manapparai, a town in Tamil Nadu, is famous for its muruku; hundreds of families make it there. | Manapparai, in Tamil Nadu | A real place with a GI-registered muruku (registered 2023). | [Wikipedia: Manapparai Murukku](https://en.wikipedia.org/wiki/Manapparai_Murukku); [Onmanorama](https://onmanorama.com/food/features/2022/06/16/manapparai-tamil-nadus-murukku-village.html) ("more than 300 families") |
| travels | Muruku travelled with Tamil families to Sri Lanka, Malaysia, Singapore, Fiji and Myanmar. | In Malaysia, Singapore and Fiji | Shows how far the snack has travelled. | [Wikipedia: Murukku](https://en.wikipedia.org/wiki/Murukku) |
| star-plate *(tap the picture)* | The star plate in the press has a star-shaped hole that gives muruku its ridges. | The star hole | Gets players ready for the Cook step. | Design brief (the press and its star plate); [Wikipedia: Murukku](https://en.wikipedia.org/wiki/Murukku) (extruded through a mould) |
| make-order *(put in order)* | Four big steps: mix the flours, knead a soft dough, twist it through the press, fry until golden. | Mix → knead → twist → fry | A preview of chapter 3. | Design brief (Making the muruku); [Wikipedia: Murukku](https://en.wikipedia.org/wiki/Murukku) |

## Chapter 4 · Why muruku at Deepavali?

| # | The fact (Paati explains it after you answer) | Answer | Why it's here | Sources |
|---|---|---|---|---|
| ★ shared | The jars go to family, neighbours and visitors; sharing is the best part. | Family, neighbours and visitors | The heart of the brief. | Design brief |
| together | Muruku takes hours, so generations make it together and share stories. | It takes hours, so many hands help | The heart of the brief. | Design brief |
| keeps *(true or not)* | After frying, muruku has almost no water left, so in a closed jar it stays crunchy for weeks: make it early, share it for days. | "It goes soft after one day": **not true** | Explains *why muruku* is a festival snack. | Recipe storage guidance: [Spicy Indian Kitchen](https://spicyindiankitchen.com/murukku-recipe-2/), [Easy Indian Cookbook](https://easyindiancookbook.com/butter-murukku/) (2–3 weeks airtight) |
| open-house | In Malaysia, many families hold a Deepavali open house where friends of every background drop in for muruku and sweets. | A home where friends can drop in | Sharing beyond the street. | [Sunday Observer](https://archives.sundayobserver.lk/2002/11/03/fea19.html) (muruku "a traditional must" in Malaysia); [The Sun Malaysia](https://thesun.my/malaysia-news/harmonious-joyful-and-vibrant-celebration-of-festival-of-lights-nationwide-HC13226032) |

## Wrong answers

Wrong choices are meant to be believable, so the question makes you think: "It shows up brighter than chalk", "Mysuru, in Karnataka", "Firm, like clay". They are never silly, and never a dig at a tradition. Each wrong answer has its own nudge, which points the way without giving the answer away.

## Questions in the kitchen

Paati asks one question at the start of five cooking steps (not in the free kitchen). Right first time unlocks her tip for that step, which makes it a little easier. Otherwise there's no tip, and no penalty. The step's instructions stay hidden until the question is answered.

| Step | Question | Answer | Paati's tip if right first time | Source |
|---|---|---|---|---|
| Add | Why does muruku dough get a spoonful of ghee? | It makes muruku crisp, not hard | The jars (shuffled) are numbered in her order | Common muruku recipe guidance (a little hot ghee or butter for crispness). Needs a home cook's confirmation |
| Water | How should the water go into the flour? | A little at a time | The pitcher slows down near the green zone | Common recipe guidance. Needs confirmation |
| Knead | How soft should muruku dough be? | Soft, like your earlobe | Each circle counts for more | Design brief ("soft like an earlobe") |
| Twist | Where do you start the muruku spiral? | In the middle, then round and out | A faint guide spiral on the oil | Common recipe guidance. Needs confirmation (some families may start differently) |
| Fry | When do you flip the muruku in the oil? | When the underside turns golden | Golden lasts a little longer | Design brief (flip once, lift when golden) |

## Extra facts in the free kitchen (never quizzed)

| Fact | Sources |
|---|---|
| Most of India's fireworks are made in one town in Tamil Nadu, Sivakasi. | [Lok Sabha answer (about 90%)](https://eparlib.nic.in/bitstream/123456789/624334/1/125230.pdf); estimates range from 75% to 95% |
| Deepavali is a public holiday in many countries (India, Malaysia, Singapore, Sri Lanka, Mauritius, Fiji, Nepal…). | [Wikipedia: Diwali](https://en.wikipedia.org/wiki/Diwali) |
| Diyas are clay lamps, filled by many families with sesame oil or ghee and a cotton wick. | [Wikipedia: Diya](https://en.wikipedia.org/wiki/Diya_(lamp)); [Malaysia Airlines Going Places](https://goingplaces.malaysiaairlines.com/deepavali-crafts-traditions/) |
| In many places Deepavali lasts five days, each with its own name. | [Wikipedia: Diwali](https://en.wikipedia.org/wiki/Diwali) |
| The Golden Temple in Amritsar is lit with lamps for Bandi Chhor Divas. | [Read The Spirit](https://readthespirit.com/religious-holidays-festivals/?p=4548) |
| Many families wear bright new clothes and visit their elders for blessings. | [Hindutone: Diwali in Chennai](https://hindutone.com/festivals/diwali-celebrations-in-chennai-tamil-nadu-india-2026-a-complete-guide/) |

## Remembering loved ones (no longer in the game)

Not a quiz question. Paati shared this fact on the note screen at the end, where the player wrote a note for someone they miss. The note screen and its Bonus for your heart page were taken out on 27 Oct 2026; the research stays here in case they come back.

| Fact | Sources |
|---|---|
| The day before Deepavali, many families set out the favourite foods of loved ones who have passed away, as a way of saying "I remember you". | [Goya: the remembrance offering in the Tamil community](https://www.goya.in/blog/padayal-in-the-tamil-community); [Goya: in the Tamil Singapore community](https://www.goya.in/blog/padayal-in-the-tamil-singapore-community); [HinduPad](https://hindupad.com/padayal/); [TheSmartLocal: Deepavali celebrations](https://thesmartlocal.com/read/deepavali-celebrations/) |
| Some families also see Deepavali's lamps and fireworks as lighting the way for the ancestors as they return. Not used in the game, but it fits the firecrackers. | [Malay Mail, 20 Oct 2025](https://malaymail.com/news/life/2025/10/20/not-just-for-merry-making-fireworks-on-deepavali-is-actually-a-traditional-hindu-farewell-ritual-for-ancestors/195108) |

The game uses no Tamil word for the offering, and it doesn't describe the ritual in detail (new clothes, prayers, who eats the food afterwards), because practice varies a lot between families.

## Left out on purpose

- **Health claims about diyas** ("ghee lamps purify the air"). Sources gave no evidence.
- **"The star plate's ridges make muruku crisper".** No reliable source was found. Paati only says the plate "gives muruku its ridges".
- **Why Manapparai muruku tastes special (its water).** It's a local saying with no source found.
- **Thalai Deepavali** (a newly married couple's first Deepavali). It's lovely, but it's about one couple rather than the whole family's Deepavali.
- **Exact Deepavali 2026 date.** Sources disagree between 7 and 8 November for Tamil Nadu, depending on the panchang (open question 8).

## For the cultural reviewers

Please check these closely:

1. **Religious stories** (narakasura, rama, faiths). Is the wording respectful and accurate, and right for every age, from young children to grandparents? Narakasura's "last wish" comes from popular retellings, not one fixed text, so the line says "many families in South India tell…".
2. **"Ganga bath"** for the pre-dawn oil bath. Is this how your families say it in English?
3. **Deepavali medicine.** Is "Deepavali medicine" a good English name for *marundhu* or *lehiyam*? Is "ginger, pepper and herbs" a fair short description?
4. **Turmeric on new clothes.** This varies by family. Keep it, or drop it?
5. **Rice as "plenty".** Is this the right way to describe the blessing?
6. **Urad dal "makes muruku light".** This comes from the brief and needs a home cook's confirmation.
7. **Distractors** (the silly wrong answers). Make sure none could be read as mocking a tradition.
8. **Paati's humour** (stories, store, kitchen, results). The jokes are on Paati, the food or the moment, never on the player or the tradition. Do any land wrong in your families, or read as unkind to grandparents? For example: "Shoes off, appetite on.", "Older cooks, call your common sense.", "Nobody can un-water dough." and "Most of them were me."
9. **The new wrong answers and the kitchen questions.** Is each wrong answer believable but clearly wrong once explained? Check especially "A new year" (some families do start a new year around Deepavali, so the nudge says so), "Wheat does not grow in India", Mysuru and Kolkata for the muruku town, and "At the edge, then round and in" for the spiral. Are the ghee, water and spiral answers true to how your families make muruku?
