# Banner photography

All four banners are **CC0** (Creative Commons Zero / public domain
dedication): free for commercial use, no attribution required, no licence fee.
The credits below are recorded for provenance, not obligation.

| File | Subject | Source |
|---|---|---|
| `home.jpg` | Neighbourhood rooftops, Kulmbach old town | [Wikimedia Commons — public domain](https://commons.wikimedia.org/w/index.php?curid=178616195) |
| `services.jpg` | Townhouse block with garages | [StockSnap — "Modern Building", Matt Bango](https://stocksnap.io/photo/modern-building-PK7IF2AJDW) |
| `about.jpg` | Classical apartment facades | [Rawpixel — public domain](https://www.rawpixel.com/image/3299230/free-photo-image-bicycle-apartment-building-architecture) |
| `contact.jpg` | Aerial view of a residential estate | [Rawpixel — public domain](https://www.rawpixel.com/image/3300259/free-photo-image-aerial-view-apparel) |

Found via the [Openverse](https://openverse.org) API, filtered to `cc0,pdm`.

Each was cropped to 1600×900 and saved at JPEG quality 80:

```bash
magick SOURCE.jpg -auto-orient -resize '1600x900^' -gravity center \
  -extent 1600x900 -strip -interlace Plane -quality 80 public/banners/NAME.jpg
```

To swap one, drop a replacement at the same path using that command. These are
generic stock images — photographs of the properties CMNG actually manages
would serve the site far better.
