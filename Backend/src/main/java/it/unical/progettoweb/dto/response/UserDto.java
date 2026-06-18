package it.unical.progettoweb.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Integer id;
    private String name;
    private String surname;
    private String email;
    private LocalDate birthDate;
    private String authProvider;
    private String role;
}