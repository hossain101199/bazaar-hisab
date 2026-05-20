import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import prisma from '../../prisma'
import { AppError } from '../../utils/AppError'

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const

function generateAccessToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

async function createRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
  return token
}

export async function registerUser(name: string, email: string, password: string) {
  const normalized = email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: normalized } })
  if (existing) throw new AppError('এই ইমেইল ইতিমধ্যে ব্যবহৃত', 409)

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10')
  const hashed = await bcrypt.hash(password, rounds)

  return prisma.user.create({
    data: { name, email: normalized, password: hashed },
    select: userSelect,
  })
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) throw new AppError('ইমেইল বা পাসওয়ার্ড ভুল', 401)

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw new AppError('ইমেইল বা পাসওয়ার্ড ভুল', 401)

  const accessToken = generateAccessToken(user.id, user.role)
  const refreshToken = await createRefreshToken(user.id)

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
  }
}

export async function rotateRefreshToken(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { select: userSelect } },
  })

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
    throw new AppError('টোকেন অবৈধ বা মেয়াদ শেষ', 401)
  }

  const newTokenValue = crypto.randomBytes(64).toString('hex')
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.deleteMany({
      where: { userId: stored.userId, expiresAt: { lt: new Date() } },
    }),
    prisma.refreshToken.create({
      data: { token: newTokenValue, userId: stored.userId, expiresAt: newExpiresAt },
    }),
  ])

  return {
    accessToken: generateAccessToken(stored.userId, stored.user.role),
    refreshToken: newTokenValue,
    user: stored.user,
  }
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } })
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect })
  if (!user) throw new AppError('ব্যবহারকারী পাওয়া যায়নি', 404)
  return user
}
