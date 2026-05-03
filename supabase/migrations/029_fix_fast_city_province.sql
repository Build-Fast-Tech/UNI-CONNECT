-- Fix FAST university: headquarters is Islamabad, not Lahore/Punjab
UPDATE universities
SET city = 'Islamabad', province = 'Islamabad'
WHERE slug = 'fast';
