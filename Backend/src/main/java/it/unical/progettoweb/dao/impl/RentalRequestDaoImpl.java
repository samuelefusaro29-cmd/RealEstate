package it.unical.progettoweb.dao.impl;

import it.unical.progettoweb.dao.RentalRequestDao;
import it.unical.progettoweb.model.RentalRequest;
import lombok.AllArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class RentalRequestDaoImpl implements RentalRequestDao {

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<RentalRequest> rowMapper;

    @Override
    public RentalRequest save(RentalRequest r) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO rental_request (post_id, buyer_id, message, desired_start, desired_end, status, created_at) " +
                            "VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())",
                    new String[]{"id"}
            );
            ps.setInt(1, r.getPostId());
            ps.setInt(2, r.getBuyerId());
            ps.setString(3, r.getMessage());
            ps.setDate(4, r.getDesiredStart() != null ? Date.valueOf(r.getDesiredStart()) : null);
            ps.setDate(5, r.getDesiredEnd() != null ? Date.valueOf(r.getDesiredEnd()) : null);
            return ps;
        }, kh);
        r.setId(kh.getKey().intValue());
        return r;
    }

    @Override
    public Optional<RentalRequest> get(Integer id) {
        try {
            return Optional.ofNullable(
                    jdbcTemplate.queryForObject("SELECT * FROM rental_request WHERE id=?", rowMapper, id)
            );
        } catch (EmptyResultDataAccessException e) { return Optional.empty(); }
    }

    @Override
    public List<RentalRequest> getAll() {
        return jdbcTemplate.query("SELECT * FROM rental_request ORDER BY created_at DESC", rowMapper);
    }

    @Override
    public RentalRequest update(RentalRequest r) {
        jdbcTemplate.update(
                "UPDATE rental_request SET status=? WHERE id=?",
                r.getStatus(), r.getId()
        );
        return r;
    }

    @Override
    public void delete(Integer id) {
        jdbcTemplate.update("DELETE FROM rental_request WHERE id=?", id);
    }

    @Override
    public List<RentalRequest> findByPostId(int postId) {
        return jdbcTemplate.query(
                "SELECT * FROM rental_request WHERE post_id=? ORDER BY created_at DESC",
                rowMapper, postId
        );
    }

    @Override
    public List<RentalRequest> findByBuyerId(int buyerId) {
        return jdbcTemplate.query(
                "SELECT * FROM rental_request WHERE buyer_id=? ORDER BY created_at DESC",
                rowMapper, buyerId
        );
    }

    @Override
    public List<RentalRequest> findBySellerId(int sellerId) {
        return jdbcTemplate.query(
                "SELECT rr.* FROM rental_request rr " +
                        "JOIN posts p ON rr.post_id = p.id " +
                        "WHERE p.id_seller=? ORDER BY rr.created_at DESC",
                rowMapper, sellerId
        );
    }

    @Override
    public void updateStatus(int requestId, String status) {
        jdbcTemplate.update("UPDATE rental_request SET status=? WHERE id=?", status, requestId);
    }
}