import { writeFileSync, mkdirSync } from 'node:fs';
import { cropsData } from '../src/data.js';

// Exact species and visible subjects; never substitute an unrelated stock photo.
const subjects = {
  rice: ['Oryza sativa', 'rice nursery seedlings', 'rice transplanting', 'rice flowering panicle', 'ripe rice panicles'],
  wheat: ['Triticum aestivum', 'wheat seeds', 'wheat seedlings', 'wheat tillering', 'wheat stem elongation', 'wheat flowering', 'ripe wheat ears'],
  maize: ['Zea mays', 'maize seedlings', 'maize young plants', 'maize tassel silk', 'maize green cob', 'maize harvest'],
  barley: ['Hordeum vulgare', 'barley seeds', 'barley young plants', 'barley green field', 'barley ripe ears'],
  millet: ['Cenchrus americanus', 'pearl millet seeds', 'pearl millet field', 'pearl millet panicle', 'pearl millet grain'],
  sorghum: ['Sorghum bicolor', 'sorghum seeds', 'sorghum plants', 'sorghum flowering', 'sorghum ripe panicle'],
  tomato: ['Solanum lycopersicum fruit', 'tomato seedlings', 'tomato plants stakes', 'tomato flowers', 'ripe tomatoes plant'],
  onion: ['Allium cepa bulbs', 'onion seedlings', 'onion young plants', 'onion growing bulbs', 'onion harvest'],
  potato: ['potato tubers', 'seed potatoes sprouting', 'potato young plants', 'potato tubers plant', 'potato harvest'],
  capsicum: ['bell pepper plant', 'pepper seedlings', 'Capsicum annuum plant', 'Capsicum annuum flower', 'bell peppers'],
  spinach: ['Spinacia oleracea', 'spinach seeds', 'spinach seedlings', 'spinach growing', 'spinach leaves'],
  cabbage: ['cabbage heads', 'cabbage seedlings', 'cabbage young plants', 'cabbage growing head', 'cabbage harvest'],
  garlic: ['Allium sativum bulbs', 'garlic cloves', 'garlic sprouting', 'garlic plants', 'garlic harvest'],
  chickpea: ['Cicer arietinum pods', 'chickpea seeds', 'Cicer arietinum plants', 'Cicer arietinum flowers', 'Cicer arietinum pods'],
  lentil: ['Lens culinaris seeds', 'lentil seeds', 'Lens culinaris plant', 'Lens culinaris flower', 'lentil dry seeds'],
  soybean: ['Glycine max pods', 'soybean seeds', 'Glycine max plant', 'Glycine max flowers', 'soybean mature pods'],
  moong: ['Vigna radiata pods', 'mung bean seeds', 'Vigna radiata plant', 'Vigna radiata flowers', 'Vigna radiata pods'],
  sugarcane: ['Saccharum officinarum', 'sugarcane cuttings', 'sugarcane sprouting', 'sugarcane young plants', 'sugarcane field', 'sugarcane stems', 'sugarcane harvest'],
  cotton: ['Gossypium hirsutum cotton bolls', 'cotton seeds', 'Gossypium hirsutum plant', 'Gossypium hirsutum flower', 'cotton open bolls'],
  tobacco: ['Nicotiana tabacum', 'tobacco seedlings', 'tobacco field', 'tobacco curing'],
  turmeric: ['Curcuma longa rhizomes', 'turmeric rhizomes', 'turmeric sprouting', 'Curcuma longa plants', 'turmeric rhizomes roots', 'turmeric harvest'],
  ginger: ['Zingiber officinale rhizomes', 'ginger rhizome', 'ginger sprouting', 'Zingiber officinale plant', 'ginger harvest'],
  chili: ['Capsicum annuum red chili', 'chili seedlings', 'chili pepper plant', 'chili pepper flower', 'red chili peppers'],
  coriander: ['Coriandrum sativum leaves', 'coriander seeds', 'coriander plant leaves', 'Coriandrum sativum flowers', 'coriander dried seeds'],
  mustard: ['Brassica juncea flowers', 'mustard seeds', 'Brassica juncea plant', 'Brassica juncea flowers', 'Brassica juncea pods'],
  sunflower: ['Helianthus annuus flower', 'sunflower seeds', 'sunflower young plants', 'sunflower flowering', 'sunflower seed head mature'],
  groundnut: ['Arachis hypogaea pods', 'peanut seeds', 'Arachis hypogaea plants', 'Arachis hypogaea pegs', 'groundnut harvest'],
  mango: ['Mangifera indica fruits', 'mango sapling', 'mango tree fruit', 'mango flowers', 'mango fruits tree'],
  banana: ['Musa banana bunch', 'banana suckers', 'banana young plants', 'banana inflorescence', 'banana bunch'],
  citrus: ['Citrus sinensis fruit tree', 'orange tree sapling', 'orange tree fruit', 'Citrus sinensis flowers', 'oranges tree'],
  guava: ['Psidium guajava fruits', 'guava sapling', 'guava fruits tree', 'guava orchard'],
  grapes: ['Vitis vinifera grapes', 'grapevine young plant', 'grapevine pruning', 'Vitis vinifera flowers', 'ripe grape bunch'],
  papaya: ['Carica papaya fruit tree', 'papaya seedlings', 'papaya young plants', 'papaya flowers', 'papaya fruits tree'],
  coconut: ['Cocos nucifera nuts', 'coconut seedling', 'young coconut palm', 'coconut inflorescence', 'coconut fruits palm'],
  coffee: ['Coffea arabica cherries', 'coffee seedlings', 'coffee cherries plant', 'Coffea arabica flowers', 'coffee ripe cherries'],
  arecanut: ['Areca catechu fruits', 'Areca catechu seedlings', 'Areca catechu fruits', 'Areca catechu plantation'],
  rubber: ['Hevea brasiliensis latex tapping', 'Hevea brasiliensis plantation', 'rubber tree tapping', 'rubber latex collection'],
  aloevera: ['Aloe vera plant', 'Aloe vera offsets', 'Aloe vera plant', 'Aloe vera leaves', 'Aloe vera plantation'],
  lemongrass: ['Cymbopogon citratus', 'lemongrass roots', 'Cymbopogon citratus plant', 'lemongrass leaves', 'lemongrass harvested'],
  lavender: ['Lavandula angustifolia flowers', 'lavender young plants', 'lavender plant', 'Lavandula angustifolia flowering', 'lavender harvest'],
  marigold: ['Tagetes erecta flowers', 'marigold seedlings', 'Tagetes erecta plant', 'Tagetes erecta flowers', 'marigold flower harvest'],
  jasmine: ['Jasminum sambac flowers', 'jasmine cuttings', 'Jasminum sambac plant', 'Jasminum sambac flowers', 'jasmine flower harvest'],
  teak: ['Tectona grandis tree', 'teak seedlings', 'teak plantation', 'Tectona grandis trunk', 'teak logs'],
  bamboo: ['Bambusa bamboo culms', 'bamboo shoots', 'bamboo young culms', 'bamboo mature culms', 'bamboo harvest'],
  sandalwood: ['Santalum album tree', 'Santalum album seedlings', 'Santalum album tree', 'Santalum album trunk', 'sandalwood wood'],
  mushroom: ['Pleurotus ostreatus cultivation', 'mushroom straw substrate', 'mushroom spawn bags', 'Pleurotus ostreatus mycelium', 'oyster mushroom pins', 'oyster mushroom cultivation clusters'],
  apple: ['Malus domestica fruit', 'apple young trees orchard', 'apple fruit tree', 'apple blossoms', 'apple harvest'],
  mint: ['Mentha spicata leaves', 'mint cuttings roots', 'Mentha spicata plant', 'mint harvest', 'mint oil distillation'],
};
const plan = cropsData.flatMap(crop => {
  const [cover, ...stages] = subjects[crop.id];
  if (stages.length !== crop.timeline.length) throw new Error(crop.id);
  return [{ key: `${crop.id}-cover`, crop: crop.id, query: cover, label: crop.name }, ...stages.map((query, index) => ({ key: `${crop.id}-${index}`, crop: crop.id, query, label: `${crop.name}: ${crop.timeline[index].stage}` }))];
});
mkdirSync('resources/crop-photos/candidates', { recursive: true });
writeFileSync('resources/crop-photos/plan.json', JSON.stringify(plan, null, 2));
console.log(`${plan.length} crop and stage subjects prepared.`);
