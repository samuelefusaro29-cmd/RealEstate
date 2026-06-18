package it.unical.progettoweb.service;

import it.unical.progettoweb.dao.*;
import it.unical.progettoweb.dao.impl.AdminDao;
import it.unical.progettoweb.dao.impl.BlacklistDao;
import it.unical.progettoweb.dao.impl.SellerDao;
import it.unical.progettoweb.dao.impl.UserDao;
import it.unical.progettoweb.dto.request.SellerRequest;
import it.unical.progettoweb.dto.response.SellerDto;
import it.unical.progettoweb.model.Post;
import it.unical.progettoweb.model.Seller;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerDao sellerDao;
    private final UserDao userDao;
    private final AdminDao adminDao;
    private final BlacklistDao blacklistDao;
    private final PasswordEncoder passwordEncoder;
    private final RentalContractDao  rentalContractDao;
    private final RentalRequestDao rentalRequestDao;
    private final PostDao postDao;
    private final AuctionDao auctionDao;
    private final BidDao bidDao;
    private final ReviewDao reviewDao;
    private final PhotoDao photoDao;

    private void validaEmailModifica(String nuovaEmail, String emailAttuale) {
        if (!Validation.checkEmail(nuovaEmail))
            throw new IllegalArgumentException("Formato email non valido.");

        if (blacklistDao.isBanned(nuovaEmail))
            throw new IllegalArgumentException("Si è verificato un errore. La mail che stai cercando di usare è stata bannata.");

        if (!nuovaEmail.equalsIgnoreCase(emailAttuale)) {
            if (userDao.existsByEmail(nuovaEmail) ||
                    sellerDao.existsByEmail(nuovaEmail) ||
                    adminDao.existsByEmail(nuovaEmail))
                throw new IllegalArgumentException("Questa Email è gia associata ad un account.");
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

    public SellerDto getSellerByEmail(String email) {
        if (sellerDao.findByEmail(email).isEmpty())
            throw new IllegalArgumentException("Venditore non trovato.");
        Seller seller = sellerDao.findByEmail(email).get();
        return toDto(seller);
    }

    public void aggiornaProfilo(String emailDalToken, SellerRequest dto) {
        if (sellerDao.findByEmail(emailDalToken).isEmpty())
            throw new IllegalArgumentException("Venditore non trovato.");
        Seller seller = sellerDao.findByEmail(emailDalToken).get();

        validaGeneralita(dto.getName(), dto.getSurname());
        validaEmailModifica(dto.getEmail(), emailDalToken);
        validaDataNascita(dto.getBirthDate());

        seller.setName(dto.getName());
        seller.setSurname(dto.getSurname());
        seller.setEmail(dto.getEmail());
        seller.setBirthDate(dto.getBirthDate());
        sellerDao.update(seller);
    }

    public void cambiaPassword(String emailDalToken, String oldPassword, String newPassword) {
        if (sellerDao.findByEmail(emailDalToken).isEmpty())
            throw new IllegalArgumentException("Venditore non trovato.");
        Seller seller = sellerDao.findByEmail(emailDalToken).get();

        if (!passwordEncoder.matches(oldPassword, seller.getPassword()))
            throw new IllegalArgumentException("La vecchia password non è corretta.");

        String errori = Validation.getErrorePassword(newPassword);
        if (errori != null)
            throw new IllegalArgumentException(errori);

        seller.setPassword(passwordEncoder.encode(newPassword));
        sellerDao.update(seller);
    }

    public void cancellaAccount(String emailDalToken) {
        Seller seller = sellerDao.findByEmail(emailDalToken)
                .orElseThrow(() -> new IllegalArgumentException("Venditore non trovato."));

        if (rentalContractDao.hasActiveContractsByLandlordId(seller.getId()))
            throw new IllegalArgumentException(
                    "Impossibile cancellare l'account: hai uno o più contratti di affitto attivi."
            );

        List<Post> posts = postDao.findBySellerId(seller.getId());
        for (Post post : posts) {

            auctionDao.findByPostId(post.getId()).ifPresent(auction -> {
                bidDao.findByAuctionId(auction.getId())
                        .forEach(bid -> bidDao.delete(bid.getId()));
                auctionDao.delete(auction.getId());
            });

            rentalContractDao.findByPostId(post.getId())
                    .forEach(c -> rentalContractDao.delete(c.getId()));

            rentalRequestDao.findByPostId(post.getId())
                    .forEach(r -> rentalRequestDao.delete(r.getId()));

            reviewDao.findByPostId(post.getId())
                    .forEach(r -> reviewDao.delete(r.getId()));

            photoDao.findByPostId(post.getId())
                    .forEach(p -> photoDao.delete(p.getId()));

            postDao.delete(post.getId());
        }

        sellerDao.delete(seller.getId());
    }

    private SellerDto toDto(Seller seller) {
        return new SellerDto(
                seller.getId(),
                seller.getName(),
                seller.getSurname(),
                seller.getEmail(),
                seller.getVatNumber(),
                seller.getBirthDate(),
                "SELLER"
        );
    }

    public SellerDto getSellerById(int id) {
        Seller seller = sellerDao.get(id)
                .orElseThrow(() -> new RuntimeException("Venditore non trovato"));
        return toDto(seller);
    }
}