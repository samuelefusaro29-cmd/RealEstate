package it.unical.progettoweb.service;

import it.unical.progettoweb.dao.PostDao;
import it.unical.progettoweb.dao.ReviewDao;
import it.unical.progettoweb.dao.impl.PhotoDaoImpl;
import it.unical.progettoweb.dto.request.PostRequest;
import it.unical.progettoweb.dto.request.PostWithRealEstateCreateDto;
import it.unical.progettoweb.dto.response.PostDto;
import it.unical.progettoweb.dto.response.RealEstateDto;
import it.unical.progettoweb.model.Photo;
import it.unical.progettoweb.model.Post;
import it.unical.progettoweb.proxy.PostProxy;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@AllArgsConstructor
public class PostService {

    private final PostDao postDao;
    private final RealEstateService realEstateService;
    private final TelegramService telegramService;
    private final ReviewDao reviewDao;
    private final PhotoDaoImpl photoDao;

    public PostDto save(PostRequest postDto, int sellerId) {
        return buildAndSavePost(
                postDto.getTitle(),
                postDto.getDescription(),
                postDto.getPhotoUrls(),
                postDto.getCurrentPrice(),
                postDto.getRealEstateId(),
                sellerId,
                postDto.getListingType(),
                postDto.getRentalPriceMonthly()
        );
    }

    @Transactional
    public PostDto saveWithRealEstate(PostWithRealEstateCreateDto dto, int sellerId) {
        RealEstateDto createdRealEstate = realEstateService.save(dto.getRealEstate());
        return buildAndSavePost(
                dto.getTitle(),
                dto.getDescription(),
                dto.getPhotoUrls(),
                dto.getCurrentPrice(),
                createdRealEstate.getId(),
                sellerId,
                dto.getListingType(),
                dto.getRentalPriceMonthly()
        );
    }

    private PostDto buildAndSavePost(String title, String description, List<Photo> photos,
                                     double currentPrice, int realEstateId, int sellerId,
                                     String listingType, Double rentalPriceMonthly) {
        Post post = new Post();
        post.setTitle(title);
        post.setDescription(description);
        post.setPhotos(photos);
        post.setCreatedAt(LocalDateTime.now());
        post.setCurrentPrice(currentPrice);
        post.setPreviousPrice(0);
        post.setSellerId(sellerId);
        post.setRealEstateId(realEstateId);
        post.setId(generateUniqueId());
        post.setListingType(listingType != null ? listingType.toUpperCase() : "SALE");
        post.setRentalPriceMonthly(rentalPriceMonthly);
        post = postDao.save(post);

        try {
            Object re = realEstateService.findById(realEstateId);
            if (re instanceof RealEstateDto reDto) {
                telegramService.inviaAnnuncio(
                        title, description, currentPrice, reDto.getAddress(), post.getId()
                );
            }
        } catch (Exception e) {
            System.err.println("Telegram skip: " + e.getMessage());
        }

        return toDto(post);
    }

    public PostDto reducePrice(int id, double newPrice, int sellerId) {
        Post existing = postDao.get(id).orElse(null);
        if (existing == null) {
            throw new RuntimeException("Post non trovato");
        }
        if (newPrice >= existing.getCurrentPrice()) {
            throw new IllegalArgumentException("Il nuovo prezzo deve essere inferiore a quello attuale");
        }
        existing.setPreviousPrice(existing.getCurrentPrice());
        existing.setCurrentPrice(newPrice);
        Post saved = postDao.update(existing);
        if (sellerId != saved.getSellerId()) {
            throw new RuntimeException("Non puoi modificare un post di un altro venditore");
        }
        return toDto(saved);
    }

    private PostDto toDto(Post post) {
        return new PostDto(
                post.getId(), post.getTitle(), post.getDescription(),
                post.getPreviousPrice(), post.getCurrentPrice(),
                post.getCreatedAt(), post.getSellerId(),
                post.getRealEstateId(), post.getPhotos(),
                post.getListingType(),
                post.getRentalPriceMonthly(),
                post.isSold()
        );
    }

    public PostDto update(int id, PostRequest postDto, int sellerId) {
        Optional<Post> existing = postDao.get(id);
        if (existing.isEmpty()) {
            throw new RuntimeException("Post non trovato");
        }
        Post post = existing.get();
        if (sellerId != post.getSellerId()) {
            throw new RuntimeException("Non puoi modificare un post di un altro venditore");
        }
        post.setTitle(postDto.getTitle());
        post.setDescription(postDto.getDescription());
        post.setPreviousPrice(post.getCurrentPrice());
        post.setCurrentPrice(postDto.getCurrentPrice());
        post.setPhotos(postDto.getPhotoUrls());
        post.setRealEstateId(postDto.getRealEstateId());
        if (postDto.getListingType() != null)
            post.setListingType(postDto.getListingType().toUpperCase());
        post.setRentalPriceMonthly(postDto.getRentalPriceMonthly());
        Post saved = postDao.update(post);
        return toDto(saved);
    }

    public void delete(int id, int sellerId) {
        Optional<Post> existing = postDao.get(id);
        if (existing.isEmpty()) {
            throw new RuntimeException("Post non trovato");
        }
        if (sellerId != existing.get().getSellerId()) {
            throw new RuntimeException("Non puoi eliminare un post di un altro venditore");
        }
        postDao.delete(id);
    }

    @Transactional
    public void deleteByAdmin(int id) {
        Optional<Post> existing = postDao.get(id);
        if (existing.isEmpty()) {
            throw new RuntimeException("Post non trovato");
        }

        reviewDao.findByPostId(id).forEach(r -> reviewDao.delete(r.getId()));
        photoDao.getPhotoCollectionForPost(id).getPhotos().forEach(p -> photoDao.delete(p.getId()));

        postDao.delete(id);
    }

    public List<PostDto> getAll(String sortBy, String direction,
                                String q, String city, String category,
                                Double minPrice, Double maxPrice,
                                Double minSquareMeters, Double maxSquareMeters) {

        List<Post> posts = postDao.getAll();
        List<PostDto> result = new ArrayList<>();

        for (Post p : posts) {
            if (minPrice != null && p.getCurrentPrice() < minPrice) continue;
            if (maxPrice != null && p.getCurrentPrice() > maxPrice) continue;

            if (q != null && !q.isBlank()) {
                String lower = q.toLowerCase();
                boolean matchTitle = p.getTitle() != null && p.getTitle().toLowerCase().contains(lower);
                boolean matchDesc  = p.getDescription() != null && p.getDescription().toLowerCase().contains(lower);
                if (!matchTitle && !matchDesc) continue;
            }

            boolean needsRE = (category != null && !category.isBlank())
                    || (city != null && !city.isBlank())
                    || (minSquareMeters != null)
                    || (maxSquareMeters != null);

            if (needsRE) {
                RealEstateDto re;
                try {
                    Object reObj = realEstateService.findById(p.getRealEstateId());
                    if (!(reObj instanceof RealEstateDto)) continue;
                    re = (RealEstateDto) reObj;
                } catch (Exception e) {
                    continue;
                }

                if (category != null && !category.isBlank()) {
                    String reType = re.getType() == null ? "" : re.getType().toUpperCase();
                    boolean matches = switch (category.toUpperCase()) {
                        case "APARTMENT"  -> reType.equals("APARTMENT");
                        case "VILLA"      -> reType.equals("VILLA");
                        case "HOUSE"      -> reType.equals("APARTMENT") || reType.equals("VILLA");
                        case "GARAGE"     -> reType.equals("GARAGE");
                        case "LAND"       -> reType.equals("BUILDING_LOT") || reType.equals("NON_BUILDING_LOT");
                        case "COMMERCIAL" -> reType.equals("COMMERCIAL");
                        default           -> true;
                    };
                    if (!matches) continue;
                }

                if (city != null && !city.isBlank()) {
                    String addr = re.getAddress() == null ? "" : re.getAddress().toLowerCase();
                    if (!addr.contains(city.toLowerCase())) continue;
                }

                if (minSquareMeters != null && re.getSquareMetres() < minSquareMeters) continue;
                if (maxSquareMeters != null && re.getSquareMetres() > maxSquareMeters) continue;
            }

            List<Photo> photos = photoDao.getPhotoCollectionForPost(p.getId()).getPhotos();
            p.setPhotos(photos);
            result.add(toDto(p));
        }

        if (sortBy != null) {
            result.sort((a, b) -> {
                int cmp = switch (sortBy.toLowerCase()) {
                    case "price" -> Double.compare(a.getCurrentPrice(), b.getCurrentPrice());
                    default      -> a.getCreatedAt().compareTo(b.getCreatedAt());
                };
                return "desc".equalsIgnoreCase(direction) ? -cmp : cmp;
            });
        } else {
            result.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        }

        return result;
    }

    public PostDto getById(int id) {
        Optional<Post> existing = postDao.get(id);
        if (existing.isEmpty()) {
            throw new RuntimeException("Post non trovato");
        }
        Post post = existing.get();
        PostProxy proxy = new PostProxy(photoDao, reviewDao);
        proxy.setId(post.getId());
        proxy.setTitle(post.getTitle());
        proxy.setDescription(post.getDescription());
        proxy.setPreviousPrice(post.getPreviousPrice());
        proxy.setCurrentPrice(post.getCurrentPrice());
        proxy.setCreatedAt(post.getCreatedAt());
        proxy.setSellerId(post.getSellerId());
        proxy.setRealEstateId(post.getRealEstateId());
        proxy.setListingType(post.getListingType());
        proxy.setRentalPriceMonthly(post.getRentalPriceMonthly());
        return toDto(proxy);
    }

    public List<PostDto> getBySellerId(int sellerId) {
        List<Post> posts = postDao.findBySellerId(sellerId);
        if (posts == null || posts.isEmpty()) {
            throw new RuntimeException("Nessun post trovato per il venditore con id: " + sellerId);
        }
        List<PostDto> result = new ArrayList<>();
        for (Post p : posts) {
            List<Photo> photos = photoDao.getPhotoCollectionForPost(p.getId()).getPhotos();
            p.setPhotos(photos);
            result.add(toDto(p));
        }
        return result;
    }

    public List<PostDto> getByRealEstateId(int realEstateId) {
        List<Post> posts = postDao.findByRealEstateId(realEstateId);
        if (posts == null || posts.isEmpty()) {
            throw new RuntimeException("Nessun post trovato per l'immobile con id: " + realEstateId);
        }
        List<PostDto> result = new ArrayList<>();
        for (Post p : posts) {
            result.add(toDto(p));
        }
        return result;
    }

    public PostDto updateByAdmin(int id, PostRequest postDto) {
        Optional<Post> existing = postDao.get(id);
        if (existing.isEmpty()) {
            throw new RuntimeException("Post non trovato");
        }
        Post post = existing.get();
        post.setTitle(postDto.getTitle());
        post.setDescription(postDto.getDescription());
        post.setPreviousPrice(post.getCurrentPrice());
        post.setCurrentPrice(postDto.getCurrentPrice());
        post.setPhotos(postDto.getPhotoUrls());
        post.setRealEstateId(postDto.getRealEstateId());
        if (postDto.getListingType() != null)
            post.setListingType(postDto.getListingType().toUpperCase());
        post.setRentalPriceMonthly(postDto.getRentalPriceMonthly());
        Post saved = postDao.update(post);
        return toDto(saved);
    }

    private int generateUniqueId() {
        int id;
        do {
            Random random = new Random();
            id = random.nextInt(89999) + 10000;
        } while (postDao.get(id).isPresent());
        return id;
    }
}