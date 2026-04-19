CREATE SEQUENCE IF NOT EXISTS patients_id_seq     START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS appointments_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS payments_id_seq     START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS users_id_seq        START 1 INCREMENT 1;

CREATE TABLE patients (
    id            BIGINT PRIMARY KEY DEFAULT nextval('patients_id_seq'),
    name          VARCHAR(255) NOT NULL,
    cpf           VARCHAR(14)  NOT NULL UNIQUE,
    email         VARCHAR(255),
    phone         VARCHAR(20),
    birth_date    DATE,
    medical_notes TEXT,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_patients_cpf    ON patients(cpf);
CREATE INDEX idx_patients_active ON patients(active);

CREATE TABLE appointments (
    id                BIGINT PRIMARY KEY DEFAULT nextval('appointments_id_seq'),
    patient_id        BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    start_date_time   TIMESTAMP NOT NULL,
    end_date_time     TIMESTAMP NOT NULL,
    procedure_name    VARCHAR(255) NOT NULL,
    notes             TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_appt_dates CHECK (end_date_time > start_date_time)
);
CREATE INDEX idx_appt_patient ON appointments(patient_id);
CREATE INDEX idx_appt_start   ON appointments(start_date_time);

CREATE TABLE payments (
    id             BIGINT PRIMARY KEY DEFAULT nextval('payments_id_seq'),
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id     BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    description    VARCHAR(255),
    amount         NUMERIC(10,2) NOT NULL,
    discount       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30),
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date       DATE NOT NULL,
    paid_at        DATE,
    notes          VARCHAR(500),
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_pay_amount   CHECK (amount > 0),
    CONSTRAINT chk_pay_discount CHECK (discount <= amount)
);
CREATE INDEX idx_pay_patient ON payments(patient_id);
CREATE INDEX idx_pay_status  ON payments(status);

CREATE TABLE users (
    id            BIGINT PRIMARY KEY DEFAULT nextval('users_id_seq'),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'RECEPTIONIST',
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
