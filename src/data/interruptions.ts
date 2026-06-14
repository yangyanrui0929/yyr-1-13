import type { InterruptionEvent } from '@/types'

export const INTERRUPTIONS: InterruptionEvent[] = [
  {
    id: 'i1',
    customerType: '江湖人',
    content: '这位客官猛地一拍桌子：「这侠客也太墨迹了！若是我，三招之内必取那贼人性命！」',
    options: [
      {
        text: '拱手赔笑：「客官说得是，且听下回分解，必有精彩打斗」',
        satisfactionEffect: 10,
        reputationEffect: 1,
        goldEffect: 0,
      },
      {
        text: '正色道：「客官稍安勿躁，故事讲究起承转合」',
        satisfactionEffect: -5,
        reputationEffect: 0,
        goldEffect: 0,
      },
      {
        text: '端上一杯好茶：「客官消消气，且品茶听书」',
        satisfactionEffect: 5,
        reputationEffect: 1,
        goldEffect: -5,
      },
    ],
  },
  {
    id: 'i2',
    customerType: '书生',
    content: '一书生摇头晃脑：「此段情节与史书所载不符，谬误，谬误啊！」',
    options: [
      {
        text: '笑道：「这位相公高见，说书人讲求的是个趣味，正史还请翻阅典籍」',
        satisfactionEffect: 8,
        reputationEffect: 2,
        goldEffect: 0,
      },
      {
        text: '「相公若不喜欢，可移步他处」',
        satisfactionEffect: -20,
        reputationEffect: -3,
        goldEffect: 0,
      },
      {
        text: '连忙改口：「相公说得对，我这就纠正」',
        satisfactionEffect: 15,
        reputationEffect: 1,
        goldEffect: 0,
      },
    ],
  },
  {
    id: 'i3',
    customerType: '商贾',
    content: '一商人摸了摸钱袋：「掌柜的，这茶都凉了，怎么还不续上？莫不是看不起我这几个茶钱？」',
    options: [
      {
        text: '亲自端上热茶：「是小的疏忽，这杯算我请」',
        satisfactionEffect: 15,
        reputationEffect: 2,
        goldEffect: -8,
      },
      {
        text: '「客官稍等，伙计这就来」',
        satisfactionEffect: 0,
        reputationEffect: 0,
        goldEffect: 0,
      },
      {
        text: '「续茶需另付茶钱，客官见谅」',
        satisfactionEffect: -15,
        reputationEffect: -2,
        goldEffect: 5,
      },
    ],
  },
  {
    id: 'i4',
    customerType: '妇人',
    content: '一位夫人掏出手帕抹眼泪：「呜呜...这小姐太可怜了，怎的命这般苦...」',
    options: [
      {
        text: '放缓语速：「夫人莫急，这苦尽甘来，小姐自有后福」',
        satisfactionEffect: 20,
        reputationEffect: 2,
        goldEffect: 0,
      },
      {
        text: '「夫人莫哭，故事而已，不必当真」',
        satisfactionEffect: -10,
        reputationEffect: 0,
        goldEffect: 0,
      },
      {
        text: '递上点心：「夫人尝尝这桂花糕，甜甜嘴」',
        satisfactionEffect: 12,
        reputationEffect: 1,
        goldEffect: -4,
      },
    ],
  },
  {
    id: 'i5',
    customerType: '官员',
    content: '一位官员模样的客人皱了皱眉：「这官场面面俱到，倒是写得真切...只是有些话，讲不得太明啊。」',
    options: [
      {
        text: '拱手：「大人教诲得是，小民知错，后续定当注意」',
        satisfactionEffect: 15,
        reputationEffect: 3,
        goldEffect: 0,
      },
      {
        text: '「大人说笑了，不过是野史稗闻，当不得真」',
        satisfactionEffect: 5,
        reputationEffect: 0,
        goldEffect: 0,
      },
      {
        text: '继续讲下去，装作没听见',
        satisfactionEffect: -20,
        reputationEffect: -5,
        goldEffect: 0,
      },
    ],
  },
  {
    id: 'i6',
    customerType: '平民',
    content: '一位老者咳了两声：「咳咳...这位小兄弟，声音可否大些？老朽这耳朵，不大中用了。」',
    options: [
      {
        text: '提高音量：「老丈见谅，我这就说大声些」',
        satisfactionEffect: 15,
        reputationEffect: 2,
        goldEffect: 0,
      },
      {
        text: '请老丈移至前排雅座',
        satisfactionEffect: 20,
        reputationEffect: 3,
        goldEffect: -3,
      },
      {
        text: '「老丈，说书人嗓子也有限，见谅则个」',
        satisfactionEffect: -10,
        reputationEffect: -1,
        goldEffect: 0,
      },
    ],
  },
  {
    id: 'i-tea-urge-merchant',
    customerType: '商贾',
    content: '那商人脸色渐沉，用茶盖刮了刮早已凉透的茶碗，语气不耐：「掌柜的！某花了钱不是来喝凉茶的！这故事好是好，可这茶凉得心也凉了！」',
    options: [
      {
        text: '立刻小跑上前，亲奉滚热新茶：「是小的怠慢！这杯极品龙井算我请客，客官消消气」',
        satisfactionEffect: 25,
        reputationEffect: 2,
        goldEffect: -10,
      },
      {
        text: '高声招呼伙计：「快给这位爷续上热茶！再加一碟上好的松子糖」',
        satisfactionEffect: 12,
        reputationEffect: 1,
        goldEffect: -5,
      },
      {
        text: '陪笑道：「客官稍候，这人手实在不够...」',
        satisfactionEffect: -20,
        reputationEffect: -2,
        goldEffect: 0,
      },
    ],
  },
  {
    id: 'i-tea-leave-premium',
    customerType: '官员',
    content: '雅座那位大人缓缓起身，拂袖将凉茶杯扫在地上，瓷片四溅：「哼！如此待客之道？茶凉如此，某不在此受辱！」（其余客人皆侧目观望）',
    options: [
      {
        text: '扑通跪倒，连连叩头：「大人恕罪！小的该死！求大人给小的一个补救的机会！」',
        satisfactionEffect: 10,
        reputationEffect: 1,
        goldEffect: -20,
      },
      {
        text: '长揖到底，命伙计速奉极品好茶加精致细点：「大人息怒，且容小的将功折罪」',
        satisfactionEffect: 18,
        reputationEffect: 2,
        goldEffect: -15,
      },
      {
        text: '沉着脸命伙计拦住：「大人，这茶钱...还请结清再走」',
        satisfactionEffect: -35,
        reputationEffect: -8,
        goldEffect: 5,
      },
    ],
  },
]
