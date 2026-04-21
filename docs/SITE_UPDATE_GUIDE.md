# Методичка По Обновлению Сайта

## Ежедневное обновление прайса без пересборки

Теперь для обновления каталога не нужно:

- пересобирать сайт
- перезапускать `pm2`
- делать `git push` для каждого нового Excel

Рабочий путь такой:

1. Открыть страницу администратора:

`/admin/price-list`

2. Ввести токен администратора `ADMIN_PRICE_IMPORT_TOKEN`
3. Выбрать новый `.xlsx`
4. Нажать кнопку загрузки

После этого сервер:

- сохранит новый Excel
- обновит `storage/current-catalog.generated.json`
- обновит файл скачивания `storage/current-price.xlsx`
- сразу покажет новые товары и цены на сайте

Скачивание прайса для клиентов при этом идёт через:

- `/api/price-list`

## Обновление фотографий без пересборки

Теперь архив с фотографиями тоже можно загружать без:

- пересборки сайта
- перезапуска `pm2`
- `git push` для каждого обновления фото

Рабочий путь такой:

1. Открыть страницу администратора:

`/admin/photos`

2. Ввести токен администратора:
- `ADMIN_PHOTO_IMPORT_TOKEN`
- если он не настроен, используется `ADMIN_PRICE_IMPORT_TOKEN`
3. Выбрать `.zip` архив
4. Нажать кнопку загрузки

После этого сервер:

- сохранит архив в `storage/photo-archives`
- обновит `storage/current-product-media.generated.json`
- обновит папку `storage/product-images/articles`
- сразу покажет новые фотографии на сайте

## Что нужно настроить на сервере один раз

В `.env.local` должен быть токен:

```env
ADMIN_PRICE_IMPORT_TOKEN=сложный_секретный_токен
```

После изменения `.env.local`:

```bash
pm2 restart aquamarket --update-env
```

## Одноразовый переход сервера на storage

Если до этого прайс уже обновлялся через старую схему и `git pull` конфликтует с:

- `data/catalog.generated.json`
- `public/files/current-price.xlsx`

сделайте на сервере один раз:

```bash
cd /var/www/html

mkdir -p storage
cp data/catalog.generated.json storage/current-catalog.generated.json
cp public/files/current-price.xlsx storage/current-price.xlsx

git restore data/catalog.generated.json public/files/current-price.xlsx
git pull origin main
npm run build
pm2 restart aquamarket --update-env
```

После этого новые загрузки прайса будут обновлять только `storage/`, и конфликт `git pull` больше не должен повторяться.

## Если нужно обычное обновление кода

### Локально

```bash
cd /Users/danlluxx/web-fish
npm run build
git add .
git commit -m "Обновление сайта"
git push origin main
```

### На сервере

```bash
ssh root@ВАШ_IP_СЕРВЕРА
su - nodejs
cd /var/www/html
git pull
npm install
npm run build
pm2 restart aquamarket
pm2 status
```

## Если нужно обновить фотографии

```bash
cd /Users/danlluxx/web-fish
npm run import:photos
git add .
git commit -m "Обновил фотографии товаров"
git push origin main
```

Потом на сервере:

```bash
cd /var/www/html
git pull
npm run build
pm2 restart aquamarket
```
