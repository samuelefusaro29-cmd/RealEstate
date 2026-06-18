package it.unical.progettoweb.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RentalContractResponse {
    private Integer id;
    private int postId;
    private int tenantId;
    private LocalDate startDate;
    private LocalDate endDate;
    private double monthlyPrice;
    private String status;
    private LocalDateTime createdAt;
}