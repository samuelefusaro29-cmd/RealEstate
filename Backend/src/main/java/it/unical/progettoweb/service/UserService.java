package it.unical.progettoweb.service;

import it.unical.progettoweb.dao.impl.*;
import it.unical.progettoweb.dto.request.UserRequest;
import it.unical.progettoweb.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserDao userDao;
    private final SellerDao sellerDao;
    private final AdminDao adminDao;
    private final BlacklistDao blacklistDao;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;
    private final AuctionDaoImpl auctionDao;
    private final BidDaoImpl bidDao;
    private final RentalContractDaoImpl rentalContractDao;

    private void validaEmailModifica(String nuovaEmail, String emailAttuale) {
        if (!Validation.checkEmail(nuovaEmail))
            throw new IllegalArgumentException("Formato email non valido.");

        if (blacklistDao.isBanned(nuovaEmail))
            throw new IllegalArgumentException("Si è verificato un errore. La mail che stai cercando di usare è stata bannata.");

        if (!nuovaEmail.equalsIgnoreCase(emailAttuale)) {
            if (userDao.existsByEmail(nuovaEmail) ||
                    sellerDao.existsByEmail(nuovaEmail) ||
                    adminDao.existsByEmail(nuovaEmail))
                throw new IllegalArgumentException("Questa Email è già associata ad un account.");
        }
    }

    private void validaGeneralita(String nome, String cognome) {
        if (!Validation.checkNome(nome))
            throw new IllegalArgumentException("Nome non valido (minimo 3 caratteri).");
        if (!Validation.checkCognome(cognome))
            throw new IllegalArgumentException("Cognome non valido (minimo 3 caratteri).");
    }

    private void validaDataNascita(LocalDate data) {
        if (data == null)
            throw new IllegalArgumentException("Data di nascita obbligatoria.");
        if (!Validation.checkDataNascita(data.toString()))
            throw new IllegalArgumentException("Data di nascita non valida.");
    }

    public User getUtenteByEmail(String email) {
        return userDao.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato."));
    }

    public void aggiornaProfilo(String emailDalToken, UserRequest dto) {
        User user = getUtenteByEmail(emailDalToken);

        validaGeneralita(dto.getName(), dto.getSurname());
        validaEmailModifica(dto.getEmail(), emailDalToken);
        validaDataNascita(dto.getBirthDate());

        user.setName(dto.getName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setBirthDate(dto.getBirthDate());

        userDao.update(user);
    }

    public void cambiaPassword(String emailDalToken, String oldPassword, String newPassword) {
        User user = getUtenteByEmail(emailDalToken);

        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider()))
            throw new IllegalStateException(
                    "Sei registrato con Google. Non puoi modificare la password.");

        if (!passwordEncoder.matches(oldPassword, user.getPassword()))
            throw new IllegalArgumentException("La vecchia password non è corretta.");

        String errori = Validation.getErrorePassword(newPassword);
        if (errori != null)
            throw new IllegalArgumentException(errori);

        user.setPassword(passwordEncoder.encode(newPassword));
        userDao.update(user);
    }

    @Transactional
    public void cancellaAccount(String emailDalToken) {
        User user = getUtenteByEmail(emailDalToken);
        int id = user.getId();

        boolean hasActive = rentalContractDao.findByTenantId(id)
                .stream()
                .anyMatch(c -> "ACTIVE".equals(c.getStatus()));

        if (hasActive)
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Impossibile cancellare l'account: hai un contratto di affitto attivo."
            );

        auctionDao.resetWinnerIfUser(id);
        bidDao.deleteByUserId(id);
        userDao.delete(id);
    }

    public void richiestaModificaEmail(String emailDalToken, String nuovaEmail) {
        User user = getUtenteByEmail(emailDalToken);

        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider()))
            throw new IllegalStateException(
                    "Sei registrato con Google. Non puoi modificare l'email.");

        validaEmailModifica(nuovaEmail, emailDalToken);

        String codice = otpService.generateOtp(nuovaEmail);
        System.out.println(">>> OTP generato per " + nuovaEmail + ": " + codice);
        emailService.sendOtp(nuovaEmail, codice, "Modifica email");
    }

    public void confermaModificaEmail(String emailDalToken, String nuovaEmail,
                                      String otp, String nome, String cognome, String birthDate) {
        if (!otpService.verifyOtp(nuovaEmail, otp))
            throw new IllegalArgumentException("OTP non valido o scaduto.");

        validaEmailModifica(nuovaEmail, emailDalToken);

        User user = getUtenteByEmail(emailDalToken);

        user.setEmail(nuovaEmail);

        if (nome != null && !nome.isBlank()) user.setName(nome);
        if (cognome != null && !cognome.isBlank()) user.setSurname(cognome);
        if (birthDate != null && !birthDate.isBlank()) {
            try {
                user.setBirthDate(LocalDate.parse(birthDate));
            } catch (Exception ignored) {}
        }

        userDao.update(user);
    }
}
