# Luana Soares — research website

A fast, no-build personal research website for GitHub Pages: **About**, **Publications**, **Tutorials & Pipelines**, and **CV** — with dark mode, search/filters, and mobile layout.

All content lives in simple data files. You never need to touch the HTML.

## 1. Publish it on GitHub Pages (one time, ~5 min)

1. Create a GitHub account if you don't have one.
2. Create a **new public repository** named exactly `YOUR-USERNAME.github.io`.
3. Upload **all files in this folder** (drag-and-drop on the repo page → *Add file → Upload files*), including the hidden `.nojekyll` file.
4. Go to **Settings → Pages**, set *Source* = "Deploy from a branch", *Branch* = `main` / `/ (root)`, and save.
5. After ~1 minute your site is live at `https://YOUR-USERNAME.github.io`.

> Tip: install [GitHub Desktop](https://desktop.github.com/) to edit files on your computer and push changes with one click.

## 2. Where to edit what

| What | File |
|------|------|
| Name, bio, photo, interests, email, Scholar/ORCID/GitHub links | `data/profile.json` |
| News on the home page | `data/news.json` |
| Publications | `data/publications.json` |
| Tutorials & pipelines list | `data/tutorials.json` |
| Tutorial/pipeline content | `tutorials/<slug>.md` (Markdown) |
| CV (web version) | `data/cv.json` |
| CV PDF | `assets/cv/CV.pdf` |
| Your photo | `assets/img/` (then update `photo` in `profile.json`) |
| Colors / fonts | top of `assets/css/style.css` |

### Add a publication
Copy one block in `data/publications.json` and edit it. `type` can be `article`, `preprint`, `conference`, `thesis`, `chapter` or `talk`. Set `"featured": true` to show it on the home page. Leave links you don't have as `""`.

### Add a tutorial or pipeline
**From your GitHub tutorials repository (recommended).** The tutorials live in
<https://github.com/luassoares/genomics-tutorials>, and the website reads each
`README.md` straight from GitHub, so edits you push there appear on the site
automatically. To add a new one, add an entry to `data/tutorials.json` with:
`slug`, `title`, `kind` (`tutorial`, `pipeline` or `setup`), `summary`, `tags`,
`updated`, `series`, `series_repo`, `folder` (the folder name in the repository),
`repo` (link to that folder) and `source` (the raw README link). A copy of the
README in `tutorials/<slug>.md` is used as a backup if GitHub can't be reached.

**Topics and parts.** The big topic and its parts (with their descriptions)
are in `data/tutorial_topics.json`. A tutorial goes into a part when its
`series` in `data/tutorials.json` has exactly the same name as the part.

**Directly on this site.** Write a Markdown file `tutorials/<slug>.md` and add
an entry to `data/tutorials.json` without `source`.

### Update your CV
Replace `assets/cv/CV.pdf`, edit `data/cv.json`, and change the `updated` date.

### Highlight your name in author lists
Edit the `ME` list near the "Publication rendering" section in `assets/js/site.js` with the spellings journals use for your name.

## 3. Preview on your computer

Opening `index.html` by double-click won't load the data (browser security). Instead, in this folder run:

```bash
python3 -m http.server
```

and open <http://localhost:8000>.

> JSON tip: every item except the last in a list needs a comma after `}`. If a page goes blank after an edit, paste the file into <https://jsonlint.com> to find the typo.
