const KB = require("../utils/keyboards");
const { pickRandom } = require("../utils/helpers");

const PAIR = {
  hug:     ["🤗 {s} hugs {t} warmly!","💖 {s} gives {t} a big bear hug!","🫂 {s} wraps their arms around {t}!"],
  kiss:    ["😘 {s} kisses {t}!","💋 {s} plants a kiss on {t}'s cheek!","💕 {s} gives {t} a sweet kiss!"],
  pat:     ["🤚 {s} pats {t} on the head!","✋ {s} gives {t} a gentle head pat!","💆 {s} pats {t} affectionately!"],
  slap:    ["👋 {s} slaps {t}! That's gotta hurt!","💢 {s} gives {t} a massive slap!","*SLAP!* {s} smacks {t}!"],
  punch:   ["👊 {s} punches {t} in the face!","💥 {s} throws a punch at {t}!","🤜 {s} delivers a devastating punch to {t}!"],
  bite:    ["😬 {s} bites {t}!","🦷 {s} takes a chomp out of {t}!","😸 {s} nibbles on {t}!"],
  cuddle:  ["🥰 {s} cuddles with {t}!","💞 {s} snuggles up to {t}!","🫂 {s} and {t} cuddle together!"],
  poke:    ["👉 {s} pokes {t}!","☝️ {s} pokes {t} repeatedly!","👆 {s} prods {t} with a finger!"],
  tickle:  ["😆 {s} tickles {t}! Stop, stop!","🤣 {s} goes full tickle mode on {t}!","😹 {t} is being tickled by {s}!"],
  wave:    ["👋 {s} waves at {t}!","🙋 {s} says hello to {t}!","✋ {s} gives {t} a friendly wave!"],
  highfive:["🙌 {s} high-fives {t}!","✋ {s} and {t} share an epic high-five!","🤚 YES! {s} and {t} high-five!"],
  stare:   ["👁 {s} stares intensely at {t}...","😶 {s} can't stop staring at {t}...","🔍 {s} is giving {t} the death stare."],
};
const SOLO = {
  blush:   ["😊 {s} is blushing! So cute!","🥺 {s} turns bright red!","😳 {s} is blushing hard rn!"],
  smile:   ["😊 {s} flashes a beautiful smile!","😁 {s} is all smiles today!","🌟 {s} smiles brightly!"],
  cry:     ["😢 {s} is crying... someone comfort them!","😭 {s} breaks down in tears!","💧 {s} is sobbing..."],
  laugh:   ["😂 {s} bursts out laughing!","🤣 {s} is rolling on the floor laughing!","😆 {s} can't stop laughing!"],
  dance:   ["💃 {s} starts dancing!","🕺 {s} shows off their moves!","🎶 {s} dances like nobody's watching!"],
  angry:   ["😡 {s} is FURIOUS!","🤬 {s} is absolutely steaming!","💢 {s} is getting really angry!"],
  sleep:   ["😴 {s} falls asleep... zzz","💤 {s} is out cold!","🛌 {s} has gone to sleep. Shhh!"],
};

async function handleInteractions(ctx, action) {
  const sName = ctx.from.first_name || "Someone";
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  if (PAIR[action]) {
    const tpl = pickRandom(PAIR[action]);
    const text = tpl.replace("{s}", `*${sName}*`).replace("{t}", "*a friend*");
    return reply(
      `${text}\n\n_Reply to this with \`.${action} @username\` to target someone_`,
      KB.interactionsMenu()
    );
  }
  if (SOLO[action]) {
    const text = pickRandom(SOLO[action]).replace("{s}", `*${sName}*`);
    return reply(text, KB.interactionsMenu());
  }
  return reply("❓ Unknown interaction.", KB.interactionsMenu());
}

module.exports = { handleInteractions };
