# Root partition fills up on a snap-based Ubuntu desktop, breaking gdm

- Seen: 2026-10-21, zhu-ye-deng laptop (Yoga Pro 9 16IAH10, Ubuntu, 6.14.0-37)
- What happened: boot failed with "Failed to start gdm.service - GNOME Display Manager".
  The journal showed the real cause: `generate-config: Failed to write file
  "/var/lib/gdm3/greeter-dconf-defaults.XXXX": write() failed: No space left on device`.
  gdm is a victim of a full `/`, not the fault. Recurring: cleared by hand several times
  by deleting caches or apps, always comes back.
- Measurements at the time: `/` = 18.6G partition, 16G used, 2.0G free (89%).
  `/var/lib/snapd` = 7.8G (42% of the whole partition), `/usr` = 5.9G,
  `/opt/google` = 389M, `/var/log` = 202M. Meanwhile `/home` had 96G free
  and a Windows NTFS partition held 756G.
- Root cause: three compounding layers, not a cache problem.
  1. Structural: an ~19G root partition is undersized for a snap desktop. Snaps all live on
     `/` and snapd keeps 2 revisions of each; 24 snaps were installed.
  2. Growth ratchet: every `snap refresh` holds old + new revision at once. With 2.0G free
     and single snaps of 1.67G (kf6-core24) and 520M (code), one refresh can fill the disk.
     1.75G sat in 16 disabled revisions waiting to be reaped.
  3. No journald cap: `/etc/systemd/journald.conf` had no `SystemMaxUse`, so the default is
     10% of the filesystem (~1.9G) — free to eat the last of the space.
- Tried: clearing apt cache / removing apps → worked for days to weeks, then recurred. It buys
  roughly one or two snap-refresh cycles' worth of space and never changes the partition size,
  so the ratchet refills it. Treat as a symptom fix only.
- Tried: `apt-get autoremove` → nothing to reclaim; only one kernel was installed, so old
  kernels were not the cause here (they often are on other machines — check, don't assume).
- Fix that addresses the cause: grow `/` at the expense of the adjacent swap partition.
  Layout was `... | p5 / 18.6G | p6 swap 14.9G | p7 /home |`, and swap held 0B used with 30G
  RAM, so swap was dead weight. Deleting p6, growing p5 rightward to ~27.5G and recreating a
  6G swap needs a live USB and only a new swap UUID in `/etc/fstab` — no data is moved and
  Windows and `/home` are untouched. Prefer this over shrinking the NTFS partition, which
  requires *moving* `/` leftward (slow and far riskier).
- Guardrails to add after resizing: cap journald (`SystemMaxUse=200M`), reap disabled snap
  revisions on a timer, and alert at 85% use so the next fill is visible before gdm dies.
- Diagnosis order that worked, for the next agent: `df -h` and `df -i` first (rule out inode
  exhaustion), then `du -xhd1 /` to stay on one filesystem, then
  `journalctl -b -1 -u <failed unit>` to confirm ENOSPC rather than guessing at the unit.
- Status: open — diagnosed and measured; resize not yet performed.
