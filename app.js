const app = document.querySelector('#app');
const analytics = window.MyPesAnalytics || { goal() {}, answer() {} };
const donationUrl = 'https://tips.yandex.ru/guest/payment/9472970';

let breedProfiles = [];
let breedProfilesStatus = 'loading';
let breedProfilesError = null;

const breedProfilesReady = fetch('data/breed-profiles.researched-v2.json?v=1')
  .then((response) => {
    if (!response.ok) throw new Error(`Не удалось загрузить базу пород: ${response.status}`);
    return response.json();
  })
  .then((payload) => {
    if (!Array.isArray(payload.profiles)) throw new Error('В базе нет массива profiles');
    breedProfiles = payload.profiles.map((breed) => ({
      ...breed,
      image: `assets/breeds/${breed.breedFamily}.png`
    }));
    window.BREED_PROFILES = breedProfiles;
    breedProfilesStatus = 'ready';
  })
  .catch((error) => {
    breedProfilesError = error;
    breedProfilesStatus = 'error';
  })
  .finally(() => {
    if (app.querySelector('.landing-page')) openSavedRouteOrHome();
  });

function getBreedProfiles() { return breedProfiles; }

const option = (id, label, set, extra = {}) => ({ id, label, ...(set ? { set } : {}), ...extra });
const question = (id, title, options, extra = {}) => ({ id, title, options, ...extra });

// Browser representation of quiz-config-v3.json. Values and IDs are kept verbatim.
const coreQuestions = [
  question('household', 'С кем будет жить собака?', [
    option('adults', 'Взрослые', null, { flags: ['ADULTS_ONLY'] }),
    option('young_children', 'Дети младше 6 лет', null, { flags: ['YOUNG_CHILDREN'] }),
    option('cat', 'Кошка', null, { flags: ['CAT'] }),
    option('dog', 'Другая собака', null, { flags: ['DOG'] }),
    option('small_pets', 'Другие животные', null, { flags: ['SMALL_PETS'] })
  ], { type: 'multi_select', helper: 'Можно выбрать несколько вариантов.' }),
  question('activity', 'Сколько времени вы готовы гулять с собакой каждый день?', [
    option('a1', '30 минут в день', { activity: 1 }), option('a2', 'Около часа', { activity: 2 }),
    option('a3', 'Примерно 1–1,5 часа', { activity: 3 }), option('a4', 'Примерно 1,5–2 часа', { activity: 4 }), option('a5', '2 часа и больше', { activity: 5 })
  ], { helper: 'Представьте обычный холодный будний день, когда вы устали. Выбирайте реальный ритм, а не идеальный.' }),
  question('mental_work', 'Как часто вы хотите заниматься с собакой?', [
    option('m1', 'Хочу заложить основы воспитания в щенячьем возрасте, а дальше заниматься только по необходимости', { mentalWork: 1 }), option('m2', 'Иногда немного поиграть или что-нибудь поучить', { mentalWork: 2 }),
    option('m3', 'По 10–15 минут почти каждый день нормально', { mentalWork: 3 }), option('m4', 'Мне нравится регулярно учить собаку чему-нибудь новому', { mentalWork: 4 }), option('m5', 'Хочу дрессировку, спорт или другие серьёзные занятия', { mentalWork: 5 })
  ], { helper: 'Команды, игры на поиск, обучение новому и другие совместные задачи.' }),
  question('biddability', 'Вы дали собаке команду, но её что-то отвлекло', [
    option('b5', 'После обучения хочу, чтобы она почти всегда быстро реагировала на меня', { biddabilityMin: 5 }), option('b4', 'Хочу хороший контроль, хотя иногда могу повторить команду', { biddabilityMin: 4 }),
    option('b3', 'Нормально, если иногда приходится немного договариваться', { biddabilityMin: 3 }), option('b2', 'Не страшно, если собака нередко сначала делает по-своему', { biddabilityMin: 2 }), option('b1', 'Мне комфортна собака, от которой я не жду особой исполнительности', { biddabilityMin: 1 })
  ]),
  question('independence', 'На прогулке собаку заинтересовал новый запах, но вы зовёте её дальше. Как она отреагирует?', [
    option('i1', 'Хочу, чтобы она сразу переключалась на меня', { independence: 1 }), option('i2', 'Может немного понюхать, но довольно быстро идёт за мной', { independence: 2 }),
    option('i3', 'Мне нравится баланс: иногда за мной, иногда занимается своими делами', { independence: 3 }), option('i4', 'Нормально, если она часто предпочитает сначала закончить свои дела', { independence: 4 }), option('i5', 'Мне нравятся очень самостоятельные собаки', { independence: 5 })
  ]),
  question('recall', 'Представьте безопасное место, где собаку можно отпустить с поводка. Насколько важно, чтобы она вернулась к вам по команде?', [
    option('r5', 'Очень важно: после обучения она должна почти всегда сразу возвращаться', { recallMin: 5 }), option('r4', 'Важно: хочу надёжный отзыв, но редкие задержки допустимы', { recallMin: 4 }),
    option('r3', 'Зависит от места и ситуации: иногда могу подождать', { recallMin: 3 }), option('r2', 'Если отзыв ненадёжный, буду использовать длинный поводок', { recallMin: 2 }), option('r1', 'Не планирую отпускать собаку с поводка', { recallMin: 1 })
  ]),
  question('prey_drive', 'Перед собакой пробежала кошка, как она поведет себя?', [
    option('p1', 'Хочу, чтобы желание преследовать было минимальным', { preyDriveMax: 1 }), option('p2', 'Может заинтересоваться, но должна довольно легко переключаться', { preyDriveMax: 2 }),
    option('p3', 'Может заметно потянуться за ней, если это управляемо', { preyDriveMax: 3 }), option('p4', 'Сильное желание преследовать допустимо, если я могу всё контролировать поводком', { preyDriveMax: 4 }), option('p5', 'Я готов всю жизнь учитывать очень сильное желание преследовать животных', { preyDriveMax: 5 })
  ]),
  question('stranger_friendliness', 'Как ваша собака относится к гостям?', [
    option('sf5', 'Рада познакомиться и легко идёт на контакт', { strangerFriendliness: 5 }), option('sf4', 'Дружелюбна, но без обязательных восторгов', { strangerFriendliness: 4 }),
    option('sf3', 'Нейтральна: спокойно принимает присутствие человека', { strangerFriendliness: 3 }), option('sf2', 'Сначала держится сдержанно и предпочитает дистанцию', { strangerFriendliness: 2 }), option('sf1', 'Мне комфортна довольно недоверчивая к незнакомым собака', { strangerFriendliness: 1 })
  ]),
  question('guarding', 'Ночью у двери слышен шум. Как реагирует ваша собака?', [
    option('gd1', 'Не реагирует и спокойно продолжает отдыхать', { guarding: 1 }), option('gd2', 'Прислушивается, но быстро успокаивается', { guarding: 2 }),
    option('gd3', 'Настораживается и прислушивается к шуму', { guarding: 3 }), option('gd4', 'Идёт проверить, что происходит', { guarding: 4 }), option('gd5', 'Активно охраняет дом и предупреждает о незнакомце', { guarding: 5 })
  ]),
  question('dog_sociability', 'Какое поведение собаки при встрече с другими собаками будет для вас комфортным?', [
    option('d5', 'Хочу, чтобы встречи почти всегда проходили спокойно', { dogSociabilityMin: 5 }), option('d4', 'Мне подходит собака, которая не ищет общения, но спокойно проходит мимо', { dogSociabilityMin: 4 }),
    option('d3', 'Готов иногда помогать собаке переключаться', { dogSociabilityMin: 3 }), option('d2', 'Готов соблюдать дистанцию и избегать близких встреч', { dogSociabilityMin: 2 }), option('d1', 'Готов постоянно контролировать встречи с другими собаками', { dogSociabilityMin: 1 })
  ], { helper: 'Здесь речь не о том, должна ли собака играть со всеми, а о том, насколько легко ей спокойно находиться рядом с другими собаками.' }),
  question('affection', 'Вы дома смотрите фильм. Что делает ваша собака?', [
    option('f5', 'Лежит рядом с вами или на коленях', { affection: 5 }), option('f4', 'Отдыхает рядом в той же комнате', { affection: 4 }),
    option('f3', 'Иногда лежит рядом, иногда отдыхает отдельно', { affection: 3 }), option('f2', 'Отдыхает отдельно, но иногда приходит за вниманием', { affection: 2 }), option('f1', 'Занимается своими делами в другой части дома', { affection: 1 })
  ]),
  question('off_switch', 'Что ваша собака делает после прогулки?', [
    option('o5', 'Спокойно отдыхает', { offSwitch: 5 }), option('o4', 'Отдыхает, иногда предлагает поиграть', { offSwitch: 4 }),
    option('o3', 'То отдыхает, то ищет себе занятие', { offSwitch: 3 }), option('o2', 'Долго ходит по дому, играет и ищет занятие', { offSwitch: 2 }), option('o1', 'Продолжает активно играть и требует внимания', { offSwitch: 1 })
  ]),
  question('sensitivity', 'Насколько чувствительная к шуму и неожиданным событиям собака будет для вас комфортна?', [
    option('sensitivity_1', 'Хочу устойчивую собаку, которая быстро приходит в себя', { sensitivityMax: 1 }), option('sensitivity_2', 'Небольшая настороженность меня не беспокоит', { sensitivityMax: 2 }),
    option('sensitivity_3', 'Готов помогать собаке справляться со страхом', { sensitivityMax: 3 }), option('sensitivity_4', 'Готов регулярно работать с чувствительной собакой', { sensitivityMax: 4 }), option('sensitivity_5', 'Высокая чувствительность для меня не проблема', { sensitivityMax: 5 }), option('sensitivity_unknown', 'Не знаю', null, { unknown: 'sensitivity' })
  ]),
  question('vocality', 'Насколько голосистая ваша собака?', [
    option('vocality_1', 'Почти не лает', { vocalityMax: 1 }), option('vocality_2', 'Лает редко', { vocalityMax: 2 }),
    option('vocality_3', 'Иногда лает, когда есть повод', { vocalityMax: 3 }), option('vocality_4', 'Часто лает и может выть', { vocalityMax: 4 }), option('vocality_5', 'Очень голосистая: много лает и воет', { vocalityMax: 5 }), option('vocality_unknown', 'Не знаю', null, { unknown: 'vocality' })
  ]),
  question('grooming', 'Как часто вы ухаживаете за шерстью собаки?', [
    option('grooming_1', 'Почти не ухаживаю', { groomingMax: 1 }), option('grooming_2', 'Расчёсываю примерно раз в неделю', { groomingMax: 2 }),
    option('grooming_3', 'Расчёсываю несколько раз в неделю', { groomingMax: 3 }), option('grooming_4', 'Регулярно расчёсываю и стригу', { groomingMax: 4 }), option('grooming_5', 'Часто ухаживаю и хожу к грумеру', { groomingMax: 5 }), option('grooming_unknown', 'Не знаю', null, { unknown: 'grooming' })
  ]),
  question('health', 'Насколько риск врождённых проблем со здоровьем может повлиять на ваш выбор?', [
    option('health_1', 'Сильно повлияет — хочу минимальные риски', { healthBurdenMax: 1 }), option('health_2', 'Важно — здоровье сильно влияет на мой выбор', { healthBurdenMax: 2 }),
    option('health_3', 'Учту, но это не главный фактор', { healthBurdenMax: 3 }), option('health_4', 'Готов принять заметные породные риски', { healthBurdenMax: 4 }), option('health_5', 'Почти не повлияет на мой выбор', { healthBurdenMax: 5 }), option('health_unknown', 'Не знаю', null, { unknown: 'healthBurden' })
  ], { helper: 'Речь о породных тенденциях, а не прогнозе здоровья конкретной собаки.' }),
  question('dealbreakers', 'Какие 3 особенности помешают вашей совместной жизни?', [
    option('db_activity', 'Нужно очень много гулять каждый день', null, { boostTrait: 'activity' }), option('db_mental', 'Постоянно требует занятий и развлечений', null, { boostTrait: 'mentalWork' }),
    option('db_independence', 'Часто игнорирует команды и принимает решения сама', null, { boostTraits: ['biddability', 'independence'] }), option('db_prey', 'Может резко рваться за животными', null, { boostTrait: 'preyDrive' }),
    option('db_guarding', 'Настороженно относится к посторонним', null, { boostTraits: ['guarding', 'strangerFriendliness'] }), option('db_dogs', 'Сложно ладит с другими собаками', null, { boostTrait: 'dogSociability' }),
    option('db_vocality', 'Много лает или воет', null, { boostTrait: 'vocality' }), option('db_affection', 'Постоянно требует внимания', null, { boostTrait: 'affection' }),
    option('db_offswitch', 'Долго не может успокоиться дома', null, { boostTrait: 'offSwitch' }), option('db_sensitivity', 'Боится шума и новых ситуаций', null, { boostTrait: 'sensitivity' }),
    option('db_grooming', 'Требует сложного ухода за шерстью', null, { boostTrait: 'grooming' }), option('db_shedding', 'Сильно линяет', null, { boostTrait: 'shedding', forceAdaptive: 'shedding' }),
    option('db_drool', 'Много слюней', null, { boostTrait: 'drool', forceAdaptive: 'drool' }), option('db_power', 'Очень физически сильная', null, { boostTrait: 'power', forceAdaptive: 'power' }),
    option('db_health', 'Высокий риск дорогих проблем со здоровьем', null, { boostTrait: 'healthBurden', forceAdaptive: 'healthBurden' })
  ], { type: 'multi_select', maxSelections: 3 })
];

const adaptiveQuestions = [
  question('adaptive_reactivity', 'Собака на поводке, но хочет к чему-то подойти. Насколько вам это ок?', [
    option('ar1', 'Хочу, чтобы она легко переключалась на меня', { reactivityMax: 1 }), option('ar2', 'Немного потянуть поводок — нормально', { reactivityMax: 2 }), option('ar3', 'Заметно тянуть или лаять иногда приемлемо', { reactivityMax: 3 }), option('ar4', 'Готов регулярно контролировать сильное желание подойти', { reactivityMax: 4 }), option('ar5', 'Сильная реакция на поводке меня не пугает', { reactivityMax: 5 }), option('ar_unknown', 'Не знаю', null, { unknown: 'reactivity' })
  ], { trait: 'reactivity' }),
  question('adaptive_shedding', 'Какой уровень линьки для вас подойдёт?', [
    option('sh1', 'Почти без шерсти дома и на одежде', { sheddingMax: 1 }), option('sh2', 'Небольшое количество шерсти меня устроит', { sheddingMax: 2 }), option('sh3', 'Умеренная линька — нормально', { sheddingMax: 3 }), option('sh4', 'Готов регулярно убирать много шерсти', { sheddingMax: 4 }), option('sh5', 'Количество шерсти для меня не важно', { sheddingMax: 5 }), option('sh_unknown', 'Не знаю', null, { unknown: 'shedding' })
  ], { trait: 'shedding' }),
  question('adaptive_drool', 'Какой уровень слюноотделения вам подойдёт?', [
    option('dr1', 'Почти без слюней', { droolMax: 1 }), option('dr2', 'Небольшое слюноотделение меня устроит', { droolMax: 2 }), option('dr3', 'Умеренное слюноотделение — нормально', { droolMax: 3 }), option('dr4', 'Готов регулярно вытирать слюни', { droolMax: 4 }), option('dr5', 'Количество слюней для меня не важно', { droolMax: 5 })
  ], { trait: 'drool' }),
  question('adaptive_power', 'Собака резко дёрнула поводок. Насколько сильную собаку вам будет комфортно удерживать?', [
    option('pw1', 'Хочу максимально лёгкую по физической силе', { powerMax: 1 }), option('pw2', 'Небольшая или умеренная сила', { powerMax: 2 }), option('pw3', 'Средняя физическая мощь нормально', { powerMax: 3 }), option('pw4', 'Крупная и сильная тоже нормально', { powerMax: 4 }), option('pw5', 'Очень мощная собака меня не пугает', { powerMax: 5 })
  ], { trait: 'power' })
];

const userKeys = { sensitivity: 'sensitivityMax', vocality: 'vocalityMax', grooming: 'groomingMax', healthBurden: 'healthBurdenMax', reactivity: 'reactivityMax', shedding: 'sheddingMax', drool: 'droolMax', power: 'powerMax' };
const fciNames = { 1: 'Пастушьи и скотогонные собаки', 2: 'Пинчеры, шнауцеры, молоссы и швейцарские собаки', 3: 'Терьеры', 4: 'Таксы', 5: 'Шпицы и примитивные типы', 6: 'Гончие и родственные породы', 7: 'Легавые', 8: 'Ретриверы, спаниели и водяные собаки', 9: 'Собаки-компаньоны и той-породы', 10: 'Борзые' };
const fciPurposes = {
  1: 'Их выводили, чтобы помогать человеку управлять стадами и перегонять скот.',
  2: 'Этих собак выводили для охраны, работы рядом с человеком и, у части пород, для тяговой работы.',
  3: 'Терьеров выводили для охоты на норных животных и контроля грызунов.',
  4: 'Такс выводили, чтобы находить и доставать добычу из нор.',
  5: 'В этой группе есть собаки, которых выводили для ездовой работы, охоты и охраны.',
  6: 'Гончих выводили, чтобы искать и преследовать дичь по запаху.',
  7: 'Легавых — подружейных собак — выводили для поиска дичи и стойки перед птицей.',
  8: 'Этих собак выводили, чтобы находить, поднимать и приносить дичь, в том числе из воды.',
  9: 'Собак-компаньонов выводили прежде всего для жизни рядом с человеком.',
  10: 'Борзых выводили для преследования дичи на высокой скорости, ориентируясь главным образом на зрение.'
};
const breedDescriptions = {
  australian_shepherd: 'Атлетичная ранчо-пастушка: быстро учится и любит работать вместе с человеком.',
  australian_cattle_dog: 'Выносливый погонщик скота, настойчивый в работе и очень преданный своему человеку.',
  belgian_malinois: 'Интенсивная служебная собака с быстрыми реакциями и огромной потребностью в работе.',
  belgian_tervuren: 'Чуткая длинношёрстная овчарка, соединяющая пастушью работу, обучаемость и настороженность.',
  border_collie: 'Управляет стадом взглядом и движением; особенно силён в сложном обучении и спорте.',
  bearded_collie: 'Подвижный косматый пастух с весёлым нравом и любовью к активной семейной жизни.',
  cardigan_welsh_corgi: 'Невысокий, но крепкий погонщик скота: рассудительный, бдительный и довольно самостоятельный.',
  pembroke_welsh_corgi: 'Компактный пастух с общительным характером, быстрым умом и склонностью подавать голос.',
  collie: 'Мягкая и отзывчивая семейная овчарка, внимательно следящая за людьми и обстановкой.',
  german_shepherd: 'Универсальная служебная овчарка: обучаемая, собранная и ориентированная на совместные задачи.',
  bouvier_des_flandres: 'Мощный фламандский погонщик и сторож, обычно спокойный дома и серьёзный в работе.',
  shetland_sheepdog: 'Миниатюрная бдительная овчарка, легко обучающаяся и тонко реагирующая на человека.',
  bulldog: 'Спокойный и упрямоватый компаньон, предпочитающий размеренный быт интенсивным нагрузкам.',
  mastiff: 'Очень крупный сдержанный сторож, которому важны спокойная семья, пространство и уверенное управление.',
  bernese_mountain_dog: 'Добродушная швейцарская фермерская собака, созданная для упряжи, охраны и жизни рядом с семьёй.',
  boxer: 'Игривый, прыгучий и человекоориентированный охранник, долго сохраняющий щенячью непосредственность.',
  bullmastiff: 'Молчаливый и мощный сторож поместий, спокойный в быту, но требующий физического контроля.',
  doberman: 'Быстрый персональный защитник, тесно привязывающийся к владельцу и любящий точное обучение.',
  great_dane: 'Деликатный гигант-компаньон с дружелюбным нравом и большой потребностью в бытовом пространстве.',
  newfoundland: 'Спокойный водный спасатель, известный терпеливостью, силой и любовью к людям.',
  great_pyrenees: 'Самостоятельный ночной охранник стад, привыкший сам оценивать угрозы и защищать территорию.',
  rottweiler: 'Сильный бывший погонщик скота и охранник, уверенный, обучаемый и серьёзный в защите.',
  miniature_schnauzer: 'Бдительный фермерский крысолов и компаньон: энергичный, разговорчивый и сообразительный.',
  chinese_shar_pei: 'Сдержанный китайский сторож с независимым характером и осторожным отношением к незнакомцам.',
  border_terrier: 'Небольшой рабочий терьер, способный идти за лисой и мирно работать рядом с другими собаками.',
  bull_terrier: 'Сильный, настойчивый и комичный терьер, которому нужны последовательные правила и занятия.',
  west_highland_white_terrier: 'Смелый белый охотник на мелкую добычу, живой, любопытный и уверенный в себе.',
  jack_russell_terrier: 'Неутомимый норный охотник с быстрыми решениями, азартом погони и запасом энергии.',
  soft_coated_wheaten_terrier: 'Жизнерадостный ирландский фермерский универсал, общительный и более мягкий, чем многие терьеры.',
  yorkshire_terrier: 'Миниатюрный бывший крысолов с настоящей терьерской смелостью и сильной привязанностью к людям.',
  cairn_terrier: 'Любопытный охотник среди камней и нор, самостоятельный, бодрый и готовый исследовать всё вокруг.',
  scottish_terrier: 'Независимый и достоинственный норный терьер, сдержанный с чужими и преданный семье.',
  staffordshire_bull_terrier: 'Мускулистый, эмоциональный и человеколюбивый терьер, обожающий контакт и активные игры.',
  airedale_terrier: 'Крупнейший терьер — разносторонний охотник и сторож с живым умом и самостоятельностью.',
  dachshund: 'Норный охотник с сильным чутьём, смелостью и привычкой самостоятельно принимать решения.',
  akita: 'Достоинственная японская собака с охранным прошлым, сдержанная с чужими и независимая.',
  alaskan_malamute: 'Мощная ездовая собака для перевозки тяжёлых грузов, общительная, сильная и самостоятельная.',
  basenji: 'Африканский охотник, почти не лающий, но умеющий «петь»; чистоплотный и независимый.',
  keeshond: 'Общительный баржевый сторож, внимательно следящий за домом и охотно сообщающий обо всём голосом.',
  pomeranian: 'Крошечный шпиц с характером большой сторожевой собаки: бодрый, внимательный и разговорчивый.',
  norwegian_elkhound: 'Северная гончая по лосю, выносливая, голосистая и привыкшая работать на расстоянии.',
  samoyed: 'Дружелюбная северная рабочая собака, помогавшая пасти оленей, тянуть нарты и согревать людей.',
  shiba_inu: 'Компактный японский охотник с быстрыми реакциями, чистоплотностью и яркой самостоятельностью.',
  siberian_husky: 'Командная ездовая собака для долгого бега, социальная с сородичами и склонная исследовать мир.',
  chow_chow: 'Сдержанная древняя сторожевая собака, ценящая личное пространство и не склонная угождать.',
  english_foxhound: 'Стайная гончая для многочасового преследования лисы, выносливая, общительная и очень увлечённая запахами.',
  basset_hound: 'Низкорослая гончая с выдающимся чутьём, медленным темпом и настойчивостью на следу.',
  beagle: 'Весёлый стайный охотник по зайцу, дружелюбный и часто полностью поглощённый интересным запахом.',
  bloodhound: 'Специалист по сложным запаховым следам, спокойный в общении и исключительно настойчивый в поиске.',
  dalmatian: 'Выносливый сопровождающий экипажей, любящий долгие прогулки, движение и участие в делах семьи.',
  petit_basset_griffon_vendeen: 'Бодрая жесткошёрстная гончая по кролику, любознательная, общительная и щедрая на голос.',
  rhodesian_ridgeback: 'Атлетичный африканский охотник и сторож, сдержанный, сильный и способный действовать самостоятельно.',
  black_tan_coonhound: 'Крупная ночная гончая по еноту с глубоким голосом и огромной настойчивостью на запаховом следе.',
  pointer: 'Стремительный подружейный охотник, замирающий стойкой при запахе птицы и широко исследующий пространство.',
  english_setter: 'Мягкий и элегантный охотник по пернатой дичи, любящий движение и тесный контакт с семьёй.',
  brittany: 'Компактная универсальная подружейная собака, быстрая, отзывчивая и удобная для активного охотника.',
  weimaraner: 'Крупный универсальный охотник, сильно привязывающийся к семье и нуждающийся в насыщенной деятельности.',
  vizsla: 'Чуткая венгерская подружейная собака, работающая близко к человеку и тяжело переносящая одиночество.',
  irish_setter: 'Энергичный и общительный охотник по птице с широким поиском и долго сохраняющейся игривостью.',
  german_wirehaired_pointer: 'Жёсткошёрстный универсальный охотник для поля и воды, выносливый, настойчивый и защитный.',
  german_shorthaired_pointer: 'Атлетичный универсальный охотник, которому нужны бег, поиск, обучение и регулярные задачи.',
  gordon_setter: 'Более тяжёлый и методичный сеттер, преданный семье и настойчивый в поиске птицы.',
  american_cocker_spaniel: 'Небольшой весёлый компаньон из охотничьей семьи, ласковый и ориентированный на человека.',
  english_cocker_spaniel: 'Азартный охотник в густых зарослях, быстрый, весёлый и постоянно готовый искать запахи.',
  english_springer_spaniel: 'Выносливый спаниель, поднимающий птицу под выстрел и охотно работающий в тесном контакте.',
  welsh_springer_spaniel: 'Более сдержанный спаниель с близким поиском, сильной привязанностью и любовью к полевой работе.',
  golden_retriever: 'Мягкий и кооперативный подносчик дичи, известный обучаемостью и дружелюбным отношением к людям.',
  irish_water_spaniel: 'Кудрявый водный апортировщик с живым умом, рабочим азартом и заметной самостоятельностью.',
  labrador_retriever: 'Общительный апортировщик из воды, пищевик, ученик и активный участник семейных дел.',
  lagotto_romagnolo: 'Итальянская водяная собака, ставшая специалистом по поиску трюфелей и работе носом.',
  nova_scotia_duck_tolling_retriever: 'Компактный ретривер, игрой приманивающий уток к берегу; быстрый, эмоциональный и азартный.',
  portuguese_water_dog: 'Помощник рыбаков, умеющий плавать, переносить сообщения и работать весь день рядом с человеком.',
  flat_coated_retriever: 'Жизнерадостный апортировщик, долго сохраняющий юношескую игривость и любовь к людям.',
  chesapeake_bay_retriever: 'Сильный ретривер для холодной воды, более независимый и сторожевой, чем многие родственники.',
  bichon_frise: 'Весёлый белый компаньон, легко включающийся в семейную жизнь и любящий быть в центре внимания.',
  boston_terrier: 'Компактный городской компаньон с живой мимикой, игривостью и удобным домашним ритмом.',
  brussels_griffon: 'Выразительный маленький компаньон, очень привязанный к своему человеку и внимательно следящий за ним.',
  havanese: 'Гибкий и общительный кубинский компаньон, легко адаптирующийся к семейной и городской жизни.',
  cavalier_king_charles_spaniel: 'Мягкий, ласковый и дружелюбный спаниель-компаньон, стремящийся быть рядом с людьми.',
  chinese_crested: 'Чуткий и контактный компаньон с необычной внешностью, любящий тепло и близость с владельцем.',
  coton_de_tulear: 'Жизнерадостный мадагаскарский компаньон с комичным характером и сильной социальной ориентацией.',
  lhasa_apso: 'Древний монастырский сигнализатор: небольшой, уверенный, внимательный и независимый в решениях.',
  maltese: 'Лёгкий белоснежный компаньон, живой, ласковый и настроенный на постоянное общение с человеком.',
  pug: 'Комичный и общительный домашний компаньон, предпочитающий находиться рядом и участвовать во всём.',
  papillon: 'Миниатюрная, но спортивная собака-компаньон, быстро обучающаяся трюкам и сложным упражнениям.',
  pekingese: 'Достоинственный дворцовый компаньон с независимыми манерами и спокойным домашним ритмом.',
  poodle: 'Умный водный апортировщик и универсальный ученик, подходящий для спорта, трюков и семейной жизни.',
  tibetan_terrier: 'Крепкий тибетский компаньон и фермерский помощник, внимательный, ловкий и преданный семье.',
  french_bulldog: 'Компактный городской компаньон, игривый, человеколюбивый и довольный умеренной активностью.',
  chihuahua: 'Очень маленький, но бдительный компаньон, часто выбирающий одного главного человека.',
  shih_tzu: 'Дружелюбная дворцовая собака, созданная для близкой домашней жизни и спокойного общения.',
  japanese_chin: 'Элегантный и деликатный компаньон с почти кошачьими манерами и самостоятельным способом общаться.',
  afghan_hound: 'Независимая горная борзая с сильным охотничьим инстинктом, скоростью и сдержанностью.',
  greyhound: 'Молниеносный спринтер на улице и обычно спокойный любитель дивана после прогулки.',
  scottish_deerhound: 'Высокая борзая для охоты на оленя, мягкая в общении и требующая пространства для разгона.',
  irish_wolfhound: 'Гигантская борзая, исторически охотившаяся на волков, обычно терпеливая и деликатная дома.',
  italian_greyhound: 'Хрупкая миниатюрная борзая, стремительная на улице и очень ласковая с близкими.',
  borzoi: 'Спокойная русская борзая с независимым мышлением и мгновенным включением в зрительную погоню.',
  saluki: 'Выносливый пустынный охотник, сдержанный с чужими, самостоятельный и очень быстрый.',
  whippet: 'Компактный спринтер, обычно тихий и расслабленный дома, но азартный при движущейся цели.'
};
const traitLabels = { activity: 'ритм прогулок', mentalWork: 'занятия с собакой', biddability: 'управляемость', independence: 'самостоятельность', recall: 'отзыв на прогулке', preyDrive: 'интерес к погоне', guarding: 'сторожевое поведение', strangerFriendliness: 'отношение к гостям', dogSociability: 'контакт с другими собаками', affection: 'контакт с человеком дома', offSwitch: 'спокойствие дома', sensitivity: 'реакция на шум', vocality: 'голосистость', grooming: 'уход за шерстью', reactivity: 'эмоциональная реакция', shedding: 'линька', drool: 'слюни', power: 'физическая сила', healthBurden: 'породные риски для здоровья' };

let coreIndex = 0;
let adaptiveIndex = 0;
let activeAdaptive = [];
let answers = {};

function footer() { return `<footer class="site-footer"><a href="${donationUrl}" target="_blank" rel="noopener" data-donation="footer">Поддержать проект&nbsp; →</a><img src="assets/heart.svg?v=2" alt="Поддержать проект"></footer>`; }

function home() {
  const isLoading = breedProfilesStatus === 'loading';
  const startCopy = isLoading ? 'Загружаем базу…' : 'Бесплатный тест';
  app.innerHTML = `<main class="landing-page"><section class="landing-copy"><header class="landing-header"><a class="brand-lockup" href="index.html"><img src="assets/logo.svg?v=4" alt="Мой пёс"></a></header><div class="landing-main"><h1>Какая<br>собака мне<br>подойдёт?</h1><p>Выбери собаку не по внешности,<br class="appearance-break">а&nbsp;по характеру, образу жизни и&nbsp;тому,<br>насколько вам будет комфортно вместе</p><div class="landing-cta"><button class="button" id="start" type="button" ${isLoading ? 'disabled' : ''}>${startCopy}</button><span><i>◷</i> 5 мин</span></div></div><footer class="landing-footer"><a href="${donationUrl}" target="_blank" rel="noopener" data-donation="landing">Поддержать проект&nbsp; →</a><img class="heart-icon" src="assets/heart.svg?v=2" alt="Поддержать проект"></footer></section><figure class="landing-photo"><img src="assets/dog-image-2.png" alt="Собака лежит на траве"></figure></main>`;
  document.querySelector('#start').addEventListener('click', () => { coreIndex = 0; adaptiveIndex = 0; activeAdaptive = []; answers = {}; analytics.goal('quiz_start'); renderQuestion(); });
}

function currentQuestion() { return coreIndex < coreQuestions.length ? coreQuestions[coreIndex] : activeAdaptive[adaptiveIndex]; }
function selectedIds(questionData) { const saved = answers[questionData.id]; return new Set(questionData.type === 'multi_select' ? saved || [] : saved ? [saved] : []); }
function isMulti(questionData) { return questionData.type === 'multi_select'; }
function scaleOptions(questionData) { return questionData.options.filter((item) => !item.unknown); }
function isScaleQuestion(questionData) { return ['activity', 'mental_work'].includes(questionData.id); }
function scaleMarkup(data, selected) {
  const options = scaleOptions(data);
  const selectedOption = options.find((item) => selected.has(item.id));
  const selectedIndex = selectedOption ? options.indexOf(selectedOption) + 1 : 3;
  const unknown = data.options.find((item) => item.unknown);
  return `<div class="answer-scale ${selectedOption ? 'is-selected' : ''}" data-scale-question="${data.id}"><p class="scale-value">${selectedOption ? selectedOption.label : 'Выберите подходящий уровень'}</p><div class="scale-control"><div class="scale-line" aria-hidden="true"></div><div class="scale-points" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><input class="scale-input" type="range" min="1" max="5" step="1" value="${selectedIndex}" aria-label="Выберите подходящий уровень"></div><div class="scale-ends"><span>${options[0].label}</span><span>${options.at(-1).label}</span></div></div>${unknown ? `<button class="scale-unknown ${selected.has(unknown.id) ? 'selected' : ''}" type="button" data-option="${unknown.id}" aria-pressed="${selected.has(unknown.id)}">Не знаю</button>` : ''}`;
}

function renderQuestion() {
  const data = currentQuestion();
  const adaptive = coreIndex >= coreQuestions.length;
  const selected = selectedIds(data);
  const progress = Math.min(100, Math.round(((Math.min(coreIndex, coreQuestions.length) + 1) / coreQuestions.length) * 100));
  const number = adaptive ? `Уточнение ${adaptiveIndex + 1}/${activeAdaptive.length}` : `Вопрос ${coreIndex + 1}/${coreQuestions.length}`;
  const lastCore = !adaptive && coreIndex === coreQuestions.length - 1;
  const nextText = adaptive ? (adaptiveIndex === activeAdaptive.length - 1 ? 'Результат' : 'Дальше') : (lastCore && plannedAdaptiveQuestions().length === 0 ? 'Результат' : 'Дальше');
  const scale = isScaleQuestion(data);
  const denseAnswers = !scale && isMulti(data) && data.options.length > 5;
  app.innerHTML = `<main class="quiz-page"><header class="quiz-header"><a href="index.html" class="quiz-logo"><img src="assets/logo.svg?v=4" alt="Мой пёс"></a></header><section class="quiz-content"><div class="quiz-progress"><span>${number}</span><div class="progress"><i style="width:${progress}%"></i></div></div><h1>${data.title}</h1>${data.helper ? `<p class="question-hint">${data.helper}</p>` : ''}${scale ? scaleMarkup(data, selected) : `<div class="answers ${isMulti(data) ? 'answers-multi' : ''} ${denseAnswers ? 'answers-dense' : ''}">${data.options.map((item) => `<button class="answer ${selected.has(item.id) ? 'selected' : ''}" data-option="${item.id}" type="button" aria-pressed="${selected.has(item.id)}">${item.label}</button>`).join('')}</div>`}${isMulti(data) && data.maxSelections ? `<p class="selection-count">Выбрано: ${selected.size}/${data.maxSelections}</p>` : ''}<div class="nav"><button class="back" id="back" type="button" ${coreIndex || adaptiveIndex ? '' : 'disabled'}>Назад</button><button class="button" id="next" type="button" ${selected.size ? '' : 'disabled'}>${nextText}</button></div></section>${footer()}</main>`;
  const answerContainer = document.querySelector('.answers');
  answerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('.answer');
    if (!button) return;
    const id = button.dataset.option;
    if (isMulti(data)) {
      const next = selectedIds(data);
      if (next.has(id)) next.delete(id);
      else if (!data.maxSelections || next.size < data.maxSelections) next.add(id);
      answers[data.id] = [...next];
    } else answers[data.id] = id;
    renderQuestion();
  });
  const scaleInput = document.querySelector('.scale-input');
  const selectScaleValue = (event) => {
    const options = scaleOptions(data);
    const item = options[Number(event.currentTarget.value) - 1];
    answers[data.id] = item.id;
    const scaleRoot = document.querySelector('.answer-scale');
    scaleRoot.classList.add('is-selected');
    scaleRoot.querySelector('.scale-value').textContent = item.label;
    document.querySelector('#next').disabled = false;
  };
  scaleInput?.addEventListener('input', selectScaleValue);
  scaleInput?.addEventListener('click', selectScaleValue);
  document.querySelector('.scale-unknown')?.addEventListener('click', (event) => {
    answers[data.id] = event.currentTarget.dataset.option;
    renderQuestion();
  });
  document.querySelector('#back').addEventListener('click', goBack);
  document.querySelector('#next').addEventListener('click', goNext);
}

function goBack() {
  analytics.goal('quiz_back', { question_id: currentQuestion()?.id || 'unknown' });
  if (coreIndex >= coreQuestions.length && adaptiveIndex > 0) adaptiveIndex -= 1;
  else if (coreIndex >= coreQuestions.length) coreIndex = coreQuestions.length - 1;
  else if (coreIndex > 0) coreIndex -= 1;
  renderQuestion();
}

function optionById(questionData, id) { return questionData.options.find((item) => item.id === id); }
function forcedAdaptives() {
  const dealbreakers = selectedIds(coreQuestions.at(-1));
  const traits = [...dealbreakers].map((id) => optionById(coreQuestions.at(-1), id).forceAdaptive).filter(Boolean);
  return adaptiveQuestions.filter((item) => traits.includes(item.trait)).slice(0, 3);
}

function adaptiveUserKey(questionData) {
  const answerWithValue = questionData.options.find((item) => item.set);
  return answerWithValue ? Object.keys(answerWithValue.set)[0] : null;
}

function plannedAdaptiveQuestions() {
  const forced = forcedAdaptives();
  const forcedTraits = new Set(forced.map((item) => item.trait));
  const breeds = getBreedProfiles().filter((breed) => breed.scoringEligible);
  if (!breeds.length || !window.DogScoring) return forced;

  const profile = buildUserProfile();
  const scored = breeds.map((breed) => {
    const score = window.DogScoring.scoreBreed(profile, breed);
    return score ? { breed, score: score.compatibility, rawScore: score.rawCompatibility } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 12);
  if (!scored.length) return forced;

  const groups = window.DogScoring.aggregateFciGroups(scored);
  const groupGap = groups[1] ? groups[0].score - groups[1].score : 10;
  if (groupGap >= 4) return forced;

  const useful = adaptiveQuestions.map((item) => {
    const key = adaptiveUserKey(item);
    if (!key || forcedTraits.has(item.trait) || profile.values[key] !== undefined) return null;
    const values = scored.map(({ breed }) => breed.traits && breed.traits[item.trait]).filter((value) => Number.isFinite(value)).map((value) => window.DogScoring.normalizeBreedTrait(item.trait, value));
    const range = values.length ? Math.max(...values) - Math.min(...values) : 0;
    return range >= 2 ? { item, range } : null;
  }).filter(Boolean).sort((a, b) => b.range - a.range).map(({ item }) => item);
  return [...forced, ...useful].slice(0, 3);
}
function goNext() {
  const data = currentQuestion();
  const response = answers[data.id];
  analytics.answer(data.id, isMulti(data) ? response || [] : response, coreIndex < coreQuestions.length ? coreIndex + 1 : adaptiveIndex + 1, coreIndex < coreQuestions.length ? 'core' : 'adaptive');
  if (coreIndex < coreQuestions.length - 1) { coreIndex += 1; renderQuestion(); return; }
  if (coreIndex === coreQuestions.length - 1) {
    activeAdaptive = plannedAdaptiveQuestions();
    if (activeAdaptive.length) { coreIndex = coreQuestions.length; adaptiveIndex = 0; renderQuestion(); } else completeQuiz();
    return;
  }
  if (adaptiveIndex < activeAdaptive.length - 1) { adaptiveIndex += 1; renderQuestion(); } else completeQuiz();
}

function completeQuiz() {
  analytics.goal('quiz_complete', { core_questions: coreQuestions.length, adaptive_questions: activeAdaptive.length });
  renderResult();
}

function buildUserProfile() {
  const values = {};
  const userConfidence = {};
  const flags = [];
  const dealbreakers = [];
  coreQuestions.forEach((data) => {
    const response = answers[data.id];
    const ids = isMulti(data) ? response || [] : response ? [response] : [];
    ids.map((id) => optionById(data, id)).filter(Boolean).forEach((item) => {
      if (item.flags) flags.push(...item.flags);
      if (item.set) Object.assign(values, item.set);
      if (item.unknown) userConfidence[userKeys[item.unknown]] = 0.25;
      if (item.boostTrait) dealbreakers.push(item.boostTrait);
      if (item.boostTraits) dealbreakers.push(...item.boostTraits);
    });
  });
  activeAdaptive.forEach((data) => {
    const item = optionById(data, answers[data.id]);
    if (!item) return;
    if (item.set) Object.assign(values, item.set);
    if (item.unknown) userConfidence[userKeys[item.unknown]] = 0.25;
  });
  return { values, userConfidence, flags: [...new Set(flags)], dealbreakers: [...new Set(dealbreakers)] };
}

function profileRows() {
  const labels = {
    household: 'Кто живёт с собакой', activity: 'Ритм прогулок', mental_work: 'Готовность к занятиям',
    biddability: 'Управляемость', independence: 'Самостоятельность', recall: 'Отзыв на прогулке',
    prey_drive: 'Погоня за животными', stranger_friendliness: 'Отношение к гостям', guarding: 'Сторожевое поведение',
    dog_sociability: 'Другие собаки', affection: 'Контакт с человеком дома', off_switch: 'Спокойствие дома',
    sensitivity: 'Реакция на шум', vocality: 'Голосистость', grooming: 'Уход за шерстью',
    health: 'Породные риски для здоровья', dealbreakers: 'Точно не подходит',
    adaptive_reactivity: 'Реактивность', adaptive_shedding: 'Линька', adaptive_drool: 'Слюнотечение', adaptive_power: 'Физическая сила'
  };
  return [...coreQuestions, ...activeAdaptive].map((data) => {
    const ids = isMulti(data) ? answers[data.id] || [] : answers[data.id] ? [answers[data.id]] : [];
    const answer = ids.map((id) => optionById(data, id)).filter(Boolean).map((item) => item.label).join(', ') || 'Не знаю';
    return `<li><b>${labels[data.id] || data.title}:</b> ${answer}</li>`;
  }).join('');
}

function confidenceCopy(label) { return label === 'high' ? 'Высокая уверенность' : label === 'medium' ? 'Средняя уверенность' : 'Невысокая уверенность'; }
function humanReasons(details, direction) {
  return Object.entries(details).sort((a, b) => direction === 'good' ? b[1].match - a[1].match : a[1].match - b[1].match).slice(0, direction === 'good' ? 4 : 3).map(([trait]) => traitLabels[trait]).filter(Boolean);
}
function dataConfidence(breed) {
  const factors = Object.values(breed.traitConfidence || {}).map((item) => item.factor || 0.6);
  return factors.length ? factors.reduce((sum, value) => sum + value, 0) / factors.length : 0.6;
}
function answerConfidence(profile) {
  const known = Object.keys(profile.values).map((key) => profile.userConfidence[key] ?? 1);
  const unknown = Object.entries(profile.userConfidence).filter(([key]) => profile.values[key] === undefined).map(([, value]) => value);
  const values = [...known, ...unknown];
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0.25;
}
function traitLevel(breed, trait) {
  const raw = breed.traits && breed.traits[trait];
  if (!Number.isFinite(raw)) return 'нет данных';
  const value = window.DogScoring.normalizeBreedTrait(trait, raw);
  if (value <= 1.5) return 'низкая';
  if (value <= 2.5) return 'ниже средней';
  if (value <= 3.5) return 'средняя';
  if (value <= 4.5) return 'выше средней';
  return 'высокая';
}
function healthNote(breed) {
  const level = traitLevel(breed, 'healthBurden');
  return level === 'нет данных' ? 'Данные о породных рисках уточняются' : `Породная медицинская нагрузка — ${level}`;
}
function breedSubtitle(breed) {
  const description = breedDescriptions[breed.breedFamily] || breedDescriptions[breed.id];
  if (description) return description;
  const type = { 1: 'Пастушья собака', 2: 'Рабочая или охранная собака', 3: 'Терьер', 4: 'Норная охотничья собака', 5: 'Шпиц или собака примитивного типа', 6: 'Гончая', 7: 'Подружейная собака', 8: 'Охотничья подружейная собака', 9: 'Собака-компаньон', 10: 'Борзая' }[breed.fciGroup] || 'Порода с выраженным характером';
  const traits = breed.traits || {};
  if (traits.affection >= 4) return `${type}, обычно ориентированная на близость с человеком.`;
  if (traits.independence >= 4) return `${type} с самостоятельным характером.`;
  if (traits.activity >= 4) return `${type} с высокой потребностью в прогулках и занятиях.`;
  return `${type} с умеренным ритмом и своими породными особенностями.`;
}
function traitMeter(breed, trait) {
  const raw = breed.traits && breed.traits[trait];
  if (!Number.isFinite(raw)) return '<span class="trait-no-data">—</span>';
  const value = Math.max(1, Math.min(5, Math.round(window.DogScoring.normalizeBreedTrait(trait, raw))));
  return `<span class="trait-meter" role="img" aria-label="${value} из 5"><span class="sr-only">${value} из 5</span>${Array.from({ length: 5 }, (_, index) => `<i class="${index < value ? 'on' : ''}"></i>`).join('')}</span>`;
}
function comparisonTable(items) {
  if (items.length < 2) return '';
  const rows = [
    ['Потребность в активности', 'activity'], ['Самостоятельность', 'independence'], ['Уход за шерстью', 'grooming'],
    ['Линька', 'shedding'], ['Лай и вой', 'vocality'], ['Слюнотечение', 'drool'], ['Породные риски для здоровья', 'healthBurden']
  ];
  const width = 100 / (items.length + 1);
  return `<section class="result-section"><h2>Сравнить породы</h2><div class="result-table-wrap"><table class="result-table"><colgroup>${Array.from({ length: items.length + 1 }, () => `<col style="width:${width}%">`).join('')}</colgroup><thead><tr><th>Параметр</th>${items.map(({ breed }) => `<th>${breed.nameRu}</th>`).join('')}</tr></thead><tbody>${rows.map(([label, trait]) => `<tr><td>${label}</td>${items.map(({ breed }) => `<td>${traitMeter(breed, trait)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="table-note">Пять делений — высокий уровень особенности. Это общие данные по породам: конкретная собака всегда индивидуальна.</p></section>`;
}
function actualResult(profile, breeds) {
  const scored = breeds.map((breed) => { const score = window.DogScoring.scoreBreed(profile, breed); return score ? { breed, score: score.compatibility, rawScore: score.rawCompatibility, result: score } : null; }).filter(Boolean);
  if (!scored.length) return null;
  const groups = window.DogScoring.aggregateFciGroups(scored);
  const primary = groups[0];
  const alternative = groups[1];
  const top = primary.topBreeds[0];
  const gap = alternative ? primary.score - alternative.score : 10;
  const groupWeights = primary.topBreeds.length === 1 ? [1] : primary.topBreeds.length === 2 ? [0.72, 0.28] : [0.65, 0.25, 0.1];
  const weightedBreedDataConfidence = primary.topBreeds.reduce((sum, item, index) => sum + dataConfidence(item.breed) * groupWeights[index], 0);
  const confidence = window.DogScoring.resultConfidence({ groupGap: gap, weightedBreedDataConfidence, answerConfidence: answerConfidence(profile) });
  const groupBreeds = [];
  const seenFamilies = new Set();
  scored.filter((item) => item.breed.fciGroup === primary.group)
    .sort((a, b) => b.score - a.score || b.rawScore - a.rawScore)
    .forEach((item) => {
      const family = item.breed.breedFamily || item.breed.id;
      if (!seenFamilies.has(family)) {
        seenFamilies.add(family);
        groupBreeds.push(item);
      }
    });
  return { primary, alternative, top, fit: window.DogScoring.fitLabel(primary.score), confidence, groupBreeds };
}

function groupRanking(profile, group) {
  const seenFamilies = new Set();
  return getBreedProfiles().filter((breed) => breed.fciGroup === group).map((breed) => {
    const result = window.DogScoring.scoreBreed(profile, breed);
    return result ? { breed, score: result.compatibility, rawScore: result.rawCompatibility } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score || b.rawScore - a.rawScore).filter(({ breed }) => {
    const family = breed.breedFamily || breed.id;
    if (seenFamilies.has(family)) return false;
    seenFamilies.add(family);
    return true;
  });
}

function rankCards(items, showMeta = true) {
  return `<div class="breed-ranking-grid">${items.map(({ breed, score, rank }, index) => `<article class="breed-ranking-card"><img src="${breed.image || 'assets/dog-image-2.png'}" alt="${breed.image ? breed.nameRu : ''}"><div>${showMeta ? `<div class="breed-card-meta"><span class="breed-rank">${rank || index + 1} место</span><span class="breed-score">Совместимость ${score}/100</span></div>` : ''}<h3>${breed.nameRu}</h3><p class="breed-description">${breedSubtitle(breed)}</p></div></article>`).join('')}</div>`;
}

function openAlternativeGroup(profile, group) {
  sessionStorage.setItem('my-pes-profile', JSON.stringify(profile));
  const url = new URL(window.location.href);
  url.searchParams.set('group', group);
  window.history.pushState({ group }, '', url);
  renderGroupPage(profile, group);
}

function renderGroupPage(profile, group) {
  const items = groupRanking(profile, group);
  if (!items.length) { renderResult(profile); return; }
  app.innerHTML = `<main class="result-page"><header class="result-header"><a href="index.html" class="quiz-logo"><img src="assets/logo.svg?v=4" alt="Мой пёс"></a></header><section class="result-hero"><p class="result-kicker">Альтернативная категория</p><h1>${fciNames[group]}</h1><p>${fciPurposes[group]} Здесь все проверенные породы этой категории, уже отсортированные по вашим ответам.</p><button class="result-back" id="back-to-result" type="button">← Назад к результату</button></section><section class="result-section"><h2>Породы этой категории</h2><p class="section-note">Чем выше карточка, тем ближе порода к вашему профилю.</p>${rankCards(items)}</section>${footer()}</main>`;
  document.querySelector('#back-to-result').addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('group');
    window.history.pushState({}, '', url);
    renderResult(profile);
  });
}

function normalizedBreedName(value) { return String(value || '').toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/gi, ''); }
function breedExplorerMarkup() {
  const groups = Object.keys(fciNames).map(Number);
  const breeds = getBreedProfiles().filter((breed) => breed.scoringEligible).sort((a, b) => a.nameRu.localeCompare(b.nameRu, 'ru'));
  return `<section class="result-section result-card breed-explorer"><h2>Но я хотел вообще другую собаку</h2><p>Выберите породу из списка или введите её название — покажем подробный профиль и совместимость с вашими ответами.</p><div class="breed-explorer-controls"><input id="breed-search" list="breed-names" type="search" placeholder="Например, бигль"><datalist id="breed-names">${breeds.map((breed) => `<option value="${breed.nameRu}"></option>`).join('')}</datalist><select id="breed-select"><option value="">Все породы по группам</option>${groups.map((group) => `<optgroup label="${fciNames[group]}">${breeds.filter((breed) => breed.fciGroup === group).map((breed) => `<option value="${breed.id}">${breed.nameRu}</option>`).join('')}</optgroup>`).join('')}</select><button class="button" id="open-breed" type="button">Смотреть породу</button></div><p class="breed-explorer-error" id="breed-explorer-error" hidden>Не нашли эту породу в базе. Выберите вариант из списка.</p></section>`;
}
function openBreedPage(profile, breedId) {
  sessionStorage.setItem('my-pes-profile', JSON.stringify(profile));
  const url = new URL(window.location.href);
  url.searchParams.delete('group');
  url.searchParams.set('breed', breedId);
  window.history.pushState({ breedId }, '', url);
  renderBreedPage(profile, breedId);
}
function breedDetailsTable(breed) {
  const rows = [['Потребность в активности', 'activity'], ['Потребность в занятиях', 'mentalWork'], ['Управляемость', 'biddability'], ['Самостоятельность', 'independence'], ['Отзыв на прогулке', 'recall'], ['Интерес к погоне', 'preyDrive'], ['Сторожевое поведение', 'guarding'], ['Отношение к гостям', 'strangerFriendliness'], ['Контакт с другими собаками', 'dogSociability'], ['Контакт с человеком дома', 'affection'], ['Спокойствие дома', 'offSwitch'], ['Реакция на шум', 'sensitivity'], ['Лай и вой', 'vocality'], ['Уход за шерстью', 'grooming'], ['Линька', 'shedding'], ['Слюнотечение', 'drool'], ['Физическая сила', 'power'], ['Породные риски для здоровья', 'healthBurden']];
  return `<section class="result-section"><h2>Параметры породы</h2><div class="result-table-wrap"><table class="result-table breed-detail-table"><tbody>${rows.map(([label, trait]) => `<tr><td>${label}</td><td>${traitMeter(breed, trait)}</td></tr>`).join('')}</tbody></table></div><p class="table-note">Пять делений — высокий уровень особенности. Это описание тенденций породы, а не гарантия характера конкретной собаки.</p></section>`;
}
function breedHealthDetails(breed) {
  const flags = breed.sourceStats?.healthFlags || [];
  const notes = [];
  if (flags.includes('brachycephaly_strong') || flags.includes('brachycephaly_moderate')) notes.push(['Короткая морда и дыхание', 'Это брахицефалическая порода: важно внимательно относиться к дыханию, жаре и нагрузке. Перелёт нужно заранее обсуждать с ветеринаром и авиакомпанией: у таких собак могут быть ограничения на перевозку.']);
  const specific = {
    dachshund: ['Спина и прыжки', 'У такс есть породная предрасположенность к болезням межпозвонковых дисков. В быту особенно важны контроль веса, разумная нагрузка и меньше прыжков с высоты.'],
    cavalier_king_charles_spaniel: ['Сердце', 'У кавалер-кинг-чарльз-спаниелей особенно важно проверять сердце у родителей: порода известна повышенным вниманием к заболеваниям митрального клапана.'],
    bernese_mountain_dog: ['Онкологические риски', 'У бернских зенненхундов породные клубы отдельно ведут программы по изучению онкологических заболеваний. Стоит подробно изучать здоровье линий и продолжительность жизни родственников.'],
    italian_greyhound: ['Тонкие конечности', 'У левреток, особенно в молодом возрасте, возможны травмы ног. Нужны безопасные игры, контроль высоких прыжков и аккуратное знакомство с активными собаками.']
  };
  if (specific[breed.id]) notes.push(specific[breed.id]);
  if (!notes.length) notes.push(['На что смотреть', `${healthNote(breed)}. Перед выбором щенка попросите результаты породных обследований родителей и обсудите их с ветеринаром.`]);
  return `<section class="result-section health-details"><h2>Особенности здоровья</h2><div class="health-details-grid">${notes.map(([title, text]) => `<article class="result-card"><h3>${title}</h3><p>${text}</p></article>`).join('')}</div><p class="table-note">Это не диагноз и не прогноз для конкретной собаки. Хороший заводчик показывает результаты обследований родителей.</p></section>`;
}
function renderBreedPage(profile, breedId) {
  const breed = getBreedProfiles().find((item) => item.id === breedId && item.scoringEligible);
  if (!breed) { renderResult(profile); return; }
  const scoreResult = window.DogScoring.scoreBreed(profile, breed);
  const score = scoreResult ? scoreResult.compatibility : null;
  const good = scoreResult ? humanReasons(scoreResult.details, 'good') : [];
  const hard = scoreResult ? humanReasons(scoreResult.details, 'hard') : [];
  app.innerHTML = `<main class="result-page"><header class="result-header"><a href="index.html" class="quiz-logo"><img src="assets/logo.svg?v=4" alt="Мой пёс"></a></header><section class="result-hero"><p class="result-kicker">Профиль породы</p><h1>${breed.nameRu}</h1><p>${breedSubtitle(breed)} ${fciPurposes[breed.fciGroup]}</p><button class="result-back" id="back-to-result" type="button">← Назад к результату</button></section><section class="result-section breed-profile-layout"><article class="breed-profile-card"><img src="${breed.image || 'assets/dog-image-2.png'}" alt="${breed.image ? breed.nameRu : ''}"><div><div class="breed-card-meta"><span class="breed-rank">Ваша совместимость</span><span class="breed-score">${score === null ? 'нет данных' : `${score}/100`}</span></div><h2>Что важно знать</h2><p>${healthNote(breed)}.</p><p>${fciPurposes[breed.fciGroup]}</p></div></article><article class="result-card"><h2>Как это совпадает с вами</h2><ul class="result-list">${good.map((item) => `<li>Совпадает ${item}.</li>`).join('') || '<li>Недостаточно данных для оценки.</li>'}</ul>${hard.length ? `<h3 class="breed-risks-heading">На что обратить внимание</h3><ul class="result-list">${hard.map((item) => `<li>${item} может потребовать больше внимания.</li>`).join('')}</ul>` : ''}</article></section>${breedHealthDetails(breed)}${breedDetailsTable(breed)}${breedExplorerMarkup()}${footer()}</main>`;
  document.querySelector('#back-to-result').addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('breed');
    window.history.pushState({}, '', url);
    renderResult(profile);
  });
  bindBreedExplorer(profile);
}
function bindBreedExplorer(profile) {
  const search = document.querySelector('#breed-search');
  const select = document.querySelector('#breed-select');
  const error = document.querySelector('#breed-explorer-error');
  document.querySelector('#open-breed')?.addEventListener('click', () => {
    const target = select?.value || normalizedBreedName(search?.value);
    const breed = getBreedProfiles().find((item) => item.id === target || normalizedBreedName(item.nameRu) === target);
    if (!breed) { error.hidden = false; return; }
    openBreedPage(profile, breed.id);
  });
}

function openSavedRouteOrHome() {
  const query = new URLSearchParams(window.location.search);
  const group = Number(query.get('group'));
  const breedId = query.get('breed');
  try {
    const profile = JSON.parse(sessionStorage.getItem('my-pes-profile'));
    if (breedProfilesStatus === 'ready' && breedId && profile && profile.values) {
      renderBreedPage(profile, breedId);
      return;
    }
    if (breedProfilesStatus === 'ready' && group >= 1 && group <= 10 && profile && profile.values) {
      renderGroupPage(profile, group);
      return;
    }
  } catch (_) { /* no saved quiz profile */ }
  home();
}

function renderResult(profileOverride = null) {
  const profile = profileOverride || buildUserProfile();
  sessionStorage.setItem('my-pes-profile', JSON.stringify(profile));
  const breeds = getBreedProfiles();
  const result = actualResult(profile, breeds);
  if (!result) { renderDatabasePending(profile); return; }
  analytics.goal('result_view', { result: { fci_group: result.primary.group, score: result.primary.score } });
  const isWeak = result.fit === 'weak';
  const good = humanReasons(result.top.result.details, 'good');
  const hard = humanReasons(result.top.result.details, 'hard');
  const topBreeds = result.groupBreeds.slice(0, 3);
  const remainingBreeds = result.groupBreeds.slice(3);
  const breedHeading = topBreeds.length === 1 ? 'Лучшее совпадение' : 'Лучшие совпадения';
  const rankedRest = remainingBreeds.length ? `<section class="result-section"><h2>Все остальные породы этой группы</h2><p class="section-note">Другие проверенные породы в выбранной категории.</p>${rankCards(remainingBreeds, false)}</section>` : '';
  app.innerHTML = `<main class="result-page"><header class="result-header"><a href="index.html" class="quiz-logo"><img src="assets/logo.svg?v=4" alt="Мой пёс"></a></header><section class="result-hero ${isWeak ? 'pause' : ''}"><h1>Вам подходят<br>${fciNames[result.primary.group]}</h1><p>${fciPurposes[result.primary.group]} ${isWeak ? 'Сильного совпадения нет: это наименее конфликтный вариант среди сравниваемых пород.' : 'Группа выбрана после сравнения конкретных пород с вашим образом жизни и предпочтениями.'}</p></section><section class="result-section match-grid"><article class="result-card"><h2>Почему подходит именно вам</h2><ul class="result-list">${good.map((item) => `<li>Хорошо совпадает ${item}.</li>`).join('')}</ul></article><article class="result-card"><h2>Вам может не подойти</h2><ul class="result-list">${hard.map((item) => `<li>${item}.</li>`).join('')}</ul></article></section><section class="result-section"><h2>${breedHeading}</h2><p class="section-note">1–${topBreeds.length} место из ${result.groupBreeds.length} пород в этой категории.</p><div class="breed-grid">${topBreeds.map(({ breed, score }, index) => `<article class="breed-card"><img src="${breed.image || 'assets/dog-image-2.png'}" alt="${breed.nameRu}"><div class="breed-card-body"><div class="breed-card-meta"><span class="breed-rank">${index + 1} место</span><span class="breed-score">Совместимость ${score}/100</span></div><h3>${breed.nameRu}</h3><p class="breed-description">${breedSubtitle(breed)}</p></div></article>`).join('')}</div></section>${comparisonTable(topBreeds)}${rankedRest}${result.alternative ? `<section class="result-section result-card alternative-card"><h2>Близкая альтернатива</h2><p>${fciNames[result.alternative.group]} — ${result.alternative.score}/100. Она уступила основной категории по совпадению ключевых требований.</p><button class="button" id="show-alternative" type="button">Смотреть породы</button></section>` : ''}${breedExplorerMarkup()}${commonResultSections()}</main>`;
  bindConsultation();
  document.querySelector('#show-alternative')?.addEventListener('click', () => openAlternativeGroup(profile, result.alternative.group));
  bindBreedExplorer(profile);
}

function commonResultSections(includeProfile = true) {
  const profileSection = includeProfile ? `<section class="result-section result-card"><h2>Ваш профиль предпочтений</h2><ul class="result-list">${profileRows()}</ul></section>` : '';
  return `${profileSection}<section class="result-section next-steps"><h2>Что делать дальше</h2><div class="next-grid"><article class="result-card"><h3>Чек-лист до появления собаки</h3><ul class="result-list"><li>Познакомиться с конкретной собакой или родителями щенка.</li><li>Проверить документы, условия содержания и обследования.</li><li>Подготовить лежанку, миски, корм, игрушки, шлейку и обычный поводок.</li></ul></article><article class="result-card consultation-card"><h3>Консультация с кинологом</h3><p>Разберём ваши ответы, образ жизни и несколько конкретных пород до решения.</p><button class="button" id="consultation-button" type="button">Оставить заявку</button></article></div></section><section class="result-section result-card"><h2>Жизнь с собакой</h2><p class="section-note">Даже хорошо подобранная собака остаётся собакой. Это ежедневные прогулки, расходы на корм и ветеринара, организация поездок, обучение, грязные лапы и иногда испорченные вещи. Щенок может первое время ходить в туалет дома, будить ночью, грызть вещи и плохо оставаться один. Взрослой собаке тоже понадобится время на адаптацию. Хороший подбор делает совместную жизнь проще, но не делает собаку беспроблемной.</p><p class="table-note">Породный профиль описывает тенденции, а не гарантирует характер конкретной собаки.</p></section><section class="result-section bri-support"><img src="assets/dog-image-2.png" alt="Бри"><div><h2>На новую игрушку Бри</h2><p>Тест останется бесплатным. Если он оказался полезен, можно поддержать проект.</p><a class="button" href="${donationUrl}" target="_blank" rel="noopener" data-donation="result">Поддержать проект</a></div></section>${footer()}`;
}

function renderDatabasePending(profile) {
  app.innerHTML = `<main class="result-page"><header class="result-header"><a href="index.html" class="quiz-logo"><img src="assets/logo.svg?v=4" alt="Мой пёс"></a></header><section class="result-hero pause"><p class="result-kicker">Тест пройден</p><h1>Ваш профиль готов.<br>Нужна база пород.</h1><p>Калибровка подключена, но в переданных материалах нет проверенных профилей пород. Я не буду подменять их случайными рекомендациями: без базы нельзя честно посчитать FCI-группу и подходящие породы.</p></section><section class="result-section result-card"><h2>Ваш профиль предпочтений</h2><ul class="result-list">${profileRows()}</ul></section><section class="result-section result-card"><h2>Что появится после загрузки базы</h2><ul class="result-list"><li>Одна FCI-группа, посчитанная по лучшим конкретным породам.</li><li>Три породы с баллом совместимости, а не вероятностью.</li><li>Причины совпадения, возможные сложности и близкая альтернатива.</li></ul></section>${commonResultSections(false)}</main>`;
  bindConsultation();
}

function bindConsultation() {
  const button = document.querySelector('#consultation-button');
  if (button) button.addEventListener('click', () => alert('Форма заявки на консультацию появится здесь после подключения записи.'));
}

openSavedRouteOrHome();
