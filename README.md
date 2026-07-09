# H.E.M. Udayanga Srimal — Cyberpunk Portfolio

A futuristic portfolio website built with HTML, CSS, and JavaScript. It showcases a terminal-themed landing page, animated CRT effects, an interactive command prompt, and sections for skills, projects, gallery, and contact.

## Features

- **Cyberpunk terminal UI** with typewriter-style boot text
- **Interactive command prompt** supporting commands like `help`, `about`, `skills`, `projects`, `gallery`, `contact`, `messages`, and `clear`
- **Matrix-style animated background** using canvas
- **Decrypt-on-hover project cards** with event delegation
- **Responsive layout** with CRT scanlines, vignette, and neon glow styling

## Project Structure

- `index.html` — main portfolio page
- `style.css` — all styling, layout, animations, and CRT effects
- `main.js` — interactive terminal, matrix rain, hover decryption, and UI behavior
- `.vscode/` — VS Code launch configuration files
- `computer_vision_feed.png`, `iot_esp32_setup.png` — gallery/assets used by the portfolio

## Usage

1. Open `index.html` in your browser.
2. Or use a static server from the project directory:
   - `npx serve .`
   - `python3 -m http.server 8000`
3. Visit `http://localhost:8000` in your browser.

## Customization

- Update your name in `index.html` at the hero section:
  - `H.E.M. Udayanga Srimal`
- Update your role/title:
  - `Software Engineer · Embedded Systems · AI & Edge Computing`
- Update your projects in the `#projects` section, including links and descriptions.
- Customize skills and section text directly in `index.html`.

## Notes

- This is a static portfolio and does not require a build step.
- The terminal input uses localStorage to read saved messages if the contact form is used.

## Contact

- GitHub: [github.com/udayanga-srimal](https://github.com/udayanga-srimal)

---

Built as a polished, code-driven portfolio experience with a retro-futuristic terminal theme.