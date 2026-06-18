const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { rand, getPokemonData, getPokemonSpecies, getRandomPokemon, pokemonCard, capitalize, STARTERS, NATURES, getRarity, calcDamage, escapeMarkdown } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";
const BALL_RATES = { "Poke Ball": 0.30, "Great Ball": 0.50, "Ultra Ball": 0.75, "Master Ball": 1.0 };

const OAK_DIALOGUES = [
  "Hello there!\n\nWelcome to the world of Pokemon!",
  "My name is Professor Oak!\n\nPeople affectionately refer to me as the Pokemon Professor.",
  "This world...\n\nis inhabited far and wide by creatures called Pokemon.",
  "For some people, Pokemon are pets.\nOthers use them for battling.",
  "As for me...\n\nI study Pokemon as a profession.",
  "But enough about me...\n\nToday marks the beginning of your own adventure.",
  "Every great Trainer begins with a partner Pokemon.\n\nChoose wisely.",
];

async function replyWithPhoto(ctx, imageUrl, caption, kb, replyMsgId) {
  const opts = { caption, parse_mode: "Markdown", ...(kb || {}), ...(replyMsgId ? { reply_to_message_id: replyMsgId } : {}) };
  if (imageUrl) {
    try { return await ctx.replyWithPhoto(imageUrl, opts); } catch {}
  }
  return ctx.reply(caption, { parse_mode: "Markdown", ...(kb || {}), ...(replyMsgId ? { reply_to_message_id: replyMsgId } : {}) });
}

function replyText(ctx, text, kb, replyMsgId) {
  return ctx.reply(text, { parse_mode: "Markdown", ...(kb || {}), ...(replyMsgId ? { reply_to_message_id: replyMsgId } : {}) });
}

function buildPartyCard(p, idx) {
  const e = escapeMarkdown;
  const hp = p.currentHp !== undefined ? p.currentHp : p.maxHp;
  const status = p.fainted ? "Fainted" : (p.status || "OK");
  const nature = p.nature || "Hardy";
  const nickname = p.nickname ? `(${p.nickname})` : "";
  const heldItem = p.heldItem || "None";
  const friendship = p.friendship || 0;
  return [
    `*#${idx} - ${capitalize(p.name)} ${nickname}*`,
    `Level: ${p.level || 1} | Nature: ${nature}`,
    `HP: ${hp}/${p.maxHp} | Status: ${status}`,
    `ATK: ${p.attack} | DEF: ${p.defense}`,
    `Sp.Atk: ${p.spAtk} | Sp.Def: ${p.spDef} | SPD: ${p.speed}`,
    `EXP: ${p.exp || 0} | Ability: ${(p.abilities || [])[0] || "Unknown"}`,
    `Held Item: ${heldItem} | Friendship: ${friendship}/255`,
    `Moves: ${(p.moves || []).join(", ") || "None"}`,
  ].join("\n");
}

async function handlePokemon(ctx, action) {
  const id = String(ctx.from.id);
  const msgId = ctx.message?.message_id;
  const pkData = DB.getPokemon(id);
  const eco = DB.getEconomy(id);

  switch (action) {
    case "party": {
      if (!pkData.party.length) return replyText(ctx, "Your party is empty!\n\nStart with `.starter` to get your first Pokemon!", KB.pokemonMenu(), msgId);
      const list = pkData.party.map((p, i) => {
        const hp = p.currentHp !== undefined ? p.currentHp : p.maxHp;
        const hpBar = buildHpBar(hp, p.maxHp);
        return `${i + 1}. *${capitalize(p.name)}* Lv.${p.level || 1} ${hpBar}`;
      }).join("\n");
      return replyText(ctx, `Your Party (${pkData.party.length}/6)\n\n${list}\n\nUse \`.party <number>\` to view details.`, KB.pokemonMenu(), msgId);
    }

    case "pc": {
      if (!pkData.pc.length) return replyText(ctx, "Your PC storage is empty.", KB.pokemonMenu(), msgId);
      const list = pkData.pc.map((p, i) => `${i + 1}. *${capitalize(p.name)}* Lv.${p.level || 1}`).join("\n");
      return replyText(ctx, `PC Storage (${pkData.pc.length} Pokemon)\n\n${list}`, KB.pokemonMenu(), msgId);
    }

    case "starter": {
      if (pkData.starter) {
        return replyText(ctx, `You already have a starter: *${capitalize(pkData.starter)}*!\n\nUse \`.party\` to view your Pokemon.`, KB.pokemonMenu(), msgId);
      }
      const step = pkData.oakStep || 0;
      if (step < OAK_DIALOGUES.length) {
        const text = OAK_DIALOGUES[step];
        DB.savePokemon(id, { oakStep: step + 1 });
        const nextAction = step + 1 < OAK_DIALOGUES.length ? "starter" : "starter_select";
        return ctx.reply(
          `*Prof. Oak:*\n\n${text}`,
          { parse_mode: "Markdown", ...(msgId ? { reply_to_message_id: msgId } : {}), ...KB.nextButton(nextAction) }
        );
      }
      return handlePokemon(ctx, "starter_select");
    }

    case "starter_select": {
      if (pkData.starter) return replyText(ctx, `You already chose *${capitalize(pkData.starter)}*!`, KB.pokemonMenu(), msgId);
      const [bulb, charm, squirt] = await Promise.all([
        getPokemonData("bulbasaur"),
        getPokemonData("charmander"),
        getPokemonData("squirtle"),
      ]);
      const img = bulb?.imageUrl || charm?.imageUrl || squirt?.imageUrl;
      const text = `*Prof. Oak:*\n\nChoose your first partner Pokemon!\n\n🌱 *Bulbasaur* - Grass/Poison\n🔥 *Charmander* - Fire\n💧 *Squirtle* - Water`;
      return replyWithPhoto(ctx, img, text, KB.kantoStarterMenu(), msgId);
    }

    case "hunt": {
      const cd = DB.getCooldown(id, "poke_hunt");
      if (cd > Date.now()) {
        const secs = Math.ceil((cd - Date.now()) / 1000);
        return replyText(ctx, `Tall grass cooldown! Try again in ${secs}s.`, KB.pokemonMenu(), msgId);
      }
      DB.setCooldown(id, "poke_hunt", 3 * 60 * 1000);

      const wild = await getRandomPokemon();
      if (!wild) return replyText(ctx, "No wild Pokemon appeared! The grass rustled... try again.", KB.pokemonMenu(), msgId);

      const species = await getPokemonSpecies(wild.id).catch(() => null);
      const catchRate = species?.catchRate || 128;
      const isLegendary = species?.isLegendary || false;
      const rarity = getRarity(catchRate, isLegendary);
      const wildLevel = rand(2, 40);
      const scaledHp = Math.floor(wild.hp * (1 + wildLevel * 0.05));

      const encounter = { ...wild, level: wildLevel, maxHp: scaledHp, currentHp: scaledHp, catchRate, isLegendary, rarity: rarity.label, spawnedAt: Date.now() };
      DB.saveWildEncounter(id, encounter);
      DB.addPokedexEntry(id, wild.id);

      const inv = DB.getInventory(id);
      const balls = ["Master Ball","Ultra Ball","Great Ball","Poke Ball"].filter(b => inv[b]);
      const hasBall = balls.length > 0;

      const typeStr = wild.types.map(t => capitalize(t)).join("/");
      const caption = [
        `A wild *${capitalize(wild.name)}* appeared!`,
        ``,
        `Lv.${wildLevel} | ${typeStr}`,
        `HP: ${scaledHp} | ${rarity.color} ${rarity.label}`,
        hasBall ? `\nUse \`.catch\` to try to catch it!` : `\nYou have no Poke Balls! Buy some with \`.buy Poke Ball\``,
      ].join("\n");

      return replyWithPhoto(ctx, wild.imageUrl, caption, hasBall ? KB.catchMenu() : KB.pokemonMenu(), msgId);
    }

    case "catch": {
      const encounter = DB.getWildEncounter(id);
      if (!encounter) return replyText(ctx, "No wild Pokemon encountered!\n\nUse `.hunt` to find one.", KB.pokemonMenu(), msgId);
      if (Date.now() - encounter.spawnedAt > 5 * 60 * 1000) {
        DB.clearWildEncounter(id);
        return replyText(ctx, "The wild Pokemon fled! Use `.hunt` again.", KB.pokemonMenu(), msgId);
      }

      const inv = DB.getInventory(id);
      const ball = ["Master Ball","Ultra Ball","Great Ball","Poke Ball"].find(b => inv[b]);
      if (!ball) return replyText(ctx, "You have no Poke Balls!\n\nBuy some with `.buy Poke Ball`.", KB.pokemonMenu(), msgId);

      const baseRate = (encounter.catchRate || 128) / 255;
      const ballBonus = BALL_RATES[ball] || 0.35;
      const catchChance = Math.min(0.95, baseRate * ballBonus * 2.5);
      const caught = ball === "Master Ball" || Math.random() < catchChance;

      DB.removeItem(id, ball);

      if (!caught) {
        DB.clearWildEncounter(id);
        const caption = `Threw a *${ball}*!\n\n*${capitalize(encounter.name)}* broke free and fled away!\n\nBetter luck next time. Use \`.hunt\` again.`;
        return replyWithPhoto(ctx, encounter.imageUrl, caption, KB.pokemonMenu(), msgId);
      }

      DB.clearWildEncounter(id);

      const nature = NATURES[rand(0, NATURES.length - 1)];
      const caughtPk = {
        ...encounter,
        level: encounter.level,
        maxHp: encounter.maxHp,
        currentHp: encounter.maxHp,
        exp: 0,
        nature,
        friendship: 70,
        heldItem: null,
        status: null,
        fainted: false,
        caughtAt: Date.now(),
      };

      const pkUpdated = DB.getPokemon(id);
      if (pkUpdated.party.length < 6) {
        DB.savePokemon(id, { party: [...pkUpdated.party, caughtPk] });
      } else {
        DB.savePokemon(id, { pc: [...pkUpdated.pc, caughtPk] });
      }

      const pokedexSeen = DB.getPokedexSeen(id);
      const xpGain = rand(20, 50);
      const u = DB.getUser(id);
      DB.saveUser(id, { xp: (u.xp || 0) + xpGain });

      const caption = [
        `Gotcha! *${capitalize(encounter.name)}* was caught!`,
        ``,
        `Ball used: ${ball}`,
        `Nature: ${nature}`,
        `Lv.${encounter.level} | HP: ${encounter.maxHp}`,
        `Sent to: ${pkUpdated.party.length < 6 ? "Party" : "PC (party full)"}`,
        ``,
        `Pokedex: ${pokedexSeen.length} seen`,
        `+${xpGain} XP`,
      ].join("\n");

      return replyWithPhoto(ctx, encounter.imageUrl, caption, KB.pokemonMenu(), msgId);
    }

    case "heal": {
      const cd = DB.getCooldown(id, "poke_heal");
      if (cd > Date.now()) {
        const mins = Math.ceil((cd - Date.now()) / 60000);
        return replyText(ctx, `Pokemon Center is busy! Try again in ${mins} minute(s).`, KB.pokemonMenu(), msgId);
      }
      if (!pkData.party.length) return replyText(ctx, "No Pokemon in your party to heal!", KB.pokemonMenu(), msgId);
      DB.savePokemon(id, { party: pkData.party.map(p => ({ ...p, currentHp: p.maxHp, fainted: false, status: null })) });
      DB.setCooldown(id, "poke_heal", 30 * 60 * 1000);
      return replyText(ctx, `Pokemon Center!\n\nYour Pokemon have been restored to full health!`, KB.pokemonMenu(), msgId);
    }

    case "shop":
      return replyText(ctx, `PokéShop\n\n• Poke Ball - ${CS} 100\n• Great Ball - ${CS} 250\n• Ultra Ball - ${CS} 500\n• Master Ball - ${CS} 5,000\n• Potion (+20HP) - ${CS} 80\n• Super Potion (+50HP) - ${CS} 150\n• Hyper Potion (+120HP) - ${CS} 300\n• Max Potion (Full) - ${CS} 500\n• Revive - ${CS} 400\n• Rare Candy (Lv up) - ${CS} 800\n• Fire Stone - ${CS} 1,200\n\nUse \`.buy <item name>\` to purchase!`, KB.pokemonMenu(), msgId);

    default: {
      // .party <index>
      if (action.startsWith("party_")) {
        const idx = parseInt(action.replace("party_", "")) - 1;
        if (isNaN(idx) || idx < 0 || idx >= pkData.party.length) {
          return replyText(ctx, `Invalid party slot. You have ${pkData.party.length} Pokemon.`, KB.pokemonMenu(), msgId);
        }
        const p = pkData.party[idx];
        const text = buildPartyCard(p, idx + 1);
        return replyWithPhoto(ctx, p.imageUrl, text, KB.pokemonMenu(), msgId);
      }

      // .dex <pokemon>
      if (action.startsWith("dex_")) {
        const name = action.replace("dex_", "").toLowerCase();
        const pk = await getPokemonData(name);
        if (!pk) return replyText(ctx, `Pokemon "${name}" not found in the Pokedex.`, KB.pokemonMenu(), msgId);
        const species = await getPokemonSpecies(pk.id).catch(() => null);

        const types = pk.types.map(t => capitalize(t)).join("/");
        const abilities = pk.abilities.map(a => capitalize(a.replace(/-/g, " "))).join(", ");
        const rarity = getRarity(species?.catchRate || 128, species?.isLegendary || false);

        const text = [
          `*#${pk.id} - ${capitalize(pk.name)}*`,
          species?.genera ? `_${species.genera}_` : "",
          ``,
          `Type: ${types}`,
          `Height: ${pk.height}m | Weight: ${pk.weight}kg`,
          `${rarity.color} Rarity: ${rarity.label}`,
          ``,
          `*Base Stats:*`,
          `HP: ${pk.hp} | ATK: ${pk.attack} | DEF: ${pk.defense}`,
          `Sp.Atk: ${pk.spAtk} | Sp.Def: ${pk.spDef} | SPD: ${pk.speed}`,
          ``,
          `*Abilities:* ${abilities}`,
          `*Moves:* ${pk.moves.map(m => capitalize(m.replace(/-/g, " "))).join(", ")}`,
          ``,
          species?.flavorText ? `_${species.flavorText}_` : "",
        ].filter(Boolean).join("\n");

        return replyWithPhoto(ctx, pk.imageUrl, text, KB.pokemonMenu(), msgId);
      }

      // starter selection callbacks
      if (action.startsWith("starter_")) {
        const name = action.replace("starter_", "");
        if (pkData.starter) return replyText(ctx, `You already chose *${capitalize(pkData.starter)}* as your starter!`, KB.pokemonMenu(), msgId);
        if (!["bulbasaur","charmander","squirtle"].includes(name)) return replyText(ctx, "Invalid starter selection.", KB.kantoStarterMenu(), msgId);
        const pk = await getPokemonData(name);
        if (!pk) return replyText(ctx, "Could not fetch Pokemon data. Please try again.", KB.kantoStarterMenu(), msgId);
        const nature = NATURES[rand(0, NATURES.length - 1)];
        const starter = { ...pk, level: 5, maxHp: pk.hp, currentHp: pk.hp, exp: 0, isStarter: true, nature, friendship: 120, heldItem: null, status: null, fainted: false, caughtAt: Date.now() };
        DB.savePokemon(id, { party: [starter], starter: name, oakStep: 0 });
        DB.addPokedexEntry(id, pk.id);

        const caption = [
          `You chose *${capitalize(pk.name)}* as your starter!`,
          ``,
          `Nature: ${nature}`,
          `Lv.5 | HP: ${pk.hp}`,
          `ATK: ${pk.attack} | DEF: ${pk.defense}`,
          ``,
          `Your adventure begins now!`,
          `Use \`.hunt\` to catch wild Pokemon!`,
        ].join("\n");

        return replyWithPhoto(ctx, pk.imageUrl, caption, KB.pokemonMenu(), msgId);
      }

      // catch with specific ball from callback
      if (action.startsWith("catch_")) {
        const ballMap = { poke: "Poke Ball", great: "Great Ball", ultra: "Ultra Ball", master: "Master Ball" };
        const ball = ballMap[action.replace("catch_", "")];
        if (!ball) return replyText(ctx, "Invalid ball selection.", KB.catchMenu(), msgId);
        const inv = DB.getInventory(id);
        if (!inv[ball]) return replyText(ctx, `You don't have a *${ball}*!\n\nBuy one with \`.buy ${ball}\``, KB.catchMenu(), msgId);

        const encounter = DB.getWildEncounter(id);
        if (!encounter) return replyText(ctx, "No wild Pokemon! Use `.hunt` first.", KB.pokemonMenu(), msgId);

        const baseRate = (encounter.catchRate || 128) / 255;
        const ballBonus = BALL_RATES[ball] || 0.35;
        const catchChance = Math.min(0.95, baseRate * ballBonus * 2.5);
        const caught = ball === "Master Ball" || Math.random() < catchChance;

        DB.removeItem(id, ball);

        if (!caught) {
          return replyText(ctx, `Threw a *${ball}*!\n\n*${capitalize(encounter.name)}* broke free!\n\nTry again!`, KB.catchMenu(), msgId);
        }

        DB.clearWildEncounter(id);
        const nature = NATURES[rand(0, NATURES.length - 1)];
        const caughtPk = { ...encounter, currentHp: encounter.maxHp, exp: 0, nature, friendship: 70, heldItem: null, status: null, fainted: false, caughtAt: Date.now() };
        const pkNow = DB.getPokemon(id);
        if (pkNow.party.length < 6) DB.savePokemon(id, { party: [...pkNow.party, caughtPk] });
        else DB.savePokemon(id, { pc: [...pkNow.pc, caughtPk] });

        const caption = `Gotcha! *${capitalize(encounter.name)}* was caught!\n\nBall: ${ball} | Nature: ${nature}\nSent to: ${pkNow.party.length < 6 ? "Party" : "PC"}`;
        return replyWithPhoto(ctx, encounter.imageUrl, caption, KB.pokemonMenu(), msgId);
      }

      return replyText(ctx, "Unknown Pokemon action.", KB.pokemonMenu(), msgId);
    }
  }
}

function buildHpBar(current, max) {
  const pct = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(pct * 8);
  const bar = "█".repeat(filled) + "░".repeat(8 - filled);
  const color = pct > 0.5 ? "🟩" : pct > 0.25 ? "🟨" : "🟥";
  return `${color}[${bar}] ${current}/${max}`;
}

module.exports = { handlePokemon };
