package it.unical.progettoweb.dao.impl;

import it.unical.progettoweb.dao.RentalContractDao;
import it.unical.progettoweb.model.RentalContract;
import lombok.AllArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class RentalContractDaoImpl implements RentalContractDao {

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<RentalContract> rowMapper;

    @Override
    public RentalContract save(RentalContract c) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO rental_contract (post_id, tenant_id, start_date, end_date, monthly_price, status, created_at) " +
                            "VALUES (?, ?, ?, ?, ?, 'ACTIVE', NOW())",
                    new String[]{"id"}
            );
            ps.setInt(1, c.getPostId());
            ps.setInt(2, c.getTenantId());
            ps.setDate(3, Date.valueOf(c.getStartDate()));
            ps.setDate(4, Date.valueOf(c.getEndDate()));
            ps.setDouble(5, c.getMonthlyPrice());
            return ps;
        }, kh);
        c.setId(kh.getKey().intValue());
        return c;
    }

    @Override
    public Optional<RentalContract> get(Integer id) {
        try {
            return Optional.ofNullable(
                    jdbcTemplate.queryForObject("SELECT * FROM rental_contract WHERE id=?", rowMapper, id)
            );
        } catch (EmptyResultDataAccessException e) { return Optional.empty(); }
    }

    @Override
    public List<RentalContract> getAll() {
        return jdbcTemplate.query("SELECT * FROM rental_contract ORDER BY created_at DESC", rowMapper);
    }

    @Override
    public RentalContract update(RentalContract c) {
        jdbcTemplate.update(
                "UPDATE rental_contract SET status=? WHERE id=?",
                c.getStatus(), c.getId()
        );
        return c;
    }

    @Override
    public void delete(Integer id) {
        jdbcTemplate.update("DELETE FROM rental_contract WHERE id=?", id);
    }

    @Override
    public List<RentalContract> findByTenantId(int tenantId) {
        return jdbcTemplate.query(
                "SELECT * FROM rental_contract WHERE tenant_id=? ORDER BY created_at DESC",
                rowMapper, tenantId
        );
    }

    @Override
    public List<RentalContract> findByLandlordId(int sellerId) {
        return jdbcTemplate.query(
                "SELECT rc.* FROM rental_contract rc " +
                        "JOIN posts p ON rc.post_id = p.id " +
                        "WHERE p.id_seller=? ORDER BY rc.created_at DESC",
                rowMapper, sellerId
        );
    }

    @Override
    public void updateStatus(int contractId, String status) {
        jdbcTemplate.update("UPDATE rental_contract SET status=? WHERE id=?", status, contractId);
    }

    @Override
    public List<RentalContract> findActiveByPostId(int postId) {
        return jdbcTemplate.query(
                "SELECT * FROM rental_contract WHERE post_id = ? AND status = 'ACTIVE'",
                rowMapper, postId
        );
    }
    @Override
    public boolean hasActiveContractsByLandlordId(int sellerId) {
        String sql = "SELECT COUNT(*) FROM rental_contract rc " +
                "JOIN posts p ON rc.post_id = p.id " +
                "WHERE p.id_seller = ? AND rc.status = 'ACTIVE'";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, sellerId);
        return count != null && count > 0;
    }
    @Override
    public List<RentalContract> findByPostId(int postId) {
        return jdbcTemplate.query(
                "SELECT * FROM rental_contract WHERE post_id = ?",
                rowMapper, postId
        );
    }
}