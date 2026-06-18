const KB = require("../utils/keyboards");
const { rand, pickRandom } = require("../utils/helpers");

const VIBES = {
  vibe:       () => pickRandom(["Your vibe is IMMACULATE rn fr fr 🔥","Lowkey sending positive energy your way ✨","Your vibe is on another level ngl 💫","That's the kind of energy we need around here 🌟"]),
  vibecheck:  () => pickRandom(["✅ VIBE CHECK PASSED — You're built different 💯","❌ VIBE CHECK FAILED — Fix your energy fam 😬","🟡 Vibe is mid rn but recoverable fr","✅ You passed! The aura is immaculate 🌟"]),
  energy:     () => { const s = rand(1,100); return `⚡ *Energy: ${s}%*\n\n${s>=80?"⚡ MAXIMUM — You're unstoppable!":s>=60?"🔥 High — Keep going!":s>=40?"😐 Mid — Get some rest":s>=20?"😴 Low — You need coffee":"💀 Dead — You okay?"}` },
  aura:       () => `✨ *Aura Reading*\n\nYour aura: ${pickRandom(["🟣 Purple — Mysterious & powerful","🔵 Blue — Calm & intelligent","🟡 Yellow — Joyful & creative","🟢 Green — Balanced & healer","🔴 Red — Passionate & bold","🟠 Orange — Social & magnetic","⚪ White — Pure & spiritual","⚫ Black — Dominant & complex"])}\n\nMain character energy 💫`,
  rizz:       () => { const s=rand(1,100); return `😎 *Rizz Meter*\n\n${s}/100\n\n${s>=90?"OHIO RIZZ 🗿 — Unmatched, untouchable.":s>=70?"W Rizz 😎 — You're doing numbers.":s>=50?"Mid Rizz 😐 — Room for improvement.":s>=30?"Negative Rizz 💀 — Say less.":"0 Rizz 😭 — Stay home."}` },
  sigma:      () => { const s=rand(1,100); return `🗿 *Sigma: ${s}/100*\n\n${s>=80?"Lone wolf. Sigma grindset activated 🗿":s>=50?"Mid sigma. Keep grinding 💪":"You're more of a beta ngl 😭"}` },
  ratio:      () => pickRandom(["L + ratio + didn't ask 💀","W + no ratio + you ate that 🔥","Ratio is irrelevant when you're built different 🗿","You got ratioed but at least you're real for it 💯","The ratio doesn't matter when you got the drip ✨"]),
  npc:        () => pickRandom(["Main character 👑 — No NPC behavior detected.","Slight NPC energy... you keep repeating yourself 🤖","Full NPC mode. Where are your real thoughts? 💭","Based non-NPC. Rare specimen fr 🦋","Your dialogue is kinda generic ngl 🗿"]),
  cope:       () => pickRandom(["You are DEFINITELY coping rn 💀","Slight cope detected. It's okay we all do it.","Zero cope. Accepting the L with grace 🙏","Maximum cope. The denial is strong with this one.","Touch grass first fr 🌿"]),
  mood:       () => `🌡️ *Mood Reading*\n\n${pickRandom(["🫀 Yearning","💀 Existing but barely","⚡ Chaotic good energy","🌊 Going with the flow","🔥 Ready to conquer","😮‍💨 Tired but unbothered","✨ Main character energy","🥺 Soft hours fr","🤡 Clowning heavily","💤 Snooze mode activated"])}`,
  lowkey:     () => pickRandom(["Lowkey you're winning and don't even know it 🌟","Lowkey going through it but still holding on 💪","Lowkey the most interesting person in the room 👀","Lowkey main character energy you're just shy about it 🌙","Lowkey built different fr fr 🔥"]),
  slay:       () => pickRandom(["You are SLAYING 💅 Period. Full stop. No debate.","We are SERVING today fr 🔥","The slay is IMMACULATE ✨","Bestie you are THAT person 👑","Slay certificate issued. Frame it. 🏆"]),
  ghost:      () => pickRandom(["You've been ghosting people AND WE SEE YOU 👀","No one is ghosting you rn. Real ones stay 💙","Getting ghosted lightly... don't take it personal","You ARE the ghost fr. Left people on read for days 💀","Ghost mode — protect your peace though 🌙"]),
  toxic:      () => { const s=rand(0,100); return `⚠️ *Toxicity: ${s}%*\n\n${s>=80?"Full toxic arc. We need to talk 😬":s>=50?"Mild toxicity. Work on yourself 🌱":s>=20?"Mostly fine. Minor red flags 🚩":"Zero toxicity. We love to see it 💚"}` },
  real:       () => pickRandom(["100% real one. No cap no mask 💯","Real but pretends to be unbothered","Real with a hint of performed energy 🎭","The realest one in the chat fr fr 🌟","Real but selective — true self shown to few ✨"]),
  sus:        () => { const s=rand(0,100); return `🔍 *Sus Meter: ${s}%*\n\n${s>=80?"VERY sus 📮 What are you hiding??":s>=50?"Kinda sus ngl 😳":s>=20?"Slightly sus but probably fine 🤔":"Not sus at all. Trusted. 💯"}` },
  caught:     () => pickRandom(["You were NOT minding your business 👀","Caught slipping fr fr 📸","The cameras caught EVERYTHING 💀","We saw the whole thing. Explain yourself 😭","Caught in 4K + ratio + L 💀"]),
  clout:      () => { const s=rand(0,1000000); return `📊 *Clout: ${s>=1000000?"1M+ 👑":s>=100000?Math.floor(s/1000)+"K 🔥":s>=1000?Math.floor(s/1000)+"K":s}*\n\n${s>=900000?"LEGENDARY STATUS 👑":s>=500000?"Famous fr fr 🔥":s>=100000?"Decent clout 📈":s>=10000?"Local celebrity 🌟":"Clout still in development 🌱"}` },
};

async function handleVibe(ctx, action) {
  const name = ctx.from.first_name || "User";
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  const fn = VIBES[action];
  if (!fn) return reply("❓ Unknown vibe.", KB.vibeMenu());
  return reply(`*${name}*, ${fn()}`, KB.vibeMenu());
}

module.exports = { handleVibe };
