-- Initial schema: managed properties, rental applications, admin accounts.
--
-- The applications table mirrors the paper form (Application-Warden-2018):
-- two applicants, three prior addresses, present and previous employment for
-- each applicant, occupants, vehicles, disclosures and two signatures.
--
-- Repeating groups are JSON rather than child tables. They are only ever read
-- back with the application they belong to and never queried across, so four
-- extra tables would buy nothing but joins.

CREATE TABLE IF NOT EXISTS properties (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  -- Used in the public URL: /apply/<slug>
  slug               VARCHAR(120)  NOT NULL,
  address_line1      VARCHAR(200)  NOT NULL,
  address_line2      VARCHAR(200)  NULL,
  city               VARCHAR(100)  NOT NULL,
  region             VARCHAR(60)   NOT NULL,
  postal             VARCHAR(20)   NOT NULL,

  -- Money is stored in cents. Floats cannot represent 2550.00 exactly, and
  -- rent arithmetic that is a hundredth out is worse than useless.
  monthly_rent_cents     INT UNSIGNED NOT NULL,
  deposit_cents          INT UNSIGNED NULL,
  credit_check_fee_cents INT UNSIGNED NULL,
  other_charges_cents    INT UNSIGNED NULL,
  other_charges_label    VARCHAR(120) NULL,
  -- Per applicant, non-refundable. California caps this (Civ. Code 1950.6)
  -- and the cap is CPI-adjusted annually, so it is configurable per property.
  screening_fee_cents    INT UNSIGNED NOT NULL DEFAULT 3000,

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

  -- "THIS SECTION TO BE COMPLETED BY LANDLORD" on the paper form, snapshotted
  -- at submission. Rent and fees change; an application must always show the
  -- terms the applicant actually saw and agreed to.
  property_slug          VARCHAR(120) NOT NULL,
  property_address       VARCHAR(400) NOT NULL,
  monthly_rent_cents     INT UNSIGNED NOT NULL,
  deposit_cents          INT UNSIGNED NULL,
  credit_check_fee_cents INT UNSIGNED NULL,
  other_charges_cents    INT UNSIGNED NULL,
  other_charges_label    VARCHAR(120) NULL,
  total_due_cents        INT UNSIGNED NULL,
  screening_fee_cents    INT UNSIGNED NULL,

  rental_term ENUM('month_to_month','lease') NOT NULL DEFAULT 'month_to_month',
  lease_from  DATE NULL,
  lease_to    DATE NULL,

  -- Applicant #1, duplicated out of the JSON so the admin list can show and
  -- sort by a name without unpacking every row.
  applicant_name  VARCHAR(200) NOT NULL,
  applicant_email VARCHAR(200) NOT NULL,
  applicant_phone VARCHAR(40)  NULL,

  -- [{ last, first, middle, other_names, other_id, dob, work_phone,
  --    home_phone, email, dl_number, dl_expiration, dl_state }]
  -- One or two entries. SSNs are NOT in here — see ssns_encrypted.
  applicants JSON NOT NULL,

  -- AES-256-GCM over a JSON array of the applicants' SSNs, keyed by
  -- APP_ENCRYPTION_KEY which lives outside the database. Kept apart from the
  -- applicants blob so the rest of an application stays readable in a query.
  ssns_encrypted VARBINARY(1024) NULL,

  -- Three entries: present, previous, next previous.
  -- [{ address, city, state, zip, date_in, date_out, manager_name,
  --    manager_phone, reason_for_moving }]
  rental_history JSON NULL,

  -- Present and last position for each applicant, up to four entries.
  -- [{ applicant, which, occupation, employer_name, employer_address,
  --    employer_city_state_zip, supervisor_name, supervisor_phone, how_long }]
  employment JSON NULL,

  -- { applicant1_cents, applicant2_cents, other_cents, other_source,
  --   total_cents }
  income JSON NULL,

  -- [{ name, relationship, age }]
  occupants      JSON NULL,
  total_adults   TINYINT UNSIGNED NULL,
  total_children TINYINT UNSIGNED NULL,

  -- [{ make, model, year, state_plate }]
  vehicles       JSON NULL,
  other_vehicles VARCHAR(400) NULL,

  has_pets                  TINYINT(1) NULL,
  pets_describe             VARCHAR(400) NULL,
  has_liquid_furniture      TINYINT(1) NULL,
  liquid_furniture_describe VARCHAR(400) NULL,

  -- The three questions the paper form asks, verbatim in intent.
  ever_evicted         TINYINT(1) NULL,
  ever_bankruptcy      TINYINT(1) NULL,
  ever_drug_conviction TINYINT(1) NULL,

  -- Consent. The certification wording is reproduced on the form itself; what
  -- is recorded here is that it was agreed to, by whom, and when.
  signature_1       VARCHAR(200) NOT NULL,
  signed_1_at       DATETIME     NOT NULL,
  signature_2       VARCHAR(200) NULL,
  signed_2_at       DATETIME     NULL,
  certification_ack TINYINT(1)   NOT NULL DEFAULT 0,
  screening_fee_ack TINYINT(1)   NOT NULL DEFAULT 0,

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
