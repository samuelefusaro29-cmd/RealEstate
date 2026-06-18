package it.unical.progettoweb.dao;

import it.unical.progettoweb.model.RentalRequest;
import java.util.List;

public interface RentalRequestDao extends Dao<RentalRequest, Integer> {
    List<RentalRequest> findByPostId(int postId);
    List<RentalRequest> findByBuyerId(int buyerId);
    List<RentalRequest> findBySellerId(int sellerId);
    void updateStatus(int requestId, String status);
}