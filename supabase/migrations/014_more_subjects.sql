-- Add common CS/engineering subjects + abbreviated aliases so the upload page
-- dropdown covers what students actually write (DLD, DS, ML, OOP, etc.).

insert into subjects (name, faculty) values
  ('Applied Physics',                       'Physics'),
  ('Physics',                               'Physics'),
  ('Programming Fundamentals',              'Computer Science'),
  ('Data Structures',                       'Computer Science'),
  ('Digital Logic Design (DLD)',            'Electrical Engineering'),
  ('Discrete Structures',                   'Mathematics'),
  ('Machine Learning (ML)',                 'Computer Science'),
  ('Deep Learning',                         'Computer Science'),
  ('Data Science',                          'Computer Science'),
  ('Computer Organization & Assembly',      'Computer Science'),
  ('Parallel & Distributed Computing',      'Computer Science'),
  ('Information Security',                  'Computer Science'),
  ('Computer Graphics',                     'Computer Science'),
  ('Software Project Management',           'Computer Science'),
  ('Natural Language Processing',           'Computer Science'),
  ('Introduction to Computing',             'Computer Science'),
  ('Multivariable Calculus',                'Mathematics')
on conflict (name) do nothing;
