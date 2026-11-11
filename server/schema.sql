-- ==========================================================
-- منصة المصمم الذكي – جماعة أنصار السنة المحمدية بالسودان (أمانة الدعوة)
-- Database Schema for PostgreSQL
-- Domain: design.ansaralsuna.net
-- ==========================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. States (الولايات)
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Localities (المحليات)
CREATE TABLE IF NOT EXISTS localities (
    id SERIAL PRIMARY KEY,
    state_id INT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_state_locality UNIQUE (state_id, name)
);

-- 4. Sheikhs (المشايخ والدعاة)
CREATE TABLE IF NOT EXISTS sheikhs (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(150) NOT NULL,
    title VARCHAR(150), -- e.g. فضيلة الشيخ، دكتور، الشيخ
    role_description VARCHAR(255), -- المنصب أو الصفة العلمية
    calligraphy_url TEXT, -- مسار مخطوطة الاسم (PNG/SVG شفاف)
    photo_url TEXT, -- الصورة الرئيسية
    additional_photos TEXT[], -- معرض الصور الإضافية
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Mosques (المساجد والمجمعات الإسلامية)
CREATE TABLE IF NOT EXISTS mosques (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state_id INT NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
    locality_id INT NOT NULL REFERENCES localities(id) ON DELETE RESTRICT,
    area_neighborhood VARCHAR(255), -- المنطقة أو الحي
    address_details TEXT,
    main_photo_url TEXT,
    additional_photos TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Media Assets Library (أرشيف الصور والمخطوطات والخلفيات)
CREATE TABLE IF NOT EXISTS media_assets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- sheikhs, mosques, calligraphy, backgrounds, minarets, logos
    file_path TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Visual Identity (الهوية البصرية الرسمية)
CREATE TABLE IF NOT EXISTS visual_identity (
    id SERIAL PRIMARY KEY,
    group_logo_url TEXT, -- شعار جماعة أنصار السنة المحمدية
    dawah_header_text VARCHAR(255) DEFAULT 'جماعة أنصار السنة المحمدية بالسودان - أمانة الدعوة',
    dawah_header_subtext VARCHAR(255) DEFAULT 'إدارة الدعوة والإرشاد والبرامج العلمية',
    website_url VARCHAR(255) DEFAULT 'https://ansaralsuna.net',
    facebook_handle VARCHAR(255) DEFAULT 'ansaralsunasudan',
    youtube_handle VARCHAR(255) DEFAULT 'ansaralsunasudan',
    telegram_handle VARCHAR(255) DEFAULT 'ansaralsunasudan',
    contact_phone VARCHAR(100) DEFAULT '+249 912345678',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Templates Configuration (قوالب التصميم)
CREATE TABLE IF NOT EXISTS design_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    theme_colors JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0
);

-- 9. Saved Announcements & Designs (الإعلانات والتصاميم المحفوظة)
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    announcement_type VARCHAR(100) NOT NULL, -- خطبة جمعة، محاضرة كبرى، إلخ
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    sheikh_id INT REFERENCES sheikhs(id) ON DELETE SET NULL,
    secondary_sheikh_ids INT[],
    state_id INT REFERENCES states(id) ON DELETE SET NULL,
    locality_id INT REFERENCES localities(id) ON DELETE SET NULL,
    mosque_id INT REFERENCES mosques(id) ON DELETE SET NULL,
    custom_location VARCHAR(255),
    event_date DATE NOT NULL,
    event_day_name VARCHAR(50) NOT NULL,
    event_time_type VARCHAR(100) NOT NULL, -- بعد صلاة المغرب، وقت محدد، إلخ
    custom_time VARCHAR(50),
    template_id VARCHAR(100) DEFAULT 'golden-heritage',
    multi_sessions JSONB, -- For courses, programs, multiple schedules
    additional_fields JSONB, -- Extra topics, books, notes
    exported_image_path TEXT,
    created_by INT REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sheikhs_active ON sheikhs(is_active);
CREATE INDEX IF NOT EXISTS idx_mosques_state_locality ON mosques(state_id, locality_id);
CREATE INDEX IF NOT EXISTS idx_announcements_type_date ON announcements(announcement_type, event_date);
