package it.unical.progettoweb.model;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class RentalRequest {
    private Integer id;
    private int postId;
    private int buyerId;
    private String message;
    private LocalDate desiredStart;
    private LocalDate desiredEnd;
    private String status; // PENDING | ACCEPTED | REJECTED
    private LocalDateTime createdAt;
}