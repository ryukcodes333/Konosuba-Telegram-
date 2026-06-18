const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../data");
const FILES = {
  users:        path.join(DB_PATH, "users.json"),
  groups:       path.join(DB_PATH, "groups.json"),
  economy:      path.join(DB_PATH, "economy.json"),
  cooldowns:    path.join(DB_PATH, "cooldowns.json"),
  pokemon:      path.join(DB_PATH, "pokemon.json"),
  guilds:       path.join(DB_PATH, "guilds.json"),
  rpg:          path.join(DB_PATH, "rpg.json"),
  cards:        path.join(DB_PATH, "cards.json"),
  inventory:    path.join(DB_PATH, "inventory.json"),
  warnings:     path.join(DB_PATH, "warnings.json"),
  lottery:      path.join(DB_PATH, "lottery.json"),
  achievements: path.join(DB_PATH, "achievements.json"),
  chatSettings: path.join(DB_PATH, "chatSettings.json"),
  wildEncounter: path.join(DB_PATH, "wildEncounter.json"),
  battles:      path.join(DB_PATH, "battles.json"),
  pokedexSeen:  path.join(DB_PATH, "pokedexSeen.json"),
};

if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });

function load(file) {
  try {
    if (!fs.existsSync(file)) { fs.writeFileSync(file, "{}"); return {}; }
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch { return {}; }
}
function save(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const DB = {
  getUser(id) {
    const u = load(FILES.users);
    if (!u[id]) { u[id] = { id, name: "", xp: 0, level: 1, banned: false, joinedAt: Date.now() }; save(FILES.users, u); }
    return u[id];
  },
  saveUser(id, data) { const u = load(FILES.users); u[id] = { ...u[id], ...data }; save(FILES.users, u); },
  getAllUsers() { return load(FILES.users); },

  getEconomy(id) {
    const e = load(FILES.economy);
    if (!e[id]) { e[id] = { wallet: parseInt(process.env.STARTING_BALANCE || "500"), bank: 0, bankLimit: 5000, loan: 0, prestige: 0, totalEarned: 0 }; save(FILES.economy, e); }
    return e[id];
  },
  saveEconomy(id, data) { const e = load(FILES.economy); e[id] = { ...e[id], ...data }; save(FILES.economy, e); },
  getAllEconomy() { return load(FILES.economy); },

  getGroup(id) {
    const g = load(FILES.groups);
    if (!g[id]) { g[id] = { id, antilink: false, antispam: false, welcome: true, goodbye: true, locked: false, mods: [], bannedUsers: [], mutedUsers: [] }; save(FILES.groups, g); }
    return g[id];
  },
  saveGroup(id, data) { const g = load(FILES.groups); g[id] = { ...g[id], ...data }; save(FILES.groups, g); },
  getAllGroups() { return load(FILES.groups); },

  getCooldown(id, cmd) { const c = load(FILES.cooldowns); return c[`${id}:${cmd}`] || 0; },
  setCooldown(id, cmd, ms) { const c = load(FILES.cooldowns); c[`${id}:${cmd}`] = Date.now() + ms; save(FILES.cooldowns, c); },
  getAllCooldowns(id) {
    const c = load(FILES.cooldowns); const r = {};
    for (const [k, v] of Object.entries(c)) { if (k.startsWith(id + ":") && v > Date.now()) r[k.split(":")[1]] = v; }
    return r;
  },

  getWarnings(id, group) { const w = load(FILES.warnings); return w[`${group}:${id}`] || []; },
  addWarning(id, group, reason) { const w = load(FILES.warnings); const k = `${group}:${id}`; if (!w[k]) w[k] = []; w[k].push({ reason, timestamp: Date.now() }); save(FILES.warnings, w); return w[k]; },
  clearWarnings(id, group) { const w = load(FILES.warnings); w[`${group}:${id}`] = []; save(FILES.warnings, w); },
  getWarns(chatId, userId) { return DB.getWarnings(userId, chatId); },
  saveWarns(chatId, userId, warns) { const w = load(FILES.warnings); w[`${chatId}:${userId}`] = warns; save(FILES.warnings, w); },

  getChatSetting(chatId, key) { const s = load(FILES.chatSettings); return s[chatId]?.[key]; },
  setChatSetting(chatId, key, value) { const s = load(FILES.chatSettings); if (!s[chatId]) s[chatId] = {}; s[chatId][key] = value; save(FILES.chatSettings, s); },
  getChatSettings(chatId) { const s = load(FILES.chatSettings); return s[chatId] || {}; },

  getPokemon(id) {
    const p = load(FILES.pokemon);
    if (!p[id]) { p[id] = { party: [], pc: [], starter: null, buddy: null, oakStep: 0, pokedex: [], badges: 0, friendships: {} }; save(FILES.pokemon, p); }
    if (!p[id].oakStep) p[id].oakStep = 0;
    if (!p[id].pokedex) p[id].pokedex = [];
    if (!p[id].badges) p[id].badges = 0;
    if (!p[id].friendships) p[id].friendships = {};
    return p[id];
  },
  savePokemon(id, data) { const p = load(FILES.pokemon); p[id] = { ...p[id], ...data }; save(FILES.pokemon, p); },

  getWildEncounter(id) { const w = load(FILES.wildEncounter); return w[id] || null; },
  saveWildEncounter(id, data) { const w = load(FILES.wildEncounter); w[id] = data; save(FILES.wildEncounter, w); },
  clearWildEncounter(id) { const w = load(FILES.wildEncounter); delete w[id]; save(FILES.wildEncounter, w); },

  getBattleState(id) { const b = load(FILES.battles); return b[id] || null; },
  saveBattleState(id, data) { const b = load(FILES.battles); b[id] = data; save(FILES.battles, b); },
  clearBattleState(id) { const b = load(FILES.battles); delete b[id]; save(FILES.battles, b); },

  getPokedexSeen(id) { const p = load(FILES.pokedexSeen); return p[id] || []; },
  addPokedexEntry(id, pokeId) { const p = load(FILES.pokedexSeen); if (!p[id]) p[id] = []; if (!p[id].includes(pokeId)) { p[id].push(pokeId); save(FILES.pokedexSeen, p); } },

  getGuild(name) { const g = load(FILES.guilds); return g[name.toLowerCase()] || null; },
  saveGuild(name, data) { const g = load(FILES.guilds); g[name.toLowerCase()] = data; save(FILES.guilds, g); },
  getAllGuilds() { return load(FILES.guilds); },
  getUserGuild(id) { const g = load(FILES.guilds); for (const [n, guild] of Object.entries(g)) { if (guild.members?.includes(String(id))) return { name: n, ...guild }; } return null; },

  getRpg(id) {
    const r = load(FILES.rpg);
    if (!r[id]) { r[id] = { hp: 100, maxHp: 100, atk: 10, def: 5, level: 1, xp: 0, class: "Adventurer", equipped: { weapon: null, armor: null }, skills: ["Strike"], party: [] }; save(FILES.rpg, r); }
    return r[id];
  },
  saveRpg(id, data) { const r = load(FILES.rpg); r[id] = { ...r[id], ...data }; save(FILES.rpg, r); },

  getInventory(id) { const i = load(FILES.inventory); if (!i[id]) { i[id] = {}; save(FILES.inventory, i); } return i[id]; },
  addItem(id, item, qty = 1) { const i = load(FILES.inventory); if (!i[id]) i[id] = {}; i[id][item] = (i[id][item] || 0) + qty; save(FILES.inventory, i); },
  removeItem(id, item, qty = 1) { const i = load(FILES.inventory); if (!i[id] || !i[id][item]) return false; i[id][item] -= qty; if (i[id][item] <= 0) delete i[id][item]; save(FILES.inventory, i); return true; },

  getCards(id) { const c = load(FILES.cards); if (!c[id]) { c[id] = { collection: [], stardust: 0, deck: [] }; save(FILES.cards, c); } return c[id]; },
  saveCards(id, data) { const c = load(FILES.cards); c[id] = { ...c[id], ...data }; save(FILES.cards, c); },

  getLottery() { const l = load(FILES.lottery); if (!l.pool) l.pool = { pot: 0, tickets: [], lastDraw: 0 }; return l.pool; },
  saveLottery(data) { const l = load(FILES.lottery); l.pool = data; save(FILES.lottery, l); },

  getAchievements(id) { const a = load(FILES.achievements); if (!a[id]) { a[id] = []; save(FILES.achievements, a); } return a[id]; },
  unlockAchievement(id, achievement) { const a = load(FILES.achievements); if (!a[id]) a[id] = []; if (!a[id].includes(achievement)) { a[id].push(achievement); save(FILES.achievements, a); return true; } return false; },
};

module.exports = DB;
