/* Gestion Stock Web - version locale prête à héberger */
const STORAGE_KEY = 'gestion-stock-web-v1';
const APP_VERSION = '1.28.0-multipage-scans';
const CLOUD_RECORD_ID = 'main';
const CLOUD_TABLE = 'app_data';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const today = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const money = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
const number = value => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value || 0));
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));

const INVENTORY_TYPES = [
  { id: 'general', label: 'Général', short: 'Général' },
  { id: 'ultra', label: 'Ultra frais', short: 'Ultra frais' },
  { id: 'hub', label: 'HUB', short: 'HUB' }
];

const RECEIPT_DOCUMENT_TYPES = [
  { id: 'delivery', label: 'Bon de livraison', short: 'BL' },
  { id: 'temperature', label: 'Ticket température', short: 'Température' }
];
const INVENTORY_DAYS = [1, 3, 5]; // Lundi, mercredi, vendredi
const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const INVENTORY_DAY_KEYS = { 1: 'monday', 3: 'wednesday', 5: 'friday' };
const INVENTORY_DAY_LABELS = { monday: 'Lundi', wednesday: 'Mercredi', friday: 'Vendredi' };
const INVENTORY_SLOT_ORDER = ['monday_general', 'monday_ultra', 'wednesday_general', 'wednesday_ultra', 'wednesday_hub', 'friday_general', 'friday_ultra'];
const INVENTORY_SLOT_DEFINITIONS = [
  { id: 'monday_general', day: 'monday', type: 'general', label: 'Lundi · Général' },
  { id: 'monday_ultra', day: 'monday', type: 'ultra', label: 'Lundi · Ultra frais' },
  { id: 'wednesday_general', day: 'wednesday', type: 'general', label: 'Mercredi · Général' },
  { id: 'wednesday_ultra', day: 'wednesday', type: 'ultra', label: 'Mercredi · Ultra frais' },
  { id: 'wednesday_hub', day: 'wednesday', type: 'hub', label: 'Mercredi · HUB' },
  { id: 'friday_general', day: 'friday', type: 'general', label: 'Vendredi · Général' },
  { id: 'friday_ultra', day: 'friday', type: 'ultra', label: 'Vendredi · Ultra frais' }
];
const DEFAULT_STORAGE_ZONES = [
  { id: 'zone-negatif', sequence: 1, code: 'N°1000', name: 'Chambre Négative', aliases: ['Négatif', 'Chambre négative'], type: 'Froid négatif', temperature: '-18°C', description: 'Produits surgelés / froid négatif. Ranger par famille et appliquer FEFO.' },
  { id: 'zone-positif', sequence: 2, code: 'N°2000', name: 'Chambre Positive', aliases: ['Positif', 'Chambre positive'], type: 'Froid positif', temperature: '+0/+4°C', description: 'Produits frais et ultra frais. Contrôle DLC et rangement rapide.' },
  { id: 'zone-sec-2', sequence: 3, code: 'N°3000', name: 'SEC 2', aliases: ['Sec 2'], type: 'Réserve sèche', temperature: 'Ambiant', description: 'Zone sèche secondaire. Ranger les emballages et consommables selon le séquençage défini.' },
  { id: 'zone-sec', sequence: 4, code: 'N°4000', name: 'SEC 1', aliases: ['Sec', 'Réserve sèche', 'SEC 1'], type: 'Réserve sèche', temperature: 'Ambiant', description: 'Zone sèche principale. Produits secs, emballages et consommables. Appliquer FIFO.' },
  { id: 'zone-peinture-fraiche', sequence: 5, code: 'N°5000', name: 'Peinture fraîche', aliases: ['Peinture fraiche'], type: 'Stockage spécifique', temperature: 'Ambiant', description: 'Zone dédiée aux produits ou matériels spécifiques identifiés peinture fraîche.' },
  { id: 'zone-local-hotesse', sequence: 6, code: 'N°6000', name: 'Local hôtesse', aliases: ['Local hotesse', 'Local hôtesse'], type: 'Accueil / hôtesse', temperature: 'Ambiant', description: 'Zone dédiée aux consommables et éléments liés à l’accueil.' },
  { id: 'zone-bureau-manager', sequence: 7, code: 'N°7000', name: 'Bureau Manager', aliases: ['Bureau manager'], type: 'Bureau / administratif', temperature: 'Ambiant', description: 'Zone manager pour documents, éléments sensibles ou stock administratif.' }
];
const DEFAULT_INVENTORY_SLOT_COUNTS = {"monday_general":137,"monday_ultra":11,"wednesday_general":58,"wednesday_hub":191,"wednesday_ultra":11,"friday_general":166,"friday_ultra":11};
const DEFAULT_INVENTORY_CATALOG = [{"sku":"00005.312","name":"VIANDE 10/1","packageSize":"300 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":1,"wednesday_general":1,"friday_general":1}},{"sku":"00006.246","name":"VIANDE 4/1","packageSize":"120 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":2,"wednesday_general":2,"friday_general":2}},{"sku":"01146.056","name":"VIANDE 3/1","packageSize":"90 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":3,"wednesday_general":3,"friday_general":3}},{"sku":"00407.771","name":"NUGGETS 1,5","packageSize":"750 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":4,"wednesday_general":4,"friday_general":4}},{"sku":"01242.384","name":"CHICKEN MYTHIC PATTY NF-C","packageSize":"128 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":5,"wednesday_general":5,"friday_general":5}},{"sku":"01395.111","name":"CHICKEN PREMIERE -C","packageSize":"150 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":6,"wednesday_general":6,"friday_general":6}},{"sku":"04430.178","name":"POULET WRAP V2 -C","packageSize":"273 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":7,"wednesday_general":7,"friday_general":7}},{"sku":"16637.010","name":"PTIT CHICKEN","packageSize":"256 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":8,"wednesday_general":8,"friday_general":8}},{"sku":"07131.111","name":"BACON","packageSize":"360 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":9,"wednesday_general":9,"friday_general":10}},{"sku":"11709.007","name":"BACON BITS","packageSize":"3,75 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":10,"wednesday_general":10,"friday_general":11}},{"sku":"00008.026","name":"FILET POISSON COLIN MSC","packageSize":"168 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":11,"wednesday_general":11,"friday_general":12}},{"sku":"18947.002","name":"GATEAU ANNIV VANILLE","packageSize":"4 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":12,"wednesday_general":12,"friday_general":14}},{"sku":"00001.912","name":"PAIN REG BB CONGELE2","packageSize":"68 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":13,"wednesday_general":13,"friday_general":15}},{"sku":"00002.828","name":"PAIN ROY BB CONGELE2","packageSize":"60 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":14,"wednesday_general":14,"friday_general":16}},{"sku":"00003.673","name":"PAIN BM BB CONGELE","packageSize":"30 PN","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":15,"wednesday_general":15,"friday_general":17}},{"sku":"08272.201","name":"PAIN CBO","packageSize":"40 PN","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":16,"wednesday_general":16,"friday_general":18}},{"sku":"19281.003","name":"PAIN BIG ARCH","packageSize":"40 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":17,"wednesday_general":17,"friday_general":19}},{"sku":"06525.092","name":"MACARON VANILLE","packageSize":"105 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":18,"wednesday_general":18,"friday_general":20}},{"sku":"06780.124","name":"MACARON CHOCOLAT","packageSize":"105 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":19,"wednesday_general":19,"friday_general":21}},{"sku":"20010.000","name":"MACARON CARAMEL","packageSize":"105 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":20,"wednesday_general":20,"friday_general":22}},{"sku":"20047.000","name":"MACARON FRAMBOISE","packageSize":"105 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":21,"wednesday_general":21,"friday_general":23}},{"sku":"00076.130","name":"APPLE PIE","packageSize":"125 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":22,"wednesday_general":22,"friday_general":24}},{"sku":"00014.271","name":"PAIN MC MUFFIN","packageSize":"84 PN","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":23,"wednesday_general":23,"friday_general":25}},{"sku":"03776.085","name":"DONUTS SUCRE","packageSize":"27 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":24,"wednesday_general":24,"friday_general":26}},{"sku":"11311.006","name":"MCPOP FRUIT ROUGES","packageSize":"105 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":25,"wednesday_general":25,"friday_general":27}},{"sku":"11312.016","name":"MCPOP NOISETTE","packageSize":"105 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":26,"wednesday_general":26,"friday_general":28}},{"sku":"11312.017","name":"MCPOP CHOC NOISETTE","packageSize":"105 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":27,"wednesday_general":27,"friday_general":29}},{"sku":"11312.020","name":"MCPOP LOTUS","packageSize":"105 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":28,"wednesday_general":28,"friday_general":30}},{"sku":"14841.012","name":"DONUT CHOCOLAT","packageSize":"36 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":29,"wednesday_general":29,"friday_general":31}},{"sku":"14059.002","name":"PAIN 280","packageSize":"84 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":30,"wednesday_general":30,"friday_general":32}},{"sku":"02683.119","name":"TORTILLA GRAND WRAP2","packageSize":"108 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":31,"wednesday_general":31,"friday_general":33}},{"sku":"03114.154","name":"TORTILLA PETIT WRAP","packageSize":"126 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":32,"wednesday_general":32,"friday_general":34}},{"sku":"00004.170","name":"FRITES MCCAIN NEW OIL","packageSize":"12,5 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":33,"wednesday_general":33,"friday_general":35}},{"sku":"13013.002","name":"ROSTI 280","packageSize":"100 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":34,"wednesday_general":34,"friday_general":36}},{"sku":"06776.124","name":"POTATOES","packageSize":"12,5 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":35,"wednesday_general":35,"friday_general":37}},{"sku":"17584.002","name":"NUGGETS VEGGIES","packageSize":"750 CT","storageLabel":"Négatif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":36,"wednesday_general":36,"friday_general":38}},{"sku":"07434.030","name":"JAMBON CROQUE 2","packageSize":"315 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":37,"wednesday_general":37,"friday_general":39}},{"sku":"00013.334","name":"FROMAGE CHEDDAR","packageSize":"1 056 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":38,"wednesday_general":38,"friday_general":40}},{"sku":"14109.003","name":"GOUDA FUME","packageSize":"252 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":39,"wednesday_general":39,"friday_general":41}},{"sku":"19285.002","name":"WHITE CHEDDAR","packageSize":"1 056 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":40,"wednesday_general":40,"friday_general":42}},{"sku":"03940.041","name":"LAIT DEMI ECREME 1 LITRE","packageSize":"6 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":41,"wednesday_general":41,"friday_general":43}},{"sku":"00011.321","name":"SHAKE MIX 1X10L","packageSize":"10 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":42,"wednesday_general":42,"friday_general":44}},{"sku":"00012.607","name":"SUNDAE MIX 2","packageSize":"10 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":43,"wednesday_general":43,"friday_general":45}},{"sku":"10473.019","name":"YAB BIO FRAISE","packageSize":"24 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":44,"wednesday_general":44,"friday_general":46}},{"sku":"07870.064","name":"CAPRI-SUN","packageSize":"40 CT","storageLabel":"Positif","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":45,"friday_general":47}},{"sku":"07919.133","name":"SAUCE TASTY","packageSize":"9 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":46,"wednesday_general":45,"friday_general":48}},{"sku":"13016.010","name":"SAUCE CHEDDAR 2","packageSize":"9 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":47,"wednesday_general":46,"friday_general":49}},{"sku":"00009.328","name":"SAUCE TARTARE","packageSize":"9 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":48,"wednesday_general":47,"friday_general":50}},{"sku":"00055.344","name":"SAUCE BIG MAC X 12","packageSize":"9 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":49,"wednesday_general":48,"friday_general":51}},{"sku":"00552.048","name":"SAUCE MCDELUXE 5","packageSize":"9 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":50,"wednesday_general":49,"friday_general":52}},{"sku":"04552.116","name":"SCE MCEXT MCBACON","packageSize":"9 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":51,"wednesday_general":50,"friday_general":53}},{"sku":"04614.015","name":"SAUCE CBO","packageSize":"9 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":52,"wednesday_general":51,"friday_general":55}},{"sku":"07101.075","name":"CREME SUCRE PARFAIT N2","packageSize":"6 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":53,"wednesday_general":52,"friday_general":56}},{"sku":"08092.005","name":"SAUCE MC CHICKEN","packageSize":"9 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":54,"wednesday_general":53,"friday_general":57}},{"sku":"03237.161","name":"BEURRE LIQUIDE 2","packageSize":"6 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":55,"wednesday_general":54,"friday_general":58}},{"sku":"01466.039","name":"TOPPING M&M'S 2","packageSize":"4,5 CT","storageLabel":"Positif","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":56,"wednesday_general":55,"friday_general":59}},{"sku":"05746.058","name":"OEUF COQUILLE LABEL ROUGE","packageSize":"48 CT","storageLabel":"Sec","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":57,"wednesday_general":56,"friday_general":60}},{"sku":"00019.264","name":"MEGABIB COCA HIGH RATIO 250L","packageSize":"250 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":58,"friday_general":61}},{"sku":"00021.429","name":"FANTA BIB 19L HR","packageSize":"19 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":59,"friday_general":62}},{"sku":"00168.387","name":"SPRITE ZERO BIB 19L","packageSize":"19 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":60,"friday_general":63}},{"sku":"05054.020","name":"COCA ZERO BIB HR 19L","packageSize":"19 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":61,"friday_general":64}},{"sku":"07870.065","name":"OASIS","packageSize":"19 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":62,"friday_general":65}},{"sku":"19858.001","name":"CHERRY COKE ZERO BIB","packageSize":"19 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":63,"friday_general":66}},{"sku":"01809.124","name":"NECTAR DE POMME BIO","packageSize":"24 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":64,"friday_general":67}},{"sku":"05950.027","name":"TROPICANA 20CL","packageSize":"24 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":65,"friday_general":68}},{"sku":"00177.019","name":"SIROP SHAKE CAFE","packageSize":"4,88 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":66,"friday_general":70}},{"sku":"14964.000","name":"SIROP SHAKE VANILLE","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":67,"friday_general":71}},{"sku":"05743.105","name":"LIPTON ICE TEA ZERO","packageSize":"19 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":68,"friday_general":72}},{"sku":"10353.010","name":"BIERE 0 POURCENT","packageSize":"24 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":69,"friday_general":73}},{"sku":"02679.079","name":"KETCHUP BIB CUISINE N2","packageSize":"10 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":70,"friday_general":78}},{"sku":"07672.042","name":"SAUCE CREAMY MUSTARD","packageSize":"4,5 CT","storageLabel":"Sec","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":71,"wednesday_general":57,"friday_general":80}},{"sku":"00408.043","name":"SCE BARBECUE X125","packageSize":"125 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":72,"friday_general":81}},{"sku":"00409.031","name":"SCE CHINOISE X125","packageSize":"125 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":73,"friday_general":82}},{"sku":"02900.108","name":"SCE NEW YORK CEASAR","packageSize":"130 CT","storageLabel":"Sec","inventorySlots":["monday_general","wednesday_general","friday_general"],"sourceLabels":["Lundi Général","Mercredi Général","Vendredi Général"],"inventoryOrders":{"monday_general":74,"wednesday_general":58,"friday_general":83}},{"sku":"05297.100","name":"SAUCE RANCH INTENSIVE 500GR","packageSize":"4 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":75,"friday_general":84}},{"sku":"05928.035","name":"VINAIG H NOISETTE","packageSize":"168 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":76,"friday_general":85}},{"sku":"00065.064","name":"TOPPING CHOCOLAT","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":77,"friday_general":86}},{"sku":"00069.113","name":"TOPPING CARAMEL","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":78,"friday_general":87}},{"sku":"01912.101","name":"TOPPING DAIM 3","packageSize":"10 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":79,"friday_general":88}},{"sku":"08442.102","name":"TOPPING KIT KAT BALL 2","packageSize":"9 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":80,"friday_general":90}},{"sku":"14918.000","name":"SIROP SHAKE FRAISE","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":81,"friday_general":92}},{"sku":"00063.047","name":"CORNICHON X6,8 KG","packageSize":"6,8 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":82,"friday_general":93}},{"sku":"00045.291","name":"KETCHUP DOSETTE","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":83,"friday_general":95}},{"sku":"08158.029","name":"SAUCE CREAMY DELUXE","packageSize":"225 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":84,"friday_general":96}},{"sku":"13117.004","name":"SAUCE FRITE","packageSize":"780 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":85,"friday_general":97}},{"sku":"00043.138","name":"DOSETTE SEL 0,8G X2000","packageSize":"2 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":86,"friday_general":98}},{"sku":"02589.489","name":"HUILE DE FRITURE 2X7,5L","packageSize":"15 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":87,"friday_general":99}},{"sku":"13215.000","name":"BERLINGO POMME PECHE SSA","packageSize":"48 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":88,"friday_general":101}},{"sku":"19300.000","name":"OIGNONS FRITS 2","packageSize":"4,5 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":89,"friday_general":102}},{"sku":"00143.447","name":"SAC E +","packageSize":"250 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":90,"friday_general":103}},{"sku":"05565.393","name":"SAC CABAS 25","packageSize":"250 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":91,"friday_general":104}},{"sku":"10958.848","name":"SAC SOS A","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":92,"friday_general":105}},{"sku":"11580.136","name":"SAC SALADE SDD","packageSize":"250 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":93,"friday_general":106}},{"sku":"13229.587","name":"SAC SOS B","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":94,"friday_general":107}},{"sku":"15849.088","name":"SAC C SDD","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":95,"friday_general":108}},{"sku":"00127.910","name":"SACHET FRITE SDD","packageSize":"3 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":96,"friday_general":109}},{"sku":"15723.010","name":"BOITE MOY FRITE SDD","packageSize":"1 300 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":97,"friday_general":113}},{"sku":"15725.008","name":"BOITE GRANDE FRITE SDD","packageSize":"1 300 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":98,"friday_general":114}},{"sku":"00166.574","name":"BOITE APPLE PIE","packageSize":"500 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":99,"friday_general":115}},{"sku":"00289.552","name":"BOITE A PARTAGER SDD","packageSize":"330 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":100,"friday_general":116}},{"sku":"01833.213","name":"WRAP MC WRAP","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":101,"friday_general":118}},{"sku":"16048.006","name":"BOITE SALADE 5","packageSize":"102 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":102,"friday_general":119}},{"sku":"16051.007","name":"BOITE FLAVOR FRIES","packageSize":"480 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":103,"friday_general":120}},{"sku":"14920.010","name":"GOBELET FRAPPE","packageSize":"576 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":104,"friday_general":122}},{"sku":"18427.001","name":"GOBELET 0.25L","packageSize":"2 240 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":105,"friday_general":123}},{"sku":"18487.000","name":"GOBELET 0.4L","packageSize":"1 260 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":106,"friday_general":124}},{"sku":"18488.000","name":"GOBELET 0.5L","packageSize":"1 176 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":107,"friday_general":125}},{"sku":"00261.259","name":"GOBELET SUNDAE FIBRE","packageSize":"1 260 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":108,"friday_general":126}},{"sku":"00261.295","name":"PETIT GOB SUNDAE","packageSize":"304 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":109,"friday_general":127}},{"sku":"06373.559","name":"GOBELET MC FLURRY","packageSize":"648 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":110,"friday_general":128}},{"sku":"03841.056","name":"PETIT TUBE 85ML SDD","packageSize":"504 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":111,"friday_general":129}},{"sku":"00335.188","name":"COUVERCLE GOB SUNDAE","packageSize":"1 680 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":112,"friday_general":132}},{"sku":"03842.030","name":"COUVERCLE MEMBRANE","packageSize":"TRANSPARENT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":113,"friday_general":133}},{"sku":"14306.004","name":"COUVERCLE FIBRE 3","packageSize":"1 200 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":114,"friday_general":134}},{"sku":"00350.176","name":"CUILLERE EN BOIS","packageSize":"1 800 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":115,"friday_general":138}},{"sku":"00193.676","name":"SERVIETTE","packageSize":"4 500 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":116,"friday_general":140}},{"sku":"00284.191","name":"WRAP PETIT PLAISIR","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":117,"friday_general":144}},{"sku":"00284.266","name":"WRAP PTIT WRAP","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":118,"friday_general":145}},{"sku":"01179.427","name":"WRAP DB CHEESEBURGER","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":119,"friday_general":147}},{"sku":"01180.272","name":"WRAP FOF","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":120,"friday_general":148}},{"sku":"01798.295","name":"WRAP MC CHICKEN","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":121,"friday_general":149}},{"sku":"03688.140","name":"WRAP BIG MAC","packageSize":"1 500 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":122,"friday_general":150}},{"sku":"06869.069","name":"WRAP VEGGIE","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":123,"friday_general":151}},{"sku":"17229.000","name":"WRAP ROYAL","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":124,"friday_general":154}},{"sku":"15924.016","name":"WRAP LARGE FISH","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":125,"friday_general":156}},{"sku":"15924.017","name":"WRAP 280 EXTREME","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":126,"friday_general":157}},{"sku":"15925.005","name":"WRAP TASTY CBO","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":127,"friday_general":158}},{"sku":"00397.065","name":"PORTE GOBELET SECABLE","packageSize":"240 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":128,"friday_general":159}},{"sku":"03651.038","name":"CROISILLON","packageSize":"232 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":129,"friday_general":160}},{"sku":"00223.535","name":"PAILLE PAPIER FRAPPE","packageSize":"2 100 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":130,"friday_general":162}},{"sku":"00195.211","name":"LINER TIROIR UHC","packageSize":"6 000 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":131,"friday_general":163}},{"sku":"06691.942","name":"BOITE HM P1 2026","packageSize":"300 CT","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":132,"friday_general":165}},{"sku":"19872.128","name":"P9 GOURDE STRANGE 26","packageSize":"75 CT","storageLabel":"Sec","inventorySlots":["monday_general"],"sourceLabels":["Lundi Général"],"inventoryOrders":{"monday_general":133}},{"sku":"19872.141","name":"P10 SNOW STRANGE 26","packageSize":"75 CT","storageLabel":"Sec","inventorySlots":["monday_general"],"sourceLabels":["Lundi Général"],"inventoryOrders":{"monday_general":134}},{"sku":"19878.007","name":"L826 AURORE BOREALE","packageSize":"75 CT","storageLabel":"Sec","inventorySlots":["monday_general"],"sourceLabels":["Lundi Général"],"inventoryOrders":{"monday_general":135}},{"sku":"17177.180","name":"AFFV SUMMER PLEASURE","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["monday_general"],"sourceLabels":["Lundi Général"],"inventoryOrders":{"monday_general":136}},{"sku":"14795.001","name":"CARTON COLLECTE","packageSize":"8 PQ","storageLabel":"Sec","inventorySlots":["monday_general","friday_general"],"sourceLabels":["Lundi Général","Vendredi Général"],"inventoryOrders":{"monday_general":137,"friday_general":166}},{"sku":"03858.107","name":"PTIT ANANAS 12X70G","packageSize":"12 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":1,"wednesday_ultra":1,"friday_ultra":1}},{"sku":"08549.113","name":"PTITE POMME X36","packageSize":"36 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":2,"wednesday_ultra":2,"friday_ultra":2}},{"sku":"00028.092","name":"OIGNONS EMINCES 2","packageSize":"1,8 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":3,"wednesday_ultra":3,"friday_ultra":3}},{"sku":"02783.085","name":"SALADE MAC BONDUELLE","packageSize":"10 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":4,"wednesday_ultra":4,"friday_ultra":4}},{"sku":"05239.249","name":"BATAVIA 6X300G BONDU","packageSize":"1,8 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":5,"wednesday_ultra":5,"friday_ultra":5}},{"sku":"08373.010","name":"MIX SALADE HIVER 280G","packageSize":"1,68 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais"],"inventoryOrders":{"monday_ultra":6,"wednesday_ultra":6}},{"sku":"00253.291","name":"TOMATE CHARNUE","packageSize":"240 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":7,"wednesday_ultra":7,"friday_ultra":6}},{"sku":"05767.141","name":"PTITE TOMATE HM","packageSize":"12 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais"],"inventoryOrders":{"monday_ultra":8,"wednesday_ultra":8}},{"sku":"14543.001","name":"KIT CAESAR","packageSize":"24 CT","storageLabel":"Positif","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":9,"wednesday_ultra":9,"friday_ultra":8}},{"sku":"00001.915","name":"PAIN REG BB FRAIS 2","packageSize":"68 CT","storageLabel":"Sec","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":10,"wednesday_ultra":10,"friday_ultra":10}},{"sku":"00003.681","name":"PAIN BM BB FRAIS","packageSize":"30 CT","storageLabel":"Sec","inventorySlots":["monday_ultra","wednesday_ultra","friday_ultra"],"sourceLabels":["Lundi Ultra frais","Mercredi Ultra frais","Vendredi Ultra frais"],"inventoryOrders":{"monday_ultra":11,"wednesday_ultra":11,"friday_ultra":11}},{"sku":"11512.003","name":"MINI COOKIES","packageSize":"500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":1}},{"sku":"01344.029","name":"THE EARL GREY BIO","packageSize":"120 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":2}},{"sku":"13315.001","name":"THE VERT MENTHE BIO","packageSize":"120 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":3}},{"sku":"13469.001","name":"INFUSION CITRON GINGE BIO","packageSize":"120 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":4}},{"sku":"02047.101","name":"SUCRE BUCHETTE 3G","packageSize":"2 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":5}},{"sku":"03496.056","name":"MELANGE SEL POIVRE","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":6}},{"sku":"16667.000","name":"SEL ALIM. SEAU 5KG","packageSize":"5 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":7}},{"sku":"03874.056","name":"FOURCHETTE FLAVOR2","packageSize":"900 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":8}},{"sku":"00730.053","name":"TOUILLETTE","packageSize":"2 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":9}},{"sku":"02820.176","name":"STICKER DOUBLE","packageSize":"5 500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":10}},{"sku":"02820.178","name":"STICKER POULET","packageSize":"5 500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":11}},{"sku":"02820.179","name":"STICKER BACON","packageSize":"5 500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":12}},{"sku":"02820.181","name":"STICKER VARIATION","packageSize":"5 500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":13}},{"sku":"02820.287","name":"STICKER VEGGIE","packageSize":"5 500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":14}},{"sku":"02820.750","name":"STICKER BOI.LAD LONG","packageSize":"2 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":15}},{"sku":"17302.013","name":"ETIQUETTE LIVRAISON","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":16}},{"sku":"00762.010","name":"PINCEAUX TOASTERS2V2","packageSize":"2 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":17}},{"sku":"03868.015","name":"BALAYETTE INTER V2","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":18}},{"sku":"04129.059","name":"BALAI SOL LOBBY V2","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":19}},{"sku":"04136.024","name":"BROSSE FRITEUSE","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":20}},{"sku":"04136.053","name":"KIT GOUPILLONS BLANC","packageSize":"5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":21}},{"sku":"06206.000","name":"BALAYETTE EXTERIEURE","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":22}},{"sku":"00336.030","name":"PELLE RAMASSE MEGOT","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":23}},{"sku":"03923.019","name":"BALAI EXT VERT V2","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":24}},{"sku":"03188.028","name":"MOP ABSORBANTE V2","packageSize":"5 SA","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":25}},{"sku":"03980.006","name":"PRESSE CHARIOT 1 S.","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":26}},{"sku":"04072.093","name":"CHARIOT 2 SEAUX/15L V2","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":27}},{"sku":"18019.000","name":"SUPPORT PLIABLE MOP","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":28}},{"sku":"18020.000","name":"MANCHE SUPP PLIABLE","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":29}},{"sku":"03006.050","name":"SEAU CHIFFON PROPRE","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":30}},{"sku":"03006.051","name":"SEAU CHIFFON SALE","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":31}},{"sku":"04238.081","name":"RECHARGE SUPPORT 1","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":32}},{"sku":"10103.033","name":"COUV SEAU CHIFFON","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":33}},{"sku":"00585.160","name":"PAPIER TOILETTE","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":34}},{"sku":"04081.142","name":"BOBINES ESSUYAGE","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":35}},{"sku":"00334.132","name":"SERVIET.COMPTOIR X72","packageSize":"72 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":36}},{"sku":"00334.409","name":"LAVETTE BL 42 8X35,5","packageSize":"420 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":37}},{"sku":"00327.020","name":"EPONGE ABRASIVE","packageSize":"60 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":38}},{"sku":"00340.051","name":"SERVIETTE GRILL X40","packageSize":"40 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":39}},{"sku":"03574.030","name":"MCD TAMP. GR. NV","packageSize":"10 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":40}},{"sku":"04225.000","name":"EPONGE POWER PAD KAY","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":41}},{"sku":"13170.003","name":"RECHARG TAMPON FRIT","packageSize":"10 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":42}},{"sku":"17102.000","name":"RECHARGE RACLETTE","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":43}},{"sku":"17102.001","name":"RACL SOL MOUSSE 50","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":44}},{"sku":"00355.586","name":"SAVON ANTIMICROBE 1L","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":45}},{"sku":"02858.150","name":"MOUSSE WC DESINFECT","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":46}},{"sku":"10498.008","name":"CREME MAIN","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":47}},{"sku":"00211.102","name":"CLAX HYPO CONCENTRE","packageSize":"10 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":48}},{"sku":"00307.101","name":"EASY WASH EXTRA","packageSize":"150 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":49}},{"sku":"04060.028","name":"SUMA SHAKE","packageSize":"10 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":50}},{"sku":"04060.108","name":"OXYVIR DESINFECTANT","packageSize":"4,5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":51}},{"sku":"04433.048","name":"MILD LESSIVE LINGE","packageSize":"10 BI","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":52}},{"sku":"00215.165","name":"HEAVY DUTY DEGREASER","packageSize":"16 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":53}},{"sku":"00215.209","name":"KAY CONTACT CLEANER","packageSize":"4 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":54}},{"sku":"00301.180","name":"KAY SIZZLE PLUS","packageSize":"4 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":55}},{"sku":"00308.009","name":"MCD FRITEUSE","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":56}},{"sku":"02437.191","name":"SUMA TERA L56","packageSize":"10 BI","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":57}},{"sku":"04131.105","name":"LIQUIDE RINCAGE RU","packageSize":"10 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":58}},{"sku":"06961.102","name":"AMC NETTOY LT/CF X50","packageSize":"50 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":59}},{"sku":"06961.103","name":"PAST NET CAFE MELITA","packageSize":"150 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":60}},{"sku":"15616.000","name":"HYGIENE TABS","packageSize":"1 BT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":61}},{"sku":"00225.088","name":"SK DETERG VITRE MULT","packageSize":"4,5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":62}},{"sku":"00300.011","name":"SG NETTOYANT INOX","packageSize":"6 BI","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":63}},{"sku":"00300.074","name":"KAY SPE CLEAN POLISH","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":64}},{"sku":"03014.107","name":"FC NETTSOL CONC","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":65}},{"sku":"00304.473","name":"DR DETERGENT","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":66}},{"sku":"02205.009","name":"DESINF.TOMA. DIVERS.","packageSize":"10 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":67}},{"sku":"02437.194","name":"HA NETT PLGE CONC","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":68}},{"sku":"04701.087","name":"CREME INOX","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":69}},{"sku":"02722.034","name":"KL DETARTRANT 2","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":70}},{"sku":"00584.024","name":"TAYLOR LUB. ROUGE","packageSize":"1 TB","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":71}},{"sku":"02786.027","name":"SUMA FREEZE","packageSize":"2 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":72}},{"sku":"02701.009","name":"TEFLON TAYL 3 RABATS","packageSize":"9 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":73}},{"sku":"07409.021","name":"TEFLONS DCFT","packageSize":"4 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":74}},{"sku":"00212.106","name":"DRAPEAU MKF","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":75}},{"sku":"00583.117","name":"DISTRIB BOBINE ES 2","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":76}},{"sku":"00326.100","name":"DISTRIB.SAV.EQUIP","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":77}},{"sku":"00326.102","name":"DISTRIB WC DESINFECTANT","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":78}},{"sku":"00326.124","name":"DIST ACIER SAV SANIT","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":79}},{"sku":"00643.056","name":"DR KIT PULV. CONC.","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":80}},{"sku":"00643.144","name":"VAPO M.UP ASEPTISANT","packageSize":"3 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":81}},{"sku":"03863.012","name":"DISTRIBUTEUR GANT","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":82}},{"sku":"01924.000","name":"PREFILTRE BOISSON","packageSize":"1 CH","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":83}},{"sku":"03190.100","name":"30 FILTRES FRIT.LOV","packageSize":"30 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":84}},{"sku":"16702.000","name":"ECRAN FILTRAGE","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":85}},{"sku":"00357.133","name":"RU SAC PB TRANS 60L","packageSize":"350 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":86}},{"sku":"00357.160","name":"SAC POUB JAUNE 130L","packageSize":"100 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":87}},{"sku":"00357.161","name":"SAC POUB TRANS 130L","packageSize":"100 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":88}},{"sku":"00357.163","name":"SAC PB CPT 170L","packageSize":"100 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":89}},{"sku":"03159.010","name":"SAC PB TRANS 50LX25","packageSize":"625 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":90}},{"sku":"01672.000","name":"GANT GRILL","packageSize":"500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":91}},{"sku":"01672.073","name":"GANT LIVRAISON T8","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":92}},{"sku":"01672.074","name":"GANT LIVRAISON T9","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":93}},{"sku":"03420.059","name":"GANT FILTRAGE MOYEN","packageSize":"1 PQ","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":94}},{"sku":"03420.060","name":"GANT FILTRAGE GRAND","packageSize":"1 PQ","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":95}},{"sku":"07319.022","name":"GANTS SALADES","packageSize":"100 PQ","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":96}},{"sku":"07607.027","name":"GANT PEVA TAILLE GRA","packageSize":"100 SA","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":97}},{"sku":"13790.002","name":"GANT ANTI COUPURE M","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":98}},{"sku":"13790.003","name":"GANT ANTI COUPURE L","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":99}},{"sku":"14078.001","name":"GANT MENA T8 9","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":100}},{"sku":"14079.001","name":"GANT MENA T7/8","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":101}},{"sku":"17109.000","name":"ADHESIF MRN X6 RLX V2","packageSize":"6 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":102}},{"sku":"00871.072","name":"TABLIER FILTRAGE","packageSize":"1 PQ","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":103}},{"sku":"00871.078","name":"TABLIER JET.BL X100","packageSize":"100 PQ","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":104}},{"sku":"01630.021","name":"PETIT TEFLON HEBT","packageSize":"2 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":105}},{"sku":"01630.024","name":"GRAND TEFLON HEBT","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":106}},{"sku":"01630.027","name":"MOYEN TEFLON HEBT","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":107}},{"sku":"01916.009","name":"TESTEUR KAY ASEPT","packageSize":"2 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":108}},{"sku":"01916.015","name":"DIVERSEY TESTEUR DR","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":109}},{"sku":"02121.182","name":"RLX THERMIQUES","packageSize":"20 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":110}},{"sku":"02121.955","name":"ROULEAUX STICKY","packageSize":"24 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":111}},{"sku":"02121.956","name":"RLX TPE PORTATIF","packageSize":"20 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":112}},{"sku":"04078.058","name":"SEL ADOUCISSEUR 15KG","packageSize":"1 SC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":113}},{"sku":"04125.062","name":"FILM PLASTIQUE 30","packageSize":"4 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":114}},{"sku":"04718.104","name":"RECHARG DIFFUSEUR WC","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":115}},{"sku":"04999.003","name":"TESTEUR CHLORE","packageSize":"400 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":116}},{"sku":"05623.026","name":"TEFLON COURRONE DCFT","packageSize":"2 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":117}},{"sku":"06323.107","name":"KIT DE DEVERSEMENT","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":118}},{"sku":"07603.750","name":"MCD GRILL QSR","packageSize":"9,75 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":119}},{"sku":"10257.011","name":"DIFFUSEUR SANITAIRE","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":120}},{"sku":"10672.008","name":"PARASOL VCVE SUB","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":121}},{"sku":"15505.037","name":"MASQUE DE PROTECTION","packageSize":"50 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":122}},{"sku":"16544.009","name":"CACHE BARBE","packageSize":"100 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":123}},{"sku":"16847.000","name":"SERRE TETE ET ECRAN","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":124}},{"sku":"17009.013","name":"STICK DOME CUISINE1L","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":125}},{"sku":"17111.002","name":"PANNEAU AVERT SOL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":126}},{"sku":"17241.002","name":"PALET RUPT GRIL x5","packageSize":"5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":127}},{"sku":"17355.000","name":"PASTILLES ADHESIVES","packageSize":"1 RL","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":128}},{"sku":"17429.001","name":"PALET RUPT FRIT x5","packageSize":"5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":129}},{"sku":"18071.000","name":"RLX DLC IMPZEBRA","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":130}},{"sku":"18867.002","name":"PANSEMENTS","packageSize":"100 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":131}},{"sku":"19111.000","name":"KIT DE JOINTS","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":132}},{"sku":"01714.059","name":"FILET A CHEVEUX","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":133}},{"sku":"14406.001","name":"SURCHAUSSURES M","packageSize":"1 PQ","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":134}},{"sku":"14406.002","name":"SURCHAUSSURES L","packageSize":"1 PQ","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":135}},{"sku":"14406.003","name":"SURCHAUSSURES XL","packageSize":"1 PQ","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":136}},{"sku":"14406.004","name":"COQUES L2D XS","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":137}},{"sku":"14406.005","name":"COQUES L2D S","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":138}},{"sku":"14406.007","name":"COQUES L2D L","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":139}},{"sku":"02619.289","name":"ENV.DEPOT 1/2 FORMAT","packageSize":"500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":140}},{"sku":"17105.000","name":"BOITE 5 RAMETTES A4","packageSize":"2 500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":141}},{"sku":"14625.971","name":"ATTACHE PARIS ANI VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":142}},{"sku":"19423.291","name":"PAP CREPON BLEU VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":143}},{"sku":"19423.292","name":"PAP CREPON VERT VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":144}},{"sku":"19423.294","name":"PAP CREPON JAUNE VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":145}},{"sku":"19423.295","name":"PAP CREPON ROUGE VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":146}},{"sku":"11880.004","name":"BONBON HAPPY AVENTUR","packageSize":"200 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":147}},{"sku":"05672.031","name":"STICKER A UTILI PRIO","packageSize":"500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":148}},{"sku":"02707.425","name":"COMPLEMEN FICHE INFO","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":149}},{"sku":"02707.428","name":"KIT FIABILITE","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":150}},{"sku":"02707.429","name":"KIT EXPERIENC CLIENT","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":151}},{"sku":"14690.000","name":"GONFLEUR BALL ELECT","packageSize":"1 PC","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":152}},{"sku":"14872.000","name":"ARBRE A BALLON","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":153}},{"sku":"14872.004","name":"BALLONS IMPRIM HAPPY","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":154}},{"sku":"14872.026","name":"BALLONS MARIO","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":155}},{"sku":"17009.081","name":"KIT STICK FRIT LIG","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":156}},{"sku":"18153.003","name":"CALENDRIER PEP 2026","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":157}},{"sku":"18611.001","name":"GUIDE QUALITE X5 24","packageSize":"5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":158}},{"sku":"04796.033","name":"HAPPY CADEAU MARIO","packageSize":"600 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":159}},{"sku":"05650.058","name":"BTE CRAYONS COLOR 24","packageSize":"300 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":160}},{"sku":"18280.007","name":"ANNIV PACK GOUT DECO","packageSize":"5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":161}},{"sku":"18454.029","name":"ANNIV KDO BATEAU STU","packageSize":"12 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":162}},{"sku":"19739.016","name":"BRACELETS PDC 26","packageSize":"400 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":163}},{"sku":"19751.001","name":"MOULINS A VENT","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":164}},{"sku":"19895.110","name":"SET DE 3 PINS FID","packageSize":"20 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":165}},{"sku":"20202.001","name":"BOB FIFA FID","packageSize":"20 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":166}},{"sku":"00202.414","name":"TIGES BALLON CARTON","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":167}},{"sku":"02356.001","name":"REGLES ANIM VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":168}},{"sku":"08205.692","name":"HAPPY CADEAU 2025","packageSize":"800 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":169}},{"sku":"14625.972","name":"FEUILLE BL ANIM VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":170}},{"sku":"16787.018","name":"ANNIV KIT PERM ANIMA","packageSize":"4 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":171}},{"sku":"17177.181","name":"AFF EQU FIFA 2026","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":172}},{"sku":"17177.183","name":"AFF V RV FIFA 2026","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":173}},{"sku":"17448.022","name":"KM FIFA 2026","packageSize":"18 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":174}},{"sku":"17936.115","name":"ABR DR FIFA 2026","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":175}},{"sku":"18047.068","name":"VITRO FIFA 2026","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":176}},{"sku":"18280.004","name":"ANNIV PACK INVITATIO","packageSize":"2 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":177}},{"sku":"18280.008","name":"ANNIV PACK GOUT DECO","packageSize":"5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":178}},{"sku":"18454.003","name":"ANNIV PACK ANIMA 2/2","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":179}},{"sku":"18673.028","name":"STCIKERS GEN ANIM VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":180}},{"sku":"18673.044","name":"STICK B 32 FIFA 2026","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":181}},{"sku":"18992.001","name":"ANNIV PACK ANIMA 1/2","packageSize":"5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":182}},{"sku":"19423.293","name":"COLLE PR ANIM VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":183}},{"sku":"19423.296","name":"CISEAUX ANIM VL","packageSize":"1 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":184}},{"sku":"20221.000","name":"HAB BOR JUN STRANG26","packageSize":"4 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":185}},{"sku":"20221.001","name":"VITROPHANI STRANG26","packageSize":"5 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":186}},{"sku":"16770.001","name":"ABM THEATRE SAVANE","packageSize":"11 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":187}},{"sku":"18182.007","name":"KIT CREATIVITE 2025","packageSize":"66 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":188}},{"sku":"02820.182","name":"STICKER ORANGE","packageSize":"5 500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":189}},{"sku":"02820.184","name":"STICKER COCA","packageSize":"5 500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":190}},{"sku":"02820.185","name":"STICKER REUSE JAUNE","packageSize":"500 CT","storageLabel":"Sec","inventorySlots":["wednesday_hub"],"sourceLabels":["Mercredi HUB"],"inventoryOrders":{"wednesday_hub":191}},{"sku":"06819.047","name":"PALET MOZZA CHEDDAR","packageSize":"108 CT","storageLabel":"Négatif","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":9}},{"sku":"00575.105","name":"GATEAU ANNIV CHOCO","packageSize":"4 CT","storageLabel":"Négatif","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":13}},{"sku":"04572.008","name":"SAUCE CURRY MANGO","packageSize":"4,5 CT","storageLabel":"Positif","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":54}},{"sku":"18358.003","name":"COULIS PISTACHE","packageSize":"5,4 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":69}},{"sku":"16389.001","name":"SIROP FRUIT DU DRAGON","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":74}},{"sku":"03758.104","name":"MONBANA STICKS","packageSize":"130 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":75}},{"sku":"01007.150","name":"CAFE SZF RA IP","packageSize":"6 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":76}},{"sku":"01219.094","name":"DECA SACHET RA IP","packageSize":"50 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":77}},{"sku":"00026.054","name":"MOUTARDE VRAC20X750G","packageSize":"13,4 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":79}},{"sku":"01912.108","name":"TOPPING CRUMBLE","packageSize":"4 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":89}},{"sku":"00017.101","name":"SACHET CACAHUETES 7 GR","packageSize":"650 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":91}},{"sku":"00410.004","name":"SCE MOUTARDE X125","packageSize":"125 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":94}},{"sku":"00056.072","name":"OIGNONS REG","packageSize":"32 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":100}},{"sku":"02937.124","name":"SACHET PATISSERIE","packageSize":"2 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":110}},{"sku":"03723.344","name":"SACHET 4 NUGGETS","packageSize":"3 200 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":111}},{"sku":"17327.010","name":"SACHET 6 NUG","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":112}},{"sku":"17293.006","name":"SACHET NUGGETS X9","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":117}},{"sku":"00232.710","name":"GOBELET 0,2L CAFE","packageSize":"816 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":121}},{"sku":"00187.647","name":"GOBELET 0,4L CAFE","packageSize":"192 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":130}},{"sku":"18489.000","name":"GOBELET 0.07L","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":131}},{"sku":"10927.065","name":"COUVERCLE FIBRE CAFE","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":135}},{"sku":"16192.000","name":"COUVERCLE ESPRESSO","packageSize":"600 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":136}},{"sku":"00319.107","name":"COUTEAU EN BOIS","packageSize":"1 500 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":137}},{"sku":"00353.146","name":"FOURCHETTE EN BOIS","packageSize":"1 500 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":139}},{"sku":"06025.057","name":"NAPPERONS","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":141}},{"sku":"11596.019","name":"WRAP EGG MCMUFFIN","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":142}},{"sku":"00284.170","name":"WRAP HAMBURGER","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":143}},{"sku":"00285.874","name":"WRAP CHEESEBURGER","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":146}},{"sku":"10618.057","name":"WRAP GEN ORANGE","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":152}},{"sku":"17147.002","name":"WRAP MC CROQ","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":153}},{"sku":"00286.337","name":"WRAP MCFISH","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":155}},{"sku":"07311.092","name":"BOITE DUO MACARON","packageSize":"250 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":161}},{"sku":"00195.212","name":"FEUILLE CUISSON","packageSize":"1 000 CT","storageLabel":"Sec","inventorySlots":["friday_general"],"sourceLabels":["Vendredi Général"],"inventoryOrders":{"friday_general":164}},{"sku":"00437.280","name":"CONCOMBRE HM","packageSize":"12 CT","storageLabel":"Positif","inventorySlots":["friday_ultra"],"sourceLabels":["Vendredi Ultra frais"],"inventoryOrders":{"friday_ultra":7}},{"sku":"08373.012","name":"MIX SALADE ETE 280G","packageSize":"1,68 CT","storageLabel":"Positif","inventorySlots":["friday_ultra"],"sourceLabels":["Vendredi Ultra frais"],"inventoryOrders":{"friday_ultra":9}}];

function parseDate(value) {
  if (!value) return new Date();
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDateInput(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateFr(value) {
  const date = parseDate(value);
  return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function defaultHubReferenceDate() {
  // Référence issue du bon de commande HUB fourni : mercredi 20/05/2026.
  return '2026-05-20';
}

function inventoryTypeLabel(type) {
  return INVENTORY_TYPES.find(t => t.id === type)?.label || type || 'Inventaire';
}

const defaultState = () => ({
  version: APP_VERSION,
  products: [],
  suppliers: [],
  zones: [],
  orders: [],
  scannedOrders: [],
  scannedReceipts: [],
  receipts: [],
  movements: [],
  inventorySessions: [],
  monthEndSessions: [],
  settings: {
    companyName: 'Mon établissement',
    sequenceMode: 'FEFO',
    lowStockColor: 'danger',
    hubReferenceDate: defaultHubReferenceDate(),
    inventoryProjectionWeeks: 8,
    logoDataUrl: '',
    logoFileName: ''
  }
});

let state = loadState();
let currentPage = 'dashboard';
let currentFilter = '';
let orderDraft = [];
let receiptDraft = [];
let pendingOrderScan = null;
let pendingReceiptScan = null;
let selectedInventorySlot = null;
let inventoryFocusMode = false;
let inventorySubPage = 'entry';
let showArchivedProducts = false;
let productSubPage = 'active';
let productCategoryFilter = 'all';
let productSortMode = 'inventory';
let inventoryDraftValues = {};
let selectedMonthEndMonth = today().slice(0, 7);
let monthEndDraftValues = {};
let supabaseClient = null;
let cloudReady = false;
let cloudSaveTimer = null;
let isApplyingCloudState = false;
let lastCloudSaveAt = '';

const pages = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'inventory', label: 'Inventaire', icon: '📦' },
  { id: 'receipts', label: 'Réception', icon: '🚚' },
  { id: 'orders', label: 'Commande', icon: '🧾' },
  { id: 'monthEnd', label: 'Fin de Mois', icon: '📋' },
  { id: 'products', label: 'Produits', icon: '🏷️' },
  { id: 'zones', label: 'Zones de stockage', icon: '🗺️' },
  { id: 'suppliers', label: 'Fournisseur', icon: '🤝' },
  { id: 'settings', label: 'Paramètres', icon: '⚙️' }
];

function normalizeScanPage(page = {}, fallback = {}, index = 0) {
  const fileData = page.fileData || fallback.fileData || '';
  if (!fileData) return null;
  return {
    id: page.id || `${fallback.id || uid()}-page-${index + 1}`,
    fileName: page.fileName || fallback.fileName || `page-${index + 1}.jpg`,
    fileType: page.fileType || fallback.fileType || 'image/jpeg',
    fileData,
    scannedAt: page.scannedAt || fallback.scannedAt || new Date().toISOString()
  };
}

function normalizeScannedDocumentRecord(scan = {}) {
  const rawPages = Array.isArray(scan.pages) ? scan.pages : [];
  let pages = rawPages.map((page, index) => normalizeScanPage(page, scan, index)).filter(Boolean);
  if (!pages.length && scan.fileData) {
    const legacyPage = normalizeScanPage({}, scan, 0);
    if (legacyPage) pages = [legacyPage];
  }
  const normalized = { ...scan, pages };
  delete normalized.fileData;
  delete normalized.fileName;
  delete normalized.fileType;
  return normalized;
}

function scanPages(scan = {}) {
  if (Array.isArray(scan.pages) && scan.pages.length) return scan.pages;
  if (scan.fileData) {
    return [{
      id: `${scan.id || 'legacy'}-page-1`,
      fileName: scan.fileName || 'page-1.jpg',
      fileType: scan.fileType || 'image/jpeg',
      fileData: scan.fileData,
      scannedAt: scan.scannedAt || ''
    }];
  }
  return [];
}

function scanPageCount(scan = {}) {
  return scanPages(scan).length;
}

function normalizeState(input = {}) {
  const defaults = defaultState();
  const parsed = input && typeof input === 'object' ? input : {};
  const merged = {
    ...defaults,
    ...parsed,
    settings: { ...defaults.settings, ...(parsed.settings || {}) },
    inventorySessions: parsed.inventorySessions || [],
    monthEndSessions: parsed.monthEndSessions || [],
    scannedOrders: (parsed.scannedOrders || []).map(normalizeScannedDocumentRecord),
    scannedReceipts: (parsed.scannedReceipts || []).map(normalizeScannedDocumentRecord),
    products: (parsed.products || []).map(migrateProduct)
  };
  return ensureInventoryCatalog(merged);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ensureInventoryCatalog(defaultState());
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.error(error);
    return ensureInventoryCatalog(defaultState());
  }
}

function migrateProduct(product) {
  const base = { ...product };
  if (!Array.isArray(base.inventorySlots)) base.inventorySlots = [];
  if (!base.inventoryOrders || typeof base.inventoryOrders !== 'object' || Array.isArray(base.inventoryOrders)) base.inventoryOrders = {};
  if (base.monthEndOrder === undefined || base.monthEndOrder === null) base.monthEndOrder = '';

  let inventoryTypes = [];
  if (Array.isArray(base.inventoryTypes) && base.inventoryTypes.length) inventoryTypes = base.inventoryTypes;
  else if (base.inventoryType) inventoryTypes = [base.inventoryType];
  else if (base.inventorySlots.length) inventoryTypes = inventoryTypesFromSlots(base.inventorySlots);
  else {
    const text = `${base.category || ''} ${base.name || ''}`.toLowerCase();
    if (text.includes('hub')) inventoryTypes = ['hub'];
    else if (text.includes('ultra') || text.includes('frais') || text.includes('salade')) inventoryTypes = ['ultra'];
    else inventoryTypes = ['general'];
  }

  const migrated = { ...base, inventoryTypes: uniqueList(inventoryTypes) };
  return normalizeHubProductCategory(migrated);
}

function stableProductId(sku) {
  return `prod-${String(sku || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;
}

function uniqueList(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function isHubInventoryProduct(product = {}) {
  const slots = Array.isArray(product.inventorySlots) ? product.inventorySlots : [];
  const types = Array.isArray(product.inventoryTypes) ? product.inventoryTypes : [];
  const labels = Array.isArray(product.sourceLabels) ? product.sourceLabels.join(' ').toLowerCase() : '';
  return slots.includes('wednesday_hub') || types.includes('hub') || labels.includes('hub');
}

function normalizeHubProductCategory(product = {}) {
  return isHubInventoryProduct(product) ? { ...product, category: 'HUB' } : product;
}

function productCategoryLabel(product = {}) {
  return isHubInventoryProduct(product) ? 'HUB' : (product.category || product.storageLabel || '-');
}

function zoneMatchesLabel(zone, label) {
  const normalized = String(label || '').toLowerCase();
  if (!normalized) return false;
  if (String(zone.name || '').toLowerCase() === normalized) return true;
  if (String(zone.code || '').toLowerCase() === normalized) return true;
  return (zone.aliases || []).some(alias => String(alias || '').toLowerCase() === normalized);
}

function zoneTemplateForLabel(label) {
  return DEFAULT_STORAGE_ZONES.find(z => zoneMatchesLabel(z, label)) || { id: uid(), sequence: 99, code: '', name: label || 'Zone', aliases: [], type: label || '', temperature: '', description: '' };
}

function ensureStoragePlanZones(targetState) {
  targetState.zones = targetState.zones || [];
  DEFAULT_STORAGE_ZONES.forEach(template => {
    const existing = targetState.zones.find(zone => zone.id === template.id || zoneMatchesLabel(template, zone.name) || zoneMatchesLabel(zone, template.name));
    if (existing) Object.assign(existing, {
      id: template.id,
      sequence: template.sequence,
      code: existing.code || template.code,
      name: template.name,
      aliases: uniqueList([...(existing.aliases || []), ...(template.aliases || [])]),
      type: existing.type || template.type,
      temperature: existing.temperature || template.temperature,
      description: existing.description || template.description
    });
    else targetState.zones.push({ ...template, aliases: [...(template.aliases || [])] });
  });
}

function ensureZone(targetState, label) {
  if (!label) return '';
  targetState.zones = targetState.zones || [];
  const template = zoneTemplateForLabel(label);
  const existing = targetState.zones.find(z => z.id === template.id || zoneMatchesLabel(z, label) || zoneMatchesLabel(template, z.name));
  if (existing) return existing.id;
  const zone = { ...template, id: template.id || uid(), aliases: [...(template.aliases || [])] };
  targetState.zones.push(zone);
  return zone.id;
}

function inventoryTypesFromSlots(slots = []) {
  return uniqueList(slots.map(slot => INVENTORY_SLOT_DEFINITIONS.find(def => def.id === slot)?.type));
}

function inventorySlotKey(dateValue, type) {
  const dayKey = INVENTORY_DAY_KEYS[parseDate(dateValue).getDay()];
  return dayKey ? `${dayKey}_${type}` : '';
}

function inventorySlotLabel(slot) {
  return INVENTORY_SLOT_DEFINITIONS.find(def => def.id === slot)?.label || slot;
}

function productInventorySlots(product = {}) {
  if (Array.isArray(product.inventorySlots) && product.inventorySlots.length) return product.inventorySlots;
  const types = productInventoryTypes(product);
  return INVENTORY_SLOT_DEFINITIONS.filter(def => types.includes(def.type)).map(def => def.id);
}

function inventorySlotBadges(product) {
  const slots = productInventorySlots(product);
  const ordered = INVENTORY_SLOT_ORDER.filter(slot => slots.includes(slot));
  return ordered.map(slot => `<span class="badge info">${escapeHtml(inventorySlotLabel(slot))}</span>`).join(' ');
}

function inventoryPlanChecks(product = {}) {
  const selected = productInventorySlots(product);
  return INVENTORY_SLOT_DEFINITIONS.map(slot => `
    <label class="checkbox-line"><input type="checkbox" name="inventorySlots" value="${slot.id}" ${selected.includes(slot.id) ? 'checked' : ''} /> ${escapeHtml(slot.label)}</label>
  `).join('');
}

function inventoryOrderInputs(product = {}) {
  const orders = product.inventoryOrders || {};
  return INVENTORY_SLOT_DEFINITIONS.map(slot => `
    <label>${escapeHtml(slot.label)}<input name="order_${slot.id}" type="number" min="1" step="1" value="${escapeHtml(orders[slot.id] || '')}" placeholder="Ordre" /></label>
  `).join('');
}

function defaultCatalogItemForSku(sku) {
  return DEFAULT_INVENTORY_CATALOG.find(item => item.sku === sku);
}

function defaultInventoryOrder(sku, slot) {
  const item = defaultCatalogItemForSku(sku);
  return Number(item?.inventoryOrders?.[slot] || 0);
}

function productInventoryOrder(product, slot) {
  const manual = Number(product?.inventoryOrders?.[slot] || 0);
  if (manual > 0) return manual;
  const fallback = defaultInventoryOrder(product?.sku, slot);
  return fallback > 0 ? fallback : 999999;
}

function setProductInventoryOrder(productId, slot, order) {
  const product = getProduct(productId);
  if (!product) return;
  product.inventoryOrders = { ...(product.inventoryOrders || {}), [slot]: Number(order || 0) };
}

function defaultMonthEndOrder(sku) {
  const index = DEFAULT_INVENTORY_CATALOG.findIndex(item => item.sku === sku);
  return index >= 0 ? index + 1 : 999999;
}

function monthEndProductOrder(product = {}) {
  const manual = Number(product.monthEndOrder || 0);
  if (manual > 0) return manual;
  return defaultMonthEndOrder(product.sku);
}

function monthEndProductSort(a, b) {
  return monthEndProductOrder(a) - monthEndProductOrder(b)
    || String(productCategoryLabel(a) || '').localeCompare(String(productCategoryLabel(b) || ''), 'fr', { sensitivity: 'base' })
    || String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
}

function getMonthEndSession(month) {
  return (state.monthEndSessions || []).find(session => session.month === month);
}


function monthEndDraftKey(month) {
  return month || selectedMonthEndMonth || today().slice(0, 7);
}

function monthEndOrderValue(product = {}, draftForMonth = {}) {
  const draftOrder = draftForMonth[product.id]?.order;
  const raw = draftOrder !== undefined ? draftOrder : product.monthEndOrder;
  const manual = Number(raw || 0);
  if (manual > 0) return manual;
  return defaultMonthEndOrder(product.sku);
}

function monthEndProductSortWithDraft(draftForMonth = {}) {
  return (a, b) => monthEndOrderValue(a, draftForMonth) - monthEndOrderValue(b, draftForMonth)
    || String(productCategoryLabel(a) || '').localeCompare(String(productCategoryLabel(b) || ''), 'fr', { sensitivity: 'base' })
    || String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
}

function getMonthEndDuplicateOrders(products = [], draftForMonth = {}) {
  const groups = new Map();
  products.forEach(product => {
    const order = monthEndOrderValue(product, draftForMonth);
    if (!Number.isFinite(order) || order <= 0 || order >= 999999) return;
    const key = String(order);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });
  return Array.from(groups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([order, items]) => ({ order, items }));
}

function duplicateMonthEndMessage(duplicates = []) {
  if (!duplicates.length) return '';
  return duplicates.map(group => {
    const names = group.items.slice(0, 4).map(product => product.name || product.sku || 'Produit').join(', ');
    const extra = group.items.length > 4 ? `, +${group.items.length - 4} autre(s)` : '';
    return `N° ${group.order} : ${names}${extra}`;
  }).join('\n');
}

function cacheCurrentMonthEndDraft() {
  const month = document.querySelector('[data-month-end-month]')?.value || selectedMonthEndMonth || today().slice(0, 7);
  selectedMonthEndMonth = month;
  const draft = {};
  state.products.filter(product => product.active !== false).forEach(product => {
    const orderInput = document.querySelector(`[data-month-order="${product.id}"]`);
    const ueInput = document.querySelector(`[data-month-ue="${product.id}"]`);
    const suInput = document.querySelector(`[data-month-su="${product.id}"]`);
    const uuInput = document.querySelector(`[data-month-uu="${product.id}"]`);
    const noteInput = document.querySelector(`[data-month-note="${product.id}"]`);
    if (orderInput || ueInput || suInput || uuInput || noteInput) {
      draft[product.id] = {
        order: orderInput ? orderInput.value : undefined,
        ue: ueInput ? ueInput.value : undefined,
        su: suInput ? suInput.value : undefined,
        uu: uuInput ? uuInput.value : undefined,
        note: noteInput ? noteInput.value : undefined
      };
    }
  });
  monthEndDraftValues[monthEndDraftKey(month)] = draft;
  return draft;
}

function inventoryDraftKey(date, type) {
  return `${date}|${type}`;
}

function cacheCurrentInventoryDraft(date, type) {
  const key = inventoryDraftKey(date, type);
  const draft = {};
  productsForInventory(type, date).forEach(product => {
    const countInput = document.querySelector(`[data-count="${product.id}"]`);
    const noteInput = document.querySelector(`[data-inventory-note="${product.id}"]`);
    if (countInput || noteInput) draft[product.id] = { countedQty: countInput?.value ?? '', note: noteInput?.value ?? '' };
  });
  inventoryDraftValues[key] = draft;
}

function ensureInventoryCatalog(targetState) {
  targetState.zones = targetState.zones || [];
  ensureStoragePlanZones(targetState);
  DEFAULT_STORAGE_ZONES.forEach(zone => ensureZone(targetState, zone.name));
  targetState.products = (targetState.products || []).map(migrateProduct);
  const existingBySku = new Map(targetState.products.filter(p => p.sku).map(p => [p.sku, p]));
  DEFAULT_INVENTORY_CATALOG.forEach((item, index) => {
    const zoneId = ensureZone(targetState, item.storageLabel);
    const existing = existingBySku.get(item.sku);
    if (existing) {
      existing.name = existing.name || item.name;
      existing.unit = existing.unit || 'colis';
      existing.packageSize = existing.packageSize || item.packageSize;
      existing.storageLabel = existing.storageLabel || item.storageLabel;
      existing.storageZoneId = existing.storageZoneId || zoneId;
      existing.inventorySlots = uniqueList([...(existing.inventorySlots || []), ...(item.inventorySlots || [])]).sort((a,b) => INVENTORY_SLOT_ORDER.indexOf(a) - INVENTORY_SLOT_ORDER.indexOf(b));
      existing.inventoryTypes = uniqueList([...(existing.inventoryTypes || []), ...inventoryTypesFromSlots(existing.inventorySlots)]);
      existing.category = isHubInventoryProduct(existing) || isHubInventoryProduct(item) ? 'HUB' : (existing.category || item.storageLabel);
      existing.inventoryOrders = { ...(item.inventoryOrders || {}), ...(existing.inventoryOrders || {}) };
      if (!Number(existing.monthEndOrder || 0)) existing.monthEndOrder = index + 1;
      if (existing.active === undefined) existing.active = true;
    } else {
      targetState.products.push({
        id: stableProductId(item.sku),
        sku: item.sku,
        name: item.name,
        category: isHubInventoryProduct(item) ? 'HUB' : item.storageLabel,
        unit: 'colis',
        packageSize: item.packageSize,
        minStock: 0,
        maxStock: 0,
        lastPrice: 0,
        supplierId: '',
        storageZoneId: zoneId,
        storageLabel: item.storageLabel,
        active: true,
        inventorySlots: item.inventorySlots || [],
        inventoryTypes: inventoryTypesFromSlots(item.inventorySlots || []),
        inventoryOrders: item.inventoryOrders || {},
        monthEndOrder: index + 1,
        sourceLabels: item.sourceLabels || [],
        storageNote: `Conditionnement : ${item.packageSize || '-'}. Source : ${item.sourceLabels?.join(', ') || 'liste inventaire'}.`
      });
    }
  });
  return targetState;
}

function stateWithoutHeavyScanData(sourceState = state) {
  const clone = JSON.parse(JSON.stringify(sourceState));
  const stripPages = list => (list || []).map(scan => ({
    ...scan,
    pages: scanPages(scan).map(page => ({
      ...page,
      fileData: ''
    }))
  }));
  clone.scannedOrders = stripPages(clone.scannedOrders);
  clone.scannedReceipts = stripPages(clone.scannedReceipts);
  return clone;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Stockage local saturé par les documents numérisés : sauvegarde locale allégée utilisée.', error);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithoutHeavyScanData(state)));
    } catch (fallbackError) {
      console.warn('Sauvegarde locale allégée impossible.', fallbackError);
    }
  }
  scheduleCloudSave();
}

function initSupabaseClient() {
  const config = window.SUPABASE_CONFIG || {};
  if (!window.supabase || !config.url || !config.anonKey) {
    cloudReady = false;
    return false;
  }
  try {
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    cloudReady = true;
    return true;
  } catch (error) {
    console.error('Initialisation Supabase impossible', error);
    cloudReady = false;
    return false;
  }
}

function scheduleCloudSave() {
  if (!cloudReady || !supabaseClient || isApplyingCloudState) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => saveCloudState(), 900);
}

async function saveCloudState() {
  if (!cloudReady || !supabaseClient) return;
  try {
    const payload = {
      id: CLOUD_RECORD_ID,
      data: state,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabaseClient.from(CLOUD_TABLE).upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    lastCloudSaveAt = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Erreur sauvegarde Supabase', error);
    toast('Sauvegarde cloud impossible. Vérifie Supabase/RLS.');
  }
}

async function loadCloudState() {
  if (!cloudReady || !supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from(CLOUD_TABLE)
      .select('data, updated_at')
      .eq('id', CLOUD_RECORD_ID)
      .maybeSingle();
    if (error) throw error;
    return data?.data || null;
  } catch (error) {
    console.error('Erreur chargement Supabase', error);
    toast('Chargement cloud impossible. Données locales utilisées.');
    return null;
  }
}

async function syncFromCloud() {
  const cloudData = await loadCloudState();
  if (!cloudData) {
    toast('Aucune donnée cloud trouvée.');
    return;
  }
  isApplyingCloudState = true;
  state = normalizeState(cloudData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  isApplyingCloudState = false;
  renderNav();
  render();
  toast('Données cloud chargées.');
}

async function syncToCloudNow() {
  await saveCloudState();
  toast('Données envoyées vers Supabase.');
}

function updateBrandLogo() {
  const logoEl = document.querySelector('#brandLogo');
  if (!logoEl) return;
  const logoData = state.settings.logoDataUrl || '';
  if (logoData) {
    logoEl.classList.add('has-logo');
    logoEl.innerHTML = `<img src="${escapeHtml(logoData)}" alt="Logo établissement" />`;
  } else {
    logoEl.classList.remove('has-logo');
    logoEl.textContent = 'GS';
  }
}

function saveLogoFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || '');
    if (!String(file.type || '').startsWith('image/')) {
      state.settings.logoDataUrl = dataUrl;
      state.settings.logoFileName = file.name || 'logo';
      saveState();
      updateBrandLogo();
      render();
      toast('Logo enregistré');
      return;
    }
    const img = new Image();
    img.onload = () => {
      const maxSide = 512;
      const ratio = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((img.width || 1) * ratio));
      canvas.height = Math.max(1, Math.round((img.height || 1) * ratio));
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      state.settings.logoDataUrl = canvas.toDataURL('image/png');
      state.settings.logoFileName = file.name || 'logo.png';
      saveState();
      updateBrandLogo();
      render();
      toast('Logo enregistré');
    };
    img.onerror = () => toast('Impossible de lire cette image');
    img.src = dataUrl;
  };
  reader.onerror = () => toast('Impossible de lire le fichier logo');
  reader.readAsDataURL(file);
}

function setPage(pageId) {
  currentPage = pageId;
  if (pageId !== 'inventory') inventoryFocusMode = false;
  if (pageId === 'products') {
    productSubPage = 'active';
    productCategoryFilter = 'all';
    productSortMode = 'inventory';
  }
  currentFilter = '';
  document.querySelector('#pageTitle').textContent = pages.find(p => p.id === pageId)?.label || '';
  renderNav();
  render();
}

function renderNav() {
  const nav = document.querySelector('#nav');
  nav.innerHTML = pages.map(page => `
    <button class="${page.id === currentPage ? 'active' : ''}" data-page="${page.id}">
      <span>${page.icon}</span><span>${page.label}</span>
    </button>
  `).join('');
  nav.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => setPage(btn.dataset.page)));
}

function render() {
  const app = document.querySelector('#app');
  const map = {
    dashboard: renderDashboard,
    inventory: renderInventory,
    products: renderProducts,
    orders: renderOrders,
    receipts: renderReceipts,
    zones: renderZones,
    suppliers: renderSuppliers,
    monthEnd: renderMonthEnd,
    settings: renderSettings
  };
  app.innerHTML = map[currentPage]();
  updateBrandLogo();
  document.body.classList.toggle('inventory-focus', currentPage === 'inventory' && inventoryFocusMode);
  bindPageEvents();
}

function bindPageEvents() {
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', event => {
      const action = event.currentTarget.dataset.action;
      const id = event.currentTarget.dataset.id;
      const type = event.currentTarget.dataset.type;
      const doc = event.currentTarget.dataset.doc;
      actions[action]?.(id, type, doc);
    });
  });
  const search = document.querySelector('[data-search]');
  if (search) {
    search.value = currentFilter;
    search.addEventListener('input', event => {
      const typedValue = event.target.value;
      const caretPosition = event.target.selectionStart ?? typedValue.length;
      currentFilter = typedValue.toLowerCase();
      render();
      const refreshedSearch = document.querySelector('[data-search]');
      if (refreshedSearch) {
        refreshedSearch.focus({ preventScroll: true });
        refreshedSearch.setSelectionRange(caretPosition, caretPosition);
      }
    });
  }
  const categoryFilter = document.querySelector('[data-category-filter]');
  if (categoryFilter) {
    categoryFilter.value = productCategoryFilter;
    categoryFilter.addEventListener('change', event => {
      productCategoryFilter = event.target.value;
      render();
    });
  }
  const sortSelect = document.querySelector('[data-product-sort]');
  if (sortSelect) {
    sortSelect.value = productSortMode;
    sortSelect.addEventListener('change', event => {
      productSortMode = event.target.value;
      render();
    });
  }
  const orderScanInput = document.querySelector('#orderScanInput');
  if (orderScanInput) {
    orderScanInput.addEventListener('change', event => {
      const files = Array.from(event.target.files || []);
      const target = pendingOrderScan;
      pendingOrderScan = null;
      event.target.value = '';
      if (!files.length || !target) return;
      saveScannedOrderFiles(target.date, target.type, files);
    });
  }
  const receiptScanInput = document.querySelector('#receiptScanInput');
  if (receiptScanInput) {
    receiptScanInput.addEventListener('change', event => {
      const files = Array.from(event.target.files || []);
      const target = pendingReceiptScan;
      pendingReceiptScan = null;
      event.target.value = '';
      if (!files.length || !target) return;
      saveScannedReceiptFiles(target.date, target.type, target.docType, files);
    });
  }
  const logoInput = document.querySelector('#settingLogoInput');
  if (logoInput) {
    logoInput.addEventListener('change', event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) saveLogoFile(file);
    });
  }
}

const getSupplier = id => state.suppliers.find(s => s.id === id);
const getZone = id => state.zones.find(z => z.id === id);
const getProduct = id => state.products.find(p => p.id === id);

function stockByProduct(productId) {
  return state.movements
    .filter(m => m.productId === productId)
    .reduce((sum, m) => sum + Number(m.qty || 0), 0);
}

function stockByProductZone(productId, zoneId) {
  return state.movements
    .filter(m => m.productId === productId && (m.toZoneId === zoneId || m.fromZoneId === zoneId))
    .reduce((sum, m) => {
      if (m.toZoneId === zoneId) return sum + Number(m.qty || 0);
      if (m.fromZoneId === zoneId) return sum - Math.abs(Number(m.qty || 0));
      return sum;
    }, 0);
}

function getLots(productId) {
  const rows = new Map();
  state.movements
    .filter(m => m.productId === productId && (m.batch || m.dlc))
    .forEach(m => {
      const key = `${m.productId}|${m.batch || 'sans-lot'}|${m.dlc || 'sans-dlc'}|${m.toZoneId || m.fromZoneId || ''}`;
      const item = rows.get(key) || {
        productId: m.productId,
        batch: m.batch || 'Sans lot',
        dlc: m.dlc || '',
        zoneId: m.toZoneId || m.fromZoneId || '',
        qty: 0
      };
      item.qty += Number(m.qty || 0);
      rows.set(key, item);
    });
  return [...rows.values()].filter(l => l.qty > 0);
}

function filterRows(rows, fields) {
  if (!currentFilter) return rows;
  return rows.filter(row => fields.some(field => String(row[field] ?? '').toLowerCase().includes(currentFilter)));
}

function statusBadge(status) {
  const classes = {
    'Brouillon': 'info',
    'Envoyée': 'warning',
    'Partielle': 'warning',
    'Reçue': 'success',
    'Annulée': 'danger'
  };
  return `<span class="badge ${classes[status] || 'info'}">${escapeHtml(status || 'Brouillon')}</span>`;
}

function stockBadge(product) {
  const stock = stockByProduct(product.id);
  const min = Number(product.minStock || 0);
  if (stock <= 0) return `<span class="badge danger">Rupture</span>`;
  if (min > 0 && stock <= min) return `<span class="badge warning">Stock bas</span>`;
  return `<span class="badge success">OK</span>`;
}

function stockByProductExcludingSession(productId, sessionId = '') {
  return state.movements
    .filter(m => m.productId === productId && (!sessionId || m.inventorySessionId !== sessionId))
    .reduce((sum, m) => sum + Number(m.qty || 0), 0);
}

function productInventoryTypes(product) {
  const migrated = migrateProduct(product || {});
  return migrated.inventoryTypes || ['general'];
}

function inventoryTypeBadges(product) {
  return productInventoryTypes(product).map(type => `<span class="badge info">${escapeHtml(inventoryTypeLabel(type))}</span>`).join(' ');
}

function productsForInventory(type, dateValue) {
  const slot = inventorySlotKey(dateValue, type);
  return state.products
    .filter(p => p.active !== false)
    .filter(p => slot ? productInventorySlots(p).includes(slot) : productInventoryTypes(p).includes(type))
    .sort((a, b) => {
      if (slot) {
        const oa = productInventoryOrder(a, slot);
        const ob = productInventoryOrder(b, slot);
        if (oa !== ob) return oa - ob;
      }
      const za = getZone(a.storageZoneId)?.sequence || 999;
      const zb = getZone(b.storageZoneId)?.sequence || 999;
      return za - zb || String(a.category || '').localeCompare(String(b.category || '')) || String(a.name || '').localeCompare(String(b.name || ''));
    });
}

function getInventorySession(date, type) {
  return state.inventorySessions.find(s => s.date === date && s.type === type);
}

function isInventoryDone(date, type) {
  return Boolean(getInventorySession(date, type));
}

function isAlternatingHubWeek(dateValue, offsetDays = 0) {
  const ref = parseDate(state.settings.hubReferenceDate || defaultHubReferenceDate());
  const date = parseDate(dateValue);
  const days = Math.round((date - ref) / 86400000);
  return ((days - offsetDays) % 14 + 14) % 14 === 0;
}

function isHubWeek(dateValue) {
  return isAlternatingHubWeek(dateValue, 0);
}

function isHubReceptionWeek(dateValue) {
  return isAlternatingHubWeek(dateValue, 7);
}

function inventoryTypesForDate(dateValue) {
  const date = parseDate(dateValue);
  const types = ['general', 'ultra'];
  if (date.getDay() === 3 && isHubWeek(dateValue)) types.push('hub');
  return types;
}

function receiptTypesForDate(dateValue) {
  const date = parseDate(dateValue);
  const types = ['general', 'ultra'];
  if (date.getDay() === 3 && isHubReceptionWeek(dateValue)) types.push('hub');
  return types;
}

function generateInventorySchedule(weeks = 8) {
  const start = parseDate(today());
  const maxDays = Math.max(21, Number(weeks || 8) * 7);
  const rows = [];
  for (let i = 0; i <= maxDays; i++) {
    const date = addDays(start, i);
    if (INVENTORY_DAYS.includes(date.getDay())) {
      const value = formatDateInput(date);
      rows.push({ date: value, dayName: dayNames[date.getDay()], types: inventoryTypesForDate(value) });
    }
  }
  return rows;
}

function nextPendingInventorySlot() {
  const schedule = generateInventorySchedule(state.settings.inventoryProjectionWeeks || 8);
  for (const row of schedule) {
    for (const type of row.types) {
      if (!isInventoryDone(row.date, type)) return { date: row.date, type };
    }
  }
  return schedule[0] ? { date: schedule[0].date, type: schedule[0].types[0] } : { date: today(), type: 'general' };
}


function generateOrderSchedule(weeks = 8) {
  // Les commandes suivent le même rythme que les inventaires : lundi / mercredi / vendredi,
  // avec le HUB le mercredi une semaine sur deux.
  return generateInventorySchedule(weeks);
}

function orderTypeLabel(type) {
  return inventoryTypeLabel(type);
}

function getScannedOrder(date, type) {
  return (state.scannedOrders || []).find(scan => scan.date === date && scan.type === type);
}

function orderScanFileName(date, type, originalName = '') {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';
  return `bon-commande-${date}-${type}.${ext}`;
}

function prepareScannedPage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Fichier manquant'));
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const basePage = {
        id: uid(),
        fileName: file.name || `page-${Date.now()}.jpg`,
        fileType: file.type || 'application/octet-stream',
        fileData: dataUrl,
        scannedAt: new Date().toISOString()
      };
      if (!String(file.type || '').startsWith('image/')) return resolve(basePage);

      const img = new Image();
      img.onload = () => {
        try {
          const maxSide = 1200;
          const ratio = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round((img.width || 1) * ratio));
          canvas.height = Math.max(1, Math.round((img.height || 1) * ratio));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve({
            ...basePage,
            fileType: 'image/jpeg',
            fileData: canvas.toDataURL('image/jpeg', 0.68)
          });
        } catch (error) {
          resolve(basePage);
        }
      };
      img.onerror = () => resolve(basePage);
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier numérisé'));
    reader.readAsDataURL(file);
  });
}

async function saveScannedOrderFiles(date, type, files) {
  const list = Array.from(files || []).filter(Boolean);
  if (!list.length) return;
  toast(`Traitement de ${list.length} page(s)…`);
  try {
    const newPages = [];
    for (const file of list) newPages.push(await prepareScannedPage(file));
    persistScannedOrderPages(date, type, newPages);
  } catch (error) {
    console.error(error);
    toast('Impossible de lire une ou plusieurs pages du bon de commande.');
  }
}

function persistScannedOrderPages(date, type, newPages) {
  const previousScans = [...(state.scannedOrders || [])];
  const existing = getScannedOrder(date, type);
  const record = normalizeScannedDocumentRecord({
    ...(existing || {}),
    id: existing?.id || uid(),
    date,
    type,
    dayName: dayNames[parseDate(date).getDay()],
    pages: [...scanPages(existing || {}), ...(newPages || [])],
    scannedAt: new Date().toISOString(),
    note: existing?.note || ''
  });
  state.scannedOrders = previousScans.filter(scan => !(scan.date === date && scan.type === type));
  state.scannedOrders.push(record);
  try {
    saveState();
    render();
    toast(`${scanPageCount(record)} page(s) enregistrée(s) pour le bon de commande ${orderTypeLabel(type)} du ${formatDateFr(date)}`);
  } catch (error) {
    console.error(error);
    state.scannedOrders = previousScans;
    toast('Impossible d’enregistrer les pages numérisées.');
  }
}

function generateReceiptSchedule(weeks = 8) {
  // Les réceptions suivent les mêmes jours que les commandes, mais le HUB est inversé :
  // commande HUB une semaine, réception HUB la semaine suivante.
  const start = parseDate(today());
  const maxDays = Math.max(21, Number(weeks || 8) * 7);
  const rows = [];
  for (let i = 0; i <= maxDays; i++) {
    const date = addDays(start, i);
    if (INVENTORY_DAYS.includes(date.getDay())) {
      const value = formatDateInput(date);
      rows.push({ date: value, dayName: dayNames[date.getDay()], types: receiptTypesForDate(value) });
    }
  }
  return rows;
}

function receiptTypeLabel(type) {
  if (type === 'delivery' || type === 'global' || type === 'livraison') return 'Livraison';
  return orderTypeLabel(type);
}

function receiptDocLabel(docType) {
  return RECEIPT_DOCUMENT_TYPES.find(doc => doc.id === docType)?.label || docType || 'Document';
}

function receiptDocShort(docType) {
  return RECEIPT_DOCUMENT_TYPES.find(doc => doc.id === docType)?.short || receiptDocLabel(docType);
}

function receiptScanScopeType(type, docType) {
  return docType === 'temperature' ? 'delivery' : type;
}

function getScannedReceipt(date, type, docType) {
  if (docType === 'temperature') {
    return (state.scannedReceipts || []).find(scan => scan.date === date && scan.docType === 'temperature');
  }
  return (state.scannedReceipts || []).find(scan => scan.date === date && scan.type === type && scan.docType === docType);
}

function receiptScanFileName(date, type, docType, originalName = '') {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';
  if (docType === 'temperature') return `ticket-temperature-${date}.${ext}`;
  return `bon-livraison-${date}-${type}.${ext}`;
}

async function saveScannedReceiptFiles(date, type, docType, files) {
  const allFiles = Array.from(files || []).filter(Boolean);
  if (!allFiles.length) return;
  const list = docType === 'temperature' ? allFiles.slice(0, 1) : allFiles;
  toast(`Traitement de ${list.length} page(s)…`);
  try {
    const newPages = [];
    for (const file of list) newPages.push(await prepareScannedPage(file));
    persistScannedReceiptPages(date, type, docType, newPages);
  } catch (error) {
    console.error(error);
    toast('Impossible de lire une ou plusieurs pages du document de livraison.');
  }
}

function persistScannedReceiptPages(date, type, docType, newPages) {
  const previousScans = [...(state.scannedReceipts || [])];
  const scopedType = receiptScanScopeType(type, docType);
  const existing = getScannedReceipt(date, scopedType, docType);
  const pages = docType === 'temperature'
    ? (newPages || []).slice(0, 1)
    : [...scanPages(existing || {}), ...(newPages || [])];
  const record = normalizeScannedDocumentRecord({
    ...(existing || {}),
    id: existing?.id || uid(),
    date,
    type: scopedType,
    docType,
    dayName: dayNames[parseDate(date).getDay()],
    pages,
    scannedAt: new Date().toISOString(),
    note: existing?.note || ''
  });
  state.scannedReceipts = previousScans.filter(scan => {
    if (docType === 'temperature') return !(scan.date === date && scan.docType === 'temperature');
    return !(scan.date === date && scan.type === scopedType && scan.docType === docType);
  });
  state.scannedReceipts.push(record);
  try {
    saveState();
    render();
    const suffix = docType === 'temperature' ? 'de la livraison' : receiptTypeLabel(scopedType);
    toast(`${receiptDocLabel(docType)} ${suffix} : ${scanPageCount(record)} page(s) enregistrée(s)`);
  } catch (error) {
    console.error(error);
    state.scannedReceipts = previousScans;
    toast('Impossible d’enregistrer les pages numérisées.');
  }
}

function inventoryTypeChecks(product = {}) {
  const selected = productInventoryTypes(product);
  return INVENTORY_TYPES.map(type => `
    <label class="checkbox-line"><input type="checkbox" name="inventoryTypes" value="${type.id}" ${selected.includes(type.id) ? 'checked' : ''} /> ${escapeHtml(type.label)}</label>
  `).join('');
}

function renderDashboard() {
  const activeProducts = state.products.filter(p => p.active !== false);
  const nextSlot = nextPendingInventorySlot();
  const completedThisMonth = state.inventorySessions.filter(s => String(s.date || '').slice(0, 7) === today().slice(0, 7)).length;
  const schedule = generateInventorySchedule(state.settings.inventoryProjectionWeeks || 8);
  const nextHub = schedule.find(row => row.types.includes('hub') && row.date >= today());
  const nextDate = parseDate(nextSlot.date);
  const nextDayName = dayNames[nextDate.getDay()];
  const nextDayNumber = nextDate.getDate();
  const nextHubLabel = nextHub ? String(nextHub.date).slice(8, 10) + '/' + String(nextHub.date).slice(5, 7) : '-';

  return `
    <div class="grid grid-4">
      <div class="card kpi dashboard-only-card">
        <div><span>Prochain inventaire</span><strong>${escapeHtml(nextDayName)}<br>${escapeHtml(String(nextDayNumber))}</strong></div>
        <span class="badge warning">${escapeHtml(inventoryTypeLabel(nextSlot.type))}</span>
      </div>
      <div class="card kpi dashboard-only-card">
        <div><span>Inventaires ce mois</span><strong>${completedThisMonth}</strong></div>
        <span class="badge info">Historique</span>
      </div>
      <div class="card kpi dashboard-only-card">
        <div><span>Jours prévus</span><strong>L · M ·<br>V</strong></div>
        <span class="badge info">3 livraisons</span>
      </div>
      <div class="card kpi dashboard-only-card">
        <div><span>Prochain HUB</span><strong>${escapeHtml(nextHubLabel)}</strong></div>
        <span class="badge info">1 sem. / 2</span>
      </div>
    </div>
    <div class="card" style="margin-top:18px;">
      <h3>Flux conseillé de stockage</h3>
      <div class="table-wrap"><table><thead><tr><th>Ordre</th><th>Zone</th><th>Type</th><th>Consigne</th></tr></thead><tbody>${renderZoneSequenceRows()}</tbody></table></div>
    </div>
    <div class="grid grid-4" style="margin-top:18px;">
      <div class="card kpi dashboard-only-card">
        <div><span>Produits actifs</span><strong>${activeProducts.length}</strong></div>
        <span class="badge info">Catalogue</span>
      </div>
    </div>
  `;
}

function renderInventory() {
  const schedule = generateInventorySchedule(state.settings.inventoryProjectionWeeks || 8);
  const selected = selectedInventorySlot || nextPendingInventorySlot();
  selectedInventorySlot = selected;
  const selectedSession = getInventorySession(selected.date, selected.type);
  const selectedProducts = productsForInventory(selected.type, selected.date);
  const hubRows = schedule.filter(row => row.types.includes('hub')).slice(0, 4);

  const scheduleRows = schedule.map(row => {
    const typeButtons = row.types.map(type => {
      const done = isInventoryDone(row.date, type);
      const active = selected.date === row.date && selected.type === type;
      return `<button class="small ${active ? '' : done ? 'secondary' : 'secondary'}" data-action="selectInventorySlot" data-id="${row.date}" data-type="${type}">${escapeHtml(inventoryTypeLabel(type))}${done ? ' ✓' : ''}</button>`;
    }).join(' ');
    const allDone = row.types.every(type => isInventoryDone(row.date, type));
    return `
      <tr>
        <td><strong>${escapeHtml(formatDateFr(row.date))}</strong><br><span class="muted">${escapeHtml(row.date)}</span></td>
        <td>${escapeHtml(row.dayName)}</td>
        <td>${typeButtons}</td>
        <td>${allDone ? '<span class="badge success">Terminé</span>' : '<span class="badge warning">À faire</span>'}</td>
      </tr>
    `;
  }).join('');

  const previousLines = new Map((selectedSession?.lines || []).map(line => [line.productId, line]));
  const slotKey = inventorySlotKey(selected.date, selected.type);
  const draftForSlot = inventoryDraftValues[inventoryDraftKey(selected.date, selected.type)] || {};
  const inventoryRows = selectedProducts.map((p, index) => {
    const oldLine = previousLines.get(p.id);
    const draftLine = draftForSlot[p.id] || {};
    const theoretical = stockByProductExcludingSession(p.id, selectedSession?.id || '');
    const countValue = draftLine.countedQty ?? oldLine?.countedQty ?? '';
    const noteValue = draftLine.note ?? oldLine?.note ?? '';
    return `
      <tr>
        <td class="order-cell"><span class="badge info">${index + 1}</span></td>
        <td><strong>${escapeHtml(p.name)}</strong><br><span class="muted">${escapeHtml(p.sku || 'Sans réf.')} · ${escapeHtml(p.category || '-')} · ${escapeHtml(p.packageSize || '')}</span></td>
        <td>${number(theoretical)} ${escapeHtml(p.unit || '')}</td>
        <td><input class="count-input" data-count="${p.id}" type="number" step="0.01" min="0" inputmode="decimal" value="${escapeHtml(countValue)}" placeholder="Quantité" /></td>
        <td>${escapeHtml(p.unit || '')}</td>
        <td><input data-inventory-note="${p.id}" value="${escapeHtml(noteValue)}" placeholder="Note optionnelle" /></td>
        <td class="actions order-actions">
          <button type="button" class="small secondary" data-action="moveInventoryProduct" data-id="${p.id}" data-type="up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="small secondary" data-action="moveInventoryProduct" data-id="${p.id}" data-type="down" ${index === selectedProducts.length - 1 ? 'disabled' : ''}>↓</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="7" class="empty">Aucun produit rattaché à ce type d’inventaire. Va dans la page Produits pour affecter des produits à Général, Ultra frais ou HUB.</td></tr>`;

  const historyRows = state.inventorySessions.slice().sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0, 20).map(s => {
    const totalDiff = (s.lines || []).reduce((sum, line) => sum + Math.abs(Number(line.diff || 0)), 0);
    return `
      <tr>
        <td><strong>${escapeHtml(formatDateFr(s.date))}</strong><br><span class="muted">${escapeHtml(s.date)}</span></td>
        <td>${escapeHtml(inventoryTypeLabel(s.type))}</td>
        <td>${(s.lines || []).length} produit(s)</td>
        <td>${number(totalDiff)}</td>
        <td class="actions">
          <button class="small secondary" data-action="selectInventorySlot" data-id="${s.date}" data-type="${s.type}">Ouvrir</button>
          <button class="small danger-soft" data-action="deleteInventorySession" data-id="${s.id}">Supprimer</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5" class="empty">Aucun inventaire enregistré.</td></tr>`;

  const selectedInventoryPanel = `
    <div class="card selected-inventory-card">
      <div class="toolbar inventory-toolbar">
        <div>
          <p class="eyebrow">Mode saisie</p>
          <h3>${escapeHtml(formatDateFr(selected.date))} · ${escapeHtml(inventoryTypeLabel(selected.type))}</h3>
          <p class="muted">${selectedProducts.length} produit(s) à inventorier pour ce jour et ce type.</p>
        </div>
        <div class="toolbar-right">
          <button data-action="resetInventoryOrder" class="secondary">Ordre bon de commande</button>
          ${inventoryFocusMode ? '<button data-action="exitInventoryFocus" class="secondary">Quitter plein écran</button>' : '<button data-action="selectInventoryManual" class="secondary">Plein écran</button>'}
          <button data-action="saveInventorySession" class="success">Enregistrer</button>
        </div>
      </div>
      <div class="form-grid compact-grid">
        <label>Date<input id="inventoryDate" type="date" value="${escapeHtml(selected.date)}" /></label>
        <label>Type<select id="inventoryType">${INVENTORY_TYPES.map(t => `<option value="${t.id}" ${selected.type === t.id ? 'selected' : ''}>${escapeHtml(t.label)}</option>`).join('')}</select></label>
        <label class="wide">Sélection rapide<button type="button" data-action="selectInventoryManual" class="secondary full">Charger cette date / ce type</button></label>
      </div>
      <p class="muted">La liste suit l’ordre des bons de commande. Tu peux l’ajuster avec les flèches ↑↓ ou rétablir l’ordre d’origine du bon de commande.</p>
      <div class="table-wrap inventory-entry-table"><table><thead><tr><th>Ordre</th><th>Produit</th><th>Stock théorique</th><th>Quantité comptée</th><th>Unité</th><th>Note</th><th>Déplacer</th></tr></thead><tbody>${inventoryRows}</tbody></table></div>
      <div class="form-actions">
        <button data-action="exportCsv" data-type="inventories" class="secondary">Exporter historiques CSV</button>
        <button data-action="saveInventorySession" class="success">Enregistrer l’inventaire</button>
      </div>
    </div>
  `;

  if (inventoryFocusMode) {
    return `
      <div class="inventory-fullscreen-view">
        <div class="inventory-full-header">
          <div>
            <p class="eyebrow">Inventaire plein écran</p>
            <h2>${escapeHtml(formatDateFr(selected.date))} · ${escapeHtml(inventoryTypeLabel(selected.type))}</h2>
          </div>
          <button data-action="exitInventoryFocus" class="secondary">Quitter</button>
        </div>
        ${selectedInventoryPanel}
      </div>
    `;
  }


  if (inventorySubPage === 'forecast') {
    return `
      <div class="card subpage-heading">
        <div class="toolbar">
          <div>
            <p class="eyebrow">Sous-page Inventaire</p>
            <h3>Prévisionnel des inventaires</h3>
            <p class="muted">Planning automatique lundi / mercredi / vendredi, avec HUB une semaine sur deux.</p>
          </div>
          <div class="toolbar-right">
            <button data-action="openInventoryEntry" class="secondary">Retour à la saisie</button>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:18px;">
        <div class="toolbar"><h3>Dates prévues</h3><span class="badge info">Clique sur un type pour ouvrir l’inventaire</span></div>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Jour</th><th>Inventaires à faire</th><th>Statut</th></tr></thead><tbody>${scheduleRows}</tbody></table></div>
      </div>
      <div class="card" style="margin-top:18px;">
        <div class="toolbar"><h3>Règle HUB</h3><span class="badge info">Mercredi une semaine sur deux</span></div>
        <p class="muted">La référence HUB se règle dans Paramètres. Prochaines dates HUB affichées : ${hubRows.map(row => escapeHtml(formatDateFr(row.date))).join(' · ') || 'aucune date trouvée'}.</p>
      </div>
    `;
  }

  return `
    <div class="card subpage-heading">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Inventaire</p>
          <h3>Saisie d’inventaire</h3>
          <p class="muted">La page principale sert uniquement à saisir et consulter les inventaires. Le prévisionnel est dans sa sous-page dédiée.</p>
        </div>
        <div class="toolbar-right">
          <button data-action="openInventoryForecast" class="secondary">Prévisionnel des inventaires</button>
        </div>
      </div>
    </div>
    <div style="margin-top:18px;">
      ${selectedInventoryPanel}
    </div>
    <div class="card" style="margin-top:18px;">
      <div class="toolbar"><h3>Historique des inventaires</h3><span class="muted">Général, Ultra frais et HUB</span></div>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Lignes</th><th>Écart total</th><th>Actions</th></tr></thead><tbody>${historyRows}</tbody></table></div>
    </div>
  `;
}

function baseProductSort(a, b) {
  const firstSlotA = INVENTORY_SLOT_ORDER.find(slot => productInventorySlots(a).includes(slot));
  const firstSlotB = INVENTORY_SLOT_ORDER.find(slot => productInventorySlots(b).includes(slot));
  return productInventoryOrder(a, firstSlotA) - productInventoryOrder(b, firstSlotB) || String(a.name || '').localeCompare(String(b.name || ''));
}

function productSort(a, b) {
  if (productSortMode === 'category') {
    return productCategoryLabel(a).localeCompare(productCategoryLabel(b), 'fr', { sensitivity: 'base' }) || baseProductSort(a, b);
  }
  if (productSortMode === 'name') {
    return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
  }
  return baseProductSort(a, b);
}

function productSearchText(product = {}) {
  const slots = productInventorySlots(product).map(inventorySlotLabel).join(' ');
  const zone = getZone(product.storageZoneId)?.name || product.storageLabel || '';
  return [product.sku, product.name, productCategoryLabel(product), product.unit, product.packageSize, zone, slots].join(' ').toLowerCase();
}

function productMatchesSearch(product) {
  if (productCategoryFilter !== 'all' && productCategoryLabel(product) !== productCategoryFilter) return false;
  if (!currentFilter) return true;
  return productSearchText(product).includes(currentFilter);
}

function productCategoryOptions(products) {
  const categories = uniqueList(products.map(productCategoryLabel).filter(label => label && label !== '-')).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  return ['<option value="all">Toutes les catégories</option>'].concat(
    categories.map(category => `<option value="${escapeHtml(category)}" ${productCategoryFilter === category ? 'selected' : ''}>${escapeHtml(category)}</option>`)
  ).join('');
}

function renderProductRows({ archivedOnly = false, activeOnly = false } = {}) {
  let rows = state.products.slice();
  if (archivedOnly) rows = rows.filter(p => p.active === false);
  if (activeOnly) rows = rows.filter(p => p.active !== false);
  return rows
    .filter(productMatchesSearch)
    .sort(productSort)
    .map(p => {
      const archived = p.active === false;
      return `
        <tr class="${archived ? 'archived-row' : ''}">
          <td><strong>${escapeHtml(p.name)}</strong><br><span class="muted">${escapeHtml(p.sku || 'Sans réf.')}</span></td>
          <td>${escapeHtml(productCategoryLabel(p))}</td>
          <td>${inventorySlotBadges(p) || '<span class="muted">Non affecté</span>'}</td>
          <td>${number(stockByProduct(p.id))} ${escapeHtml(p.unit || '')}<br><span class="muted">${escapeHtml(p.packageSize || '')}</span></td>
          <td>${number(p.minStock || 0)} / ${number(p.maxStock || 0)}</td>
          <td>${escapeHtml(getZone(p.storageZoneId)?.name || '-')}</td>
          <td>${archived ? '<span class="badge danger">Archivé</span>' : stockBadge(p)}</td>
          <td class="actions">
            <button class="small secondary" data-action="openProduct" data-id="${p.id}">Modifier</button>
            ${archived
              ? `<button class="small success" data-action="restoreProduct" data-id="${p.id}">Réintégrer</button><button class="small danger-soft" data-action="deleteProduct" data-id="${p.id}">Supprimer</button>`
              : `<button class="small warning-soft" data-action="archiveProduct" data-id="${p.id}">Archiver</button>`}
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="8" class="empty">Aucun produit ne correspond aux filtres.</td></tr>`;
}

function renderProducts() {
  const activeProducts = state.products.filter(p => p.active !== false);
  const archivedProducts = state.products.filter(p => p.active === false);
  const viewProducts = productSubPage === 'archived' ? archivedProducts : activeProducts;
  const hubProducts = state.products.filter(isHubInventoryProduct).length;
  const lowStock = activeProducts.filter(p => stockByProduct(p.id) <= Number(p.minStock || 0)).length;
  const noPlan = activeProducts.filter(p => !productInventorySlots(p).length).length;
  const rows = renderProductRows(productSubPage === 'archived' ? { archivedOnly: true } : { activeOnly: true });
  const filteredCount = viewProducts.filter(productMatchesSearch).length;
  const categoryOptions = productCategoryOptions(viewProducts);
  const isArchivedView = productSubPage === 'archived';
  return `
    <div class="grid grid-4">
      <div class="card kpi"><div><span>Produits actifs</span><strong>${activeProducts.length}</strong></div><span class="badge info">Base</span></div>
      <div class="card kpi"><div><span>Produits archivés</span><strong>${archivedProducts.length}</strong></div><span class="badge danger">Hors inventaire</span></div>
      <div class="card kpi"><div><span>Produits HUB</span><strong>${hubProducts}</strong></div><span class="badge info">Catégorie HUB</span></div>
      <div class="card kpi"><div><span>Stocks bas / rupture</span><strong>${lowStock}</strong></div><span class="badge warning">À suivre</span></div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div class="toolbar-left">
          <h3>${isArchivedView ? 'Produits archivés' : 'Produits de base'}</h3>
          <input class="search" data-search placeholder="Rechercher produit, référence, catégorie, planning..." />
          <select class="filter-select" data-category-filter aria-label="Filtrer par catégorie">${categoryOptions}</select>
          <select class="filter-select" data-product-sort aria-label="Trier les produits">
            <option value="inventory">Ordre inventaire / bon de commande</option>
            <option value="category">Catégorie A → Z</option>
            <option value="name">Nom A → Z</option>
          </select>
        </div>
        <div class="toolbar-right">
          ${isArchivedView
            ? `<button data-action="setProductSubPage" data-type="active" class="secondary">← Retour aux produits de base</button>`
            : `<button data-action="setProductSubPage" data-type="archived" class="warning-soft">Produits archivés</button>`}
          <button data-action="exportCsv" data-type="inventory" class="secondary">Exporter produits CSV</button>
          ${isArchivedView ? '' : `<button data-action="openProduct">Ajouter un produit</button>`}
        </div>
      </div>
      <p class="muted">
        ${isArchivedView
          ? 'Sous-page dédiée aux produits archivés. Ils ne sortent plus dans les inventaires, mais tu peux les modifier, les réintégrer ou les supprimer définitivement.'
          : 'Page dédiée aux produits de base. Utilise le bouton Produits archivés pour ouvrir la sous-page des anciennes références. La recherche fonctionne avec le filtre de catégorie.'}
      </p>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <h3>${isArchivedView ? 'Archive produits' : 'Catalogue produits actifs'}</h3>
        <span class="muted">${filteredCount} affiché(s) · ${isArchivedView ? archivedProducts.length + ' archivé(s)' : activeProducts.length + ' actif(s) · ' + noPlan + ' sans planning'}</span>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Produit</th><th>Catégorie</th><th>Planning inventaire</th><th>Stock / conditionnement</th><th>Mini / Maxi</th><th>Zone principale</th><th>État</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
  `;
}

function renderArchivedProducts() {
  productSubPage = 'archived';
  return renderProducts();
}

function renderOrders() {
  const orderSchedule = generateOrderSchedule(state.settings.inventoryProjectionWeeks || 8);
  const scannedOrders = state.scannedOrders || [];

  const forecastRows = orderSchedule.map(row => {
    const typeActions = row.types.map(type => {
      const scan = getScannedOrder(row.date, type);
      const pageCount = scanPageCount(scan || {});
      return `
        <div class="order-scan-slot">
          <span class="badge ${scan ? 'success' : 'warning'}">${escapeHtml(orderTypeLabel(type))}${scan ? ` · ${pageCount} page(s) ✓` : ''}</span>
          <button type="button" class="small ${scan ? 'secondary' : ''}" data-action="triggerOrderScan" data-id="${row.date}" data-type="${type}">${scan ? 'Ajouter des pages' : 'Numériser'}</button>
          ${scan ? `<button type="button" class="small secondary" data-action="viewScannedOrder" data-id="${scan.id}">Voir les ${pageCount} page(s)</button>` : ''}
        </div>
      `;
    }).join('');
    const allScanned = row.types.every(type => getScannedOrder(row.date, type));
    return `
      <tr>
        <td><strong>${escapeHtml(formatDateFr(row.date))}</strong><br><span class="muted">${escapeHtml(row.date)}</span></td>
        <td>${escapeHtml(row.dayName)}</td>
        <td>${typeActions}</td>
        <td>${allScanned ? '<span class="badge success">Numérisé</span>' : '<span class="badge warning">À numériser</span>'}</td>
      </tr>
    `;
  }).join('');

  const scannedRows = scannedOrders.slice().sort((a,b) => String(b.date).localeCompare(String(a.date)) || String(a.type).localeCompare(String(b.type))).map(scan => {
    const pages = scanPages(scan);
    const latest = pages.map(page => page.scannedAt || '').sort().slice(-1)[0] || scan.scannedAt || scan.date;
    return `
      <tr>
        <td><strong>${escapeHtml(formatDateFr(scan.date))}</strong><br><span class="muted">${escapeHtml(scan.date)}</span></td>
        <td>${escapeHtml(orderTypeLabel(scan.type))}</td>
        <td><strong>${pages.length} page(s)</strong><br><span class="muted">Dernier ajout : ${escapeHtml(new Date(latest).toLocaleString('fr-FR'))}</span></td>
        <td class="actions">
          <button class="small secondary" data-action="viewScannedOrder" data-id="${scan.id}">Voir</button>
          <button class="small" data-action="triggerOrderScan" data-id="${scan.date}" data-type="${scan.type}">Ajouter des pages</button>
          <button class="small danger-soft" data-action="deleteScannedOrder" data-id="${scan.id}">Supprimer le document</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="4" class="empty">Aucun bon de commande numérisé pour le moment.</td></tr>`;

  const rows = filterRows(state.orders, ['ref', 'status']).sort((a,b) => String(b.date).localeCompare(String(a.date))).map(o => {
    const supplier = getSupplier(o.supplierId);
    const total = (o.lines || []).reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unitPrice || 0), 0);
    return `
      <tr>
        <td><strong>${escapeHtml(o.ref)}</strong><br><span class="muted">${escapeHtml(o.date)}</span></td>
        <td>${escapeHtml(supplier?.name || '-')}</td>
        <td>${escapeHtml(o.expectedDate || '-')}</td>
        <td>${statusBadge(o.status)}</td>
        <td>${(o.lines || []).length} ligne(s)</td>
        <td>${money(total)}</td>
        <td class="actions">
          <button class="small secondary" data-action="viewOrder" data-id="${o.id}">Voir</button>
          <button class="small" data-action="openReceiptForOrder" data-id="${o.id}">Réceptionner</button>
          <button class="small danger-soft" data-action="deleteOrder" data-id="${o.id}">Supprimer</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="7" class="empty">Aucune commande enregistrée.</td></tr>`;

  return `
    <input id="orderScanInput" class="hidden-scan-input" type="file" accept="image/*,application/pdf" capture="environment" multiple />

    <div class="card">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Prévisionnel</p>
          <h3>Dates des commandes</h3>
          <p class="muted">Planning automatique lundi / mercredi / vendredi, avec Général, Ultra frais et HUB une semaine sur deux.</p>
        </div>
      </div>
      <div class="table-wrap order-forecast-wrap"><table><thead><tr><th>Date</th><th>Jour</th><th>Types de commande</th><th>État</th></tr></thead><tbody>${forecastRows}</tbody></table></div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div>
          <h3>Bons de commande numérisés</h3>
          <p class="muted">Un même bon peut contenir autant de pages que nécessaire. Sur téléphone, photographie les pages une par une en appuyant plusieurs fois sur « Ajouter des pages ». Depuis la galerie ou un ordinateur, tu peux aussi sélectionner plusieurs fichiers en une seule fois.</p>
        </div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Pages</th><th>Actions</th></tr></thead><tbody>${scannedRows}</tbody></table></div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div>
          <h3>Commandes enregistrées</h3>
          <p class="muted">Cette zone garde l’historique des commandes déjà créées ou importées.</p>
        </div>
        <div class="toolbar-right">
          <input class="search" data-search placeholder="Rechercher commande, statut..." />
          <button data-action="exportCsv" data-type="orders" class="secondary">Exporter CSV</button>
        </div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Commande</th><th>Fournisseur</th><th>Livraison prévue</th><th>Statut</th><th>Lignes</th><th>Total</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
  `;
}

function renderOrderBuilder() {
  const supplierOptions = state.suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  const productOptions = state.products.filter(p => p.active !== false).map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.unit || '')})</option>`).join('');
  const lines = orderDraft.map((line, index) => `
    <div class="line-row">
      <div><strong>${escapeHtml(getProduct(line.productId)?.name || '-')}</strong></div>
      <div>${number(line.qty)}</div>
      <div>${money(line.unitPrice)}</div>
      <button class="small danger-soft" data-action="removeOrderLine" data-id="${index}">×</button>
    </div>
  `).join('') || `<p class="muted">Aucune ligne ajoutée.</p>`;

  return `
    <div class="form-grid">
      <label>Fournisseur<select id="orderSupplier">${supplierOptions || '<option value="">Ajoute un fournisseur d’abord</option>'}</select></label>
      <label>Date de livraison prévue<input id="orderExpected" type="date" /></label>
    </div>
    <div class="line-editor" style="margin-top:14px;">
      <div class="form-grid">
        <label>Produit<select id="orderProduct">${productOptions || '<option value="">Ajoute un produit d’abord</option>'}</select></label>
        <label>Quantité<input id="orderQty" type="number" step="0.01" min="0" placeholder="Ex: 5" /></label>
        <label>Prix unitaire estimé<input id="orderPrice" type="number" step="0.01" min="0" placeholder="Ex: 12.50" /></label>
        <label> <button type="button" data-action="addOrderLine" class="secondary full">Ajouter la ligne</button></label>
      </div>
      <div class="line-list">${lines}</div>
      <button type="button" data-action="saveOrder" class="success full">Enregistrer la commande</button>
    </div>
  `;
}

function renderReceipts() {
  const deliverySchedule = generateReceiptSchedule(state.settings.inventoryProjectionWeeks || 8);
  const scannedReceipts = state.scannedReceipts || [];

  const forecastRows = deliverySchedule.map(row => {
    const temperatureScan = getScannedReceipt(row.date, 'delivery', 'temperature');
    const typeActions = row.types.map(type => {
      const deliveryScan = getScannedReceipt(row.date, type, 'delivery');
      return `
        <div class="receipt-scan-slot">
          <span class="badge info">${escapeHtml(receiptTypeLabel(type))}</span>
          <span class="receipt-doc-actions">
            <span class="badge ${deliveryScan ? 'success' : 'warning'}">BL${deliveryScan ? ` · ${scanPageCount(deliveryScan)} page(s) ✓` : ''}</span>
            <button type="button" class="small ${deliveryScan ? 'secondary' : ''}" data-action="triggerReceiptScan" data-id="${row.date}" data-type="${type}" data-doc="delivery">${deliveryScan ? 'Ajouter des pages BL' : 'Numériser BL'}</button>
            ${deliveryScan ? `<button type="button" class="small secondary" data-action="viewScannedReceipt" data-id="${deliveryScan.id}">Voir les ${scanPageCount(deliveryScan)} page(s)</button>` : ''}
          </span>
        </div>
      `;
    }).join('');
    const temperatureActions = `
      <div class="receipt-scan-slot receipt-temperature-slot">
        <span class="badge info">Livraison</span>
        <span class="receipt-doc-actions">
          <span class="badge ${temperatureScan ? 'success' : 'warning'}">Ticket température${temperatureScan ? ' ✓' : ''}</span>
          <button type="button" class="small ${temperatureScan ? 'secondary' : ''}" data-action="triggerReceiptScan" data-id="${row.date}" data-type="delivery" data-doc="temperature">${temperatureScan ? 'Remplacer ticket température' : 'Numériser ticket température'}</button>
          ${temperatureScan ? `<button type="button" class="small secondary" data-action="viewScannedReceipt" data-id="${temperatureScan.id}">Voir ticket</button>` : ''}
        </span>
      </div>
    `;
    const allScanned = row.types.every(type => getScannedReceipt(row.date, type, 'delivery')) && Boolean(temperatureScan);
    return `
      <tr>
        <td><strong>${escapeHtml(formatDateFr(row.date))}</strong><br><span class="muted">${escapeHtml(row.date)}</span></td>
        <td>${escapeHtml(row.dayName)}</td>
        <td>${typeActions}</td>
        <td>${temperatureActions}</td>
        <td>${allScanned ? '<span class="badge success">Documents complets</span>' : '<span class="badge warning">À compléter</span>'}</td>
      </tr>
    `;
  }).join('');

  const scannedReceiptsForDisplay = Object.values(scannedReceipts.reduce((acc, scan) => {
    const key = scan.docType === 'temperature' ? `${scan.date}::temperature` : `${scan.date}::${scan.type}::${scan.docType || 'delivery'}`;
    if (!acc[key] || String(scan.scannedAt || '').localeCompare(String(acc[key].scannedAt || '')) > 0) acc[key] = scan;
    return acc;
  }, {}));

  const scannedRows = scannedReceiptsForDisplay.slice().sort((a,b) => String(b.date).localeCompare(String(a.date)) || String(a.type).localeCompare(String(b.type)) || String(a.docType).localeCompare(String(b.docType))).map(scan => {
    const pages = scanPages(scan);
    const latest = pages.map(page => page.scannedAt || '').sort().slice(-1)[0] || scan.scannedAt || scan.date;
    const isTemperature = scan.docType === 'temperature';
    return `
      <tr>
        <td><strong>${escapeHtml(formatDateFr(scan.date))}</strong><br><span class="muted">${escapeHtml(scan.date)}</span></td>
        <td>${escapeHtml(isTemperature ? 'Livraison complète' : receiptTypeLabel(scan.type))}</td>
        <td>${escapeHtml(receiptDocLabel(scan.docType))}</td>
        <td><strong>${pages.length} page(s)</strong><br><span class="muted">Dernier ajout : ${escapeHtml(new Date(latest).toLocaleString('fr-FR'))}</span></td>
        <td class="actions">
          <button class="small secondary" data-action="viewScannedReceipt" data-id="${scan.id}">Voir</button>
          <button class="small" data-action="triggerReceiptScan" data-id="${scan.date}" data-type="${scan.type}" data-doc="${scan.docType || 'delivery'}">${isTemperature ? 'Remplacer ticket' : 'Ajouter des pages'}</button>
          <button class="small danger-soft" data-action="deleteScannedReceipt" data-id="${scan.id}">Supprimer le document</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5" class="empty">Aucun document de livraison numérisé pour le moment.</td></tr>`;

  const rows = state.receipts.slice().sort((a,b) => String(b.date).localeCompare(String(a.date))).map(r => `
    <tr>
      <td><strong>${escapeHtml(r.ref)}</strong><br><span class="muted">${escapeHtml(r.date)}</span></td>
      <td>${escapeHtml(getSupplier(r.supplierId)?.name || '-')}</td>
      <td>${escapeHtml(state.orders.find(o => o.id === r.orderId)?.ref || 'Sans commande')}</td>
      <td>${(r.lines || []).length} ligne(s)</td>
      <td>${escapeHtml(r.note || '-')}</td>
      <td class="actions"><button class="small secondary" data-action="viewReceipt" data-id="${r.id}">Voir</button></td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="empty">Aucune réception enregistrée.</td></tr>`;

  return `
    <input id="receiptScanInput" class="hidden-scan-input" type="file" accept="image/*,application/pdf" capture="environment" multiple />

    <div class="card">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Prévisionnel</p>
          <h3>Dates de livraison</h3>
          <p class="muted">Planning automatique lundi / mercredi / vendredi, avec Général, Ultra frais et HUB une semaine sur deux. Pour chaque livraison, numérise les bons de livraison par type et un seul ticket température pour toute la livraison.</p>
        </div>
      </div>
      <div class="table-wrap order-forecast-wrap"><table><thead><tr><th>Date</th><th>Jour</th><th>Bons de livraison</th><th>Ticket température</th><th>État</th></tr></thead><tbody>${forecastRows}</tbody></table></div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div>
          <h3>Documents de livraison numérisés</h3>
          <p class="muted">Les bons de livraison peuvent contenir plusieurs pages. Sur téléphone, photographie les pages une par une en utilisant « Ajouter des pages ». Depuis la galerie ou un ordinateur, plusieurs fichiers peuvent être sélectionnés en une seule fois. Le ticket température reste unique par livraison.</p>
        </div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Document</th><th>Fichier</th><th>Actions</th></tr></thead><tbody>${scannedRows}</tbody></table></div>
    </div>

    <div class="grid grid-2" style="margin-top:18px;">
      <div class="card">
        <h3>Réceptionner une livraison</h3>
        ${renderReceiptBuilder()}
      </div>
      <div class="card">
        <div class="toolbar">
          <h3>Historique des réceptions</h3>
          <button data-action="exportCsv" data-type="receipts" class="secondary">Exporter CSV</button>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Réception</th><th>Fournisseur</th><th>Commande liée</th><th>Lignes</th><th>Note</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
      </div>
    </div>
  `;
}

function renderReceiptBuilder(orderId = '') {
  const openOrders = state.orders.filter(o => !['Reçue', 'Annulée'].includes(o.status));
  const orderOptions = [`<option value="">Sans commande liée</option>`].concat(openOrders.map(o => `<option value="${o.id}" ${o.id === orderId ? 'selected' : ''}>${escapeHtml(o.ref)} — ${escapeHtml(getSupplier(o.supplierId)?.name || '')}</option>`)).join('');
  const supplierOptions = state.suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  const productOptions = state.products.filter(p => p.active !== false).map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.unit || '')})</option>`).join('');
  const zoneOptions = state.zones.sort((a,b) => Number(a.sequence || 0)-Number(b.sequence || 0)).map(z => `<option value="${z.id}">${escapeHtml(z.sequence || '')} · ${escapeHtml(z.name)}</option>`).join('');
  const lines = receiptDraft.map((line, index) => `
    <div class="receipt-row">
      <div><strong>${escapeHtml(getProduct(line.productId)?.name || '-')}</strong></div>
      <div>${number(line.qty)}</div>
      <div>${escapeHtml(line.batch || '-')}</div>
      <div>${escapeHtml(line.dlc || '-')}</div>
      <div>${escapeHtml(getZone(line.zoneId)?.name || '-')}</div>
      <button class="small danger-soft" data-action="removeReceiptLine" data-id="${index}">×</button>
    </div>
  `).join('') || `<p class="muted">Aucune ligne ajoutée.</p>`;

  return `
    <div class="form-grid">
      <label>Commande liée<select id="receiptOrder">${orderOptions}</select></label>
      <label>Fournisseur<select id="receiptSupplier">${supplierOptions || '<option value="">Ajoute un fournisseur d’abord</option>'}</select></label>
      <label>Date de réception<input id="receiptDate" type="date" value="${today()}" /></label>
      <label>Note<input id="receiptNote" placeholder="Ex: palettes contrôlées, manque 1 colis..." /></label>
    </div>
    <div class="line-editor" style="margin-top:14px;">
      <div class="form-grid">
        <label>Produit<select id="receiptProduct">${productOptions || '<option value="">Ajoute un produit d’abord</option>'}</select></label>
        <label>Quantité reçue<input id="receiptQty" type="number" step="0.01" min="0" /></label>
        <label>Lot<input id="receiptBatch" placeholder="Lot fournisseur" /></label>
        <label>DLC / DDM<input id="receiptDlc" type="date" /></label>
        <label>Zone de rangement<select id="receiptZone">${zoneOptions || '<option value="">Ajoute une zone d’abord</option>'}</select></label>
        <label> <button type="button" data-action="addReceiptLine" class="secondary full">Ajouter la ligne</button></label>
      </div>
      <div class="line-list">${lines}</div>
      <button type="button" data-action="saveReceipt" class="success full">Valider la réception et entrer en stock</button>
    </div>
  `;
}

function renderZones() {
  const orderedZones = state.zones.slice().sort((a,b) => Number(a.sequence || 0)-Number(b.sequence || 0));
  const planRows = orderedZones.map(z => `
    <tr>
      <td><strong>${escapeHtml(z.sequence || '')}</strong></td>
      <td><span class="badge danger">${escapeHtml(z.code || '')}</span></td>
      <td><strong>${escapeHtml(z.name)}</strong><br><span class="muted">${escapeHtml(z.description || '')}</span></td>
      <td>${escapeHtml(z.type || '-')}</td>
      <td>${escapeHtml(z.temperature || '-')}</td>
      <td>${state.products.filter(p => p.storageZoneId === z.id).length}</td>
      <td class="actions">
        <button class="small secondary" data-action="openZone" data-id="${z.id}">Modifier</button>
        <button class="small danger-soft" data-action="deleteZone" data-id="${z.id}">Supprimer</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="7" class="empty">Aucune zone de stockage.</td></tr>`;

  return `
    <div class="card">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Plan de séquençage</p>
          <h3>Zones de stockage</h3>
          <p class="muted">Le plan ci-dessous reprend les zones numérotées visibles sur ton schéma : N°1000 à N°7000.</p>
        </div>
        <button data-action="openZone">Ajouter une zone</button>
      </div>
      <div class="zone-plan-card">
        <div class="stock-map" aria-label="Plan de séquençage des zones de stockage">
          <div class="stock-map-title">Plan de séquençage des stocks</div>
          <div class="stock-map-grid">
            <div class="stock-map-zone z1000"><strong>N°1000</strong><span>Chambre négative</span></div>
            <div class="stock-map-zone z2000"><strong>N°2000</strong><span>Chambre positive</span></div>
            <div class="stock-map-zone z3000"><strong>N°3000</strong><span>SEC 2</span></div>
            <div class="stock-map-zone z4000"><strong>N°4000</strong><span>SEC 1</span></div>
            <div class="stock-map-zone z5000"><strong>N°5000</strong><span>Peinture fraîche</span></div>
            <div class="stock-map-zone z6000"><strong>N°6000</strong><span>Local hôtesse</span></div>
            <div class="stock-map-zone z7000"><strong>N°7000</strong><span>Bureau Manager</span></div>
          </div>
          <div class="stock-map-note">Version GitHub Pages sans image externe : le plan est intégré directement en HTML/CSS.</div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div><h3>Séquençage des zones</h3><p class="muted">Ordre conseillé de contrôle et de rangement selon le plan.</p></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Ordre</th><th>Code plan</th><th>Zone</th><th>Type</th><th>Température</th><th>Produits liés</th><th>Actions</th></tr></thead><tbody>${planRows}</tbody></table></div>
    </div>
  `;
}

function renderSuppliers() {
  const rows = filterRows(state.suppliers, ['name', 'contact', 'email', 'phone']).map(s => `
    <tr>
      <td><strong>${escapeHtml(s.name)}</strong><br><span class="muted">${escapeHtml(s.contact || '')}</span></td>
      <td>${escapeHtml(s.email || '-')}</td>
      <td>${escapeHtml(s.phone || '-')}</td>
      <td>${escapeHtml(s.defaultDelay || '0')} j</td>
      <td>${state.products.filter(p => p.supplierId === s.id).length}</td>
      <td class="actions">
        <button class="small secondary" data-action="openSupplier" data-id="${s.id}">Modifier</button>
        <button class="small danger-soft" data-action="deleteSupplier" data-id="${s.id}">Supprimer</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="empty">Aucun fournisseur.</td></tr>`;
  return `
    <div class="card">
      <div class="toolbar">
        <input class="search" data-search placeholder="Rechercher fournisseur..." />
        <button data-action="openSupplier">Ajouter un fournisseur</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Fournisseur</th><th>Email</th><th>Téléphone</th><th>Délai moyen</th><th>Produits</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
  `;
}

function renderMonthEnd() {
  const month = selectedMonthEndMonth || today().slice(0, 7);
  const session = getMonthEndSession(month);
  const lineMap = new Map((session?.lines || []).map(line => [line.productId, line]));
  const draftForMonth = monthEndDraftValues[monthEndDraftKey(month)] || {};
  const activeProducts = state.products.filter(p => p.active !== false).sort(monthEndProductSortWithDraft(draftForMonth));
  const filteredProducts = filterRows(activeProducts, ['sku', 'name', 'category', 'storageLabel', 'packageSize']).sort(monthEndProductSortWithDraft(draftForMonth));
  const duplicates = getMonthEndDuplicateOrders(activeProducts, draftForMonth);
  const duplicateOrders = new Set(duplicates.map(group => String(group.order)));
  const duplicateAlert = duplicates.length ? `
    <div class="alert warning month-duplicate-alert">
      <strong>Doublon de numéro de tri détecté.</strong><br>
      <span>${escapeHtml(duplicateMonthEndMessage(duplicates)).split('\n').join('<br>')}</span>
    </div>
  ` : '';

  const rows = filteredProducts.map(product => {
    const line = lineMap.get(product.id) || {};
    const draftLine = draftForMonth[product.id] || {};
    const orderValue = monthEndOrderValue(product, draftForMonth);
    const isDuplicate = duplicateOrders.has(String(orderValue));
    return `
      <tr class="${isDuplicate ? 'duplicate-row' : ''}">
        <td>
          <input class="sort-input ${isDuplicate ? 'duplicate-input' : ''}" data-month-order="${escapeHtml(product.id)}" type="number" min="1" step="1" value="${escapeHtml((draftLine.order ?? product.monthEndOrder) || monthEndProductOrder(product))}" />
          ${isDuplicate ? '<br><span class="badge danger">Doublon</span>' : ''}
        </td>
        <td><strong>${escapeHtml(product.name)}</strong><br><span class="muted">${escapeHtml(product.sku || 'Sans réf.')} · ${escapeHtml(product.packageSize || '')}</span></td>
        <td>${escapeHtml(productCategoryLabel(product))}</td>
        <td>${escapeHtml(getZone(product.storageZoneId)?.name || product.storageLabel || '-')}</td>
        <td><input class="count-input" data-month-ue="${escapeHtml(product.id)}" type="number" step="0.01" min="0" inputmode="decimal" value="${escapeHtml(draftLine.ue ?? line.ue ?? '')}" placeholder="U.E" /></td>
        <td><input class="count-input" data-month-su="${escapeHtml(product.id)}" type="number" step="0.01" min="0" inputmode="decimal" value="${escapeHtml(draftLine.su ?? line.su ?? '')}" placeholder="S.U" /></td>
        <td><input class="count-input" data-month-uu="${escapeHtml(product.id)}" type="number" step="0.01" min="0" inputmode="decimal" value="${escapeHtml(draftLine.uu ?? line.uu ?? '')}" placeholder="U.U" /></td>
        <td><input data-month-note="${escapeHtml(product.id)}" value="${escapeHtml(draftLine.note ?? line.note ?? '')}" placeholder="Note" /></td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="8" class="empty">Aucun produit actif à afficher.</td></tr>`;

  const historyRows = (state.monthEndSessions || []).slice().sort((a, b) => String(b.month).localeCompare(String(a.month))).map(item => `
    <tr>
      <td><strong>${escapeHtml(item.month)}</strong><br><span class="muted">${escapeHtml(item.updatedAt ? new Date(item.updatedAt).toLocaleString('fr-FR') : '')}</span></td>
      <td>${(item.lines || []).length} produit(s)</td>
      <td>${(item.lines || []).filter(line => line.ue !== '' || line.su !== '' || line.uu !== '').length} ligne(s) saisie(s)</td>
      <td class="actions">
        <button class="small secondary" data-action="openMonthEndSession" data-id="${item.id}">Voir</button>
        <button class="small secondary" data-action="exportMonthEndSessionPdf" data-id="${item.id}">PDF</button>
        <button class="small danger-soft" data-action="deleteMonthEndSession" data-id="${item.id}">Supprimer</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="empty">Aucun inventaire fin de mois enregistré.</td></tr>`;

  return `
    <div class="card subpage-heading">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Inventaire total</p>
          <h3>Fin de mois</h3>
          <p class="muted">Liste indépendante de la page Inventaire. Les numéros de tri ici peuvent être différents des bons de commande.</p>
        </div>
        <div class="toolbar-right">
          <label class="inline-label">Mois<input data-month-end-month type="month" value="${escapeHtml(month)}" /></label>
          <button data-action="refreshMonthEndOrder" class="secondary">Rafraîchir l’ordre</button>
          <button data-action="saveMonthEndInventory" class="success">Enregistrer</button>
          <button data-action="exportCsv" data-type="monthEnd" class="secondary">Exporter CSV</button>
          <button data-action="exportMonthEndPdf" class="secondary">Exporter PDF</button>
        </div>
      </div>
    </div>
    ${duplicateAlert}
    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <input class="search" data-search placeholder="Rechercher produit, référence, catégorie..." />
        <span class="muted">${filteredProducts.length} affiché(s) · ${activeProducts.length} produit(s) actif(s)</span>
      </div>
      <div class="table-wrap"><table><thead><tr><th>N° tri</th><th>Produit</th><th>Catégorie</th><th>Zone</th><th>U.E</th><th>S.U</th><th>U.U</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
    <div class="card" style="margin-top:18px;">
      <div class="toolbar"><h3>Historique fin de mois</h3><span class="muted">Inventaires totaux enregistrés</span></div>
      <div class="table-wrap"><table><thead><tr><th>Mois</th><th>Lignes</th><th>Saisies</th><th>Actions</th></tr></thead><tbody>${historyRows}</tbody></table></div>
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="grid grid-2">
      <div class="card">
        <h3>Paramètres généraux</h3>
        <div class="form-grid">
          <label class="wide">Nom établissement<input id="settingCompany" value="${escapeHtml(state.settings.companyName || '')}" /></label>
          <label>Règle de sortie<select id="settingSequence"><option ${state.settings.sequenceMode === 'FEFO' ? 'selected' : ''}>FEFO</option><option ${state.settings.sequenceMode === 'FIFO' ? 'selected' : ''}>FIFO</option></select></label>
          <label>Mercredi HUB de référence<input id="settingHubReference" type="date" value="${escapeHtml(state.settings.hubReferenceDate || defaultHubReferenceDate())}" /></label>
          <label>Semaines à afficher<input id="settingProjectionWeeks" type="number" min="2" max="26" value="${escapeHtml(state.settings.inventoryProjectionWeeks || 8)}" /></label>
          <label>Version<input value="${APP_VERSION}" disabled /></label>
        </div>
        <div class="logo-settings">
          <div class="logo-preview ${state.settings.logoDataUrl ? 'has-logo' : ''}">${state.settings.logoDataUrl ? `<img src="${escapeHtml(state.settings.logoDataUrl)}" alt="Logo actuel" />` : 'GS'}</div>
          <div>
            <h4>Logo de l’application</h4>
            <p class="muted">Le logo remplace le carré “GS” dans le menu. Il est conservé dans la sauvegarde locale.</p>
            <div class="form-actions inline-actions">
              <label class="secondary file-label">Changer le logo<input id="settingLogoInput" type="file" accept="image/*" hidden /></label>
              ${state.settings.logoDataUrl ? '<button type="button" data-action="removeLogo" class="danger-soft">Supprimer le logo</button>' : ''}
            </div>
            ${state.settings.logoFileName ? `<p class="muted">Fichier actuel : ${escapeHtml(state.settings.logoFileName)}</p>` : ''}
          </div>
        </div>
        <div class="form-actions"><button data-action="saveSettings" class="success">Enregistrer</button></div>
      </div>
      <div class="card">
        <h3>Sauvegarde / transfert</h3>
        <p class="muted">Cette version est connectée à Supabase. Les données sont aussi gardées localement en secours sur l’appareil.</p>
        <div class="cloud-status ${cloudReady ? 'success' : 'warning'}">
          <strong>${cloudReady ? 'Cloud Supabase actif' : 'Cloud Supabase non connecté'}</strong>
          <span>${cloudReady ? `Dernière sauvegarde : ${escapeHtml(lastCloudSaveAt || 'en attente')}` : 'Vérifie le fichier supabase-config.js et la table app_data.'}</span>
        </div>
        <div class="grid">
          <button data-action="syncFromCloud" class="secondary">Charger depuis Supabase</button>
          <button data-action="syncToCloud" class="success">Envoyer vers Supabase</button>
          <button data-action="exportJson" class="secondary">Télécharger la sauvegarde JSON</button>
          <button data-action="exportCsv" data-type="all" class="secondary">Exporter toutes les tables CSV</button>
        </div>
      </div>
      <div class="card wide">
        <h3>Lots et DLC à sortir en priorité</h3>
        <div class="table-wrap"><table><thead><tr><th>Produit</th><th>Lot</th><th>DLC</th><th>Quantité</th><th>Zone</th><th>Priorité</th></tr></thead><tbody>${renderLotRows()}</tbody></table></div>
      </div>
    </div>
  `;
}

function renderLotRows() {
  const lots = state.products.flatMap(p => getLots(p.id).map(l => ({ ...l, product: p })));
  lots.sort((a,b) => {
    if (state.settings.sequenceMode === 'FEFO') return String(a.dlc || '9999').localeCompare(String(b.dlc || '9999'));
    return String(a.batch || '').localeCompare(String(b.batch || ''));
  });
  return lots.map((l, index) => `
    <tr>
      <td>${escapeHtml(l.product.name)}</td>
      <td>${escapeHtml(l.batch)}</td>
      <td>${escapeHtml(l.dlc || '-')}</td>
      <td>${number(l.qty)} ${escapeHtml(l.product.unit || '')}</td>
      <td>${escapeHtml(getZone(l.zoneId)?.name || '-')}</td>
      <td><span class="badge ${index < 3 ? 'warning' : 'info'}">${index + 1}</span></td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="empty">Aucun lot avec DLC enregistré.</td></tr>`;
}

function renderZoneSequenceRows() {
  return state.zones.slice().sort((a,b) => Number(a.sequence || 0)-Number(b.sequence || 0)).map(z => `
    <tr>
      <td>${escapeHtml(z.sequence || '')}</td>
      <td><strong>${escapeHtml(z.name)}</strong><br><span class="muted">${escapeHtml(z.code || '')}</span></td>
      <td>${escapeHtml(z.type || '-')}</td>
      <td>${escapeHtml(z.description || '-')}</td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="empty">Ajoute des zones pour créer le séquençage.</td></tr>`;
}

function openModal(title, html, onSubmit) {
  const modal = document.querySelector('#modal');
  const form = document.querySelector('#modalForm');
  document.querySelector('#modalTitle').textContent = title;
  form.innerHTML = html;
  form.onsubmit = event => {
    event.preventDefault();
    onSubmit(new FormData(form));
  };
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  document.querySelector('#modal').classList.add('hidden');
  document.querySelector('#modal').setAttribute('aria-hidden', 'true');
  document.querySelector('#modalForm').innerHTML = '';
}

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 2400);
}

const formActions = html => `${html}<div class="form-actions"><button type="button" class="secondary" id="modalCancel">Annuler</button><button type="submit" class="success">Enregistrer</button></div>`;

const actions = {
  openProduct(id) {
    const p = id ? getProduct(id) : {};
    const supplierOptions = ['<option value="">Aucun</option>'].concat(state.suppliers.map(s => `<option value="${s.id}" ${p.supplierId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`)).join('');
    const zoneOptions = ['<option value="">Aucune</option>'].concat(state.zones.map(z => `<option value="${z.id}" ${p.storageZoneId === z.id ? 'selected' : ''}>${escapeHtml(z.name)}</option>`)).join('');
    openModal(id ? 'Modifier le produit' : 'Ajouter un produit', formActions(`
      <div class="form-grid">
        <label>Référence / SKU<input name="sku" value="${escapeHtml(p.sku || '')}" placeholder="Ex: FRIT-10KG" /></label>
        <label>Nom produit<input name="name" required value="${escapeHtml(p.name || '')}" placeholder="Ex: Frites 10 kg" /></label>
        <label>Catégorie<input name="category" value="${escapeHtml(productCategoryLabel(p) === '-' ? '' : productCategoryLabel(p))}" placeholder="Frais, sec, surgelé, HUB..." /></label>
        <label>Unité de comptage<input name="unit" value="${escapeHtml(p.unit || 'colis')}" placeholder="colis, carton, kg, bidon..." /></label>
        <label>Conditionnement<input name="packageSize" value="${escapeHtml(p.packageSize || '')}" placeholder="Ex: 300 CT" /></label>
        <label class="wide">Planning inventaire<div class="checkbox-grid slots-grid">${inventoryPlanChecks(p)}</div></label>
        <label class="wide">Ordre dans les inventaires<div class="checkbox-grid slots-grid order-grid">${inventoryOrderInputs(p)}</div></label>
        <label>Stock minimum<input name="minStock" type="number" step="0.01" min="0" value="${escapeHtml(p.minStock || 0)}" /></label>
        <label>Stock maximum<input name="maxStock" type="number" step="0.01" min="0" value="${escapeHtml(p.maxStock || 0)}" /></label>
        <label>Prix dernier achat<input name="lastPrice" type="number" step="0.01" min="0" value="${escapeHtml(p.lastPrice || 0)}" /></label>
        <label>Fournisseur<select name="supplierId">${supplierOptions}</select></label>
        <label>Zone principale<select name="storageZoneId">${zoneOptions}</select></label>
        <label>Actif<select name="active"><option value="true" ${p.active !== false ? 'selected' : ''}>Oui</option><option value="false" ${p.active === false ? 'selected' : ''}>Non</option></select></label>
        <label class="wide">Consigne de stockage<textarea name="storageNote">${escapeHtml(p.storageNote || '')}</textarea></label>
      </div>
    `), fd => {
      const data = Object.fromEntries(fd.entries());
      const selectedSlots = fd.getAll('inventorySlots');
      const selectedTypes = inventoryTypesFromSlots(selectedSlots);
      const item = {
        id: p.id || uid(),
        sku: data.sku.trim(),
        name: data.name.trim(),
        category: selectedSlots.includes('wednesday_hub') ? 'HUB' : data.category.trim(),
        unit: data.unit.trim(),
        packageSize: data.packageSize.trim(),
        minStock: Number(data.minStock || 0),
        maxStock: Number(data.maxStock || 0),
        lastPrice: Number(data.lastPrice || 0),
        supplierId: data.supplierId,
        storageZoneId: data.storageZoneId,
        active: data.active === 'true',
        inventorySlots: selectedSlots,
        inventoryTypes: selectedTypes.length ? selectedTypes : ['general'],
        inventoryOrders: INVENTORY_SLOT_DEFINITIONS.reduce((orders, slot) => {
          const value = Number(data[`order_${slot.id}`] || 0);
          if (value > 0) orders[slot.id] = value;
          return orders;
        }, { ...(p.inventoryOrders || {}) }),
        storageNote: data.storageNote.trim()
      };
      const finalItem = normalizeHubProductCategory(item);
      if (id) state.products = state.products.map(x => x.id === id ? finalItem : x);
      else state.products.push(finalItem);
      saveState(); closeModal(); render(); toast('Produit enregistré');
    });
  },
  archiveProduct(id) {
    const product = getProduct(id);
    if (!product) return;
    if (!confirm(`Archiver ${product.name} ? Il ne sera plus proposé dans les inventaires, mais tu pourras le réintégrer plus tard.`)) return;
    state.products = state.products.map(p => p.id === id ? { ...p, active: false, archivedAt: new Date().toISOString() } : p);
    saveState(); render(); toast('Produit archivé');
  },
  restoreProduct(id) {
    const product = getProduct(id);
    if (!product) return;
    state.products = state.products.map(p => p.id === id ? { ...p, active: true, restoredAt: new Date().toISOString() } : p);
    saveState(); render(); toast('Produit réintégré');
  },
  setProductSubPage(id, type) {
    productSubPage = type === 'archived' ? 'archived' : 'active';
    render();
  },
  toggleArchivedProducts() {
    productSubPage = productSubPage === 'archived' ? 'active' : 'archived';
    render();
  },
  deleteProduct(id) {
    if (!confirm('Supprimer définitivement ce produit ? Préfère Archiver si le produit peut revenir plus tard.')) return;
    state.products = state.products.filter(p => p.id !== id);
    saveState(); render(); toast('Produit supprimé définitivement');
  },
  openSupplier(id) {
    const s = id ? getSupplier(id) : {};
    openModal(id ? 'Modifier le fournisseur' : 'Ajouter un fournisseur', formActions(`
      <div class="form-grid">
        <label>Nom fournisseur<input name="name" required value="${escapeHtml(s.name || '')}" /></label>
        <label>Contact<input name="contact" value="${escapeHtml(s.contact || '')}" /></label>
        <label>Email<input name="email" type="email" value="${escapeHtml(s.email || '')}" /></label>
        <label>Téléphone<input name="phone" value="${escapeHtml(s.phone || '')}" /></label>
        <label>Délai moyen livraison, jours<input name="defaultDelay" type="number" min="0" value="${escapeHtml(s.defaultDelay || 0)}" /></label>
        <label class="wide">Notes<textarea name="note">${escapeHtml(s.note || '')}</textarea></label>
      </div>
    `), fd => {
      const data = Object.fromEntries(fd.entries());
      const item = { id: s.id || uid(), name: data.name.trim(), contact: data.contact.trim(), email: data.email.trim(), phone: data.phone.trim(), defaultDelay: Number(data.defaultDelay || 0), note: data.note.trim() };
      if (id) state.suppliers = state.suppliers.map(x => x.id === id ? item : x);
      else state.suppliers.push(item);
      saveState(); closeModal(); render(); toast('Fournisseur enregistré');
    });
  },
  deleteSupplier(id) {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    state.suppliers = state.suppliers.filter(s => s.id !== id);
    state.products = state.products.map(p => p.supplierId === id ? { ...p, supplierId: '' } : p);
    saveState(); render(); toast('Fournisseur supprimé');
  },
  openZone(id) {
    const z = id ? getZone(id) : {};
    openModal(id ? 'Modifier la zone' : 'Ajouter une zone', formActions(`
      <div class="form-grid">
        <label>Ordre de passage<input name="sequence" type="number" min="0" value="${escapeHtml(z.sequence || state.zones.length + 1)}" /></label>
        <label>Code plan<input name="code" value="${escapeHtml(z.code || '')}" placeholder="Ex: N°1000" /></label>
        <label>Nom zone<input name="name" required value="${escapeHtml(z.name || '')}" placeholder="Réception, chambre froide..." /></label>
        <label>Type<input name="type" value="${escapeHtml(z.type || '')}" placeholder="Réception, sec, froid, picking..." /></label>
        <label>Température<input name="temperature" value="${escapeHtml(z.temperature || '')}" placeholder="Ambiant, +4°C, -18°C..." /></label>
        <label class="wide">Consigne / séquençage<textarea name="description" placeholder="Ex: ranger les produits frais dès contrôle DLC terminé.">${escapeHtml(z.description || '')}</textarea></label>
      </div>
    `), fd => {
      const data = Object.fromEntries(fd.entries());
      const item = { id: z.id || uid(), sequence: Number(data.sequence || 0), code: (data.code || '').trim(), aliases: z.aliases || [], name: data.name.trim(), type: data.type.trim(), temperature: data.temperature.trim(), description: data.description.trim() };
      if (id) state.zones = state.zones.map(x => x.id === id ? item : x);
      else state.zones.push(item);
      saveState(); closeModal(); render(); toast('Zone enregistrée');
    });
  },
  deleteZone(id) {
    if (!confirm('Supprimer cette zone ?')) return;
    state.zones = state.zones.filter(z => z.id !== id);
    state.products = state.products.map(p => p.storageZoneId === id ? { ...p, storageZoneId: '' } : p);
    saveState(); render(); toast('Zone supprimée');
  },
  openMove(productId = '') {
    const productOptions = state.products.filter(p => p.active !== false || p.id === productId).map(p => `<option value="${p.id}" ${productId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}${p.active === false ? ' (archivé)' : ''}</option>`).join('');
    const zoneOptions = ['<option value="">Aucune</option>'].concat(state.zones.map(z => `<option value="${z.id}">${escapeHtml(z.name)}</option>`)).join('');
    openModal('Créer un mouvement de stock', formActions(`
      <div class="form-grid">
        <label>Date<input name="date" type="date" value="${today()}" required /></label>
        <label>Type<select name="type"><option>Entrée</option><option>Sortie</option><option>Ajustement positif</option><option>Ajustement négatif</option><option>Transfert</option></select></label>
        <label>Produit<select name="productId" required>${productOptions}</select></label>
        <label>Quantité<input name="qty" type="number" step="0.01" min="0" required /></label>
        <label>Depuis zone<select name="fromZoneId">${zoneOptions}</select></label>
        <label>Vers zone<select name="toZoneId">${zoneOptions}</select></label>
        <label>Lot<input name="batch" /></label>
        <label>DLC / DDM<input name="dlc" type="date" /></label>
        <label class="wide">Note<textarea name="note"></textarea></label>
      </div>
    `), fd => {
      const data = Object.fromEntries(fd.entries());
      let qty = Number(data.qty || 0);
      if (['Sortie', 'Ajustement négatif'].includes(data.type)) qty = -Math.abs(qty);
      const item = { id: uid(), date: data.date, type: data.type, productId: data.productId, qty, fromZoneId: data.fromZoneId, toZoneId: data.toZoneId || getProduct(data.productId)?.storageZoneId || '', batch: data.batch.trim(), dlc: data.dlc, note: data.note.trim() };
      state.movements.push(item);
      saveState(); closeModal(); render(); toast('Mouvement enregistré');
    });
  },
  deleteMovement(id) {
    if (!confirm('Supprimer ce mouvement ? Cela modifiera le stock calculé.')) return;
    state.movements = state.movements.filter(m => m.id !== id);
    saveState(); render(); toast('Mouvement supprimé');
  },
  refreshMonthEndOrder() {
    const month = document.querySelector('[data-month-end-month]')?.value || selectedMonthEndMonth || today().slice(0, 7);
    selectedMonthEndMonth = month;
    const draft = cacheCurrentMonthEndDraft();
    const products = state.products.filter(product => product.active !== false);
    products.forEach(product => {
      const raw = draft[product.id]?.order;
      if (raw !== undefined) product.monthEndOrder = Number(raw || 0) || '';
    });
    const refreshedDraft = monthEndDraftValues[monthEndDraftKey(month)] || {};
    const duplicates = getMonthEndDuplicateOrders(products, refreshedDraft);
    saveState();
    render();
    if (duplicates.length) {
      alert('Attention : deux produits ou plus ont le même numéro de tri.\n\n' + duplicateMonthEndMessage(duplicates));
    } else {
      toast('Ordre fin de mois rafraîchi');
    }
  },
  saveMonthEndInventory() {
    const month = document.querySelector('[data-month-end-month]')?.value || selectedMonthEndMonth || today().slice(0, 7);
    selectedMonthEndMonth = month;
    const draft = cacheCurrentMonthEndDraft();
    const previous = getMonthEndSession(month);
    const previousLines = new Map((previous?.lines || []).map(line => [line.productId, line]));
    const products = state.products.filter(p => p.active !== false);
    products.forEach(product => {
      const raw = draft[product.id]?.order;
      if (raw !== undefined) product.monthEndOrder = Number(raw || 0) || '';
    });
    const duplicates = getMonthEndDuplicateOrders(products, monthEndDraftValues[monthEndDraftKey(month)] || {});
    if (duplicates.length) {
      const ok = confirm('Attention : deux produits ou plus ont le même numéro de tri.\n\n' + duplicateMonthEndMessage(duplicates) + '\n\nEnregistrer quand même ?');
      if (!ok) {
        render();
        return;
      }
    }
    const lines = products.sort(monthEndProductSortWithDraft(monthEndDraftValues[monthEndDraftKey(month)] || {})).map(product => {
      const old = previousLines.get(product.id) || {};
      const draftLine = monthEndDraftValues[monthEndDraftKey(month)]?.[product.id] || {};
      const readValue = key => draftLine[key] !== undefined ? draftLine[key] : (old[key] ?? '');
      return {
        productId: product.id,
        sku: product.sku || '',
        name: product.name || '',
        category: productCategoryLabel(product),
        zone: getZone(product.storageZoneId)?.name || product.storageLabel || '',
        packageSize: product.packageSize || '',
        order: monthEndOrderValue(product, monthEndDraftValues[monthEndDraftKey(month)] || {}),
        ue: readValue('ue'),
        su: readValue('su'),
        uu: readValue('uu'),
        note: readValue('note')
      };
    });
    const session = {
      id: previous?.id || uid(),
      month,
      createdAt: previous?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines
    };
    state.monthEndSessions = (state.monthEndSessions || []).filter(item => item.month !== month);
    state.monthEndSessions.push(session);
    monthEndDraftValues[monthEndDraftKey(month)] = {};
    saveState(); render(); toast('Inventaire fin de mois enregistré');
  },
  openMonthEndSession(id) {
    const session = (state.monthEndSessions || []).find(item => item.id === id);
    if (!session) return toast('Inventaire fin de mois introuvable');
    const rows = (session.lines || []).slice().sort((a, b) => Number(a.order || 999999) - Number(b.order || 999999)).map(line => `
      <tr>
        <td>${escapeHtml(line.order || '')}</td>
        <td><strong>${escapeHtml(line.name)}</strong><br><span class="muted">${escapeHtml(line.sku || '')} · ${escapeHtml(line.packageSize || '')}</span></td>
        <td>${escapeHtml(line.category || '')}</td>
        <td>${escapeHtml(line.ue ?? '')}</td>
        <td>${escapeHtml(line.su ?? '')}</td>
        <td>${escapeHtml(line.uu ?? '')}</td>
        <td>${escapeHtml(line.note || '')}</td>
      </tr>
    `).join('');
    openModal(`Inventaire fin de mois ${session.month}`, `
      <div class="table-wrap"><table><thead><tr><th>N° tri</th><th>Produit</th><th>Catégorie</th><th>U.E</th><th>S.U</th><th>U.U</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="form-actions"><button type="button" id="modalCancel" class="secondary">Fermer</button></div>
    `, () => {});
  },
  deleteMonthEndSession(id) {
    if (!confirm('Supprimer cet inventaire fin de mois ?')) return;
    state.monthEndSessions = (state.monthEndSessions || []).filter(item => item.id !== id);
    saveState(); render(); toast('Inventaire fin de mois supprimé');
  },
  exportMonthEndPdf() {
    const month = document.querySelector('[data-month-end-month]')?.value || selectedMonthEndMonth || today().slice(0, 7);
    selectedMonthEndMonth = month;
    cacheCurrentMonthEndDraft();
    const rows = monthEndCurrentRows(month);
    printMonthEndPdf(monthEndPdfTitle(month), rows, 'Inventaire total avec colonnes U.E / S.U / U.U');
  },
  exportMonthEndSessionPdf(id) {
    const session = (state.monthEndSessions || []).find(item => item.id === id);
    if (!session) return toast('Inventaire fin de mois introuvable');
    const rows = (session.lines || []).slice().sort((a, b) => Number(a.order || 999999) - Number(b.order || 999999));
    printMonthEndPdf(monthEndPdfTitle(session.month), rows, 'Inventaire fin de mois enregistré');
  },
  triggerOrderScan(date, type) {
    if (!date || !type) return toast('Choisis une date et un type de commande');
    pendingOrderScan = { date, type };
    const input = document.querySelector('#orderScanInput');
    if (!input) return toast('Impossible d’ouvrir la numérisation');
    input.click();
  },
  viewScannedOrder(id) {
    const scan = (state.scannedOrders || []).find(x => x.id === id);
    if (!scan) return toast('Bon de commande introuvable');
    const pages = scanPages(scan);
    const previews = pages.map((page, index) => {
      const isImage = String(page.fileType || '').startsWith('image/');
      const preview = isImage
        ? `<img class="scan-preview" src="${escapeHtml(page.fileData)}" alt="Page ${index + 1} du bon de commande" />`
        : `<div class="scan-file-preview"><p>Fichier non-image enregistré.</p><a class="download-link" href="${escapeHtml(page.fileData)}" download="${escapeHtml(page.fileName || orderScanFileName(scan.date, scan.type))}">Télécharger / ouvrir le fichier</a></div>`;
      return `
        <section class="scan-page-card">
          <div class="scan-page-header"><strong>Page ${index + 1}</strong><span class="muted">${escapeHtml(page.fileName || '')}</span></div>
          ${preview}
          <div class="form-actions scan-page-actions">
            <a class="download-link" href="${escapeHtml(page.fileData)}" download="${escapeHtml(page.fileName || orderScanFileName(scan.date, scan.type))}">Télécharger cette page</a>
            <button type="button" class="small danger-soft" data-action="deleteScannedOrderPage" data-id="${scan.id}" data-type="${page.id}">Supprimer cette page</button>
          </div>
        </section>
      `;
    }).join('') || '<p class="muted">Aucune page enregistrée.</p>';
    openModal(`Bon de commande · ${orderTypeLabel(scan.type)}`, `
      <div class="scan-modal-content">
        <p><strong>Date :</strong> ${escapeHtml(formatDateFr(scan.date))}<br><strong>Type :</strong> ${escapeHtml(orderTypeLabel(scan.type))}<br><strong>Nombre de pages :</strong> ${pages.length}</p>
        <div class="form-actions"><button type="button" id="modalCancel" class="secondary">Fermer</button></div>
        <div class="scan-pages-list">${previews}</div>
      </div>
    `, () => {});
  },
  deleteScannedOrderPage(id, pageId) {
    const scan = (state.scannedOrders || []).find(x => x.id === id);
    if (!scan) return toast('Bon de commande introuvable');
    if (!confirm('Supprimer cette page du bon de commande ?')) return;
    const pages = scanPages(scan).filter(page => page.id !== pageId);
    if (!pages.length) state.scannedOrders = (state.scannedOrders || []).filter(item => item.id !== id);
    else scan.pages = pages;
    saveState(); closeModal(); render(); toast('Page supprimée');
  },
  deleteScannedOrder(id) {
    if (!confirm('Supprimer ce bon de commande numérisé ?')) return;
    state.scannedOrders = (state.scannedOrders || []).filter(scan => scan.id !== id);
    saveState(); render(); toast('Bon de commande numérisé supprimé');
  },
  triggerReceiptScan(date, type, docType = 'delivery') {
    const effectiveDocType = docType || 'delivery';
    const effectiveType = receiptScanScopeType(type || 'delivery', effectiveDocType);
    if (!date || (!effectiveType && effectiveDocType !== 'temperature')) return toast('Choisis une date et un type de livraison');
    pendingReceiptScan = { date, type: effectiveType, docType: effectiveDocType };
    const input = document.querySelector('#receiptScanInput');
    if (!input) return toast('Impossible d’ouvrir la numérisation');
    input.click();
  },
  viewScannedReceipt(id) {
    const scan = (state.scannedReceipts || []).find(x => x.id === id);
    if (!scan) return toast('Document de livraison introuvable');
    const pages = scanPages(scan);
    const scanTypeLabel = scan.docType === 'temperature' ? 'Livraison complète' : receiptTypeLabel(scan.type);
    const previews = pages.map((page, index) => {
      const isImage = String(page.fileType || '').startsWith('image/');
      const preview = isImage
        ? `<img class="scan-preview" src="${escapeHtml(page.fileData)}" alt="Page ${index + 1} du document numérisé" />`
        : `<div class="scan-file-preview"><p>Fichier non-image enregistré.</p><a class="download-link" href="${escapeHtml(page.fileData)}" download="${escapeHtml(page.fileName || receiptScanFileName(scan.date, scan.type, scan.docType))}">Télécharger / ouvrir le fichier</a></div>`;
      return `
        <section class="scan-page-card">
          <div class="scan-page-header"><strong>Page ${index + 1}</strong><span class="muted">${escapeHtml(page.fileName || '')}</span></div>
          ${preview}
          <div class="form-actions scan-page-actions">
            <a class="download-link" href="${escapeHtml(page.fileData)}" download="${escapeHtml(page.fileName || receiptScanFileName(scan.date, scan.type, scan.docType))}">Télécharger cette page</a>
            <button type="button" class="small danger-soft" data-action="deleteScannedReceiptPage" data-id="${scan.id}" data-type="${page.id}">Supprimer cette page</button>
          </div>
        </section>
      `;
    }).join('') || '<p class="muted">Aucune page enregistrée.</p>';
    openModal(`${receiptDocLabel(scan.docType)} · ${scanTypeLabel}`, `
      <div class="scan-modal-content">
        <p><strong>Date :</strong> ${escapeHtml(formatDateFr(scan.date))}<br><strong>Type :</strong> ${escapeHtml(scanTypeLabel)}<br><strong>Document :</strong> ${escapeHtml(receiptDocLabel(scan.docType))}<br><strong>Nombre de pages :</strong> ${pages.length}</p>
        <div class="form-actions"><button type="button" id="modalCancel" class="secondary">Fermer</button></div>
        <div class="scan-pages-list">${previews}</div>
      </div>
    `, () => {});
  },
  deleteScannedReceiptPage(id, pageId) {
    const scan = (state.scannedReceipts || []).find(x => x.id === id);
    if (!scan) return toast('Document de livraison introuvable');
    if (!confirm('Supprimer cette page du document ?')) return;
    const pages = scanPages(scan).filter(page => page.id !== pageId);
    if (!pages.length) state.scannedReceipts = (state.scannedReceipts || []).filter(item => item.id !== id);
    else scan.pages = pages;
    saveState(); closeModal(); render(); toast('Page supprimée');
  },
  deleteScannedReceipt(id) {
    if (!confirm('Supprimer ce document de livraison numérisé ?')) return;
    state.scannedReceipts = (state.scannedReceipts || []).filter(scan => scan.id !== id);
    saveState(); render(); toast('Document de livraison numérisé supprimé');
  },
  addOrderLine() {
    const productId = document.querySelector('#orderProduct')?.value;
    const qty = Number(document.querySelector('#orderQty')?.value || 0);
    const unitPrice = Number(document.querySelector('#orderPrice')?.value || 0);
    if (!productId || qty <= 0) return toast('Choisis un produit et une quantité');
    orderDraft.push({ productId, qty, unitPrice });
    render();
  },
  removeOrderLine(index) {
    orderDraft.splice(Number(index), 1);
    render();
  },
  saveOrder() {
    const supplierId = document.querySelector('#orderSupplier')?.value;
    if (!supplierId) return toast('Ajoute ou choisis un fournisseur');
    if (!orderDraft.length) return toast('Ajoute au moins une ligne');
    const order = {
      id: uid(),
      ref: `CMD-${new Date().getFullYear()}-${String(state.orders.length + 1).padStart(4, '0')}`,
      supplierId,
      date: today(),
      expectedDate: document.querySelector('#orderExpected')?.value || '',
      status: 'Brouillon',
      lines: orderDraft.map(x => ({ ...x })),
      note: ''
    };
    state.orders.push(order);
    orderDraft = [];
    saveState(); render(); toast('Commande créée');
  },
  viewOrder(id) {
    const o = state.orders.find(x => x.id === id);
    if (!o) return;
    const lines = (o.lines || []).map(line => `
      <tr><td>${escapeHtml(getProduct(line.productId)?.name || '-')}</td><td>${number(line.qty)}</td><td>${money(line.unitPrice)}</td><td>${money(Number(line.qty) * Number(line.unitPrice))}</td></tr>
    `).join('');
    openModal(`Commande ${o.ref}`, `
      <div class="grid">
        <p><strong>Fournisseur :</strong> ${escapeHtml(getSupplier(o.supplierId)?.name || '-')}<br><strong>Statut :</strong> ${escapeHtml(o.status)}<br><strong>Date prévue :</strong> ${escapeHtml(o.expectedDate || '-')}</p>
        <div class="table-wrap"><table><thead><tr><th>Produit</th><th>Qté</th><th>Prix U.</th><th>Total</th></tr></thead><tbody>${lines}</tbody></table></div>
        <div class="form-actions"><button type="button" id="modalCancel" class="secondary">Fermer</button><button type="button" class="success" data-action="markOrderSent" data-id="${o.id}">Marquer envoyée</button></div>
      </div>
    `, () => {});
    document.querySelector('[data-action="markOrderSent"]')?.addEventListener('click', () => actions.markOrderSent(o.id));
  },
  markOrderSent(id) {
    state.orders = state.orders.map(o => o.id === id ? { ...o, status: 'Envoyée' } : o);
    saveState(); closeModal(); render(); toast('Commande marquée envoyée');
  },
  deleteOrder(id) {
    if (!confirm('Supprimer cette commande ?')) return;
    state.orders = state.orders.filter(o => o.id !== id);
    saveState(); render(); toast('Commande supprimée');
  },
  openReceiptForOrder(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) return;
    receiptDraft = (order.lines || []).map(line => ({
      productId: line.productId,
      qty: line.qty,
      batch: '',
      dlc: '',
      zoneId: getProduct(line.productId)?.storageZoneId || state.zones[0]?.id || ''
    }));
    setPage('receipts');
    setTimeout(() => {
      const orderSelect = document.querySelector('#receiptOrder');
      const supplierSelect = document.querySelector('#receiptSupplier');
      if (orderSelect) orderSelect.value = id;
      if (supplierSelect) supplierSelect.value = order.supplierId;
    });
  },
  addReceiptLine() {
    const productId = document.querySelector('#receiptProduct')?.value;
    const qty = Number(document.querySelector('#receiptQty')?.value || 0);
    const batch = document.querySelector('#receiptBatch')?.value || '';
    const dlc = document.querySelector('#receiptDlc')?.value || '';
    const zoneId = document.querySelector('#receiptZone')?.value || '';
    if (!productId || qty <= 0) return toast('Choisis un produit et une quantité reçue');
    receiptDraft.push({ productId, qty, batch, dlc, zoneId });
    render();
  },
  removeReceiptLine(index) {
    receiptDraft.splice(Number(index), 1);
    render();
  },
  saveReceipt() {
    if (!receiptDraft.length) return toast('Ajoute au moins une ligne reçue');
    const orderId = document.querySelector('#receiptOrder')?.value || '';
    const order = state.orders.find(o => o.id === orderId);
    const supplierId = document.querySelector('#receiptSupplier')?.value || order?.supplierId || '';
    const date = document.querySelector('#receiptDate')?.value || today();
    const note = document.querySelector('#receiptNote')?.value || '';
    const receipt = {
      id: uid(),
      ref: `REC-${new Date().getFullYear()}-${String(state.receipts.length + 1).padStart(4, '0')}`,
      orderId,
      supplierId,
      date,
      note,
      lines: receiptDraft.map(x => ({ ...x }))
    };
    state.receipts.push(receipt);
    receipt.lines.forEach(line => {
      state.movements.push({
        id: uid(), date, type: 'Entrée réception', productId: line.productId,
        qty: Math.abs(Number(line.qty || 0)), fromZoneId: '', toZoneId: line.zoneId || getProduct(line.productId)?.storageZoneId || '',
        batch: line.batch, dlc: line.dlc, note: `Réception ${receipt.ref}`
      });
      const product = getProduct(line.productId);
      if (product) product.lastPrice = product.lastPrice || 0;
    });
    if (orderId) state.orders = state.orders.map(o => o.id === orderId ? { ...o, status: 'Reçue' } : o);
    receiptDraft = [];
    saveState(); render(); toast('Réception validée et stock mis à jour');
  },
  viewReceipt(id) {
    const r = state.receipts.find(x => x.id === id);
    if (!r) return;
    const lines = (r.lines || []).map(line => `
      <tr><td>${escapeHtml(getProduct(line.productId)?.name || '-')}</td><td>${number(line.qty)}</td><td>${escapeHtml(line.batch || '-')}</td><td>${escapeHtml(line.dlc || '-')}</td><td>${escapeHtml(getZone(line.zoneId)?.name || '-')}</td></tr>
    `).join('');
    openModal(`Réception ${r.ref}`, `
      <p><strong>Fournisseur :</strong> ${escapeHtml(getSupplier(r.supplierId)?.name || '-')}<br><strong>Date :</strong> ${escapeHtml(r.date)}<br><strong>Note :</strong> ${escapeHtml(r.note || '-')}</p>
      <div class="table-wrap"><table><thead><tr><th>Produit</th><th>Qté</th><th>Lot</th><th>DLC</th><th>Zone</th></tr></thead><tbody>${lines}</tbody></table></div>
      <div class="form-actions"><button type="button" id="modalCancel" class="secondary">Fermer</button></div>
    `, () => {});
  },
  openInventoryForecast() {
    inventorySubPage = 'forecast';
    inventoryFocusMode = false;
    render();
  },
  openInventoryEntry() {
    inventorySubPage = 'entry';
    inventoryFocusMode = false;
    render();
  },
  selectInventorySlot(date, type) {
    selectedInventorySlot = { date, type };
    inventoryFocusMode = true;
    render();
  },
  selectInventoryManual() {
    const date = document.querySelector('#inventoryDate')?.value || today();
    const type = document.querySelector('#inventoryType')?.value || 'general';
    selectedInventorySlot = { date, type };
    inventoryFocusMode = true;
    render();
  },
  exitInventoryFocus() {
    inventoryFocusMode = false;
    render();
  },
  moveInventoryProduct(id, direction) {
    const selected = selectedInventorySlot || nextPendingInventorySlot();
    const slot = inventorySlotKey(selected.date, selected.type);
    if (!slot) return toast('Choisis un jour d’inventaire valide');
    cacheCurrentInventoryDraft(selected.date, selected.type);
    const rows = productsForInventory(selected.type, selected.date);
    const index = rows.findIndex(p => p.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= rows.length) return;
    // Normalise l’ordre du planning sélectionné avant l’échange pour éviter les doublons.
    rows.forEach((product, i) => setProductInventoryOrder(product.id, slot, i + 1));
    const current = rows[index];
    const target = rows[targetIndex];
    setProductInventoryOrder(current.id, slot, targetIndex + 1);
    setProductInventoryOrder(target.id, slot, index + 1);
    saveState(); render();
  },
  resetInventoryOrder() {
    const selected = selectedInventorySlot || nextPendingInventorySlot();
    const slot = inventorySlotKey(selected.date, selected.type);
    if (!slot) return toast('Choisis un jour d’inventaire valide');
    if (!confirm('Rétablir l’ordre d’origine du bon de commande pour cet inventaire ?')) return;
    cacheCurrentInventoryDraft(selected.date, selected.type);
    state.products = state.products.map(product => {
      if (!productInventorySlots(product).includes(slot)) return product;
      const defaultOrder = defaultInventoryOrder(product.sku, slot);
      if (!defaultOrder) return product;
      return { ...product, inventoryOrders: { ...(product.inventoryOrders || {}), [slot]: defaultOrder } };
    });
    saveState(); render(); toast('Ordre du bon de commande rétabli');
  },
  saveInventorySession() {
    const date = document.querySelector('#inventoryDate')?.value || today();
    const type = document.querySelector('#inventoryType')?.value || 'general';
    const existing = getInventorySession(date, type);
    const sessionId = existing?.id || uid();
    state.movements = state.movements.filter(m => m.inventorySessionId !== sessionId);
    const lines = productsForInventory(type, date).map(product => {
      const input = document.querySelector(`[data-count="${product.id}"]`);
      const raw = input?.value;
      if (raw === undefined || raw === null || String(raw).trim() === '') return null;
      const countedQty = Number(raw || 0);
      const expectedQty = stockByProductExcludingSession(product.id, sessionId);
      const diff = countedQty - expectedQty;
      const note = document.querySelector(`[data-inventory-note="${product.id}"]`)?.value || '';
      return { productId: product.id, expectedQty, countedQty, diff, unit: product.unit || '', note: note.trim() };
    }).filter(Boolean);
    if (!lines.length) return toast('Saisis au moins une quantité comptée');
    const session = {
      id: sessionId,
      date,
      dayName: dayNames[parseDate(date).getDay()],
      type,
      status: 'Validé',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines
    };
    lines.forEach(line => {
      if (Math.abs(Number(line.diff || 0)) < 0.000001) return;
      const product = getProduct(line.productId);
      const zoneId = product?.storageZoneId || '';
      state.movements.push({
        id: uid(),
        date,
        type: `Ajustement inventaire ${inventoryTypeLabel(type)}`,
        productId: line.productId,
        qty: line.diff,
        fromZoneId: line.diff < 0 ? zoneId : '',
        toZoneId: line.diff > 0 ? zoneId : '',
        batch: '',
        dlc: '',
        note: `Inventaire ${inventoryTypeLabel(type)} du ${date}${line.note ? ' · ' + line.note : ''}`,
        inventorySessionId: sessionId
      });
    });
    if (existing) state.inventorySessions = state.inventorySessions.map(s => s.id === sessionId ? session : s);
    else state.inventorySessions.push(session);
    selectedInventorySlot = { date, type };
    delete inventoryDraftValues[inventoryDraftKey(date, type)];
    saveState(); render(); toast('Inventaire enregistré');
  },
  deleteInventorySession(id) {
    if (!confirm('Supprimer cet inventaire ? Les ajustements de stock liés seront également supprimés.')) return;
    state.inventorySessions = state.inventorySessions.filter(s => s.id !== id);
    state.movements = state.movements.filter(m => m.inventorySessionId !== id);
    saveState(); render(); toast('Inventaire supprimé');
  },
  removeLogo() {
    if (!confirm('Supprimer le logo personnalisé ?')) return;
    state.settings.logoDataUrl = '';
    state.settings.logoFileName = '';
    saveState();
    updateBrandLogo();
    render();
    toast('Logo supprimé');
  },
  saveSettings() {
    state.settings.companyName = document.querySelector('#settingCompany')?.value || '';
    state.settings.sequenceMode = document.querySelector('#settingSequence')?.value || 'FEFO';
    state.settings.hubReferenceDate = document.querySelector('#settingHubReference')?.value || defaultHubReferenceDate();
    state.settings.inventoryProjectionWeeks = Number(document.querySelector('#settingProjectionWeeks')?.value || 8);
    saveState(); render(); toast('Paramètres enregistrés');
  },
  syncFromCloud() { syncFromCloud(); },
  syncToCloud() { syncToCloudNow(); },
  exportJson() { downloadJson(); },
  exportCsv(_id, type) { downloadCsv(type || _id); }
};

function downloadJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `sauvegarde-stock-${today()}.json`);
}


function monthEndPdfTitle(month) {
  if (!month) return 'Inventaire fin de mois';
  const [year, monthNumber] = String(month).split('-').map(Number);
  const label = monthNames[(monthNumber || 1) - 1] || String(month);
  return `Inventaire fin de mois - ${label} ${year || ''}`.trim();
}

function monthEndCurrentRows(month) {
  const session = getMonthEndSession(month);
  const previousLines = new Map((session?.lines || []).map(line => [line.productId, line]));
  const draftForMonth = monthEndDraftValues[monthEndDraftKey(month)] || {};
  return state.products
    .filter(product => product.active !== false)
    .slice()
    .sort(monthEndProductSortWithDraft(draftForMonth))
    .map(product => {
      const old = previousLines.get(product.id) || {};
      const draftLine = draftForMonth[product.id] || {};
      const readValue = key => draftLine[key] !== undefined ? draftLine[key] : (old[key] ?? '');
      return {
        order: monthEndOrderValue(product, draftForMonth),
        sku: product.sku || '',
        name: product.name || '',
        category: productCategoryLabel(product),
        zone: getZone(product.storageZoneId)?.name || product.storageLabel || '',
        packageSize: product.packageSize || '',
        ue: readValue('ue'),
        su: readValue('su'),
        uu: readValue('uu'),
        note: readValue('note')
      };
    });
}

function printMonthEndPdf(title, rows, subtitle = '') {
  const printedAt = new Date().toLocaleString('fr-FR');
  const rowsHtml = rows.map(line => `
    <tr>
      <td>${escapeHtml(line.order ?? '')}</td>
      <td>${escapeHtml(line.sku || '')}</td>
      <td><strong>${escapeHtml(line.name || '')}</strong><br><span>${escapeHtml(line.packageSize || '')}</span></td>
      <td>${escapeHtml(line.category || '')}</td>
      <td>${escapeHtml(line.zone || '')}</td>
      <td>${escapeHtml(line.ue ?? '')}</td>
      <td>${escapeHtml(line.su ?? '')}</td>
      <td>${escapeHtml(line.uu ?? '')}</td>
      <td>${escapeHtml(line.note || '')}</td>
    </tr>
  `).join('') || '<tr><td colspan="9">Aucun produit à exporter.</td></tr>';
  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { font-size: 11px; color: #4b5563; text-align: right; }
    .subtitle { font-size: 12px; color: #4b5563; margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th, td { border: 1px solid #d1d5db; padding: 4px 5px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .03em; }
    td:nth-child(1), td:nth-child(6), td:nth-child(7), td:nth-child(8) { text-align: center; }
    td:nth-child(1) { width: 38px; }
    td:nth-child(2) { width: 70px; }
    td:nth-child(3) { width: 210px; }
    td:nth-child(6), td:nth-child(7), td:nth-child(8) { width: 46px; }
    span { color: #6b7280; }
    footer { margin-top: 8px; font-size: 10px; color: #6b7280; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">${escapeHtml(subtitle || 'Liste totale de fin de mois')}</p>
    </div>
    <div class="meta">
      <strong>${escapeHtml(state.settings.companyName || 'Gestion Stock')}</strong><br>
      Exporté le ${escapeHtml(printedAt)}<br>
      ${rows.length} ligne(s)
    </div>
  </header>
  <table>
    <thead><tr><th>N° tri</th><th>Réf.</th><th>Produit</th><th>Catégorie</th><th>Zone</th><th>U.E</th><th>S.U</th><th>U.U</th><th>Note</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <footer>Export PDF généré depuis la page Fin de mois.</footer>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('La fenêtre PDF a été bloquée par le navigateur. Autorise les pop-ups puis réessaie.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.map(csvEscape).join(';')].concat(rows.map(row => headers.map(h => csvEscape(row[h])).join(';'))).join('\n');
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function downloadCsv(type) {
  const datasets = buildCsvDatasets();
  if (type === 'all') {
    Object.entries(datasets).forEach(([name, rows]) => downloadBlob(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }), `${name}-${today()}.csv`));
    return;
  }
  const rows = datasets[type] || [];
  downloadBlob(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }), `${type || 'export'}-${today()}.csv`);
}

function buildCsvDatasets() {
  return {
    inventory: state.products.map(p => ({
      reference: p.sku, produit: p.name, zone_stockage: productCategoryLabel(p), conditionnement: p.packageSize || '', planning_inventaire: productInventorySlots(p).map(inventorySlotLabel).join(', '), ordres_inventaire: productInventorySlots(p).map(slot => `${inventorySlotLabel(slot)}=${productInventoryOrder(p, slot)}`).join(', '), unite: p.unit, stock: stockByProduct(p.id), stock_min: p.minStock, stock_max: p.maxStock,
      zone: getZone(p.storageZoneId)?.name || '', fournisseur: getSupplier(p.supplierId)?.name || '', prix_dernier_achat: p.lastPrice || 0, actif: p.active !== false ? 'oui' : 'non', archive_le: p.archivedAt || ''
    })),
    lowStock: state.products.filter(p => stockByProduct(p.id) <= Number(p.minStock || 0)).map(p => ({ produit: p.name, stock: stockByProduct(p.id), stock_min: p.minStock, zone: getZone(p.storageZoneId)?.name || '' })),
    orders: state.orders.map(o => ({ reference: o.ref, date: o.date, fournisseur: getSupplier(o.supplierId)?.name || '', date_prevue: o.expectedDate, statut: o.status, lignes: (o.lines || []).length })),
    scanned_orders: (state.scannedOrders || []).map(s => ({ date: s.date, jour: s.dayName, type: orderTypeLabel(s.type), pages: scanPageCount(s), fichiers: scanPages(s).map(p => p.fileName).join(' | '), numerise_le: s.scannedAt })),
    scanned_receipts: (state.scannedReceipts || []).map(s => ({ date: s.date, jour: s.dayName, type: receiptTypeLabel(s.type), document: receiptDocLabel(s.docType), pages: scanPageCount(s), fichiers: scanPages(s).map(p => p.fileName).join(' | '), numerise_le: s.scannedAt })),
    receipts: state.receipts.map(r => ({ reference: r.ref, date: r.date, fournisseur: getSupplier(r.supplierId)?.name || '', commande: state.orders.find(o => o.id === r.orderId)?.ref || '', lignes: (r.lines || []).length, note: r.note })),
    movements: state.movements.map(m => ({ date: m.date, type: m.type, produit: getProduct(m.productId)?.name || '', quantite: m.qty, depuis: getZone(m.fromZoneId)?.name || '', vers: getZone(m.toZoneId)?.name || '', lot: m.batch, dlc: m.dlc, note: m.note })),
    inventories: state.inventorySessions.flatMap(s => (s.lines || []).map(line => ({ date: s.date, jour: s.dayName, type: inventoryTypeLabel(s.type), reference: getProduct(line.productId)?.sku || '', produit: getProduct(line.productId)?.name || '', conditionnement: getProduct(line.productId)?.packageSize || '', stock_theorique: line.expectedQty, quantite_comptee: line.countedQty, ecart: line.diff, unite: line.unit, note: line.note }))),
    monthEnd: (state.monthEndSessions || []).flatMap(s => (s.lines || []).map(line => ({ mois: s.month, ordre_tri: line.order, reference: line.sku, produit: line.name, categorie: line.category, zone: line.zone, conditionnement: line.packageSize, ue: line.ue, su: line.su, uu: line.uu, note: line.note }))),
    zones: state.zones.map(z => ({ ordre: z.sequence, zone: z.name, type: z.type, temperature: z.temperature, consigne: z.description })),
    suppliers: state.suppliers.map(s => ({ fournisseur: s.name, contact: s.contact, email: s.email, telephone: s.phone, delai_jours: s.defaultDelay, note: s.note }))
  };
}

function seedData() {
  const supplier = { id: 'supplier-lyon-chaponnay', name: 'Lyon - Chaponnay', contact: 'Service client', email: '', phone: '08.25.00.80.72', defaultDelay: 2, note: 'Catalogue initial importé depuis les bons de commande fournis.' };
  state = ensureInventoryCatalog(defaultState());
  state.settings.companyName = 'LA FOUILLOUSE';
  state.suppliers = [supplier];
  state.products = state.products.map(p => ({ ...p, supplierId: supplier.id }));
  orderDraft = [];
  receiptDraft = [];
  saveState(); render(); toast('Catalogue inventaire La Fouillouse chargé');
}

function resetData() {
  if (!confirm('Tout réinitialiser ? Cette action efface les données locales.')) return;
  state = ensureInventoryCatalog(defaultState());
  orderDraft = [];
  receiptDraft = [];
  saveState(); render(); toast('Application réinitialisée');
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state = normalizeState({ ...defaultState(), ...data, settings: { ...defaultState().settings, ...(data.settings || {}) }, scannedOrders: data.scannedOrders || [], scannedReceipts: data.scannedReceipts || [], inventorySessions: data.inventorySessions || [], monthEndSessions: data.monthEndSessions || [], products: (data.products || []).map(migrateProduct) });
      saveState(); render(); toast('Sauvegarde importée');
    } catch (error) {
      toast('Fichier de sauvegarde invalide');
    }
  };
  reader.readAsText(file);
}

document.querySelector('#modalClose').addEventListener('click', closeModal);
document.querySelector('#modal').addEventListener('click', event => { if (event.target.id === 'modal') closeModal(); });
document.querySelector('#modal').addEventListener('click', event => {
  const actionEl = event.target.closest?.('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  const id = actionEl.dataset.id;
  const type = actionEl.dataset.type;
  const doc = actionEl.dataset.doc;
  actions[action]?.(id, type, doc);
});
document.addEventListener('click', event => { if (event.target.id === 'modalCancel') closeModal(); });
document.querySelector('#btnExportJson').addEventListener('click', downloadJson);
document.querySelector('#importJson').addEventListener('change', event => { if (event.target.files[0]) importJson(event.target.files[0]); });
document.querySelector('#btnSeed')?.addEventListener('click', seedData);
document.querySelector('#btnReset')?.addEventListener('click', resetData);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
}

async function initializeApp() {
  renderNav();
  setPage('dashboard');
  if (initSupabaseClient()) {
    const cloudData = await loadCloudState();
    if (cloudData) {
      isApplyingCloudState = true;
      state = normalizeState(cloudData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      isApplyingCloudState = false;
      renderNav();
      setPage(currentPage || 'dashboard');
      toast('Données chargées depuis Supabase');
    } else {
      await saveCloudState();
      toast('Cloud Supabase initialisé');
    }
  } else {
    toast('Mode local : Supabase non configuré');
  }
}

initializeApp();
