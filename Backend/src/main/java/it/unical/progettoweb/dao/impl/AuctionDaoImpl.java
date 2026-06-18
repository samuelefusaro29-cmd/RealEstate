package it.unical.progettoweb.dao.impl;

import it.unical.progettoweb.dao.AuctionDao;
import it.unical.progettoweb.mapper.AuctionRowMapper;
import it.unical.progettoweb.model.Auction;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class AuctionDaoImpl implements AuctionDao {

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<Auction> rowMapper;

    public AuctionDaoImpl(JdbcTemplate jdbcTemplate, AuctionRowMapper auctionRowMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = auctionRowMapper;
    }

    @Override
    public Auction save(Auction auction) {
        jdbcTemplate.update(
                "INSERT INTO auctions (id, id_post, starting_price, current_best, end_date, is_closed, current_winner_id, winner_id) " +
                        "VALUES (?, ?, ?, ?, ?, FALSE, NULL, NULL)",
                auction.getId(),
                auction.getPostId(),
                auction.getStartingPrice(),
                auction.getCurrentBest(),
                auction.getEndDate()
        );
        return auction;
    }

    @Override
    public Optional<Auction> get(Integer id) {
        try {
            return Optional.ofNullable(
                    jdbcTemplate.queryForObject("SELECT * FROM auctions WHERE id = ?", rowMapper, id)
            );
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<Auction> getAll() {
        return jdbcTemplate.query("SELECT * FROM auctions", rowMapper);
    }

    @Override
    public Auction update(Auction auction) {
        jdbcTemplate.update(
                "UPDATE auctions SET id_post=?, starting_price=?, current_best=?, end_date=?, is_closed=?, current_winner_id=?, winner_id=? WHERE id=?",
                auction.getPostId(),
                auction.getStartingPrice(),
                auction.getCurrentBest(),
                auction.getEndDate(),
                auction.isClosed(),
                auction.getCurrentWinnerId(),
                auction.getWinnerId(),
                auction.getId()
        );
        return auction;
    }

    @Override
    public void delete(Integer id) {
        jdbcTemplate.update("DELETE FROM auctions WHERE id = ?", id);
    }

    @Override
    public Optional<Auction> findByPostId(int postId) {
        try {
            return Optional.ofNullable(
                    jdbcTemplate.queryForObject("SELECT * FROM auctions WHERE id_post = ?", rowMapper, postId)
            );
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<Auction> findAllOpen() {
        return jdbcTemplate.query(
                "SELECT * FROM auctions WHERE is_closed = FALSE",
                rowMapper
        );
    }

    @Override
    public void updateCurrentBest(int auctionId, double amount, int currentWinnerId) {
        jdbcTemplate.update(
                "UPDATE auctions SET current_best = ?, current_winner_id = ? WHERE id = ?",
                amount, currentWinnerId, auctionId
        );
    }

    @Override
    public void setWinnerAndClose(int auctionId, int winnerId) {
        jdbcTemplate.update(
                "UPDATE auctions SET is_closed = TRUE, winner_id = ?, current_winner_id = NULL WHERE id = ?",
                winnerId, auctionId
        );
    }

    @Override
    public void closeWithoutWinner(int auctionId) {
        jdbcTemplate.update("DELETE FROM auctions WHERE id = ?", auctionId);
    }

    public void resetWinnerIfUser(int userId) {
        List<Integer> asteBloccate = jdbcTemplate.queryForList(
                "SELECT id FROM auctions WHERE current_winner_id = ? AND is_closed = false",
                Integer.class, userId
        );

        for (int auctionId : asteBloccate) {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id_user, amount FROM bids " +
                            "WHERE id_auction = ? AND id_user != ? " +
                            "ORDER BY amount DESC LIMIT 1",
                    auctionId, userId
            );

            if (!rows.isEmpty()) {
                int nuovoVincitore = ((Number) rows.get(0).get("id_user")).intValue();
                double nuovoPrezzo  = ((Number) rows.get(0).get("amount")).doubleValue();
                jdbcTemplate.update(
                        "UPDATE auctions SET current_winner_id = ?, current_best = ? WHERE id = ?",
                        nuovoVincitore, nuovoPrezzo, auctionId
                );
            } else {
                jdbcTemplate.update(
                        "UPDATE auctions SET current_winner_id = NULL, current_best = starting_price WHERE id = ?",
                        auctionId
                );
            }
        }
        jdbcTemplate.update(
                "UPDATE auctions SET winner_id = NULL WHERE winner_id = ?", userId
        );
    }
    @Override
    public void deleteByPostId(int postId) {
        // prima le bids, poi l'asta
        jdbcTemplate.update("DELETE FROM bids WHERE id_auction IN " +
                "(SELECT id FROM auctions WHERE id_post = ?)", postId);
        jdbcTemplate.update("DELETE FROM auctions WHERE id_post = ?", postId);
    }
}