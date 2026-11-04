export interface CommonIngredient {
  name: string;
  plural: string;
}

// Veelgebruikte ingrediënten voor de snelle suggestielijst in de editor.
export const commonIngredients: CommonIngredient[] = [
  { name: "aardappel", plural: "aardappelen" },
  { name: "avocado", plural: "avocado's" },
  { name: "basilicum", plural: "basilicum" },
  { name: "bloem", plural: "bloem" },
  { name: "boter", plural: "boter" },
  { name: "bosui", plural: "bosuitjes" },
  { name: "broccoli", plural: "broccoli's" },
  { name: "champignon", plural: "champignons" },
  { name: "citroen", plural: "citroenen" },
  { name: "courgette", plural: "courgettes" },
  { name: "dille", plural: "dille" },
  { name: "ei", plural: "eieren" },
  { name: "erwt", plural: "erwten" },
  { name: "feta", plural: "feta" },
  { name: "gember", plural: "gember" },
  { name: "gehakt", plural: "gehakt" },
  { name: "garnaal", plural: "garnalen" },
  { name: "knoflook", plural: "knoflook" },
  { name: "knoflookteen", plural: "knoflooktenen" },
  { name: "komkommer", plural: "komkommers" },
  { name: "koriander", plural: "koriander" },
  { name: "kikkererwt", plural: "kikkererwten" },
  { name: "melk", plural: "melk" },
  { name: "mozzarella", plural: "mozzarella" },
  { name: "mosterd", plural: "mosterd" },
  { name: "olijfolie", plural: "olijfolie" },
  { name: "ui", plural: "uien" },
  { name: "paprika", plural: "paprika's" },
  { name: "parmezaanse kaas", plural: "parmezaanse kaas" },
  { name: "pasta", plural: "pasta" },
  { name: "peterselie", plural: "peterselie" },
  { name: "pindakaas", plural: "pindakaas" },
  { name: "prei", plural: "preien" },
  { name: "rijst", plural: "rijst" },
  { name: "room", plural: "room" },
  { name: "rode peper", plural: "rode pepers" },
  { name: "rozijn", plural: "rozijnen" },
  { name: "sardine", plural: "sardines" },
  { name: "spinazie", plural: "spinazie" },
  { name: "spaghetti", plural: "spaghetti" },
  { name: "tomaat", plural: "tomaten" },
  { name: "tonijn", plural: "tonijn" },
  { name: "vanille-ijs", plural: "vanille-ijs" },
  { name: "varkensvlees", plural: "varkensvlees" },
  { name: "vis", plural: "vissen" },
  { name: "walnoot", plural: "walnoten" },
  { name: "zalm", plural: "zalm" },
  { name: "zout", plural: "zout" },
  { name: "zwarte peper", plural: "zwarte peper" },
  { name: "kerstomaat", plural: "kerstomaten" },
  { name: "rucola", plural: "rucola" },

  // Groenten en aardse ingrediënten
  { name: "artisjok", plural: "artisjokken" },
  { name: "asperge", plural: "asperges" },
  { name: "aubergine", plural: "aubergines" },
  { name: "biet", plural: "bieten" },
  { name: "bleekselderij", plural: "bleekselderij" },
  { name: "boerenkool", plural: "boerenkool" },
  { name: "bonen", plural: "bonen" },
  { name: "doperwt", plural: "doperwten" },
  { name: "edamame", plural: "edamame" },
  { name: "knolselderij", plural: "knolselderij" },
  { name: "koolrabi", plural: "koolrabi's" },
  { name: "pompoen", plural: "pompoenen" },
  { name: "pompoenpit", plural: "pompoenpitten" },
  { name: "pastinaak", plural: "pastinaken" },
  { name: "rammenas", plural: "rammenassen" },
  { name: "rabarber", plural: "rabarber" },
  { name: "rettich", plural: "rettich" },
  { name: "rode kool", plural: "rode kool" },
  { name: "savooiekool", plural: "savooiekool" },
  { name: "sjalot", plural: "sjalotten" },
  { name: "sperzieboon", plural: "sperziebonen" },
  { name: "spruit", plural: "spruiten" },
  { name: "taugé", plural: "taugé" },
  { name: "venkel", plural: "venkels" },
  { name: "waterkers", plural: "waterkers" },
  { name: "witlof", plural: "witlof" },
  { name: "witte kool", plural: "witte kool" },
  { name: "wortel", plural: "wortels" },
  { name: "zoete aardappel", plural: "zoete aardappelen" },
  { name: "zongedroogde tomaat", plural: "zongedroogde tomaten" },

  // Fruit en citrus
  { name: "appel", plural: "appels" },
  { name: "abrikoos", plural: "abrikozen" },
  { name: "banaan", plural: "bananen" },
  { name: "braam", plural: "bramen" },
  { name: "framboos", plural: "frambozen" },
  { name: "granaatappel", plural: "granaatappels" },
  { name: "grapefruit", plural: "grapefruits" },
  { name: "limoen", plural: "limoenen" },
  { name: "mango", plural: "mango's" },
  { name: "mandarijn", plural: "mandarijnen" },
  { name: "nectarine", plural: "nectarines" },
  { name: "peer", plural: "peren" },
  { name: "perzik", plural: "perziken" },
  { name: "pruim", plural: "pruimen" },
  { name: "sinaasappel", plural: "sinaasappels" },
  { name: "vijg", plural: "vijgen" },
  { name: "blauwe bes", plural: "blauwe bessen" },
  { name: "kers", plural: "kersen" },
  { name: "druif", plural: "druiven" },
  { name: "kokosnoot", plural: "kokosnoten" },

  // Vlees, gevogelte en vleesvervangers
  { name: "biefstuk", plural: "biefstukken" },
  { name: "dunne lende", plural: "dunne lende" },
  { name: "entrecote", plural: "entrecotes" },
  { name: "filet mignon", plural: "filet mignons" },
  { name: "gehaktbal", plural: "gehaktballen" },
  { name: "kip", plural: "kippen" },
  { name: "kipfilet", plural: "kipfilets" },
  { name: "kippenbout", plural: "kippenbouten" },
  { name: "kippendij", plural: "kippendijen" },
  { name: "kalkoen", plural: "kalkoenen" },
  { name: "lamskotelet", plural: "lamskoteletten" },
  { name: "lamsvlees", plural: "lamsvlees" },
  { name: "runderlappen", plural: "runderlappen" },
  { name: "rundergehakt", plural: "rundergehakt" },
  { name: "rosbief", plural: "rosbief" },
  { name: "ribeye", plural: "ribeyes" },
  { name: "schnitzel", plural: "schnitzels" },
  { name: "slavink", plural: "slavinken" },
  { name: "spek", plural: "spek" },
  { name: "spekblokje", plural: "spekblokjes" },
  { name: "spekreepje", plural: "spekreepjes" },
  { name: "worst", plural: "worsten" },
  { name: "chorizo", plural: "chorizo's" },
  { name: "ham", plural: "ham" },
  { name: "pancetta", plural: "pancetta" },
  { name: "tofu", plural: "tofu" },
  { name: "tempeh", plural: "tempeh" },
  { name: "seitan", plural: "seitan" },
  { name: "vega gehakt", plural: "vega gehakt" },

  // Vis en zeevruchten
  { name: "ansjovis", plural: "ansjovis" },
  { name: "forel", plural: "forellen" },
  { name: "heilbot", plural: "heilbotten" },
  { name: "kabeljauw", plural: "kabeljauw" },
  { name: "krab", plural: "krabben" },
  { name: "mossel", plural: "mosselen" },
  { name: "oester", plural: "oesters" },
  { name: "paling", plural: "palingen" },
  { name: "pangasius", plural: "pangasius" },
  { name: "schaaldier", plural: "schaaldieren" },
  { name: "schelvis", plural: "schelvissen" },
  { name: "sliptong", plural: "sliptongen" },
  { name: "tilapia", plural: "tilapia's" },
  { name: "inktvis", plural: "inktvissen" },
  { name: "zeebaars", plural: "zeebaarzen" },
  { name: "zeevruchten", plural: "zeevruchten" },

  // Zuivel en eieren
  { name: "blauwe kaas", plural: "blauwe kaas" },
  { name: "brie", plural: "brie" },
  { name: "camembert", plural: "camembert" },
  { name: "cheddar", plural: "cheddar" },
  { name: "creme fraîche", plural: "creme fraîche" },
  { name: "cottagecheese", plural: "cottagecheese" },
  { name: "geitenkaas", plural: "geitenkaas" },
  { name: "griekse yoghurt", plural: "griekse yoghurt" },
  { name: "halloumi", plural: "halloumi" },
  { name: "mascarpone", plural: "mascarpone" },
  { name: "roomkaas", plural: "roomkaas" },
  { name: "slagroom", plural: "slagroom" },
  { name: "zure room", plural: "zure room" },
  { name: "yoghurt", plural: "yoghurt" },
  { name: "kwark", plural: "kwark" },
  { name: "karnemelk", plural: "karnemelk" },
  { name: "kookroom", plural: "kookroom" },
  { name: "eidooier", plural: "eidooiers" },
  { name: "eiwit", plural: "eiwitten" },

  // Granen, peulvruchten en bakproducten
  { name: "boekweit", plural: "boekweit" },
  { name: "bulgur", plural: "bulgur" },
  { name: "couscous", plural: "couscous" },
  { name: "havermout", plural: "havermout" },
  { name: "quinoa", plural: "quinoa" },
  { name: "roggebrood", plural: "roggebrood" },
  { name: "tarwe", plural: "tarwe" },
  { name: "volkorenmeel", plural: "volkorenmeel" },
  { name: "zelfrijzend bakmeel", plural: "zelfrijzend bakmeel" },
  { name: "linze", plural: "linzen" },
  { name: "bruine boon", plural: "bruine bonen" },
  { name: "kidneyboon", plural: "kidneybonen" },
  { name: "witte boon", plural: "witte bonen" },
  { name: "sojaboon", plural: "sojabonen" },
  { name: "bakpoeder", plural: "bakpoeder" },
  { name: "gist", plural: "gist" },
  { name: "paneermeel", plural: "paneermeel" },
  { name: "panko", plural: "panko" },
  { name: "maïzena", plural: "maïzena" },
  { name: "gelatine", plural: "gelatine" },

  // Kruiden, specerijen, noten en smaakmakers
  { name: "bieslook", plural: "bieslook" },
  { name: "dragon", plural: "dragon" },
  { name: "laurier", plural: "laurier" },
  { name: "marjolein", plural: "marjolein" },
  { name: "munt", plural: "munt" },
  { name: "oregano", plural: "oregano" },
  { name: "rozemarijn", plural: "rozemarijn" },
  { name: "salie", plural: "salie" },
  { name: "tijm", plural: "tijm" },
  { name: "kaneel", plural: "kaneel" },
  { name: "kardemom", plural: "kardemom" },
  { name: "kerriepoeder", plural: "kerriepoeder" },
  { name: "komijn", plural: "komijn" },
  { name: "kurkuma", plural: "kurkuma" },
  { name: "nootmuskaat", plural: "nootmuskaat" },
  { name: "paprikapoeder", plural: "paprikapoeder" },
  { name: "chilivlokken", plural: "chilivlokken" },
  { name: "saffraan", plural: "saffraan" },
  { name: "steranijs", plural: "steranijs" },
  { name: "venkelzaad", plural: "venkelzaad" },
  { name: "zeezout", plural: "zeezout" },
  { name: "amandel", plural: "amandelen" },
  { name: "cashewnoot", plural: "cashewnoten" },
  { name: "hazelnoot", plural: "hazelnoten" },
  { name: "macadamianoot", plural: "macadamianoten" },
  { name: "pecannoot", plural: "pecannoten" },
  { name: "pijnboompit", plural: "pijnboompitten" },
  { name: "pistache", plural: "pistachenoten" },
  { name: "sesamzaad", plural: "sesamzaad" },
  { name: "zonnebloempit", plural: "zonnebloempitten" },

  // Sauzen, conserven en zoetwaren
  { name: "appelmoes", plural: "appelmoes" },
  { name: "augurk", plural: "augurken" },
  { name: "balsamicoazijn", plural: "balsamicoazijn" },
  { name: "bouillon", plural: "bouillon" },
  { name: "ketjap", plural: "ketjap" },
  { name: "ketchup", plural: "ketchup" },
  { name: "kokosmelk", plural: "kokosmelk" },
  { name: "mayonaise", plural: "mayonaise" },
  { name: "passata", plural: "passata" },
  { name: "pesto", plural: "pesto" },
  { name: "sojasaus", plural: "sojasaus" },
  { name: "tahin", plural: "tahin" },
  { name: "tomatenpuree", plural: "tomatenpuree" },
  { name: "tomatensaus", plural: "tomatensaus" },
  { name: "worcestersaus", plural: "worcestersaus" },
  { name: "ahornsiroop", plural: "ahornsiroop" },
  { name: "honing", plural: "honing" },
  { name: "jam", plural: "jam" },
  { name: "kristalsuiker", plural: "kristalsuiker" },
  { name: "poedersuiker", plural: "poedersuiker" },
  { name: "bruine suiker", plural: "bruine suiker" },
  { name: "vanillesuiker", plural: "vanillesuiker" },
  { name: "vanille-extract", plural: "vanille-extract" },
  { name: "chocolade", plural: "chocolade" },
  { name: "cacaopoeder", plural: "cacaopoeder" },
];

export function ingredientSuggestions(query: string): CommonIngredient[] {
  const normalized = query.trim().toLocaleLowerCase("nl");
  if (!normalized) {
    return [];
  }
  return commonIngredients
    .filter((ingredient) => ingredient.name.includes(normalized))
    .slice(0, 8);
}

function isSingleAmount(amount: string): boolean {
  return /^\s*1(?:[,.]0+)?(?:\s|$)/.test(amount);
}

function hasMultipleAmount(amount: string): boolean {
  const value = Number.parseFloat(amount.trim().replace(",", "."));
  return Number.isFinite(value) && value > 1;
}

export function pluralizeIngredient(title: string, amount: string): string {
  if (!hasMultipleAmount(amount) || isSingleAmount(amount)) {
    return title;
  }

  const commaIndex = title.indexOf(",");
  const base =
    commaIndex >= 0 ? title.slice(0, commaIndex).trim() : title.trim();
  const suffix = commaIndex >= 0 ? title.slice(commaIndex) : "";
  const normalized = base.toLocaleLowerCase("nl");
  const known = commonIngredients.find(
    (ingredient) => ingredient.name === normalized,
  );
  if (
    !known ||
    known.plural.toLocaleLowerCase("nl") === base.toLocaleLowerCase("nl")
  ) {
    return title;
  }
  return `${known.plural}${suffix}`;
}

export function formatIngredientAmount(
  amount: string,
  unit: string,
  title: string,
): string {
  const quantity = [amount.trim(), unit.trim()].filter(Boolean).join(" ");
  return [quantity, pluralizeIngredient(title, amount)]
    .filter(Boolean)
    .join(" ");
}
