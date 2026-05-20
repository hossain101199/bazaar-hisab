import { EntityType } from '@prisma/client'

export const SYSTEM_UNITS = [
  { name: 'কেজি',       type: EntityType.SYSTEM, groupKey: 'weight', baseRatio: 1 },
  { name: 'গ্রাম',      type: EntityType.SYSTEM, groupKey: 'weight', baseRatio: 0.001 },
  { name: 'লিটার',      type: EntityType.SYSTEM, groupKey: 'volume', baseRatio: 1 },
  { name: 'মিলিলিটার', type: EntityType.SYSTEM, groupKey: 'volume', baseRatio: 0.001 },
  { name: 'পিস',        type: EntityType.SYSTEM, groupKey: 'count',  baseRatio: 1 },
  { name: 'হালি',       type: EntityType.SYSTEM, groupKey: 'count',  baseRatio: 4 },
  { name: 'ডজন',        type: EntityType.SYSTEM, groupKey: 'count',  baseRatio: 12 },
  { name: 'আঁটি',       type: EntityType.SYSTEM, groupKey: null,     baseRatio: null },
]

// unitName এখানে SYSTEM_UNITS এর name এর সাথে মিলবে
export const SYSTEM_PRODUCTS: { name: string; unitName: string }[] = [
  // সবজি
  { name: 'আলু',         unitName: 'কেজি' },
  { name: 'পেঁয়াজ',     unitName: 'কেজি' },
  { name: 'রসুন',        unitName: 'কেজি' },
  { name: 'আদা',         unitName: 'কেজি' },
  { name: 'কাঁচামরিচ',  unitName: 'কেজি' },
  { name: 'টমেটো',       unitName: 'কেজি' },
  { name: 'বেগুন',       unitName: 'কেজি' },
  { name: 'ফুলকপি',      unitName: 'কেজি' },
  { name: 'বাঁধাকপি',   unitName: 'কেজি' },
  { name: 'পটল',         unitName: 'কেজি' },
  { name: 'করলা',        unitName: 'কেজি' },
  { name: 'ঢেঁড়স',      unitName: 'কেজি' },
  { name: 'লাউ',         unitName: 'কেজি' },
  { name: 'শিম',         unitName: 'কেজি' },
  { name: 'ধনেপাতা',    unitName: 'আঁটি' },
  // শস্য ও মশলা
  { name: 'চাল',         unitName: 'কেজি' },
  { name: 'মসুর ডাল',   unitName: 'কেজি' },
  { name: 'মুগ ডাল',    unitName: 'কেজি' },
  { name: 'আটা',         unitName: 'কেজি' },
  { name: 'চিনি',        unitName: 'কেজি' },
  { name: 'লবণ',         unitName: 'কেজি' },
  { name: 'হলুদ গুঁড়া', unitName: 'গ্রাম' },
  { name: 'মরিচ গুঁড়া', unitName: 'গ্রাম' },
  // তেল
  { name: 'সয়াবিন তেল', unitName: 'লিটার' },
  { name: 'সরিষার তেল', unitName: 'লিটার' },
  // প্রোটিন
  { name: 'ডিম',         unitName: 'হালি' },
  { name: 'মুরগি',       unitName: 'কেজি' },
  { name: 'গরুর মাংস',  unitName: 'কেজি' },
  { name: 'রুই মাছ',    unitName: 'কেজি' },
  { name: 'দুধ',         unitName: 'লিটার' },
]
