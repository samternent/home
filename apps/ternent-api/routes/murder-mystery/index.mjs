import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const game = {
  title: "Grunge City Blues",
  plot: `In the heart of Seattle's grunge scene, the infamous music club, "The Sonic Temple," is the backdrop for a heinous crime. The club's owner, Johnny "Fuzz" Thompson, is found dead backstage, strangled with a guitar string. The gritty atmosphere and eclectic crowd provide the perfect setting for a murder mystery game that will keep players guessing until the final reveal.
As players step into the shoes of investigators, they must navigate through the world of 90s grunge, interviewing the club's regulars, from moody musicians to angsty groupies, each harboring their own secrets and motives. The grunge movement's rebellious and anti-establishment ethos adds an extra layer of complexity to the investigation, as the characters resist authority and are suspicious of outsiders.
Meanwhile, the club's neon-lit stage becomes the centerpiece for dramatic confrontations and shocking reveals, as players uncover hidden relationships, betrayal, and the dark underbelly of the grunge music scene. The game's plot delves into the struggles of the era, from drug addiction to the pressures of fame, drawing players into a web of deceit and intrigue.
As the night progresses, the tension builds, with red herrings and false leads heightening the suspense. Ultimately, players must rely on their wit and intuition to unmask the killer before they strike again, bringing justice to the brooding world of Grunge City Blues.`,
  location:
    "A run-down warehouse turned underground music club in Seattle, Washington during the 1990s grunge era.",
};
const characters = [
  {
    name: "Raven Wilder",
    role: "Lead Vocalist of 'Midnight Shadows'",
    description:
      "Raven Wilder, with an enigmatic presence and piercing gaze, embodies the essence of 90s grunge. As the lead vocalist of 'Midnight Shadows,' she exudes a raw intensity both on and off the stage. Her hauntingly soulful voice echoes the pain and rebellion of the era, captivating audiences with every performance.",
    background:
      "Born into a turbulent household marked by addiction, Raven found solace in music. She formed 'Midnight Shadows' with a desire to channel her inner turmoil into art. Despite her rising fame, Raven remains guarded, masking vulnerabilities with a cloak of aloofness.",
    personality:
      "Raven is fiercely independent, shrouding herself in an aura of mystery. Her interactions are often curt, revealing little beyond her stage persona. Beneath the tough exterior lies a complex soul burdened by personal demons and the weight of fame.",
    suspect_details:
      "Raven's strained relationships with bandmates and rumors of a tumultuous affair with Johnny 'Fuzz' Thompson, the club owner, paint her as a possible suspect. She's been spotted arguing passionately with Thompson backstage, fueling speculation about motives.",
    self_introduction:
      "Hey there. I'm Raven. The stage is where I feel most alive, where every lyric carries the weight of my truth. I'm the voice behind 'Midnight Shadows.' You might have heard our tunes blaring through the streets. Offstage, I'm just another soul trying to navigate this chaos called life. There's more beneath the surface than what meets the eye. But hey, who isn't hiding something in this gritty city, right?",
  },
  {
    name: "Max Harper",
    role: "Sardonic Bartender at 'The Sonic Temple'",
    description:
      "Max Harper, the sardonic bartender at 'The Sonic Temple,' embodies the grunge ethos with his disheveled appearance and piercing sarcasm. He's a fixture at the club, observing the drama unfold amidst the clinking of glasses and wafting cigarette smoke.",
    background:
      "Max hails from a nomadic background, finding refuge in Grunge City during the scene's heyday. He prefers to keep his past vague, a testament to his elusive nature.",
    personality:
      "Max is a cynic with a quick wit, often using sarcasm as a shield. His observations of the club's patrons and their tumultuous lives provide him with a unique perspective, yet he remains detached, wary of getting too involved.",
    suspect_details:
      "As an astute observer, Max has overheard numerous heated exchanges and secrets in the club. His sardonic comments and indifferent attitude have made him a person of interest. However, his aloofness might hide deeper insights into the club's underbelly.",
    self_introduction:
      "Evenin'. I'm Max. The one slingin' drinks and dispensing wisdom, or whatever passes for it around here. Been a part of this scene since it kicked off, watching the drama unfold from behind this bar. Some call me cynical, others call me insightful. Truth is, I'm just an observer, minding my own business while the world does its thing. You'll find me here most nights, ready to pour a shot and share a sardonic quip or two.",
  },
  {
    name: "Johnny 'Fuzz' Thompson",
    role: "Owner of 'The Sonic Temple'",
    description:
      "Known for his wild hair and eccentric attire, Johnny 'Fuzz' Thompson is the enigmatic owner of 'The Sonic Temple.' With an ear for emerging talent and a penchant for unpredictable behavior, he's a central figure in Grunge City's music scene.",
    background:
      "Fuzz's origins are shrouded in mystery, adding to his allure. Rumors abound about his unconventional rise to club ownership, lending an air of intrigue to his persona.",
    personality:
      "Unpredictable and charismatic, Fuzz is a magnet for controversy. His erratic decision-making has both fueled and fractured relationships within the club, leaving a trail of unresolved tension in his wake.",
    suspect_details:
      "Fuzz's mercurial nature has sown seeds of animosity among club regulars, making him a prime target for suspicion. Whispers of financial disputes and power struggles with the band members add fuel to the fire.",
    self_introduction:
      "Hey there, cats and kittens! I'm Johnny 'Fuzz' Thompson, the man behind the madness at 'The Sonic Temple.' If you're looking for a wild ride, you've come to the right place. I've seen it all, from rising stars to fallen angels. Life's too short for regrets, so let's make some noise and leave the ordinary behind!",
  },
  {
    name: "Mackenzie 'Mac' Rivers",
    role: "Rebellious Guitarist of 'Midnight Shadows'",
    description:
      "Mackenzie 'Mac' Rivers, the rebellious guitarist of 'Midnight Shadows,' epitomizes the angst and defiance of the grunge era. With a brooding intensity and a guitar that screams with raw emotion, Mac is a force to be reckoned with on and off the stage.",
    background:
      "Mac's tumultuous upbringing and battles with addiction are no secret. Music became the lifeline that pulled Mac from the brink, forging an unbreakable bond with the band and their shared struggle.",
    personality:
      "Fierce and unapologetic, Mac wears emotions like a battle scar. The inner demons that once threatened to consume are now channeled into music, a defiant roar against a world that seeks to crush individuality.",
    suspect_details:
      "Mac's history of volatile outbursts and clashes with Fuzz over creative control have painted a target on their back. The tension between Mac and Fuzz has escalated to the point of public confrontations, hinting at deeper resentments.",
    self_introduction:
      "Yo, what's up? I'm Mac, the one tearing up the stage with 'Midnight Shadows.' Life's a chaotic mess, and I'm just here to make some noise and survive another day. Yeah, I've got a past, we all do. But the music? That's the only truth I need.",
  },
  {
    name: "Harper Grayson",
    role: "Dedicated Sound Engineer at 'The Sonic Temple'",
    description:
      "Harper Grayson, the dedicated sound engineer at 'The Sonic Temple,' is a master of amplifying the raw energy of grunge music. With a keen ear for distortion and a meticulous approach to sound production, Harper is a vital part of the club's atmosphere.",
    background:
      "Harper's love for music and audio manipulation began in the underground punk scene, where the rebellious spirit of grunge took root. The transition to the grunge movement was a natural progression, fueling Harper's passion for capturing the essence of live performances.",
    personality:
      "Focused and meticulous, Harper's commitment to sonic perfection is unwavering. Despite a calm exterior, there's a fire within, a rebellious streak that resonates with the ethos of the grunge culture.",
    suspect_details:
      "Amidst the chaos of the club, Harper's meticulous nature and access to technical equipment make them a potential suspect. Lingering resentments over creative differences and disputes with Fuzz have caused tensions that bubble beneath the surface.",
    self_introduction:
      "Hey, I'm Harper. You'll find me behind the soundboard, sculpting the sonic landscape of 'The Sonic Temple.' The raw, unfiltered energy of grunge is what drew me in, and now, I'm here to make sure every riff and scream hits you like a tidal wave.",
  },
  {
    name: "Sage Mitchell",
    role: "Reclusive Lyricist of 'Midnight Shadows'",
    description:
      "Sage Mitchell, the reclusive lyricist of 'Midnight Shadows,' weaves haunting tales of despair and rebellion with pen and paper. Their introspective verses mirror the inner turmoil of a generation lost in the chaos of the grunge era.",
    background:
      "Sage's enigmatic nature extends beyond the stage, with a mysterious past that hints at a life marked by elusive experiences. Their lyrical prowess is fueled by a wellspring of emotions and untold stories.",
    personality:
      "Sage is a quiet observer, often retreating into the shadows of the club. Their introspective nature and deep empathy for human suffering make them a captivating, albeit enigmatic, presence.",
    suspect_details:
      "Sage's withdrawn demeanor and rumored clashes with Fuzz over the band's creative direction raise suspicions. Lingering tensions over songwriting credits and unresolved confrontations have cast a veil of doubt over Sage's intentions.",
    self_introduction:
      "Hello. I'm Sage. You might not notice me amidst the chaos, and that's alright. Words are my refuge, a solace in the storm. 'Midnight Shadows' is a canvas for the unspoken, and I'm here to paint it with the hues of our collective pain.",
  },
  {
    name: "Marcus Halifax",
    role: "Ambitious Music Promoter",
    description:
      "Marcus Halifax, the ambitious music promoter, exudes an air of confidence and ambition that fuels his relentless pursuit of success. With a keen eye for talent and a knack for negotiating deals, Marcus has carved a niche in the cutthroat world of grunge music.",
    background:
      "Marcus's rise in the music industry is marked by shrewd tactics and unwavering determination. His family's legacy in the business world serves as both a blessing and a burden, driving him to leave an indelible mark on the grunge scene.",
    personality:
      "Charismatic and driven, Marcus thrives on the thrill of negotiation and the rush of sealing lucrative deals. Beneath the veneer of charm lies a calculating mind that stops at nothing to achieve his goals.",
    suspect_details:
      "Rumors of a fraudulent deal orchestrated by the victim, tarnishing Marcus's family legacy, have cast a shadow of suspicion. Lingering animosity over lost opportunities and a desire for retribution paint Marcus as a potential threat.",
    self_introduction:
      "Good evening. I'm Marcus. The name in the spotlight, the voice behind the deals that make or break careers. The grunge scene is a jungle, and I'm the predator navigating its tangled undergrowth. You want success? You'll need me more than you realize.",
  },
  {
    name: "Archer Sterling",
    role: "Aloof Art Dealer",
    description:
      "Archer Sterling, the aloof art dealer, exudes an air of sophistication and mystery that sets him apart in the gritty world of Grunge City. With a discerning eye for valuable art pieces and an enigmatic aura, Archer commands attention wherever he goes.",
    background:
      "Archer's origins are veiled in secrecy, adding to his mystique. His foray into the grunge scene is an anomaly in the art world, a deliberate choice born of an insatiable thirst for unconventional beauty.",
    personality:
      "Aloof and enigmatic, Archer's demeanor hints at a world of untold stories. His passion for art is eclipsed only by his penchant for maintaining an impenetrable facade, concealing deeper motivations beneath a veneer of detachment.",
    suspect_details:
      "Past confrontations with the victim over the authenticity of a pricey painting have fueled rumors of a feud. The disputed artwork has become a focal point of the mystery, casting a shadow of doubt on Archer's intentions.",
    self_introduction:
      "Good evening. I'm Archer. Art is my domain, and Grunge City is my canvas. The collision of beauty and chaos is where I thrive. In a world of disarray, I am the curator of untold stories, the guardian of forgotten truths.",
  },
  {
    name: "Delilah 'Dell' Stone",
    role: "Fierce Music Journalist",
    description:
      "Delilah 'Dell' Stone, the fierce music journalist, wields words like weapons, dissecting the grunge scene with razor-sharp precision. With a relentless pursuit of truth and a penchant for stirring controversy, Dell is a force to be reckoned with in Grunge City's media landscape.",
    background:
      "Dell's incisive writing and unyielding dedication to uncovering the unvarnished reality behind the glitz and glamour of the music scene have made her both revered and reviled. Her uncompromising spirit is a double-edged sword that cuts through the veneer of pretense.",
    personality:
      "Unapologetic and unrelenting, Dell's ferocity knows no bounds. Her pursuit of the truth is unwavering, fueled by a burning desire to expose the underbelly of the industry and hold the powerful accountable.",
    suspect_details:
      "Dell's scathing exposés and incendiary articles have made her a target for backlash. Her unapologetic pursuit of truth and penchant for stirring controversy have earned her enemies within the club's inner circle, fueling suspicions of retaliation.",
    self_introduction:
      "Greetings. I'm Dell. Fearless wordsmith, relentless seeker of truth. The grunge scene is my canvas, and I paint it with the unvarnished reality. Behind the ink-stained curtains, I unravel the stories that the world dares not speak.",
  },
];

async function generateMurderMystery(theme, numberOfPlayers) {
  const messages = [
    {
      role: "system",
      content: `System Prompt: As a Murder Mystery Game Generator (using GPT-3.5-turbo-1106), your goal is to create an engaging and immersive plot for a murder mystery game tailored to the user's preferences. This includes developing character profiles, an intriguing setting, compelling motives, backstories, dramatic reveals, and an interactive gameplay structure.
Character Creation:
Craft a diverse ensemble of characters, drawing inspiration from familiar celebrity personas with modified names to prevent direct identification. Characters should encompass various professions, hobbies, and temperaments.
Example Character Profile:
{
  "name": "Raven Wilder",
  "role": "Lead Vocalist of 'Midnight Shadows'",
  "description": "Raven Wilder exudes the essence of 90s grunge, bearing an enigmatic presence and a captivating gaze. As the lead vocalist of 'Midnight Shadows,' her hauntingly soulful voice echoes the era's pain and rebellion, captivating audiences on and off stage.",
  "background": "Born into a turbulent household marked by addiction, Raven found solace in music. She formed 'Midnight Shadows' to channel her inner turmoil into art. Despite rising fame, she remains guarded, masking vulnerabilities with aloofness.",
  "personality": "Fiercely independent, Raven shrouds herself in mystery. Her interactions are often curt, revealing little beyond her stage persona. Beneath the tough exterior lies a complex soul burdened by personal demons and the weight of fame.",
  "suspect_details": "Raven's strained relationships with bandmates and rumors of a tumultuous affair with Johnny 'Fuzz' Thompson, the club owner, make her a possible suspect. She's been seen passionately arguing with Thompson backstage, fueling speculation about motives.",
  "self_introduction": "Hey there. I'm Raven, where every lyric I sing carries the weight of my truth. I'm the voice behind 'Midnight Shadows.' Offstage, I'm just navigating this chaotic city. There's more beneath the surface than meets the eye."
}
(Similarly, create profiles for other characters in a similar format.)
Setting:
Devise an opulent and enthralling venue mirroring the user’s intended party location or create an elaborate version of a familiar setting. Introduce the death circumstances of a significant fictional character who's not present at the event.
Example Setting:
The scene is set in Gathersby Mansion, a luxurious reinterpretation of the user’s home. It boasts secret passageways and a haunting back garden, the site of the unfortunate demise of Eleanor Von Rich, a renowned philanthropist.
Motive Development:
Develop distinct motives for each character, ranging from revenge and monetary gain to relationship entanglements and dark secrets, avoiding overly sensitive real-life references.
Example Motive:
Marcus Halifax seeks retribution for a fraudulent deal orchestrated by the victim, tarnishing his family’s legacy.
Backstory Creation:
Fabricate intricate backstories for characters, intertwining with the game's events to offer depth and potential motives. Include connections to the deceased and other characters, unveiling potential conspiracies or past conflicts.
Example Backstory Element:
Archer Sterling, an aloof art dealer, had past confrontations with the victim over the authenticity of a pricey painting, now a crucial piece of the mystery.
Gradual Revelation:
Strategically distribute information throughout the narrative, blending pivotal clues with red herrings to mislead players and maintain suspense.
Example Revelation Strategy:
In Act I, players discover a cryptic letter addressed to the victim from ‘A Concerned Party’, hinting at an explosive revelation in subsequent acts.
Game Mechanics:
Integrate scripts, evidence pieces, investigative questions, voting processes, and multiple rounds into an interactive gameplay structure to ensure participant engagement.
Example Gameplay Element:
Script: “Before Eleanor's death, Archer emphasized the disputed artwork's unquestionable provenance.”
Evidence: Present a counterfeit receipt for the artwork’s purchase.
Questions: Provide investigative cues like “Ask Archer about time discrepancies in his gallery’s ledger on the day of the purchase.”
Vote: At the end of each act, players cast suspicions, gaining points for correct early guesses.
Culprit Reveal:
Embed a subtle oversight within the murderer's narrative that could expose their façade if noticed by astute players.
Example Revealing Detail:
During a heated exchange, the murderer inadvertently mentions the precise poison that caused the victim’s demise—an undisclosed piece of information.
Output Format:
Provide a detailed narrative structure in an interactive playbook format, comprising character descriptions, gameplay instructions, introductory scenes, character introductions, scene scripts for each character (innocent and guilty versions), questions for each scene, and final reveal scripts for each character (innocent and guilty versions).`,
    },

    {
      role: "user",
      content: `Generate only a location, title and plot for a murder mystery game based on the theme "${theme}".`,
    },

    game.title && {
      role: "assistant",
      content: JSON.stringify(game),
    },
    game.title && {
      role: "user",
      content: `Generate ${numberOfPlayers} unique characters, with introduction scripts and possible connections to other game characters, based on the current game theme. Return these as an array of objects.`,
    },
    characters.length && {
      role: "assistant",
      content: JSON.stringify(characters),
    },
    characters.length && {
      role: "user",
      content: `Generate all of the scripts for Scene 1`,
    },
  ].filter(Boolean);
  return await openai.chat.completions.create({
    messages,
    model: "gpt-3.5-turbo-1106",
    temperature: 0.8,
  });
}

export default function murderMysteryRoutes(router) {
  router.post("/murder-mystery", async (req, res) => {
    const { theme, players } = req.body;

    const mystery = await generateMurderMystery(theme, players);

    return res.status(200).json(mystery);
  });
}
