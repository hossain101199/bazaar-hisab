export type Role = 'ADMIN' | 'USER'
export type UnitType = 'SYSTEM' | 'USER'
export type ProductType = 'SYSTEM' | 'USER'

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
  type: UnitType
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
  type: ProductType
  userId: number | null
  unitId: number
  unit: ProductUnit
  lastPrice: number | null
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

export interface SummaryReport {
  year: number
  totalAmount: number
  months: MonthlySummary[]
}
