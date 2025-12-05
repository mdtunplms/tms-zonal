-- ==================== TABLES ====================

-- 1. Districts
CREATE TABLE districts (
  district_id INT AUTO_INCREMENT PRIMARY KEY,
  district_name VARCHAR(100) UNIQUE NOT NULL
);

-- 2. Zones
CREATE TABLE zones (
  zone_id INT AUTO_INCREMENT PRIMARY KEY,
  district_id INT NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  FOREIGN KEY (district_id) REFERENCES districts(district_id) ON DELETE CASCADE
);

-- 3. Schools
CREATE TABLE schools (
  school_id INT AUTO_INCREMENT PRIMARY KEY,
  school_code VARCHAR(20) UNIQUE NOT NULL,
  school_name VARCHAR(255) NOT NULL,
  zone_id INT NOT NULL,
  address VARCHAR(255),
  school_type ENUM('Primary','Secondary','National','Provincial'),
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id) ON DELETE CASCADE
);

-- 4. Subjects
CREATE TABLE subjects (
  subject_id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100) UNIQUE NOT NULL
);

-- 5. Teachers
CREATE TABLE teachers (
  teacher_id INT AUTO_INCREMENT PRIMARY KEY,
  nic VARCHAR(12) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender ENUM('Male','Female','Other'),
  dob DATE,
  appointment_date DATE,
  designation VARCHAR(100),
  mobile VARCHAR(15),
  email VARCHAR(100),
  appointed_subject_id INT NOT NULL,
  current_school_id INT NOT NULL,
  FOREIGN KEY (appointed_subject_id) REFERENCES subjects(subject_id) ON DELETE RESTRICT,
  FOREIGN KEY (current_school_id) REFERENCES schools(school_id) ON DELETE RESTRICT
);

-- 6. Roles
CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL  -- Admin, ZonalOfficer, Principal
);

-- 7. Users
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  teacher_id INT NULL,
  school_id INT NULL,
  zone_id INT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
  FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE SET NULL,
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id) ON DELETE SET NULL
);

-- 8. Transfer History
CREATE TABLE transfer_history (
  transfer_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  from_school_id INT NOT NULL,
  to_school_id INT NOT NULL,
  transfer_date DATE NOT NULL,
  approved_by INT,  -- zonal officer user_id
  remarks TEXT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  FOREIGN KEY (from_school_id) REFERENCES schools(school_id) ON DELETE RESTRICT,
  FOREIGN KEY (to_school_id) REFERENCES schools(school_id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ==================== INITIAL DATA ====================

-- Roles
INSERT INTO roles (role_name) VALUES 
('Admin'),
('ZonalOfficer'),
('Principal');

-- Districts
INSERT INTO districts (district_name) VALUES 
('Colombo'),
('Gampaha'),
('Kalutara'),
('Kandy'),
('Galle');

-- Zones
INSERT INTO zones (district_id, zone_name) VALUES 
(1, 'Colombo North'),
(1, 'Colombo South'),
(2, 'Gampaha'),
(2, 'Negombo'),
(3, 'Kalutara'),
(4, 'Kandy Central'),
(5, 'Galle');

-- Subjects
INSERT INTO subjects (subject_name) VALUES 
('Mathematics'),
('Science'),
('English'),
('Sinhala'),
('Tamil'),
('History'),
('Geography'),
('Commerce'),
('Art'),
('Music'),
('Physical Education'),
('ICT');

-- Schools
INSERT INTO schools (school_code, school_name, zone_id, address, school_type) VALUES 
('COL001', 'Royal College', 1, 'Colombo 7', 'National'),
('COL002', 'Ananda College', 1, 'Colombo 10', 'National'),
('GAM001', 'Maliyadeva College', 3, 'Gampaha', 'Provincial'),
('NEG001', 'Maris Stella College', 4, 'Negombo', 'Provincial'),
('KAL001', 'Richmond College', 5, 'Kalutara', 'Provincial'),
('KAN001', 'Trinity College', 6, 'Kandy', 'National'),
('GAL001', 'Richmond College', 7, 'Galle', 'Provincial');

-- Sample Users (passwords hashed using bcrypt, example hash for "admin123" and "principal123")
INSERT INTO users (username, password, role_id, teacher_id, school_id, zone_id) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEaF3R2tncUHT1hbTrELc8I7zS5e', 1, NULL, NULL, NULL),
('principal_royal', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36fvLC0/dcOg8E/klrGg5eW', 3, NULL, 1, NULL);


