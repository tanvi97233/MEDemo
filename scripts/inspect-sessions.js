const { PrismaClient } = require('@prisma/client');
(async () => {
  const db = new PrismaClient();
  try {
    const users = await db.user.findMany({ select: { id: true, name: true, email: true, role: true } });
    const sessions = await db.session.findMany({ select: { id: true, userId: true, expiresAt: true, createdAt: true } });
    console.log('USERS:', JSON.stringify(users, null, 2));
    console.log('SESSIONS:', JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
})();
