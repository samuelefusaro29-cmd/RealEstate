package it.unical.progettoweb.model;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class RentalContract {
    private Integer id;
    private int postId;
    private int tenantId;
    private LocalDate startDate;
    private LocalDate endDate;
    private double monthlyPrice;
    private String status; // ACTIVE | TERMINATED
    private LocalDateTime createdAt;
}