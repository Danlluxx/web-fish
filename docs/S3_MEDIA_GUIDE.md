# Медиатека товаров через S3

Цель: фотографии товаров хранятся не на VPS, а в S3/Object Storage. Сервер сайта хранит только JSON-карту:

```text
артикул -> список публичных URL фотографий
```

## 1. Структура папок

В хранилище держим такую структуру:

```text
product-images/
  articles/
    p8901/
      1.webp
      2.webp
    p2571/
      1.webp
```

Папка артикула пишется латиницей:

```text
П8901 -> p8901
Р2536 -> r2536
```

## 2. Переменная окружения

На сервере можно указать публичный адрес медиатеки:

```env
PRODUCT_MEDIA_PUBLIC_BASE_URL=https://example.storage.yandexcloud.net/product-images/articles
```

После изменения `.env.local` перезапустите сайт:

```bash
pm2 restart aquamarket --update-env
```

Если переменная задана, сайт автоматически заменит локальные пути вида:

```text
/api/product-media/articles/p8901/1.webp
```

на:

```text
https://example.storage.yandexcloud.net/product-images/articles/p8901/1.webp
```

## 3. Как обновлять фотографии

1. Подготовить локальную папку с фотографиями по артикулам.
2. Конвертировать фотографии в `.webp`, если нужно.
3. Загрузить папку `articles/` в S3/Object Storage.
4. Сгенерировать манифест:

```bash
python3 scripts/generate_s3_product_media_manifest.py storage/product-images/articles \
  --base-url "https://example.storage.yandexcloud.net/product-images/articles" \
  --output storage/current-product-media.generated.json \
  --source-display-name "S3 media library"
```

5. Загрузить JSON-манифест через админку `/admin/photos`.

## 4. Что остается запасным вариантом

Старый импорт `.zip` через админку продолжает работать. Его можно использовать, если S3 временно недоступен.

Но основной рабочий сценарий теперь такой:

```text
фото -> S3
манифест -> админка
сайт -> читает URL из манифеста
```
