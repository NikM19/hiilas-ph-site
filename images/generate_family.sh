#!/usr/bin/env bash

# какие исходные файлы обрабатываем (без расширения)
files=(
  family13
  family14
  family15
  family16
  family17
  family18
  family19
  family20
)

# какие ширины делаем
sizes=(480 740 900 1120)

for f in "${files[@]}"; do
  # ищем исходник: .jpg или .jpeg
  if [[ -f "${f}.jpg" ]]; then
    src="${f}.jpg"
  elif [[ -f "${f}.jpeg" ]]; then
    src="${f}.jpeg"
  else
    echo "Источник для $f не найден (.jpg/.jpeg)"
    continue
  fi

  echo "Обрабатываю $src"

  for w in "${sizes[@]}"; do
    # JPEG
    magick "$src" -resize "${w}x" -quality 88 "${f}-${w}.jpg"

    # WEBP
    magick "${f}-${w}.jpg" -quality 90 "${f}-${w}.webp"

    # AVIF
    magick "${f}-${w}.jpg" -quality 50 "${f}-${w}.avif"
  done
done

echo "Готово!"