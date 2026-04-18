-- UniConnect Seed Data
-- Run AFTER 001_initial_schema.sql (safe to re-run)

-- Clear existing seed data (branches cascade from universities)
truncate table subjects  restart identity cascade;
truncate table universities restart identity cascade;

-- ─── Universities ─────────────────────────────────────────────────────────────
insert into universities (name, short_name, slug, city, province, website, founding_year, total_students, is_featured) values
  ('National University of Sciences and Technology',           'NUST',    'nust',               'Islamabad', 'Islamabad',   'https://nust.edu.pk',       1991, 15000, true),
  ('Lahore University of Management Sciences',                 'LUMS',    'lums',               'Lahore',    'Punjab',      'https://lums.edu.pk',       1985, 5000,  true),
  ('FAST National University of Computer & Emerging Sciences', 'FAST',    'fast',               'Lahore',    'Punjab',      'https://nu.edu.pk',         2000, 20000, true),
  ('COMSATS University Islamabad',                             'COMSATS', 'comsats',            'Islamabad', 'Islamabad',   'https://comsats.edu.pk',    1998, 30000, true),
  ('University of Engineering and Technology Lahore',          'UET',     'uet',                'Lahore',    'Punjab',      'https://uet.edu.pk',        1921, 10000, true),
  ('Institute of Business Administration',                     'IBA',     'iba',                'Karachi',   'Sindh',       'https://iba.edu.pk',        1955, 4000,  true),
  ('Ghulam Ishaq Khan Institute',                              'GIKI',    'giki',               'Topi',      'KPK',         'https://giki.edu.pk',       1993, 3000,  true),
  ('Air University',                                           'AU',      'air-university',     'Islamabad', 'Islamabad',   'https://au.edu.pk',         2002, 8000,  true),
  ('Bahria University',                                        'BU',      'bahria-university',  'Islamabad', 'Islamabad',   'https://bahria.edu.pk',     2000, 12000, true),
  ('NED University of Engineering and Technology',             'NED',     'ned',                'Karachi',   'Sindh',       'https://neduet.edu.pk',     1921, 8000,  true),
  ('University of the Punjab',                                 'PU',      'punjab-university',  'Lahore',    'Punjab',      'https://pu.edu.pk',         1882, 40000, true),
  ('Quaid-i-Azam University',                                  'QAU',     'qau',                'Islamabad', 'Islamabad',   'https://qau.edu.pk',        1967, 15000, true),
  ('SZABIST University',                                       'SZABIST', 'szabist',            'Karachi',   'Sindh',       'https://szabist.edu.pk',    1995, 6000,  false),
  ('Institute of Space Technology',                            'IST',     'ist',                'Islamabad', 'Islamabad',   'https://ist.edu.pk',        2002, 3000,  false),
  ('Habib University',                                         'HU',      'habib-university',   'Karachi',   'Sindh',       'https://habib.edu.pk',      2014, 1500,  false),
  ('University of Central Punjab',                             'UCP',     'ucp',                'Lahore',    'Punjab',      'https://ucp.edu.pk',        2002, 15000, false),
  ('University of Lahore',                                     'UOL',     'university-of-lahore','Lahore',   'Punjab',      'https://uol.edu.pk',        1999, 20000, false),
  ('Karachi University',                                       'KU',      'karachi-university', 'Karachi',   'Sindh',       'https://uok.edu.pk',        1951, 24000, false),
  ('University of Peshawar',                                   'UOP',     'peshawar-university','Peshawar',  'KPK',         'https://uop.edu.pk',        1950, 12000, false),
  ('University of Balochistan',                                'UOB',     'balochistan-university','Quetta', 'Balochistan', 'https://uob.edu.pk',        1970, 8000,  false),
  ('Mehran University of Engineering & Technology',            'MUET',    'muet',               'Jamshoro',  'Sindh',       'https://muet.edu.pk',       1963, 7000,  false),
  ('University of Agriculture Faisalabad',                     'UAF',     'uaf',                'Faisalabad','Punjab',      'https://uaf.edu.pk',        1909, 15000, false),
  ('Government College University Lahore',                     'GCU',     'gcu-lahore',         'Lahore',    'Punjab',      'https://gcu.edu.pk',        1864, 10000, false),
  ('Forman Christian College University',                      'FCCU',    'fccu',               'Lahore',    'Punjab',      'https://fccollege.edu.pk',  1864, 4000,  false),
  ('University of Management and Technology',                  'UMT',     'umt',                'Lahore',    'Punjab',      'https://umt.edu.pk',        1990, 10000, false);

-- ─── Branches ─────────────────────────────────────────────────────────────────
-- NUST
insert into branches (university_id, name, slug, city) select id, 'H-12 Campus (Main)', 'h12-main', 'Islamabad' from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'SEECS',              'seecs',    'Islamabad' from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'NSBE',               'nsbe',     'Islamabad' from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'NICE',               'nice',     'Islamabad' from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'SMME',               'smme',     'Islamabad' from universities where slug = 'nust';
insert into branches (university_id, name, slug, city) select id, 'RIMMS',              'rimms',    'Islamabad' from universities where slug = 'nust';

-- FAST
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',           'lahore',     'Lahore'     from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',        'islamabad',  'Islamabad'  from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',          'karachi',    'Karachi'    from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Peshawar Campus',         'peshawar',   'Peshawar'   from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',       'faisalabad', 'Faisalabad' from universities where slug = 'fast';
insert into branches (university_id, name, slug, city) select id, 'Chiniot-Faisalabad Campus','cf-campus', 'Chiniot'    from universities where slug = 'fast';

-- COMSATS
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus',  'islamabad',  'Islamabad'  from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',     'lahore',     'Lahore'     from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Wah Campus',        'wah',        'Wah Cantt'  from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Abbottabad Campus', 'abbottabad', 'Abbottabad' from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Sahiwal Campus',    'sahiwal',    'Sahiwal'    from universities where slug = 'comsats';
insert into branches (university_id, name, slug, city) select id, 'Vehari Campus',     'vehari',     'Vehari'     from universities where slug = 'comsats';

-- Bahria
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus', 'islamabad', 'Islamabad' from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',   'karachi',   'Karachi'   from universities where slug = 'bahria-university';
insert into branches (university_id, name, slug, city) select id, 'Lahore Campus',    'lahore',    'Lahore'    from universities where slug = 'bahria-university';

-- SZABIST
insert into branches (university_id, name, slug, city) select id, 'Karachi Campus',   'karachi',   'Karachi'   from universities where slug = 'szabist';
insert into branches (university_id, name, slug, city) select id, 'Islamabad Campus', 'islamabad', 'Islamabad' from universities where slug = 'szabist';
insert into branches (university_id, name, slug, city) select id, 'Larkana Campus',   'larkana',   'Larkana'   from universities where slug = 'szabist';

-- UET
insert into branches (university_id, name, slug, city) select id, 'Main Campus Lahore',  'lahore',    'Lahore'  from universities where slug = 'uet';
insert into branches (university_id, name, slug, city) select id, 'Faisalabad Campus',   'faisalabad','Faisalabad' from universities where slug = 'uet';
insert into branches (university_id, name, slug, city) select id, 'Gujranwala Campus',   'gujranwala','Gujranwala'  from universities where slug = 'uet';
insert into branches (university_id, name, slug, city) select id, 'Taxila Campus',       'taxila',    'Taxila'   from universities where slug = 'uet';

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
  ('Calculus I',                         'Mathematics'),
  ('Calculus II',                        'Mathematics'),
  ('Linear Algebra',                     'Mathematics'),
  ('Discrete Mathematics',               'Mathematics'),
  ('Probability & Statistics',           'Mathematics'),
  ('Numerical Methods',                  'Mathematics'),
  ('Circuit Analysis',                   'Electrical Engineering'),
  ('Digital Logic Design',               'Electrical Engineering'),
  ('Signals & Systems',                  'Electrical Engineering'),
  ('Electromagnetic Theory',             'Electrical Engineering'),
  ('Control Systems',                    'Electrical Engineering'),
  ('Power Systems',                      'Electrical Engineering'),
  ('Microprocessors & Microcontrollers', 'Electrical Engineering'),
  ('Mechanics of Materials',             'Mechanical Engineering'),
  ('Thermodynamics',                     'Mechanical Engineering'),
  ('Fluid Mechanics',                    'Mechanical Engineering'),
  ('Engineering Drawing',                'Engineering'),
  ('Pakistan Studies',                   'General'),
  ('Islamic Studies',                    'General'),
  ('English Composition',                'General'),
  ('Technical Writing',                  'General'),
  ('Financial Accounting',               'Business'),
  ('Principles of Management',           'Business'),
  ('Marketing Management',               'Business'),
  ('Microeconomics',                     'Economics'),
  ('Macroeconomics',                     'Economics');
