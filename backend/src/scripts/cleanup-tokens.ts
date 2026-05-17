import '../config/env'
import prisma from '../prisma'

async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  console.log(`✓ ${result.count} টি মেয়াদোত্তীর্ণ RefreshToken মুছে ফেলা হয়েছে`)
  await prisma.$disconnect()
}

cleanupExpiredTokens().catch(err => {
  console.error('Cleanup ব্যর্থ হয়েছে:', err)
  process.exit(1)
})
