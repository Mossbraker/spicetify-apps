(async function () {
  // Wait for Spicetify core
  while (!Spicetify.React || !Spicetify.ReactDOM) {
    await new Promise((r) => setTimeout(r, 50));
  }
  while (!Spicetify.Platform || !Spicetify.LocalStorage || !Spicetify.PopupModal) {
    await new Promise((r) => setTimeout(r, 50));
  }

  const React = Spicetify.React;
  const h = React.createElement;

  // ─── Config Defaults ───
  const CONFIG_PREFIX = "stats:config:";
  const DEFAULT_LASTFM_KEY = "44654ea047786d90338c17331a5f5d95";
  const DEFAULTS = {
    "data-source": "spotify",
    "lastfm-user": "",
    "lastfm-key": DEFAULT_LASTFM_KEY,
    "show-artists": "true",
    "show-tracks": "true",
    "show-albums": "true",
    "show-genres": "true",
    "show-stats": "true",
  };

  // ─── ConfigWrapper ───
  class ConfigWrapper {
    constructor() {
      this.config = {};
      this._load();
    }

    _load() {
      for (const [key, def] of Object.entries(DEFAULTS)) {
        const stored = Spicetify.LocalStorage.get(CONFIG_PREFIX + key);
        this.config[key] = stored !== null && stored !== undefined ? stored : def;
      }
    }

    get(key) {
      return this.config[key];
    }

    set(key, value) {
      this.config[key] = value;
      Spicetify.LocalStorage.set(CONFIG_PREFIX + key, value);
    }

    isPageEnabled(page) {
      return this.config["show-" + page] === "true";
    }

    getDataSource() {
      return this.config["data-source"] === "lastfm" ? "lastfm" : "spotify";
    }

    launchModal() {
      const self = this;
      Spicetify.PopupModal.display({
        title: "Statistics Settings",
        content: h(ConfigModal, { wrapper: self }),
        isLarge: false,
      });
    }
  }

  // ─── Settings Modal Component ───
  function ConfigModal({ wrapper }) {
    const [source, setSource] = React.useState(wrapper.get("data-source") || "spotify");
    const [lfmUser, setLfmUser] = React.useState(wrapper.get("lastfm-user") || "");
    const [lfmKey, setLfmKey] = React.useState(wrapper.get("lastfm-key") || DEFAULT_LASTFM_KEY);
    const [toggles, setToggles] = React.useState({
      "show-artists": wrapper.get("show-artists") === "true",
      "show-tracks": wrapper.get("show-tracks") === "true",
      "show-albums": wrapper.get("show-albums") === "true",
      "show-genres": wrapper.get("show-genres") === "true",
      "show-stats": wrapper.get("show-stats") === "true",
    });

    const saveSource = (val) => {
      setSource(val);
      wrapper.set("data-source", val);
    };

    const saveLfmUser = (val) => {
      setLfmUser(val);
      wrapper.set("lastfm-user", val);
    };

    const saveLfmKey = (val) => {
      setLfmKey(val);
      wrapper.set("lastfm-key", val);
    };

    const saveToggle = (key) => {
      const next = !toggles[key];
      setToggles((prev) => ({ ...prev, [key]: next }));
      wrapper.set(key, next ? "true" : "false");
    };

    const pageNames = {
      "show-artists": "Top Artists",
      "show-tracks": "Top Tracks",
      "show-albums": "Top Albums",
      "show-genres": "Top Genres",
      "show-stats": "Stats Overview",
    };

    return h("div", { className: "stats-config" },
      // Data Source selector
      h("div", { className: "stats-config-row" },
        h("label", { className: "stats-config-label" }, "Data Source"),
        h("div", { className: "stats-config-desc" }, "Choose where to fetch your listening data from"),
        h("div", { className: "stats-config-source-btns" },
          h("button", {
            className: "stats-config-source-btn" + (source === "spotify" ? " stats-config-source-btn--active" : ""),
            onClick: () => saveSource("spotify"),
          }, "Spotify"),
          h("button", {
            className: "stats-config-source-btn" + (source === "lastfm" ? " stats-config-source-btn--active" : ""),
            onClick: () => saveSource("lastfm"),
          }, "Last.fm")
        )
      ),

      // Last.fm settings (only shown when Last.fm is selected)
      source === "lastfm" && h("div", { className: "stats-config-row", style: { marginTop: "4px" } },
        h("label", { className: "stats-config-label" }, "Last.fm Username"),
        h("div", { className: "stats-config-desc" }, "Your Last.fm username (required for Last.fm data)"),
        h("input", {
          type: "text",
          className: "stats-config-input",
          value: lfmUser,
          placeholder: "Enter your Last.fm username",
          onChange: (e) => saveLfmUser(e.target.value),
          spellCheck: false,
        })
      ),

      source === "lastfm" && h("div", { className: "stats-config-row" },
        h("label", { className: "stats-config-label" }, "Last.fm API Key"),
        h("div", { className: "stats-config-desc" }, "API key for Last.fm (a default is provided)"),
        h("input", {
          type: "text",
          className: "stats-config-input",
          value: lfmKey,
          placeholder: "Enter your Last.fm API key",
          onChange: (e) => saveLfmKey(e.target.value),
          spellCheck: false,
        })
      ),

      // Page toggles
      h("div", { style: { marginTop: "16px" } },
        h("label", { className: "stats-config-label" }, "Visible Pages"),
      ),
      ...Object.entries(pageNames).map(([key, name]) =>
        h("div", {
          key,
          className: "stats-config-toggle-row",
          onClick: () => saveToggle(key),
          style: { cursor: "pointer" },
        },
          h("span", null, name),
          h("button", {
            className: "stats-toggle " + (toggles[key] ? "stats-toggle--on" : ""),
            role: "switch",
            "aria-checked": toggles[key],
          },
            h("span", { className: "stats-toggle-knob" })
          )
        )
      )
    );
  }

  // ─── Expose to index.js ───
  const configWrapper = new ConfigWrapper();
  window.StatsConfig = configWrapper;

  console.log("[stats] extension.js ready, source:", configWrapper.getDataSource());
})();
