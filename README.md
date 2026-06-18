File .env necessario per runnare il back end

spring.application.name=ProgettoWeb

spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.flyway.enabled=true
logging.level.org.springframework.jdbc.core=DEBUG

spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=openid,email,profile

cloudflare.r2.access-key=${R2_ACCESS_KEY}
cloudflare.r2.secret-key=${R2_SECRET_KEY}
cloudflare.r2.endpoint=${R2_ENDPOINT}
cloudflare.r2.bucket-name=${R2_BUCKET_NAME}
cloudflare.r2.public-url=${R2_PUBLIC_URL}

MAIL_USERNAME=${MAIL_USERNAME}
MAIL_PASSWORD=${MAIL_PASSWORD}

JWT_SECRET=${JWT_SECRET}
google.maps.api.key=${GOOGLE_MAPS_API_KEY}
GROQ_API_KEY=${GROQ_API_KEY}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHANNEL_ID=${TELEGRAM_CHANNEL_ID}
