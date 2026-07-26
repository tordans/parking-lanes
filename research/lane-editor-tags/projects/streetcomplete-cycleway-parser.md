# StreetComplete CyclewayParser — parser & tests

Focused research on the **cycleway tag parser** cited in [AB Street discussion #789](../sources/abstreet-discussion-789.md) (@westnordost, @dabreegster). Not the StreetComplete app UI. **Fetched 2026-07-25.**

| Field | Value |
|-------|-------|
| **Parser** | `app/src/commonMain/kotlin/de/westnordost/streetcomplete/osm/cycleway/CyclewayParser.kt` |
| **Tests** | `app/src/commonTest/kotlin/de/westnordost/streetcomplete/osm/cycleway/CyclewayParserKtTest.kt` |
| **Repo** | https://github.com/streetcomplete/StreetComplete |
| **Author** | @westnordost |

**Note:** Parser moved to Kotlin Multiplatform `commonMain` path (older #789 links under `quests/cycleway/` are obsolete).

---

## API

```kotlin
fun parseCyclewaySides(tags: Map<String, String>, isLeftHandTraffic: Boolean): Sides<CyclewayAndDirection>?
```

Returns `null` if no known cycleway-related keys. Otherwise `Sides(left, right)` each with `Cycleway` enum + `Direction` (FORWARD, BACKWARD, BOTH).

### Related keys scanned

`cycleway`, `cycleway:left`, `cycleway:right`, `cycleway:both`, `bicycle`, `bicycle:forward`, `bicycle:backward`

Expanded via `expandSidesTags` for: `cycleway`, `cycleway:lane`, `cycleway:oneway`, `cycleway:segregated`, `sidewalk:bicycle`, `sidewalk:bicycle:signed`, `sidewalk:oneway:bicycle`.

---

## Parsing rules (high level)

1. **Oneway naked `cycleway=*`:** interpreted as one-sided — `opposite_*` values map to the non-flow side; plain `lane`/`track` to flow side (depends on LHT + `oneway=-1`).
2. **Deprecated `opposite_*` on `cycleway`:** classified `INVALID` (tests lock this); prefer `:left`/`:right`.
3. **`cycleway:lane` subtag:** `exclusive` → EXCLUSIVE_LANE; `advisory` → ADVISORY_LANE; null → UNSPECIFIED_LANE; many values → INVALID.
4. **`shared_lane` + `cycleway:lane`:** advisory → SUGGESTION_LANE; pictogram → PICTOGRAMS.
5. **`track` + `cycleway:segregated=no`:** SIDEWALK_EXPLICIT (non-segregated path).
6. **`no` + sidewalk cycling:** `sidewalk:*:bicycle=yes` + `bicycle:signed=yes` → SIDEWALK_OK; `bicycle=designated` → SIDEWALK_EXPLICIT.
7. **`oneway:bicycle=no` on oneway road:** missing side → NONE_NO_ONEWAY (cyclists may use general lane).
8. **Fallback:** `bicycle=use_sidepath` or `bicycle:forward/backward=use_sidepath` → SEPARATE (unless a side is explicitly tagged).

### Cycleway enum values (output)

`EXCLUSIVE_LANE`, `UNSPECIFIED_LANE`, `ADVISORY_LANE`, `UNSPECIFIED_SHARED_LANE`, `SUGGESTION_LANE`, `PICTOGRAMS`, `TRACK`, `SIDEWALK_EXPLICIT`, `SIDEWALK_OK`, `SEPARATE`, `NONE`, `NONE_NO_ONEWAY`, `BUSWAY`, `SHOULDER`, `INVALID`, `UNKNOWN_*` variants.

---

## Test inventory (~215 `@Test` functions)

Tests are **combinatorial**: most cycleway values × `{bidirectional, oneway=yes, oneway=-1}` × `{RHT, LHT}` × `{naked, :left, :right, :both}`.

### Categories to adopt as fixtures

| Category | Example tags | Why valuable |
|----------|--------------|--------------|
| Direction defaults | `cycleway:both=no` | LHT vs RHT default FORWARD/BACKWARD |
| Explicit oneway | `cycleway:both:oneway=no` | BOTH direction on cycle track |
| Invalid legacy | `cycleway=yes`, `cycleway=opposite_lane` | Reject or map consistently |
| Lane subtypes | `cycleway=lane` + `cycleway:lane=exclusive/advisory` | DE/EN advisory vs exclusive schemes |
| Shared lane | `cycleway=shared_lane`, pictogram/advisory | Sharrows |
| Track / segregated | `cycleway=track`, `cycleway:segregated=no` | Track vs shared foot+cycle path |
| Sidewalk cycling | `sidewalk:left:bicycle=designated` | Berlin-style foot+ cycle |
| Bus shared | `cycleway=share_busway` | Bus lane cycling |
| Shoulder | `cycleway=shoulder`, `cycleway:left=shoulder` | Shoulder cycling |
| Separate | `cycleway=separate`, `bicycle=use_sidepath` | Sidepath relation |
| Oneway exceptions | `oneway=yes` + `oneway:bicycle=no` | NONE_NO_ONEWAY |
| Side-specific | `cycleway:left=lane`, `cycleway:right=track` | Independent sides |
| Dual cycle | `cycleway:left:oneway=no` + `cycleway:left=lane` | Two cycle lanes one side |

### Deprecated opposite tags (still in OSM data)

Tests cover `cycleway=opposite`, `opposite_lane`, `opposite_track`, `opposite_share_busway` — parser returns `INVALID` for naked oneway forms; **`:left`/`:right` forms** have dedicated test sections (~lines 1250+ in test file).

---

## Wiki cross-links

| Topic | EN | DE |
|-------|----|----|
| Cycleways on roads | [Key:cycleway](https://wiki.openstreetmap.org/wiki/Key:cycleway) | [DE:Key:cycleway](https://wiki.openstreetmap.org/wiki/DE:Key:cycleway) |
| Cycleway lane | [Tag:cycleway=lane](https://wiki.openstreetmap.org/wiki/Tag:cycleway%3Dlane) | [DE:Tag:cycleway=lane](https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway%3Dlane) |
| Berlin examples | — | [Berlin/Verkehrswende/Radwege](https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege#Tagging-Beispiele) |

---

## Editor implications

1. **Adopt test matrix** — Port representative `CyclewayParserKtTest` cases into our tag→lanes suite (especially oneway+LHT permutations).
2. **INVALID vs UNKNOWN** — StreetComplete distinguishes ambiguous documented values (INVALID) from typos (UNKNOWN); useful for editor warnings.
3. **No round-trip** — Parser is read-only; pairing with osm2lanes `lanes_to_tags` for cycleways is non-trivial.
4. **Not holistic** — @westnordost (#789): StreetComplete will not edit full lane cross-sections; parser serves survey quests only.

---

## Sources

- https://github.com/streetcomplete/StreetComplete/blob/master/app/src/commonMain/kotlin/de/westnordost/streetcomplete/osm/cycleway/CyclewayParser.kt
- https://github.com/streetcomplete/StreetComplete/blob/master/app/src/commonTest/kotlin/de/westnordost/streetcomplete/osm/cycleway/CyclewayParserKtTest.kt
- https://github.com/a-b-street/abstreet/discussions/789
