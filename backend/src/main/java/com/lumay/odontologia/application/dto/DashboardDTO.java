package com.lumay.odontologia.application.dto;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DashboardDTO {
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private KpiCards kpiCards;
        private List<TodayAppointment> todayAppointments;
        private List<UpcomingAppointment> upcomingAppointments;
        private List<PendingPayment> pendingPayments;
        private List<MonthlyRevenue> monthlyRevenue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class KpiCards {
        private long appointmentsToday; private long totalActivePatients;
        private long newPatientsThisMonth; private BigDecimal revenueThisMonth;
        private BigDecimal pendingPaymentsTotal; private long cancellationsThisMonth;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TodayAppointment {
        private Long id; private String patientName; private String procedure;
        private String startTime; private String endTime; private String status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpcomingAppointment {
        private Long id; private String patientName; private String procedure;
        @JsonFormat(pattern="yyyy-MM-dd") private LocalDate date;
        private String startTime; private String status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PendingPayment {
        private Long id; private String patientName; private String description;
        private BigDecimal amount;
        @JsonFormat(pattern="yyyy-MM-dd") private LocalDate dueDate;
        private boolean overdue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyRevenue {
        private String monthLabel; private BigDecimal revenue;
    }
}
