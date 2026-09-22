-- Initial schema: managed properties, rental applications, admin accounts.

CREATE TABLE IF NOT EXISTS properties (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  -- Used in the public URL: /apply/<slug>
  slug               VARCHAR(120)  NOT NULL,
  address_line1      VARCHAR(200)  NOT NULL,
  address_line2      VARCHAR(200)  NULL,
  city               VARCHAR(100)  NOT NULL,
  region             VARCHAR(60)   NOT NULL,
  postal             VARCHAR(20)   NOT NULL,
  -- Money is stored in cents. Floats cannot represent 1234.95 exactly, and
  -- rent arithmetic that is a hundredth out is worse than useless.
  monthly_rent_cents INT UNSIGNED  NOT NULL,
  deposit_cents      INT UNSIGNED  NULL,
  bedrooms           DECIMAL(3,1)  NULL,
  bathrooms          DECIMAL(3,1)  NULL,
  available_from     DATE          NULL,
  description        TEXT          NULL,
  -- Inactive properties keep their applications but stop accepting new ones.
  is_active          TINYINT(1)    NOT NULL DEFAULT 1,
  created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_properties_slug (slug),
  KEY ix_properties_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(200) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  -- scrypt, formatted as scrypt$N$r$p$salt$hash. See src/lib/crypto.ts.
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME     NULL,
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  -- SHA-256 of the cookie token. Storing the hash rather than the token means
  -- a leaked database dump cannot be replayed as a live session.
  token_hash CHAR(64)     NOT NULL PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_agent VARCHAR(255) NULL,
  ip         VARCHAR(45)  NULL,
  KEY ix_admin_sessions_user (user_id),
  KEY ix_admin_sessions_expiry (expires_at),
  CONSTRAINT fk_admin_sessions_user FOREIGN KEY (user_id)
    REFERENCES admin_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  property_id INT UNSIGNED NOT NULL,

  -- Terms are snapshotted at submission. Rent changes and properties get
  -- renamed; an application must always show what the applicant agreed to.
  property_slug      VARCHAR(120) NOT NULL,
  property_address   VARCHAR(400) NOT NULL,
  monthly_rent_cents INT UNSIGNED NOT NULL,

  -- Applicant
  full_name        VARCHAR(160) NOT NULL,
  email            VARCHAR(200) NOT NULL,
  phone            VARCHAR(40)  NOT NULL,
  date_of_birth    DATE         NULL,
  -- AES-256-GCM, keyed by APP_ENCRYPTION_KEY, never selected by default.
  ssn_encrypted    VARBINARY(255) NULL,
  drivers_license  VARCHAR(60)  NULL,
  license_state    VARCHAR(40)  NULL,

  desired_move_in  DATE         NULL,

  -- Residence history
  current_address     VARCHAR(300) NULL,
  current_landlord    VARCHAR(160) NULL,
  current_landlord_phone VARCHAR(40) NULL,
  current_rent_cents  INT UNSIGNED NULL,
  current_move_in     DATE         NULL,
  reason_for_leaving  VARCHAR(500) NULL,
  previous_address    VARCHAR(300) NULL,
  previous_landlord   VARCHAR(160) NULL,
  previous_landlord_phone VARCHAR(40) NULL,

  -- Employment and income
  employer         VARCHAR(160) NULL,
  job_title        VARCHAR(120) NULL,
  employer_phone   VARCHAR(40)  NULL,
  employed_since   DATE         NULL,
  monthly_income_cents INT UNSIGNED NULL,
  other_income     VARCHAR(300) NULL,

  -- Repeating groups. JSON rather than four more tables: they are only ever
  -- read back with the application they belong to, never queried across.
  occupants        JSON NULL,
  pets             JSON NULL,
  vehicles         JSON NULL,
  ref_contacts     JSON NULL,

  emergency_name   VARCHAR(160) NULL,
  emergency_phone  VARCHAR(40)  NULL,
  emergency_relation VARCHAR(80) NULL,

  -- Disclosures
  has_been_evicted    TINYINT(1) NULL,
  has_filed_bankruptcy TINYINT(1) NULL,
  has_felony          TINYINT(1) NULL,
  is_smoker           TINYINT(1) NULL,
  disclosure_notes    TEXT NULL,

  -- Consent
  signature_name   VARCHAR(160) NOT NULL,
  signed_at        DATETIME     NOT NULL,
  consent_screening TINYINT(1)  NOT NULL DEFAULT 0,

  status       ENUM('new','reviewing','approved','declined','withdrawn')
               NOT NULL DEFAULT 'new',
  admin_notes  TEXT NULL,
  -- Whether the notification email left successfully. A false here with a row
  -- present means the application was captured but nobody was told.
  email_sent   TINYINT(1) NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip           VARCHAR(45) NULL,

  KEY ix_applications_property (property_id),
  KEY ix_applications_status (status),
  KEY ix_applications_submitted (submitted_at),
  CONSTRAINT fk_applications_property FOREIGN KEY (property_id)
    REFERENCES properties (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
