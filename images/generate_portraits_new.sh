#!/bin/bash

sizes=("480" "740" "900" "1120")

for base in portrait2 portrait4 portrait13 portrait14 portrait16; do
  echo "Обрабатываю $base.jpg"

  for size in "${sizes[@]}"; do
    # JPG
    magick "$base.jpg" -resize "${size}x" -quality 90 "$base-$size.jpg"

    # WEBP
    magick "$base-$size.jpg" -quality 82 "$base-$size.webp"

    # AVIF
    magick "$base-$size.jpg" -quality 60 "$base-$size.avif"
  done
done

echo "Готово!"