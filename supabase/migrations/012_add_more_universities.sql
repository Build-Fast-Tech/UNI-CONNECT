-- UniConnect Migration 012: Add the remaining universities from the full 100+ list
-- Idempotent: uses ON CONFLICT (slug) DO NOTHING so it is safe to re-run
-- on any existing deployment.

insert into universities
  (name,                                                                     short_name,     slug,                      city,             province,      website,                        founding_year, total_students, is_featured)
values
  -- ── Islamabad / Federal ─────────────────────────────────────────────────
  ('National Defence University',                                            'NDU',          'ndu',                     'Islamabad',      'Islamabad',   'https://ndu.edu.pk',           1970,          2000,           false),
  ('National University of Technology',                                      'NUTECH',       'nutech',                  'Islamabad',      'Islamabad',   'https://nutech.edu.pk',        2018,          2000,           false),
  ('Preston University',                                                     'Preston',      'preston-university',      'Islamabad',      'Islamabad',   'https://preston.edu.pk',       1985,          5000,           false),

  -- ── Punjab ──────────────────────────────────────────────────────────────
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

  -- ── Sindh ───────────────────────────────────────────────────────────────
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

  -- ── Khyber Pakhtunkhwa ──────────────────────────────────────────────────
  ('Abasyn University',                                                      'Abasyn',       'abasyn',                  'Peshawar',       'KPK',         'https://abasyn.edu.pk',        2007,          8000,           false),
  ('CECOS University of Information Technology and Emerging Sciences',       'CECOS',        'cecos',                   'Peshawar',       'KPK',         'https://cecos.edu.pk',         1986,          5000,           false),
  ('City University of Science and Information Technology',                  'CUSIT',        'cusit',                   'Peshawar',       'KPK',         'https://cusit.edu.pk',         2001,          6000,           false),
  ('Gandhara University',                                                    'Gandhara',     'gandhara-university',     'Peshawar',       'KPK',         'https://gu.edu.pk',            1994,          3000,           false),
  ('Iqra National University',                                               'INU',          'inu',                     'Peshawar',       'KPK',         'https://inu.edu.pk',           2008,          5000,           false),
  ('Qurtuba University of Science and Information Technology',               'Qurtuba',      'qurtuba',                 'Peshawar',       'KPK',         'https://qurtuba.edu.pk',       2001,          4000,           false),
  ('Sarhad University of Science and Information Technology',                'SUIT',         'suit',                    'Peshawar',       'KPK',         'https://suit.edu.pk',          2003,          5000,           false),
  ('Shaheed Benazir Bhutto University Sheringal',                            'SBBU',         'sbbu-sheringal',          'Sheringal',      'KPK',         'https://sbbu.edu.pk',          2010,          3000,           false),

  -- ── Balochistan ─────────────────────────────────────────────────────────
  ('Balochistan University of Engineering and Technology',                   'BUET Khuzdar', 'buet-khuzdar',            'Khuzdar',        'Balochistan', 'https://buetk.edu.pk',         1994,          3000,           false),

  -- ── AJK ─────────────────────────────────────────────────────────────────
  ('Women University of Azad Jammu and Kashmir',                             'WUAJK',        'wuajk',                   'Bagh',           'AJK',         'https://wuajk.edu.pk',         2014,          2000,           false),

  -- ── Catch-all ───────────────────────────────────────────────────────────
  ('Other / Not Listed',                                                     'Other',        'other',                   null,             null,          null,                           null,          null,           false)

on conflict (slug) do nothing;
