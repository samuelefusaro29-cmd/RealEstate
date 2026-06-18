package it.unical.progettoweb.dao;

import it.unical.progettoweb.model.RentalContract;
import java.util.List;

public interface RentalContractDao extends Dao<RentalContract, Integer> {
    List<RentalContract> findByTenantId(int tenantId);
    List<RentalContract> findByLandlordId(int sellerId);
    void updateStatus(int contractId, String status);
    List<RentalContract> findActiveByPostId(int postId);
    boolean hasActiveContractsByLandlordId(int sellerId);
    List<RentalContract> findByPostId(int postId);
}