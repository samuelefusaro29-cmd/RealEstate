package it.unical.progettoweb.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RentalRequestResponse {
    private Integer id;
    private int postId;
    private int buyerId;
    private String message;
    private LocalDate desiredStart;
    private LocalDate desiredEnd;
    private String status;
    private LocalDateTime createdAt;
}