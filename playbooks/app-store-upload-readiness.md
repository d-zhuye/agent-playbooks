# App Store upload readiness checks

A fixed list of 14 checks an agent runs on an iOS app before it builds and uploads to App Store
Connect. Each check gets a pass or fail backed by evidence from the config, the built app or the
build logs, and the report is short enough to read in a few seconds. Written for Expo / EAS
projects, with the equivalent places to look in a plain Xcode project.

**Adopt it when** the project ships an iOS app and someone will upload a build: the first
TestFlight build, every release, or after an SDK or Xcode upgrade.

---

## 1. Why use it

Apple rejects an upload, or emails an ITMS warning, hours after the build finishes, and its
requirements change a few times a year. Without a list, an agent checks whatever comes to mind
and can report "ready" while it skips the icon's alpha channel or a stale minimum SDK. With the
list, every upload is checked the same way, against Apple's current rules.

From the project where this was written (Expo SDK 57 + EAS): all 14 checks took about 10 minutes of agent
time and no human time, because the evidence came from the config, earlier build logs and EAS.
A failed upload, by comparison, costs a build (15–30 min) plus a wait for Apple's email.

---

## 2. How it works

The agent runs the checks below in order, gathers evidence for each, and reports in the format
in section 5. The checks themselves don't change between projects. What changes is what Apple
currently requires, which is why check 1 always looks it up fresh.

### Apple's current requirements

1. **Minimum Xcode and SDK.** Look up Apple's current upload requirement on
   <https://developer.apple.com/news/upcoming-requirements/>, never from memory. Then confirm
   the build used that Xcode and SDK: read the last build log (EAS: the "Xcode" and SDK lines)
   and check that `eas.json` doesn't pin an older `ios.image`.
2. **Minimum deployment target.** The deployment target meets Apple's current minimum iOS
   version. Expo: `ios.deploymentTarget` from `expo-build-properties`, otherwise the SDK
   template's value. Xcode: `IPHONEOS_DEPLOYMENT_TARGET`.

### Assets and Info.plist

3. **App icon.** The icon the config uses now (not one named in an old review) is a
   1024×1024 PNG with no alpha channel. Check it with
   `python3 -c "from PIL import Image; im=Image.open('PATH'); print(im.size, im.mode)"`.
   It passes when the size is `(1024, 1024)` and the mode is `RGB`. An `RGBA` mode fails, even
   if every pixel is opaque.
4. **Privacy manifest.** The app has a `PrivacyInfo.xcprivacy`, and the dependencies that use
   required-reason APIs ship their own. Proof: the last build log or the built `.app` lists the
   privacy bundles. Final proof: no ITMS-91053 email after the upload.
5. **Usage-description strings.** Every permission the app asks for has an
   `NS…UsageDescription` string that says why it's needed. Search the source for permission
   requests, then compare with the generated Info.plist.
6. **Export compliance.** `ITSAppUsesNonExemptEncryption` is set in Info.plist (`false` when
   the app uses only HTTPS or Apple's own encryption). Without it, every build stops at
   "Missing Compliance" in App Store Connect.
7. **Launch storyboard.** `UILaunchStoryboardName` is set and the storyboard exists.
8. **Devices and orientations.** The device family (iPhone, iPad) and
   `UISupportedInterfaceOrientations` match what the app actually supports. An app that turns
   on iPad must work there, because reviewers test it on iPad.

### Identity, versions and signing

9. **Bundle ID.** The release build's bundle ID matches the app's App Store Connect record.
   Watch for variant suffixes like `.dev` or `.preview`.
10. **Version and build number.** The version string is valid (`1.2.3`), and the build number
    is higher than any build already uploaded for that version. EAS:
    `eas build:version:get --platform ios --profile production` and `autoIncrement` in
    `eas.json`.
11. **Signing credentials.** The distribution certificate and the App Store provisioning
    profile are valid and not expired. EAS: a recent store build finished
    (`eas build:list --platform ios`), or `eas credentials`.

### What goes in the binary

12. **No dev tools in release.** No development client, dev menu or debug-only code ships in
    the release build. Expo: `expo-dev-launcher` and `expo-dev-menu` have `"debugOnly": true`
    in their `expo-module.config.json`.
13. **Capabilities and entitlements.** Each capability the app uses has its entitlement, and
    there are no extra entitlements the App ID doesn't allow. Some need Apple's approval first,
    such as StoreKit external purchase.
14. **Third-party SDKs.** SDKs on Apple's list
    (<https://developer.apple.com/support/third-party-SDK-requirements/>) include valid
    signatures and privacy manifests.

### Where to read the generated config (Expo)

`APP_VARIANT=production npx expo config --type introspect --json` prints the Info.plist and
entitlements after every config plugin has run, without writing an `ios/` folder. Set the
release variant's environment variables first, or you'll check the dev build's config.

---

## 3. Setup checklist

- Nothing to install. Python with Pillow, for check 3.
- Expo / EAS projects: run EAS through the project's own script or pinned version
  (`npm run eas -- …` or `npx eas-cli@<version from eas.json>`). A global `eas-cli` that
  doesn't match `cli.version` in `eas.json` fails.
- Optional: keep the last report in the repo (for example `docs/release/upload-readiness.md`)
  so the next run can compare against it.

---

## 4. Agent rule

Paste into `AGENTS.md`:

```md
## Before an App Store upload

Before building for App Store Connect, or when asked whether the app is ready to upload, run the
14 checks in <path to this playbook, or a copy in the repo>. Look up Apple's current
requirements on the web every time, never from memory. Base each pass or fail on evidence from
the current config, the built app or build logs, not on an earlier review. Report in the
playbook's format.
```

- *Look up every time*: the SDK and deployment-target minimums change several times a year.
- *Current config, not an earlier review*: files get renamed, and an old review can point to an
  icon the app no longer uses.

---

## 5. Report format

```md
1) **Minimum Xcode/SDK: pass.** <one sentence of evidence>
2) **App icon: fail.**
   1. <one sentence per thing that failed it>
…
```

One line per check with pass or fail. Under each failed check, an ordered list with one
sentence for each cause. Things that aren't failures but are worth knowing go after the list,
in a sentence or two.

---

## 6. Acceptance test

1. Ask "is the app ready to upload?" without naming this playbook. The agent runs all 14
   checks, searches the web for check 1, and reports in the section 5 format.
2. Change the icon to an RGBA PNG. Check 3 fails and names the alpha channel.
3. Remove `ITSAppUsesNonExemptEncryption`. Check 6 fails.

---

## 7. Gotchas

- **Old evidence.** The first run found that a review from two weeks earlier
  named an icon file the app no longer used. Always check the path in the current config.
- **Expo adds Info.plist keys you didn't write.** `expo-dev-client` adds a local-network usage
  string and the template sets `NSAllowsArbitraryLoads`, even in production. These don't block
  an upload, so mention them as notes, not failures.
- **"hermes" on Apple's SDK list.** React Native maintainers say it refers to a different
  library, not Meta's engine. Watch the first upload for an ITMS warning.
- **The next SDK jump.** When Apple announces a new minimum SDK, check whether the framework
  version needs changes for it (for example, Expo SDK 57 needs scene support turned on to
  launch on iOS 27). Mention it as a note before it's due.

---

## 8. What it does not cover

- App Store Connect metadata: the privacy label, age rating, screenshots, description,
  support and privacy policy URLs, and pricing.
- App Review Guidelines (content, payments, login). This list covers whether the upload goes
  through, not whether review approves it.
- Android and Google Play. A similar list would cover the target API level, the AAB format,
  the data safety form and signing.
