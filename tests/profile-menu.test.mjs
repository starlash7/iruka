import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("profile menu exposes Account, Settings, language, and sign out", async () => {
  const [source, styles] = await Promise.all([
    readFile(new URL("../src/ProfileMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/profile-menu.css", import.meta.url), "utf8")
  ]);

  assert.match(source, /className="profile-menu-trigger"/);
  assert.match(source, /Math\.floor\(Math\.random\(\) \* 4\)/);
  assert.match(source, /profile-menu-avatar-\$\{avatarIndex\}/);
  assert.doesNotMatch(source, /src="\/iruka-logo\.png"/);
  assert.match(styles, /profile-idol-sprite\.png/);
  assert.match(styles, /background-size: 200% 200%;/);
  assert.match(styles, /\.profile-menu-avatar-3 \{ background-position: 100% 100%; \}/);
  assert.match(source, /aria-haspopup="menu"/);
  assert.match(source, /role="menu"/);
  assert.match(source, /labels\.account/);
  assert.match(source, /labels\.settings/);
  assert.match(source, /src="\/assets\/iruka-icon-account\.png"/);
  assert.match(source, /src="\/assets\/iruka-icon-settings\.png"/);
  assert.match(styles, /\.profile-menu-item-icon\s*\{[^}]*object-fit:\s*contain;/is);
  assert.match(
    styles,
    /\.profile-menu-item-icon\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;/is
  );
  assert.match(source, /labels\.language/);
  assert.match(source, /labels\.signOut/);
  assert.match(source, /event\.key !== "Escape"/);
  assert.match(source, /window\.addEventListener\("pointerdown"/);
});

test("authenticated language settings move into the profile menu", async () => {
  const [appSource, chromeSource] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AppChrome.tsx", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /authenticated=\{isSignedIn\}/);
  assert.match(
    chromeSource,
    /\{\(walletAuth !== "privy" \|\| !authenticated\) \? \([\s\S]*?className="language-toggle"/
  );
  assert.match(chromeSource, /locale=\{locale\}/);
  assert.match(chromeSource, /onLocaleChange=\{onLocaleChange\}/);
  assert.match(chromeSource, /app-nav-profile/);
  assert.match(chromeSource, /nav-actions-profile/);
});
