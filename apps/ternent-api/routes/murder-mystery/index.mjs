import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "had to delete that key",
});

async function generateMurderMystery(numberOfPlayers) {
  return await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `System Prompt:You are a Murder Mystery Game Generator:
Objective: Generate a comprehensive plot for a murder mystery game tailored to the specifics provided by the user, integrating their personal context, setting preferences, cast compilation, character motives, and backstories, dramatic reveals, game mechanics, and suspenseful storytelling devices.
Guidelines for Output:
1. Cast Assembly: Create a diverse ensemble of 6-8 characters, drawing inspiration from either real-life attributes of the user's acquaintances or well-known celebrity personas with altered names to prevent direct identification. Characters should represent a range of professions, hobbies, and temperaments.
Example:
- Jocelyn Marksmen, an adventurous travel blogger known for her high-stakes expeditions, derived from one of the user's daring friends.
- Rock Blare, a charismatic rock star renowned for extravagant public escapades, based on a famous celebrity.
2. Scene Setting: Devise an opulent and exciting venue that mirrors the user's intended party location, or invent a grandiose version of a familiar setting. Include the death circumstance of a non-attendee, a fictional character of significance.
Example:
- The scene is set in Gathersby Mansion, a luxurious reinterpretation of the user's own home, with secret passageways and a haunting back garden, where the unfortunate demise of a renowned philanthropist, Eleanor Von Rich, has occurred.
3. Motive Assignment: Craft unique motives for each character, varying from revenge and monetary gain to relationship entanglements and dark secrets, steering clear of overly sensitive real-life allusions.
Example:
- Marcus Halifax may seek retribution for a fraudulent deal orchestrated by the victim, who tarnished his family's legacy.
4. Backstory Development: Fabricate rich histories for the characters that coincide with the events of the game, offering depth and potential motives. These stories might include connections to the deceased and other characters, elucidating potential conspiracies or past conflicts.
Example:
- Archer Sterling, the aloof art dealer, may have had past confrontations with the victim over the authenticity of a pricey painting, now a crucial piece of the mystery.
5. Gradual Reveal Strategy: Pace the distribution of information throughout the narrative, interspersing pivotal clues with red herrings to mislead players, and maintaining suspense.
Example:
- In Act I, players discover a cryptic letter addressed to the victim from 'A Concerned Party', hinting at an explosive revelation to be unveiled in subsequent acts.
6. Game Mechanics: Integrate scripts, evidence pieces, investigative questions, voting processes, and repeat rounds into an interactive game structure, ensuring participant engagement at every stage.
Example:
- Script: "Before the untimely death of Eleanor, Archer made sure everyone knew the value of the disputed artwork, declaring its provenance unquestionable."
- Evidence: Present a counterfeit receipt for the artwork's purchase.
- Questions: Provide cues, e.g., "Ask Archer about the time discrepancies in his gallery's ledger on the day of the purchase."
- Vote: At the end of each act, players cast their suspicions, accumulating points for correct early guesses.
7. Culprit Reveal: Incorporate a subtle oversight or inconsistency within the murderer's narrative that could unravel their façade if noticed by sharp players.
Example:
- During a heated exchange, the murderer, inadvertently and exclusively, mentions the precise type of poison that caused the victim's demise—an information not publicly disclosed.
Output Format: Provide a detailed narrative structure in an interactive playbook format. The sections are:
**Character descriptions**
**Gameplay Instructions**
**Introductory Scene Setting Script for each scene (To be read by the narrator)**
**Character Introduction Scripts**
**Scene 1 Scripts for each character with two versions - one if they are the murderer and the other if they are innocent.**
**Scene 1 Questions Script for each character with two questions to be asked to this charcter from any other player. Each question should have two answer - one if they are the murderer and the other if they are innocent**
**Scene 2 Scripts for each character with two versions - one if they are the murderer and the other if they are innocent.**
**Scene 2 Questions Script for each character with two questions to be asked to this charcter from any other player. Each question should have two answer - one if they are the murderer and the other if they are innocent**
**Scene 3 Scripts for each character with two versions - one if they are the murderer and the other if they are innocent.**
**Scene 3 Questions Script for each character with two questions to be asked to this charcter from any other player. Each question should have two answer - one if they are the murderer and the other if they are innocent**
**Final Reveal Scripts for each character with two versions - one if they are the murderer and the other if they are innocent.**`,
      },
      {
        role: "user",
        content: `Generate a murder mystery storyline based on the theme "grunge 90s" for a group of ${numberOfPlayers} players. Create a diverse ensemble of characters, each with unique backgrounds, motives, and connections to the victim. Develop a compelling plot with clues, red herrings, and a gradual reveal of the murderer. Include a dramatic setting that enhances the theme and provides an engaging backdrop for the mystery. The narrative should involve interactive elements, investigative elements, and opportunities for player engagement throughout the storytelling process.`,
      },

      {
        role: "assistant",
        content: `**Character Descriptions**\n\n1. **Kurt Flannel** - A grizzled, passionate musician known for his soulful lyrics and rebellious attitude. Kurt has seen the rise and fall of many bands and has a penchant for speaking out against commercialism in the music industry.\n\n2. **Violet Chains** - The enigmatic frontwoman of a popular grunge band, whose haunting vocals and mysterious demeanor have always set her apart. She has been both a rival and a collaborator with other musicians in the scene.\n\n3. **Laney Strokes** - A renowned music journalist who has been documenting the grunge scene since its inception. Her articles are sharp, often stirring up controversy among the artists she writes about.\n\n4. **Eddie Wax** - A record store owner with an encyclopedic knowledge of grunge music and a collection of rare demo tapes. His store is a hub for musicians and fans alike.\n\n5. **Rex Spinner** - A charismatic yet shady music producer known for his golden touch in turning grunge bands into commercial successes, much to the chagrin of purists.\n\n6. **Trixie Pix** - The ultimate grunge fan and groupie, known for following bands on tour and being privy to the inner workings and scandals of the music world.\n\n7. **Dean Stomp** - The talented but volatile drummer of a band that recently broke up due to creative differences. His temper is as legendary as his drum solos.\n\n8. **Skye Blue** - A visual artist and music video director who helped define the aesthetic of the grunge era with her gritty and raw style.\n\n**Gameplay Instructions**\n\n- The game is played in 4 scenes, with each player embodying one of the eight characters.\n- At the beginning of each scene, players will receive their character scripts for that round.\n- Players should keep their motives and connections to the victim a secret while trying to uncover the same about others.\n- Each scene will have investigative elements such as questions that players must answer.\n- At the end of each scene, players will discuss and vote on who they suspect to be the murderer.\n- The game facilitator will keep track of points for correct guesses and lead the narrative.\n\n**Introductory Scene Setting Script (To be read by the narrator)**\n\n"Welcome to \'The Grungy Truth,\' a tale of music, passion, and betrayal. It\'s 1994 in Seattle, the heart of the grunge movement. The air is thick with the scent of rain and rebellion. Our story unfolds at \'The Broken Guitar,\' an iconic yet dilapidated venue known for launching the careers of the most legendary grunge bands. But tonight, the venue is a crime scene. The body of Chris Ring, a beloved but controversial rock icon, has been found backstage, lifeless, clutching a torn concert flyer. The cause of death is unclear, and everyone is a suspect. As the night progresses, secrets will unravel, and it will be up to you to sift through the lies to uncover the truth."\n\n**Character Introduction Scripts**\n\n(Each player will read their character\'s introduction in the first round.)\n\n1. **Kurt Flannel**: "I\'m Kurt Flannel, and my music tells no lies. Chris was a brother in strings, but he sold out, man. He turned his back on what we started, and that\'s something I can\'t easily forgive."\n\n2. **Violet Chains**: "Violet Chains, at your service. I pour my soul into every chord. Chris and I? We had our moments, both on and off the stage. There was love, and there was hate. It\'s complicated."\n\n3. **Laney Strokes**: "The name\'s Laney Strokes. My words cut deeper than any guitar riff. I knew Chris, the man behind the myth. I knew his virtues and his vices. Perhaps a little too well."\n\n4. **Eddie Wax**: "Eddie Wax here, always spinning the real classics. Chris used to come around, looking for the pure stuff. Lately, though, he wanted something else from my shop. Something... hush-hush."\n\n5. **Rex Spinner**: "Rex Spinner. I\'m the guy who can make you or break you. Chris... he was on the verge of something new, something big. But was he going solo? That\'s the million-dollar question."\n\n6. **Trixie Pix**: "Call me Trixie Pix, the heart of the scene. I follow the music, the bands, the drama. Chris? Yeah, we shared some wild times. He confided in me more than most."\n\n7. **Dean Stomp**: "Dean Stomp. You\'ve felt my beats. Chris and I, we had some unfinished business after the band split. He said it was artistic differences. I say it was betrayal."\n\n8. **Skye Blue**: "Skye Blue, visionary behind the camera. My videos made Chris a star. But fame changes people. He changed, and not for the better. Conflict? Sure, we had it."\n\n**Scene 1 Scripts for each character**\n\n(To be distributed for Scene 1. Each character has two versions of their script, one if they are the murderer and one if they are innocent. This part will be provided if requested due to length constraints.)\n\n**Scene 2 Scripts for each character**\n\n(To be distributed for Scene 2. Each character has two versions of their script, one if they are the murderer and one if they are innocent. This part will be provided if requested due to length constraints.)\n\n**Scene 3 Scripts for each character**\n\n(To be distributed for Scene 3. Each character has two versions of their script, one if they are the murderer and one if they are innocent. This part will be provided if requested due to length constraints.)\n\n**Final Reveal Scripts for each character**\n\n(To be read in the final round. Each character has two versions of their script, one if they are the murderer and one if they are innocent. This part will be provided if requested due to length constraints.)`,
      },
      {
        role: "user",
        content: `Can I have the next steps now`,
      },
    ],
    model: "gpt-4-1106-preview",
    temperature: 0.7,
  });
}

export default function murderMysteryRoutes(router) {
  router.get("/murder-mystery", async (req, res) => {
    const mystery = await generateMurderMystery(8);
    return res.status(200).send(mystery);
  });
}
