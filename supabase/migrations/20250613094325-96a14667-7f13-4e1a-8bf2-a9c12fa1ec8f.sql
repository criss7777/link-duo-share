
-- First, let's examine the current shared_links table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'shared_links' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any constraints on the shared_links table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'shared_links' 
    AND tc.table_schema = 'public';

-- Look at the exact table definition including constraints
SELECT pg_get_constraintdef(oid) as constraint_definition, conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'public.shared_links'::regclass;

-- Check if there are any existing records and their receiver values
SELECT receiver, sender, url, created_at 
FROM public.shared_links 
LIMIT 5;

-- Check the exact data types for sender and receiver columns
SELECT 
    attname as column_name,
    format_type(atttypid, atttypmod) as data_type,
    attnotnull as not_null
FROM pg_attribute 
WHERE attrelid = 'public.shared_links'::regclass 
    AND attnum > 0 
    AND NOT attisdropped
    AND attname IN ('sender', 'receiver');
