package it.unical.progettoweb.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Auction {
    private Integer id;
    private int postId;
    private double startingPrice;
    private double currentBest;
    private LocalDateTime endDate;
    private boolean closed;
    private Integer currentWinnerId;
    private Integer winnerId;
    private List<Bid> bids;
}