package it.unical.progettoweb.mapper;

import it.unical.progettoweb.model.RentalContract;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class RentalContractRowMapper implements RowMapper<RentalContract> {

    @Override
    public RentalContract mapRow(ResultSet rs, int rowNum) throws SQLException {
        RentalContract c = new RentalContract();
        c.setId(rs.getInt("id"));
        c.setPostId(rs.getInt("post_id"));
        c.setTenantId(rs.getInt("tenant_id"));
        c.setStartDate(rs.getDate("start_date").toLocalDate());
        c.setEndDate(rs.getDate("end_date").toLocalDate());
        c.setMonthlyPrice(rs.getDouble("monthly_price"));
        c.setStatus(rs.getString("status"));
        c.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return c;
    }
}