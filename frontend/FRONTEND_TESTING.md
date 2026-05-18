# Frontend Testing Guide — বাজার হিসাব

## Test Environments

| Environment | URL |
|---|---|
| Local dev | http://localhost:3000 |
| Backend API | http://localhost:4000 (or `NEXT_PUBLIC_API_URL`) |

Browsers to test: Chrome (primary), Firefox, Safari (mobile), Chrome on Android.

---

## 1. Authentication Flow

### Login
1. Valid credentials → redirects to `/dashboard`
2. Invalid credentials → Bengali error toast
3. Empty form submission → Bengali field-level validation errors shown
4. Already authenticated → visiting `/login` redirects to `/dashboard`
5. After forced logout (token expired mid-session) → login redirects back to original page (via `sessionStorage.redirectAfterLogin`)
6. Pressing Enter in the password field submits the form

### Registration
1. Valid data → success toast + redirect to `/login`
2. Duplicate email → error toast
3. Password < 8 chars → validation error
4. Password without letter/number → validation error
5. Password confirmation mismatch → "পাসওয়ার্ড মিলছে না" error
6. Already authenticated → redirects to `/dashboard`

### Session Restore
1. Hard refresh (F5) on any protected page → session silently restored via refresh cookie → no redirect to login
2. Opening a protected page in a new tab → session restored
3. Expired refresh cookie → redirect to login
4. Logout button → clears session + redirects to login
5. Mobile logout (top-right header icon) → same as above

---

## 2. Dashboard

1. Correct Bengali greeting with first name
2. Today's date shown in Bengali format
3. Stat cards show correct values (monthly expense, count, yearly total, months count)
4. Skeleton shown during initial load
5. Recent purchases list (max 5) renders with correct dates and amounts
6. Shop badge (MapPin icon + name) shown on recent purchase cards where a shop is set
7. Empty state shown if no purchases exist, with link to create first
8. "নতুন বাজার" button navigates to `/purchases/new`
9. "সব দেখুন" button navigates to `/purchases`
10. Clicking a recent purchase navigates to `/purchases/{id}`

---

## 3. Purchase List (`/purchases`)

1. Shows current month's purchases by default (month filter pre-set)
2. Month input changes filter → list updates
3. "সব দেখুন" toggle removes month filter → all purchases shown
4. Toggle text changes to "সব দেখানো হচ্ছে" when showing all
5. Typing in search box clears month filter and searches by note/product
6. Search debounces (400ms) — no request on every keystroke
7. Shop badge (MapPin icon + name) shown on cards where a shop is set
8. Empty state shown with "প্রথম বাজার যোগ করুন" link when no results
9. Pagination controls appear when total > 15
10. Previous/Next pagination buttons work correctly
11. Clicking a purchase card navigates to detail page
12. Loading skeletons shown during fetch

---

## 4. New Purchase (`/purchases/new`)

1. Date defaults to today
2. Future dates rejected with Bengali error
3. At least one item required — error shown if submitted with empty items
4. Shop selector visible between date/note card and items list
5. Shop dropdown lists all SYSTEM shops and user's own shops
6. Shop selection is optional — submitting without a shop works
7. Adding a product with last price shows price hint
8. Unit price calculated and shown as quantity/totalPrice changes
9. Adding multiple items works
10. Removing a middle item — other items maintain their input values (key stability)
11. Submitting valid form → toast + redirect to `/purchases`
12. Server error → Bengali error toast, form stays open
13. Back button navigates back

---

## 5. Purchase Detail (`/purchases/{id}`)

1. Correct date, note, items, totals displayed
2. Shop name shown with MapPin icon if a shop was selected
3. No shop section shown if purchase has no shop
4. "যোগ করা হয়েছে" timestamp shown at bottom
5. "সম্পাদনা" button switches to edit mode (PurchaseForm inline)
6. Edit: shop selector pre-filled with existing shop
7. Edit: clearing the shop (selecting blank) and saving removes the shop association
8. Edit: back/cancel button returns to view mode
9. Edit: after saving, detail shows updated data (cache invalidated)
10. "মুছুন" button opens ConfirmDialog
11. ConfirmDialog: "বাতিল" dismisses without deleting
12. ConfirmDialog: "মুছুন" deletes and navigates to list with toast
13. ConfirmDialog: Escape key closes it
14. ConfirmDialog: clicking overlay closes it
15. Invalid ID in URL → "বাজার পাওয়া যায়নি" + back button shown
16. Back button (ChevronLeft) → navigates to `/purchases` (not browser history)

---

## 6. Products (`/products`)

1. System products displayed in "সিস্টেম পণ্য" section
2. User products displayed in "আমার পণ্য" section
3. Empty state shown for user products section if none exist
4. Last price shown for products that have purchase history
5. Edit button opens ProductDialog pre-filled with product data
6. Edit: unit field disabled (cannot change unit after creation)
7. Create: all units shown in dropdown
8. Admin: type selector shown (USER/SYSTEM) on create
9. Non-admin: type selector hidden, always creates USER product
10. Delete: ConfirmDialog shown, on confirm → product removed
11. Cannot delete SYSTEM products (no delete button shown for non-admin)
12. Admin: can edit SYSTEM products via pencil button
13. Duplicate name error from backend → Bengali error toast

---

## 7. Units (`/units`)

1. System units displayed with group badges (ওজন, পরিমাণ, সংখ্যা)
2. Base ratio shown in Bengali ("বেস অনুপাত:")
3. Create unit: name validation (cannot be empty)
4. Selecting a group key shows base ratio input
5. No group key selected → base ratio input hidden, no validation
6. Edit: name and group/ratio can be changed
7. Delete: ConfirmDialog shown
8. Admin: can edit SYSTEM units

---

## 8. Shops (`/shops`)

1. SYSTEM shops shown in "সিস্টেম দোকান" section
2. User's own shops shown in "আমার দোকান" section
3. Empty state shown for user shops section if none exist
4. Address shown below shop name where set (MapPin icon)
5. Edit button opens ShopDialog pre-filled with name and address
6. Editing name and address saves correctly → list updated
7. Delete button opens ConfirmDialog
8. ConfirmDialog: confirming delete removes shop → toast shown
9. Deleted shop's existing purchases retain their data (shop field set to null, not cascade deleted)
10. Non-admin: cannot edit or delete SYSTEM shops (no buttons shown)
11. Admin: type selector shown (USER/SYSTEM) on create
12. Admin: can edit SYSTEM shops
13. Duplicate shop name error from backend → Bengali error toast
14. "/shops" link visible in desktop sidebar
15. "/shops" NOT visible in mobile bottom nav (mobileHidden)

---

## 9. Analysis (`/analysis`)

### Top Products section
1. Year/month filter controls shown at top
2. Default shows current year's top 10 products
3. Horizontal bar chart renders with correct data
4. Ranked list below chart matches bar chart order
5. Switching to month filter updates data
6. Empty state shown if no purchases in selected period
7. "টপ ১০" limit applied — max 10 products shown

### Price Trend section
1. Product dropdown lists all accessible products
2. Selecting a product shows line chart of pricePerUnit over time
3. Multiple data points visible if product bought multiple times
4. Tooltip shows date + price per unit
5. Empty state shown if product has no purchase history

### Shop Report section
1. Horizontal bar chart shows spending by shop
2. Ranked list below chart matches bar chart order
3. Purchases without a shop are excluded
4. Switching year/month filter updates shop report too
5. Empty state shown if no purchases with shops in selected period

### Product vs Shop Comparison section
1. Product dropdown lists all accessible products
2. Selecting a product shows table of shops where it was purchased
3. Columns: দোকান নাম, গড় দাম, কেনার সংখ্যা, সর্বশেষ দাম, সর্বশেষ তারিখ
4. Cheapest shop (lowest avg price) highlighted in green
5. Sorted by average price ascending (cheapest first)
6. Empty state if product has no purchase history with shops

---

## 10. Report (`/report`)

1. Bar chart shows monthly expenses for current year
2. Line chart shows monthly purchase count
3. Year navigation: ‹ decrements year, › increments (disabled at current year)
4. Changing year fetches new data
5. Monthly detail table shows only months with data
6. Zero-purchase months show as empty bars (not crash)
7. Chart tooltips show Bengali label + formatted currency
8. Summary cards show correct yearly total and purchase count

---

## 11. Admin Panel (`/admin`)

1. Non-admin users → redirected to `/dashboard` (client-side)
2. Non-admin users → blocked by Next.js middleware (edge)
3. User list shows all users with name, email, role, join date
4. Admin badge styled differently from user badge
5. "একক পরিচালনা" links to `/units`
6. "পণ্য পরিচালনা" links to `/products`
7. Loading skeletons during user list fetch
8. Empty state if no users (shouldn't happen in practice)

---

## 12. Responsive Testing Checklist

### Mobile (320px – 767px)
1. Bottom nav visible and functional with 6 items (হোম, ক্রয়, পণ্য, একক, রিপোর্ট, বিশ্লেষণ)
2. Both regular and admin users see the same 6 items (দোকান and অ্যাডমিন are hidden on mobile)
3. No horizontal overflow on any page
4. Purchase form items stack correctly
5. Shop selector in purchase form fits within screen
6. Dialogs fit within screen without overflow
7. Month input in purchases page readable
8. Search + month filter row doesn't overflow

### Tablet (768px – 1023px)
1. Sidebar visible and functional
2. "দোকান" link visible in desktop sidebar
3. Content at `max-w-2xl` centered
4. No layout shifts

### Desktop (1024px+)
1. Sidebar fixed at 240px
2. "দোকান" link visible in sidebar
3. Main content scrollable
4. Charts render at correct height

---

## 13. Error State Testing

1. **Network offline:** toasts shown for all data fetches that fail
2. **API returns 500:** error toast, no crash
3. **Invalid JSON response:** validator throws, error toast shown
4. **Duplicate product name (409):** Bengali error toast from server
5. **Duplicate shop name (409):** Bengali error toast from server
6. **Delete product in use (P2003):** Bengali error toast
7. **Token expired mid-session:** silent refresh, request retried

---

## 14. Loading State Testing

1. All list pages show skeleton cards during initial fetch
2. Skeleton count matches expected content (e.g., 3 for recent purchases)
3. Form submit button shows "সংরক্ষণ হচ্ছে..." and is disabled during submission
4. Delete confirmation button shows "মুছছে..." during deletion

---

## 15. Accessibility Testing

Run with a screen reader (NVDA/JAWS on Windows, VoiceOver on Mac/iOS):

1. All icon-only buttons announce their action (aria-label)
2. Dialogs announced as dialogs (role="dialog")
3. Active nav link announced as current page (aria-current="page")
4. Form field errors are readable (connected to input)
5. Escape key closes all dialogs
6. Tab key navigates through all interactive elements in logical order

---

## 16. Browser Compatibility

| Browser | Version | Priority |
|---|---|---|
| Chrome | Latest | High |
| Firefox | Latest | High |
| Safari | Latest | Medium |
| Chrome Android | Latest | High |
| Safari iOS | Latest | Medium |
| Samsung Internet | Latest | Low |

---

## 17. User Acceptance Test Scenarios (End-to-End)

### Scenario A: New User Journey
1. Register new account → verify redirect to login
2. Login → verify dashboard loads with empty state
3. Create first purchase with 2 items → verify success toast
4. Verify purchase appears in list and dashboard recent purchases
5. Open purchase detail → verify all item details correct

### Scenario B: Monthly Expense Tracking
1. Create 5 purchases spread across two months
2. On dashboard, verify current month totals are correct
3. Navigate to purchases list with month filter → verify filtering
4. Switch to other month → verify other month's purchases shown
5. Navigate to report → verify bar chart reflects data for both months

### Scenario C: Product Management
1. Create a new unit "গ্রাম"
2. Create a new product "আলু" with unit "কেজি"
3. Create a purchase using "আলু"
4. Open product list → verify last price shown for "আলু"
5. Try to rename "আলু" → verify name updates
6. Try to delete "আলু" while it has purchase history → verify appropriate error

### Scenario D: Admin Workflow
1. Login as admin
2. Verify "অ্যাডমিন" item visible in desktop sidebar but NOT in mobile bottom nav
3. Navigate to admin panel
4. View user list
5. Create a SYSTEM product → verify it appears in all user product lists
6. Create a SYSTEM unit → verify it appears with "সিস্টেম" badge
7. Create a SYSTEM shop → verify it appears in all users' shop dropdowns

### Scenario E: Session Expiry Recovery
1. Login and navigate to `/report`
2. Simulate token expiry (wait or manually clear token from Zustand devtools)
3. Trigger an API action
4. Verify silent token refresh occurs
5. Simulate full session expiry (delete refresh cookie)
6. Trigger an API action → verify redirect to login
7. Login → verify redirect back to `/report`

### Scenario F: Shop Tracking Workflow
1. Create two shops: "কারওয়ান বাজার" and "মিরপুর বাজার"
2. Create a purchase at "কারওয়ান বাজার" with product "আলু" (2kg, ৳60)
3. Create another purchase at "মিরপুর বাজার" with product "আলু" (2kg, ৳50)
4. Verify both purchases show their shop badge in the purchase list
5. Navigate to Analysis → Shop Report → verify both shops appear with correct totals
6. Navigate to Analysis → Product vs Shop → select "আলু" → verify "মিরপুর বাজার" shown as cheapest (highlighted green)
7. Edit the first purchase and clear its shop → verify shop badge disappears from list
8. Delete "কারওয়ান বাজার" shop → verify the purchase still exists (shop field cleared, not deleted)
