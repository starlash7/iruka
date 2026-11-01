# Adopted original story artwork

Source: `starlash7/crack` at `58545d092ffef20d1b44e6d8ada6ee5e001fd310`.
The 24 public original files are copied byte for byte; SHA-256, role and source path are
recorded in `approved-story-assets.json`. No competitor branding, private account
data, prompts, unadopted cards, ending art or spoiler scenes are included.

- Office: adopted D cover (`art/thumbnail-v3/README.md`), six canonical profile
  images (`art/production-v1/README.md`), the specifically selected public
  `intro-v2` introduction set, and the canonical O03 opening image.
- 2096: adopted spine-first static 2:3 cover (`visuals/cover-yellow-v2/README.md`),
  the seven canonical portraits (front-facing revisions for Sora/Sekyung), and
  selected Cherry A introduction (`visuals/character-splashes-v5/README.md`).
  The six other introduction cards remain excluded as individually unconfirmed.

Five adopted Chaeri reaction WebP files are separately recorded in
`approved-private-assets.json` and stored under `seed/media/`, never `public/`.
Adoption is explicit in `art/expressions-v1/README.md`; the other 25 reactions are
excluded. They are bound to private media URLs and served only after the normal
owner/public-reference/pinned-chat authorization. Their WebP bytes are preserved
and served as `image/webp`; ordinary uploads remain normalized PNGs. No storage
write is needed for this immutable, hash-verified bundled set.

The Vite development server denies raw seed/ paths (including /@fs aliases), so
private image files and manuscript JSON cannot bypass the media API through its
static file server. Intentionally public files under public/stories remain served.

`work.json` manuscripts and existing seed hashes are preserved. Each
`presentation.json` declares explicit public images and captions. After a local
seed import, artwork can be deliberately attached with Node 24:

```
node --experimental-strip-types scripts/seed/attach-artwork.ts --development
```

The command refuses a remote/production target, mismatched seed source or an
edited draft. It creates a new publication and preserves old pinned versions;
repeating the same attachment is a no-op. This task does not run this command
against the user's actual DB, per the latest instruction.
