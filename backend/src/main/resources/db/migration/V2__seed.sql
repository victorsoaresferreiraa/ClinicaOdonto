-- Usuários do sistema
-- Senha admin123  → hash BCrypt
INSERT INTO users (name, email, password_hash, role) VALUES
('Administrador', 'admin@lumayodontologia.com.br',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN6XJar/Pkq', 'ADMIN'),
('Dra. Laís Ferrari', 'dra.lais@lumayodontologia.com.br',
 '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'DENTIST');

-- Pacientes de exemplo
INSERT INTO patients (name, cpf, email, phone, birth_date, medical_notes) VALUES
('Ana Carolina Mendes',  '529.982.247-25', 'ana@email.com',   '11987654321', '1985-03-15', 'Alergia à penicilina'),
('Bruno Santos Silva',   '647.186.305-00', 'bruno@email.com', '11976543210', '1990-07-22', NULL),
('Carla Souza Lima',     '081.621.460-08', 'carla@email.com', '11965432109', '1978-11-30', 'Diabetes tipo 2'),
('Diego Ferreira Costa', '765.432.180-04', 'diego@email.com', '11954321098', '1995-01-10', NULL);

-- Agendamentos futuros
INSERT INTO appointments (patient_id, start_date_time, end_date_time, procedure_name, status)
SELECT id, NOW()+INTERVAL '2 days'+INTERVAL '9 hours', NOW()+INTERVAL '2 days'+INTERVAL '10 hours', 'Limpeza dental', 'SCHEDULED'
FROM patients WHERE cpf='529.982.247-25';

INSERT INTO appointments (patient_id, start_date_time, end_date_time, procedure_name, status)
SELECT id, NOW()+INTERVAL '3 days'+INTERVAL '14 hours', NOW()+INTERVAL '3 days'+INTERVAL '15 hours', 'Clareamento dental', 'CONFIRMED'
FROM patients WHERE cpf='647.186.305-00';

-- Pagamentos de exemplo
INSERT INTO payments (patient_id, description, amount, payment_method, status, due_date, paid_at)
SELECT id, 'Limpeza dental', 180.00, 'PIX', 'PAID', CURRENT_DATE-10, CURRENT_DATE-10
FROM patients WHERE cpf='529.982.247-25';

INSERT INTO payments (patient_id, description, amount, payment_method, status, due_date)
SELECT id, 'Clareamento dental', 650.00, 'CARTAO_CREDITO', 'PENDING', CURRENT_DATE+5
FROM patients WHERE cpf='647.186.305-00';

INSERT INTO payments (patient_id, description, amount, payment_method, status, due_date)
SELECT id, 'Consulta de avaliação', 120.00, 'DINHEIRO', 'PENDING', CURRENT_DATE-3
FROM patients WHERE cpf='081.621.460-08';
