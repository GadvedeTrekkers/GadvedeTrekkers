# 🔄 Recover All Treks to Admin Panel

## Problem
- You had 15+ treks before
- Now only 6 are showing in admin panel
- The rest are "missing"

## What Happened
When we fixed the Supabase connection, only the treks that were in localStorage at that moment got synced to Supabase. The other treks you added manually are either:
1. Still in localStorage but not synced
2. Lost when localStorage was cleared

## Solution: Re-import All Seed Data

### Step 1: Check What's in LocalStorage

Open browser console (F12) and run:

```javascript
// Check localStorage
const localTreks = JSON.parse(localStorage.getItem('gt_treks') || '[]');
console.log('Treks in localStorage:', localTreks.length);
localTreks.forEach((t, i) => console.log(`${i+1}. ${t.name}`));
```

**If you see 15+ treks:** They're in localStorage but not synced to Supabase. Go to Step 2.
**If you see only 6 treks:** The data was lost. Go to Step 3.

---

### Step 2: Force Sync LocalStorage to Supabase

If localStorage has all your treks:

1. Open admin panel: http://localhost:5173/admin/treks
2. Open console (F12)
3. Run this script to force sync all treks:

```javascript
// Get all treks from localStorage
const treks = JSON.parse(localStorage.getItem('gt_treks') || '[]');
const token = localStorage.getItem('gt_admin_token');

console.log(`Syncing ${treks.length} treks to Supabase...`);

// Sync each trek to Supabase
for (const trek of treks) {
  fetch('http://localhost:10000/api/products/admin/upsert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      storageKey: 'gt_treks',
      item: trek
    })
  })
  .then(r => r.json())
  .then(d => console.log('✅ Synced:', trek.name))
  .catch(e => console.error('❌ Failed:', trek.name, e));
}

console.log('Sync initiated. Check logs above.');
```

4. Wait for all treks to sync (check console for ✅ messages)
5. Refresh the page: `Ctrl + Shift + R`
6. All treks should now appear

---

### Step 3: Re-import from Seed Data

If localStorage doesn't have your treks, we need to re-import from seed data:

1. **Clear everything first:**
```javascript
localStorage.removeItem('gt_treks');
localStorage.removeItem('gt_treks_syncedAt');
```

2. **Reload the page:** `Ctrl + Shift + R`

3. **The admin panel will load seed data** (about 24 treks from `src/data/treks.js`)

4. **Wait for auto-sync** - The admin panel should automatically sync to Supabase

5. **Verify:** Check if all treks appear

---

### Step 4: Manual Re-entry (Last Resort)

If Steps 2 and 3 don't work, you'll need to manually re-add the missing treks:

1. Go to admin panel: http://localhost:5173/admin/treks
2. Click "+ Add New Trek"
3. Fill in all details
4. Save
5. Repeat for each missing trek

**To make this easier:**
- Check `src/data/treks.js` for trek names and basic info
- Copy/paste data from there

---

## Prevent This in the Future

### 1. Always Backup Before Clearing Cache

Before running `localStorage.clear()`, backup your data:

```javascript
// Backup
const backup = {
  treks: localStorage.getItem('gt_treks'),
  tours: localStorage.getItem('gt_tours'),
  heritage: localStorage.getItem('gt_heritage'),
  camping: localStorage.getItem('gt_camping'),
  rentals: localStorage.getItem('gt_rentals')
};
console.log('Backup:', JSON.stringify(backup));
// Copy this output and save it somewhere safe
```

### 2. Verify Supabase Has Data

After any major change, verify data is in Supabase:

1. Go to: https://supabase.com/dashboard
2. Select project: `qgiqkxxwoyqffozgvbvi`
3. Go to **Table Editor** → **products** table
4. Check row count matches your trek count

### 3. Use Supabase as Source of Truth

Once data is in Supabase:
- Don't rely on localStorage
- Always fetch from Supabase
- localStorage is just a cache

---

## Quick Diagnostic Script

Run this to see where your data is:

```javascript
// Check all storage locations
const checkData = async () => {
  // 1. LocalStorage
  const localTreks = JSON.parse(localStorage.getItem('gt_treks') || '[]');
  console.log('📦 LocalStorage:', localTreks.length, 'treks');
  
  // 2. Supabase (via API)
  const token = localStorage.getItem('gt_admin_token');
  if (token) {
    const response = await fetch('http://localhost:10000/api/products/admin/list?storageKey=gt_treks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('🗄️  Supabase:', data.data?.length || 0, 'treks');
    
    // Compare
    if (localTreks.length > data.data?.length) {
      console.log('⚠️  LocalStorage has MORE treks than Supabase!');
      console.log('   Run Step 2 to sync them.');
    } else if (localTreks.length < data.data?.length) {
      console.log('⚠️  Supabase has MORE treks than LocalStorage!');
      console.log('   Refresh the page to update cache.');
    } else {
      console.log('✅ LocalStorage and Supabase are in sync!');
    }
  }
};

checkData();
```

---

## Expected Result

After following these steps, you should have:
- ✅ All 15+ treks visible in admin panel
- ✅ All treks in Supabase database
- ✅ Ability to toggle each trek on/off
- ✅ Changes persist across page refreshes

---

## Need Help?

If you're still missing treks:

1. **Tell me which treks are missing** - I can help you find them in the seed data
2. **Share the output** of the diagnostic script above
3. **Check if you have a backup** - Maybe you exported data before?

The seed data in `src/data/treks.js` has about 24 treks, so we can always re-import from there if needed.
