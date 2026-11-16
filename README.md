# Room Booking API

## Uruchomienie przez Docker Compose

```bash
git clone https://github.com/geniuszmath75/ztpai-pk.git
cd ztpai-pk
cp .env.example .env
docker compose up --build
```

Migracje uruchamiają się automatycznie przy starcie kontenera API. Swagger UI:

http://localhost:3000/api/docs

Opcjonalny seed z konta ADMIN:

```bash
docker compose exec api npx knex seed:run
```

Zatrzymanie usług:

```bash
docker compose down
```
