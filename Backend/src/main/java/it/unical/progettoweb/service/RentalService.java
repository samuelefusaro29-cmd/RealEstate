package it.unical.progettoweb.service;

import it.unical.progettoweb.dao.PostDao;
import it.unical.progettoweb.dao.RentalContractDao;
import it.unical.progettoweb.dao.RentalRequestDao;
import it.unical.progettoweb.dto.request.RentalRequestDto;
import it.unical.progettoweb.dto.response.RentalContractResponse;
import it.unical.progettoweb.dto.response.RentalRequestResponse;
import it.unical.progettoweb.model.Post;
import it.unical.progettoweb.model.RentalContract;
import it.unical.progettoweb.model.RentalRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@AllArgsConstructor
public class RentalService {

    private final RentalRequestDao rentalRequestDao;
    private final RentalContractDao rentalContractDao;
    private final PostDao postDao;

    public RentalRequestResponse createRequest(RentalRequestDto dto, int buyerId) {
        if (dto.getDesiredStart() == null || dto.getDesiredEnd() == null) {
            throw new IllegalArgumentException("Le date di inizio e fine sono obbligatorie");
        }
        if (!dto.getDesiredEnd().isAfter(dto.getDesiredStart())) {
            throw new IllegalArgumentException("La data di fine deve essere successiva alla data di inizio");
        }
        Post post = postDao.get(dto.getPostId())
                .orElseThrow(() -> new RuntimeException("Post non trovato"));
        if (!"RENT".equalsIgnoreCase(post.getListingType()))
            throw new IllegalArgumentException("Questo annuncio non è disponibile per l'affitto");

        RentalRequest req = new RentalRequest();
        req.setPostId(dto.getPostId());
        req.setBuyerId(buyerId);
        req.setMessage(dto.getMessage());
        req.setDesiredStart(dto.getDesiredStart());
        req.setDesiredEnd(dto.getDesiredEnd());
        return toReqRes(rentalRequestDao.save(req));
    }

    public List<RentalRequestResponse> getRequestsForBuyer(int buyerId) {
        return rentalRequestDao.findByBuyerId(buyerId).stream().map(this::toReqRes).toList();
    }

    public List<RentalRequestResponse> getRequestsForSeller(int sellerId) {
        return rentalRequestDao.findBySellerId(sellerId).stream().map(this::toReqRes).toList();
    }

    @Transactional
    public RentalContractResponse acceptRequest(int requestId, int sellerId) {
        RentalRequest req = rentalRequestDao.get(requestId)
                .orElseThrow(() -> new RuntimeException("Richiesta non trovata"));
        Post post = postDao.get(req.getPostId())
                .orElseThrow(() -> new RuntimeException("Post non trovato"));
        if (post.getSellerId() != sellerId)
            throw new RuntimeException("Non sei il proprietario di questo annuncio");
        if (!"PENDING".equals(req.getStatus()))
            throw new IllegalStateException("La richiesta non è in stato PENDING");

        RentalContract contract = new RentalContract();
        contract.setPostId(req.getPostId());
        contract.setTenantId(req.getBuyerId());
        contract.setStartDate(req.getDesiredStart());
        contract.setEndDate(req.getDesiredEnd());
        contract.setMonthlyPrice(
                post.getRentalPriceMonthly() != null ? post.getRentalPriceMonthly() : post.getCurrentPrice()
        );
        rentalRequestDao.updateStatus(requestId, "ACCEPTED");
        return toContrRes(rentalContractDao.save(contract));
    }

    public void rejectRequest(int requestId, int sellerId) {
        RentalRequest req = rentalRequestDao.get(requestId)
                .orElseThrow(() -> new RuntimeException("Richiesta non trovata"));
        Post post = postDao.get(req.getPostId())
                .orElseThrow(() -> new RuntimeException("Post non trovato"));
        if (post.getSellerId() != sellerId)
            throw new RuntimeException("Non sei il proprietario di questo annuncio");
        if (!"PENDING".equals(req.getStatus()))
            throw new IllegalStateException("La richiesta non è in stato PENDING");
        rentalRequestDao.updateStatus(requestId, "REJECTED");
    }

    public List<RentalContractResponse> getContractsForTenant(int tenantId) {
        return rentalContractDao.findByTenantId(tenantId).stream().map(this::toContrRes).toList();
    }

    public List<RentalContractResponse> getContractsForLandlord(int sellerId) {
        return rentalContractDao.findByLandlordId(sellerId).stream().map(this::toContrRes).toList();
    }

    public void terminateContract(int contractId, int sellerId) {
        RentalContract c = rentalContractDao.get(contractId)
                .orElseThrow(() -> new RuntimeException("Contratto non trovato"));
        Post post = postDao.get(c.getPostId())
                .orElseThrow(() -> new RuntimeException("Post non trovato"));
        if (post.getSellerId() != sellerId)
            throw new RuntimeException("Non sei il proprietario di questo contratto");
        if (!"ACTIVE".equals(c.getStatus()))
            throw new IllegalStateException("Il contratto non è attivo");
        rentalContractDao.updateStatus(contractId, "TERMINATED");
    }

    private RentalRequestResponse toReqRes(RentalRequest r) {
        return new RentalRequestResponse(r.getId(), r.getPostId(), r.getBuyerId(),
                r.getMessage(), r.getDesiredStart(), r.getDesiredEnd(), r.getStatus(), r.getCreatedAt());
    }

    private RentalContractResponse toContrRes(RentalContract c) {
        return new RentalContractResponse(c.getId(), c.getPostId(), c.getTenantId(),
                c.getStartDate(), c.getEndDate(), c.getMonthlyPrice(), c.getStatus(), c.getCreatedAt());
    }

    public List<Map<String, String>> getBookedPeriods(int postId) {
        return rentalContractDao.findActiveByPostId(postId).stream()
                .map(c -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("start", c.getStartDate().toString());
                    m.put("end", c.getEndDate().toString());
                    return m;
                })
                .toList();
    }
}