package it.unical.progettoweb.controller;

import it.unical.progettoweb.dao.impl.AdminDao;
import it.unical.progettoweb.dao.impl.BlacklistDao;
import it.unical.progettoweb.dao.impl.SellerDao;
import it.unical.progettoweb.dao.impl.UserDao;
import it.unical.progettoweb.dto.request.BlacklistRequest;
import it.unical.progettoweb.dto.request.PostRequest;
import it.unical.progettoweb.model.Admin;
import it.unical.progettoweb.model.Seller;
import it.unical.progettoweb.model.User;
import it.unical.progettoweb.service.AdminService;
import it.unical.progettoweb.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserDao userDao;
    private final SellerDao sellerDao;
    private final AdminDao adminDao;
    private final BlacklistDao blacklistDao;
    private final PostService postService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userDao.getAll());
    }

    @GetMapping("/sellers")
    public ResponseEntity<List<Seller>> getAllSellers() {
        return ResponseEntity.ok(sellerDao.getAll());
    }

    @GetMapping("/admins")
    public ResponseEntity<List<Admin>> getAllAdmins() {
        return ResponseEntity.ok(adminDao.getAll());
    }

    @GetMapping("/blacklist")
    public ResponseEntity<List<String>> getBlacklist() {
        return ResponseEntity.ok(blacklistDao.getAll());
    }

    @PostMapping("/ban")
    public ResponseEntity<String> banUser(@RequestBody BlacklistRequest request) {
        try {
            adminService.banUser(request.getEmail());
            return ResponseEntity.ok("Utente bannato con successo.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/unban")
    public ResponseEntity<String> unbanUser(@RequestBody BlacklistRequest request) {
        try {
            adminService.unbanUser(request.getEmail());
            return ResponseEntity.ok("Ban rimosso con successo.");
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable int id) {
        var userOpt = userDao.get(id);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();
        // rimuovi dalla blacklist prima di eliminare (evita constraint violation)
        String email = userOpt.get().getEmail();
        if (blacklistDao.isBanned(email)) {
            blacklistDao.unban(email);
        }
        userDao.delete(id);
        return ResponseEntity.ok("Utente eliminato.");
    }

    @DeleteMapping("/sellers/{id}")
    public ResponseEntity<String> deleteSeller(@PathVariable int id) {
        var sellerOpt = sellerDao.get(id);
        if (sellerOpt.isEmpty())
            return ResponseEntity.notFound().build();
        // rimuovi dalla blacklist prima di eliminare (evita constraint violation)
        String email = sellerOpt.get().getEmail();
        if (blacklistDao.isBanned(email)) {
            blacklistDao.unban(email);
        }
        sellerDao.delete(id);
        return ResponseEntity.ok("Venditore eliminato.");
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<String> deletePost(@PathVariable int id) {
        try {
            postService.deleteByAdmin(id);
            return ResponseEntity.ok("Annuncio eliminato.");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/promote")
    public ResponseEntity<String> promoteToAdmin(@RequestBody BlacklistRequest request) {
        try {
            adminService.promuoviAdAdmin(request.getEmail());
            return ResponseEntity.ok("Utente promosso ad amministratore.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable int id,
            @RequestBody PostRequest dto) {
        try {
            return ResponseEntity.ok(postService.updateByAdmin(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}