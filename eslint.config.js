const expoConfig = require("eslint-config-expo/flat");

module.exports = [{ ignores: ["_backups/**", ".codex/**", ".codex-test-logs/**"] }, ...expoConfig];
