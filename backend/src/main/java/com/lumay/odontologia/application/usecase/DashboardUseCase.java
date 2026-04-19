package com.lumay.odontologia.application.usecase;

import com.lumay.odontologia.application.dto.DashboardDTO;
import com.lumay.odontologia.domain.model.Appointment.AppointmentStatus;
import com.lumay.odontologia.domain.model.Payment.PaymentStatus;
import com.lumay.odontologia.domain.repository.*;
import com.lumay.odontologia.infrastructure.security.context.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/*
 * ================================================================
 * AULA: DASHBOARD USE CASE — DADOS DO PAINEL PRINCIPAL
 * ================================================================
 * O dashboard agora filtra todos os dados pela clínica do usuário logado.
 * Cada clínica vê suas próprias estatísticas. Nunca as da concorrência!
 * ================================================================
 */
@Service
@RequiredArgsConstructor
public class DashboardUseCase {

    private final AppointmentRepository appointmentRepo;
    private final PatientRepository     patientRepo;
    private final PaymentRepository     paymentRepo;
    private final CurrentUserService    currentUserService;

    @Transactional(readOnly = true)
    public DashboardDTO.Response getDashboard() {
        // Pega a clínica do usuário logado — TUDO é filtrado por isso
        Long clinicId = currentUserService.getCurrentClinicId();

        LocalDate today      = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd   = today.withDayOfMonth(today.lengthOfMonth());

        // Agendamentos de hoje para esta clínica
        var todayAppts = appointmentRepo.findByDateRangeAndClinicId(
                today.atStartOfDay(), today.atTime(23, 59, 59), clinicId
        );

        // Pacientes ativos desta clínica
        var allActive = patientRepo.findAllActiveByClinicId(clinicId);

        // Pagamentos pendentes desta clínica
        var pendingPayments = paymentRepo.findByStatusAndClinicId(PaymentStatus.PENDING, clinicId);

        // Novos pacientes neste mês
        long newThisMonth = allActive.stream()
                .filter(p -> p.getCreatedAt() != null
                        && !p.getCreatedAt().toLocalDate().isBefore(monthStart)
                        && !p.getCreatedAt().toLocalDate().isAfter(monthEnd))
                .count();

        // Cancelamentos neste mês
        long cancellations = appointmentRepo
                .findByDateRangeAndClinicId(monthStart.atStartOfDay(), monthEnd.atTime(23, 59, 59), clinicId)
                .stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();

        BigDecimal revenue = paymentRepo.sumPaidAmountBetween(monthStart, monthEnd, clinicId);
        BigDecimal pending = paymentRepo.sumPendingAmount(clinicId);

        // Monta a lista de consultas de hoje
        var todayList = todayAppts.stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .sorted(Comparator.comparing(a -> a.getStartDateTime()))
                .map(a -> DashboardDTO.TodayAppointment.builder()
                        .id(a.getId())
                        .patientName(patientRepo.findById(a.getPatientId()).map(p -> p.getName()).orElse(""))
                        .procedure(a.getProcedure())
                        .startTime(a.getStartDateTime().toLocalTime().toString().substring(0, 5))
                        .endTime(a.getEndDateTime().toLocalTime().toString().substring(0, 5))
                        .status(a.getStatus().name()).build())
                .toList();

        // Próximas consultas (7 dias)
        var upcoming = appointmentRepo.findByDateRangeAndClinicId(
                today.plusDays(1).atStartOfDay(), today.plusDays(7).atTime(23, 59, 59), clinicId
        ).stream()
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED || a.getStatus() == AppointmentStatus.CONFIRMED)
                .sorted(Comparator.comparing(a -> a.getStartDateTime()))
                .limit(10)
                .map(a -> DashboardDTO.UpcomingAppointment.builder()
                        .id(a.getId())
                        .patientName(patientRepo.findById(a.getPatientId()).map(p -> p.getName()).orElse(""))
                        .procedure(a.getProcedure()).date(a.getStartDateTime().toLocalDate())
                        .startTime(a.getStartDateTime().toLocalTime().toString().substring(0, 5))
                        .status(a.getStatus().name()).build())
                .toList();

        // Pagamentos pendentes para exibição
        var pendingList = pendingPayments.stream().limit(10)
                .map(p -> DashboardDTO.PendingPayment.builder()
                        .id(p.getId())
                        .patientName(patientRepo.findById(p.getPatientId()).map(pt -> pt.getName()).orElse(""))
                        .description(p.getDescription()).amount(p.getFinalAmount())
                        .dueDate(p.getDueDate()).overdue(p.getDueDate().isBefore(today)).build())
                .toList();

        // Gráfico de receita dos últimos 6 meses
        var fmt = DateTimeFormatter.ofPattern("MMM/yyyy", new Locale("pt", "BR"));
        List<DashboardDTO.MonthlyRevenue> monthly = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m   = today.minusMonths(i);
            BigDecimal rev = paymentRepo.sumPaidAmountBetween(
                    m.withDayOfMonth(1), m.withDayOfMonth(m.lengthOfMonth()), clinicId
            );
            monthly.add(DashboardDTO.MonthlyRevenue.builder()
                    .monthLabel(m.format(fmt))
                    .revenue(rev != null ? rev : BigDecimal.ZERO).build());
        }

        return DashboardDTO.Response.builder()
                .kpiCards(DashboardDTO.KpiCards.builder()
                        .appointmentsToday(todayAppts.size())
                        .totalActivePatients(allActive.size())
                        .newPatientsThisMonth(newThisMonth)
                        .revenueThisMonth(revenue != null ? revenue : BigDecimal.ZERO)
                        .pendingPaymentsTotal(pending != null ? pending : BigDecimal.ZERO)
                        .cancellationsThisMonth(cancellations).build())
                .todayAppointments(todayList)
                .upcomingAppointments(upcoming)
                .pendingPayments(pendingList)
                .monthlyRevenue(monthly).build();
    }
}
