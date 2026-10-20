// Pending Figma update for "Paati's Muruku Kitchen — Game Stage"
// fileKey: D92o5ppaITPUDEWiCd9KHs
// Blocked by the Figma Starter plan MCP call limit (2026-10-12/13). Run with use_figma once the limit resets.
//
// 1. Shop → Kadai: screen 6 header + labels, kitchen tile, Store Container button, Hub Tile hint, User Flow box.
// 2. Remove all Tamil words: Tamil script and Tamil phrases (Vaanga kanna, Romba nalla irukku, kanna).
//    The names Paati, Muruku and Kadai stay.
// 3. Pending clip fixes: Shop + Jar shelf page headers, Jar shelf captions.
// 4. Scan every page for leftover Tamil, then delete the Caption/Tamil and Display/Tamil styles if unused.

const stage = await figma.getNodeByIdAsync("1:2");
await figma.setCurrentPageAsync(stage);
await Promise.all(["Regular", "Medium", "SemiBold", "Bold", "Black"].map(s => figma.loadFontAsync({ family: "Lato", style: s })));
await Promise.all(["Medium", "Bold"].map(s => figma.loadFontAsync({ family: "Hind Madurai", style: s })));
const G = id => figma.getNodeByIdAsync(id);
const V = {}; for (const v of await figma.variables.getLocalVariablesAsync()) V[v.name] = v;
const P = n => figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", V[n]);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
function setP(inst, obj) { const defs = inst.componentProperties, out = {}; for (const [n, val] of Object.entries(obj)) { const key = Object.keys(defs).find(k => k.split("#")[0] === n); if (!key) throw new Error(`no prop ${n} on ${inst.name}`); out[key] = val; } inst.setProperties(out); }
const mutated = [], removed = [];

// 1. Speech bubble: drop the Tamil line + its properties
const sb = await G("2:288");
for (const k of Object.keys(sb.componentPropertyDefinitions)) if (/^(Tamil|Show Tamil)#/.test(k)) sb.deleteComponentProperty(k);
const tamLine = sb.findChild(n => n.type === "TEXT" && n.name === "Tamil"); if (tamLine) { removed.push(tamLine.id); tamLine.remove(); }
const tail = sb.findChild(n => n.name === "Tail"); if (tail) tail.y = sb.height - 1.5;
sb.description = "Paati's line: one idea at a time, short and warm. Every spoken line also appears as text (captions).";

// 2. Shop → Kadai
const s6 = await G("9:1080");
s6.name = "06 · Kadai (shop)";
const h6 = s6.children.find(n => n.name === "Page header");
h6.primaryAxisSizingMode = "AUTO"; h6.counterAxisSizingMode = "AUTO"; h6.clipsContent = false; h6.itemSpacing = 16;
const t6 = h6.findOne(n => n.type === "TEXT" && n.name === "Title"); t6.textAutoResize = "WIDTH_AND_HEIGHT"; t6.characters = "Paati's Kadai";
const sub6 = h6.findOne(n => n.type === "TEXT" && n.name === "Subtitle"); await sub6.setTextStyleIdAsync(TS["Body/Default"].id); sub6.textAutoResize = "WIDTH_AND_HEIGHT"; sub6.characters = "1 pack = 1 batch = 3 muruku";
const lbl6 = stage.children.find(n => n.type === "TEXT" && n.name === "Label · #6"); if (lbl6) lbl6.characters = "#6  Kadai (shop)";
const pur6 = stage.children.find(n => n.type === "TEXT" && n.name === "Purpose · #6"); if (pur6) pur6.characters = "Spend points · Paati's Kadai: ingredient cards with price per batch pack and stock, ghee locked until level 3, balance in the HUD. A basic batch costs 28";
mutated.push(s6.id, t6.id, sub6.id);
const s3 = await G("9:464");
const tile = s3.children.find(n => n.name === "Tile · Shop" || n.name === "Tile · Kadai");
if (tile) { setP(tile, { Label: "Kadai", Caption: "Buy ingredients" }); tile.name = "Tile · Kadai"; mutated.push(tile.id); }
const sc = await G("4:163");
for (const v of sc.children) { const b = v.findChild(n => n.name === "Go to Shop"); if (b) { b.name = "Go to Kadai"; b.findOne(n => n.type === "TEXT").characters = "Kadai"; mutated.push(b.id); } }
sc.description = sc.description.replace("Go to Shop", "Go to Kadai");
const tiles = await G("4:296");
const hintKey = Object.keys(tiles.componentPropertyDefinitions).find(k => k.startsWith("Hint#"));
tiles.editComponentProperty(hintKey, { defaultValue: "Visit the Kadai first" });

// 3. Screen copy without Tamil
const bub3 = s3.children.find(n => n.name === "Paati says"); setP(bub3, { Line: "What shall we make today?" });
const s2 = await G("9:277");
const pop = s2.children.find(n => n.name === "Tamil meaning pop-up"); pop.name = "Meaning pop-up";
const tw = pop.findOne(n => n.type === "TEXT" && n.name === "Tamil word"); await tw.setTextStyleIdAsync(TS["Display/Title"].id); tw.characters = "Muruku"; tw.name = "Word";
pop.findOne(n => n.type === "TEXT" && n.name === "Meaning").characters = "means “twisted”";
mutated.push(pop.id);

// 4. Foundations docs
const cover = await G("5:105");
const ct = cover.findOne(n => n.type === "TEXT" && n.name === "Tamil");
if (ct) { await ct.setTextStyleIdAsync(TS["Body/Default"].id); ct.fills = [P("text/secondary")]; ct.characters = "Muruku means “twisted” — just like its spiral shape."; ct.name = "Meaning"; }
cover.findOne(n => n.name === "Meta · Type").findOne(n => n.type === "TEXT" && n.name === "Value").characters = "Lato";
const type = await G("5:276");
for (const nm of ["Type · Caption/Tamil", "Type · Display/Tamil", "Review note"]) { const n = type.findOne(x => x.name === nm); if (n) { removed.push(n.id); n.remove(); } }
type.findOne(n => n.type === "TEXT" && n.name === "Intro").characters = "Lato for the whole interface — clean, modern and very legible at a distance. Nothing in-game smaller than 18px on the 1280 stage.";

// 5. Pending clip fixes (#10)
const s10 = await G("9:1882");
const h10 = s10.children.find(n => n.name === "Page header");
h10.primaryAxisSizingMode = "AUTO"; h10.counterAxisSizingMode = "AUTO"; h10.clipsContent = false;
for (const t of h10.findAllWithCriteria({ types: ["TEXT"] })) t.textAutoResize = "WIDTH_AND_HEIGHT";
for (const c of s10.children.filter(n => n.name.startsWith("Caption · "))) {
  if (c.width < 180) { c.resize(184, c.height); c.x -= 22; }
  c.primaryAxisSizingMode = "AUTO"; c.clipsContent = false;
  for (const t of c.findAllWithCriteria({ types: ["TEXT"] })) t.textAutoResize = "WIDTH_AND_HEIGHT";
}

// 6. User Flow box
const board = await G("4:303");
const box = board.children.find(n => n.name === "#6 Shop");
if (box) { box.name = "#6 Kadai (shop)"; box.findOne(n => n.type === "TEXT" && n.name === "Title").characters = "Kadai (shop)"; box.findOne(n => n.type === "TEXT" && n.name === "Description").characters = "Paati's shop. Buy batch packs with points; they go straight into the store"; }

// 7. Scan every page for leftover Tamil, then drop the Tamil styles
const TAMIL = /[஀-௿]|vaanga|kanna|romba|irukku|aiyo/i;
const tamStyleIds = new Set(["Caption/Tamil", "Display/Tamil"].filter(n => TS[n]).map(n => TS[n].id));
const leftovers = [], styleUsers = [];
for (const pid of ["0:1", "1:2", "1:3"]) {
  const pg = await G(pid); if (pid !== "1:2") await pg.loadAsync();
  for (const t of pg.findAllWithCriteria({ types: ["TEXT"] })) {
    if (TAMIL.test(t.characters)) leftovers.push({ page: pg.name, id: t.id, name: t.name, text: t.characters.slice(0, 60) });
    if (typeof t.textStyleId === "string" && tamStyleIds.has(t.textStyleId)) styleUsers.push({ page: pg.name, id: t.id, name: t.name });
  }
}
const stylesRemoved = [];
if (!styleUsers.length) for (const n of ["Caption/Tamil", "Display/Tamil"]) if (TS[n]) { TS[n].remove(); stylesRemoved.push(n); }

await s2.screenshot({ scale: 0.5 });
await s3.screenshot({ scale: 0.5 });
await (await G("9:893")).screenshot({ scale: 0.5 });
await s6.screenshot({ scale: 0.5 });
await s10.screenshot({ scale: 0.5 });
return { mutated, removed, leftovers, styleUsers, stylesRemoved, flowBoxRenamed: !!box };
