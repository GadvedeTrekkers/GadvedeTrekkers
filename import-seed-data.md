# Import Seed Data to Supabase

## Problem
- Treks/Heritage walks visible on frontend (from seed data)
- But not showing in admin panel (Supabase database is empty)

## Solution Options

### Option 1: Use Admin Panel to Add Each Trek (Manual)

1. Go to admin panel: http://localhost:5173/admin/treks
2. Click "+ Add New Trek"
3. Fill in all the details
4. Click "Save"
5. Repeat for each trek

**Pros:** Full control, can customize each entry
**Cons:** Time-consuming if you have many treks

---

### Option 2: Import from LocalStorage (If you had data before)

If you previously added treks in the admin panel and they're in localStorage:

1. Open browser console (F12)
2. Run this command:
```javascript
// Check what's in localStorage
console.log(JSON.parse(localStorage.getItem('gt_treks') || '[]'));
```

3. If you see trek data, it means it's in localStorage but not synced to Supabase
4. The admin panel should automatically sync it when you open it

---

### Option 3: Manually Sync Seed Data (Quick Fix)

The seed data is in `src/data/treks.js`. To get it into Supabase:

1. **Open Admin Panel:** http://localhost:5173/admin/treks
2. **Check localStorage:** Open console (F12) and run:
   ```javascript
   localStorage.setItem('gt_treks', JSON.stringify([]));
   ```
3. **Refresh the page** - This will trigger the seed data to load
4. **The admin panel will automatically sync to Supabase**

---

### Option 4: Check What's Actually in Supabase

Let's verify what's in your Supabase database:

1. Go to: https://supabase.com/dashboard
2. Select your project: `qgiqkxxwoyqffozgvbvi`
3. Go to **Table Editor**
4. Click on **products** table
5. Check if there are any rows

**If empty:** You need to add data using Option 1 or 3
**If has data:** The admin panel should show it - might be a filtering issue

---

## Understanding the Data Flow

```
Seed Data (treks.js)
    ↓
localStorage (gt_treks)
    ↓
Admin Panel (useAdminData hook)
    ↓
Supabase Database (products table)
    ↓
Frontend UI (fetches from Supabase)
```

### First Time Setup:
1. Seed data → localStorage
2. Admin panel opens → Syncs localStorage to Supabase
3. Frontend fetches from Supabase

### After Setup:
1. Admin panel → Supabase (source of truth)
2. Frontend → Supabase
3. localStorage → Cache only

---

## Quick Diagnostic

Run this in browser console (F12) on the admin panel page:

```javascript
// Check localStorage
const localTreks = JSON.parse(localStorage.getItem('gt_treks') || '[]');
console.log('LocalStorage treks:', localTreks.length);
localTreks.forEach(t => console.log('- ' + t.name));

// Check what the admin panel is showing
console.log('Admin panel should show', localTreks.length, 'treks');
```

---

## Most Likely Issue

Your Supabase `products` table is empty because:
1. You just set up Supabase credentials
2. The seed data hasn't been synced yet
3. The admin panel needs to do the initial sync

### Fix:
1. Open admin panel: http://localhost:5173/admin/treks
2. Wait for it to load (it should sync automatically)
3. If still empty, clear localStorage and refresh:
   ```javascript
   localStorage.removeItem('gt_treks');
   location.reload();
   ```
4. The seed data will load and sync to Supabase

---

## For Heritage Walks

Same process for heritage walks:

1. Check: http://localhost:5173/admin/heritage
2. Seed data is in `src/data/heritage.js`
3. Storage key: `gt_heritage`
4. Same sync process applies

---

## Need Help?

If treks still don't show in admin panel after trying these options:

1. Check backend logs for Supabase errors
2. Verify Supabase credentials are correct
3. Check if `products` table exists in Supabase
4. Verify table has correct columns (see schema in `docs/database/schema.sql`)
