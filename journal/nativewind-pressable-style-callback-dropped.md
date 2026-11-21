# NativeWind drops a Pressable style callback on native

- Seen: 2026-09-26, while-we-wait (sticker buttons lost their layout while pressed)
- Seen: 2026-11-11, while-we-wait (Charades scorecard: the Got it / Passed label wrapped under each word on iPhone, but the web snapshot looked right)
- What happened: NativeWind 4's native interop copies the `style` prop with `{ ...declaration }`, so `style={({ pressed }) => [...]}` turns into `{}` on iOS and Android. The row falls back to a column. Web passes the callback through, so web screenshots can't catch it.
- Tried: give the Pressable a static style array and track pressed in state (the project's `StickerPressable`) → worked. A Jest test on the `jest-expo/ios` preset that flattens the row's style catches it, because the native interop runs in Jest.
- Status: worked once
