import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const newPassword = args[1];

  if (!email || !newPassword) {
    console.log('\nUsage:');
    console.log('  node scripts/reset-password.js <email> <newPassword>\n');
    console.log('Example:');
    console.log('  node scripts/reset-password.js superadmin@nstu.edu.bd MyNewStrongPassword123!\n');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    console.error(`\n❌ Error: User with email "${email}" does not exist in the database.\n`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash: passwordHash },
  });

  console.log(`\n✅ Password successfully updated for:`);
  console.log(`   User: ${user.display_name}`);
  console.log(`   Email: ${user.email}\n`);
}

main()
  .catch((e) => {
    console.error('Failed to update password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
