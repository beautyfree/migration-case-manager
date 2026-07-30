import assert from "node:assert/strict";
import test from "node:test";
import { assertRelease, installationRoot, targetFor } from "../bin/migration-os.mjs";

test("selects every supported native artifact", () => {
  assert.equal(targetFor("darwin", "arm64"), "migration-os-darwin-arm64");
  assert.equal(targetFor("darwin", "x64"), "migration-os-darwin-x64");
  assert.equal(targetFor("win32", "x64"), "migration-os-windows-x64.exe");
  assert.equal(targetFor("win32", "arm64"), "migration-os-windows-arm64.exe");
  assert.equal(targetFor("linux", "x64", { header: { glibcVersionRuntime: "2.31" } }), "migration-os-linux-x64");
  assert.equal(targetFor("linux", "arm64", { header: {} }), "migration-os-linux-arm64-musl");
});

test("rejects unsupported targets and mutable release sources", () => {
  assert.throws(() => targetFor("freebsd", "x64"), /BINARY_UNSUPPORTED_PLATFORM/);
  assert.throws(() => assertRelease("latest"), /BINARY_INVALID_RELEASE_VERSION/);
  assert.throws(() => assertRelease("v0.1.0", "http://example.test"), /BINARY_INVALID_RELEASE_BASE/);
  assert.doesNotThrow(() => assertRelease("v0.1.0-preview.1", "https://example.test/releases"));
});

test("uses the native bootstrap storage conventions", () => {
  assert.equal(installationRoot("linux", {}, "/home/alex"), "/home/alex/.local/share/migration-os");
  assert.equal(installationRoot("win32", { LOCALAPPDATA: "C:\\Users\\Alex\\AppData\\Local" }, "/home/alex"), "C:\\Users\\Alex\\AppData\\Local\\MigrationOS");
  assert.equal(installationRoot("darwin", { MIGRATION_OS_HOME: "/private/migration-os" }, "/home/alex"), "/private/migration-os");
});
