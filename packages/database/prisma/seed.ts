import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cloudstream.local' },
    update: {},
    create: {
      email: 'admin@cloudstream.local',
      username: 'admin',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@cloudstream.local' },
    update: {},
    create: {
      email: 'demo@cloudstream.local',
      username: 'demo',
      password: demoPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.USER,
      isActive: true,
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create user settings for demo user
  await prisma.userSettings.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      preferredQuality: '1080p',
      preferredFps: 60,
      adaptiveQuality: true,
      hardwareDecoding: true,
      lowLatencyMode: false,
    },
  });

  // Create user analytics for demo user
  await prisma.userAnalytics.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      totalPlaytime: BigInt(0),
      sessionsCount: 0,
      favoriteGames: [],
      avgSessionDuration: 0,
      lastActive: new Date(),
      deviceTypes: ['desktop'],
      locations: ['local'],
    },
  });

  // Create sample games
  const sampleGames = [
    {
      steamAppId: 730,
      name: 'Counter-Strike 2',
      description: 'The premier competitive FPS experience',
      headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
      screenshots: [
        'https://cdn.akamai.steamstatic.com/steam/apps/730/ss_1.jpg',
        'https://cdn.akamai.steamstatic.com/steam/apps/730/ss_2.jpg',
      ],
      genres: ['Action', 'FPS'],
      categories: ['Multi-player', 'Competitive'],
      developer: 'Valve',
      publisher: 'Valve',
      isInstalled: true,
    },
    {
      steamAppId: 440,
      name: 'Team Fortress 2',
      description: 'A team-based multiplayer FPS',
      headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/440/header.jpg',
      screenshots: [
        'https://cdn.akamai.steamstatic.com/steam/apps/440/ss_1.jpg',
        'https://cdn.akamai.steamstatic.com/steam/apps/440/ss_2.jpg',
      ],
      genres: ['Action', 'FPS'],
      categories: ['Multi-player', 'Free to Play'],
      developer: 'Valve',
      publisher: 'Valve',
      isInstalled: true,
    },
    {
      steamAppId: 570,
      name: 'Dota 2',
      description: 'The most-played game on Steam',
      headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg',
      screenshots: [
        'https://cdn.akamai.steamstatic.com/steam/apps/570/ss_1.jpg',
        'https://cdn.akamai.steamstatic.com/steam/apps/570/ss_2.jpg',
      ],
      genres: ['Strategy', 'MOBA'],
      categories: ['Multi-player', 'Free to Play'],
      developer: 'Valve',
      publisher: 'Valve',
      isInstalled: false,
    },
  ];

  for (const gameData of sampleGames) {
    const game = await prisma.game.upsert({
      where: { steamAppId: gameData.steamAppId },
      update: {},
      create: gameData,
    });
    console.log('✅ Created game:', game.name);
  }

  // Create Steam library for demo user
  const steamLibrary = await prisma.steamLibrary.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      totalGames: sampleGames.length,
      totalPlaytime: BigInt(0),
      lastSync: new Date(),
    },
  });

  // Add games to demo user's library
  const games = await prisma.game.findMany();
  for (const game of games) {
    await prisma.libraryEntry.upsert({
      where: {
        libraryId_gameId: {
          libraryId: steamLibrary.id,
          gameId: game.id,
        },
      },
      update: {},
      create: {
        libraryId: steamLibrary.id,
        gameId: game.id,
        playtime: BigInt(Math.floor(Math.random() * 10000)), // Random playtime
        lastPlayed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random last played within 30 days
      },
    });
  }

  console.log('✅ Created Steam library for demo user');

  // Create sample game server
  const gameServer = await prisma.gameServer.upsert({
    where: { hostname: 'localhost' },
    update: {},
    create: {
      name: 'Local Game Server',
      hostname: 'localhost',
      ipAddress: '127.0.0.1',
      port: 47989,
      status: 'ONLINE',
      region: 'local',
      cpuSpec: 'Intel i7-12700K',
      gpuSpec: 'NVIDIA RTX 4080',
      ramSize: 32,
      storageSize: BigInt(2000),
      networkSpec: '1Gbps',
      osVersion: 'Ubuntu 22.04 LTS',
      currentLoad: 0.1,
      maxConcurrentStreams: 5,
      activeStreams: 0,
      lastHeartbeat: new Date(),
      version: '1.0.0',
    },
  });

  console.log('✅ Created game server:', gameServer.name);

  // Create invite codes
  const inviteCodes = [
    'WELCOME2024',
    'BETA-ACCESS',
    'EARLY-BIRD',
    'GAMER-PASS',
    'STREAM-NOW',
  ];

  for (const code of inviteCodes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: {
        code,
        createdBy: admin.id,
        isUsed: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
  }

  console.log('✅ Created invite codes');

  // Create sample notifications
  await prisma.notification.create({
    data: {
      userId: demoUser.id,
      type: 'INFO',
      title: 'Welcome to CloudStream!',
      message: 'Your account has been created successfully. Start streaming your games now!',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: demoUser.id,
      type: 'GAME_UPDATE',
      title: 'Game Update Available',
      message: 'Counter-Strike 2 has a new update available.',
      read: false,
    },
  });

  console.log('✅ Created sample notifications');

  // Create system analytics entry
  await prisma.systemAnalytics.create({
    data: {
      date: new Date(),
      totalUsers: 2,
      activeUsers: 1,
      totalSessions: 0,
      activeSessions: 0,
      totalPlaytime: BigInt(0),
      avgConcurrentUsers: 0,
      totalBandwidth: 0,
      avgLatency: 0,
      packetLoss: 0,
      peakConcurrentStreams: 0,
    },
  });

  console.log('✅ Created system analytics entry');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📋 Default accounts:');
  console.log('   Admin: admin@cloudstream.local / admin123');
  console.log('   Demo:  demo@cloudstream.local / demo123');
  console.log('');
  console.log('🎫 Invite codes:');
  inviteCodes.forEach(code => console.log(`   ${code}`));
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 