const KB = require("../utils/keyboards");
const { rand, pickRandom } = require("../utils/helpers");

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything! 😂",
  "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
  "I told my wife she was drawing her eyebrows too high. She looked surprised. 😳",
  "Why don't eggs tell jokes? They'd crack each other up! 🥚",
  "What do you call a fake noodle? An impasta! 🍝",
  "I'm reading a book about anti-gravity. It's impossible to put down! 📚",
  "Why did the bicycle fall over? It was two-tired! 🚲",
  "What do you call cheese that isn't yours? Nacho cheese! 🧀",
  "I asked the librarian if they had books about paranoia. She whispered: 'They're right behind you!' 👀",
  "Why can't you give Elsa a balloon? Because she'll let it go! ❄️",
];
const QUOTES = [
  "\"The only way to do great work is to love what you do.\" — Steve Jobs",
  "\"In the middle of every difficulty lies opportunity.\" — Albert Einstein",
  "\"It does not matter how slowly you go as long as you do not stop.\" — Confucius",
  "\"You miss 100% of the shots you don't take.\" — Wayne Gretzky",
  "\"Whether you think you can or you think you can't, you're right.\" — Henry Ford",
  "\"The best time to plant a tree was 20 years ago. The second best time is now.\" — Chinese Proverb",
  "\"Success is not final, failure is not fatal: courage to continue is what counts.\" — Churchill",
];
const FACTS = [
  "🐝 Honey bees can recognize human faces.",
  "🦈 Sharks are older than trees — they've been around for 450 million years.",
  "🧠 Your brain generates enough electricity to power a small light bulb.",
  "🐙 Octopuses have three hearts and blue blood.",
  "🦋 A group of flamingos is called a 'flamboyance'.",
  "🌍 A day on Venus is longer than a year on Venus.",
  "🥑 Avocados are technically berries!",
  "🐧 Penguins propose to their mates with pebbles. 💍",
];
const BALL = ["✅ It is certain.","✅ Without a doubt.","✅ Yes, definitely!","🔮 Most likely.","🔮 Signs point to yes.","🤷 Reply hazy, try again.","🤷 Ask again later.","🤷 Cannot predict now.","❌ Don't count on it.","❌ My reply is no.","❌ Very doubtful.","❌ Outlook not so good."];
const TRUTHS = ["What's your most embarrassing moment?","Have you ever lied to get out of trouble?","What's your biggest fear?","Who was your first crush?","What's the most childish thing you still do?","What's the most money you've ever spent on something stupid?","What's the cringiest thing you've done for attention?"];
const DARES = ["Send a voice note saying 'I am a potato 🥔' in your best accent.","Change your profile picture to a funny face for 10 minutes.","Do 20 pushups and send proof.","Text your crush 'hi' right now.","Sing your favorite song and send a voice note.","Post 'I love potatoes 🥔' as your status.","Let the group change your display name for 1 hour."];
const WYR = ["Would you rather be able to fly or be invisible?","Would you rather live in the past or the future?","Would you rather have unlimited money or unlimited time?","Would you rather know when you'll die or how you'll die?","Would you rather be the funniest person in the room or the smartest?","Would you rather never use social media again or never watch another movie?"];

async function handleFun(ctx, action, args = []) {
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  switch (action) {
    case "joke":    return reply(`😂 *Joke*\n\n${pickRandom(JOKES)}`, KB.funMenu());
    case "quote":   return reply(`💬 *Quote*\n\n${pickRandom(QUOTES)}`, KB.funMenu());
    case "fact":    return reply(`🧠 *Random Fact*\n\n${pickRandom(FACTS)}`, KB.funMenu());
    case "truth":   return reply(`😶 *Truth or Dare — TRUTH*\n\n${pickRandom(TRUTHS)}`, KB.funMenu());
    case "dare":    return reply(`😈 *Truth or Dare — DARE*\n\n${pickRandom(DARES)}`, KB.funMenu());
    case "wyr":     return reply(`🤔 *Would You Rather?*\n\n${pickRandom(WYR)}`, KB.funMenu());
    case "8ball": {
      const q = args.join(" ");
      if (!q) return reply("❓ Send your question:\n\nUsage: `.8ball <question>`", KB.funMenu());
      return reply(`🎱 *Magic 8-Ball*\n\n❓ Q: ${q}\n\n${pickRandom(BALL)}`, KB.funMenu());
    }
    case "rps_rock":
    case "rps_paper":
    case "rps_scissors": {
      const choice = action.replace("rps_", "");
      const bot = pickRandom(["rock","paper","scissors"]);
      const wins = { rock:"scissors", paper:"rock", scissors:"paper" };
      const icons = { rock:"🪨", paper:"📄", scissors:"✂️" };
      const result = wins[choice]===bot ? "You win! 🎉" : choice===bot ? "It's a tie! 🤝" : "I win! 😈";
      return reply(`✂️ *Rock Paper Scissors*\n\nYou: ${icons[choice]} ${choice}\nMe: ${icons[bot]} ${bot}\n\n${result}`, KB.funMenu());
    }
    default: return reply("❓ Unknown action.", KB.funMenu());
  }
}

module.exports = { handleFun };
