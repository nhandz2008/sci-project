-- Competition Population SQL Script (Fixed)
-- This script inserts 15 dummy competitions into the database
-- Run this script after the database is initialized and migrations are applied

-- First, ensure we have an admin user (if not exists)
INSERT INTO "user" (id, email, full_name, role, hashed_password, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@sci.com',
    'Admin User',
    'ADMIN',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: admin123
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Get the admin user ID for competition ownership
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM "user" WHERE email = 'admin@sci.com';
    
    -- Insert competitions
    INSERT INTO competition (
        id, title, description, competition_link, image_url, location, 
        format, scale, registration_deadline, target_age_min, target_age_max, 
        is_active, is_featured, owner_id, created_at, updated_at
    ) VALUES
    (
        gen_random_uuid(),
        'International Science Olympiad 2024',
        'A prestigious international competition for high school students in physics, chemistry, biology, and mathematics.',
        'https://example.com/iso2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c1.jpg',
        'Singapore',
        'OFFLINE',
        'INTERNATIONAL',
        '2024-03-15 23:59:59',
        15,
        19,
        true,
        true,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'National Robotics Challenge',
        'Design and build autonomous robots to solve real-world problems in this exciting competition.',
        'https://example.com/nrc2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c2.jpg',
        'San Francisco, CA',
        'HYBRID',
        'REGIONAL',
        '2024-04-20 23:59:59',
        12,
        18,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Young Scientists Discovery Fair',
        'Showcase innovative research projects and compete for scholarships and recognition.',
        'https://example.com/ysdf2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c3.jpg',
        'Boston, MA',
        'OFFLINE',
        'REGIONAL',
        '2024-05-10 23:59:59',
        14,
        20,
        true,
        true,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Global Environmental Science Competition',
        'Address climate change and environmental challenges through innovative scientific solutions.',
        'https://example.com/gesc2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c4.jpg',
        'Virtual',
        'ONLINE',
        'INTERNATIONAL',
        '2024-06-30 23:59:59',
        16,
        22,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Mathematics Modeling Challenge',
        'Apply mathematical concepts to solve complex real-world problems in teams.',
        'https://example.com/mmc2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c5.jpg',
        'Chicago, IL',
        'HYBRID',
        'REGIONAL',
        '2024-07-15 23:59:59',
        15,
        21,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Computer Science Innovation Hackathon',
        '24-hour coding challenge to develop innovative software solutions for social impact.',
        'https://example.com/csih2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c6.jpg',
        'Austin, TX',
        'OFFLINE',
        'REGIONAL',
        '2024-08-05 23:59:59',
        13,
        19,
        true,
        true,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Chemistry Lab Skills Competition',
        'Demonstrate laboratory techniques and chemical knowledge in a hands-on competition.',
        'https://example.com/clsc2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c7.jpg',
        'Philadelphia, PA',
        'OFFLINE',
        'PROVINCIAL',
        '2024-09-20 23:59:59',
        14,
        18,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Astronomy and Astrophysics Symposium',
        'Present research on celestial objects and compete for telescope time and research opportunities.',
        'https://example.com/aas2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c8.jpg',
        'Flagstaff, AZ',
        'HYBRID',
        'INTERNATIONAL',
        '2024-10-10 23:59:59',
        16,
        25,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Biotechnology Innovation Challenge',
        'Design genetic engineering solutions for healthcare and agriculture applications.',
        'https://example.com/bic2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c9.jpg',
        'San Diego, CA',
        'OFFLINE',
        'REGIONAL',
        '2024-11-15 23:59:59',
        15,
        22,
        true,
        true,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Physics Problem Solving Contest',
        'Solve complex physics problems using theoretical and experimental approaches.',
        'https://example.com/ppsc2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c10.jpg',
        'Cambridge, MA',
        'ONLINE',
        'INTERNATIONAL',
        '2024-12-01 23:59:59',
        14,
        20,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Engineering Design Challenge',
        'Build sustainable engineering solutions for urban development and infrastructure.',
        'https://example.com/edc2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c11.jpg',
        'Seattle, WA',
        'HYBRID',
        'REGIONAL',
        '2025-01-15 23:59:59',
        16,
        23,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Data Science Analytics Competition',
        'Analyze large datasets to extract insights and create predictive models.',
        'https://example.com/dsac2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c12.jpg',
        'Virtual',
        'ONLINE',
        'INTERNATIONAL',
        '2025-02-28 23:59:59',
        15,
        24,
        true,
        true,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Neuroscience Research Symposium',
        'Present cutting-edge research on brain function and neurological disorders.',
        'https://example.com/nrs2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c13.jpg',
        'Baltimore, MD',
        'OFFLINE',
        'REGIONAL',
        '2025-03-10 23:59:59',
        17,
        25,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Renewable Energy Innovation Contest',
        'Design sustainable energy solutions for a cleaner future.',
        'https://example.com/reic2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c14.jpg',
        'Denver, CO',
        'HYBRID',
        'PROVINCIAL',
        '2025-04-20 23:59:59',
        14,
        21,
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Space Science and Technology Fair',
        'Explore space exploration technologies and compete for NASA internship opportunities.',
        'https://example.com/sstf2024',
        'https://sci-demoo.s3.us-east-1.amazonaws.com/competition_images/c15.jpg',
        'Houston, TX',
        'OFFLINE',
        'INTERNATIONAL',
        '2025-05-15 23:59:59',
        15,
        22,
        true,
        true,
        admin_user_id,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Successfully inserted 15 competitions with admin user ID: %', admin_user_id;
END $$;

-- Verify the insertions
SELECT 
    title, 
    format, 
    scale, 
    is_featured,
    registration_deadline
FROM competition 
ORDER BY created_at DESC 
LIMIT 15; 