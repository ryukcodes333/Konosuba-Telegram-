const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { rand, pickRandom, formatNumber } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";
const WORDS = ["javascript","python","telegram","pokemon","adventure","computer","keyboard","developer","algorithm","interface"];
const RIDDLES = [
  { q: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", a: "map" },
  { q: "The more you take, the more you leave behind. What am I?", a: "footsteps" },
  { q: "I speak without a mouth, hear without ears, have no body but come alive with wind. What am I?", a: "echo" },
  { q: "What has hands but can't clap?", a: "clock" },
  { q: "What goes up but never comes down?", a: "age" },
  { q: "What has to be broken before you can use it?", a: "egg" },
];
const TRIVIA = [
  { q: "What is the capital of Australia?", a: "canberra", opts: ["Sydney","Melbourne","Canberra","Brisbane"] },
  { q: "How many sides does a hexagon have?", a: "6", opts: ["5","6","7","8"] },
  { q: "What is the chemical symbol for gold?", a: "au", opts: ["Go","Gd","Au","Ag"] },
  { q: "Which planet is known as the Red Planet?", a: "mars", opts: ["Venus","Jupiter","Mars","Saturn"] },
  { q: "What language runs in a web browser?", a: "javascript", opts: ["Java","Python","JavaScript","Ruby"] },
];

const activeGames = new Map();

async function handleGames(ctx, action, args = []) {
  const id = String(ctx.from.id);
  const chatId = String(ctx.chat.id);
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  switch (action) {
    case "hangman": {
      const word = pickRandom(WORDS);
      activeGames.set(`hangman:${chatId}`, { word, guessed: [], lives: 6, startedBy: id, expiresAt: Date.now() + 300000 });
      const display = word.split("").map(() => "\\_").join(" ");
      return reply(`🎮 *HANGMAN*\n\nWord: \`${display}\`\nLetters: ${word.length}\nLives: ❤️❤️❤️❤️❤️❤️\n\nGuess a letter by typing it! Example: type \`a\``, KB.gamesMenu());
    }
    case "riddle": {
      const r = pickRandom(RIDDLES);
      activeGames.set(`riddle:${chatId}`, { answer: r.a, expiresAt: Date.now() + 120000 });
      return reply(`🧩 *Riddle*\n\n${r.q}\n\n⏳ 2 minutes! Type your answer.`, KB.gamesMenu());
    }
    case "trivia": {
      const t = pickRandom(TRIVIA);
      activeGames.set(`trivia:${chatId}`, { answer: t.a.toLowerCase(), expiresAt: Date.now() + 30000 });
      const opts = t.opts.map((o, i) => `${["A","B","C","D"][i]}\\. ${o}`).join("\n");
      return reply(`🧠 *Trivia*\n\n${t.q}\n\n${opts}\n\n⏳ 30 seconds! Reply A, B, C or D`, KB.gamesMenu());
    }
    case "mathquiz": {
      const ops = ["+","-","*"];
      const op = pickRandom(ops);
      const a = rand(1, 50), b = rand(1, 50);
      const answer = op==="+"?a+b:op==="-"?a-b:a*b;
      activeGames.set(`math:${chatId}`, { answer: String(answer), expiresAt: Date.now() + 20000 });
      return reply(`🔢 *Math Quiz*\n\nWhat is *${a} ${op} ${b}*?\n\n⏳ 20 seconds!`, KB.gamesMenu());
    }
    case "wordgame": {
      const word = pickRandom(WORDS);
      const scrambled = word.split("").sort(() => Math.random()-0.5).join("");
      activeGames.set(`word:${chatId}`, { answer: word, expiresAt: Date.now() + 60000 });
      return reply(`🔤 *Word Scramble*\n\nUnscramble: \`${scrambled.toUpperCase()}\`\n\n⏳ 60 seconds!`, KB.gamesMenu());
    }
    case "guessnumber": {
      activeGames.set(`guess:${chatId}`, { target: rand(1,100), attempts: 0, maxAttempts: 7, expiresAt: Date.now() + 300000 });
      return reply(`🔢 *Guess the Number!*\n\nI'm thinking of a number between *1 and 100*.\nYou have *7 attempts*!\n\nType your guess:`, KB.gamesMenu());
    }
    case "fasttype": {
      const sentences = ["The quick brown fox jumps over the lazy dog","Pack my box with five dozen liquor jugs","How vexingly quick daft zebras jump"];
      const text = pickRandom(sentences);
      activeGames.set(`fasttype:${chatId}`, { text: text.toLowerCase(), startedAt: Date.now(), expiresAt: Date.now() + 60000 });
      return reply(`⌨️ *Fast Type*\n\nType this as fast as you can:\n\n_"${text}"_\n\n⏳ START NOW!`, KB.gamesMenu());
    }
    case "minesweeper": {
      const size = 5, mines = 3;
      const grid = Array(size).fill(null).map(() => Array(size).fill("🟦"));
      const mineSet = new Set();
      while (mineSet.size < mines) mineSet.add(rand(0, size*size-1));
      mineSet.forEach(pos => { grid[Math.floor(pos/size)][pos%size] = "||💣||"; });
      return reply(`💣 *Minesweeper* 5×5 \\(${mines} mines\\)\n\n${grid.map(r=>r.join("")).join("\n")}\n\n_Tap a spoiler cell — if it's 💣 you lose!_`, KB.gamesMenu());
    }
    case "leaderboard": {
      const all = DB.getAllUsers();
      const sorted = Object.entries(all).sort(([,a],[,b]) => (b.xp||0)-(a.xp||0)).slice(0,10);
      const list = sorted.map(([uid,u],i) => `${i+1}\\. User \\.\\.${uid.slice(-4)} — ${u.xp||0} XP`).join("\n");
      return reply(`🏆 *XP Leaderboard*\n\n${list||"No players yet!"}`, KB.back("games"));
    }
    case "arcade":
      return reply(`🕹 *Arcade Games*\n\n🎮 Hangman\n🧩 Riddle\n🧠 Trivia\n🔢 Math Quiz\n🔤 Word Scramble\n🔢 Guess Number\n⌨️ Fast Type\n💣 Minesweeper\n\nPress a button above to play!`, KB.gamesMenu());
    default:
      return reply("❓ Unknown game.", KB.gamesMenu());
  }
}

function checkGameAnswer(text, chatId) {
  const types = ["riddle","trivia","math","guess","word","fasttype"];
  for (const type of types) {
    const key = `${type}:${chatId}`;
    const game = activeGames.get(key);
    if (!game || game.expiresAt < Date.now()) continue;
    if (type === "guess") {
      const num = parseInt(text.trim());
      if (isNaN(num)) continue;
      game.attempts++;
      if (num === game.target) { activeGames.delete(key); return `🎉 Correct! The number was *${game.target}*! (+XP)`; }
      if (game.attempts >= game.maxAttempts) { activeGames.delete(key); return `💀 Out of attempts! The number was *${game.target}*.`; }
      return `${num < game.target ? "📈 Higher!" : "📉 Lower!"} \\(${game.maxAttempts - game.attempts} attempts left\\)`;
    }
    const ans = game.answer;
    const clean = text.trim().toLowerCase();
    if (clean === ans || clean.includes(ans)) {
      activeGames.delete(key);
      if (type === "fasttype") {
        const wpm = Math.floor((text.split(" ").length / ((Date.now() - game.startedAt) / 60000)));
        return `⌨️ Correct! Speed: ~*${wpm} WPM*! 🎉`;
      }
      return `✅ Correct! The answer was: *${ans}* 🎉`;
    }
    if (type === "trivia") {
      const idx = ["a","b","c","d"].indexOf(clean);
      const t = TRIVIA.find(t2 => t2.a === ans);
      if (t && idx >= 0 && t.opts[idx]?.toLowerCase() === ans) {
        activeGames.delete(key);
        return `✅ Correct! The answer was: *${t.opts.find(o=>o.toLowerCase()===ans)}* 🎉`;
      }
    }
  }
  return null;
}

module.exports = { handleGames, checkGameAnswer };
