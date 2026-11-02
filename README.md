# Kurt Magastino — Portfolio

Personal portfolio of **Kurt King D. Magastino**, BS Computer Science student at the University of the Cordilleras.

A one-screen-per-section site with a bold red, black and cream design inspired by the energy of Persona 5 (original artwork only; no game assets).

## Sections

| Tab | What's there |
| --- | --- |
| **Home** | Name, "I am a ___" word box, course, portrait |
| **Education** | School ladder: College, Senior High, Junior High, Elementary, with photos and achievements |
| **Experience** | Phone shop repair tech and barangay office assistant (SPES), with photo documentation |
| **Projects** | Norman Cellphone Center, ROBERT0 and POSEIDON, plus B.A.L.O.N.G and Prompt Refiner, with photos and videos |
| **Skills** | Languages, web and apps, AI, hardware, tools and work skills |
| **Contact** | Email, GitHub and a downloadable resume |

## Links

- <https://kurtking.pages.dev> shows the screens assigned in class so far (Home and Education)
- <https://kurtking.pages.dev/full> shows every screen

To open another screen on the main link, add it to `ASSIGNED` at the top of the Screens section in `assets/js/main.js`.

## Features

- Dark and light themes with an angular wipe transition, and a portrait for each
- Persona-style motion: portrait impact, KK logo shuffle, speech-bubble captions
- Tabs, Prev/Next arrows and the ← / → keys to move between sections
- Photo and video viewer for project and work documentation
- Each section fits a single desktop screen; no scrolling
- Plain HTML, CSS and JavaScript; no build step or framework

## Run it locally

Any static file server works. With Python installed:

```bash
python -m http.server 5173
```

Then open <http://localhost:5173>.

## Project structure

```
index.html            Page markup for all six sections
assets/
  favicon.svg         Tab icon (KK monogram)
  css/style.css       Styles and themes
  js/main.js          Section switching, theme switch, ladders, photo viewer
  images/             Web-sized photos, logos and video posters
  video/              Compressed project videos
resume/
  Kurt_Magastino_Resume.pdf
  resume.html         Editable source of the resume (print to PDF)
```

Photos are resized for the web, with location data removed and sensitive details blurred.

## Credits

- Fonts: [Anybody](https://fonts.google.com/specimen/Anybody) and [M PLUS Rounded 1c](https://fonts.google.com/specimen/M+PLUS+Rounded+1c) from Google Fonts
- School logos belong to their respective schools

## Contact

kurtmagastino514@gmail.com · [github.com/kurtking514-byte](https://github.com/kurtking514-byte)
