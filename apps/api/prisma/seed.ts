import { PrismaClient, Role, SeasonStatus, EventStatus, OddsMode, BetStatus, LedgerType, Category } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

interface SeedEventOutcome {
  label: string;
  sortOrder: number;
  fixedOdds?: number;
  winning?: boolean;
}

interface SeedEvent {
  id: string;
  title: string;
  description?: string;
  category: Category;
  closesAt: Date;
  startsAt: Date | null;
  status: EventStatus;
  oddsMode: OddsMode;
  minBet: number;
  maxBet: number;
  createdBy: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  seasonId: string;
  boardId: string;
  outcomes: SeedEventOutcome[];
}

const adapter = new PrismaPg({ connectionString: 'postgresql://lukakataev:@localhost:5433/betboard?schema=public' });
const prisma = new PrismaClient({ adapter });

const AVATARS = ['volt', 'sky', 'rose', 'amber', 'mint', 'violet', 'slate'];
const CATEGORIES: Category[] = ['board', 'sport', 'movie', 'food', 'travel', 'chaos', 'meta', 'games'];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data (in reverse order of dependencies)
  await prisma.eventReaction.deleteMany();
  await prisma.eventComment.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.eventOutcome.deleteMany();
  await prisma.betEvent.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.season.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.user.deleteMany();

  const now = new Date('2026-08-04T20:30:00.000Z');
  const day = 86_400_000;

  // Create users
  const usersData = [
    { id: 'u-anya', name: 'Аня', avatar: 'volt' as const },
    { id: 'u-bogdan', name: 'Богдан', avatar: 'sky' as const },
    { id: 'u-vika', name: 'Вика', avatar: 'rose' as const },
    { id: 'u-gosha', name: 'Гоша', avatar: 'amber' as const },
    { id: 'u-lena', name: 'Лена', avatar: 'mint' as const },
    { id: 'u-nikita', name: 'Никита', avatar: 'violet' as const },
    { id: 'u-mark', name: 'Марк', avatar: 'slate' as const },
    { id: 'u-dasha', name: 'Даша', avatar: 'sky' as const },
  ];

  const passwordHash = await bcrypt.hash('demo', 10);

  for (const userData of usersData) {
    await prisma.user.create({ data: userData });
    await prisma.credential.create({
      data: {
        userId: userData.id,
        login: userData.id.replace(/^u-/, ''),
        passwordHash,
      },
    });
  }

  console.log('✅ Users created');

  // Create board
  const board = await prisma.board.create({
    data: {
      id: 'b-1',
      slug: 'board',
      name: 'Пятница',
      description: 'Настолки, кино и споры о том, кто заказывает пиццу. Сезонные очки, оракулы и никаких реальных денег.',
      ownerId: 'u-anya',
      currencyName: 'очки',
      timezone: 'Europe/Moscow',
      inviteCode: 'BB-PYAT-7F3K',
      createdAt: new Date(now.getTime() - 42 * day),
    },
  });

  console.log('✅ Board created');

  // Create members
  const membersData = [
    { boardId: board.id, userId: 'u-anya', role: Role.owner, joinedAt: new Date(now.getTime() - 42 * day), title: 'Хранительница доски' },
    { boardId: board.id, userId: 'u-bogdan', role: Role.admin, joinedAt: new Date(now.getTime() - 41 * day), title: 'Главный риск-менеджер' },
    { boardId: board.id, userId: 'u-vika', role: Role.member, joinedAt: new Date(now.getTime() - 40 * day), title: 'Оракул настолок' },
    { boardId: board.id, userId: 'u-gosha', role: Role.member, joinedAt: new Date(now.getTime() - 39 * day), title: 'Генератор рисков' },
    { boardId: board.id, userId: 'u-lena', role: Role.member, joinedAt: new Date(now.getTime() - 38 * day), title: 'Холодный расчёт' },
    { boardId: board.id, userId: 'u-nikita', role: Role.member, joinedAt: new Date(now.getTime() - 37 * day), title: null },
    { boardId: board.id, userId: 'u-mark', role: Role.member, joinedAt: new Date(now.getTime() - 12 * day), title: 'Новичок сезона' },
    { boardId: board.id, userId: 'u-dasha', role: Role.member, joinedAt: new Date(now.getTime() - 5 * day), title: null },
  ];

  for (const member of membersData) {
    await prisma.groupMember.create({ data: member });
  }

  console.log('✅ Members created');

  // Create seasons
  const seasonPast = await prisma.season.create({
    data: {
      id: 's-2026-07',
      boardId: board.id,
      name: 'Июль 2026',
      status: SeasonStatus.finished,
      startingBalance: 1000,
      startsAt: new Date(now.getTime() - 35 * day),
      endsAt: new Date(now.getTime() - 5 * day),
    },
  });

  const seasonActive = await prisma.season.create({
    data: {
      id: 's-2026-08',
      boardId: board.id,
      name: 'Август 2026',
      status: SeasonStatus.active,
      startingBalance: 1000,
      startsAt: new Date(now.getTime() - 4 * day),
      endsAt: new Date(now.getTime() + 27 * day),
    },
  });

  console.log('✅ Seasons created');

  // Create wallets for active season
  for (const userData of usersData) {
    await prisma.wallet.create({
      data: {
        id: `w-${userData.id}`,
        seasonId: seasonActive.id,
        userId: userData.id,
        balance: 1000,
        lockedBalance: 0,
      },
    });
  }

  console.log('✅ Wallets created');

  // Create events for active season
  const eventData: SeedEvent[] = [
    {
      id: 'e-carcassonne',
      title: 'Кто выиграет партию в «Каркассон»?',
      description: 'Субботняя партия. Классика, без дополнений. Ставки до начала раздачи.',
      category: Category.board,
      closesAt: new Date(now.getTime() + 2 * 3600_000),
      startsAt: new Date(now.getTime() + 3 * 3600_000),
      status: EventStatus.open,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 300,
      createdBy: 'u-anya',
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: 'Аня', sortOrder: 0 },
        { label: 'Богдан', sortOrder: 1 },
        { label: 'Вика', sortOrder: 2 },
        { label: 'Гоша', sortOrder: 3 },
      ],
    },
    {
      id: 'e-azul',
      title: 'Кто победит в Azul?',
      description: 'Изразцы, споры о цветах и торт на кону.',
      category: Category.board,
      closesAt: new Date(now.getTime() + 5 * 3600_000),
      startsAt: new Date(now.getTime() + 6 * 3600_000),
      status: EventStatus.open,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 250,
      createdBy: 'u-vika',
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: 'Вика', sortOrder: 0 },
        { label: 'Лена', sortOrder: 1 },
        { label: 'Марк', sortOrder: 2 },
      ],
    },
    {
      id: 'e-pizza',
      title: 'Закажем ли пиццу после 22:00?',
      description: 'Классический вечерний вопрос. Ставка про то, сломается ли кто-то первым.',
      category: Category.food,
      closesAt: new Date(now.getTime() + 6 * 3600_000),
      startsAt: new Date(now.getTime() + 8 * 3600_000),
      status: EventStatus.open,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 200,
      createdBy: 'u-gosha',
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: 'Да', sortOrder: 0 },
        { label: 'Нет', sortOrder: 1 },
      ],
    },
    {
      id: 'e-kinoprobros',
      title: 'Какой фильм выберем на вечер?',
      description: 'До начала голосования. У кого вкус — тот и выбирает.',
      category: Category.movie,
      closesAt: new Date(now.getTime() + 26 * 3600_000),
      startsAt: new Date(now.getTime() + 30 * 3600_000),
      status: EventStatus.open,
      oddsMode: OddsMode.fixed,
      minBet: 10,
      maxBet: 150,
      createdBy: 'u-lena',
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: '«Интерстеллар»', fixedOdds: 1.6, sortOrder: 0 },
        { label: '«Большой Лебовски»', fixedOdds: 2.4, sortOrder: 1 },
        { label: '«Нечто»', fixedOdds: 5.0, sortOrder: 2 },
      ],
    },
    {
      id: 'e-late',
      title: 'Кто последним придёт на встречу?',
      description: 'Встреча в 19:00 у Марка. Букмекеры нервно курят.',
      category: Category.chaos,
      closesAt: new Date(now.getTime() + 30 * 3600_000),
      startsAt: new Date(now.getTime() + 30 * 3600_000),
      status: EventStatus.open,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 200,
      createdBy: 'u-nikita',
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: 'Никита', sortOrder: 0 },
        { label: 'Марк', sortOrder: 1 },
        { label: 'Лена', sortOrder: 2 },
        { label: 'Никто не опоздает', sortOrder: 3 },
      ],
    },
    {
      id: 'e-5x5',
      title: 'Товарищеский матч 5×5',
      description: 'Поле в парке, ворота из курток. Дополнительно: будет ли больше 10 голов.',
      category: Category.sport,
      closesAt: new Date(now.getTime() + 48 * 3600_000),
      startsAt: new Date(now.getTime() + 49 * 3600_000),
      status: EventStatus.open,
      oddsMode: OddsMode.parimutuel,
      minBet: 20,
      maxBet: 300,
      createdBy: 'u-bogdan',
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: 'Синие', sortOrder: 0 },
        { label: 'Зелёные', sortOrder: 1 },
        { label: 'Ничья', sortOrder: 2 },
      ],
    },
    {
      id: 'e-tv-cup',
      title: 'Кто станет чемпионом сезона в дартс?',
      description: 'Сезонная лига, финал в четверг. Аутсайдеры — ваши лучшие друзья.',
      category: Category.sport,
      closesAt: new Date(now.getTime() + 72 * 3600_000),
      startsAt: null,
      status: EventStatus.open,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 300,
      createdBy: 'u-anya',
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: 'Богдан', sortOrder: 0 },
        { label: 'Гоша', sortOrder: 1 },
        { label: 'Вика', sortOrder: 2 },
        { label: 'Лена', sortOrder: 3 },
      ],
    },
    // Closed event
    {
      id: 'e-opros',
      title: 'Кто предложит пойти в бар после настолок?',
      description: 'Классика жанра. Ставки закрыты, результат вот-вот наступит.',
      category: Category.chaos,
      closesAt: new Date(now.getTime() - 1 * 3600_000),
      startsAt: new Date(now.getTime() - 30 * 60_000),
      status: EventStatus.closed,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 150,
      createdBy: 'u-dasha',
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: 'Никита', sortOrder: 0 },
        { label: 'Гоша', sortOrder: 1 },
        { label: 'Даша', sortOrder: 2 },
      ],
    },
    // Resolved events (past season)
    {
      id: 'e-carcassonne-w',
      title: 'Кто выиграет партию в «Каркассон»?',
      description: 'Тот самый вечер, когда Гоша собрал гигантский город.',
      category: Category.board,
      closesAt: new Date(now.getTime() - 6 * day),
      startsAt: new Date(now.getTime() - 6 * day + 2 * 3600_000),
      status: EventStatus.resolved,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 300,
      createdBy: 'u-anya',
      resolvedBy: 'u-anya',
      resolvedAt: new Date(now.getTime() - 5 * day),
      seasonId: seasonPast.id,
      boardId: board.id,
      outcomes: [
        { label: 'Аня', winning: false, sortOrder: 0 },
        { label: 'Богдан', winning: true, sortOrder: 1 },
        { label: 'Вика', winning: false, sortOrder: 2 },
        { label: 'Гоша', winning: false, sortOrder: 3 },
      ],
    },
    {
      id: 'e-first-blood',
      title: 'Кто первым уйдёт домой с вечеринки?',
      description: 'Тотал за выживание. Скандал в третьем часу.',
      category: Category.chaos,
      closesAt: new Date(now.getTime() - 4 * day),
      startsAt: new Date(now.getTime() - 4 * day + 3 * 3600_000),
      status: EventStatus.resolved,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 150,
      createdBy: 'u-mark',
      resolvedBy: 'u-bogdan',
      resolvedAt: new Date(now.getTime() - 3 * day),
      seasonId: seasonPast.id,
      boardId: board.id,
      outcomes: [
        { label: 'Марк', winning: false, sortOrder: 0 },
        { label: 'Лена', winning: false, sortOrder: 1 },
        { label: 'Гоша', winning: true, sortOrder: 2 },
        { label: 'Никто не уйдёт раньше часа ночи', winning: false, sortOrder: 3 },
      ],
    },
    {
      id: 'e-karelia',
      title: 'Доедем ли до Карелии без проколов?',
      description: 'Поездка выходного дня. Спойлер: колесо сдалось.',
      category: Category.travel,
      closesAt: new Date(now.getTime() - 11 * day),
      startsAt: new Date(now.getTime() - 11 * day + 1 * 3600_000),
      status: EventStatus.resolved,
      oddsMode: OddsMode.fixed,
      minBet: 20,
      maxBet: 400,
      createdBy: 'u-lena',
      resolvedBy: 'u-lena',
      resolvedAt: new Date(now.getTime() - 9 * day),
      seasonId: seasonPast.id,
      boardId: board.id,
      outcomes: [
        { label: 'Доедем', fixedOdds: 1.3, winning: false, sortOrder: 0 },
        { label: 'Одно происшествие', fixedOdds: 3.5, winning: true, sortOrder: 1 },
        { label: 'Полный сюрприз', fixedOdds: 8.0, winning: false, sortOrder: 2 },
      ],
    },
    {
      id: 'e-quiz',
      title: 'Кто выиграет квиз про 90-е?',
      description: 'Три команды, 40 вопросов, один плейлист на девяностые.',
      category: Category.meta,
      closesAt: new Date(now.getTime() - 15 * day),
      startsAt: new Date(now.getTime() - 15 * day + 2 * 3600_000),
      status: EventStatus.resolved,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 250,
      createdBy: 'u-bogdan',
      resolvedBy: 'u-anya',
      resolvedAt: new Date(now.getTime() - 14 * day),
      seasonId: seasonPast.id,
      boardId: board.id,
      outcomes: [
        { label: 'Команда Ани', winning: true, sortOrder: 0 },
        { label: 'Команда Богдана', winning: false, sortOrder: 1 },
        { label: 'Команда Вики', winning: false, sortOrder: 2 },
      ],
    },
    {
      id: 'e-pizzy-count',
      title: 'Сколько пицц закажут на пятницу?',
      description: 'Аппетит растёт. Официант просил не возвращаться.',
      category: Category.food,
      closesAt: new Date(now.getTime() - 8 * day),
      startsAt: new Date(now.getTime() - 8 * day + 4 * 3600_000),
      status: EventStatus.resolved,
      oddsMode: OddsMode.fixed,
      minBet: 10,
      maxBet: 150,
      createdBy: 'u-dasha',
      resolvedBy: 'u-dasha',
      resolvedAt: new Date(now.getTime() - 7 * day),
      seasonId: seasonPast.id,
      boardId: board.id,
      outcomes: [
        { label: '3', fixedOdds: 2.2, winning: false, sortOrder: 0 },
        { label: '4', fixedOdds: 1.8, winning: false, sortOrder: 1 },
        { label: '5+', fixedOdds: 3.1, winning: true, sortOrder: 2 },
      ],
    },
    {
      id: 'e-100-debate',
      title: 'Будет ли спор о правилах в «Мафии»?',
      description: 'Спойлер: был. Уже на второй игровой ночи.',
      category: Category.meta,
      closesAt: new Date(now.getTime() - 20 * day),
      startsAt: new Date(now.getTime() - 20 * day + 1 * 3600_000),
      status: EventStatus.resolved,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 200,
      createdBy: 'u-nikita',
      resolvedBy: 'u-bogdan',
      resolvedAt: new Date(now.getTime() - 19 * day),
      seasonId: seasonPast.id,
      boardId: board.id,
      outcomes: [
        { label: 'Да', winning: true, sortOrder: 0 },
        { label: 'Нет', winning: false, sortOrder: 1 },
      ],
    },
    // Canceled event
    {
      id: 'e-hike',
      title: 'Пойдём ли в поход в эти выходные?',
      description: 'Дождь победил. Ставки возвращены.',
      category: Category.travel,
      closesAt: new Date(now.getTime() - 2 * day),
      startsAt: new Date(now.getTime() - 2 * day + 6 * 3600_000),
      status: EventStatus.canceled,
      oddsMode: OddsMode.parimutuel,
      minBet: 10,
      maxBet: 300,
      createdBy: 'u-mark',
      resolvedBy: 'u-mark',
      resolvedAt: new Date(now.getTime() - 1 * day),
      seasonId: seasonActive.id,
      boardId: board.id,
      outcomes: [
        { label: 'Пойдём', sortOrder: 0 },
        { label: 'Перенесём', sortOrder: 1 },
      ],
    },
  ];

  for (const event of eventData) {
    const { outcomes, ...eventFields } = event;
    const createdEvent = await prisma.betEvent.create({ data: eventFields });

    for (const outcome of outcomes) {
      await prisma.eventOutcome.create({
        data: {
          id: `${createdEvent.id}:o${outcome.sortOrder}`,
          eventId: createdEvent.id,
          label: outcome.label,
          sortOrder: outcome.sortOrder,
          fixedOdds: outcome.fixedOdds ?? null,
          winning: outcome.winning ?? null,
        },
      });
    }
  }

  console.log('✅ Events and outcomes created');

  // Create bets (for active events)
  const betsData = [
    // Open events bets
    { id: 'bt-1', eventId: 'e-carcassonne', outcomeId: 'e-carcassonne:o2', userId: 'u-vika', amount: 120, status: BetStatus.active },
    { id: 'bt-2', eventId: 'e-carcassonne', outcomeId: 'e-carcassonne:o3', userId: 'u-gosha', amount: 80, status: BetStatus.active },
    { id: 'bt-3', eventId: 'e-carcassonne', outcomeId: 'e-carcassonne:o0', userId: 'u-anya', amount: 100, status: BetStatus.active },
    { id: 'bt-4', eventId: 'e-carcassonne', outcomeId: 'e-carcassonne:o1', userId: 'u-nikita', amount: 60, status: BetStatus.active },
    { id: 'bt-5', eventId: 'e-azul', outcomeId: 'e-azul:o0', userId: 'u-vika', amount: 90, status: BetStatus.active },
    { id: 'bt-6', eventId: 'e-azul', outcomeId: 'e-azul:o1', userId: 'u-lena', amount: 140, status: BetStatus.active },
    { id: 'bt-7', eventId: 'e-azul', outcomeId: 'e-azul:o2', userId: 'u-mark', amount: 40, status: BetStatus.active },
    { id: 'bt-8', eventId: 'e-pizza', outcomeId: 'e-pizza:o0', userId: 'u-gosha', amount: 200, status: BetStatus.active },
    { id: 'bt-9', eventId: 'e-pizza', outcomeId: 'e-pizza:o1', userId: 'u-lena', amount: 100, status: BetStatus.active },
    { id: 'bt-10', eventId: 'e-kinoprobros', outcomeId: 'e-kinoprobros:o1', userId: 'u-vika', amount: 100, status: BetStatus.active },
    { id: 'bt-11', eventId: 'e-kinoprobros', outcomeId: 'e-kinoprobros:o0', userId: 'u-anya', amount: 150, status: BetStatus.active },
    { id: 'bt-12', eventId: 'e-kinoprobros', outcomeId: 'e-kinoprobros:o2', userId: 'u-gosha', amount: 50, status: BetStatus.active },
    { id: 'bt-13', eventId: 'e-late', outcomeId: 'e-late:o0', userId: 'u-nikita', amount: 70, status: BetStatus.active },
    { id: 'bt-14', eventId: 'e-late', outcomeId: 'e-late:o1', userId: 'u-mark', amount: 100, status: BetStatus.active },
    { id: 'bt-15', eventId: 'e-late', outcomeId: 'e-late:o3', userId: 'u-lena', amount: 60, status: BetStatus.active },
    { id: 'bt-16', eventId: 'e-5x5', outcomeId: 'e-5x5:o0', userId: 'u-bogdan', amount: 150, status: BetStatus.active },
    { id: 'bt-17', eventId: 'e-5x5', outcomeId: 'e-5x5:o1', userId: 'u-vika', amount: 120, status: BetStatus.active },
    { id: 'bt-18', eventId: 'e-5x5', outcomeId: 'e-5x5:o2', userId: 'u-gosha', amount: 30, status: BetStatus.active },
    { id: 'bt-19', eventId: 'e-tv-cup', outcomeId: 'e-tv-cup:o0', userId: 'u-bogdan', amount: 200, status: BetStatus.active },
    { id: 'bt-20', eventId: 'e-tv-cup', outcomeId: 'e-tv-cup:o3', userId: 'u-lena', amount: 100, status: BetStatus.active },
    // Closed event bets
    { id: 'bt-21', eventId: 'e-opros', outcomeId: 'e-opros:o1', userId: 'u-gosha', amount: 120, status: BetStatus.active },
    { id: 'bt-22', eventId: 'e-opros', outcomeId: 'e-opros:o0', userId: 'u-nikita', amount: 80, status: BetStatus.active },
    { id: 'bt-23', eventId: 'e-opros', outcomeId: 'e-opros:o2', userId: 'u-dasha', amount: 100, status: BetStatus.active },
    // Resolved events bets (past season)
    { id: 'bt-30', eventId: 'e-carcassonne-w', outcomeId: 'e-carcassonne-w:o1', userId: 'u-bogdan', amount: 150, status: BetStatus.won, payout: 460 },
    { id: 'bt-31', eventId: 'e-carcassonne-w', outcomeId: 'e-carcassonne-w:o1', userId: 'u-vika', amount: 50, status: BetStatus.won, payout: 153 },
    { id: 'bt-32', eventId: 'e-carcassonne-w', outcomeId: 'e-carcassonne-w:o0', userId: 'u-anya', amount: 120, status: BetStatus.lost, payout: 0 },
    { id: 'bt-33', eventId: 'e-carcassonne-w', outcomeId: 'e-carcassonne-w:o2', userId: 'u-gosha', amount: 90, status: BetStatus.lost, payout: 0 },
    { id: 'bt-34', eventId: 'e-carcassonne-w', outcomeId: 'e-carcassonne-w:o3', userId: 'u-nikita', amount: 70, status: BetStatus.lost, payout: 0 },
    { id: 'bt-35', eventId: 'e-carcassonne-w', outcomeId: 'e-carcassonne-w:o1', userId: 'u-lena', amount: 100, status: BetStatus.won, payout: 307 },
    { id: 'bt-40', eventId: 'e-first-blood', outcomeId: 'e-first-blood:o2', userId: 'u-gosha', amount: 80, status: BetStatus.won, payout: 320 },
    { id: 'bt-41', eventId: 'e-first-blood', outcomeId: 'e-first-blood:o2', userId: 'u-vika', amount: 60, status: BetStatus.won, payout: 240 },
    { id: 'bt-42', eventId: 'e-first-blood', outcomeId: 'e-first-blood:o3', userId: 'u-lena', amount: 110, status: BetStatus.lost, payout: 0 },
    { id: 'bt-43', eventId: 'e-first-blood', outcomeId: 'e-first-blood:o0', userId: 'u-mark', amount: 50, status: BetStatus.lost, payout: 0 },
    { id: 'bt-50', eventId: 'e-karelia', outcomeId: 'e-karelia:o1', userId: 'u-lena', amount: 100, status: BetStatus.won, payout: 350 },
    { id: 'bt-51', eventId: 'e-karelia', outcomeId: 'e-karelia:o1', userId: 'u-gosha', amount: 60, status: BetStatus.won, payout: 210 },
    { id: 'bt-52', eventId: 'e-karelia', outcomeId: 'e-karelia:o0', userId: 'u-anya', amount: 200, status: BetStatus.lost, payout: 0 },
    { id: 'bt-53', eventId: 'e-karelia', outcomeId: 'e-karelia:o2', userId: 'u-nikita', amount: 40, status: BetStatus.lost, payout: 0 },
    { id: 'bt-60', eventId: 'e-quiz', outcomeId: 'e-quiz:o0', userId: 'u-anya', amount: 100, status: BetStatus.won, payout: 220 },
    { id: 'bt-61', eventId: 'e-quiz', outcomeId: 'e-quiz:o0', userId: 'u-vika', amount: 80, status: BetStatus.won, payout: 176 },
    { id: 'bt-62', eventId: 'e-quiz', outcomeId: 'e-quiz:o1', userId: 'u-bogdan', amount: 120, status: BetStatus.lost, payout: 0 },
    { id: 'bt-63', eventId: 'e-quiz', outcomeId: 'e-quiz:o2', userId: 'u-nikita', amount: 50, status: BetStatus.lost, payout: 0 },
    { id: 'bt-70', eventId: 'e-pizzy-count', outcomeId: 'e-pizzy-count:o2', userId: 'u-dasha', amount: 60, status: BetStatus.won, payout: 186 },
    { id: 'bt-71', eventId: 'e-pizzy-count', outcomeId: 'e-pizzy-count:o2', userId: 'u-gosha', amount: 100, status: BetStatus.won, payout: 310 },
    { id: 'bt-72', eventId: 'e-pizzy-count', outcomeId: 'e-pizzy-count:o0', userId: 'u-anya', amount: 70, status: BetStatus.lost, payout: 0 },
    { id: 'bt-73', eventId: 'e-pizzy-count', outcomeId: 'e-pizzy-count:o1', userId: 'u-vika', amount: 50, status: BetStatus.lost, payout: 0 },
    { id: 'bt-80', eventId: 'e-100-debate', outcomeId: 'e-100-debate:o0', userId: 'u-bogdan', amount: 90, status: BetStatus.won, payout: 170 },
    { id: 'bt-81', eventId: 'e-100-debate', outcomeId: 'e-100-debate:o1', userId: 'u-lena', amount: 70, status: BetStatus.lost, payout: 0 },
    // Canceled event bets (refunded)
    { id: 'bt-90', eventId: 'e-hike', outcomeId: 'e-hike:o0', userId: 'u-mark', amount: 100, status: BetStatus.refunded, payout: 0 },
    { id: 'bt-91', eventId: 'e-hike', outcomeId: 'e-hike:o1', userId: 'u-vika', amount: 60, status: BetStatus.refunded, payout: 0 },
  ];

  for (const bet of betsData) {
    await prisma.bet.create({ data: bet });
  }

  console.log('✅ Bets created');

  // Create ledger entries
  const ledgerData = [
    // Season start entries for all members
    { id: 'l-s-anya', walletId: 'w-u-anya', eventId: null, betId: null, type: LedgerType.season_start, amount: 1000, balanceAfter: 1000, createdAt: new Date(now.getTime() - 4 * day) },
    { id: 'l-s-bogdan', walletId: 'w-u-bogdan', eventId: null, betId: null, type: LedgerType.season_start, amount: 1000, balanceAfter: 1000, createdAt: new Date(now.getTime() - 4 * day) },
    { id: 'l-s-vika', walletId: 'w-u-vika', eventId: null, betId: null, type: LedgerType.season_start, amount: 1000, balanceAfter: 1000, createdAt: new Date(now.getTime() - 4 * day) },
    { id: 'l-s-gosha', walletId: 'w-u-gosha', eventId: null, betId: null, type: LedgerType.season_start, amount: 1000, balanceAfter: 1000, createdAt: new Date(now.getTime() - 4 * day) },
    { id: 'l-s-lena', walletId: 'w-u-lena', eventId: null, betId: null, type: LedgerType.season_start, amount: 1000, balanceAfter: 1000, createdAt: new Date(now.getTime() - 4 * day) },
    { id: 'l-s-nikita', walletId: 'w-u-nikita', eventId: null, betId: null, type: LedgerType.season_start, amount: 1000, balanceAfter: 1000, createdAt: new Date(now.getTime() - 4 * day) },
    { id: 'l-s-mark', walletId: 'w-u-mark', eventId: null, betId: null, type: LedgerType.season_start, amount: 1000, balanceAfter: 1000, createdAt: new Date(now.getTime() - 4 * day) },
    { id: 'l-s-dasha', walletId: 'w-u-dasha', eventId: null, betId: null, type: LedgerType.season_start, amount: 1000, balanceAfter: 1000, createdAt: new Date(now.getTime() - 4 * day) },

    // Vika's ledger (current user) - active bet locks
    { id: 'l-v-b1', walletId: 'w-u-vika', eventId: 'e-carcassonne', betId: 'bt-1', type: LedgerType.bet_lock, amount: 120, balanceAfter: 880, createdAt: new Date(now.getTime() - 50 * 60_000) },
    { id: 'l-v-b2', walletId: 'w-u-vika', eventId: 'e-azul', betId: 'bt-5', type: LedgerType.bet_lock, amount: 90, balanceAfter: 790, createdAt: new Date(now.getTime() - 90 * 60_000) },
    { id: 'l-v-b3', walletId: 'w-u-vika', eventId: 'e-kinoprobros', betId: 'bt-10', type: LedgerType.bet_lock, amount: 100, balanceAfter: 690, createdAt: new Date(now.getTime() - 5 * 3600_000) },
    { id: 'l-v-b4', walletId: 'w-u-vika', eventId: 'e-5x5', betId: 'bt-17', type: LedgerType.bet_lock, amount: 120, balanceAfter: 570, createdAt: new Date(now.getTime() - 10 * 3600_000) },

    // Vika's resolved events
    { id: 'l-v-w1', walletId: 'w-u-vika', eventId: 'e-carcassonne-w', betId: 'bt-31', type: LedgerType.bet_lock, amount: 50, balanceAfter: 520, createdAt: new Date(now.getTime() - 8 * day) },
    { id: 'l-v-w2', walletId: 'w-u-vika', eventId: 'e-carcassonne-w', betId: 'bt-31', type: LedgerType.payout, amount: 153, balanceAfter: 673, createdAt: new Date(now.getTime() - 5 * day) },
    { id: 'l-v-w3', walletId: 'w-u-vika', eventId: 'e-first-blood', betId: 'bt-41', type: LedgerType.bet_lock, amount: 60, balanceAfter: 613, createdAt: new Date(now.getTime() - 6 * day) },
    { id: 'l-v-w4', walletId: 'w-u-vika', eventId: 'e-first-blood', betId: 'bt-41', type: LedgerType.payout, amount: 240, balanceAfter: 853, createdAt: new Date(now.getTime() - 3 * day) },
    { id: 'l-v-w5', walletId: 'w-u-vika', eventId: 'e-quiz', betId: 'bt-61', type: LedgerType.bet_lock, amount: 80, balanceAfter: 773, createdAt: new Date(now.getTime() - 18 * day) },
    { id: 'l-v-w6', walletId: 'w-u-vika', eventId: 'e-quiz', betId: 'bt-61', type: LedgerType.payout, amount: 176, balanceAfter: 949, createdAt: new Date(now.getTime() - 14 * day) },
    { id: 'l-v-w7', walletId: 'w-u-vika', eventId: 'e-pizzy-count', betId: 'bt-73', type: LedgerType.bet_lock, amount: 50, balanceAfter: 899, createdAt: new Date(now.getTime() - 10 * day) },
    { id: 'l-v-w8', walletId: 'w-u-vika', eventId: 'e-hike', betId: 'bt-91', type: LedgerType.bet_lock, amount: 60, balanceAfter: 839, createdAt: new Date(now.getTime() - 4 * day) },
    { id: 'l-v-w9', walletId: 'w-u-vika', eventId: 'e-hike', betId: 'bt-91', type: LedgerType.refund, amount: 60, balanceAfter: 899, createdAt: new Date(now.getTime() - 1 * day) },
  ];

  for (const entry of ledgerData) {
    await prisma.ledgerEntry.create({ data: entry });
  }

  console.log('✅ Ledger entries created');

  // Create comments
  const commentsData = [
    { id: 'c-1', eventId: 'e-carcassonne', userId: 'u-gosha', text: 'Гоша выиграет, я знаю. Поставил на себя и не краснею.', createdAt: new Date(now.getTime() - 48 * 60_000) },
    { id: 'c-2', eventId: 'e-carcassonne', userId: 'u-anya', text: 'Угу, в прошлый раз ты тоже так говорил. Помним, как с городом.', createdAt: new Date(now.getTime() - 42 * 60_000) },
    { id: 'c-3', eventId: 'e-carcassonne', userId: 'u-vika', text: 'Спойлер: титул оракула настолок остаётся у меня.', createdAt: new Date(now.getTime() - 20 * 60_000) },
    { id: 'c-4', eventId: 'e-pizza', userId: 'u-lena', text: 'Если закажем — я на диабет, вы на пепперони.', createdAt: new Date(now.getTime() - 3 * 3600_000) },
    { id: 'c-5', eventId: 'e-first-blood', userId: 'u-mark', text: 'Я вообще-то уходил по делу! Гоша просто струсил.', createdAt: new Date(now.getTime() - 3 * day) },
  ];

  for (const comment of commentsData) {
    await prisma.eventComment.create({ data: comment });
  }

  console.log('✅ Comments created');

  // Create reactions
  const reactionsData = [
    { id: 'r-1', eventId: 'e-carcassonne', userId: 'u-anya', emoji: '🔥', createdAt: new Date(now.getTime() - 40 * 60_000) },
    { id: 'r-2', eventId: 'e-carcassonne', userId: 'u-lena', emoji: '😱', createdAt: new Date(now.getTime() - 39 * 60_000) },
    { id: 'r-3', eventId: 'e-carcassonne', userId: 'u-nikita', emoji: '🔥', createdAt: new Date(now.getTime() - 15 * 60_000) },
    { id: 'r-4', eventId: 'e-pizza', userId: 'u-gosha', emoji: '🍕', createdAt: new Date(now.getTime() - 2 * 3600_000) },
  ];

  for (const reaction of reactionsData) {
    await prisma.eventReaction.create({ data: reaction });
  }

  console.log('✅ Reactions created');

  // Create achievements
  const achievementsData = [
    { code: 'streak-3', title: 'Три подряд', description: 'Выиграл 3 ставки подряд' },
    { code: 'underdog', title: 'Любитель аутсайдеров', description: 'Поставил на аутсайдера и выиграл' },
    { code: 'big-bet', title: 'Крупный игрок', description: 'Сделал самую большую ставку сезона' },
    { code: 'oracle-month', title: 'Оракул месяца', description: 'Лучший прогнозист месяца' },
    { code: 'chaos', title: 'Хаос-менеджер', description: 'Ставил на хаос и не пожалел' },
    { code: 'stable', title: 'Стабильность', description: 'Ни одного проигрыша за неделю' },
  ];

  for (const achievement of achievementsData) {
    await prisma.achievement.create({ data: achievement });
  }

  console.log('✅ Achievements created');

  // Create user achievements
  const userAchievementsData = [
    { userId: 'u-vika', achievementId: 'streak-3', seasonId: seasonActive.id, earnedAt: new Date(now.getTime() - 2 * day) },
    { userId: 'u-vika', achievementId: 'underdog', seasonId: seasonActive.id, earnedAt: new Date(now.getTime() - 3 * day) },
    { userId: 'u-gosha', achievementId: 'big-bet', seasonId: seasonActive.id, earnedAt: new Date(now.getTime() - 1 * day) },
    { userId: 'u-bogdan', achievementId: 'oracle-month', seasonId: seasonPast.id, earnedAt: new Date(now.getTime() - 6 * day) },
  ];

  for (const ua of userAchievementsData) {
    await prisma.userAchievement.create({ data: ua });
  }

  console.log('✅ User achievements created');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });