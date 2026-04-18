-- UniConnect Seed Data — Comprehensive Pakistani Universities
-- Safe to re-run (truncates first)

truncate table subjects    restart identity cascade;
truncate table universities restart identity cascade;

-- ─── Universities ─────────────────────────────────────────────────────────────
insert into universities (name, short_name, slug, city, province, website, founding_year, total_students, is_featured) values

-- ── Islamabad / Federal ───────────────────────────────────────────────────────
('National University of Sciences and Technology',                    'NUST',    'nust',          'Islamabad', 'Islamabad',   'https://nust.edu.pk',         1991, 15000, true),
('Quaid-i-Azam University',                                           'QAU',     'qau',           'Islamabad', 'Islamabad',   'https://qau.edu.pk',           1967, 15000, true),
('FAST National University of Computer & Emerging Sciences',          'FAST',    'fast',          'Islamabad', 'Islamabad',   'https://nu.edu.pk',            2000, 22000, true),
('COMSATS University Islamabad',                                      'COMSATS', 'comsats',       'Islamabad', 'Islamabad',   'https://comsats.edu.pk',       1998, 32000, true),
('Air University',                                                    'AU',      'air-university','Islamabad', 'Islamabad',   'https://au.edu.pk',            2002, 8000,  true),
('Institute of Space Technology',                                     'IST',     'ist',           'Islamabad', 'Islamabad',   'https://ist.edu.pk',           2002, 3000,  false),
('International Islamic University Islamabad',                        'IIUI',    'iiui',          'Islamabad', 'Islamabad',   'https://iiu.edu.pk',           1980, 20000, true),
('National University of Modern Languages',                           'NUML',    'numl',          'Islamabad', 'Islamabad',   'https://numl.edu.pk',          1970, 18000, false),
('Allama Iqbal Open University',                                      'AIOU',    'aiou',          'Islamabad', 'Islamabad',   'https://aiou.edu.pk',          1974, 100000,false),
('Virtual University of Pakistan',                                    'VU',      'virtual-university','Lahore','Punjab',      'https://vu.edu.pk',            2002, 60000, false),
('Capital University of Science and Technology',                      'CUST',    'cust',          'Islamabad', 'Islamabad',   'https://cust.edu.pk',          2000, 6000,  false),
('Foundation University Islamabad',                                   'FUI',     'fui',           'Islamabad', 'Islamabad',   'https://fui.edu.pk',           2002, 5000,  false),
('PMAS Arid Agriculture University Rawalpindi',                       'UAAR',    'uaar',          'Rawalpindi','Punjab',      'https://uaar.edu.pk',          1994, 8000,  false),
('Pakistan Institute of Engineering and Applied Sciences',            'PIEAS',   'pieas',         'Islamabad', 'Islamabad',   'https://pieas.edu.pk',         1967, 1500,  false),
('Riphah International University',                                   'RIU',     'riphah',        'Islamabad', 'Islamabad',   'https://riphah.edu.pk',        2002, 25000, false),

-- ── Punjab ────────────────────────────────────────────────────────────────────
('Lahore University of Management Sciences',                          'LUMS',    'lums',          'Lahore',    'Punjab',      'https://lums.edu.pk',          1985, 5000,  true),
('University of Engineering and Technology Lahore',                   'UET',     'uet-lahore',    'Lahore',    'Punjab',      'https://uet.edu.pk',           1921, 10000, true),
('University of the Punjab',                                          'PU',      'punjab-university','Lahore',  'Punjab',      'https://pu.edu.pk',            1882, 40000, true),
('Government College University Lahore',                              'GCU',     'gcu-lahore',    'Lahore',    'Punjab',      'https://gcu.edu.pk',           1864, 10000, false),
('Forman Christian College University',                               'FCCU',    'fccu',          'Lahore',    'Punjab',      'https://fccollege.edu.pk',     1864, 4000,  false),
('University of Management and Technology',                           'UMT',     'umt',           'Lahore',    'Punjab',      'https://umt.edu.pk',           1990, 10000, false),
('University of Central Punjab',                                      'UCP',     'ucp',           'Lahore',    'Punjab',      'https://ucp.edu.pk',           2002, 15000, false),
('University of Lahore',                                              'UOL',     'university-of-lahore','Lahore','Punjab',    'https://uol.edu.pk',           1999, 20000, false),
('Beaconhouse National University',                                   'BNU',     'bnu',           'Lahore',    'Punjab',      'https://bnu.edu.pk',           2003, 3500,  false),
('National College of Arts',                                          'NCA',     'nca',           'Lahore',    'Punjab',      'https://nca.edu.pk',           1875, 2000,  false),
('University of Education',                                           'UE',      'university-of-education','Lahore','Punjab', 'https://ue.edu.pk',            2002, 25000, false),
('Superior University',                                               'SU',      'superior-university','Lahore','Punjab',     'https://superior.edu.pk',      2000, 15000, false),
('Lahore Garrison University',                                        'LGU',     'lgu',           'Lahore',    'Punjab',      'https://lgu.edu.pk',           2002, 8000,  false),
('Minhaj University Lahore',                                          'MUL',     'minhaj-university','Lahore', 'Punjab',      'https://mul.edu.pk',           2005, 6000,  false),
('University of Home Economics',                                      'UHE',     'uhe',           'Lahore',    'Punjab',      'https://uhe.edu.pk',           1950, 4000,  false),
('Pakistan Institute of Fashion and Design',                          'PIFD',    'pifd',          'Lahore',    'Punjab',      'https://pifd.edu.pk',          2012, 1500,  false),
('University of Veterinary and Animal Sciences',                      'UVAS',    'uvas',          'Lahore',    'Punjab',      'https://uvas.edu.pk',          2002, 6000,  false),
('King Edward Medical University',                                    'KEMU',    'kemu',          'Lahore',    'Punjab',      'https://kemu.edu.pk',          1860, 2500,  false),
('Fatima Jinnah Medical University',                                  'FJMU',    'fjmu',          'Lahore',    'Punjab',      'https://fjmu.edu.pk',          1948, 2000,  false),
('Government College University Faisalabad',                          'GCUF',    'gcuf',          'Faisalabad','Punjab',      'https://gcuf.edu.pk',          1897, 10000, false),
('University of Agriculture Faisalabad',                              'UAF',     'uaf',           'Faisalabad','Punjab',      'https://uaf.edu.pk',           1909, 15000, false),
('National Textile University',                                       'NTU',     'ntu',           'Faisalabad','Punjab',      'https://ntu.edu.pk',           1959, 5000,  false),
('University of Sargodha',                                            'UOS',     'university-of-sargodha','Sargodha','Punjab','https://uos.edu.pk',          2005, 12000, false),
('University of Gujrat',                                              'UOG',     'university-of-gujrat','Gujrat','Punjab',    'https://uog.edu.pk',           2004, 10000, false),
('University of Sialkot',                                             'USKT',    'university-of-sialkot','Sialkot','Punjab',  'https://uskt.edu.pk',          2014, 4000,  false),
('University of Okara',                                               'UO',      'university-of-okara','Okara', 'Punjab',     'https://uo.edu.pk',            2012, 5000,  false),
('Bahauddin Zakariya University',                                     'BZU',     'bzu',           'Multan',    'Punjab',      'https://bzu.edu.pk',           1975, 20000, false),
('Nishtar Medical University',                                        'NMU',     'nmu',           'Multan',    'Punjab',      'https://nmu.edu.pk',           1953, 3000,  false),
('Muhammad Nawaz Shareef University of Agriculture',                  'MNSUA',   'mnsua',         'Multan',    'Punjab',      'https://mnsuam.edu.pk',        2012, 4000,  false),
('Islamia University Bahawalpur',                                     'IUB',     'iub',           'Bahawalpur','Punjab',      'https://iub.edu.pk',           1925, 18000, false),
('Ghazi University',                                                  'GU',      'ghazi-university','Dera Ghazi Khan','Punjab','https://gudgk.edu.pk',        2012, 5000,  false),

-- ── Sindh ─────────────────────────────────────────────────────────────────────
('Institute of Business Administration Karachi',                      'IBA',     'iba',           'Karachi',   'Sindh',       'https://iba.edu.pk',           1955, 4000,  true),
('NED University of Engineering and Technology',                      'NED',     'ned',           'Karachi',   'Sindh',       'https://neduet.edu.pk',        1921, 8000,  true),
('Karachi University',                                                'KU',      'karachi-university','Karachi','Sindh',      'https://uok.edu.pk',           1951, 24000, true),
('SZABIST University',                                                'SZABIST', 'szabist',       'Karachi',   'Sindh',       'https://szabist.edu.pk',       1995, 6000,  false),
('Habib University',                                                  'HU',      'habib-university','Karachi',  'Sindh',       'https://habib.edu.pk',         2014, 1500,  false),
('Aga Khan University',                                               'AKU',     'aku',           'Karachi',   'Sindh',       'https://aku.edu',              1983, 2000,  false),
('Dow University of Health Sciences',                                 'DUHS',    'duhs',          'Karachi',   'Sindh',       'https://duhs.edu.pk',          2004, 5000,  false),
('Ziauddin University',                                               'ZU',      'ziauddin-university','Karachi','Sindh',     'https://zu.edu.pk',            1995, 4000,  false),
('Sir Syed University of Engineering and Technology',                 'SSUET',   'ssuet',         'Karachi',   'Sindh',       'https://ssuet.edu.pk',         1994, 5000,  false),
('DHA Suffa University',                                              'DSU',     'dsu',           'Karachi',   'Sindh',       'https://dsu.edu.pk',           2012, 3000,  false),
('Hamdard University',                                                'HUK',     'hamdard-university','Karachi','Sindh',      'https://hamdardu.edu.pk',      1991, 5000,  false),
('Iqra University',                                                   'IU',      'iqra-university','Karachi',  'Sindh',       'https://iqra.edu.pk',          1998, 10000, false),
('Jinnah University for Women',                                       'JUW',     'juw',           'Karachi',   'Sindh',       'https://juw.edu.pk',           1999, 4000,  false),
('Baqai Medical University',                                          'BMU',     'bmu',           'Karachi',   'Sindh',       'https://baqai.edu.pk',         1988, 2000,  false),
('Indus Valley School of Art and Architecture',                       'IVSAA',   'ivsaa',         'Karachi',   'Sindh',       'https://indusvalley.edu.pk',   1989, 1000,  false),
('University of Sindh',                                               'USINDH',  'university-of-sindh','Jamshoro','Sindh',    'https://usindh.edu.pk',        1947, 20000, false),
('Mehran University of Engineering and Technology',                   'MUET',    'muet',          'Jamshoro',  'Sindh',       'https://muet.edu.pk',          1963, 7000,  false),
('Liaquat University of Medical and Health Sciences',                 'LUMHS',   'lumhs',         'Jamshoro',  'Sindh',       'https://lumhs.edu.pk',         1951, 3000,  false),
('Shah Abdul Latif University',                                       'SALU',    'salu',          'Khairpur',  'Sindh',       'https://salu.edu.pk',          1987, 8000,  false),
('Sukkur IBA University',                                             'SIBAU',   'sukkur-iba',    'Sukkur',    'Sindh',       'https://iba-suk.edu.pk',       2014, 3000,  false),
('ISRA University',                                                   'ISRA',    'isra-university','Hyderabad','Sindh',       'https://isra.edu.pk',          1997, 3000,  false),
('Sindh Agriculture University',                                      'SAU',     'sau',           'Tandojam',  'Sindh',       'https://sau.edu.pk',           1977, 6000,  false),
('Quaid-e-Awam University of Engineering Sciences and Technology',    'QUEST',   'quest',         'Nawabshah', 'Sindh',       'https://quest.edu.pk',         2000, 5000,  false),

-- ── KPK ───────────────────────────────────────────────────────────────────────
('Ghulam Ishaq Khan Institute',                                       'GIKI',    'giki',          'Topi',      'KPK',         'https://giki.edu.pk',          1993, 3000,  true),
('University of Peshawar',                                            'UOP',     'peshawar-university','Peshawar','KPK',      'https://uop.edu.pk',           1950, 12000, false),
('University of Engineering and Technology Peshawar',                 'UETP',    'uet-peshawar',  'Peshawar',  'KPK',         'https://uetpeshawar.edu.pk',   1980, 6000,  false),
('Khyber Medical University',                                         'KMU',     'kmu',           'Peshawar',  'KPK',         'https://kmu.edu.pk',           2008, 5000,  false),
('Islamia College University',                                        'ICU',     'icu',           'Peshawar',  'KPK',         'https://icp.edu.pk',           1913, 8000,  false),
('Abdul Wali Khan University Mardan',                                 'AWKUM',   'awkum',         'Mardan',    'KPK',         'https://awkum.edu.pk',         2009, 10000, false),
('Gomal University',                                                  'GU-DIK',  'gomal-university','Dera Ismail Khan','KPK', 'https://gu.edu.pk',            1974, 10000, false),
('Hazara University',                                                 'HU-MNS',  'hazara-university','Mansehra','KPK',        'https://hu.edu.pk',            2001, 8000,  false),
('University of Malakand',                                            'UOM',     'university-of-malakand','Chakdara','KPK',  'https://uom.edu.pk',           2001, 8000,  false),
('University of Swabi',                                               'UOS-SWB', 'university-of-swabi','Swabi', 'KPK',        'https://uoswabi.edu.pk',       2012, 5000,  false),
('University of Swat',                                                'USWAT',   'university-of-swat','Swat',   'KPK',        'https://uswat.edu.pk',         2012, 5000,  false),
('Kohat University of Science and Technology',                        'KUST',    'kust',          'Kohat',     'KPK',         'https://kust.edu.pk',          2001, 5000,  false),
('University of Haripur',                                             'UOH',     'university-of-haripur','Haripur','KPK',    'https://uoh.edu.pk',           2012, 4000,  false),
('Bacha Khan University',                                             'BKU',     'bacha-khan-university','Charsadda','KPK',  'https://bkuc.edu.pk',          2012, 5000,  false),
('University of Science and Technology Bannu',                        'USTB',    'ustb',          'Bannu',     'KPK',         'https://ustb.edu.pk',          2012, 4000,  false),

-- ── Balochistan ───────────────────────────────────────────────────────────────
('University of Balochistan',                                         'UOB',     'university-of-balochistan','Quetta','Balochistan','https://uob.edu.pk',     1970, 8000,  false),
('Balochistan University of IT Engineering and Management Sciences',  'BUITEMS', 'buitems',       'Quetta',    'Balochistan', 'https://buitms.edu.pk',        2002, 6000,  false),
('Sardar Bahadur Khan Women University',                              'SBKWU',   'sbkwu',         'Quetta',    'Balochistan', 'https://sbkwu.edu.pk',         2004, 3000,  false),
('University of Turbat',                                              'UOT',     'university-of-turbat','Turbat','Balochistan','https://uot.edu.pk',          2012, 3000,  false),
('Lasbela University of Agriculture Water and Marine Sciences',       'LUAWMS',  'luawms',        'Uthal',     'Balochistan', 'https://luawms.edu.pk',        2005, 2000,  false),
('University of Loralai',                                             'UOL-LRI', 'university-of-loralai','Loralai','Balochistan','https://uol.edu.pk',        2012, 2000,  false),

-- ── AJK ───────────────────────────────────────────────────────────────────────
('University of Azad Jammu and Kashmir',                              'UAJK',    'uajk',          'Muzaffarabad','AJK',       'https://ajku.edu.pk',          1980, 8000,  false),
('Mirpur University of Science and Technology',                       'MUST',    'must',          'Mirpur',    'AJK',         'https://must.edu.pk',          2008, 5000,  false),
('University of Poonch Rawalakot',                                    'UPR',     'upr',           'Rawalakot', 'AJK',         'https://upr.edu.pk',           2009, 3000,  false),

-- ── Gilgit-Baltistan ──────────────────────────────────────────────────────────
('Karakoram International University',                                'KIU',     'kiu',           'Gilgit',    'GB',          'https://kiu.edu.pk',           2002, 5000,  false),
('University of Baltistan',                                           'UOBS',    'university-of-baltistan','Skardu','GB',     'https://uobs.edu.pk',          2014, 2000,  false),

-- ── Bahria (multi-city) ───────────────────────────────────────────────────────
('Bahria University',                                                 'BU',      'bahria-university','Islamabad','Islamabad',  'https://bahria.edu.pk',        2000, 12000, false);

-- ─── Branches ─────────────────────────────────────────────────────────────────

-- NUST campuses
insert into branches (university_id, name, slug, city) select id, 'H-12 Main Campus',                    'h12-main',       'Islamabad'  from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'SEECS',                               'seecs',          'Islamabad'  from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'NSBE',                                'nsbe',           'Islamabad'  from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'NICE',                                'nice',           'Islamabad'  from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'SMME',                                'smme',           'Islamabad'  from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'RIMMS',                               'rimms',          'Islamabad'  from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'PNEC Karachi',                        'pnec',           'Karachi'    from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'CAE Risalpur',                        'cae',            'Risalpur'   from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'MCS Rawalpindi',                      'mcs',            'Rawalpindi' from universities where slug = 'nust';

-- FAST campuses
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',                    'islamabad',      'Islamabad'  from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',                       'lahore',         'Lahore'     from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',                      'karachi',        'Karachi'    from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Peshawar Campus',                     'peshawar',       'Peshawar'   from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',                   'faisalabad',     'Faisalabad' from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Chiniot-Faisalabad Campus',           'cf-campus',      'Chiniot'    from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Multan Campus',                       'multan',         'Multan'     from universities where slug = 'fast';

-- COMSATS campuses
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',                    'islamabad',      'Islamabad'  from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',                       'lahore',         'Lahore'     from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Wah Campus',                          'wah',            'Wah Cantt'  from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Abbottabad Campus',                   'abbottabad',     'Abbottabad' from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Sahiwal Campus',                      'sahiwal',        'Sahiwal'    from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Vehari Campus',                       'vehari',         'Vehari'     from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Attock Campus',                       'attock',         'Attock'     from universities where slug = 'comsats';

-- Air University campuses
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus (Main)',             'islamabad',      'Islamabad'  from universities where slug = 'air-university';
insert into branches (university_id, name, slug, city) select id, 'Multan Campus',                       'multan',         'Multan'     from universities where slug = 'air-university';
insert into branches (university_id, name, slug, city) select id, 'Kamra Campus',                        'kamra',          'Kamra'      from universities where slug = 'air-university';

-- Bahria University campuses
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',                    'islamabad',      'Islamabad'  from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',                      'karachi',        'Karachi'    from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',                       'lahore',         'Lahore'     from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Hyderabad Campus',                    'hyderabad',      'Hyderabad'  from universities where slug = 'bahria-university';

-- NUML campuses
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus (Main)',             'islamabad',      'Islamabad'  from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',                       'lahore',         'Lahore'     from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',                      'karachi',        'Karachi'    from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Peshawar Campus',                     'peshawar',       'Peshawar'   from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Quetta Campus',                       'quetta',         'Quetta'     from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',                   'faisalabad',     'Faisalabad' from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Multan Campus',                       'multan',         'Multan'     from universities where slug = 'numl';

-- UET campuses
insert into branches (university_id, name, slug, city) select id, 'Main Campus Lahore',                  'lahore-main',    'Lahore'     from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',                   'faisalabad',     'Faisalabad' from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Gujranwala Campus',                   'gujranwala',     'Gujranwala' from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Taxila Campus',                       'taxila',         'Taxila'     from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Kala Shah Kaku Campus',               'ksk',            'Kala Shah Kaku' from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Narowal Campus',                      'narowal',        'Narowal'    from universities where slug = 'uet-lahore';

-- University of Lahore campuses
insert into branches (university_id, name, slug, city) select id, 'Defence Road Campus (Main)',          'defence-road',   'Lahore'     from universities where slug = 'university-of-lahore';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',                    'islamabad',      'Islamabad'  from universities where slug = 'university-of-lahore';
insert into branches (university_id, name, slug, city) select id, 'Gujrat Campus',                       'gujrat',         'Gujrat'     from universities where slug = 'university-of-lahore';
insert into branches (university_id, name, slug, city) select id, 'Sargodha Campus',                     'sargodha',       'Sargodha'   from universities where slug = 'university-of-lahore';
insert into branches (university_id, name, slug, city) select id, 'Lahore Raiwind Road Campus',          'raiwind',        'Lahore'     from universities where slug = 'university-of-lahore';

-- Riphah campuses
insert into branches (university_id, name, slug, city) select id, 'Islamabad — I-14 Campus',             'i14',            'Islamabad'  from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Islamabad — Faisal Town Campus',      'faisal-town',    'Islamabad'  from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',                       'lahore',         'Lahore'     from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',                   'faisalabad',     'Faisalabad' from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Rawalpindi Campus',                   'rawalpindi',     'Rawalpindi' from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',                      'karachi',        'Karachi'    from universities where slug = 'riphah';

-- SZABIST campuses
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (Main)',               'karachi',        'Karachi'    from universities where slug = 'szabist';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',                    'islamabad',      'Islamabad'  from universities where slug = 'szabist';
insert into branches (university_id, name, slug, city) select id, 'Larkana Campus',                      'larkana',        'Larkana'    from universities where slug = 'szabist';
insert into branches (university_id, name, slug, city) select id, 'Hyderabad Campus',                    'hyderabad',      'Hyderabad'  from universities where slug = 'szabist';

-- Iqra University campuses
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (Main)',               'karachi',        'Karachi'    from universities where slug = 'iqra-university';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',                    'islamabad',      'Islamabad'  from universities where slug = 'iqra-university';
insert into branches (university_id, name, slug, city) select id, 'Peshawar Campus',                     'peshawar',       'Peshawar'   from universities where slug = 'iqra-university';
insert into branches (university_id, name, slug, city) select id, 'Hyderabad Campus',                    'hyderabad',      'Hyderabad'  from universities where slug = 'iqra-university';

-- Punjab University campuses
insert into branches (university_id, name, slug, city) select id, 'Main Campus Lahore',                  'lahore-main',    'Lahore'     from universities where slug = 'punjab-university';
insert into branches (university_id, name, slug, city) select id, 'Gujranwala Campus',                   'gujranwala',     'Gujranwala' from universities where slug = 'punjab-university';
insert into branches (university_id, name, slug, city) select id, 'Jhelum Campus',                       'jhelum',         'Jhelum'     from universities where slug = 'punjab-university';

-- University of Education campuses
insert into branches (university_id, name, slug, city) select id, 'Lahore — Bank Road (Main)',           'bank-road',      'Lahore'     from universities where slug = 'university-of-education';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',                   'faisalabad',     'Faisalabad' from universities where slug = 'university-of-education';
insert into branches (university_id, name, slug, city) select id, 'Multan Campus',                       'multan',         'Multan'     from universities where slug = 'university-of-education';
insert into branches (university_id, name, slug, city) select id, 'DG Khan Campus',                      'dg-khan',        'Dera Ghazi Khan' from universities where slug = 'university-of-education';
insert into branches (university_id, name, slug, city) select id, 'Okara Campus',                        'okara',          'Okara'      from universities where slug = 'university-of-education';

-- Hamdard University campuses
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (Main)',               'karachi',        'Karachi'    from universities where slug = 'hamdard-university';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',                    'islamabad',      'Islamabad'  from universities where slug = 'hamdard-university';

-- University of Gujrat campuses
insert into branches (university_id, name, slug, city) select id, 'Gujrat Campus (Main)',                'gujrat-main',    'Gujrat'     from universities where slug = 'university-of-gujrat';
insert into branches (university_id, name, slug, city) select id, 'Hafizabad Campus',                    'hafizabad',      'Hafizabad'  from universities where slug = 'university-of-gujrat';
insert into branches (university_id, name, slug, city) select id, 'Sialkot Campus',                      'sialkot',        'Sialkot'    from universities where slug = 'university-of-gujrat';

-- MUET campuses
insert into branches (university_id, name, slug, city) select id, 'Jamshoro Campus (Main)',              'jamshoro',       'Jamshoro'   from universities where slug = 'muet';
insert into branches (university_id, name, slug, city) select id, 'Khairpur Campus',                     'khairpur',       'Khairpur'   from universities where slug = 'muet';
insert into branches (university_id, name, slug, city) select id, 'Mirpurkhas Campus',                   'mirpurkhas',     'Mirpurkhas' from universities where slug = 'muet';

-- ISRA University campuses
insert into branches (university_id, name, slug, city) select id, 'Hyderabad Campus (Main)',             'hyderabad',      'Hyderabad'  from universities where slug = 'isra-university';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',                    'islamabad',      'Islamabad'  from universities where slug = 'isra-university';

-- IUB campuses
insert into branches (university_id, name, slug, city) select id, 'Bahawalpur Campus (Main)',            'bahawalpur',     'Bahawalpur' from universities where slug = 'iub';
insert into branches (university_id, name, slug, city) select id, 'Rahim Yar Khan Campus',               'ryk',            'Rahim Yar Khan' from universities where slug = 'iub';

-- ─── Common Subjects ─────────────────────────────────────────────────────────
insert into subjects (name, faculty) values
  ('Data Structures & Algorithms',       'Computer Science'),
  ('Operating Systems',                  'Computer Science'),
  ('Computer Networks',                  'Computer Science'),
  ('Database Systems',                   'Computer Science'),
  ('Software Engineering',               'Computer Science'),
  ('Artificial Intelligence',            'Computer Science'),
  ('Machine Learning',                   'Computer Science'),
  ('Object Oriented Programming',        'Computer Science'),
  ('Web Technologies',                   'Computer Science'),
  ('Computer Architecture',              'Computer Science'),
  ('Theory of Automata',                 'Computer Science'),
  ('Compiler Construction',              'Computer Science'),
  ('Human Computer Interaction',         'Computer Science'),
  ('Mobile Application Development',     'Computer Science'),
  ('Cloud Computing',                    'Computer Science'),
  ('Cyber Security',                     'Computer Science'),
  ('Calculus I',                         'Mathematics'),
  ('Calculus II',                        'Mathematics'),
  ('Linear Algebra',                     'Mathematics'),
  ('Discrete Mathematics',               'Mathematics'),
  ('Probability & Statistics',           'Mathematics'),
  ('Numerical Methods',                  'Mathematics'),
  ('Differential Equations',             'Mathematics'),
  ('Circuit Analysis',                   'Electrical Engineering'),
  ('Digital Logic Design',               'Electrical Engineering'),
  ('Signals & Systems',                  'Electrical Engineering'),
  ('Electromagnetic Theory',             'Electrical Engineering'),
  ('Control Systems',                    'Electrical Engineering'),
  ('Power Systems',                      'Electrical Engineering'),
  ('Microprocessors & Microcontrollers', 'Electrical Engineering'),
  ('Electronics',                        'Electrical Engineering'),
  ('Mechanics of Materials',             'Mechanical Engineering'),
  ('Thermodynamics',                     'Mechanical Engineering'),
  ('Fluid Mechanics',                    'Mechanical Engineering'),
  ('Machine Design',                     'Mechanical Engineering'),
  ('Engineering Drawing',                'Engineering'),
  ('Pakistan Studies',                   'General'),
  ('Islamic Studies',                    'General'),
  ('English Composition',                'General'),
  ('Technical Writing',                  'General'),
  ('Communication Skills',               'General'),
  ('Financial Accounting',               'Business'),
  ('Principles of Management',           'Business'),
  ('Marketing Management',               'Business'),
  ('Business Communication',             'Business'),
  ('Entrepreneurship',                   'Business'),
  ('Microeconomics',                     'Economics'),
  ('Macroeconomics',                     'Economics');
