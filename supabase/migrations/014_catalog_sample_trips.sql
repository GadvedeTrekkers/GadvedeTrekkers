-- ============================================================
-- Migration 014: Gadvede-owned sample trips
-- Original copy for the catalog hubs. Safe to re-run.
-- Run AFTER 013_catalog_hubs.sql
-- ============================================================

begin;

insert into public.products (
  id, name, slug, product_type, region, location, hub_slug, destination, category,
  duration_label, altitude_label, short_description, description,
  base_price, compare_at_price, rating, review_count,
  primary_image_url, gallery, media,
  is_featured, is_active, sort_order, extra_content
)
values
  (
    'b2100000-0000-0000-0000-000000000001',
    'Lohagad Dawn Ridge',
    'lohagad-dawn-ridge',
    'trek',
    'pune',
    'Lonavala, Maharashtra',
    'pune-weekend',
    'Lonavala, Maharashtra',
    'Pune Weekend',
    '1 Day',
    '3400 ft',
    'A Gadvede Trekkers sunrise walk on the Lohagad ridge, back in Pune by evening.',
    'Lohagad Dawn Ridge is a Gadvede Trekkers weekend walk for people who want a proper hill morning without an overnight pack. The group leaves Pune before dawn, climbs the ridge at an easy pace, and pauses at the fort wall for tea and photographs. Guides stay with the group on the steps and the return trail. It suits first-time trekkers and families who can handle a few hours on stone and grass.',
    899, 1199, 4.8, 36,
    null, '[]'::jsonb, '[]'::jsonb,
    true, true, 41,
    '{"rawItem":{"name":"Lohagad Dawn Ridge","slug":"lohagad-dawn-ridge","hubSlug":"pune-weekend","destination":"Lonavala, Maharashtra","category":"Pune Weekend","region":"pune","location":"Lonavala, Maharashtra","difficulty":"Easy","duration":"1 Day","altitude":"3400 ft","price":899,"originalPrice":1199,"subtitle":"A Gadvede Trekkers sunrise walk on the Lohagad ridge, back in Pune by evening.","about":"Lohagad Dawn Ridge is a Gadvede Trekkers weekend walk for people who want a proper hill morning without an overnight pack.","imageGallery":"[]","trekDateBatches":"[{\"date\":\"2026-11-07\",\"label\":\"Pune sunrise batch\",\"departureCity\":\"Pune\",\"status\":\"OPEN\"},{\"date\":\"2026-11-21\",\"label\":\"Pune sunrise batch\",\"departureCity\":\"Pune\",\"status\":\"OPEN\"}]"}}'::jsonb
  ),
  (
    'b2100000-0000-0000-0000-000000000002',
    'Matheran Forest Walk',
    'matheran-forest-walk',
    'trek',
    'mumbai',
    'Matheran, Maharashtra',
    'mumbai-weekend',
    'Matheran, Maharashtra',
    'Mumbai Weekend',
    '1 Day',
    '2600 ft',
    'A shaded forest walk from the Matheran toy-train side, led by Gadvede Trekkers.',
    'Matheran Forest Walk is a Gadvede Trekkers day out for Mumbai groups who want red earth, forest shade, and a slow lunch stop. The batch meets in Mumbai, rides up together, and walks the quieter forest paths rather than the market road. The pace stays conversational. Shoes with grip are enough. The group is back in the city the same night.',
    999, 1299, 4.7, 28,
    null, '[]'::jsonb, '[]'::jsonb,
    true, true, 42,
    '{"rawItem":{"name":"Matheran Forest Walk","slug":"matheran-forest-walk","hubSlug":"mumbai-weekend","destination":"Matheran, Maharashtra","category":"Mumbai Weekend","region":"mumbai","location":"Matheran, Maharashtra","difficulty":"Easy","duration":"1 Day","altitude":"2600 ft","price":999,"originalPrice":1299,"subtitle":"A shaded forest walk from the Matheran toy-train side, led by Gadvede Trekkers.","about":"Matheran Forest Walk is a Gadvede Trekkers day out for Mumbai groups who want red earth, forest shade, and a slow lunch stop.","imageGallery":"[]","trekDateBatches":"[{\"date\":\"2026-11-08\",\"label\":\"Mumbai morning batch\",\"departureCity\":\"Mumbai\",\"status\":\"OPEN\"}]"}}'::jsonb
  ),
  (
    'b2100000-0000-0000-0000-000000000003',
    'Solang Meadow Base',
    'solang-meadow-base',
    'tour',
    'himachal',
    'Solang Valley, Himachal Pradesh',
    'himachal',
    'Solang Valley, Himachal Pradesh',
    'Himachal',
    '4 Days 3 Nights',
    '8500 ft',
    'A small Gadvede Trekkers base in Solang with meadow walks and one acclimatisation day.',
    'Solang Meadow Base is a short Gadvede Trekkers trip for groups who want Himachal at a walking pace. Two nights are in a shared mountain lodge above the valley road. Days are meadow walks, a river-side picnic, and one free morning in the market. This is not a summit expedition. It is a guided base for people new to altitude who still want cold air and a clear ridge view.',
    7499, 8999, 4.6, 18,
    null, '[]'::jsonb, '[]'::jsonb,
    false, true, 43,
    '{"rawItem":{"name":"Solang Meadow Base","slug":"solang-meadow-base","hubSlug":"himachal","destination":"Solang Valley, Himachal Pradesh","category":"Himachal","region":"himachal","state":"Himachal Pradesh","location":"Solang Valley, Himachal Pradesh","destinationLine":"Solang Valley","duration":"4 Days 3 Nights","price":7499,"originalPrice":8999,"subtitle":"A small Gadvede Trekkers base in Solang with meadow walks and one acclimatisation day.","overview":"Solang Meadow Base is a short Gadvede Trekkers trip for groups who want Himachal at a walking pace.","imageGallery":"[]","tourDateBatches":"[{\"date\":\"2026-12-11\",\"endDate\":\"2026-12-14\",\"label\":\"December meadow batch\",\"departureCity\":\"Delhi\",\"status\":\"OPEN\",\"price\":7499}]"}}'::jsonb
  ),
  (
    'b2100000-0000-0000-0000-000000000004',
    'Rishikesh Riverbank Walk',
    'rishikesh-riverbank-walk',
    'tour',
    'uttarakhand',
    'Rishikesh, Uttarakhand',
    'uttarakhand',
    'Rishikesh, Uttarakhand',
    'Uttarakhand',
    '3 Days 2 Nights',
    '1200 ft',
    'A Gadvede Trekkers riverbank stay with morning walks and an easy gorge trail.',
    'Rishikesh Riverbank Walk keeps the group close to the water. Gadvede Trekkers books a simple shared stay, leads a sunrise walk along the bank, and adds one half-day gorge trail that does not need ropes. Evenings are free for the cafes. The trip is built for friends who want hills and a river without a long trek day.',
    5499, 6499, 4.7, 22,
    null, '[]'::jsonb, '[]'::jsonb,
    false, true, 44,
    '{"rawItem":{"name":"Rishikesh Riverbank Walk","slug":"rishikesh-riverbank-walk","hubSlug":"uttarakhand","destination":"Rishikesh, Uttarakhand","category":"Uttarakhand","region":"uttarakhand","location":"Rishikesh, Uttarakhand","duration":"3 Days 2 Nights","price":5499,"originalPrice":6499,"subtitle":"A Gadvede Trekkers riverbank stay with morning walks and an easy gorge trail.","overview":"Rishikesh Riverbank Walk keeps the group close to the water.","imageGallery":"[]","tourDateBatches":"[{\"date\":\"2026-11-27\",\"endDate\":\"2026-11-29\",\"label\":\"November river batch\",\"departureCity\":\"Delhi\",\"status\":\"OPEN\"}]"}}'::jsonb
  ),
  (
    'b2100000-0000-0000-0000-000000000005',
    'Sam Dune Night Circle',
    'sam-dune-night-circle',
    'tour',
    'rajasthan',
    'Jaisalmer, Rajasthan',
    'rajasthan',
    'Jaisalmer, Rajasthan',
    'Rajasthan',
    '3 Days 2 Nights',
    'Desert camp',
    'One night in a Gadvede Trekkers dune camp outside Jaisalmer, with a fort morning.',
    'Sam Dune Night Circle is a compact Gadvede Trekkers plan: a fort and lane walk in Jaisalmer, then one night in a dune camp the team has used for its own groups. Dinner is at the camp. The next day returns to the city before the overnight train or flight. Camel time is optional and paid on the spot, not bundled into the Gadvede price.',
    6299, 7499, 4.5, 15,
    null, '[]'::jsonb, '[]'::jsonb,
    false, true, 45,
    '{"rawItem":{"name":"Sam Dune Night Circle","slug":"sam-dune-night-circle","hubSlug":"rajasthan","destination":"Jaisalmer, Rajasthan","category":"Rajasthan","region":"rajasthan","location":"Jaisalmer, Rajasthan","duration":"3 Days 2 Nights","price":6299,"originalPrice":7499,"subtitle":"One night in a Gadvede Trekkers dune camp outside Jaisalmer, with a fort morning.","overview":"Sam Dune Night Circle is a compact Gadvede Trekkers plan with a fort walk and one dune-camp night.","imageGallery":"[]","tourDateBatches":"[{\"date\":\"2026-12-18\",\"endDate\":\"2026-12-20\",\"label\":\"December dune batch\",\"departureCity\":\"Jaisalmer\",\"status\":\"OPEN\"}]"}}'::jsonb
  ),
  (
    'b2100000-0000-0000-0000-000000000006',
    'Wayanad Canopy Stay',
    'wayanad-canopy-stay',
    'tour',
    'kerala',
    'Wayanad, Kerala',
    'kerala-south',
    'Wayanad, Kerala',
    'Kerala & South',
    '3 Days 2 Nights',
    'Plantation hills',
    'A Gadvede Trekkers plantation stay with a short canopy walk and a lake evening.',
    'Wayanad Canopy Stay is Gadvede Trekkers'' southern long weekend. The group sleeps in a plantation homestay, walks a marked canopy section with a local guide, and spends one evening by a lake the team picks for that batch. Spice-estate visits stay optional. The copy, price, and batch calendar on this page are Gadvede''s own.',
    6899, 7999, 4.8, 19,
    null, '[]'::jsonb, '[]'::jsonb,
    false, true, 46,
    '{"rawItem":{"name":"Wayanad Canopy Stay","slug":"wayanad-canopy-stay","hubSlug":"kerala-south","destination":"Wayanad, Kerala","category":"Kerala & South","region":"kerala","location":"Wayanad, Kerala","duration":"3 Days 2 Nights","price":6899,"originalPrice":7999,"subtitle":"A Gadvede Trekkers plantation stay with a short canopy walk and a lake evening.","overview":"Wayanad Canopy Stay is Gadvede Trekkers'' southern long weekend.","imageGallery":"[]","tourDateBatches":"[{\"date\":\"2026-12-04\",\"endDate\":\"2026-12-06\",\"label\":\"December canopy batch\",\"departureCity\":\"Bengaluru\",\"status\":\"OPEN\"}]"}}'::jsonb
  ),
  (
    'b2100000-0000-0000-0000-000000000007',
    'Tamhini Ghat Lakeside Camp',
    'tamhini-ghat-lakeside-camp',
    'camping',
    'pune',
    'Tamhini Ghat, Maharashtra',
    'camping',
    'Tamhini Ghat, Maharashtra',
    'Camping',
    '1 Night',
    'Lakeside',
    'A Gadvede Trekkers lakeside camp below Tamhini with dinner, breakfast, and a short ridge walk.',
    'Tamhini Ghat Lakeside Camp is a one-night Gadvede Trekkers camp on a private lakeside plot the team uses for its own groups. Tents are twin sharing. Dinner and breakfast are cooked on site. After dark the group stays inside the marked camp. A short ridge walk is offered at sunrise for anyone who wants it. Music stays low after 10 pm.',
    1499, 1899, 4.7, 41,
    null, '[]'::jsonb, '[]'::jsonb,
    true, true, 47,
    '{"rawItem":{"name":"Tamhini Ghat Lakeside Camp","shortName":"Tamhini Lakeside Camp","slug":"tamhini-ghat-lakeside-camp","hubSlug":"camping","destination":"Tamhini Ghat, Maharashtra","category":"Camping","type":"Lake","region":"pune","location":"Tamhini Ghat, Maharashtra","duration":"1 Night","price":1499,"originalPrice":1899,"description":"A Gadvede Trekkers lakeside camp below Tamhini with dinner, breakfast, and a short ridge walk.","overview":"Tamhini Ghat Lakeside Camp is a one-night Gadvede Trekkers camp. Tents are twin sharing. Dinner and breakfast are cooked on site.","imageGallery":"[]","trekDateBatches":"[{\"date\":\"2026-11-14\",\"endDate\":\"2026-11-15\",\"label\":\"Lake weekend\",\"departureCity\":\"Pune\",\"status\":\"OPEN\"}]"}}'::jsonb
  ),
  (
    'b2100000-0000-0000-0000-000000000008',
    'Sahyadri Two-Day Pack',
    'sahyadri-two-day-pack',
    'trek',
    'pune',
    'Western Ghats, Maharashtra',
    'backpacking',
    'Western Ghats, Maharashtra',
    'Backpacking',
    '2 Days 1 Night',
    'Trail camp',
    'A Gadvede Trekkers backpacking loop with one trail camp and a shared cook.',
    'Sahyadri Two-Day Pack is Gadvede Trekkers'' own backpacking format. You carry a light day pack. The team carries the camp kitchen and tents. Night one is a trail camp chosen for that month''s water and wind. Day two walks out to the road head. The route changes with the season, and the batch page names the exact trail once seats open. This listing is the Gadvede format, not a copy of any other operator''s itinerary.',
    2499, 2999, 4.6, 17,
    null, '[]'::jsonb, '[]'::jsonb,
    false, true, 48,
    '{"rawItem":{"name":"Sahyadri Two-Day Pack","slug":"sahyadri-two-day-pack","hubSlug":"backpacking","destination":"Western Ghats, Maharashtra","category":"Backpacking","region":"pune","location":"Western Ghats, Maharashtra","difficulty":"Medium","duration":"2 Days 1 Night","price":2499,"originalPrice":2999,"subtitle":"A Gadvede Trekkers backpacking loop with one trail camp and a shared cook.","about":"Sahyadri Two-Day Pack is Gadvede Trekkers'' own backpacking format. You carry a light day pack. The team carries the camp kitchen and tents.","imageGallery":"[]","trekDateBatches":"[{\"date\":\"2026-11-28\",\"endDate\":\"2026-11-29\",\"label\":\"Trail camp batch\",\"departureCity\":\"Pune\",\"status\":\"OPEN\"}]"}}'::jsonb
  ),
  (
    'b2100000-0000-0000-0000-000000000009',
    'New Year Ridge Camp',
    'new-year-ridge-camp',
    'camping',
    'pune',
    'Lonavala ridge, Maharashtra',
    'seasonal-nye',
    'Lonavala ridge, Maharashtra',
    'Seasonal & New Year',
    '2 Nights',
    'Ridge camp',
    'Gadvede Trekkers'' New Year camp on a Lonavala ridge, with a countdown at the campfire.',
    'New Year Ridge Camp is the Gadvede Trekkers year-end batch. The group reaches the ridge on 31 December, has an early dinner, and counts down at a supervised campfire. 1 January is a slow breakfast and a short viewpoint walk before the return to Pune. Fireworks are not allowed. The batch size stays smaller than a regular weekend camp so the night stays manageable.',
    2499, 2999, 4.9, 24,
    null, '[]'::jsonb, '[]'::jsonb,
    true, true, 49,
    '{"rawItem":{"name":"New Year Ridge Camp","shortName":"New Year Ridge Camp","slug":"new-year-ridge-camp","hubSlug":"seasonal-nye","destination":"Lonavala ridge, Maharashtra","category":"Seasonal & New Year","type":"Hill","region":"pune","location":"Lonavala ridge, Maharashtra","duration":"2 Nights","price":2499,"originalPrice":2999,"description":"Gadvede Trekkers'' New Year camp on a Lonavala ridge, with a countdown at the campfire.","overview":"New Year Ridge Camp is the Gadvede Trekkers year-end batch. The group reaches the ridge on 31 December.","imageGallery":"[]","trekDateBatches":"[{\"date\":\"2026-12-31\",\"endDate\":\"2027-01-02\",\"label\":\"New Year batch\",\"departureCity\":\"Pune\",\"status\":\"OPEN\"}]"}}'::jsonb
  )
on conflict (slug) do nothing;

insert into public.product_batches (
  id, product_id, batch_date, end_date, batch_label, departure_city,
  seats_total, seats_available, price, status, available
)
values
  ('c2100000-0000-0000-0000-000000000001', 'b2100000-0000-0000-0000-000000000001', '2026-11-07', '2026-11-07', 'Pune sunrise batch', 'Pune', 30, 30, 899, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000002', 'b2100000-0000-0000-0000-000000000001', '2026-11-21', '2026-11-21', 'Pune sunrise batch', 'Pune', 30, 30, 899, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000003', 'b2100000-0000-0000-0000-000000000002', '2026-11-08', '2026-11-08', 'Mumbai morning batch', 'Mumbai', 30, 30, 999, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000004', 'b2100000-0000-0000-0000-000000000003', '2026-12-11', '2026-12-14', 'December meadow batch', 'Delhi', 16, 16, 7499, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000005', 'b2100000-0000-0000-0000-000000000004', '2026-11-27', '2026-11-29', 'November river batch', 'Delhi', 18, 18, 5499, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000006', 'b2100000-0000-0000-0000-000000000005', '2026-12-18', '2026-12-20', 'December dune batch', 'Jaisalmer', 16, 16, 6299, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000007', 'b2100000-0000-0000-0000-000000000006', '2026-12-04', '2026-12-06', 'December canopy batch', 'Bengaluru', 16, 16, 6899, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000008', 'b2100000-0000-0000-0000-000000000007', '2026-11-14', '2026-11-15', 'Lake weekend', 'Pune', 24, 24, 1499, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000009', 'b2100000-0000-0000-0000-000000000008', '2026-11-28', '2026-11-29', 'Trail camp batch', 'Pune', 16, 16, 2499, 'OPEN', true),
  ('c2100000-0000-0000-0000-000000000010', 'b2100000-0000-0000-0000-000000000009', '2026-12-31', '2027-01-02', 'New Year batch', 'Pune', 20, 20, 2499, 'OPEN', true)
on conflict (id) do nothing;

commit;
