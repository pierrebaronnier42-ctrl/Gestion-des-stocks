/* Gestion Stock Web - version locale prête à héberger */
const STORAGE_KEY = 'gestion-stock-web-v1';
const BACKUP_STORAGE_KEY = 'gestion-stock-web-v1-backups';
const BACKUP_MAX_COUNT = 12;
const APP_VERSION = '1.48.0-backup-restore';
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

const PRODUCT_CATEGORY_OPTIONS = [
  { id: 'hub', label: 'HUB' },
  { id: 'negative', label: 'Négatif' },
  { id: 'positive', label: 'Positif' },
  { id: 'dry', label: 'Sec' }
];
const PRODUCT_CATEGORY_LABELS = PRODUCT_CATEGORY_OPTIONS.map(option => option.label);

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

function startOfWeekDate(value = today()) {
  const date = parseDate(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

function startOfWeekInput(value = today()) {
  return formatDateInput(startOfWeekDate(value));
}

function weekDeliveryDates(weekStart = selectedReportWeek) {
  const monday = startOfWeekDate(weekStart || today());
  return [0, 2, 4].map(offset => formatDateInput(addDays(monday, offset)));
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

function inventoryDeliveryTimingLabel(value) {
  if (value === 'before') return 'Inventaire AVANT livraison';
  if (value === 'after') return 'Inventaire APRÈS livraison';
  return 'Non précisé';
}

const defaultState = () => ({
  version: APP_VERSION,
  products: [],
  suppliers: [],
  zones: [],
  orders: [],
  scannedOrders: [],
  scannedReceipts: [],
  orderModificationRates: {},
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
let productSortMode = 'sequence';
let inventoryDraftValues = {};
let selectedMonthEndMonth = today().slice(0, 7);
let selectedReportWeek = startOfWeekInput(today());
let monthEndDraftValues = {};
let supabaseClient = null;
let activeMultiPhotoScanner = null;
let inventoryPhotoOcrDraft = { status: 'idle', progress: 0, message: '', pages: [], text: '', matched: 0, unknown: 0 };
let inventoryPdfImportDraft = { status: 'idle', slot: '', fileName: '', lines: [], exact: [], replacements: [], newItems: [], missing: [], message: '' };
let pendingInventoryScrollTarget = null;
let cloudReady = false;
let cloudSaveTimer = null;
let isApplyingCloudState = false;
let lastCloudSaveAt = '';
let reportDocumentUrlCache = new Map();

const pages = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'inventory', label: 'Inventaire', icon: '📦' },
  { id: 'receipts', label: 'Réception', icon: '🚚' },
  { id: 'orders', label: 'Commande', icon: '🧾' },
  { id: 'monthEnd', label: 'Fin de Mois', icon: '📋' },
  { id: 'reports', label: 'Rapports', icon: '📑' },
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
    orderModificationRates: parsed.orderModificationRates || {},
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


function normalizeTextForCategory(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function categoryFromText(text = '') {
  if (text.includes('hub')) return 'HUB';
  if (text.includes('negatif') || text.includes('negative') || text.includes('surgel') || text.includes('congel')) return 'Négatif';
  if (text.includes('positif') || text.includes('positive') || text.includes('frais') || text.includes('ultra') || text.includes('salade')) return 'Positif';
  if (text.includes('sec') || text.includes('ambiant') || text.includes('reserve')) return 'Sec';
  return '';
}

function fixedProductCategory(value = '', product = {}) {
  const explicitText = normalizeTextForCategory(value);
  const exact = PRODUCT_CATEGORY_LABELS.find(label => normalizeTextForCategory(label) === explicitText);
  if (exact) return exact;
  const explicitGuess = categoryFromText(explicitText);
  if (explicitGuess) return explicitGuess;
  const fallbackText = normalizeTextForCategory([product.category, product.storageLabel, product.storageZoneId, product.name].filter(Boolean).join(' '));
  return categoryFromText(fallbackText) || 'Sec';
}

function productCategorySelectOptions(selected = '') {
  const normalized = fixedProductCategory(selected);
  return PRODUCT_CATEGORY_OPTIONS.map(option => `<option value="${escapeHtml(option.label)}" ${option.label === normalized ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('');
}

function productInlineZoneOptions(selected = '') {
  return ['<option value="">Aucune</option>'].concat(
    state.zones.map(zone => `<option value="${escapeHtml(zone.id)}" ${selected === zone.id ? 'selected' : ''}>${escapeHtml(zone.code || '')} · ${escapeHtml(zone.name)}</option>`)
  ).join('');
}

function migrateProduct(product) {
  const base = { ...product };
  if (!Array.isArray(base.inventorySlots)) base.inventorySlots = [];
  if (!base.inventoryOrders || typeof base.inventoryOrders !== 'object' || Array.isArray(base.inventoryOrders)) base.inventoryOrders = {};
  if (base.monthEndOrder === undefined || base.monthEndOrder === null) base.monthEndOrder = '';
  if (base.sequence === undefined || base.sequence === null || base.sequence === '') {
    const legacyOrder = Number(base.monthEndOrder || 0);
    base.sequence = legacyOrder >= 1000 ? legacyOrder : '';
  }

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
  migrated.category = fixedProductCategory(migrated.category || migrated.storageLabel, migrated);
  return migrated;
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
  return { ...product, category: fixedProductCategory(product.category || product.storageLabel, product) };
}

function productCategoryLabel(product = {}) {
  return fixedProductCategory(product.category || product.storageLabel, product);
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
  const manual = productSequenceValue(product);
  if (manual > 0) return manual;
  return displayProductSequence(product);
}

function monthEndProductSort(a, b) {
  return monthEndProductOrder(a) - monthEndProductOrder(b)
    || String(productCategoryLabel(a) || '').localeCompare(String(productCategoryLabel(b) || ''), 'fr', { sensitivity: 'base' })
    || String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
}

function getMonthEndSession(month) {
  return (state.monthEndSessions || []).find(session => session.month === month);
}

function currentMonthKey() {
  return today().slice(0, 7);
}

function archivedProductKeptForMonthEnd(product = {}, month = currentMonthKey()) {
  return product.active === false && String(product.monthEndKeepMonth || '') === String(month || '');
}

function productsForMonthEnd(month = currentMonthKey()) {
  return state.products.filter(product => product.active !== false || archivedProductKeptForMonthEnd(product, month));
}

function monthEndKeepLabel(product = {}) {
  return archivedProductKeptForMonthEnd(product, currentMonthKey()) ? `Conservé fin de mois ${product.monthEndKeepMonth}` : '';
}

function monthEndDraftKey(month) {
  return month || selectedMonthEndMonth || today().slice(0, 7);
}

function monthEndOrderValue(product = {}, draftForMonth = {}) {
  const draftOrder = draftForMonth[product.id]?.order;
  const raw = draftOrder !== undefined ? draftOrder : productSequenceValue(product);
  const manual = Number(raw || 0);
  if (manual > 0) return manual;
  return displayProductSequence(product);
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
  productsForMonthEnd(month).forEach(product => {
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
      existing.category = fixedProductCategory(existing.category || item.storageLabel, existing);
      existing.inventoryOrders = { ...(item.inventoryOrders || {}), ...(existing.inventoryOrders || {}) };
      if (!Number(existing.monthEndOrder || 0)) existing.monthEndOrder = index + 1;
      if (existing.active === undefined) existing.active = true;
    } else {
      targetState.products.push({
        id: stableProductId(item.sku),
        sku: item.sku,
        name: item.name,
        category: fixedProductCategory(item.storageLabel, item),
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
  ensureProductSequences(targetState);
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


function loadBackups() {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && item.id && item.snapshot) : [];
  } catch (error) {
    console.warn('Lecture des backups impossible.', error);
    return [];
  }
}

function pruneBackups(backups = []) {
  return backups
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, BACKUP_MAX_COUNT);
}

function backupSnapshot(sourceState = state, light = false) {
  const snapshot = light ? stateWithoutHeavyScanData(sourceState) : JSON.parse(JSON.stringify(sourceState));
  snapshot.version = APP_VERSION;
  return snapshot;
}

function backupStats(snapshot = {}) {
  return {
    products: (snapshot.products || []).length,
    inventories: (snapshot.inventorySessions || []).length,
    monthEnd: (snapshot.monthEndSessions || []).length,
    orders: (snapshot.scannedOrders || []).length,
    receipts: (snapshot.scannedReceipts || []).length
  };
}

function createBackup(label = 'Sauvegarde manuelle', options = {}) {
  const createdAt = new Date().toISOString();
  const buildBackup = light => {
    const snapshot = backupSnapshot(state, light);
    return {
      id: uid(),
      createdAt,
      label,
      appVersion: APP_VERSION,
      light: Boolean(light),
      stats: backupStats(snapshot),
      snapshot
    };
  };
  const writeList = (backup, keepCount = BACKUP_MAX_COUNT) => {
    const backups = pruneBackups([backup, ...loadBackups()]).slice(0, keepCount);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups));
  };
  try {
    const backup = buildBackup(false);
    writeList(backup, BACKUP_MAX_COUNT);
    if (!options.silent) toast('Point de restauration créé');
    return backup;
  } catch (error) {
    console.warn('Backup complet impossible, tentative backup allégé.', error);
    const backup = buildBackup(true);
    for (const keepCount of [BACKUP_MAX_COUNT, 8, 4, 1]) {
      try {
        writeList(backup, keepCount);
        if (!options.silent) toast('Backup allégé créé : les images/PDF lourds ne sont pas inclus');
        return backup;
      } catch (fallbackError) {
        console.warn(`Tentative backup allégé impossible avec ${keepCount} élément(s).`, fallbackError);
      }
    }
    try {
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify([backup]));
      if (!options.silent) toast('Backup allégé créé');
      return backup;
    } catch (lastError) {
      console.warn('Création backup impossible.', lastError);
      if (!options.silent) toast('Impossible de créer le backup : stockage de l’appareil saturé');
      return null;
    }
  }
}

function ensureDailyAutoBackup() {
  const todayKey = today();
  const backups = loadBackups();
  const exists = backups.some(backup => String(backup.createdAt || '').slice(0, 10) === todayKey && String(backup.label || '').includes('Automatique'));
  if (!exists) createBackup(`Automatique du ${formatDateFr(todayKey)}`, { silent: true });
}

function backupRowsHtml() {
  const backups = loadBackups();
  if (!backups.length) return `<tr><td colspan="6" class="empty">Aucun point de restauration enregistré sur cet appareil.</td></tr>`;
  return backups.map(backup => {
    const stats = backup.stats || backupStats(backup.snapshot || {});
    const dateLabel = backup.createdAt ? new Date(backup.createdAt).toLocaleString('fr-FR') : '-';
    const detail = `${stats.products || 0} produits · ${stats.inventories || 0} inventaires · ${stats.orders || 0} BC · ${stats.receipts || 0} BL`;
    return `
      <tr>
        <td><strong>${escapeHtml(dateLabel)}</strong><br><span class="muted">${escapeHtml(backup.appVersion || '')}</span></td>
        <td>${escapeHtml(backup.label || 'Sauvegarde')}</td>
        <td>${escapeHtml(detail)}</td>
        <td>${backup.light ? '<span class="badge warning">Allégé</span>' : '<span class="badge success">Complet</span>'}</td>
        <td class="actions">
          <button class="small success" data-action="restoreBackup" data-id="${escapeHtml(backup.id)}">Restaurer</button>
          <button class="small secondary" data-action="downloadBackup" data-id="${escapeHtml(backup.id)}">Télécharger</button>
          <button class="small danger-soft" data-action="deleteBackup" data-id="${escapeHtml(backup.id)}">Supprimer</button>
        </td>
      </tr>
    `;
  }).join('');
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
  createBackup('Avant chargement Supabase', { silent: true });
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
      <span>${page.label}</span>
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
    reports: renderReports,
    settings: renderSettings
  };
  app.innerHTML = map[currentPage]();
  updateBrandLogo();
  document.body.classList.toggle('inventory-focus', currentPage === 'inventory' && inventoryFocusMode);
  bindPageEvents();
  restoreInventoryScrollTarget();
}

function cssEscapeValue(value) {
  const stringValue = String(value ?? '');
  if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(stringValue);
  return stringValue.replace(/[\\"']/g, '\\$&');
}

function restoreInventoryScrollTarget() {
  if (!pendingInventoryScrollTarget || currentPage !== 'inventory') return;
  const target = pendingInventoryScrollTarget;
  pendingInventoryScrollTarget = null;

  const restore = () => {
    const row = document.querySelector(`[data-inventory-row="${cssEscapeValue(target.productId)}"]`);
    if (!row) return;

    const tableWrap = row.closest('.table-wrap');
    if (tableWrap && Number.isFinite(target.tableScrollTop)) {
      tableWrap.scrollTop = target.tableScrollTop;
      tableWrap.scrollLeft = target.tableScrollLeft || 0;
    }

    if (Number.isFinite(target.viewportTop)) {
      const nextTop = row.getBoundingClientRect().top;
      const delta = nextTop - target.viewportTop;
      const scroller = document.scrollingElement || document.documentElement;
      scroller.scrollTop += delta;
    } else if (Number.isFinite(target.windowScrollY)) {
      window.scrollTo(target.windowScrollX || 0, target.windowScrollY);
    }

    row.classList.add('row-flash');
    const button = row.querySelector(`[data-action="moveInventoryProduct"][data-type="${target.direction}"]`) || row.querySelector('[data-action="moveInventoryProduct"]');
    if (button && !button.disabled) button.focus({ preventScroll: true });
    setTimeout(() => row.classList.remove('row-flash'), 900);
  };

  requestAnimationFrame(() => requestAnimationFrame(restore));
}

function captureInventoryScrollTarget(productId, direction) {
  const row = document.querySelector(`[data-inventory-row="${cssEscapeValue(productId)}"]`);
  const tableWrap = row?.closest('.table-wrap');
  return {
    productId,
    direction,
    viewportTop: row ? row.getBoundingClientRect().top : null,
    windowScrollY: window.scrollY,
    windowScrollX: window.scrollX,
    tableScrollTop: tableWrap ? tableWrap.scrollTop : null,
    tableScrollLeft: tableWrap ? tableWrap.scrollLeft : null
  };
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

  const monthEndInput = document.querySelector('[data-month-end-month]');
  if (monthEndInput) {
    monthEndInput.addEventListener('change', event => {
      selectedMonthEndMonth = event.target.value || currentMonthKey();
      render();
    });
  }

  const reportWeekInput = document.querySelector('[data-report-week]');
  if (reportWeekInput) {
    reportWeekInput.addEventListener('change', event => {
      selectedReportWeek = startOfWeekInput(event.target.value || today());
      render();
    });
  }

  document.querySelectorAll('[data-order-modification-rate]').forEach(input => {
    const saveRate = event => {
      setOrderModificationRate(event.currentTarget.dataset.date, event.currentTarget.dataset.type, event.currentTarget.value);
      saveState();
    };
    input.addEventListener('change', saveRate);
    input.addEventListener('blur', saveRate);
  });

  document.querySelectorAll('[data-product-inline-field]').forEach(input => {
    const markDirty = event => {
      const row = event.currentTarget.closest('tr');
      if (!row) return;
      row.classList.add('inline-dirty-row');
      const saveButton = row.querySelector('[data-product-inline-save]');
      if (saveButton) saveButton.classList.remove('hidden-inline');
    };
    input.addEventListener('input', markDirty);
    input.addEventListener('change', markDirty);
  });

  const inventoryCountInputs = Array.from(document.querySelectorAll('[data-count]'));
  let lastInventoryCountFocus = null;
  function focusNextInventoryCount(index) {
    const nextInput = inventoryCountInputs[index + 1];
    if (nextInput) {
      nextInput.focus({ preventScroll: true });
      if (typeof nextInput.select === 'function') nextInput.select();
    } else {
      const saveButton = document.querySelector('[data-action="saveInventorySession"]');
      if (saveButton) saveButton.focus({ preventScroll: true });
    }
  }
  inventoryCountInputs.forEach((input, index) => {
    input.setAttribute('enterkeyhint', index === inventoryCountInputs.length - 1 ? 'done' : 'next');
    input.addEventListener('focus', () => {
      lastInventoryCountFocus = { index, at: Date.now() };
    });
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== 'NumpadEnter' && event.key !== 'Tab') return;
      event.preventDefault();
      focusNextInventoryCount(index);
    });
  });
  document.querySelectorAll('[data-inventory-note]').forEach(noteInput => {
    noteInput.setAttribute('tabindex', '-1');
    noteInput.addEventListener('focus', () => {
      if (!lastInventoryCountFocus || Date.now() - lastInventoryCountFocus.at > 800) return;
      // Sur tablette, la touche « Suivant » peut utiliser l'ordre naturel du tableau
      // et aller sur la note. On force alors le passage à la quantité suivante.
      focusNextInventoryCount(lastInventoryCountFocus.index);
    });
  });
  document.querySelectorAll('.order-actions button').forEach(button => {
    button.setAttribute('tabindex', '-1');
  });

  document.querySelectorAll('[data-inventory-delivery]').forEach(checkbox => {
    checkbox.addEventListener('change', event => {
      if (!event.target.checked) return;
      document.querySelectorAll('[data-inventory-delivery]').forEach(other => {
        if (other !== event.target) other.checked = false;
      });
    });
  });

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
  const orderImportInput = document.querySelector('#orderImportInput');
  if (orderImportInput) {
    orderImportInput.addEventListener('change', event => {
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
  const receiptImportInput = document.querySelector('#receiptImportInput');
  if (receiptImportInput) {
    receiptImportInput.addEventListener('change', event => {
      const files = Array.from(event.target.files || []);
      const target = pendingReceiptScan;
      pendingReceiptScan = null;
      event.target.value = '';
      if (!files.length || !target) return;
      saveScannedReceiptFiles(target.date, target.type, target.docType, files);
    });
  }
  const inventoryOcrInput = document.querySelector('#inventoryOcrInput');
  if (inventoryOcrInput) {
    inventoryOcrInput.addEventListener('change', event => {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length) processInventoryOcrFiles(files);
    });
  }
  const inventoryPdfInput = document.querySelector('#inventoryPdfInput');
  if (inventoryPdfInput) {
    inventoryPdfInput.addEventListener('change', event => {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length) processInventoryPdfFiles(files);
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


function zoneSequenceBase(zoneId = '') {
  const zone = getZone(zoneId) || state.zones.find(z => z.id === zoneId) || null;
  const codeMatch = String(zone?.code || '').match(/(\d{3,5})/);
  if (codeMatch) return Number(codeMatch[1]);
  const sequence = Number(zone?.sequence || 0);
  if (sequence > 0) return sequence * 1000;
  return 9000;
}

function productSequenceValue(product = {}) {
  const direct = Number(product.sequence || 0);
  if (direct > 0) return direct;
  const legacy = Number(product.monthEndOrder || 0);
  if (legacy >= 1000) return legacy;
  return 0;
}

function displayProductSequence(product = {}) {
  const direct = productSequenceValue(product);
  return direct > 0 ? direct : nextSequenceForZone(product.storageZoneId, product.id);
}

function nextSequenceForZone(zoneId = '', excludeProductId = '') {
  const base = zoneSequenceBase(zoneId);
  const used = new Set(state.products
    .filter(product => product.id !== excludeProductId)
    .map(productSequenceValue)
    .filter(value => value > 0));
  let next = base + 1;
  while (used.has(next)) next += 1;
  return next;
}

function ensureProductSequences(targetState = state) {
  const groups = new Map();
  (targetState.products || []).forEach(product => {
    const value = Number(product.sequence || 0);
    if (value > 0) return;
    const legacy = Number(product.monthEndOrder || 0);
    if (legacy >= 1000) {
      product.sequence = legacy;
      return;
    }
    const zoneId = product.storageZoneId || '';
    if (!groups.has(zoneId)) groups.set(zoneId, []);
    groups.get(zoneId).push(product);
  });
  const zonesForState = targetState.zones || [];
  const findZone = zoneId => zonesForState.find(zone => zone.id === zoneId);
  const baseForZone = zoneId => {
    const zone = findZone(zoneId);
    const codeMatch = String(zone?.code || '').match(/(\d{3,5})/);
    if (codeMatch) return Number(codeMatch[1]);
    const sequence = Number(zone?.sequence || 0);
    if (sequence > 0) return sequence * 1000;
    return 9000;
  };
  const used = new Set((targetState.products || []).map(productSequenceValue).filter(value => value > 0));
  groups.forEach((products, zoneId) => {
    let next = baseForZone(zoneId) + 1;
    products
      .sort((a, b) => Number(a.monthEndOrder || defaultMonthEndOrder(a.sku) || 999999) - Number(b.monthEndOrder || defaultMonthEndOrder(b.sku) || 999999)
        || String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' }))
      .forEach(product => {
        while (used.has(next)) next += 1;
        product.sequence = next;
        if (!Number(product.monthEndOrder || 0) || Number(product.monthEndOrder || 0) < 1000) product.monthEndOrder = next;
        used.add(next);
        next += 1;
      });
  });
}

function getProductSequenceDuplicates(products = state.products.filter(product => product.active !== false), valuesById = {}) {
  const groups = new Map();
  products.forEach(product => {
    const raw = valuesById[product.id] !== undefined ? valuesById[product.id] : productSequenceValue(product);
    const sequence = Number(raw || 0);
    if (!Number.isFinite(sequence) || sequence <= 0) return;
    const key = String(sequence);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });
  return Array.from(groups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([sequence, items]) => ({ sequence, items }));
}

function productSequenceDuplicateMap(products = state.products.filter(product => product.active !== false), valuesById = {}) {
  const map = new Map();
  getProductSequenceDuplicates(products, valuesById).forEach(group => {
    group.items.forEach(product => map.set(product.id, group.sequence));
  });
  return map;
}

function duplicateProductSequenceMessage(duplicates = []) {
  if (!duplicates.length) return '';
  return duplicates.map(group => {
    const names = group.items.slice(0, 4).map(product => product.name || product.sku || 'Produit').join(', ');
    const extra = group.items.length > 4 ? `, +${group.items.length - 4} autre(s)` : '';
    return `Séquence ${group.sequence} : ${names}${extra}`;
  }).join('\n');
}

function syncProductSequenceToMonthEndDrafts(productId, sequence) {
  Object.values(monthEndDraftValues || {}).forEach(draft => {
    if (draft && draft[productId]) draft[productId].order = sequence;
  });
}

function wouldDuplicateProductSequence(productId, sequence) {
  const product = getProduct(productId);
  const activeProducts = state.products.filter(item => item.active !== false || item.id === productId);
  const values = { [productId]: sequence };
  return getProductSequenceDuplicates(activeProducts, values).filter(group => group.items.some(item => item.id === productId));
}

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


function inventorySlotDefinition(slot) {
  return INVENTORY_SLOT_DEFINITIONS.find(def => def.id === slot) || INVENTORY_SLOT_DEFINITIONS[0];
}

function inventorySlotSelectOptions(selectedSlot) {
  return INVENTORY_SLOT_DEFINITIONS.map(def => `<option value="${escapeHtml(def.id)}" ${def.id === selectedSlot ? 'selected' : ''}>${escapeHtml(def.label)}</option>`).join('');
}

function dateForInventorySlot(slot) {
  const def = inventorySlotDefinition(slot);
  const start = parseDate(today());
  const wantedDay = def.day === 'monday' ? 1 : def.day === 'wednesday' ? 3 : 5;
  for (let i = 0; i < 28; i++) {
    const d = addDays(start, i);
    if (d.getDay() !== wantedDay) continue;
    const value = formatDateInput(d);
    if (def.type === 'hub' && !isHubWeek(value)) continue;
    return value;
  }
  return today();
}

function productsForInventorySlot(slot, includeInactive = false) {
  const def = inventorySlotDefinition(slot);
  return state.products
    .filter(p => includeInactive || p.active !== false)
    .filter(p => productInventorySlots(p).includes(slot))
    .sort((a, b) => {
      const oa = productInventoryOrder(a, slot);
      const ob = productInventoryOrder(b, slot);
      if (oa !== ob) return oa - ob;
      return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
    });
}

function availableProductsForInventorySlot(slot) {
  return state.products
    .filter(p => p.active !== false)
    .filter(p => !productInventorySlots(p).includes(slot))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' }));
}

function inventorySlotDuplicateOrders(slot) {
  const groups = new Map();
  productsForInventorySlot(slot).forEach(product => {
    const order = Number(product.inventoryOrders?.[slot] || 0);
    if (!order) return;
    const key = String(order);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });
  return [...groups.entries()].filter(([, items]) => items.length > 1);
}

function parseInventoryImportLines(rawText) {
  return String(rawText || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const normalizedLine = line.replace(/\s+/g, ' ');
      const skuMatch = normalizedLine.match(/(\d{5}\.\d{3})/);
      const zoneMatch = normalizedLine.match(/^(Négatif|Negatif|Positif|Sec)\s+/i);
      let sku = skuMatch ? skuMatch[1] : '';
      let name = normalizedLine;
      if (sku) {
        name = normalizedLine.slice(normalizedLine.indexOf(sku) + sku.length).trim();
        name = name.replace(/^[-–—:;\s]+/, '');
        // Supprime les colonnes numériques typiques des bons de commande pour garder une désignation lisible.
        name = name.replace(/\s+\d+[\d\s,.]*\s+(CT|PN|PC|SA)\b.*$/i, match => {
          const pkg = match.trim().split(/\s+/).slice(0, 2).join(' ');
          return ' ' + pkg;
        }).trim();
      }
      if (zoneMatch && name.toLowerCase().startsWith(zoneMatch[1].toLowerCase())) {
        name = name.slice(zoneMatch[0].length).trim();
      }
      return {
        raw: normalizedLine,
        sku,
        name: name || normalizedLine,
        zoneLabel: zoneMatch ? zoneMatch[1].replace('Negatif', 'Négatif') : '',
        order: index + 1
      };
    });
}

function zoneIdFromImportLabel(label) {
  const value = String(label || '').toLowerCase();
  if (value.includes('négatif') || value.includes('negatif')) return state.zones.find(z => String(z.name || '').toLowerCase().includes('négative') || String(z.name || '').toLowerCase().includes('négatif') || z.id === 'zone-negatif')?.id || '';
  if (value.includes('positif')) return state.zones.find(z => String(z.name || '').toLowerCase().includes('positive') || String(z.name || '').toLowerCase().includes('positif') || z.id === 'zone-positif')?.id || '';
  if (value.includes('sec')) return state.zones.find(z => String(z.name || '').toLowerCase().includes('sec') || z.id === 'zone-sec')?.id || '';
  return '';
}

function findProductForImportedLine(line) {
  if (line.sku) {
    const bySku = state.products.find(p => String(p.sku || '').trim() === line.sku);
    if (bySku) return bySku;
  }
  const cleanName = String(line.name || '').toLowerCase().trim();
  if (!cleanName) return null;
  return state.products.find(p => String(p.name || '').toLowerCase().trim() === cleanName) || null;
}

function ensureProductInInventorySlot(product, slot, order) {
  if (!product) return;
  const slots = new Set(productInventorySlots(product));
  slots.add(slot);
  product.inventorySlots = [...slots];
  product.inventoryOrders = { ...(product.inventoryOrders || {}), [slot]: order };
  if (slot.includes('hub')) product.category = 'hub';
  if (product.active === false) product.active = true;
}

function createProductFromImportedLine(line, slot, order) {
  const def = inventorySlotDefinition(slot);
  const zoneId = zoneIdFromImportLabel(line.zoneLabel);
  const sequence = nextSequenceForZone(zoneId);
  const product = migrateProduct({
    id: uid(),
    sku: line.sku || '',
    name: line.name || line.raw || 'Nouveau produit',
    category: fixedProductCategory(def.type === 'hub' ? 'HUB' : (zoneId ? getZone(zoneId)?.name : item.zoneLabel) || 'Sec'),
    unit: 'colis',
    packageSize: '',
    minStock: 0,
    lastPrice: 0,
    supplierId: '',
    storageZoneId: zoneId,
    sequence,
    monthEndOrder: sequence,
    inventorySlots: [slot],
    inventoryOrders: { [slot]: order },
    active: true,
    createdAt: today()
  });
  state.products.push(product);
  return product;
}

function applyImportedInventoryText(slot, mode, rawText, sourceLabel = 'texte') {
  const raw = String(rawText || '');
  const lines = parseInventoryImportLines(raw);
  if (!lines.length) return toast('Ajoute au moins une référence produit');
  if (mode === 'replace' && !confirm(`Remplacer complètement la liste de ce jour/type par les données détectées depuis ${sourceLabel} ?`)) return;
  cacheCurrentInventoryDraft(selectedInventorySlot?.date || today(), selectedInventorySlot?.type || 'general');
  if (mode === 'replace') {
    state.products.forEach(product => {
      if (!productInventorySlots(product).includes(slot)) return;
      product.inventorySlots = productInventorySlots(product).filter(item => item !== slot);
      if (product.inventoryOrders) delete product.inventoryOrders[slot];
    });
  }
  let created = 0;
  let added = 0;
  const startOrder = mode === 'append' ? productsForInventorySlot(slot).length : 0;
  lines.forEach((line, index) => {
    const order = startOrder + index + 1;
    let product = findProductForImportedLine(line);
    if (!product) {
      product = createProductFromImportedLine(line, slot, order);
      created++;
    } else {
      ensureProductInInventorySlot(product, slot, order);
      added++;
    }
  });
  selectedInventorySlot = { date: dateForInventorySlot(slot), type: inventorySlotDefinition(slot).type };
  saveState();
  render();
  toast(`${mode === 'replace' ? 'Liste remplacée' : 'Produits ajoutés'} · ${lines.length} ligne(s), ${created} création(s)`);
}

function applyImportedInventoryList(slot, mode) {
  const raw = document.querySelector('#inventoryImportText')?.value || '';
  applyImportedInventoryText(slot, mode, raw, 'copier-coller');
}

function inventoryOcrSkuFromCandidate(value) {
  const normalized = String(value || '')
    .toUpperCase()
    .replace(/[OQD]/g, '0')
    .replace(/[IL|]/g, '1')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/[^0-9]/g, '');
  if (normalized.length !== 8) return '';
  return `${normalized.slice(0, 5)}.${normalized.slice(5)}`;
}

function inventoryOcrLinesFromText(rawText) {
  const knownSkus = new Set(state.products.map(product => String(product.sku || '').trim()).filter(Boolean));
  const seen = new Set();
  const results = [];
  const rawLines = String(rawText || '').split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  rawLines.forEach(rawLine => {
    const candidates = [];
    const separated = rawLine.match(/[0-9OQDIL|SB]{5}\s*[.,;:]\s*[0-9OQDIL|SB]{3}/gi) || [];
    candidates.push(...separated);
    const compact = rawLine.match(/\b[0-9OQDIL|SB]{8}\b/gi) || [];
    candidates.push(...compact);
    let sku = '';
    for (const candidate of candidates) {
      const normalized = inventoryOcrSkuFromCandidate(candidate);
      if (normalized && (knownSkus.has(normalized) || !sku)) sku = normalized;
      if (knownSkus.has(normalized)) break;
    }
    if (!sku || seen.has(sku)) return;
    seen.add(sku);
    const product = state.products.find(item => String(item.sku || '').trim() === sku);
    let name = product?.name || rawLine;
    const skuIndex = rawLine.toUpperCase().indexOf(String(candidates[0] || '').toUpperCase());
    if (!product && skuIndex >= 0) {
      name = rawLine.slice(skuIndex + String(candidates[0]).length).replace(/^[-–—:;\s]+/, '').trim() || rawLine;
    }
    results.push({ sku, name, raw: rawLine, matched: Boolean(product) });
  });
  return results;
}

function extractPackageFromImportedName(namePart) {
  const tokens = String(namePart || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const unitRe = /^(CT|PN|PC|SA|KG|G|L|ML|BT|BQ|SEAU|S\.|U)$/i;
  let packageIndex = -1;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (/^\d[\d\s,.\/Xx-]*$/.test(tokens[i]) && unitRe.test(tokens[i + 1])) packageIndex = i;
  }
  if (packageIndex < 0) return { name: String(namePart || '').trim(), packageSize: '' };
  return {
    name: tokens.slice(0, packageIndex).join(' ').trim() || String(namePart || '').trim(),
    packageSize: tokens.slice(packageIndex, Math.min(tokens.length, packageIndex + 2)).join(' ').trim()
  };
}

function normalizeInventoryMatchName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(v2|nf|c|nv|new|oil)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inventoryNameSimilarity(a, b) {
  const aw = new Set(normalizeInventoryMatchName(a).split(' ').filter(word => word.length > 1));
  const bw = new Set(normalizeInventoryMatchName(b).split(' ').filter(word => word.length > 1));
  if (!aw.size || !bw.size) return 0;
  let hit = 0;
  aw.forEach(word => { if (bw.has(word)) hit += 1; });
  return hit / Math.max(aw.size, bw.size);
}

function enhanceImportedInventoryLines(rawText) {
  const seen = new Set();
  return String(rawText || '')
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((line, index) => {
      const skuMatch = line.match(/(\d{5}\s*[.,;:]\s*\d{3})/);
      const zoneMatch = line.match(/^(Négatif|Negatif|Positif|Sec)\s+/i);
      if (!skuMatch) return null;
      const sku = skuMatch[1].replace(/\s+/g, '').replace(/[,:;]/, '.');
      if (seen.has(sku)) return null;
      seen.add(sku);
      const afterSku = line.slice(line.indexOf(skuMatch[1]) + skuMatch[1].length).replace(/^[-–—:;\s]+/, '').trim();
      const parsed = extractPackageFromImportedName(afterSku);
      let name = parsed.name || afterSku || line;
      if (zoneMatch && name.toLowerCase().startsWith(zoneMatch[1].toLowerCase())) name = name.slice(zoneMatch[0].length).trim();
      return { raw: line, sku, name, packageSize: parsed.packageSize, zoneLabel: zoneMatch ? zoneMatch[1].replace('Negatif', 'Négatif') : '', order: index + 1 };
    })
    .filter(Boolean)
    .map((line, index) => ({ ...line, order: index + 1 }));
}

function zoneOptionsHtml(selected = '', includeEmpty = true) {
  const empty = includeEmpty ? '<option value="">Choisir une zone</option>' : '';
  return empty + state.zones.map(zone => `<option value="${escapeHtml(zone.id)}" ${selected === zone.id ? 'selected' : ''}>${escapeHtml(zone.code ? zone.code + ' · ' : '')}${escapeHtml(zone.name || '')}</option>`).join('');
}

function bestInventoryReplacementCandidate(line, currentProducts) {
  let best = null;
  let score = 0;
  currentProducts.forEach(product => {
    const candidateScore = inventoryNameSimilarity(line.name, product.name);
    if (candidateScore > score) { best = product; score = candidateScore; }
  });
  return score >= 0.45 ? { product: best, score } : null;
}

function buildInventoryPdfImportDraft(slot, lines, fileName = '') {
  const currentProducts = productsForInventorySlot(slot, true);
  const currentSkuSet = new Set(currentProducts.map(product => String(product.sku || '').trim()).filter(Boolean));
  const incomingSkuSet = new Set(lines.map(line => line.sku).filter(Boolean));
  const replacements = [];
  const exact = [];
  const newItems = [];
  const usedReplacementIds = new Set();

  lines.forEach((line, index) => {
    const exactProduct = state.products.find(product => String(product.sku || '').trim() === line.sku);
    if (exactProduct) {
      exact.push({ ...line, productId: exactProduct.id, oldName: exactProduct.name || '', oldPackageSize: exactProduct.packageSize || '', order: index + 1 });
      return;
    }
    const replacement = bestInventoryReplacementCandidate(line, currentProducts.filter(product => !usedReplacementIds.has(product.id)));
    if (replacement?.product) {
      usedReplacementIds.add(replacement.product.id);
      replacements.push({ ...line, productId: replacement.product.id, oldSku: replacement.product.sku || '', oldName: replacement.product.name || '', oldPackageSize: replacement.product.packageSize || '', score: replacement.score, order: index + 1 });
      return;
    }
    newItems.push({ ...line, storageZoneId: zoneIdFromImportLabel(line.zoneLabel), order: index + 1 });
  });

  const keptIds = new Set([...exact.map(item => item.productId), ...replacements.map(item => item.productId)]);
  const missing = currentProducts
    .filter(product => !incomingSkuSet.has(String(product.sku || '').trim()))
    .filter(product => !keptIds.has(product.id))
    .map(product => ({ productId: product.id, sku: product.sku || '', name: product.name || '', packageSize: product.packageSize || '', active: product.active !== false }));

  return { status: 'done', slot, fileName, lines, exact, replacements, newItems, missing, message: `${lines.length} référence(s) détectée(s)` };
}

async function extractTextFromInventoryPdf(file) {
  if (!window.pdfjsLib?.getDocument) throw new Error('Le module PDF.js n’est pas chargé. Recharge la page avec internet.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map();
    content.items.forEach(item => {
      const y = Math.round((item.transform?.[5] || 0) / 3) * 3;
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push(item);
    });
    const pageText = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) => items.sort((a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0)).map(item => item.str).join(' '))
      .join('\n');
    pages.push(pageText);
  }
  return pages.join('\n');
}

async function processInventoryPdfFiles(files) {
  const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
  const pdfFiles = Array.from(files || []).filter(file => String(file.type || '').includes('pdf') || String(file.name || '').toLowerCase().endsWith('.pdf'));
  if (!pdfFiles.length) return toast('Sélectionne un fichier PDF');
  inventoryPdfImportDraft = { status: 'processing', slot, fileName: pdfFiles.map(f => f.name).join(', '), lines: [], exact: [], replacements: [], newItems: [], missing: [], message: 'Lecture du PDF…' };
  render();
  try {
    const texts = [];
    for (const file of pdfFiles) texts.push(await extractTextFromInventoryPdf(file));
    const lines = enhanceImportedInventoryLines(texts.join('\n'));
    if (!lines.length) {
      inventoryPdfImportDraft = { status: 'error', slot, fileName: pdfFiles.map(f => f.name).join(', '), lines: [], exact: [], replacements: [], newItems: [], missing: [], message: 'Aucune référence détectée. Si ton PDF est une image scannée, utilise le mode photos/OCR.' };
      render();
      return toast('Aucune référence trouvée dans le PDF');
    }
    inventoryPdfImportDraft = buildInventoryPdfImportDraft(slot, lines, pdfFiles.map(f => f.name).join(', '));
    render();
    toast(`${lines.length} référence(s) détectée(s). Vérifie avant d’appliquer.`);
  } catch (error) {
    console.error(error);
    inventoryPdfImportDraft = { status: 'error', slot, fileName: pdfFiles.map(f => f.name).join(', '), lines: [], exact: [], replacements: [], newItems: [], missing: [], message: error.message || 'Erreur de lecture du PDF' };
    render();
    toast('Impossible de lire le PDF');
  }
}

function renderInventoryPdfReview() {
  if (inventoryPdfImportDraft.status === 'idle') return '';
  if (inventoryPdfImportDraft.status === 'processing') return `
    <div class="alert info" style="margin-top:14px;"><strong>Lecture du PDF en cours…</strong><br>${escapeHtml(inventoryPdfImportDraft.message || '')}</div>
  `;
  if (inventoryPdfImportDraft.status === 'error') return `
    <div class="alert danger" style="margin-top:14px;">${escapeHtml(inventoryPdfImportDraft.message || 'Erreur de lecture')}</div>
  `;
  const exactRows = inventoryPdfImportDraft.exact.map((item, index) => `
    <tr>
      <td><input class="mini-input" data-pdf-exact-order="${index}" type="number" min="1" step="1" value="${escapeHtml(item.order)}" /></td>
      <td><strong>${escapeHtml(item.name)}</strong><br><span class="muted">Référence utilisée : ${escapeHtml(item.sku)} · ${escapeHtml(item.packageSize || '-')}</span></td>
      <td>${item.oldPackageSize && item.oldPackageSize !== item.packageSize ? `<span class="badge warning">Cond. modifié : ${escapeHtml(item.oldPackageSize)} → ${escapeHtml(item.packageSize || '-')}</span>` : '<span class="badge success">OK</span>'}</td>
    </tr>
  `).join('') || `<tr><td colspan="3" class="empty">Aucune référence déjà connue.</td></tr>`;

  const replacementRows = inventoryPdfImportDraft.replacements.map((item, index) => {
    const suggestedZone = zoneIdFromImportLabel(item.zoneLabel) || '';
    const suggestedSequence = nextSequenceForZone(suggestedZone);
    return `
    <tr>
      <td><input class="mini-input" data-pdf-replacement-order="${index}" type="number" min="1" step="1" value="${escapeHtml(item.order)}" /></td>
      <td><strong>${escapeHtml(item.name)}</strong><br><span class="muted">Nouvelle réf. ${escapeHtml(item.sku)} · ${escapeHtml(item.packageSize || '-')}</span></td>
      <td><strong>${escapeHtml(item.oldName)}</strong><br><span class="muted">Ancienne réf. ${escapeHtml(item.oldSku || '-')} · ${escapeHtml(item.oldPackageSize || '-')}</span></td>
      <td><select data-pdf-replacement-action="${index}"><option value="replace" selected>Remplacer l’ancienne référence</option><option value="new">Créer comme nouveau produit</option></select></td>
      <td><select data-pdf-replacement-zone="${index}">${zoneOptionsHtml(suggestedZone, true)}</select></td>
      <td><input class="mini-input" data-pdf-replacement-sequence="${index}" type="number" min="1000" max="9999" step="1" value="${escapeHtml(suggestedSequence)}" /></td>
    </tr>
  `;
  }).join('') || `<tr><td colspan="6" class="empty">Aucun changement de référence probable détecté.</td></tr>`;

  const newRows = inventoryPdfImportDraft.newItems.map((item, index) => {
    const suggestedSequence = nextSequenceForZone(item.storageZoneId || '');
    return `
    <tr>
      <td><input class="mini-input" data-pdf-new-order="${index}" type="number" min="1" step="1" value="${escapeHtml(item.order)}" /></td>
      <td><input data-pdf-new-sku="${index}" value="${escapeHtml(item.sku)}" /></td>
      <td><input data-pdf-new-name="${index}" value="${escapeHtml(item.name)}" /></td>
      <td><input data-pdf-new-package="${index}" value="${escapeHtml(item.packageSize || '')}" /></td>
      <td><select data-pdf-new-zone="${index}">${zoneOptionsHtml(item.storageZoneId || '', true)}</select></td>
      <td><input class="mini-input" data-pdf-new-sequence="${index}" type="number" min="1000" max="9999" step="1" value="${escapeHtml(suggestedSequence)}" /></td>
    </tr>
  `;
  }).join('') || `<tr><td colspan="6" class="empty">Aucun nouveau produit détecté.</td></tr>`;

  const missingRows = inventoryPdfImportDraft.missing.map((item, index) => `
    <tr>
      <td><strong>${escapeHtml(item.name)}</strong><br><span class="muted">Référence actuelle : ${escapeHtml(item.sku || '-')} · ${escapeHtml(item.packageSize || '-')}</span></td>
      <td><span class="badge warning">Absent du PDF</span></td>
      <td><label class="checkbox-line"><input type="checkbox" data-pdf-missing-archive="${index}" /> Archiver si plus d’actualité</label></td>
    </tr>
  `).join('') || `<tr><td colspan="3" class="empty">Aucun produit à retirer de cette liste.</td></tr>`;

  return `
    <div class="alert info" style="margin-top:14px;">
      <strong>Analyse du PDF : ${escapeHtml(inventoryPdfImportDraft.fileName || 'document')}</strong><br>
      ${escapeHtml(inventoryPdfImportDraft.lines.length)} référence(s) détectée(s) · ${escapeHtml(inventoryPdfImportDraft.exact.length)} connue(s) · ${escapeHtml(inventoryPdfImportDraft.replacements.length)} remplacement(s) possible(s) · ${escapeHtml(inventoryPdfImportDraft.newItems.length)} nouveau(x) · ${escapeHtml(inventoryPdfImportDraft.missing.length)} à retirer.
    </div>
    <div class="pdf-review-grid">
      <div class="card inset-card">
        <h4>1. Références connues</h4>
        <div class="table-wrap compact-table"><table><thead><tr><th>Ordre BC</th><th>Produit</th><th>Changement</th></tr></thead><tbody>${exactRows}</tbody></table></div>
      </div>
      <div class="card inset-card">
        <h4>2. Changements de référence possibles</h4>
        <p class="muted">Le logiciel se base sur le nom produit pour repérer une référence remplacée.</p>
        <div class="table-wrap compact-table"><table><thead><tr><th>Ordre BC</th><th>Nouveau PDF</th><th>Produit actuel suggéré</th><th>Action</th><th>Zone si nouveau</th><th>Séquence produit</th></tr></thead><tbody>${replacementRows}</tbody></table></div>
      </div>
      <div class="card inset-card">
        <h4>3. Nouveaux produits</h4>
        <p class="muted">Choisis la zone de stockage et la séquence produit. L’ordre BC reste indépendant des listes de Fin de mois.</p>
        <div class="table-wrap compact-table"><table><thead><tr><th>Ordre BC</th><th>Réf.</th><th>Produit</th><th>Conditionnement</th><th>Zone</th><th>Séquence produit</th></tr></thead><tbody>${newRows}</tbody></table></div>
      </div>
      <div class="card inset-card">
        <h4>4. Produits absents du nouveau PDF</h4>
        <p class="muted">Ils seront retirés de cette liste. Coche archive seulement si le produit n’est plus d’actualité.</p>
        <div class="table-wrap compact-table"><table><thead><tr><th>Produit actuel</th><th>Statut</th><th>Archiver ?</th></tr></thead><tbody>${missingRows}</tbody></table></div>
      </div>
    </div>
    <div class="form-actions wrap-actions" style="margin-top:14px;">
      <button data-action="applyInventoryPdfImport" class="success">Appliquer la mise à jour PDF</button>
      <button data-action="clearInventoryPdfImport" class="danger-soft">Annuler l’analyse</button>
    </div>
  `;
}

function createProductFromInventoryPdfItem(item, slot, order, zoneId, sequence = 0) {
  const def = inventorySlotDefinition(slot);
  const product = migrateProduct({
    id: uid(),
    sku: String(item.sku || '').trim(),
    name: String(item.name || 'Nouveau produit').trim(),
    category: fixedProductCategory(def.type === 'hub' ? 'HUB' : (zoneId ? getZone(zoneId)?.name : item.zoneLabel) || 'Sec'),
    unit: 'colis',
    packageSize: String(item.packageSize || '').trim(),
    minStock: 0,
    maxStock: 0,
    lastPrice: 0,
    supplierId: '',
    storageZoneId: zoneId || '',
    sequence: Number(sequence || 0) || nextSequenceForZone(zoneId || ''),
    monthEndOrder: Number(sequence || 0) || nextSequenceForZone(zoneId || ''),
    inventorySlots: [slot],
    inventoryOrders: { [slot]: Number(order || 0) || 1 },
    active: true,
    createdAt: today()
  });
  state.products.push(product);
  return product;
}

function applyInventoryPdfImport() {
  const draft = inventoryPdfImportDraft;
  const slot = draft.slot || document.querySelector('#inventoryListSlot')?.value || 'monday_general';
  if (draft.status !== 'done') return toast('Aucun PDF analysé à appliquer');
  if (!confirm('Appliquer cette mise à jour ? La liste actuelle sera remplacée par l’ordre du PDF.')) return;

  const newRowsMissingZone = [];
  draft.newItems.forEach((item, index) => {
    const zoneId = document.querySelector(`[data-pdf-new-zone="${index}"]`)?.value || '';
    if (!zoneId) newRowsMissingZone.push(index + 1);
  });
  draft.replacements.forEach((item, index) => {
    const action = document.querySelector(`[data-pdf-replacement-action="${index}"]`)?.value || 'replace';
    const zoneId = document.querySelector(`[data-pdf-replacement-zone="${index}"]`)?.value || '';
    if (action === 'new' && !zoneId) newRowsMissingZone.push(`remplacement ${index + 1}`);
  });
  if (newRowsMissingZone.length) return toast('Choisis une zone pour les nouveaux produits avant d’appliquer');
  const invalidSequences = [];
  draft.replacements.forEach((item, index) => {
    const action = document.querySelector(`[data-pdf-replacement-action="${index}"]`)?.value || 'replace';
    if (action !== 'new') return;
    const sequence = Number(document.querySelector(`[data-pdf-replacement-sequence="${index}"]`)?.value || 0);
    if (sequence < 1000 || sequence > 9999) invalidSequences.push(`remplacement ${index + 1}`);
  });
  draft.newItems.forEach((item, index) => {
    const sequence = Number(document.querySelector(`[data-pdf-new-sequence="${index}"]`)?.value || 0);
    if (sequence < 1000 || sequence > 9999) invalidSequences.push(index + 1);
  });
  if (invalidSequences.length) return toast('Chaque nouveau produit doit avoir une séquence à 4 chiffres');

  const projectedNewProducts = [];
  draft.replacements.forEach((item, index) => {
    const action = document.querySelector(`[data-pdf-replacement-action="${index}"]`)?.value || 'replace';
    if (action !== 'new') return;
    projectedNewProducts.push({
      id: `new-pdf-replacement-${index}`,
      name: item.name || 'Nouveau produit',
      sku: item.sku || '',
      sequence: Number(document.querySelector(`[data-pdf-replacement-sequence="${index}"]`)?.value || 0),
      active: true
    });
  });
  draft.newItems.forEach((item, index) => {
    projectedNewProducts.push({
      id: `new-pdf-${index}`,
      name: document.querySelector(`[data-pdf-new-name="${index}"]`)?.value || item.name || 'Nouveau produit',
      sku: document.querySelector(`[data-pdf-new-sku="${index}"]`)?.value || item.sku || '',
      sequence: Number(document.querySelector(`[data-pdf-new-sequence="${index}"]`)?.value || 0),
      active: true
    });
  });
  const sequenceDuplicates = getProductSequenceDuplicates(state.products.filter(product => product.active !== false).concat(projectedNewProducts))
    .filter(group => group.items.some(product => String(product.id || '').startsWith('new-pdf')));
  if (sequenceDuplicates.length) {
    const ok = confirm('Attention : deux produits ou plus ont le même numéro de séquence.\n\n' + duplicateProductSequenceMessage(sequenceDuplicates) + '\n\nValider quand même ?');
    if (!ok) return;
  }

  cacheCurrentInventoryDraft(selectedInventorySlot?.date || today(), selectedInventorySlot?.type || 'general');

  state.products.forEach(product => {
    if (!productInventorySlots(product).includes(slot)) return;
    product.inventorySlots = productInventorySlots(product).filter(item => item !== slot);
    if (product.inventoryOrders) delete product.inventoryOrders[slot];
  });

  draft.exact.forEach((item, index) => {
    const order = Number(document.querySelector(`[data-pdf-exact-order="${index}"]`)?.value || item.order || index + 1);
    const product = getProduct(item.productId);
    if (!product) return;
    product.name = String(item.name || product.name || '').trim();
    if (item.packageSize) product.packageSize = item.packageSize;
    ensureProductInInventorySlot(product, slot, order);
  });

  draft.replacements.forEach((item, index) => {
    const order = Number(document.querySelector(`[data-pdf-replacement-order="${index}"]`)?.value || item.order || index + 1);
    const action = document.querySelector(`[data-pdf-replacement-action="${index}"]`)?.value || 'replace';
    if (action === 'replace') {
      const product = getProduct(item.productId);
      if (!product) return;
      product.sku = String(item.sku || product.sku || '').trim();
      product.name = String(item.name || product.name || '').trim();
      if (item.packageSize) product.packageSize = item.packageSize;
      ensureProductInInventorySlot(product, slot, order);
    } else {
      const zoneId = document.querySelector(`[data-pdf-replacement-zone="${index}"]`)?.value || '';
      const sequence = Number(document.querySelector(`[data-pdf-replacement-sequence="${index}"]`)?.value || 0);
      createProductFromInventoryPdfItem(item, slot, order, zoneId, sequence);
    }
  });

  draft.newItems.forEach((item, index) => {
    const sku = document.querySelector(`[data-pdf-new-sku="${index}"]`)?.value || item.sku;
    const name = document.querySelector(`[data-pdf-new-name="${index}"]`)?.value || item.name;
    const packageSize = document.querySelector(`[data-pdf-new-package="${index}"]`)?.value || item.packageSize;
    const order = Number(document.querySelector(`[data-pdf-new-order="${index}"]`)?.value || item.order || index + 1);
    const zoneId = document.querySelector(`[data-pdf-new-zone="${index}"]`)?.value || '';
    const sequence = Number(document.querySelector(`[data-pdf-new-sequence="${index}"]`)?.value || 0);
    createProductFromInventoryPdfItem({ ...item, sku, name, packageSize }, slot, order, zoneId, sequence);
  });

  draft.missing.forEach((item, index) => {
    const archive = Boolean(document.querySelector(`[data-pdf-missing-archive="${index}"]`)?.checked);
    const product = getProduct(item.productId);
    if (product && archive) product.active = false;
  });

  selectedInventorySlot = { date: dateForInventorySlot(slot), type: inventorySlotDefinition(slot).type };
  inventoryPdfImportDraft = { status: 'idle', slot: '', fileName: '', lines: [], exact: [], replacements: [], newItems: [], missing: [], message: '' };
  saveState();
  render();
  toast('Liste mise à jour avec le PDF');
}

function updateInventoryOcrProgress(message, progress = null) {
  inventoryPhotoOcrDraft.message = message || '';
  if (progress !== null) inventoryPhotoOcrDraft.progress = Math.max(0, Math.min(100, Math.round(progress)));
  const messageEl = document.querySelector('#inventoryOcrMessage');
  const progressEl = document.querySelector('#inventoryOcrProgress');
  const progressTextEl = document.querySelector('#inventoryOcrProgressText');
  if (messageEl) messageEl.textContent = inventoryPhotoOcrDraft.message;
  if (progressEl) progressEl.style.width = `${inventoryPhotoOcrDraft.progress}%`;
  if (progressTextEl) progressTextEl.textContent = `${inventoryPhotoOcrDraft.progress}%`;
}

function preprocessInventoryOcrImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 2400;
      const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * ratio));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * ratio));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
        const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.36 + 128));
        pixels[i] = pixels[i + 1] = pixels[i + 2] = contrasted;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    image.onerror = () => reject(new Error('Image illisible'));
    image.src = dataUrl;
  });
}

async function processInventoryOcrPages(pages) {
  const imagePages = Array.from(pages || []).filter(page => page?.fileData && String(page.fileType || '').startsWith('image/'));
  if (!imagePages.length) return toast('Ajoute au moins une photo des pages d’inventaire');
  if (!window.Tesseract?.recognize) return toast('Le module de reconnaissance n’est pas chargé. Vérifie la connexion internet puis recharge la page.');
  inventoryPhotoOcrDraft = { status: 'processing', progress: 0, message: 'Préparation de la reconnaissance…', pages: imagePages, text: '', matched: 0, unknown: 0 };
  render();
  const extractedTexts = [];
  try {
    for (let index = 0; index < imagePages.length; index += 1) {
      const page = imagePages[index];
      updateInventoryOcrProgress(`Préparation de la page ${index + 1}/${imagePages.length}…`, (index / imagePages.length) * 100);
      const prepared = await preprocessInventoryOcrImage(page.fileData);
      const result = await window.Tesseract.recognize(prepared, 'fra', {
        logger: event => {
          if (event.status !== 'recognizing text') return;
          const pageProgress = Number(event.progress || 0);
          const totalProgress = ((index + pageProgress) / imagePages.length) * 100;
          updateInventoryOcrProgress(`Lecture de la page ${index + 1}/${imagePages.length}…`, totalProgress);
        }
      });
      extractedTexts.push(result?.data?.text || '');
    }
    const detected = inventoryOcrLinesFromText(extractedTexts.join('\n'));
    const matched = detected.filter(item => item.matched).length;
    const unknown = detected.length - matched;
    inventoryPhotoOcrDraft = {
      status: 'done',
      progress: 100,
      message: detected.length ? `${detected.length} référence(s) détectée(s)` : 'Aucune référence détectée',
      pages: imagePages,
      text: detected.map(item => `${item.sku} ${item.name}`).join('\n'),
      matched,
      unknown
    };
    render();
    toast(detected.length ? `${detected.length} produit(s) détecté(s) : vérifie la liste avant de l’appliquer` : 'Aucune référence produit détectée. Essaie avec des photos plus nettes et bien cadrées.');
  } catch (error) {
    console.error(error);
    inventoryPhotoOcrDraft = { ...inventoryPhotoOcrDraft, status: 'error', message: 'La reconnaissance a échoué. Réessaie avec des photos plus nettes.' };
    render();
    toast('Impossible de lire les photos d’inventaire');
  }
}

function prepareInventoryOcrPage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) return reject(new Error('Photo invalide'));
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        try {
          const maxSide = 2400;
          const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width || 1, image.naturalHeight || image.height || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * ratio));
          canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * ratio));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve({
            id: uid(),
            fileName: file.name || `inventaire-${Date.now()}.jpg`,
            fileType: 'image/jpeg',
            fileData: canvas.toDataURL('image/jpeg', 0.9),
            scannedAt: new Date().toISOString()
          });
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error('Image illisible'));
      image.src = String(reader.result || '');
    };
    reader.onerror = () => reject(reader.error || new Error('Lecture impossible'));
    reader.readAsDataURL(file);
  });
}

async function processInventoryOcrFiles(files) {
  const imageFiles = Array.from(files || []).filter(file => String(file.type || '').startsWith('image/'));
  if (!imageFiles.length) return toast('Sélectionne des photos au format image');
  toast(`Préparation de ${imageFiles.length} photo(s)…`);
  try {
    const pages = [];
    for (const file of imageFiles) {
      const page = await prepareInventoryOcrPage(file);
      if (page) pages.push(page);
    }
    await processInventoryOcrPages(pages);
  } catch (error) {
    console.error(error);
    toast('Impossible de préparer les photos');
  }
}

function applyInventoryOcrList(mode) {
  const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
  const raw = document.querySelector('#inventoryOcrText')?.value || inventoryPhotoOcrDraft.text || '';
  if (!raw.trim()) return toast('Aucune référence détectée à appliquer');
  applyImportedInventoryText(slot, mode, raw, 'photos');
  inventoryPhotoOcrDraft = { status: 'idle', progress: 0, message: '', pages: [], text: '', matched: 0, unknown: 0 };
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

function orderRateEditable(type) {
  return type === 'general' || type === 'ultra';
}

function orderModificationRateKey(date, type) {
  return `${date}::${type}`;
}

function getOrderModificationRate(date, type) {
  const value = (state.orderModificationRates || {})[orderModificationRateKey(date, type)];
  return value === undefined || value === null ? '' : value;
}

function setOrderModificationRate(date, type, value) {
  state.orderModificationRates = state.orderModificationRates || {};
  const key = orderModificationRateKey(date, type);
  const raw = String(value ?? '').replace(',', '.').trim();
  if (raw === '') {
    delete state.orderModificationRates[key];
    return;
  }
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return;
  state.orderModificationRates[key] = Math.round(numeric * 100) / 100;
}

function orderModificationRateLabel(date, type) {
  const value = getOrderModificationRate(date, type);
  if (value === '') return 'Non renseigné';
  return `${number(value)} %`;
}

function orderModificationRatesForDate(date) {
  return ['general', 'ultra'].map(type => `${inventoryTypeLabel(type)} : ${orderModificationRateLabel(date, type)}`).join(' · ');
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



function cameraSupported() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function stopMultiPhotoScanner() {
  if (activeMultiPhotoScanner?.stream) {
    activeMultiPhotoScanner.stream.getTracks().forEach(track => track.stop());
  }
  activeMultiPhotoScanner = null;
  document.querySelector('#multiPhotoScanner')?.remove();
}

function cameraPageFromVideo(video, index, prefix = 'scan', options = {}) {
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 720;
  const maxSide = Number(options.maxSide || 1400);
  const ratio = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * ratio));
  canvas.height = Math.max(1, Math.round(sourceHeight * ratio));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return {
    id: uid(),
    fileName: `${prefix}-page-${String(index).padStart(2, '0')}.jpg`,
    fileType: 'image/jpeg',
    fileData: canvas.toDataURL('image/jpeg', Number(options.quality || 0.72)),
    scannedAt: new Date().toISOString()
  };
}

function refreshMultiPhotoScannerPreview() {
  const scanner = activeMultiPhotoScanner;
  if (!scanner) return;
  const countEl = document.querySelector('#scannerPageCount');
  const thumbsEl = document.querySelector('#scannerThumbs');
  const validateBtn = document.querySelector('#scannerValidate');
  if (countEl) countEl.textContent = `${scanner.pages.length} page(s) prise(s)`;
  if (validateBtn) validateBtn.disabled = !scanner.pages.length;
  if (thumbsEl) {
    thumbsEl.innerHTML = scanner.pages.map((page, index) => `
      <div class="scanner-thumb-card">
        <img src="${escapeHtml(page.fileData)}" alt="Page ${index + 1}" />
        <span>Page ${index + 1}</span>
      </div>
    `).join('') || '<p class="muted">Aucune page prise pour le moment.</p>';
  }
}

async function openMultiPhotoScanner(kind, target) {
  if (!cameraSupported()) {
    toast('Appareil photo non disponible : utilise Importer plusieurs pages.');
    if (kind === 'order') return actions.triggerOrderImport(target.date, target.type);
    if (kind === 'inventory') return actions.triggerInventoryPhotoImport();
    return actions.triggerReceiptImport(target.date, target.type, target.docType);
  }
  stopMultiPhotoScanner();
  const isOrder = kind === 'order';
  const isInventory = kind === 'inventory';
  const title = isInventory
    ? `Pages d’inventaire · ${inventorySlotLabel(target.slot || 'monday_general')}`
    : isOrder
      ? `Bon de commande · ${orderTypeLabel(target.type)} · ${formatDateFr(target.date)}`
      : `${receiptDocLabel(target.docType)} · ${target.docType === 'temperature' ? 'Livraison complète' : receiptTypeLabel(target.type)} · ${formatDateFr(target.date)}`;
  const overlay = document.createElement('div');
  overlay.id = 'multiPhotoScanner';
  overlay.className = 'scanner-backdrop';
  overlay.innerHTML = `
    <div class="scanner-panel" role="dialog" aria-modal="true">
      <div class="scanner-header">
        <div>
          <p class="eyebrow">Scan multipage</p>
          <h3>${escapeHtml(title)}</h3>
          <p class="muted">Prends toutes les pages sans fermer l’appareil photo, puis valide l’ensemble.</p>
        </div>
        <button type="button" class="icon-btn" id="scannerClose" aria-label="Fermer">×</button>
      </div>
      <div class="scanner-video-wrap">
        <video id="scannerVideo" autoplay playsinline muted></video>
      </div>
      <div class="scanner-controls">
        <button type="button" class="success" id="scannerCapture">Prendre la page</button>
        <button type="button" class="secondary" id="scannerUndo" disabled>Retirer dernière page</button>
        <button type="button" class="secondary" id="scannerValidate" disabled>Valider le document</button>
      </div>
      <div class="scanner-status" id="scannerPageCount">0 page(s) prise(s)</div>
      <div class="scanner-thumbs" id="scannerThumbs"><p class="muted">Aucune page prise pour le moment.</p></div>
    </div>
  `;
  document.body.appendChild(overlay);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    const video = overlay.querySelector('#scannerVideo');
    video.srcObject = stream;
    await video.play();
    activeMultiPhotoScanner = { kind, target, stream, pages: [] };
    refreshMultiPhotoScannerPreview();
  } catch (error) {
    console.error(error);
    stopMultiPhotoScanner();
    toast('Impossible d’ouvrir l’appareil photo. Utilise Importer plusieurs pages.');
    if (kind === 'order') return actions.triggerOrderImport(target.date, target.type);
    if (kind === 'inventory') return actions.triggerInventoryPhotoImport();
    return actions.triggerReceiptImport(target.date, target.type, target.docType);
  }

  overlay.querySelector('#scannerClose')?.addEventListener('click', () => {
    if (activeMultiPhotoScanner?.pages?.length && !confirm('Annuler le scan multipage en cours ?')) return;
    stopMultiPhotoScanner();
  });
  overlay.querySelector('#scannerCapture')?.addEventListener('click', () => {
    const scanner = activeMultiPhotoScanner;
    const video = overlay.querySelector('#scannerVideo');
    if (!scanner || !video) return;
    const prefix = scanner.kind === 'inventory'
      ? `inventaire-${scanner.target.slot || 'liste'}`
      : scanner.kind === 'order'
        ? `bc-${scanner.target.date}-${scanner.target.type}`
        : `bl-${scanner.target.date}-${scanner.target.type || scanner.target.docType}`;
    const captureOptions = scanner.kind === 'inventory' ? { maxSide: 2400, quality: 0.9 } : {};
    scanner.pages.push(cameraPageFromVideo(video, scanner.pages.length + 1, prefix, captureOptions));
    const undoBtn = overlay.querySelector('#scannerUndo');
    if (undoBtn) undoBtn.disabled = false;
    refreshMultiPhotoScannerPreview();
    toast(`Page ${scanner.pages.length} ajoutée`);
  });
  overlay.querySelector('#scannerUndo')?.addEventListener('click', () => {
    const scanner = activeMultiPhotoScanner;
    if (!scanner?.pages?.length) return;
    scanner.pages.pop();
    const undoBtn = overlay.querySelector('#scannerUndo');
    if (undoBtn) undoBtn.disabled = !scanner.pages.length;
    refreshMultiPhotoScannerPreview();
  });
  overlay.querySelector('#scannerValidate')?.addEventListener('click', () => {
    const scanner = activeMultiPhotoScanner;
    if (!scanner?.pages?.length) return toast('Prends au moins une page avant de valider.');
    const pages = [...scanner.pages];
    const target = { ...scanner.target };
    const kindToSave = scanner.kind;
    stopMultiPhotoScanner();
    if (kindToSave === 'order') {
      persistScannedOrderPages(target.date, target.type, pages);
    } else if (kindToSave === 'inventory') {
      processInventoryOcrPages(pages);
    } else {
      persistScannedReceiptPages(target.date, target.type, target.docType || 'delivery', pages);
    }
  });
}

function manualOrderTypeOptions(selected = 'general') {
  return INVENTORY_TYPES.map(type => `<option value="${type.id}" ${selected === type.id ? 'selected' : ''}>${escapeHtml(type.label)}</option>`).join('');
}

function manualReceiptTypeOptions(selected = 'general') {
  return INVENTORY_TYPES.map(type => `<option value="${type.id}" ${selected === type.id ? 'selected' : ''}>${escapeHtml(type.label)}</option>`).join('');
}

function manualReceiptDocOptions(selected = 'delivery') {
  return RECEIPT_DOCUMENT_TYPES.map(doc => `<option value="${doc.id}" ${selected === doc.id ? 'selected' : ''}>${escapeHtml(doc.label)}</option>`).join('');
}

function getManualOrderTarget() {
  const date = document.querySelector('#manualOrderDate')?.value || today();
  const type = document.querySelector('#manualOrderType')?.value || 'general';
  return { date, type };
}

function getManualReceiptTarget() {
  const date = document.querySelector('#manualReceiptDate')?.value || today();
  const docType = document.querySelector('#manualReceiptDocType')?.value || 'delivery';
  const type = docType === 'temperature' ? 'delivery' : (document.querySelector('#manualReceiptType')?.value || 'general');
  return { date, type, docType };
}

function isImageScanPage(page = {}) {
  return String(page.fileType || '').startsWith('image/') && String(page.fileData || '').startsWith('data:image/');
}

function replaceOrderScanPage(scanId, pageId, nextPage, options = {}) {
  const scan = (state.scannedOrders || []).find(item => item.id === scanId);
  if (!scan) return false;
  scan.pages = scanPages(scan).map(page => page.id === pageId ? { ...page, ...nextPage, id: page.id, fileName: nextPage.fileName || page.fileName, scannedAt: page.scannedAt, editedAt: new Date().toISOString() } : page);
  if (!options.silent) {
    saveState();
    render();
  }
  return true;
}

function replaceReceiptScanPage(scanId, pageId, nextPage, options = {}) {
  const scan = (state.scannedReceipts || []).find(item => item.id === scanId);
  if (!scan) return false;
  scan.pages = scanPages(scan).map(page => page.id === pageId ? { ...page, ...nextPage, id: page.id, fileName: nextPage.fileName || page.fileName, scannedAt: page.scannedAt, editedAt: new Date().toISOString() } : page);
  if (!options.silent) {
    saveState();
    render();
  }
  return true;
}

function cropImageDataUrl(dataUrl, crop = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const leftPct = Math.max(0, Math.min(45, Number(crop.left || 0))) / 100;
        const topPct = Math.max(0, Math.min(45, Number(crop.top || 0))) / 100;
        const rightPct = Math.max(0, Math.min(45, Number(crop.right || 0))) / 100;
        const bottomPct = Math.max(0, Math.min(45, Number(crop.bottom || 0))) / 100;
        const sx = Math.round(img.width * leftPct);
        const sy = Math.round(img.height * topPct);
        const sw = Math.max(1, Math.round(img.width * (1 - leftPct - rightPct)));
        const sh = Math.max(1, Math.round(img.height * (1 - topPct - bottomPct)));
        const canvas = document.createElement('canvas');
        const maxSide = 1400;
        const ratio = Math.min(1, maxSide / Math.max(sw, sh));
        canvas.width = Math.max(1, Math.round(sw * ratio));
        canvas.height = Math.max(1, Math.round(sh * ratio));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = dataUrl;
  });
}

function autoCropImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const work = document.createElement('canvas');
        const maxSample = 900;
        const ratio = Math.min(1, maxSample / Math.max(img.width, img.height));
        work.width = Math.max(1, Math.round(img.width * ratio));
        work.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = work.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, work.width, work.height);
        const image = ctx.getImageData(0, 0, work.width, work.height);
        const data = image.data;
        const corner = (x, y) => {
          const i = (y * work.width + x) * 4;
          return [data[i], data[i + 1], data[i + 2]];
        };
        const corners = [corner(0,0), corner(work.width-1,0), corner(0,work.height-1), corner(work.width-1,work.height-1)];
        const bg = corners.reduce((acc, rgb) => [acc[0]+rgb[0], acc[1]+rgb[1], acc[2]+rgb[2]], [0,0,0]).map(v => v / corners.length);
        let minX = work.width, minY = work.height, maxX = 0, maxY = 0;
        const threshold = 34;
        for (let y = 0; y < work.height; y += 2) {
          for (let x = 0; x < work.width; x += 2) {
            const i = (y * work.width + x) * 4;
            const diff = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
            if (diff > threshold) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (minX >= maxX || minY >= maxY) return resolve(dataUrl);
        const padX = Math.round(work.width * 0.025);
        const padY = Math.round(work.height * 0.025);
        minX = Math.max(0, minX - padX);
        minY = Math.max(0, minY - padY);
        maxX = Math.min(work.width, maxX + padX);
        maxY = Math.min(work.height, maxY + padY);
        const crop = {
          left: (minX / work.width) * 100,
          top: (minY / work.height) * 100,
          right: ((work.width - maxX) / work.width) * 100,
          bottom: ((work.height - maxY) / work.height) * 100
        };
        cropImageDataUrl(dataUrl, crop).then(resolve).catch(reject);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = dataUrl;
  });
}

function cropModalHtml(page) {
  return formActions(`
    <p class="muted">Trace un cadre sur l’image pour sélectionner uniquement la zone du document à garder. Tu peux ensuite déplacer le cadre ou tirer les poignées pour l’ajuster.</p>
    <div class="crop-selection-grid">
      <div>
        <p class="muted"><strong>Zone à garder</strong></p>
        <div id="cropStage" class="crop-selection-stage">
          <img id="cropSourceImage" src="${escapeHtml(page.fileData)}" alt="Image à rogner" draggable="false" />
          <div id="cropSelection" class="crop-selection-box" aria-label="Zone sélectionnée">
            <span class="crop-handle crop-handle-nw" data-handle="nw"></span>
            <span class="crop-handle crop-handle-ne" data-handle="ne"></span>
            <span class="crop-handle crop-handle-sw" data-handle="sw"></span>
            <span class="crop-handle crop-handle-se" data-handle="se"></span>
          </div>
        </div>
        <div class="crop-quick-actions">
          <button type="button" class="secondary small" id="cropFullPage">Page entière</button>
          <button type="button" class="secondary small" id="cropCenteredPage">Cadre centré</button>
        </div>
        <input id="cropTop" type="hidden" value="0" />
        <input id="cropBottom" type="hidden" value="0" />
        <input id="cropLeft" type="hidden" value="0" />
        <input id="cropRight" type="hidden" value="0" />
      </div>
      <div>
        <p class="muted"><strong>Aperçu après rognage</strong></p>
        <img id="cropPreviewImage" class="scan-preview" src="${escapeHtml(page.fileData)}" alt="Résultat du rognage" />
      </div>
    </div>
  `);
}

function cropValuesFromModal() {
  return {
    top: document.querySelector('#cropTop')?.value || 0,
    bottom: document.querySelector('#cropBottom')?.value || 0,
    left: document.querySelector('#cropLeft')?.value || 0,
    right: document.querySelector('#cropRight')?.value || 0
  };
}

function bindCropPreview(sourceDataUrl) {
  const stage = document.querySelector('#cropStage');
  const sourceImage = document.querySelector('#cropSourceImage');
  const selection = document.querySelector('#cropSelection');
  const preview = document.querySelector('#cropPreviewImage');
  if (!stage || !sourceImage || !selection || !preview) return;

  let rect = { x: 5, y: 5, w: 90, h: 90 };
  let active = null;
  let timer = null;
  const minSize = 6;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const pointFromEvent = event => {
    const bounds = stage.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100)
    };
  };

  const normalizeRect = next => {
    let x = clamp(Number(next.x || 0), 0, 100);
    let y = clamp(Number(next.y || 0), 0, 100);
    let w = clamp(Number(next.w || minSize), minSize, 100);
    let h = clamp(Number(next.h || minSize), minSize, 100);
    if (x + w > 100) x = 100 - w;
    if (y + h > 100) y = 100 - h;
    return { x, y, w, h };
  };

  const setRect = next => {
    rect = normalizeRect(next);
    selection.style.left = rect.x + '%';
    selection.style.top = rect.y + '%';
    selection.style.width = rect.w + '%';
    selection.style.height = rect.h + '%';
    document.querySelector('#cropLeft').value = rect.x.toFixed(3);
    document.querySelector('#cropTop').value = rect.y.toFixed(3);
    document.querySelector('#cropRight').value = (100 - rect.x - rect.w).toFixed(3);
    document.querySelector('#cropBottom').value = (100 - rect.y - rect.h).toFixed(3);
    updatePreview();
  };

  const updatePreview = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        preview.classList.add('loading');
        preview.src = await cropImageDataUrl(sourceDataUrl, cropValuesFromModal());
      } catch (error) {
        console.warn('Aperçu du rognage impossible', error);
      } finally {
        preview.classList.remove('loading');
      }
    }, 140);
  };

  const startDraw = event => {
    if (event.target.closest('.crop-handle') || event.target === selection) return;
    event.preventDefault();
    const p = pointFromEvent(event);
    active = { mode: 'draw', start: p };
    setRect({ x: p.x, y: p.y, w: minSize, h: minSize });
    stage.setPointerCapture?.(event.pointerId);
  };

  const startMove = event => {
    if (event.target.closest('.crop-handle')) return;
    event.preventDefault();
    const p = pointFromEvent(event);
    active = { mode: 'move', start: p, original: { ...rect } };
    stage.setPointerCapture?.(event.pointerId);
  };

  const startResize = event => {
    event.preventDefault();
    event.stopPropagation();
    const p = pointFromEvent(event);
    active = { mode: 'resize', handle: event.target.dataset.handle, start: p, original: { ...rect } };
    stage.setPointerCapture?.(event.pointerId);
  };

  const onMove = event => {
    if (!active) return;
    event.preventDefault();
    const p = pointFromEvent(event);
    if (active.mode === 'draw') {
      const x1 = Math.min(active.start.x, p.x);
      const y1 = Math.min(active.start.y, p.y);
      const x2 = Math.max(active.start.x, p.x);
      const y2 = Math.max(active.start.y, p.y);
      setRect({ x: x1, y: y1, w: Math.max(minSize, x2 - x1), h: Math.max(minSize, y2 - y1) });
    }
    if (active.mode === 'move') {
      setRect({
        x: active.original.x + (p.x - active.start.x),
        y: active.original.y + (p.y - active.start.y),
        w: active.original.w,
        h: active.original.h
      });
    }
    if (active.mode === 'resize') {
      const original = active.original;
      let left = original.x;
      let top = original.y;
      let right = original.x + original.w;
      let bottom = original.y + original.h;
      if (active.handle.includes('w')) left = clamp(p.x, 0, right - minSize);
      if (active.handle.includes('e')) right = clamp(p.x, left + minSize, 100);
      if (active.handle.includes('n')) top = clamp(p.y, 0, bottom - minSize);
      if (active.handle.includes('s')) bottom = clamp(p.y, top + minSize, 100);
      setRect({ x: left, y: top, w: right - left, h: bottom - top });
    }
  };

  const onEnd = event => {
    if (!active) return;
    active = null;
    stage.releasePointerCapture?.(event.pointerId);
  };

  stage.addEventListener('pointerdown', startDraw);
  selection.addEventListener('pointerdown', startMove);
  selection.querySelectorAll('.crop-handle').forEach(handle => handle.addEventListener('pointerdown', startResize));
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onEnd);
  stage.addEventListener('pointercancel', onEnd);
  document.querySelector('#cropFullPage')?.addEventListener('click', () => setRect({ x: 0, y: 0, w: 100, h: 100 }));
  document.querySelector('#cropCenteredPage')?.addEventListener('click', () => setRect({ x: 7, y: 5, w: 86, h: 90 }));
  sourceImage.onload = () => setRect(rect);
  setRect(rect);
}

function getJsPdfConstructor() {
  return window.jspdf?.jsPDF || window.jsPDF || null;
}

function imageSizeFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width || 1, height: img.naturalHeight || img.height || 1 });
    img.onerror = () => reject(new Error('Image illisible pour le PDF'));
    img.src = dataUrl;
  });
}

function pdfImageFormat(dataUrl) {
  if (String(dataUrl || '').startsWith('data:image/png')) return 'PNG';
  if (String(dataUrl || '').startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

async function createMultiPagePdfBlob(scan, title = 'Document numérisé') {
  const JsPDF = getJsPdfConstructor();
  if (!JsPDF) throw new Error('Bibliothèque PDF non chargée');
  const imagePages = scanPages(scan).filter(isImageScanPage);
  if (!imagePages.length) throw new Error('Aucune page image à convertir en PDF');

  let pdf = null;
  for (let i = 0; i < imagePages.length; i += 1) {
    const page = imagePages[i];
    const size = await imageSizeFromDataUrl(page.fileData);
    const orientation = size.width > size.height ? 'landscape' : 'portrait';
    if (!pdf) pdf = new JsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
    else pdf.addPage('a4', orientation);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 6;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const ratio = Math.min(maxWidth / size.width, maxHeight / size.height);
    const drawWidth = size.width * ratio;
    const drawHeight = size.height * ratio;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;
    pdf.addImage(page.fileData, pdfImageFormat(page.fileData), x, y, drawWidth, drawHeight, undefined, 'FAST');
    pdf.setFontSize(7);
    pdf.setTextColor(120);
    pdf.text(`${title} — page ${i + 1}/${imagePages.length}`, margin, pageHeight - 3);
  }
  return pdf.output('blob');
}

function scanPdfFileName(scan, kind = 'document') {
  const safeDate = scan.date || today();
  if (kind === 'order') return `bon-commande-${safeDate}-${scan.type || 'general'}.pdf`;
  if (kind === 'receipt') {
    if (scan.docType === 'temperature') return `ticket-temperature-${safeDate}.pdf`;
    return `bon-livraison-${safeDate}-${scan.type || 'general'}.pdf`;
  }
  return `document-${safeDate}.pdf`;
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function existingPdfPage(scan) {
  return scanPages(scan || {}).find(page => String(page.fileType || '').includes('pdf') && String(page.fileData || '').startsWith('data:application/pdf'));
}

async function getScanPdfUrl(scan, kind, title) {
  if (!scan) return '';
  const existingPdf = existingPdfPage(scan);
  if (existingPdf) return existingPdf.fileData;
  const pages = scanPages(scan);
  const imagePages = pages.filter(isImageScanPage);
  if (!imagePages.length) return '';
  const cacheKey = `${kind}:${scan.id}:${scan.scannedAt || ''}:${pages.length}:${pages.map(page => `${page.id || ''}:${page.editedAt || page.scannedAt || ''}`).join(',')}`;
  if (reportDocumentUrlCache.has(cacheKey)) return reportDocumentUrlCache.get(cacheKey);
  const blob = await createMultiPagePdfBlob(scan, title);
  const url = URL.createObjectURL(blob);
  reportDocumentUrlCache.set(cacheKey, url);
  return url;
}

async function openScanPdf(scan, kind, title) {
  if (!scan) return toast('Document introuvable');
  try {
    toast('Ouverture du PDF…');
    const url = await getScanPdfUrl(scan, kind, title);
    if (!url) return toast('Aucun PDF disponible pour ce document');
    const opened = window.open(url, '_blank');
    if (!opened) {
      const existingPdf = existingPdfPage(scan);
      if (existingPdf) downloadDataUrl(existingPdf.fileData, scanPdfFileName(scan, kind));
      else downloadBlob(await createMultiPagePdfBlob(scan, title), scanPdfFileName(scan, kind));
      toast('Popup bloquée : le PDF a été téléchargé à la place.');
    }
  } catch (error) {
    console.error(error);
    toast('Impossible d’ouvrir le PDF du document.');
  }
}

async function downloadScanAsPdf(scan, kind, title) {
  if (!scan) return toast('Document introuvable');
  const pages = scanPages(scan);
  const imagePages = pages.filter(isImageScanPage);
  const existingPdf = existingPdfPage(scan);
  if (!imagePages.length && existingPdf) {
    downloadDataUrl(existingPdf.fileData, scanPdfFileName(scan, kind));
    return;
  }
  if (!imagePages.length) return toast('Aucune page image disponible pour créer le PDF');
  try {
    toast('Création du PDF multipage…');
    const blob = await createMultiPagePdfBlob(scan, title);
    downloadBlob(blob, scanPdfFileName(scan, kind));
    toast('PDF multipage généré');
  } catch (error) {
    console.error(error);
    toast('Impossible de créer le PDF multipage. Recharge la page puis réessaie.');
  }
}

async function autoCropScanPages(scan, replacePage, label = 'document') {
  const pages = scanPages(scan);
  const imagePages = pages.filter(isImageScanPage);
  if (!imagePages.length) return toast('Aucune page image à rogner');
  toast(`Rognage automatique de ${imagePages.length} page(s)…`);
  for (const page of imagePages) {
    try {
      const fileData = await autoCropImageDataUrl(page.fileData);
      replacePage(scan.id, page.id, { fileData, fileType: 'image/jpeg' }, { silent: true });
    } catch (error) {
      console.warn('Rognage automatique ignoré pour une page', error);
    }
  }
  saveState();
  closeModal();
  render();
  toast(`${label} rogné automatiquement`);
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


function renderInventoryListManager() {
  const selected = selectedInventorySlot || nextPendingInventorySlot();
  const selectedSlot = inventorySlotKey(selected.date, selected.type) || 'monday_general';
  const def = inventorySlotDefinition(selectedSlot);
  const rows = productsForInventorySlot(selectedSlot);
  const duplicates = inventorySlotDuplicateOrders(selectedSlot);
  const query = currentFilter.trim().toLowerCase();
  const visibleRows = rows.filter(product => !query || productSearchText(product).includes(query));
  const available = availableProductsForInventorySlot(selectedSlot);
  const availableOptions = available.map(product => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.sku || 'Sans réf.')} · ${escapeHtml(product.name || '')}</option>`).join('') || '<option value="">Aucun produit disponible</option>';
  const duplicateAlert = duplicates.length ? `
    <div class="alert warning" style="margin-top:12px;">
      <strong>Attention : doublon de numéro d’ordre.</strong><br>
      ${duplicates.map(([order, items]) => `N° ${escapeHtml(order)} : ${items.map(item => escapeHtml(item.name)).join(' / ')}`).join('<br>')}
    </div>
  ` : '';
  const tableRows = visibleRows.map((product, index) => {
    const order = Number(product.inventoryOrders?.[selectedSlot] || index + 1);
    const duplicate = duplicates.some(([, items]) => items.some(item => item.id === product.id));
    return `
      <tr class="${duplicate ? 'duplicate-row' : ''}">
        <td><input class="mini-input" data-inventory-list-order="${escapeHtml(product.id)}" type="number" min="1" step="1" value="${escapeHtml(order)}" /></td>
        <td><strong>${escapeHtml(product.name || '')}</strong><br><span class="muted">${escapeHtml(product.sku || 'Sans réf.')} · ${escapeHtml(product.packageSize || '')}</span></td>
        <td>${escapeHtml(productCategoryLabel(product) || '-')}</td>
        <td>${escapeHtml(getZone(product.storageZoneId)?.name || '-')}</td>
        <td class="actions">
          <button class="small secondary" data-action="moveInventoryListProduct" data-id="${escapeHtml(product.id)}" data-type="up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="small secondary" data-action="moveInventoryListProduct" data-id="${escapeHtml(product.id)}" data-type="down" ${index === visibleRows.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="small danger-soft" data-action="removeProductFromInventoryList" data-id="${escapeHtml(product.id)}">Retirer</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5" class="empty">Aucun produit dans cette liste ou aucun résultat de recherche.</td></tr>`;

  return `
    <div class="card subpage-heading">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Sous-page Inventaire</p>
          <h3>Mise à jour rapide des listes d’inventaire</h3>
          <p class="muted">Chaque jour et chaque type possède sa propre liste : lundi, mercredi, vendredi, général, ultra frais et HUB.</p>
        </div>
        <div class="toolbar-right">
          <button data-action="openInventoryEntry" class="secondary">Retour à la saisie</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div>
          <h3>Liste à modifier</h3>
          <p class="muted">Liste actuelle : ${escapeHtml(def.label)} · ${rows.length} produit(s)</p>
        </div>
        <div class="toolbar-right">
          <button data-action="loadInventoryListManagerSlot" class="secondary">Charger</button>
          <button data-action="saveInventoryListOrder" class="success">Enregistrer l’ordre</button>
        </div>
      </div>
      <div class="form-grid compact-grid">
        <label>Jour / type<select id="inventoryListSlot">${inventorySlotSelectOptions(selectedSlot)}</select></label>
        <label class="wide">Recherche<input data-search value="${escapeHtml(currentFilter)}" placeholder="Référence, produit, catégorie, zone..." /></label>
      </div>
      ${duplicateAlert}
    </div>

    <div class="grid grid-2" style="margin-top:18px;">
      <div class="card">
        <div class="toolbar"><h3>Ajouter rapidement un produit</h3><span class="muted">Ajout sans changer les autres jours</span></div>
        <div class="form-grid compact-grid">
          <label class="wide">Produit<select id="inventoryListAddProduct">${availableOptions}</select></label>
          <label>N° ordre<input id="inventoryListAddOrder" type="number" min="1" step="1" placeholder="Auto" /></label>
        </div>
        <div class="form-actions">
          <button data-action="addProductToInventoryList" class="success">Ajouter à cette liste</button>
        </div>
      </div>
      <div class="card">
        <div class="toolbar"><h3>Actions rapides</h3><span class="muted">Ordre indépendant par jour</span></div>
        <div class="form-actions wrap-actions">
          <button data-action="normalizeInventoryListOrder" class="secondary">Renuméroter 1, 2, 3...</button>
          <button data-action="resetInventoryListDefaultOrder" class="secondary">Ordre bon de commande d’origine</button>
          <button data-action="saveInventoryListOrder" class="success">Enregistrer l’ordre</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div>
          <h3>Mettre à jour avec les photos des pages</h3>
          <p class="muted">Photographie ou importe toutes les pages. Le logiciel lit les références produit dans l’ordre des pages.</p>
        </div>
        <span class="badge info">OCR</span>
      </div>
      <input id="inventoryOcrInput" class="hidden-scan-input" type="file" accept="image/*" multiple />
      <div class="form-actions wrap-actions">
        <button data-action="startInventoryPhotoScan" class="success">Scanner toutes les pages</button>
        <button data-action="triggerInventoryPhotoImport" class="secondary">Importer plusieurs photos</button>
        ${inventoryPhotoOcrDraft.status !== 'idle' ? '<button data-action="clearInventoryPhotoOcr" class="danger-soft">Effacer le résultat</button>' : ''}
      </div>
      ${inventoryPhotoOcrDraft.status === 'processing' ? `
        <div class="ocr-progress-card">
          <div class="toolbar"><strong id="inventoryOcrMessage">${escapeHtml(inventoryPhotoOcrDraft.message || 'Reconnaissance en cours…')}</strong><span id="inventoryOcrProgressText">${escapeHtml(inventoryPhotoOcrDraft.progress)}%</span></div>
          <div class="ocr-progress-track"><div id="inventoryOcrProgress" class="ocr-progress-fill" style="width:${escapeHtml(inventoryPhotoOcrDraft.progress)}%"></div></div>
          <p class="muted">Garde cette page ouverte. La première utilisation peut prendre un peu plus de temps.</p>
        </div>
      ` : ''}
      ${inventoryPhotoOcrDraft.status === 'done' ? `
        <div class="alert ${inventoryPhotoOcrDraft.unknown ? 'warning' : 'success'}" style="margin-top:14px;">
          <strong>${escapeHtml(inventoryPhotoOcrDraft.matched)} référence(s) reconnue(s)</strong>${inventoryPhotoOcrDraft.unknown ? ` · ${escapeHtml(inventoryPhotoOcrDraft.unknown)} référence(s) inconnue(s) à vérifier` : ''}. Vérifie toujours le texte et l’ordre avant de remplacer la liste.
        </div>
        <label class="wide ocr-result-label">Résultat modifiable
          <textarea id="inventoryOcrText" rows="10">${escapeHtml(inventoryPhotoOcrDraft.text || '')}</textarea>
        </label>
        <div class="form-actions wrap-actions">
          <button data-action="appendInventoryOcrList" class="secondary">Ajouter à la fin</button>
          <button data-action="replaceInventoryOcrList" class="danger-soft">Remplacer la liste complète</button>
        </div>
      ` : ''}
      ${inventoryPhotoOcrDraft.status === 'error' ? `<div class="alert danger" style="margin-top:14px;">${escapeHtml(inventoryPhotoOcrDraft.message || 'La reconnaissance a échoué.')}</div>` : ''}
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div>
          <h3>Mettre à jour avec un PDF d’inventaire / bon de commande</h3>
          <p class="muted">Importe le PDF complet. Le logiciel lit les références, applique l’ordre du bon, détecte les nouveaux produits, les références absentes et les changements probables de référence ou conditionnement.</p>
        </div>
        <span class="badge info">PDF</span>
      </div>
      <input id="inventoryPdfInput" class="hidden-scan-input" type="file" accept="application/pdf,.pdf" multiple />
      <div class="form-actions wrap-actions">
        <button data-action="triggerInventoryPdfImport" class="success">Importer PDF et analyser</button>
        ${inventoryPdfImportDraft.status !== 'idle' ? '<button data-action="clearInventoryPdfImport" class="danger-soft">Effacer l’analyse PDF</button>' : ''}
      </div>
      ${renderInventoryPdfReview()}
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar"><h3>Importer / remplacer depuis un bon de commande</h3><span class="badge info">Copier-coller</span></div>
      <p class="muted">Colle les lignes du bon de commande dans l’ordre souhaité. Le logiciel retrouve les produits par référence. Les références inconnues sont créées automatiquement puis ajoutées à cette liste.</p>
      <textarea id="inventoryImportText" rows="8" placeholder="Exemple :\n00005.312 VIANDE 10/1 300 CT\n00006.246 VIANDE 4/1 120 CT\n..."></textarea>
      <div class="form-actions wrap-actions">
        <button data-action="appendInventoryImportList" class="secondary">Ajouter à la fin</button>
        <button data-action="replaceInventoryImportList" class="danger-soft">Remplacer la liste complète</button>
      </div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar"><h3>Produits de la liste</h3><span class="muted">Modifie les numéros puis clique sur Enregistrer l’ordre</span></div>
      <div class="table-wrap"><table><thead><tr><th>N° ordre</th><th>Produit</th><th>Catégorie</th><th>Zone</th><th>Actions</th></tr></thead><tbody>${tableRows}</tbody></table></div>
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
      <tr data-inventory-row="${escapeHtml(p.id)}">
        <td class="order-cell"><span class="badge info">${index + 1}</span></td>
        <td><strong>${escapeHtml(p.name)}</strong><br><span class="muted">${escapeHtml(p.category || '-')} · ${escapeHtml(p.packageSize || '')}</span></td>
        <td>${number(theoretical)} ${escapeHtml(p.unit || '')}</td>
        <td><input class="count-input" data-count="${p.id}" type="number" step="0.01" min="0" inputmode="decimal" enterkeyhint="next" value="${escapeHtml(countValue)}" placeholder="Quantité" /></td>
        <td>${escapeHtml(p.unit || '')}</td>
        <td><input data-inventory-note="${p.id}" tabindex="-1" value="${escapeHtml(noteValue)}" placeholder="Note optionnelle" /></td>
        <td class="actions order-actions">
          <button type="button" class="small secondary" tabindex="-1" data-action="moveInventoryProduct" data-id="${p.id}" data-type="up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="small secondary" tabindex="-1" data-action="moveInventoryProduct" data-id="${p.id}" data-type="down" ${index === selectedProducts.length - 1 ? 'disabled' : ''}>↓</button>
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
        <td><span class="badge info">${escapeHtml(inventoryDeliveryTimingLabel(s.deliveryTiming))}</span></td>
        <td>${(s.lines || []).length} produit(s)</td>
        <td>${number(totalDiff)}</td>
        <td class="actions">
          <button class="small secondary" data-action="selectInventorySlot" data-id="${s.date}" data-type="${s.type}">Ouvrir</button>
          <button class="small secondary" data-action="exportInventorySessionPdf" data-id="${s.id}">PDF</button>
          <button class="small danger-soft" data-action="deleteInventorySession" data-id="${s.id}">Supprimer</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="6" class="empty">Aucun inventaire enregistré.</td></tr>`;

  const selectedDeliveryTiming = selectedSession?.deliveryTiming || '';
  const beforeChecked = selectedDeliveryTiming === 'before' ? 'checked' : '';
  const afterChecked = selectedDeliveryTiming === 'after' ? 'checked' : '';

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
      <div class="delivery-timing-box">
        <strong>Moment de l’inventaire</strong>
        <label class="checkbox-line"><input type="checkbox" id="inventoryBeforeDelivery" data-inventory-delivery="before" ${beforeChecked} /> Inventaire AVANT livraison</label>
        <label class="checkbox-line"><input type="checkbox" id="inventoryAfterDelivery" data-inventory-delivery="after" ${afterChecked} /> Inventaire APRÈS livraison</label>
        <span class="muted">Une seule option peut être cochée à la fois.</span>
      </div>
      <p class="muted">La liste suit l’ordre des bons de commande. Tu peux l’ajuster avec les flèches ↑↓ ou rétablir l’ordre d’origine du bon de commande.</p>
      <div class="table-wrap inventory-entry-table"><table><thead><tr><th>Ordre</th><th>Produit</th><th>Stock théorique</th><th>Quantité comptée</th><th>Unité</th><th>Note</th><th>Déplacer</th></tr></thead><tbody>${inventoryRows}</tbody></table></div>
      <div class="form-actions">
        <button data-action="exportCsv" data-type="inventories" class="secondary">Exporter historiques CSV</button>
        <button data-action="exportCurrentInventoryPdf" class="secondary">Exporter PDF</button>
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

  if (inventorySubPage === 'manageLists') {
    return renderInventoryListManager();
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
          <button data-action="openInventoryListManager" class="secondary">Mise à jour des listes</button>
          <button data-action="openInventoryForecast" class="secondary">Prévisionnel des inventaires</button>
        </div>
      </div>
    </div>
    <div style="margin-top:18px;">
      ${selectedInventoryPanel}
    </div>
    <div class="card" style="margin-top:18px;">
      <div class="toolbar"><h3>Historique des inventaires</h3><span class="muted">Général, Ultra frais et HUB</span></div>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Moment</th><th>Lignes</th><th>Écart total</th><th>Actions</th></tr></thead><tbody>${historyRows}</tbody></table></div>
    </div>
  `;
}

function baseProductSort(a, b) {
  const firstSlotA = INVENTORY_SLOT_ORDER.find(slot => productInventorySlots(a).includes(slot));
  const firstSlotB = INVENTORY_SLOT_ORDER.find(slot => productInventorySlots(b).includes(slot));
  return productInventoryOrder(a, firstSlotA) - productInventoryOrder(b, firstSlotB) || String(a.name || '').localeCompare(String(b.name || ''));
}

function productSequenceSort(a, b) {
  return displayProductSequence(a) - displayProductSequence(b)
    || String(productCategoryLabel(a) || '').localeCompare(String(productCategoryLabel(b) || ''), 'fr', { sensitivity: 'base' })
    || String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
}

function productSort(a, b) {
  if (productSortMode === 'category') {
    return productCategoryLabel(a).localeCompare(productCategoryLabel(b), 'fr', { sensitivity: 'base' }) || productSequenceSort(a, b);
  }
  if (productSortMode === 'name') {
    return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
  }
  if (productSortMode === 'inventory') {
    return baseProductSort(a, b);
  }
  return productSequenceSort(a, b);
}

function productSearchText(product = {}) {
  const slots = productInventorySlots(product).map(inventorySlotLabel).join(' ');
  const zone = getZone(product.storageZoneId)?.name || product.storageLabel || '';
  return [product.sku, product.name, productSequenceValue(product), productCategoryLabel(product), product.unit, product.packageSize, zone, slots].join(' ').toLowerCase();
}

function productMatchesSearch(product) {
  if (productCategoryFilter !== 'all' && productCategoryLabel(product) !== productCategoryFilter) return false;
  if (!currentFilter) return true;
  return productSearchText(product).includes(currentFilter);
}

function productCategoryOptions(products) {
  return ['<option value="all">Toutes les catégories</option>'].concat(
    PRODUCT_CATEGORY_LABELS.map(category => `<option value="${escapeHtml(category)}" ${productCategoryFilter === category ? 'selected' : ''}>${escapeHtml(category)}</option>`)
  ).join('');
}

function renderProductRows({ archivedOnly = false, activeOnly = false } = {}) {
  let rows = state.products.slice();
  if (archivedOnly) rows = rows.filter(p => p.active === false);
  if (activeOnly) rows = rows.filter(p => p.active !== false);
  const duplicateMap = productSequenceDuplicateMap(state.products.filter(product => product.active !== false));
  const visibleRows = rows.filter(productMatchesSearch).sort(productSort);
  return visibleRows.map(p => {
      const archived = p.active === false;
      const duplicate = !archived && duplicateMap.has(p.id);
      const sequence = displayProductSequence(p);
      const keepMonthEnd = monthEndKeepLabel(p);
      return `
        <tr data-product-row="${escapeHtml(p.id)}" class="${archived ? 'archived-row' : ''} ${duplicate ? 'duplicate-row' : ''}">
          <td data-label="Produit" class="product-name-cell"><strong>${escapeHtml(p.name)}</strong><br><span class="muted">${escapeHtml(p.sku || 'Sans réf.')}</span></td>
          <td data-label="Séquence" class="product-sequence-cell">
            <input class="mini-input sequence-input ${duplicate ? 'duplicate-input' : ''}" data-product-inline-field="sequence" data-product-inline-sequence="${escapeHtml(p.id)}" type="number" min="1000" max="9999" step="1" value="${escapeHtml(sequence)}" ${archived ? 'disabled' : ''} />
            ${duplicate ? '<br><span class="badge warning">Doublon validable</span>' : ''}
          </td>
          <td data-label="Catégorie" class="product-category-cell">
            <select class="mini-select inline-product-select" data-product-inline-field="category" data-product-inline-category="${escapeHtml(p.id)}" ${archived ? 'disabled' : ''}>${productCategorySelectOptions(productCategoryLabel(p))}</select>
          </td>
          <td data-label="Planning inventaire" class="product-planning-cell">${inventorySlotBadges(p) || '<span class="muted">Non affecté</span>'}</td>
          <td data-label="Stock / conditionnement" class="product-stock-cell">${number(stockByProduct(p.id))} ${escapeHtml(p.unit || '')}<br><span class="muted">${escapeHtml(p.packageSize || '')}</span></td>
          <td data-label="Mini / Maxi" class="product-minmax-cell">${number(p.minStock || 0)} / ${number(p.maxStock || 0)}</td>
          <td data-label="Zone principale" class="product-zone-cell">
            <select class="mini-select inline-zone-select" data-product-inline-field="zone" data-product-inline-zone="${escapeHtml(p.id)}" ${archived ? 'disabled' : ''}>${productInlineZoneOptions(p.storageZoneId || '')}</select>
          </td>
          <td data-label="État" class="product-state-cell">${archived ? `<span class="badge danger">Archivé</span>${keepMonthEnd ? `<br><span class="badge info">${escapeHtml(keepMonthEnd)}</span>` : ''}` : stockBadge(p)}</td>
          <td data-label="Actions" class="actions product-actions-cell">
            <button class="small success inline-save hidden-inline" data-action="saveProductInline" data-id="${p.id}" data-product-inline-save="${escapeHtml(p.id)}">Sauvegarder</button>
            <button class="small secondary" data-action="openProduct" data-id="${p.id}">Modifier</button>
            ${archived
              ? `<button class="small success" data-action="restoreProduct" data-id="${p.id}">Réintégrer</button>${archivedProductKeptForMonthEnd(p, currentMonthKey()) ? `<button class="small secondary" data-action="clearArchivedMonthEndKeep" data-id="${p.id}">Retirer fin de mois</button>` : `<button class="small secondary" data-action="keepArchivedForCurrentMonthEnd" data-id="${p.id}">Garder fin de mois</button>`}<button class="small danger-soft" data-action="deleteProduct" data-id="${p.id}">Supprimer</button>`
              : `<button class="small warning-soft" data-action="archiveProduct" data-id="${p.id}">Archiver</button>`}
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="9" class="empty">Aucun produit ne correspond aux filtres.</td></tr>`;
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
  const sequenceDuplicates = getProductSequenceDuplicates(activeProducts);
  const sequenceAlert = sequenceDuplicates.length ? `
    <div class="alert warning" style="margin-top:18px;">
      <strong>Attention : plusieurs produits actifs ont la même séquence.</strong><br>
      ${escapeHtml(duplicateProductSequenceMessage(sequenceDuplicates)).split('\n').join('<br>')}<br>
      <span class="muted">Ce n’est pas bloquant : tu peux valider un doublon si les produits doivent réellement partager le même numéro.</span>
    </div>
  ` : '';
  return `
    <div class="grid grid-4">
      <div class="card kpi"><div><span>Produits actifs</span><strong>${activeProducts.length}</strong></div><span class="badge info">Base</span></div>
      <div class="card kpi"><div><span>Produits archivés</span><strong>${archivedProducts.length}</strong></div><span class="badge danger">Hors inventaire</span></div>
      <div class="card kpi"><div><span>Produits HUB</span><strong>${hubProducts}</strong></div><span class="badge info">Catégorie HUB</span></div>
      <div class="card kpi"><div><span>Stocks bas / rupture</span><strong>${lowStock}</strong></div><span class="badge warning">À suivre</span></div>
    </div>

    ${sequenceAlert}

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div class="toolbar-left">
          <h3>${isArchivedView ? 'Produits archivés' : 'Produits de base'}</h3>
          <input class="search" data-search placeholder="Rechercher produit, référence, catégorie, planning..." />
          <select class="filter-select" data-category-filter aria-label="Filtrer par catégorie">${categoryOptions}</select>
          <select class="filter-select" data-product-sort aria-label="Trier les produits">
            <option value="sequence">Séquence / Fin de mois</option>
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
          : 'Page dédiée aux produits de base. La colonne Séquence définit le N° de tri de Fin de mois, indépendamment des listes d’inventaire et bons de commande.'}
      </p>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <h3>${isArchivedView ? 'Archive produits' : 'Catalogue produits actifs'}</h3>
        <span class="muted">${filteredCount} affiché(s) · ${isArchivedView ? archivedProducts.length + ' archivé(s)' : activeProducts.length + ' actif(s) · ' + noPlan + ' sans planning'}</span>
      </div>
      <div class="table-wrap product-catalog-wrap"><table class="product-catalog-table"><thead><tr><th>Produit</th><th>Séquence</th><th>Catégorie</th><th>Planning inventaire</th><th>Stock / conditionnement</th><th>Mini / Maxi</th><th>Zone principale</th><th>État</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
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
          <button type="button" class="small ${scan ? 'secondary' : ''}" data-action="triggerOrderScan" data-id="${row.date}" data-type="${type}">${scan ? 'Scanner pages' : 'Scanner pages'}</button>
          <button type="button" class="small secondary" data-action="triggerOrderImport" data-id="${row.date}" data-type="${type}">Importer plusieurs pages</button>
          ${scan ? `<button type="button" class="small secondary" data-action="viewScannedOrder" data-id="${scan.id}">Voir les ${pageCount} page(s)</button><button type="button" class="small success" data-action="downloadScannedOrderPdf" data-id="${scan.id}">PDF</button>` : ''}
          ${orderRateEditable(type) ? `<label class="order-rate-inline">Taux modification<input data-order-modification-rate data-date="${row.date}" data-type="${type}" type="number" step="0.01" inputmode="decimal" value="${escapeHtml(getOrderModificationRate(row.date, type))}" placeholder="%" /></label>` : ''}
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
          <button class="small success" data-action="downloadScannedOrderPdf" data-id="${scan.id}">PDF</button>
          <button class="small" data-action="triggerOrderScan" data-id="${scan.date}" data-type="${scan.type}">Scanner pages</button>
          <button class="small secondary" data-action="triggerOrderImport" data-id="${scan.date}" data-type="${scan.type}">Importer pages</button>
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
    <input id="orderScanInput" class="hidden-scan-input" type="file" accept="image/*,application/pdf" capture="environment" />
    <input id="orderImportInput" class="hidden-scan-input" type="file" accept="image/*,application/pdf" multiple />

    <div class="card">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Ajout manuel</p>
          <h3>Ajouter un bon de commande manquant</h3>
          <p class="muted">Utilise cette zone pour ajouter un BC d’une date passée ou d’un jour qui n’apparaît plus dans le prévisionnel.</p>
        </div>
      </div>
      <div class="form-grid compact-grid">
        <label>Date de commande<input id="manualOrderDate" type="date" value="${today()}" /></label>
        <label>Type de commande<select id="manualOrderType">${manualOrderTypeOptions()}</select></label>
        <label>Appareil photo<button type="button" class="secondary full" data-action="triggerManualOrderScan">Scanner plusieurs photos</button></label>
        <label>Plusieurs pages<button type="button" class="secondary full" data-action="triggerManualOrderImport">Importer plusieurs pages</button></label>
      </div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Prévisionnel</p>
          <h3>Dates des commandes</h3>
          <p class="muted">Planning automatique lundi / mercredi / vendredi, avec Général, Ultra frais et HUB une semaine sur deux. Renseigne aussi le taux de modification des commandes Général et Ultra frais.</p>
        </div>
      </div>
      <div class="table-wrap order-forecast-wrap"><table><thead><tr><th>Date</th><th>Jour</th><th>Types de commande</th><th>État</th></tr></thead><tbody>${forecastRows}</tbody></table></div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="toolbar">
        <div>
          <h3>Bons de commande numérisés</h3>
          <p class="muted">Un même bon peut contenir autant de pages que nécessaire. Tu peux ajouter une page avec l’appareil photo ou importer toutes les pages d’un coup depuis la galerie, un scanner mobile ou un PDF.</p>
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
            <button type="button" class="small ${deliveryScan ? 'secondary' : ''}" data-action="triggerReceiptScan" data-id="${row.date}" data-type="${type}" data-doc="delivery">${deliveryScan ? 'Scanner pages BL' : 'Scanner pages BL'}</button>
            <button type="button" class="small secondary" data-action="triggerReceiptImport" data-id="${row.date}" data-type="${type}" data-doc="delivery">Importer pages BL</button>
            ${deliveryScan ? `<button type="button" class="small secondary" data-action="viewScannedReceipt" data-id="${deliveryScan.id}">Voir les ${scanPageCount(deliveryScan)} page(s)</button><button type="button" class="small success" data-action="downloadScannedReceiptPdf" data-id="${deliveryScan.id}">PDF</button>` : ''}
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
          <button type="button" class="small secondary" data-action="triggerReceiptImport" data-id="${row.date}" data-type="delivery" data-doc="temperature">Importer ticket</button>
          ${temperatureScan ? `<button type="button" class="small secondary" data-action="viewScannedReceipt" data-id="${temperatureScan.id}">Voir ticket</button><button type="button" class="small success" data-action="downloadScannedReceiptPdf" data-id="${temperatureScan.id}">PDF</button>` : ''}
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
          <button class="small success" data-action="downloadScannedReceiptPdf" data-id="${scan.id}">PDF</button>
          <button class="small" data-action="triggerReceiptScan" data-id="${scan.date}" data-type="${scan.type}" data-doc="${scan.docType || 'delivery'}">${isTemperature ? 'Remplacer ticket' : 'Scanner pages'}</button>
          <button class="small secondary" data-action="triggerReceiptImport" data-id="${scan.date}" data-type="${scan.type}" data-doc="${scan.docType || 'delivery'}">${isTemperature ? 'Importer ticket' : 'Importer pages'}</button>
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

  const missingReceiptDocPanel = `
    <div class="missing-doc-panel">
      <div>
        <h4>Ajouter un document manquant à une date</h4>
        <p class="muted">Utilise cette zone pour compléter une livraison passée : BL Général, BL Ultra frais, BL HUB ou ticket température.</p>
      </div>
      <div class="form-grid compact-grid">
        <label>Date de livraison<input id="manualReceiptDate" type="date" value="${today()}" /></label>
        <label>Document<select id="manualReceiptDocType">${manualReceiptDocOptions()}</select></label>
        <label>Type BL<select id="manualReceiptType">${manualReceiptTypeOptions()}</select></label>
        <label>Appareil photo<button type="button" class="secondary full" data-action="triggerManualReceiptScan">Scanner plusieurs photos</button></label>
        <label>Fichier / galerie<button type="button" class="secondary full" data-action="triggerManualReceiptImport">Importer plusieurs pages</button></label>
      </div>
      <p class="muted">Pour le ticket température, le type BL est ignoré : le ticket reste unique pour la date choisie.</p>
    </div>
  `;

  return `
    <input id="receiptScanInput" class="hidden-scan-input" type="file" accept="image/*,application/pdf" capture="environment" />
    <input id="receiptImportInput" class="hidden-scan-input" type="file" accept="image/*,application/pdf" multiple />

    <div class="card" style="margin-top:18px;">
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
          <p class="muted">Les bons de livraison peuvent contenir plusieurs pages. Tu peux ajouter un document manquant à une date passée, puis scanner ou importer toutes ses pages.</p>
        </div>
      </div>
      ${missingReceiptDocPanel}
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
  const monthEndProducts = productsForMonthEnd(month).sort(monthEndProductSortWithDraft(draftForMonth));
  const temporarilyKeptProducts = monthEndProducts.filter(product => archivedProductKeptForMonthEnd(product, month));
  const filteredProducts = filterRows(monthEndProducts, ['sku', 'name', 'category', 'storageLabel', 'packageSize', 'sequence']).sort(monthEndProductSortWithDraft(draftForMonth));
  const duplicates = getMonthEndDuplicateOrders(monthEndProducts, draftForMonth);
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
          <input class="sort-input ${isDuplicate ? 'duplicate-input' : ''}" data-month-order="${escapeHtml(product.id)}" type="number" min="1000" max="9999" step="1" value="${escapeHtml((draftLine.order ?? productSequenceValue(product)) || monthEndProductOrder(product))}" />
          ${isDuplicate ? '<br><span class="badge danger">Doublon</span>' : ''}
        </td>
        <td><strong>${escapeHtml(product.name)}</strong>${archivedProductKeptForMonthEnd(product, month) ? ' <span class="badge info">Archivé conservé ce mois</span>' : ''}<br><span class="muted">${escapeHtml(product.sku || 'Sans réf.')} · ${escapeHtml(product.packageSize || '')}</span></td>
        <td>${escapeHtml(productCategoryLabel(product))}</td>
        <td>${escapeHtml(getZone(product.storageZoneId)?.name || product.storageLabel || '-')}</td>
        <td><input class="count-input" data-month-ue="${escapeHtml(product.id)}" type="number" step="0.01" min="0" inputmode="decimal" value="${escapeHtml(draftLine.ue ?? line.ue ?? '')}" placeholder="U.E" /></td>
        <td><input class="count-input" data-month-su="${escapeHtml(product.id)}" type="number" step="0.01" min="0" inputmode="decimal" value="${escapeHtml(draftLine.su ?? line.su ?? '')}" placeholder="S.U" /></td>
        <td><input class="count-input" data-month-uu="${escapeHtml(product.id)}" type="number" step="0.01" min="0" inputmode="decimal" value="${escapeHtml(draftLine.uu ?? line.uu ?? '')}" placeholder="U.U" /></td>
        <td><input data-month-note="${escapeHtml(product.id)}" value="${escapeHtml(draftLine.note ?? line.note ?? '')}" placeholder="Note" /></td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="8" class="empty">Aucun produit à afficher pour la fin de mois.</td></tr>`;

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
          <p class="muted">Le N° tri vient de la colonne Séquence dans Produits. Il reste indépendant des listes Inventaire / bons de commande.</p>
        </div>
        <div class="toolbar-right">
          <label class="inline-label">Mois<input data-month-end-month type="month" value="${escapeHtml(month)}" /></label>
          <button data-action="refreshMonthEndOrder" class="secondary">Recharger les séquences Produits</button>
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
        <span class="muted">${filteredProducts.length} affiché(s) · ${monthEndProducts.length} produit(s) fin de mois${temporarilyKeptProducts.length ? ` · ${temporarilyKeptProducts.length} archivé(s) conservé(s) ce mois` : ''}</span>
      </div>
      <div class="table-wrap"><table><thead><tr><th>N° tri</th><th>Produit</th><th>Catégorie</th><th>Zone</th><th>U.E</th><th>S.U</th><th>U.U</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
    <div class="card" style="margin-top:18px;">
      <div class="toolbar"><h3>Historique fin de mois</h3><span class="muted">Inventaires totaux enregistrés</span></div>
      <div class="table-wrap"><table><thead><tr><th>Mois</th><th>Lignes</th><th>Saisies</th><th>Actions</th></tr></thead><tbody>${historyRows}</tbody></table></div>
    </div>
  `;
}

function weeklyReportDaySummary(date) {
  const inventoryTypes = inventoryTypesForDate(date);
  const receiptTypes = receiptTypesForDate(date);
  const inventorySessions = state.inventorySessions.filter(session => session.date === date);
  const inventoryLabel = inventorySessions.length
    ? inventorySessions.map(session => `${inventoryTypeLabel(session.type)} (${inventoryDeliveryTimingLabel(session.deliveryTiming)})`).join('<br>')
    : '<span class="muted">Aucun inventaire enregistré</span>';
  const orderLabel = inventoryTypes.map(type => {
    const scan = getScannedOrder(date, type);
    return `${orderTypeLabel(type)} : ${scan ? `${scanPageCount(scan)} page(s)` : 'manquant'}`;
  }).join('<br>');
  const receiptLabel = receiptTypes.map(type => {
    const scan = getScannedReceipt(date, type, 'delivery');
    return `${receiptTypeLabel(type)} : ${scan ? `${scanPageCount(scan)} page(s)` : 'manquant'}`;
  }).join('<br>');
  const temperatureScan = getScannedReceipt(date, 'delivery', 'temperature');
  return {
    date,
    dayName: dayNames[parseDate(date).getDay()],
    inventoryLabel,
    orderLabel,
    receiptLabel,
    temperatureLabel: temperatureScan ? `${scanPageCount(temperatureScan)} page(s)` : 'manquant',
    rateLabel: orderModificationRatesForDate(date)
  };
}

function renderReports() {
  const weekStart = startOfWeekInput(selectedReportWeek || today());
  selectedReportWeek = weekStart;
  const dates = weekDeliveryDates(weekStart);
  const summaryRows = dates.map(date => weeklyReportDaySummary(date)).map(row => `
    <tr>
      <td><strong>${escapeHtml(formatDateFr(row.date))}</strong><br><span class="muted">${escapeHtml(row.date)}</span></td>
      <td>${escapeHtml(row.dayName)}</td>
      <td>${row.inventoryLabel}</td>
      <td>${row.orderLabel}</td>
      <td>${row.receiptLabel}</td>
      <td>${escapeHtml(row.temperatureLabel)}</td>
      <td>${escapeHtml(row.rateLabel)}</td>
    </tr>
  `).join('');
  const linkedDocuments = dates.map(date => weeklyReportLinkedDocumentsHtml(date)).join('');

  return `
    <div class="card subpage-heading">
      <div class="toolbar">
        <div>
          <p class="eyebrow">Rapport hebdomadaire</p>
          <h3>Rapports</h3>
          <p class="muted">Génère un rapport PDF avec les trois jours de livraison : inventaires, BC, BL, ticket température et taux de modification des commandes.</p>
        </div>
        <div class="toolbar-right">
          <label class="inline-label">Semaine du<input data-report-week type="date" value="${escapeHtml(weekStart)}" /></label>
          <button data-action="exportWeeklyReportPdf" class="success">Exporter rapport PDF</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:18px;">
      <div class="toolbar"><h3>Aperçu de la semaine</h3><span class="muted">${escapeHtml(formatDateFr(dates[0]))} au ${escapeHtml(formatDateFr(dates[2]))}</span></div>
      <div class="table-wrap report-summary-wrap"><table><thead><tr><th>Date</th><th>Jour</th><th>Inventaires</th><th>BC</th><th>BL</th><th>Ticket température</th><th>Taux modification</th></tr></thead><tbody>${summaryRows}</tbody></table></div>
      <h3>Documents liés</h3>
      <p class="muted">Chaque document présent possède maintenant un lien qui ouvre directement son PDF.</p>
      ${linkedDocuments}
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
        <h3>Backups / points de restauration</h3>
        <p class="muted">Les backups permettent de revenir à une sauvegarde précédente en cas d’erreur. Ils sont conservés sur cet appareil. Le logiciel garde les ${BACKUP_MAX_COUNT} derniers points.</p>
        <div class="form-actions inline-actions">
          <button data-action="createBackupNow" class="success">Créer un point de restauration</button>
        </div>
        <div class="table-wrap compact-table backup-table-wrap"><table><thead><tr><th>Date</th><th>Nom</th><th>Contenu</th><th>Type</th><th>Actions</th></tr></thead><tbody>${backupRowsHtml()}</tbody></table></div>
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
    const zoneOptions = ['<option value="">Aucune</option>'].concat(state.zones.map(z => `<option value="${z.id}" ${p.storageZoneId === z.id ? 'selected' : ''}>${escapeHtml(z.code || '')} · ${escapeHtml(z.name)}</option>`)).join('');
    openModal(id ? 'Modifier le produit' : 'Ajouter un produit', formActions(`
      <div class="form-grid">
        <label>Référence / SKU<input name="sku" value="${escapeHtml(p.sku || '')}" placeholder="Ex: FRIT-10KG" /></label>
        <label>Nom produit<input name="name" required value="${escapeHtml(p.name || '')}" placeholder="Ex: Frites 10 kg" /></label>
        <label>Catégorie<select name="category">${productCategorySelectOptions(productCategoryLabel(p))}</select></label>
        <label>Unité de comptage<input name="unit" value="${escapeHtml(p.unit || 'colis')}" placeholder="colis, carton, kg, bidon..." /></label>
        <label>Conditionnement<input name="packageSize" value="${escapeHtml(p.packageSize || '')}" placeholder="Ex: 300 CT" /></label>
        <label>Séquence / N° tri<input name="sequence" type="number" min="1000" max="9999" step="1" value="${escapeHtml(id ? displayProductSequence(p) : '')}" placeholder="Ex: 1001" /></label>
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
        category: fixedProductCategory(data.category, { ...p, storageZoneId: data.storageZoneId }),
        unit: data.unit.trim(),
        packageSize: data.packageSize.trim(),
        minStock: Number(data.minStock || 0),
        maxStock: Number(data.maxStock || 0),
        lastPrice: Number(data.lastPrice || 0),
        supplierId: data.supplierId,
        storageZoneId: data.storageZoneId,
        sequence: Number(data.sequence || 0) || nextSequenceForZone(data.storageZoneId, p.id || ''),
        monthEndOrder: Number(data.sequence || 0) || nextSequenceForZone(data.storageZoneId, p.id || ''),
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
      if (Number(finalItem.sequence || 0) < 1000 || Number(finalItem.sequence || 0) > 9999) {
        return toast('La séquence doit être un numéro à 4 chiffres');
      }
      const activeProducts = state.products.filter(product => product.active !== false || product.id === finalItem.id);
      const sequenceDuplicates = getProductSequenceDuplicates(
        id ? activeProducts.map(product => product.id === id ? finalItem : product) : activeProducts.concat([finalItem])
      ).filter(group => group.items.some(product => product.id === finalItem.id));
      if (sequenceDuplicates.length) {
        const ok = confirm('Attention : deux produits ou plus ont le même numéro de séquence.\n\n' + duplicateProductSequenceMessage(sequenceDuplicates) + '\n\nValider quand même ?');
        if (!ok) return;
      }
      if (id) state.products = state.products.map(x => x.id === id ? finalItem : x);
      else state.products.push(finalItem);
      syncProductSequenceToMonthEndDrafts(finalItem.id, finalItem.sequence);
      saveState(); closeModal(); render(); toast('Produit enregistré');
    });
  },

  saveProductInline(id) {
    const product = getProduct(id);
    if (!product) return;
    const row = Array.from(document.querySelectorAll('[data-product-row]')).find(item => item.dataset.productRow === id);
    if (!row) return;
    const sequenceInput = row.querySelector('[data-product-inline-sequence]');
    const categorySelect = row.querySelector('[data-product-inline-category]');
    const zoneSelect = row.querySelector('[data-product-inline-zone]');
    const nextSequence = Number(sequenceInput?.value || 0);
    const nextZoneId = zoneSelect?.value || '';
    const nextCategory = fixedProductCategory(categorySelect?.value || product.category, { ...product, storageZoneId: nextZoneId });
    if (!nextSequence || nextSequence < 1000 || nextSequence > 9999) {
      if (sequenceInput) sequenceInput.value = displayProductSequence(product);
      return toast('La séquence doit être un numéro à 4 chiffres');
    }
    const updatedProduct = { ...product, sequence: nextSequence, monthEndOrder: nextSequence, category: nextCategory, storageZoneId: nextZoneId };
    const activeProducts = state.products
      .filter(item => item.active !== false || item.id === id)
      .map(item => item.id === id ? updatedProduct : item);
    const duplicates = getProductSequenceDuplicates(activeProducts).filter(group => group.items.some(item => item.id === id));
    if (duplicates.length) {
      const ok = confirm('Attention : deux produits ou plus ont le même numéro de séquence.\n\n' + duplicateProductSequenceMessage(duplicates) + '\n\nValider quand même ?');
      if (!ok) return;
    }
    state.products = state.products.map(item => item.id === id ? updatedProduct : item);
    syncProductSequenceToMonthEndDrafts(updatedProduct.id, updatedProduct.sequence);
    saveState();
    render();
    toast('Ligne produit sauvegardée');
  },
  archiveProduct(id) {
    const product = getProduct(id);
    if (!product) return;
    if (!confirm(`Archiver ${product.name} ? Il ne sera plus proposé dans les inventaires, mais tu pourras le réintégrer plus tard.`)) return;
    const month = currentMonthKey();
    const keepForMonthEnd = confirm(`Garder ${product.name} dans la Fin de mois ${month} uniquement ?

OK = oui, il restera visible uniquement ce mois-ci.
Annuler = non, il sera archivé normalement.`);
    state.products = state.products.map(p => p.id === id ? {
      ...p,
      active: false,
      archivedAt: new Date().toISOString(),
      monthEndKeepMonth: keepForMonthEnd ? month : '',
      monthEndKeepCreatedAt: keepForMonthEnd ? new Date().toISOString() : ''
    } : p);
    saveState(); render(); toast(keepForMonthEnd ? 'Produit archivé et conservé pour la fin de mois en cours' : 'Produit archivé');
  },
  keepArchivedForCurrentMonthEnd(id) {
    const product = getProduct(id);
    if (!product || product.active !== false) return;
    const month = currentMonthKey();
    state.products = state.products.map(p => p.id === id ? { ...p, monthEndKeepMonth: month, monthEndKeepCreatedAt: new Date().toISOString() } : p);
    saveState(); render(); toast('Produit conservé pour la fin de mois en cours');
  },
  clearArchivedMonthEndKeep(id) {
    const product = getProduct(id);
    if (!product) return;
    state.products = state.products.map(p => p.id === id ? { ...p, monthEndKeepMonth: '', monthEndKeepCreatedAt: '' } : p);
    saveState(); render(); toast('Produit retiré de la fin de mois en cours');
  },
  restoreProduct(id) {
    const product = getProduct(id);
    if (!product) return;
    const restoredProduct = { ...product, active: true, restoredAt: new Date().toISOString(), monthEndKeepMonth: '', monthEndKeepCreatedAt: '' };
    const activeProducts = state.products.filter(item => item.active !== false || item.id === id).map(item => item.id === id ? restoredProduct : item);
    const duplicates = getProductSequenceDuplicates(activeProducts).filter(group => group.items.some(item => item.id === id));
    if (duplicates.length) {
      const ok = confirm('Attention : deux produits ou plus ont le même numéro de séquence.\n\n' + duplicateProductSequenceMessage(duplicates) + '\n\nRéintégrer quand même ?');
      if (!ok) return;
    }
    state.products = state.products.map(p => p.id === id ? restoredProduct : p);
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
    const products = productsForMonthEnd(month);
    products.forEach(product => {
      if (!draft[product.id]) draft[product.id] = {};
      draft[product.id].order = productSequenceValue(product) || displayProductSequence(product);
    });
    monthEndDraftValues[monthEndDraftKey(month)] = draft;
    const duplicates = getMonthEndDuplicateOrders(products, draft);
    render();
    if (duplicates.length) {
      alert('Attention : deux produits ou plus ont le même numéro de tri.\n\n' + duplicateMonthEndMessage(duplicates));
    } else {
      toast('Séquences produits rechargées');
    }
  },
  saveMonthEndInventory() {
    const month = document.querySelector('[data-month-end-month]')?.value || selectedMonthEndMonth || today().slice(0, 7);
    selectedMonthEndMonth = month;
    const draft = cacheCurrentMonthEndDraft();
    const previous = getMonthEndSession(month);
    const previousLines = new Map((previous?.lines || []).map(line => [line.productId, line]));
    const products = productsForMonthEnd(month);
    const invalidSequences = products.filter(product => {
      const raw = draft[product.id]?.order;
      const value = Number(raw || 0);
      return raw !== undefined && (value < 1000 || value > 9999);
    });
    if (invalidSequences.length) {
      toast('Le N° tri doit être un numéro à 4 chiffres');
      render();
      return;
    }
    products.forEach(product => {
      const raw = draft[product.id]?.order;
      if (raw !== undefined) {
        const sequence = Number(raw || 0) || '';
        product.sequence = sequence;
        product.monthEndOrder = sequence;
        syncProductSequenceToMonthEndDrafts(product.id, sequence);
      }
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
        note: readValue('note'),
        archivedKeptForMonth: archivedProductKeptForMonthEnd(product, month)
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
    return openMultiPhotoScanner('order', { date, type });
  },
  triggerOrderImport(date, type) {
    if (!date || !type) return toast('Choisis une date et un type de commande');
    pendingOrderScan = { date, type };
    const input = document.querySelector('#orderImportInput');
    if (!input) return toast('Impossible d’ouvrir l’import de pages');
    input.click();
  },
  triggerManualOrderScan() {
    const target = getManualOrderTarget();
    return actions.triggerOrderScan(target.date, target.type);
  },
  triggerManualOrderImport() {
    const target = getManualOrderTarget();
    return actions.triggerOrderImport(target.date, target.type);
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
            ${isImage ? `<button type="button" class="small secondary" data-action="openOrderPageCrop" data-id="${scan.id}" data-type="${page.id}">Rogner manuel</button>` : ''}
            <button type="button" class="small danger-soft" data-action="deleteScannedOrderPage" data-id="${scan.id}" data-type="${page.id}">Supprimer cette page</button>
          </div>
        </section>
      `;
    }).join('') || '<p class="muted">Aucune page enregistrée.</p>';
    openModal(`Bon de commande · ${orderTypeLabel(scan.type)}`, `
      <div class="scan-modal-content">
        <p><strong>Date :</strong> ${escapeHtml(formatDateFr(scan.date))}<br><strong>Type :</strong> ${escapeHtml(orderTypeLabel(scan.type))}<br><strong>Nombre de pages :</strong> ${pages.length}</p>
        <div class="form-actions">
          <button type="button" data-action="downloadScannedOrderPdf" data-id="${scan.id}" class="success">Télécharger PDF multipage</button>
          <button type="button" id="modalCancel" class="secondary">Fermer</button>
        </div>
        <div class="scan-pages-list">${previews}</div>
      </div>
    `, () => {});
  },
  downloadScannedOrderPdf(id) {
    const scan = (state.scannedOrders || []).find(x => x.id === id);
    const title = scan ? `Bon de commande ${orderTypeLabel(scan.type)} ${formatDateFr(scan.date)}` : 'Bon de commande';
    return downloadScanAsPdf(scan, 'order', title);
  },
  openScannedOrderPdf(id) {
    const scan = (state.scannedOrders || []).find(x => x.id === id);
    const title = scan ? `Bon de commande ${orderTypeLabel(scan.type)} ${formatDateFr(scan.date)}` : 'Bon de commande';
    return openScanPdf(scan, 'order', title);
  },
  async autoCropAllOrderPages(id) {
    const scan = (state.scannedOrders || []).find(x => x.id === id);
    if (!scan) return toast('Bon de commande introuvable');
    return autoCropScanPages(scan, replaceOrderScanPage, 'Bon de commande');
  },
  async autoCropOrderPage(id, pageId) {
    const scan = (state.scannedOrders || []).find(x => x.id === id);
    const page = scanPages(scan || {}).find(item => item.id === pageId);
    if (!scan || !page || !isImageScanPage(page)) return toast('Page image introuvable');
    toast('Rognage automatique en cours…');
    try {
      const fileData = await autoCropImageDataUrl(page.fileData);
      replaceOrderScanPage(id, pageId, { fileData, fileType: 'image/jpeg' });
      closeModal();
      toast('Page rognée automatiquement');
    } catch (error) {
      console.error(error);
      toast('Rognage automatique impossible pour cette page');
    }
  },
  openOrderPageCrop(id, pageId) {
    const scan = (state.scannedOrders || []).find(x => x.id === id);
    const page = scanPages(scan || {}).find(item => item.id === pageId);
    if (!scan || !page || !isImageScanPage(page)) return toast('Page image introuvable');
    openModal('Rogner la page du bon de commande', cropModalHtml(page), async () => {
      try {
        const fileData = await cropImageDataUrl(page.fileData, cropValuesFromModal());
        replaceOrderScanPage(id, pageId, { fileData, fileType: 'image/jpeg' });
        closeModal();
        toast('Page rognée');
      } catch (error) {
        console.error(error);
        toast('Impossible de rogner cette page');
      }
    });
    bindCropPreview(page.fileData);
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
    if (effectiveDocType === 'temperature') {
      pendingReceiptScan = { date, type: effectiveType, docType: effectiveDocType };
      const input = document.querySelector('#receiptScanInput');
      if (!input) return toast('Impossible d’ouvrir la numérisation');
      input.click();
      return;
    }
    return openMultiPhotoScanner('receipt', { date, type: effectiveType, docType: effectiveDocType });
  },
  triggerReceiptImport(date, type, docType = 'delivery') {
    const effectiveDocType = docType || 'delivery';
    const effectiveType = receiptScanScopeType(type || 'delivery', effectiveDocType);
    if (!date || (!effectiveType && effectiveDocType !== 'temperature')) return toast('Choisis une date et un type de livraison');
    pendingReceiptScan = { date, type: effectiveType, docType: effectiveDocType };
    const input = document.querySelector('#receiptImportInput');
    if (!input) return toast('Impossible d’ouvrir l’import de pages');
    input.click();
  },
  triggerManualReceiptScan() {
    const target = getManualReceiptTarget();
    return actions.triggerReceiptScan(target.date, target.type, target.docType);
  },
  triggerManualReceiptImport() {
    const target = getManualReceiptTarget();
    return actions.triggerReceiptImport(target.date, target.type, target.docType);
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
            ${isImage ? `<button type="button" class="small secondary" data-action="openReceiptPageCrop" data-id="${scan.id}" data-type="${page.id}">Rogner manuel</button>` : ''}
            <button type="button" class="small danger-soft" data-action="deleteScannedReceiptPage" data-id="${scan.id}" data-type="${page.id}">Supprimer cette page</button>
          </div>
        </section>
      `;
    }).join('') || '<p class="muted">Aucune page enregistrée.</p>';
    openModal(`${receiptDocLabel(scan.docType)} · ${scanTypeLabel}`, `
      <div class="scan-modal-content">
        <p><strong>Date :</strong> ${escapeHtml(formatDateFr(scan.date))}<br><strong>Type :</strong> ${escapeHtml(scanTypeLabel)}<br><strong>Document :</strong> ${escapeHtml(receiptDocLabel(scan.docType))}<br><strong>Nombre de pages :</strong> ${pages.length}</p>
        <div class="form-actions">
          <button type="button" data-action="downloadScannedReceiptPdf" data-id="${scan.id}" class="success">Télécharger PDF multipage</button>
          <button type="button" id="modalCancel" class="secondary">Fermer</button>
        </div>
        <div class="scan-pages-list">${previews}</div>
      </div>
    `, () => {});
  },
  downloadScannedReceiptPdf(id) {
    const scan = (state.scannedReceipts || []).find(x => x.id === id);
    const scanTypeLabel = scan?.docType === 'temperature' ? 'livraison complète' : receiptTypeLabel(scan?.type);
    const title = scan ? `${receiptDocLabel(scan.docType)} ${scanTypeLabel} ${formatDateFr(scan.date)}` : 'Document de livraison';
    return downloadScanAsPdf(scan, 'receipt', title);
  },
  openScannedReceiptPdf(id) {
    const scan = (state.scannedReceipts || []).find(x => x.id === id);
    const scanTypeLabel = scan?.docType === 'temperature' ? 'livraison complète' : receiptTypeLabel(scan?.type);
    const title = scan ? `${receiptDocLabel(scan.docType)} ${scanTypeLabel} ${formatDateFr(scan.date)}` : 'Document de livraison';
    return openScanPdf(scan, 'receipt', title);
  },
  async autoCropAllReceiptPages(id) {
    const scan = (state.scannedReceipts || []).find(x => x.id === id);
    if (!scan) return toast('Document de livraison introuvable');
    return autoCropScanPages(scan, replaceReceiptScanPage, receiptDocLabel(scan.docType));
  },
  async autoCropReceiptPage(id, pageId) {
    const scan = (state.scannedReceipts || []).find(x => x.id === id);
    const page = scanPages(scan || {}).find(item => item.id === pageId);
    if (!scan || !page || !isImageScanPage(page)) return toast('Page image introuvable');
    toast('Rognage automatique en cours…');
    try {
      const fileData = await autoCropImageDataUrl(page.fileData);
      replaceReceiptScanPage(id, pageId, { fileData, fileType: 'image/jpeg' });
      closeModal();
      toast('Page rognée automatiquement');
    } catch (error) {
      console.error(error);
      toast('Rognage automatique impossible pour cette page');
    }
  },
  openReceiptPageCrop(id, pageId) {
    const scan = (state.scannedReceipts || []).find(x => x.id === id);
    const page = scanPages(scan || {}).find(item => item.id === pageId);
    if (!scan || !page || !isImageScanPage(page)) return toast('Page image introuvable');
    openModal('Rogner la page du document', cropModalHtml(page), async () => {
      try {
        const fileData = await cropImageDataUrl(page.fileData, cropValuesFromModal());
        replaceReceiptScanPage(id, pageId, { fileData, fileType: 'image/jpeg' });
        closeModal();
        toast('Page rognée');
      } catch (error) {
        console.error(error);
        toast('Impossible de rogner cette page');
      }
    });
    bindCropPreview(page.fileData);
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
  openInventoryListManager() {
    inventorySubPage = 'manageLists';
    inventoryFocusMode = false;
    render();
  },
  loadInventoryListManagerSlot() {
    const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
    const def = inventorySlotDefinition(slot);
    selectedInventorySlot = { date: dateForInventorySlot(slot), type: def.type };
    inventorySubPage = 'manageLists';
    render();
  },
  saveInventoryListOrder() {
    const slot = document.querySelector('#inventoryListSlot')?.value || inventorySlotKey(selectedInventorySlot?.date, selectedInventorySlot?.type) || 'monday_general';
    document.querySelectorAll('[data-inventory-list-order]').forEach(input => {
      setProductInventoryOrder(input.dataset.inventoryListOrder, slot, Number(input.value || 0));
    });
    const duplicates = inventorySlotDuplicateOrders(slot);
    saveState();
    render();
    toast(duplicates.length ? 'Ordre enregistré, mais doublon détecté' : 'Ordre enregistré');
  },
  normalizeInventoryListOrder() {
    const slot = document.querySelector('#inventoryListSlot')?.value || inventorySlotKey(selectedInventorySlot?.date, selectedInventorySlot?.type) || 'monday_general';
    productsForInventorySlot(slot).forEach((product, index) => setProductInventoryOrder(product.id, slot, index + 1));
    saveState();
    render();
    toast('Liste renumérotée');
  },
  resetInventoryListDefaultOrder() {
    const slot = document.querySelector('#inventoryListSlot')?.value || inventorySlotKey(selectedInventorySlot?.date, selectedInventorySlot?.type) || 'monday_general';
    if (!confirm('Remettre l’ordre d’origine du bon de commande pour cette liste ?')) return;
    productsForInventorySlot(slot, true).forEach((product, index) => {
      const defaultOrder = defaultInventoryOrder(product.sku, slot);
      setProductInventoryOrder(product.id, slot, defaultOrder || index + 1);
    });
    saveState();
    render();
    toast('Ordre d’origine rétabli');
  },
  addProductToInventoryList() {
    const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
    const productId = document.querySelector('#inventoryListAddProduct')?.value;
    const product = getProduct(productId);
    if (!product) return toast('Choisis un produit à ajouter');
    const requestedOrder = Number(document.querySelector('#inventoryListAddOrder')?.value || 0);
    const order = requestedOrder > 0 ? requestedOrder : productsForInventorySlot(slot).length + 1;
    ensureProductInInventorySlot(product, slot, order);
    saveState();
    render();
    toast('Produit ajouté à la liste');
  },
  removeProductFromInventoryList(productId) {
    const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
    const product = getProduct(productId);
    if (!product) return;
    if (!confirm(`Retirer "${product.name}" uniquement de cette liste d’inventaire ?`)) return;
    product.inventorySlots = productInventorySlots(product).filter(item => item !== slot);
    if (product.inventoryOrders) delete product.inventoryOrders[slot];
    saveState();
    render();
    toast('Produit retiré de cette liste');
  },
  moveInventoryListProduct(productId, direction) {
    const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
    const rows = productsForInventorySlot(slot);
    const index = rows.findIndex(product => product.id === productId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= rows.length) return;
    rows.forEach((product, i) => setProductInventoryOrder(product.id, slot, i + 1));
    setProductInventoryOrder(rows[index].id, slot, targetIndex + 1);
    setProductInventoryOrder(rows[targetIndex].id, slot, index + 1);
    saveState();
    render();
  },
  appendInventoryImportList() {
    const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
    applyImportedInventoryList(slot, 'append');
  },
  replaceInventoryImportList() {
    const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
    applyImportedInventoryList(slot, 'replace');
  },
  startInventoryPhotoScan() {
    const slot = document.querySelector('#inventoryListSlot')?.value || 'monday_general';
    return openMultiPhotoScanner('inventory', { slot });
  },
  triggerInventoryPhotoImport() {
    document.querySelector('#inventoryOcrInput')?.click();
  },
  triggerInventoryPdfImport() {
    document.querySelector('#inventoryPdfInput')?.click();
  },
  clearInventoryPdfImport() {
    inventoryPdfImportDraft = { status: 'idle', slot: '', fileName: '', lines: [], exact: [], replacements: [], newItems: [], missing: [], message: '' };
    render();
  },
  applyInventoryPdfImport() {
    applyInventoryPdfImport();
  },
  clearInventoryPhotoOcr() {
    inventoryPhotoOcrDraft = { status: 'idle', progress: 0, message: '', pages: [], text: '', matched: 0, unknown: 0 };
    render();
  },
  appendInventoryOcrList() {
    applyInventoryOcrList('append');
  },
  replaceInventoryOcrList() {
    applyInventoryOcrList('replace');
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
    pendingInventoryScrollTarget = captureInventoryScrollTarget(current.id, direction);
    saveState();
    render();
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
    const deliveryTiming = document.querySelector('#inventoryBeforeDelivery')?.checked ? 'before' : (document.querySelector('#inventoryAfterDelivery')?.checked ? 'after' : '');
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
      deliveryTiming,
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
  exportCurrentInventoryPdf() {
    const date = document.querySelector('#inventoryDate')?.value || selectedInventorySlot?.date || today();
    const type = document.querySelector('#inventoryType')?.value || selectedInventorySlot?.type || 'general';
    const deliveryTiming = document.querySelector('#inventoryBeforeDelivery')?.checked ? 'before' : (document.querySelector('#inventoryAfterDelivery')?.checked ? 'after' : '');
    const rows = productsForInventory(type, date).map((product, index) => {
      const countRaw = document.querySelector(`[data-count="${product.id}"]`)?.value || '';
      const note = document.querySelector(`[data-inventory-note="${product.id}"]`)?.value || '';
      return {
        order: index + 1,
        name: product.name || '',
        category: productCategoryLabel(product),
        zone: getZone(product.storageZoneId)?.name || product.storageLabel || '',
        packageSize: product.packageSize || '',
        expectedQty: stockByProductExcludingSession(product.id, getInventorySession(date, type)?.id || ''),
        countedQty: countRaw,
        unit: product.unit || '',
        note
      };
    });
    printInventoryPdf(date, type, rows, deliveryTiming);
  },
  exportInventorySessionPdf(id) {
    const session = state.inventorySessions.find(s => s.id === id);
    if (!session) return toast('Inventaire introuvable');
    const rows = (session.lines || []).map((line, index) => {
      const product = getProduct(line.productId) || {};
      return {
        order: index + 1,
        name: product.name || 'Produit supprimé',
        category: productCategoryLabel(product),
        zone: getZone(product.storageZoneId)?.name || product.storageLabel || '',
        packageSize: product.packageSize || '',
        expectedQty: line.expectedQty,
        countedQty: line.countedQty,
        unit: line.unit || product.unit || '',
        note: line.note || ''
      };
    });
    printInventoryPdf(session.date, session.type, rows, session.deliveryTiming);
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
  createBackupNow() {
    createBackup('Sauvegarde manuelle');
    render();
  },
  restoreBackup(id) {
    const backup = loadBackups().find(item => item.id === id);
    if (!backup) return toast('Backup introuvable');
    const label = backup.createdAt ? new Date(backup.createdAt).toLocaleString('fr-FR') : backup.label || 'backup';
    if (!confirm(`Restaurer le backup du ${label} ?\n\nLes données actuelles seront remplacées, mais un backup de sécurité sera créé avant la restauration.`)) return;
    createBackup('Avant restauration', { silent: true });
    try {
      state = normalizeState(backup.snapshot || {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      saveState();
      renderNav();
      render();
      toast('Backup restauré');
    } catch (error) {
      console.error(error);
      toast('Restauration impossible');
    }
  },
  downloadBackup(id) {
    const backup = loadBackups().find(item => item.id === id);
    if (!backup) return toast('Backup introuvable');
    const safeDate = String(backup.createdAt || today()).slice(0, 19).replace(/[:T]/g, '-');
    downloadBlob(new Blob([JSON.stringify({ backup: { ...backup, snapshot: undefined }, snapshot: backup.snapshot }, null, 2)], { type: 'application/json' }), `backup-stock-${safeDate}.json`);
  },
  deleteBackup(id) {
    if (!confirm('Supprimer ce point de restauration ?')) return;
    const backups = loadBackups().filter(item => item.id !== id);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups));
    render();
    toast('Backup supprimé');
  },
  syncFromCloud() { syncFromCloud(); },
  syncToCloud() { syncToCloudNow(); },
  exportJson() { downloadJson(); },
  async exportWeeklyReportPdf() {
    const weekStart = startOfWeekInput(document.querySelector('[data-report-week]')?.value || selectedReportWeek || today());
    selectedReportWeek = weekStart;
    await printWeeklyReportPdf(weekStart);
  },
  exportCsv(_id, type) { downloadCsv(type || _id); }
};

function downloadJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `sauvegarde-stock-${today()}.json`);
}


function inventoryPdfTitle(date, type) {
  return `Inventaire ${inventoryTypeLabel(type)} - ${formatDateFr(date)}`;
}

function printInventoryPdf(date, type, rows, deliveryTiming = '') {
  const printedAt = new Date().toLocaleString('fr-FR');
  const title = inventoryPdfTitle(date, type);
  const timingLabel = inventoryDeliveryTimingLabel(deliveryTiming);
  const rowsHtml = rows.map(line => `
    <tr>
      <td>${escapeHtml(line.order ?? '')}</td>
      <td><strong>${escapeHtml(line.name || '')}</strong>${line.archivedKeptForMonth ? ' <span>(archivé conservé ce mois)</span>' : ''}<br><span>${escapeHtml(line.packageSize || '')}</span></td>
      <td>${escapeHtml(line.category || '')}</td>
      <td>${escapeHtml(line.zone || '')}</td>
      <td>${number(line.expectedQty)}</td>
      <td>${escapeHtml(line.countedQty ?? '')}</td>
      <td>${escapeHtml(line.unit || '')}</td>
      <td>${escapeHtml(line.note || '')}</td>
    </tr>
  `).join('') || '<tr><td colspan="8">Aucun produit à exporter.</td></tr>';
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
    .timing { display: inline-block; margin-top: 6px; padding: 3px 8px; border: 1px solid #111827; border-radius: 999px; font-size: 11px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th, td { border: 1px solid #d1d5db; padding: 4px 5px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .03em; }
    td:nth-child(1), td:nth-child(5), td:nth-child(6), td:nth-child(7) { text-align: center; }
    td:nth-child(1) { width: 38px; }
    td:nth-child(2) { width: 260px; }
    td:nth-child(5), td:nth-child(6) { width: 70px; }
    td:nth-child(7) { width: 50px; }
    span { color: #6b7280; }
    footer { margin-top: 8px; font-size: 10px; color: #6b7280; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">${escapeHtml(rows.length)} produit(s) · ${escapeHtml(inventoryTypeLabel(type))}</p>
      <div class="timing">${escapeHtml(timingLabel)}</div>
    </div>
    <div class="meta">
      <strong>${escapeHtml(state.settings.companyName || 'Gestion Stock')}</strong><br>
      Exporté le ${escapeHtml(printedAt)}<br>
      Date inventaire : ${escapeHtml(date)}
    </div>
  </header>
  <table>
    <thead><tr><th>Ordre</th><th>Produit</th><th>Catégorie</th><th>Zone</th><th>Théorique</th><th>Compté</th><th>Unité</th><th>Note</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <footer>Export PDF généré depuis la page Inventaire.</footer>
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
  return productsForMonthEnd(month)
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
        note: readValue('note'),
        archivedKeptForMonth: archivedProductKeptForMonthEnd(product, month)
      };
    });
}

function printMonthEndPdf(title, rows, subtitle = '') {
  const printedAt = new Date().toLocaleString('fr-FR');
  const rowsHtml = rows.map(line => `
    <tr>
      <td>${escapeHtml(line.order ?? '')}</td>
      <td>${escapeHtml(line.sku || '')}</td>
      <td><strong>${escapeHtml(line.name || '')}</strong>${line.archivedKeptForMonth ? ' <span>(archivé conservé ce mois)</span>' : ''}<br><span>${escapeHtml(line.packageSize || '')}</span></td>
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

function weeklyReportInventorySectionHtml(date) {
  const sessions = state.inventorySessions
    .filter(session => session.date === date)
    .sort((a, b) => String(a.type).localeCompare(String(b.type)));
  if (!sessions.length) return '<p class="muted-text">Aucun inventaire enregistré pour cette date.</p>';
  return sessions.map(session => {
    const rows = (session.lines || []).map(line => {
      const product = getProduct(line.productId) || {};
      return `
        <tr>
          <td>${escapeHtml(product.name || 'Produit supprimé')}</td>
          <td>${escapeHtml(productCategoryLabel(product))}</td>
          <td>${escapeHtml(getZone(product.storageZoneId)?.name || product.storageLabel || '')}</td>
          <td>${number(line.expectedQty)}</td>
          <td>${number(line.countedQty)}</td>
          <td>${number(line.diff)}</td>
          <td>${escapeHtml(line.unit || product.unit || '')}</td>
          <td>${escapeHtml(line.note || '')}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="8">Aucune ligne.</td></tr>';
    return `
      <h4>Inventaire ${escapeHtml(inventoryTypeLabel(session.type))} · ${escapeHtml(inventoryDeliveryTimingLabel(session.deliveryTiming))}</h4>
      <table class="compact-table">
        <thead><tr><th>Produit</th><th>Catégorie</th><th>Zone</th><th>Théorique</th><th>Compté</th><th>Écart</th><th>Unité</th><th>Note</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }).join('');
}

function weeklyReportScansForDate(date) {
  const docs = [];
  inventoryTypesForDate(date).forEach(type => docs.push({ kind: 'order', label: `BC ${orderTypeLabel(type)}`, scan: getScannedOrder(date, type) }));
  receiptTypesForDate(date).forEach(type => docs.push({ kind: 'receipt', label: `BL ${receiptTypeLabel(type)}`, scan: getScannedReceipt(date, type, 'delivery') }));
  docs.push({ kind: 'receipt', label: 'Ticket température', scan: getScannedReceipt(date, 'delivery', 'temperature') });
  return docs;
}

function weeklyReportDocumentActionHtml(item, linkMap = null) {
  if (!item.scan) return '<span class="muted">-</span>';
  const fileName = scanPdfFileName(item.scan, item.kind || 'document');
  const href = linkMap?.[item.scan.id] || '';
  if (href) {
    return `<a class="doc-pdf-link" href="${escapeHtml(href)}" target="_blank" download="${escapeHtml(fileName)}">Ouvrir PDF</a>`;
  }
  const action = item.kind === 'order' ? 'openScannedOrderPdf' : 'openScannedReceiptPdf';
  return `<button type="button" class="small secondary report-doc-link" data-action="${action}" data-id="${escapeHtml(item.scan.id)}">Ouvrir PDF</button>`;
}

function weeklyReportDocumentSummaryHtml(date, linkMap = null) {
  return weeklyReportScansForDate(date).map(item => {
    const pages = scanPages(item.scan || {});
    return `<tr><td>${escapeHtml(item.label)}</td><td>${item.scan ? 'Présent' : 'Manquant'}</td><td>${pages.length || '-'}</td><td>${escapeHtml(pages.map(page => page.fileName || '').filter(Boolean).join(' | ') || '-')}</td><td>${weeklyReportDocumentActionHtml(item, linkMap)}</td></tr>`;
  }).join('');
}

function weeklyReportLinkedDocumentsHtml(date) {
  return `
    <div class="report-day-documents">
      <h4>${escapeHtml(dayNames[parseDate(date).getDay()])} ${escapeHtml(formatDateFr(date))}</h4>
      <div class="table-wrap compact-table"><table><thead><tr><th>Document</th><th>État</th><th>Pages</th><th>Fichier(s)</th><th>PDF lié</th></tr></thead><tbody>${weeklyReportDocumentSummaryHtml(date)}</tbody></table></div>
    </div>
  `;
}

function weeklyReportDocumentPagesHtml(date, linkMap = null) {
  return weeklyReportScansForDate(date).map(item => {
    if (!item.scan) return `<div class="doc-block missing"><strong>${escapeHtml(item.label)}</strong><br>Document manquant.</div>`;
    const pages = scanPages(item.scan);
    const docLink = weeklyReportDocumentActionHtml(item, linkMap);
    if (!pages.length) return `<div class="doc-block missing"><strong>${escapeHtml(item.label)}</strong><br>Aucune page conservée.</div>`;
    return pages.map((page, index) => {
      const title = `${item.label} · page ${index + 1}/${pages.length}`;
      if (isImageScanPage(page)) {
        return `<div class="doc-page"><div class="doc-title">${escapeHtml(title)} <span class="doc-title-link">${docLink}</span></div><img src="${escapeHtml(page.fileData)}" alt="${escapeHtml(title)}" /></div>`;
      }
      return `<div class="doc-block"><strong>${escapeHtml(title)}</strong><br>Fichier importé : ${escapeHtml(page.fileName || 'document PDF')}<br>${docLink}</div>`;
    }).join('');
  }).join('');
}

async function buildWeeklyReportLinkMap(dates) {
  const map = {};
  const unique = new Map();
  dates.forEach(date => weeklyReportScansForDate(date).forEach(item => {
    if (item.scan?.id) unique.set(item.scan.id, item);
  }));
  for (const item of unique.values()) {
    try {
      const title = item.kind === 'order'
        ? `Bon de commande ${orderTypeLabel(item.scan.type)} ${formatDateFr(item.scan.date)}`
        : `${receiptDocLabel(item.scan.docType)} ${item.scan.docType === 'temperature' ? 'livraison complète' : receiptTypeLabel(item.scan.type)} ${formatDateFr(item.scan.date)}`;
      const url = await getScanPdfUrl(item.scan, item.kind, title);
      if (url) map[item.scan.id] = url;
    } catch (error) {
      console.error(error);
    }
  }
  return map;
}

async function printWeeklyReportPdf(weekStart) {
  const normalizedWeekStart = startOfWeekInput(weekStart || today());
  const dates = weekDeliveryDates(normalizedWeekStart);
  toast('Préparation des liens PDF…');
  const linkMap = await buildWeeklyReportLinkMap(dates);
  const printedAt = new Date().toLocaleString('fr-FR');
  const title = `Rapport hebdomadaire - semaine du ${formatDateFr(normalizedWeekStart)}`;
  const summaryRows = dates.map(date => weeklyReportDaySummary(date)).map(row => `
    <tr>
      <td><strong>${escapeHtml(formatDateFr(row.date))}</strong><br><span>${escapeHtml(row.date)}</span></td>
      <td>${escapeHtml(row.dayName)}</td>
      <td>${row.inventoryLabel}</td>
      <td>${row.orderLabel}</td>
      <td>${row.receiptLabel}</td>
      <td>${escapeHtml(row.temperatureLabel)}</td>
      <td>${escapeHtml(row.rateLabel)}</td>
    </tr>
  `).join('');
  const daySections = dates.map(date => `
    <section class="day-section">
      <h2>${escapeHtml(formatDateFr(date))}</h2>
      <div class="rate-box"><strong>Taux de modification commandes :</strong> ${escapeHtml(orderModificationRatesForDate(date))}</div>
      <h3>Inventaires</h3>
      ${weeklyReportInventorySectionHtml(date)}
      <h3>Documents BC / BL / ticket température</h3>
      <table class="compact-table"><thead><tr><th>Document</th><th>État</th><th>Pages</th><th>Fichier(s)</th><th>PDF lié</th></tr></thead><tbody>${weeklyReportDocumentSummaryHtml(date, linkMap)}</tbody></table>
      <div class="document-pages">${weeklyReportDocumentPagesHtml(date, linkMap)}</div>
    </section>
  `).join('');
  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; font-size: 11px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 17px; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #111827; }
    h3 { font-size: 14px; margin: 12px 0 6px; }
    h4 { font-size: 12px; margin: 10px 0 4px; }
    .meta { font-size: 10px; color: #4b5563; text-align: right; }
    .subtitle, span, .muted-text { color: #6b7280; }
    .rate-box { border: 1px solid #d1d5db; border-radius: 8px; padding: 7px; background: #f9fafb; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 4px 5px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; text-transform: uppercase; letter-spacing: .03em; font-size: 9px; }
    .compact-table { font-size: 9px; }
    .day-section { page-break-before: always; }
    .day-section:first-of-type { page-break-before: auto; }
    .document-pages { display: grid; gap: 10px; }
    .doc-page { page-break-inside: avoid; border: 1px solid #d1d5db; border-radius: 8px; padding: 6px; margin-top: 8px; }
    .doc-page img { display: block; max-width: 100%; max-height: 245mm; margin: 4px auto 0; object-fit: contain; }
    .doc-title { font-weight: 700; margin-bottom: 4px; }
    .doc-title-link { float: right; font-weight: 400; }
    .doc-pdf-link { color: #1d4ed8; font-weight: 700; text-decoration: underline; }
    .doc-block { border: 1px dashed #9ca3af; border-radius: 8px; padding: 8px; margin-top: 8px; background: #f9fafb; }
    .missing { color: #92400e; background: #fffbeb; }
    footer { margin-top: 8px; font-size: 10px; color: #6b7280; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">Trois jours de livraison : lundi, mercredi, vendredi</p>
    </div>
    <div class="meta">
      <strong>${escapeHtml(state.settings.companyName || 'Gestion Stock')}</strong><br>
      Exporté le ${escapeHtml(printedAt)}<br>
      Version ${escapeHtml(APP_VERSION)}
    </div>
  </header>
  <h2>Synthèse semaine</h2>
  <table>
    <thead><tr><th>Date</th><th>Jour</th><th>Inventaires</th><th>BC</th><th>BL</th><th>Ticket température</th><th>Taux modification</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>
  ${daySections}
  <footer>Rapport hebdomadaire généré depuis la page Rapports.</footer>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 350));</script>
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
      reference: p.sku, produit: p.name, sequence: productSequenceValue(p), zone_stockage: productCategoryLabel(p), conditionnement: p.packageSize || '', planning_inventaire: productInventorySlots(p).map(inventorySlotLabel).join(', '), ordres_inventaire: productInventorySlots(p).map(slot => `${inventorySlotLabel(slot)}=${productInventoryOrder(p, slot)}`).join(', '), unite: p.unit, stock: stockByProduct(p.id), stock_min: p.minStock, stock_max: p.maxStock,
      zone: getZone(p.storageZoneId)?.name || '', fournisseur: getSupplier(p.supplierId)?.name || '', prix_dernier_achat: p.lastPrice || 0, actif: p.active !== false ? 'oui' : 'non', archive_le: p.archivedAt || '', conserve_fin_de_mois: p.monthEndKeepMonth || ''
    })),
    lowStock: state.products.filter(p => stockByProduct(p.id) <= Number(p.minStock || 0)).map(p => ({ produit: p.name, stock: stockByProduct(p.id), stock_min: p.minStock, zone: getZone(p.storageZoneId)?.name || '' })),
    orders: state.orders.map(o => ({ reference: o.ref, date: o.date, fournisseur: getSupplier(o.supplierId)?.name || '', date_prevue: o.expectedDate, statut: o.status, lignes: (o.lines || []).length })),
    scanned_orders: (state.scannedOrders || []).map(s => ({ date: s.date, jour: s.dayName, type: orderTypeLabel(s.type), pages: scanPageCount(s), fichiers: scanPages(s).map(p => p.fileName).join(' | '), numerise_le: s.scannedAt })),
    scanned_receipts: (state.scannedReceipts || []).map(s => ({ date: s.date, jour: s.dayName, type: receiptTypeLabel(s.type), document: receiptDocLabel(s.docType), pages: scanPageCount(s), fichiers: scanPages(s).map(p => p.fileName).join(' | '), numerise_le: s.scannedAt })),
    receipts: state.receipts.map(r => ({ reference: r.ref, date: r.date, fournisseur: getSupplier(r.supplierId)?.name || '', commande: state.orders.find(o => o.id === r.orderId)?.ref || '', lignes: (r.lines || []).length, note: r.note })),
    movements: state.movements.map(m => ({ date: m.date, type: m.type, produit: getProduct(m.productId)?.name || '', quantite: m.qty, depuis: getZone(m.fromZoneId)?.name || '', vers: getZone(m.toZoneId)?.name || '', lot: m.batch, dlc: m.dlc, note: m.note })),
    inventories: state.inventorySessions.flatMap(s => (s.lines || []).map(line => ({ date: s.date, jour: s.dayName, type: inventoryTypeLabel(s.type), moment: inventoryDeliveryTimingLabel(s.deliveryTiming), reference: getProduct(line.productId)?.sku || '', produit: getProduct(line.productId)?.name || '', conditionnement: getProduct(line.productId)?.packageSize || '', stock_theorique: line.expectedQty, quantite_comptee: line.countedQty, ecart: line.diff, unite: line.unit, note: line.note, archive_conserve_ce_mois: line.archivedKeptForMonth ? 'oui' : '' }))),
    monthEnd: (state.monthEndSessions || []).flatMap(s => (s.lines || []).map(line => ({ mois: s.month, ordre_tri: line.order, reference: line.sku, produit: line.name, categorie: line.category, zone: line.zone, conditionnement: line.packageSize, ue: line.ue, su: line.su, uu: line.uu, note: line.note, archive_conserve_ce_mois: line.archivedKeptForMonth ? 'oui' : '' }))),
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
  createBackup('Avant réinitialisation', { silent: true });
  state = ensureInventoryCatalog(defaultState());
  orderDraft = [];
  receiptDraft = [];
  saveState(); render(); toast('Application réinitialisée');
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const data = parsed.snapshot || parsed.state || parsed.backup?.snapshot || parsed;
      createBackup('Avant import JSON', { silent: true });
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
      ensureDailyAutoBackup();
      toast('Données chargées depuis Supabase');
    } else {
      await saveCloudState();
      ensureDailyAutoBackup();
      toast('Cloud Supabase initialisé');
    }
  } else {
    ensureDailyAutoBackup();
    toast('Mode local : Supabase non configuré');
  }
}

initializeApp();
