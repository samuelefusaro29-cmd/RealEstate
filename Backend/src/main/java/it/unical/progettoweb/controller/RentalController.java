package it.unical.progettoweb.controller;

import it.unical.progettoweb.dto.request.RentalRequestDto;
import it.unical.progettoweb.dto.response.RentalContractResponse;
import it.unical.progettoweb.dto.response.RentalRequestResponse;
import it.unical.progettoweb.service.JwtUtil;
import it.unical.progettoweb.service.RentalService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rentals")
@AllArgsConstructor
public class RentalController {

    private final RentalService rentalService;
    private final JwtUtil jwtUtil;

    @PostMapping("/request")
    public ResponseEntity<RentalRequestResponse> createRequest(
            @RequestHeader("Authorization") String token,
            @RequestBody RentalRequestDto dto) {
        int buyerId = jwtUtil.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(rentalService.createRequest(dto, buyerId));
    }

    @GetMapping("/requests/buyer")
    public ResponseEntity<List<RentalRequestResponse>> getBuyerRequests(
            @RequestHeader("Authorization") String token) {
        int buyerId = jwtUtil.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(rentalService.getRequestsForBuyer(buyerId));
    }

    @GetMapping("/requests/seller")
    public ResponseEntity<List<RentalRequestResponse>> getSellerRequests(
            @RequestHeader("Authorization") String token) {
        int sellerId = jwtUtil.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(rentalService.getRequestsForSeller(sellerId));
    }

    @PutMapping("/requests/{id}/accept")
    public ResponseEntity<RentalContractResponse> acceptRequest(
            @RequestHeader("Authorization") String token,
            @PathVariable int id) {
        int sellerId = jwtUtil.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(rentalService.acceptRequest(id, sellerId));
    }

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<Void> rejectRequest(
            @RequestHeader("Authorization") String token,
            @PathVariable int id) {
        int sellerId = jwtUtil.extractUserId(token.replace("Bearer ", ""));
        rentalService.rejectRequest(id, sellerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/contracts/tenant")
    public ResponseEntity<List<RentalContractResponse>> getTenantContracts(
            @RequestHeader("Authorization") String token) {
        int tenantId = jwtUtil.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(rentalService.getContractsForTenant(tenantId));
    }

    @GetMapping("/contracts/landlord")
    public ResponseEntity<List<RentalContractResponse>> getLandlordContracts(
            @RequestHeader("Authorization") String token) {
        int sellerId = jwtUtil.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.ok(rentalService.getContractsForLandlord(sellerId));
    }

    @PutMapping("/contracts/{id}/terminate")
    public ResponseEntity<Void> terminateContract(
            @RequestHeader("Authorization") String token,
            @PathVariable int id) {
        int sellerId = jwtUtil.extractUserId(token.replace("Bearer ", ""));
        rentalService.terminateContract(id, sellerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/booked-periods/{postId}")
    public ResponseEntity<List<Map<String, String>>> getBookedPeriods(@PathVariable int postId) {
        return ResponseEntity.ok(rentalService.getBookedPeriods(postId));
    }
}