package it.unical.progettoweb.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerDto {
    private Integer id;
    private String name;
    private String surname;
    private String email;
    private String vatNumber;
    private LocalDate birthDate;
    private String role;
}