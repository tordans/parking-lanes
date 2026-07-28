# OSM Wiki street parking illustrations

Source: [Street parking](https://wiki.openstreetmap.org/wiki/Street_parking) on the OpenStreetMap Wiki.

| File                        | Wiki file page                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `Parking_position_*.png`    | [File:Parking*position*….png](https://wiki.openstreetmap.org/wiki/Special:PrefixIndex?prefix=Parking_position_&namespace=6)       |
| `Parking_orientation_*.png` | [File:Parking*orientation*….png](https://wiki.openstreetmap.org/wiki/Special:PrefixIndex?prefix=Parking_orientation_&namespace=6) |

Redownload:

```bash
cd app/public/assets/street_parking/wiki
for name in \
  Parking_position_no Parking_position_yes Parking_position_lane \
  Parking_position_street_side Parking_position_on_kerb \
  Parking_position_half_on_kerb Parking_position_shoulder \
  Parking_position_separate \
  Parking_orientation_parallel Parking_orientation_diagonal \
  Parking_orientation_perpendicular
do
  curl -fsSL "https://wiki.openstreetmap.org/wiki/Special:FilePath/${name}.png" -o "${name}.png"
done
```
