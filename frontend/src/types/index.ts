export type Role = 'ADMIN' | 'USER'
export type EntityType = 'SYSTEM' | 'USER'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface Unit {
  id: number
  name: string
  type: EntityType
  groupKey: string | null
  baseRatio: number | null
  userId: number | null
}

export interface ProductUnit {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  type: EntityType
  userId: number | null
  unitId: number
  unit: ProductUnit
  lastPrice: number | null
}

export interface Shop {
  id: number
  name: string
  address: string | null
  userId: number | null
}

export interface PurchaseItemProduct {
  id: number
  name: string
  unit: ProductUnit
}

export interface PurchaseItem {
  id: number
  quantity: number
  totalPrice: number
  pricePerUnit: number
  product: PurchaseItemProduct
}

export interface Purchase {
  id: number
  date: string
  note: string | null
  totalAmount: number
  createdAt: string
  shop?: { id: number; name: string } | null
  items: PurchaseItem[]
}

export interface PurchaseListResponse {
  purchases: Purchase[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface MonthlySummary {
  month: string
  totalAmount: number
  purchaseCount: number
}

export interface TopProduct {
  product: { id: number; name: string; unit: { name: string } }
  totalSpent: number
  totalQuantity: number
  purchaseCount: number
}

export interface PriceTrendPoint {
  date: string
  pricePerUnit: number
}

export interface PriceTrend {
  product: { id: number; name: string; unit: { name: string } }
  trend: PriceTrendPoint[]
}

export interface ShopSummary {
  shop: { id: number; name: string }
  totalSpent: number
  purchaseCount: number
}

export interface ProductByShopEntry {
  shop: { id: number; name: string }
  avgPricePerUnit: number
  purchaseCount: number
  lastPricePerUnit: number
  lastDate: string
}

export interface ProductByShop {
  product: { id: number; name: string; unit: { name: string } }
  shops: ProductByShopEntry[]
}

export interface SummaryReport {
  year: number
  totalAmount: number
  months: MonthlySummary[]
}
