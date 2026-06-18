package it.unical.progettoweb.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RentalRequestDto {
    private int postId;
    private String message;
    private LocalDate desiredStart;
    private LocalDate desiredEnd;
}