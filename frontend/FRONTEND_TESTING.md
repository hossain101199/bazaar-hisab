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
- [ ] Valid credentials → redirects to `/dashboard`
- [ ] Invalid credentials → Bengali error toast
- [ ] Empty form submission → Bengali field-level validation errors shown
- [ ] Already authenticated → visiting `/login` redirects to `/dashboard`
- [ ] After forced logout (token expired mid-session) → login redirects back to original page (via `sessionStorage.redirectAfterLogin`)
- [ ] Pressing Enter in the password field submits the form

### Registration
- [ ] Valid data → success toast + redirect to `/login`
- [ ] Duplicate email → error toast
- [ ] Password < 8 chars → validation error
- [ ] Password without letter/number → validation error
- [ ] Password confirmation mismatch → "পাসওয়ার্ড মিলছে না" error
- [ ] Already authenticated → redirects to `/dashboard`

### Session Restore
- [ ] Hard refresh (F5) on any protected page → session silently restored via refresh cookie → no redirect to login
- [ ] Opening a protected page in a new tab → session restored
- [ ] Expired refresh cookie → redirect to login
- [ ] Logout button → clears session + redirects to login
- [ ] Mobile logout (top-right header icon) → same as above

---

## 2. Dashboard

- [ ] Correct Bengali greeting with first name
- [ ] Today's date shown in Bengali format
- [ ] Stat cards show correct values (monthly expense, count, yearly total, months count)
- [ ] Skeleton shown during initial load
- [ ] Recent purchases list (max 5) renders with correct dates and amounts
- [ ] Empty state shown if no purchases exist, with link to create first
- [ ] "নতুন বাজার" button navigates to `/purchases/new`
- [ ] "সব দেখুন" button navigates to `/purchases`
- [ ] Clicking a recent purchase navigates to `/purchases/{id}`

---

## 3. Purchase List (`/purchases`)

- [ ] Shows current month's purchases by default (month filter pre-set)
- [ ] Month input changes filter → list updates
- [ ] "সব দেখুন" toggle removes month filter → all purchases shown
- [ ] Toggle text changes to "সব দেখানো হচ্ছে" when showing all
- [ ] Typing in search box clears month filter and searches by note/product
- [ ] Search debounces (400ms) — no request on every keystroke
- [ ] Empty state shown with "প্রথম বাজার যোগ করুন" link when no results
- [ ] Pagination controls appear when total > 15
- [ ] Previous/Next pagination buttons work correctly
- [ ] Clicking a purchase card navigates to detail page
- [ ] Loading skeletons shown during fetch

---

## 4. New Purchase (`/purchases/new`)

- [ ] Date defaults to today
- [ ] Future dates rejected with Bengali error
- [ ] At least one item required — error shown if submitted with empty items
- [ ] Adding a product with last price shows price hint
- [ ] Unit price calculated and shown as quantity/totalPrice changes
- [ ] Adding multiple items works
- [ ] Removing a middle item — other items maintain their input values (key stability)
- [ ] Submitting valid form → toast + redirect to `/purchases`
- [ ] Server error → Bengali error toast, form stays open
- [ ] Back button navigates back

---

## 5. Purchase Detail (`/purchases/{id}`)

- [ ] Correct date, note, items, totals displayed
- [ ] "যোগ করা হয়েছে" timestamp shown at bottom
- [ ] "সম্পাদনা" button switches to edit mode (PurchaseForm inline)
- [ ] Edit: back/cancel button returns to view mode
- [ ] Edit: after saving, detail shows updated data (cache invalidated)
- [ ] "মুছুন" button opens ConfirmDialog
- [ ] ConfirmDialog: "বাতিল" dismisses without deleting
- [ ] ConfirmDialog: "মুছুন" deletes and navigates to list with toast
- [ ] ConfirmDialog: Escape key closes it
- [ ] ConfirmDialog: clicking overlay closes it
- [ ] Invalid ID in URL → "বাজার পাওয়া যায়নি" + back button shown
- [ ] Back button (ChevronLeft) → navigates to `/purchases` (not browser history)

---

## 6. Products (`/products`)

- [ ] System products displayed in "সিস্টেম পণ্য" section
- [ ] User products displayed in "আমার পণ্য" section
- [ ] Empty state shown for user products section if none exist
- [ ] Last price shown for products that have purchase history
- [ ] Edit button opens ProductDialog pre-filled with product data
- [ ] Edit: unit field disabled (cannot change unit after creation)
- [ ] Create: all units shown in dropdown
- [ ] Admin: type selector shown (USER/SYSTEM) on create
- [ ] Non-admin: type selector hidden, always creates USER product
- [ ] Delete: ConfirmDialog shown, on confirm → product removed
- [ ] Cannot delete SYSTEM products (no delete button shown for non-admin)
- [ ] Admin: can edit SYSTEM products via pencil button
- [ ] Duplicate name error from backend → Bengali error toast

---

## 7. Units (`/units`)

- [ ] System units displayed with group badges (ওজন, পরিমাণ, সংখ্যা)
- [ ] Base ratio shown in Bengali ("বেস অনুপাত:")
- [ ] Create unit: name validation (cannot be empty)
- [ ] Selecting a group key shows base ratio input
- [ ] No group key selected → base ratio input hidden, no validation
- [ ] Edit: name and group/ratio can be changed
- [ ] Delete: ConfirmDialog shown
- [ ] Admin: can edit SYSTEM units

---

## 8. Report (`/report`)

- [ ] Bar chart shows monthly expenses for current year
- [ ] Line chart shows monthly purchase count
- [ ] Year navigation: ‹ decrements year, › increments (disabled at current year)
- [ ] Changing year fetches new data
- [ ] Monthly detail table shows only months with data
- [ ] Zero-purchase months show as empty bars (not crash)
- [ ] Chart tooltips show Bengali label + formatted currency
- [ ] Summary cards show correct yearly total and purchase count

---

## 9. Admin Panel (`/admin`)

- [ ] Non-admin users → redirected to `/dashboard` (client-side)
- [ ] Non-admin users → blocked by Next.js middleware (edge)
- [ ] User list shows all users with name, email, role, join date
- [ ] Admin badge styled differently from user badge
- [ ] "একক পরিচালনা" links to `/units`
- [ ] "পণ্য পরিচালনা" links to `/products`
- [ ] Loading skeletons during user list fetch
- [ ] Empty state if no users (shouldn't happen in practice)

---

## 10. Responsive Testing Checklist

### Mobile (320px – 767px)
- [ ] Bottom nav visible and functional
- [ ] Admin sees 6 items in bottom nav
- [ ] No horizontal overflow on any page
- [ ] Purchase form items stack correctly
- [ ] Dialogs fit within screen without overflow
- [ ] Month input in purchases page readable
- [ ] Search + month filter row doesn't overflow

### Tablet (768px – 1023px)
- [ ] Sidebar visible and functional
- [ ] Content at `max-w-2xl` centered
- [ ] No layout shifts

### Desktop (1024px+)
- [ ] Sidebar fixed at 240px
- [ ] Main content scrollable
- [ ] Charts render at correct height

---

## 11. Error State Testing

- [ ] **Network offline:** toasts shown for all data fetches that fail
- [ ] **API returns 500:** error toast, no crash
- [ ] **Invalid JSON response:** validator throws, error toast shown
- [ ] **Duplicate product name (409):** Bengali error toast from server
- [ ] **Delete product in use (P2003):** Bengali error toast
- [ ] **Token expired mid-session:** silent refresh, request retried

---

## 12. Loading State Testing

- [ ] All list pages show skeleton cards during initial fetch
- [ ] Skeleton count matches expected content (e.g., 3 for recent purchases)
- [ ] Form submit button shows "সংরক্ষণ হচ্ছে..." and is disabled during submission
- [ ] Delete confirmation button shows "মুছছে..." during deletion

---

## 13. Accessibility Testing

Run with a screen reader (NVDA/JAWS on Windows, VoiceOver on Mac/iOS):

- [ ] All icon-only buttons announce their action (aria-label)
- [ ] Dialogs announced as dialogs (role="dialog")
- [ ] Active nav link announced as current page (aria-current="page")
- [ ] Form field errors are readable (connected to input)
- [ ] Escape key closes all dialogs
- [ ] Tab key navigates through all interactive elements in logical order

---

## 14. Browser Compatibility

| Browser | Version | Priority |
|---|---|---|
| Chrome | Latest | High |
| Firefox | Latest | High |
| Safari | Latest | Medium |
| Chrome Android | Latest | High |
| Safari iOS | Latest | Medium |
| Samsung Internet | Latest | Low |

---

## 15. User Acceptance Test Scenarios (End-to-End)

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
2. Verify admin item visible in both sidebar and mobile bottom nav
3. Navigate to admin panel
4. View user list
5. Create a SYSTEM product → verify it appears in all user product lists
6. Create a SYSTEM unit → verify it appears with "সিস্টেম" badge

### Scenario E: Session Expiry Recovery
1. Login and navigate to `/report`
2. Simulate token expiry (wait or manually clear token from Zustand devtools)
3. Trigger an API action
4. Verify silent token refresh occurs
5. Simulate full session expiry (delete refresh cookie)
6. Trigger an API action → verify redirect to login
7. Login → verify redirect back to `/report`
