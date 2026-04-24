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
('University of Engineering and Technology Taxila',                   'UET Taxila','uet-taxila',  'Taxila',    'Punjab',      'https://uettaxila.edu.pk',     1975, 7000,  false),
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

-- ─── Additional universities (from full 100+ list) ──────────────────────────
-- Mirrors migration 012. Kept as a second INSERT so the first block above
-- stays stable and easy to diff.
insert into universities
  (name,                                                                     short_name,     slug,                      city,             province,      website,                        founding_year, total_students, is_featured)
values
  ('National Defence University',                                            'NDU',          'ndu',                     'Islamabad',      'Islamabad',   'https://ndu.edu.pk',           1970,          2000,           false),
  ('National University of Technology',                                      'NUTECH',       'nutech',                  'Islamabad',      'Islamabad',   'https://nutech.edu.pk',        2018,          2000,           false),
  ('Preston University',                                                     'Preston',      'preston-university',      'Islamabad',      'Islamabad',   'https://preston.edu.pk',       1985,          5000,           false),
  ('Fatima Jinnah Women University',                                         'FJWU',         'fjwu',                    'Rawalpindi',     'Punjab',      'https://fjwu.edu.pk',          1998,          6000,           false),
  ('GIFT University',                                                        'GIFT',         'gift-university',         'Gujranwala',     'Punjab',      'https://gift.edu.pk',          2002,          3000,           false),
  ('HITEC University',                                                       'HITEC',        'hitec-university',        'Taxila',         'Punjab',      'https://hitecuni.edu.pk',      2007,          3000,           false),
  ('Information Technology University',                                      'ITU',          'itu',                     'Lahore',         'Punjab',      'https://itu.edu.pk',           2012,          3000,           false),
  ('Khwaja Fareed University of Engineering and Information Technology',     'KFUEIT',       'kfueit',                  'Rahim Yar Khan', 'Punjab',      'https://kfueit.edu.pk',        2014,          6000,           false),
  ('Kinnaird College for Women',                                             'Kinnaird',     'kinnaird',                'Lahore',         'Punjab',      'https://kinnaird.edu.pk',      1913,          3000,           false),
  ('University of Narowal',                                                  'UON',          'university-of-narowal',   'Narowal',        'Punjab',      'https://uon.edu.pk',           2020,          2000,           false),
  ('The University of Faisalabad',                                           'TUF',          'tuf',                     'Faisalabad',     'Punjab',      'https://tuf.edu.pk',           2002,          6000,           false),
  ('University of Health Sciences',                                          'UHS',          'uhs',                     'Lahore',         'Punjab',      'https://uhs.edu.pk',           2002,          4000,           false),
  ('University of Jhang',                                                    'UOJ',          'university-of-jhang',     'Jhang',          'Punjab',      'https://uoj.edu.pk',           2014,          3000,           false),
  ('University of South Asia',                                               'USA',          'usa',                     'Lahore',         'Punjab',      'https://usa.edu.pk',           2004,          4000,           false),
  ('Women University Multan',                                                'WUM',          'wum',                     'Multan',         'Punjab',      'https://wum.edu.pk',           2010,          3000,           false),
  ('Benazir Bhutto Shaheed University of Technology and Skill Development',  'BBSUTSD',      'bbsutsd',                 'Khairpur',       'Sindh',       'https://bbsutsd.edu.pk',       2013,          4000,           false),
  ('Dawood University of Engineering and Technology',                        'DUET',         'duet',                    'Karachi',        'Sindh',       'https://duet.edu.pk',          2012,          4000,           false),
  ('Federal Urdu University of Arts, Science and Technology',                'FUUAST',       'fuuast',                  'Karachi',        'Sindh',       'https://fuuast.edu.pk',        2002,          10000,          false),
  ('Greenwich University',                                                   'Greenwich',    'greenwich-university',    'Karachi',        'Sindh',       'https://greenwich.edu.pk',     1987,          4000,           false),
  ('Indus University',                                                       'Indus',        'indus-university',        'Karachi',        'Sindh',       'https://indus.edu.pk',         2010,          4000,           false),
  ('Institute of Business Management',                                       'IoBM',         'iobm',                    'Karachi',        'Sindh',       'https://iobm.edu.pk',          1995,          5000,           false),
  ('Jinnah Sindh Medical University',                                        'JSMU',         'jsmu',                    'Karachi',        'Sindh',       'https://jsmu.edu.pk',          2012,          3000,           false),
  ('Karachi Institute of Economics and Technology',                          'KIET',         'kiet',                    'Karachi',        'Sindh',       'https://pafkiet.edu.pk',       1997,          5000,           false),
  ('Mohammad Ali Jinnah University',                                         'MAJU',         'maju',                    'Karachi',        'Sindh',       'https://jinnah.edu',           1998,          5000,           false),
  ('Nazeer Hussain University',                                              'NSU',          'nazeer-hussain-university','Karachi',       'Sindh',       'https://nhu.edu.pk',           2015,          2000,           false),
  ('Sindh Madressatul Islam University',                                     'SMIU',         'smiu',                    'Karachi',        'Sindh',       'https://smiu.edu.pk',          2012,          5000,           false),
  ('Abasyn University',                                                      'Abasyn',       'abasyn',                  'Peshawar',       'KPK',         'https://abasyn.edu.pk',        2007,          8000,           false),
  ('CECOS University of Information Technology and Emerging Sciences',       'CECOS',        'cecos',                   'Peshawar',       'KPK',         'https://cecos.edu.pk',         1986,          5000,           false),
  ('City University of Science and Information Technology',                  'CUSIT',        'cusit',                   'Peshawar',       'KPK',         'https://cusit.edu.pk',         2001,          6000,           false),
  ('Gandhara University',                                                    'Gandhara',     'gandhara-university',     'Peshawar',       'KPK',         'https://gu.edu.pk',            1994,          3000,           false),
  ('Iqra National University',                                               'INU',          'inu',                     'Peshawar',       'KPK',         'https://inu.edu.pk',           2008,          5000,           false),
  ('Qurtuba University of Science and Information Technology',               'Qurtuba',      'qurtuba',                 'Peshawar',       'KPK',         'https://qurtuba.edu.pk',       2001,          4000,           false),
  ('Sarhad University of Science and Information Technology',                'SUIT',         'suit',                    'Peshawar',       'KPK',         'https://suit.edu.pk',          2003,          5000,           false),
  ('Shaheed Benazir Bhutto University Sheringal',                            'SBBU',         'sbbu-sheringal',          'Sheringal',      'KPK',         'https://sbbu.edu.pk',          2010,          3000,           false),
  ('Balochistan University of Engineering and Technology',                   'BUET Khuzdar', 'buet-khuzdar',            'Khuzdar',        'Balochistan', 'https://buetk.edu.pk',         1994,          3000,           false),
  ('Women University of Azad Jammu and Kashmir',                             'WUAJK',        'wuajk',                   'Bagh',           'AJK',         'https://wuajk.edu.pk',         2014,          2000,           false),
  ('Other / Not Listed',                                                     'Other',        'other',                   null,             null,          null,                           null,          null,           false);

-- ─── Branches ─────────────────────────────────────────────────────────────────
-- Each branch = one campus. University chat is shared; campus shown as a tag on the student.

-- ── FAST-NUCES — 5 campuses ──────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',          'islamabad',    'Islamabad'   from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',             'lahore',       'Lahore'      from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',            'karachi',      'Karachi'     from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Peshawar Campus',           'peshawar',     'Peshawar'    from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Chiniot-Faisalabad Campus', 'cf-campus',    'Chiniot'     from universities where slug = 'fast';

-- ── NUST — 7 campuses ────────────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'H-12 Islamabad (Main)',     'h12-main',     'Islamabad'   from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'PNEC — Karachi',            'pnec',         'Karachi'     from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'CEME — Rawalpindi',         'ceme',         'Rawalpindi'  from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'MCS — Rawalpindi',          'mcs',          'Rawalpindi'  from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'CAE — Risalpur',            'cae',          'Risalpur'    from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'MCE — Risalpur',            'mce',          'Risalpur'    from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'Baluchistan Campus, Quetta','nbc',          'Quetta'      from universities where slug = 'nust';

-- ── COMSATS — 7 campuses ─────────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',          'islamabad',    'Islamabad'   from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',             'lahore',       'Lahore'      from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Abbottabad Campus',         'abbottabad',   'Abbottabad'  from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Wah Campus',                'wah',          'Wah Cantt'   from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Attock Campus',             'attock',       'Attock'      from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Sahiwal Campus',            'sahiwal',      'Sahiwal'     from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Vehari Campus',             'vehari',       'Vehari'      from universities where slug = 'comsats';

-- ── University of the Punjab — 4 campuses ────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Quaid-e-Azam Campus, Lahore','qaz-lahore',  'Lahore'      from universities where slug = 'punjab-university';
insert into branches (university_id, name, slug, city) select id, 'Allama Iqbal Campus, Lahore','allama-iqbal', 'Lahore'      from universities where slug = 'punjab-university';
insert into branches (university_id, name, slug, city) select id, 'Gujranwala Campus',         'gujranwala',   'Gujranwala'  from universities where slug = 'punjab-university';
insert into branches (university_id, name, slug, city) select id, 'Jhelum Campus',             'jhelum',       'Jhelum'      from universities where slug = 'punjab-university';

-- ── UET Lahore — 5 campuses ──────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Main Campus, Lahore',       'lahore-main',  'Lahore'      from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Kala Shah Kaku (KSK) Campus','ksk',         'Kala Shah Kaku' from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',         'faisalabad',   'Faisalabad'  from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Rachna (Gujranwala) Campus','rachna',       'Gujranwala'  from universities where slug = 'uet-lahore';
insert into branches (university_id, name, slug, city) select id, 'Narowal Campus',            'narowal',      'Narowal'     from universities where slug = 'uet-lahore';

-- ── UET Taxila — 2 campuses ──────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Main Campus, Taxila',       'taxila-main',  'Taxila'      from universities where slug = 'uet-taxila';
insert into branches (university_id, name, slug, city) select id, 'Chakwal Campus',            'chakwal',      'Chakwal'     from universities where slug = 'uet-taxila';

-- ── SZABIST — 3 campuses ─────────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (Main)',     'karachi',      'Karachi'     from universities where slug = 'szabist';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',          'islamabad',    'Islamabad'   from universities where slug = 'szabist';
insert into branches (university_id, name, slug, city) select id, 'Hyderabad Campus',          'hyderabad',    'Hyderabad'   from universities where slug = 'szabist';

-- ── Bahria University — 5 campuses ───────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus (E-8)',    'islamabad-e8', 'Islamabad'   from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus (H-11)',   'islamabad-h11','Islamabad'   from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',            'karachi',      'Karachi'     from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Karachi Health Sciences',   'karachi-hs',   'Karachi'     from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',             'lahore',       'Lahore'      from universities where slug = 'bahria-university';

-- ── Air University — 4 campuses ──────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus (Main)',   'islamabad',    'Islamabad'   from universities where slug = 'air-university';
insert into branches (university_id, name, slug, city) select id, 'Multan Campus',             'multan',       'Multan'      from universities where slug = 'air-university';
insert into branches (university_id, name, slug, city) select id, 'Kamra Campus (Aviation City)','kamra',      'Kamra'       from universities where slug = 'air-university';
insert into branches (university_id, name, slug, city) select id, 'Kharian Campus',            'kharian',      'Kharian'     from universities where slug = 'air-university';

-- ── NUML — 4 campuses ────────────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus (Main)',   'islamabad',    'Islamabad'   from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',             'lahore',       'Lahore'      from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',            'karachi',      'Karachi'     from universities where slug = 'numl';
insert into branches (university_id, name, slug, city) select id, 'Peshawar Campus',           'peshawar',     'Peshawar'    from universities where slug = 'numl';

-- ── University of Education — 3 campuses ─────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus (Main)',      'lahore-main',  'Lahore'      from universities where slug = 'university-of-education';
insert into branches (university_id, name, slug, city) select id, 'Multan Campus',             'multan',       'Multan'      from universities where slug = 'university-of-education';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',         'faisalabad',   'Faisalabad'  from universities where slug = 'university-of-education';

-- ── LUMS — single campus ─────────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'DHA, Lahore (Main)',        'lahore-main',  'Lahore'      from universities where slug = 'lums';

-- ── IBA — single campus ──────────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Main Campus, Karachi',      'karachi-main', 'Karachi'     from universities where slug = 'iba';

-- ── Quaid-i-Azam University — single campus ──────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',          'islamabad',    'Islamabad'   from universities where slug = 'qau';

-- ── Aga Khan University — single campus ──────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (Main)',     'karachi-main', 'Karachi'     from universities where slug = 'aku';

-- ── University of Lahore — 5 campuses ────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Defence Road Campus (Main)','defence-road', 'Lahore'      from universities where slug = 'university-of-lahore';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',          'islamabad',    'Islamabad'   from universities where slug = 'university-of-lahore';
insert into branches (university_id, name, slug, city) select id, 'Gujrat Campus',             'gujrat',       'Gujrat'      from universities where slug = 'university-of-lahore';
insert into branches (university_id, name, slug, city) select id, 'Sargodha Campus',           'sargodha',     'Sargodha'    from universities where slug = 'university-of-lahore';
insert into branches (university_id, name, slug, city) select id, 'Raiwind Road Campus',       'raiwind',      'Lahore'      from universities where slug = 'university-of-lahore';

-- ── Riphah International — 6 campuses ────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Islamabad — I-14 Campus',   'i14',          'Islamabad'   from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Islamabad — Faisal Town',   'faisal-town',  'Islamabad'   from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',             'lahore',       'Lahore'      from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',         'faisalabad',   'Faisalabad'  from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Rawalpindi Campus',         'rawalpindi',   'Rawalpindi'  from universities where slug = 'riphah';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',            'karachi',      'Karachi'     from universities where slug = 'riphah';

-- ── Iqra University — 5 campuses ─────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (Main)',     'karachi',      'Karachi'     from universities where slug = 'iqra-university';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (Gulshan)',  'karachi-gulshan','Karachi'   from universities where slug = 'iqra-university';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (North)',    'karachi-north','Karachi'     from universities where slug = 'iqra-university';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',          'islamabad',    'Islamabad'   from universities where slug = 'iqra-university';
insert into branches (university_id, name, slug, city) select id, 'Hyderabad Campus',          'hyderabad',    'Hyderabad'   from universities where slug = 'iqra-university';

-- ── Hamdard University — 2 campuses ──────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus (Main)',     'karachi',      'Karachi'     from universities where slug = 'hamdard-university';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',          'islamabad',    'Islamabad'   from universities where slug = 'hamdard-university';

-- ── University of Gujrat — 3 campuses ────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Gujrat Campus (Main)',      'gujrat-main',  'Gujrat'      from universities where slug = 'university-of-gujrat';
insert into branches (university_id, name, slug, city) select id, 'Hafizabad Campus',          'hafizabad',    'Hafizabad'   from universities where slug = 'university-of-gujrat';
insert into branches (university_id, name, slug, city) select id, 'Sialkot Campus',            'sialkot',      'Sialkot'     from universities where slug = 'university-of-gujrat';

-- ── MUET — 3 campuses ────────────────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Jamshoro Campus (Main)',    'jamshoro',     'Jamshoro'    from universities where slug = 'muet';
insert into branches (university_id, name, slug, city) select id, 'Khairpur Campus',           'khairpur',     'Khairpur'    from universities where slug = 'muet';
insert into branches (university_id, name, slug, city) select id, 'Mirpurkhas Campus',         'mirpurkhas',   'Mirpurkhas'  from universities where slug = 'muet';

-- ── ISRA University — 2 campuses ─────────────────────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Hyderabad Campus (Main)',   'hyderabad',    'Hyderabad'   from universities where slug = 'isra-university';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',          'islamabad',    'Islamabad'   from universities where slug = 'isra-university';

-- ── Islamia University Bahawalpur — 2 campuses ───────────────────────────────
insert into branches (university_id, name, slug, city) select id, 'Bahawalpur Campus (Main)',  'bahawalpur',   'Bahawalpur'  from universities where slug = 'iub';
insert into branches (university_id, name, slug, city) select id, 'Rahim Yar Khan Campus',     'ryk',          'Rahim Yar Khan' from universities where slug = 'iub';

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
