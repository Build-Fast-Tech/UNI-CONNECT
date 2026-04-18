-- UniConnect Migration 004: Add missing campus branches from UNI NAMES list
-- Safe to run on existing deployments — uses NOT EXISTS to skip duplicates.

-- ── COMSATS: add Wah, Attock, Vehari ─────────────────────────────────────────
insert into branches (university_id, name, slug, city)
select u.id, 'Wah Campus', 'wah', 'Wah Cantt'
from universities u where u.slug = 'comsats'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'wah');

insert into branches (university_id, name, slug, city)
select u.id, 'Attock Campus', 'attock', 'Attock'
from universities u where u.slug = 'comsats'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'attock');

insert into branches (university_id, name, slug, city)
select u.id, 'Vehari Campus', 'vehari', 'Vehari'
from universities u where u.slug = 'comsats'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'vehari');

-- ── NUST: add CAE Risalpur, MCE Risalpur ─────────────────────────────────────
insert into branches (university_id, name, slug, city)
select u.id, 'CAE — Risalpur', 'cae', 'Risalpur'
from universities u where u.slug = 'nust'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'cae');

insert into branches (university_id, name, slug, city)
select u.id, 'MCE — Risalpur', 'mce', 'Risalpur'
from universities u where u.slug = 'nust'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'mce');

-- Rename existing "NBC — Quetta" to match official name (update, not insert)
update branches set name = 'Baluchistan Campus, Quetta'
where slug = 'nbc'
  and university_id = (select id from universities where slug = 'nust');

-- ── Bahria University: rename Islamabad to E-8, add H-11 + Health Sciences ───
-- Rename the existing Islamabad branch to E-8
update branches set name = 'Islamabad Campus (E-8)', slug = 'islamabad-e8'
where slug = 'islamabad'
  and university_id = (select id from universities where slug = 'bahria-university');

insert into branches (university_id, name, slug, city)
select u.id, 'Islamabad Campus (H-11)', 'islamabad-h11', 'Islamabad'
from universities u where u.slug = 'bahria-university'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'islamabad-h11');

insert into branches (university_id, name, slug, city)
select u.id, 'Karachi Health Sciences', 'karachi-hs', 'Karachi'
from universities u where u.slug = 'bahria-university'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'karachi-hs');

-- ── Air University: add Kamra, Kharian ───────────────────────────────────────
insert into branches (university_id, name, slug, city)
select u.id, 'Kamra Campus (Aviation City)', 'kamra', 'Kamra'
from universities u where u.slug = 'air-university'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'kamra');

insert into branches (university_id, name, slug, city)
select u.id, 'Kharian Campus', 'kharian', 'Kharian'
from universities u where u.slug = 'air-university'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'kharian');

-- ── Iqra University: add Karachi Gulshan, Karachi North ──────────────────────
insert into branches (university_id, name, slug, city)
select u.id, 'Karachi Campus (Gulshan)', 'karachi-gulshan', 'Karachi'
from universities u where u.slug = 'iqra-university'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'karachi-gulshan');

insert into branches (university_id, name, slug, city)
select u.id, 'Karachi Campus (North)', 'karachi-north', 'Karachi'
from universities u where u.slug = 'iqra-university'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'karachi-north');

-- ── Punjab University: add Allama Iqbal Campus ───────────────────────────────
insert into branches (university_id, name, slug, city)
select u.id, 'Allama Iqbal Campus, Lahore', 'allama-iqbal', 'Lahore'
from universities u where u.slug = 'punjab-university'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'allama-iqbal');

-- ── UET Lahore: add KSK, Narowal ─────────────────────────────────────────────
insert into branches (university_id, name, slug, city)
select u.id, 'Kala Shah Kaku (KSK) Campus', 'ksk', 'Kala Shah Kaku'
from universities u where u.slug = 'uet-lahore'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'ksk');

insert into branches (university_id, name, slug, city)
select u.id, 'Narowal Campus', 'narowal', 'Narowal'
from universities u where u.slug = 'uet-lahore'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'narowal');

-- ── NUML: add Peshawar ────────────────────────────────────────────────────────
insert into branches (university_id, name, slug, city)
select u.id, 'Peshawar Campus', 'peshawar', 'Peshawar'
from universities u where u.slug = 'numl'
  and not exists (select 1 from branches b where b.university_id = u.id and b.slug = 'peshawar');
