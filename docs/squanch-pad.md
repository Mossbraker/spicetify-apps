I use the spicetify app 'Stats' in this repo and, like many users, I am getting this error:
Error
Failed to fetch the info from server. Try again later.
This is reported by other users in Issue [#236](https://github.com/harbassan/spicetify-apps/issues/236) and Issue [#237](https://github.com/harbassan/spicetify-apps/issues/237).
Any insight into cause and potential fixes?


---

You are still in planning mode while we clarify a few things.

Further Considerations:
1. Since this isn't my repo, it's hard to say. Would adding the p-limit npm package be a potential point of contention for the project owner? Should I implement a simple custom batching utility to avoid new dependencies?
2. Yes, that sounds like a good idea.
3. Okay, well since this isn't my project and beyond the scope of this bug, we won't worry about that.


---

Further Considerations:
1-2. Go with whatever you think is best practice here.

Please keep this in mind:
The fix must be targeted, min diff, and make no changes to unrelated code. Where relevant, the code should be self-documenting, with comments explaining non-obvious changes (or wherever necessary). The fix should not introduce any new issues or side effects. As much as possible, the fix should follow existing code style and conventions used in the surrounding code. Since this is not my codebase, the PR should avoid any opinionated changes or refactors, and should be narrowly focused on resolving the reported problem, while being straightforward and easy to review.


---

In the Windows Spotify app, F12 does nothing.

1. All pages
2. I had my Last.fm API key and username input in the settings, but did not have 'Use Last.fm for Stats' enbabled. I tried removing my Last.fm API key and username, but this made no difference.
3. No console with F12.


---

So, what's the best/proper fix here? I would think the main spicetify app needs to implement some sort of API routing that all extensions/custom apps are routed through. Is there a better way?

---

So, I tried waiting to see if the stats app will eventually work but it didn't (I didn't expect it to because I've previously had long sessions and the stats app doesn't ever work at any point.).

After the previous console log I gave you, I waited ~10 min, cleared the console, and focused on Spotify window again. Here's the new log:

---

The website you provided is a 404 error.
But, to chect if my account is blocked from these endpoints entirely: if I go to a website like https://www.statsforspotify.com/track/top and connect my account, all the stats work.

If I disable all other extensions temporarily, is there an easy way to enable them all again? DFo I need to print out a list? Do I need to know them all and track them down manually? What's the workflow here?

---

Before running:

```
spicetify config extensions ""
spicetify config custom_apps stats
spicetify apply
```

C:\Users\hotpi>spicetify config extensions
shuffle+
sortByPlayCount
fullAlbumDate

C:\Users\hotpi>spicetify config custom_apps
marketplace
stats
library
new-releases
reddit
lyrics-plus

After:

C:\Users\hotpi>spicetify config extensions

C:\Users\hotpi>spicetify config custom_apps
marketplace
stats
library
new-releases
reddit
lyrics-plus

Still immidiate 429, but all my custom_apps are still installed.

---

Can you search the web for any info on whether Spotify is blocking these endpoints entirely for the desktop client's internal API (CosmosAsync) or not?

Further Considerations:
Let's be as conservative as possible. If we can get the stats app working at all, we can look at lowering intervals to reduce delay.

---


Further Considerations:
1. 1s is fine for now to see if this fix even works.
2. Okay, please verify.
3. Is there an mcp server I can install to give you web search capability?

I'll take you out of plan mode after this

---

I tried adding added the brave mcp server:
$ npx -y @smithery/cli install brave
* Install MCP server

? Select client: vscode
✔ Successfully resolved brave
* Installing remote server. Please ensure you trust the server author, especially when sharing sensitive data.
? Your API key (required) *******************************
? Would you like to add optional configuration? No
✖ Failed to install brave
Error: Failed to save configuration to keychain: Cannot autolaunch D-Bus without X11 $DISPLAY

So I manually added the info to `.vscode/mcp.json`. Not sure if this will work though, or where to put the api key.

---

Okay, hopefully the brave mcp server works now. limits are:
1 request per second
2,000 requests per month

Before we leave planning mode, search the web for any info on whether Spotify is blocking these endpoints entirely for the desktop client's internal API (CosmosAsync) or not.

---

Okay let's try implementing with your revised steps.

Once you are finished, detail how one would implement OAuth - Register a proper Spotify Web API app and use external OAuth authentication (like statsforspotify.com does - a major architectural change). This would normally be a lot of work, but with an agent like you could be quite a quick fix potentially). Also seach the web / github to see if there are any project such as or similar to statsforspotify.com with public code, which would make the implementation much quicker/easier.

---

Compile with the latest changes, so I can test.

Re: OAuth:
Rather than replacing the project's current method of retrieving stats with OAuth, it would be better to add an option in the Stats app's settings menu. Something like 'Use OAuth for Stats' or whatever.

1. You said 'fork alihan/statify or use code from your_spotify'. Which would be the better approach?
2. What is the best option? Are these things you can competently and securely code yourself?
3. okay.

After compile don't change any code / begin implementing OAuth.

---

Still straight to 429. But, as you noted, I may have up to 24h before rate limits expire.

"User registers their own Spotify Developer App (free)"
    - This would be fine if I was building the app just for myself. But if I'm pushing a PR I don't think this is user friendly enough.

---

Can you write me an issue for spicetify/cli that details the issue, cause, possible solutions, etc. and includes all relevant info and reliable sources?

I doubt harbassan will want to commit to hosting/maintaining infrastructure.

Let's plan and build the version that requires User registers their own Spotify Developer App (free). I'm going to make a fork and test it for personal use and use it if it works well.

---

okay lets do it. Should we fork now, or after?

---

If I go to https://developer.spotify.com/dashboard, I can't click 'Create app' because it is greyed out. There is a tooltip that says: 'Note: New integrations are currently on hold while we make updates to improve reliability and performance.' Does this mean no APIs for now?

If so, let's push this to a new branch on my fork (https://github.com/Mossbraker/spicetify-apps)and consider an alternative approach.

You said 'harbassan will want to commit to hosting/maintaining infrastructure.' If I'm building this for personal use, is this something I can host for myself only on my personal computer while I'm running spotify with spicetify on that same pc? Or am I still going to need an API key?

---

Are there any sites like statsforspotify.com that have an api I could use to display their stats in spotify? Could I piggyback on a site like that even if they don't have an api?

I do scrobble to LastFM consistently, but haven't always, so that isn't a very good alternative.

Are there any other possible hack-y workarounds?

---

Does this workaround seem safe, or is this something Spotify might detect, dislike, and ban an accout for?

---

Okay. Did you already make the changes? If so, how can I use it? Has it been compiled?

---

Getting error in attached image.

Console:
spicetifyWrapper.js:515 [spicetifyWrapper] Waiting for required webpack modules to load
xpui-modules.js:1 Error: Unexpectedly hit unreachable code! Unhandled discriminated union member: false
    at i (xpui-modules.js:1:1037254)
    at r (xpui-modules.js:1:1037384)
    at xpui-modules.js:1:5452138
    at Wa (xpui-modules.js:1:5452148)
    at Object.factory (xpui-modules.js:1:6283397)
    at E.resolveImpl (xpui-modules.js:1:123359)
    at E.resolve (xpui-modules.js:1:122899)
    at addMissingPlatformAPIs (spicetifyWrapper.js:337:52)
r @ xpui-modules.js:1
favicon.ico:1  Failed to load resource: net::ERR_NAME_NOT_RESOLVED
spicetifyWrapper.js:536 [spicetifyWrapper] All required webpack modules loaded
guc3-spclient.spotify.com/remote-config-resolver/v3/configuration:1  Failed to load resource: the server responded with a status of 404 ()
xpui-modules.js:1 provider:transport resolve error k Object
f @ xpui-modules.js:1
xpui-modules.js:1 Error: Minified React error #200; visit https://reactjs.org/docs/error-decoder.html?invariant=200 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at t.createPortal (xpui-modules.js:1:1483151)
    at It (spicetify-routes-stats.js:4:107920)
    at pa (xpui-modules.js:1:1416792)
    at Tc (xpui-modules.js:1:1475797)
    at hl (xpui-modules.js:1:1465033)
    at fl (xpui-modules.js:1:1464961)
    at pl (xpui-modules.js:1:1464824)
    at tl (xpui-modules.js:1:1461659)
    at el (xpui-modules.js:1:1460214)
    at v (xpui-modules.js:1:4637679)Caused by: React ErrorBoundary Error: Minified React error #200; visit https://reactjs.org/docs/error-decoder.html?invariant=200 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at It (spicetify-routes-stats.js:4:107840)
    at jt (spicetify-routes-stats.js:4:108683)
    at div
    at Rt (spicetify-routes-stats.js:4:110000)
    at render
    at R (xpui-modules.js:1:7180032)
    at F (xpui-modules.js:1:7183698)
    at P_ (xpui-snapshot.js:1:252720)
    at Suspense
    at h (xpui-modules.js:1:1529181)
    at Suspense
    at c (xpui-modules.js:1:4990802)
    at l (xpui-modules.js:1:4990877)
    at main
    at xpui-snapshot.js:1:48904
    at div
    at div
    at xpui-modules.js:1:1254070
    at pi (xpui-modules.js:1:1254824)
    at div
    at div
    at oa (xpui-snapshot.js:1:51424)
    at div
    at Vn (xpui-snapshot.js:1:49276)
    at div
    at vy (xpui-snapshot.js:1:226601)
    at Om (xpui-snapshot.js:1:189491)
    at s (xpui-modules.js:1:4432205)
    at Lp (xpui-snapshot.js:1:171650)
    at jr (xpui-snapshot.js:1:61680)
    at l (xpui-modules.js:1:1159781)
    at t (xpui-modules.js:1:2899397)
    at I (xpui-modules.js:1:5077520)
    at Suspense
    at am
    at a (xpui-modules.js:1:4985294)
    at l (xpui-modules.js:1:2967193)
    at l (xpui-modules.js:1:7970206)
    at l (xpui-modules.js:1:8601)
    at c (xpui-modules.js:1:7411683)
    at Xt (xpui-snapshot.js:1:44861)
    at Up (xpui-snapshot.js:1:175487)
    at c (xpui-modules.js:1:1112357)
    at Suspense
    at tn (xpui-snapshot.js:1:45031)
    at a (xpui-modules.js:1:1148614)
    at a (xpui-modules.js:1:224710)
    at l (xpui-modules.js:1:2751666)
    at At (xpui-snapshot.js:1:42249)
    at Xy (xpui-snapshot.js:1:234529)
    at nx (xpui-snapshot.js:1:239305)
    at S (xpui-modules.js:1:3843547)
    at E (xpui-modules.js:1:2385975)
    at l (xpui-modules.js:1:4989898)
    at d (xpui-modules.js:1:4853103)
    at l (xpui-modules.js:1:4849151)
    at u (xpui-modules.js:1:4084919)
    at m (xpui-modules.js:1:5169639)
    at e (xpui-modules.js:1:4426535)
    at l (xpui-modules.js:1:6806288)
    at E (xpui-modules.js:1:7842174)
    at le (xpui-modules.js:1:4303516)
    at l (xpui-modules.js:1:2844645)
    at At (xpui-snapshot.js:1:42249)
    at l (xpui-modules.js:1:7509240)
    at me (xpui-snapshot.js:1:27607)
    at Mt (xpui-snapshot.js:1:42857)
    at It (xpui-snapshot.js:1:42575)
    at Ct (xpui-snapshot.js:1:42477)
    at a (xpui-modules.js:1:7966317)
    at a (xpui-modules.js:1:7262257)
    at h (xpui-modules.js:1:3941357)
    at s (xpui-modules.js:1:6342754)
    at Spicetify.ReactComponent.PlatformProvider (xpui-snapshot.js:1:41115)
    at a (xpui-modules.js:1:1039232)
    at a (xpui-modules.js:1:1703471)
    at a (xpui-modules.js:1:4763550)
    at a (xpui-modules.js:1:6809594)
    at a (xpui-modules.js:1:4095301)
    at Ne (xpui-snapshot.js:1:29920)
    at c (xpui-modules.js:1:7523826)
    at _t (xpui-snapshot.js:1:42013)
    at a (xpui-modules.js:1:2649317)
    at Nt (xpui-snapshot.js:1:42670)
    at a (xpui-modules.js:1:7883162)
    at Dt (xpui-snapshot.js:1:42933)
    at At (xpui-snapshot.js:1:42249)
    at Spicetify.ReactComponent.PlatformProvider (xpui-snapshot.js:1:43051)
    at z_ (xpui-snapshot.js:1:266956)
    at j (xpui-modules.js:1:4707702)
    at h (xpui-modules.js:1:1529181)
    at Suspense
    at c (xpui-modules.js:1:4990802)
    at l (xpui-modules.js:1:4990877)
    at s (xpui-modules.js:1:4709640)
    at B (xpui-modules.js:1:7183067)
    at Ut (xpui-snapshot.js:1:44039)
    at V_ (xpui-snapshot.js:1:267099)
    at h (xpui-modules.js:1:1529181)
    at Suspense
    at c (xpui-modules.js:1:4990802)
    at l (xpui-modules.js:1:4990877)
    at c (xpui-modules.js:1:7523826)
ss @ xpui-modules.js:1
xpui-modules.js:1 Error: Minified React error #200; visit https://reactjs.org/docs/error-decoder.html?invariant=200 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at t.createPortal (xpui-modules.js:1:1483151)
    at It (spicetify-routes-stats.js:4:107920)
    at pa (xpui-modules.js:1:1416792)
    at Tc (xpui-modules.js:1:1475797)
    at hl (xpui-modules.js:1:1465033)
    at fl (xpui-modules.js:1:1464961)
    at pl (xpui-modules.js:1:1464824)
    at tl (xpui-modules.js:1:1461659)
    at el (xpui-modules.js:1:1460214)
    at v (xpui-modules.js:1:4637679)Caused by: React ErrorBoundary Error: Minified React error #200; visit https://reactjs.org/docs/error-decoder.html?invariant=200 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at It (spicetify-routes-stats.js:4:107840)
    at jt (spicetify-routes-stats.js:4:108683)
    at div
    at Rt (spicetify-routes-stats.js:4:110000)
    at render
    at R (xpui-modules.js:1:7180032)
    at F (xpui-modules.js:1:7183698)
    at P_ (xpui-snapshot.js:1:252720)
    at Suspense
    at h (xpui-modules.js:1:1529181)
    at Suspense
    at c (xpui-modules.js:1:4990802)
    at l (xpui-modules.js:1:4990877)
    at main
    at xpui-snapshot.js:1:48904
    at div
    at div
    at xpui-modules.js:1:1254070
    at pi (xpui-modules.js:1:1254824)
    at div
    at div
    at oa (xpui-snapshot.js:1:51424)
    at div
    at Vn (xpui-snapshot.js:1:49276)
    at div
    at vy (xpui-snapshot.js:1:226601)
    at Om (xpui-snapshot.js:1:189491)
    at s (xpui-modules.js:1:4432205)
    at Lp (xpui-snapshot.js:1:171650)
    at jr (xpui-snapshot.js:1:61680)
    at l (xpui-modules.js:1:1159781)
    at t (xpui-modules.js:1:2899397)
    at I (xpui-modules.js:1:5077520)
    at Suspense
    at am
    at a (xpui-modules.js:1:4985294)
    at l (xpui-modules.js:1:2967193)
    at l (xpui-modules.js:1:7970206)
    at l (xpui-modules.js:1:8601)
    at c (xpui-modules.js:1:7411683)
    at Xt (xpui-snapshot.js:1:44861)
    at Up (xpui-snapshot.js:1:175487)
    at c (xpui-modules.js:1:1112357)
    at Suspense
    at tn (xpui-snapshot.js:1:45031)
    at a (xpui-modules.js:1:1148614)
    at a (xpui-modules.js:1:224710)
    at l (xpui-modules.js:1:2751666)
    at At (xpui-snapshot.js:1:42249)
    at Xy (xpui-snapshot.js:1:234529)
    at nx (xpui-snapshot.js:1:239305)
    at S (xpui-modules.js:1:3843547)
    at E (xpui-modules.js:1:2385975)
    at l (xpui-modules.js:1:4989898)
    at d (xpui-modules.js:1:4853103)
    at l (xpui-modules.js:1:4849151)
    at u (xpui-modules.js:1:4084919)
    at m (xpui-modules.js:1:5169639)
    at e (xpui-modules.js:1:4426535)
    at l (xpui-modules.js:1:6806288)
    at E (xpui-modules.js:1:7842174)
    at le (xpui-modules.js:1:4303516)
    at l (xpui-modules.js:1:2844645)
    at At (xpui-snapshot.js:1:42249)
    at l (xpui-modules.js:1:7509240)
    at me (xpui-snapshot.js:1:27607)
    at Mt (xpui-snapshot.js:1:42857)
    at It (xpui-snapshot.js:1:42575)
    at Ct (xpui-snapshot.js:1:42477)
    at a (xpui-modules.js:1:7966317)
    at a (xpui-modules.js:1:7262257)
    at h (xpui-modules.js:1:3941357)
    at s (xpui-modules.js:1:6342754)
    at Spicetify.ReactComponent.PlatformProvider (xpui-snapshot.js:1:41115)
    at a (xpui-modules.js:1:1039232)
    at a (xpui-modules.js:1:1703471)
    at a (xpui-modules.js:1:4763550)
    at a (xpui-modules.js:1:6809594)
    at a (xpui-modules.js:1:4095301)
    at Ne (xpui-snapshot.js:1:29920)
    at c (xpui-modules.js:1:7523826)
    at _t (xpui-snapshot.js:1:42013)
    at a (xpui-modules.js:1:2649317)
    at Nt (xpui-snapshot.js:1:42670)
    at a (xpui-modules.js:1:7883162)
    at Dt (xpui-snapshot.js:1:42933)
    at At (xpui-snapshot.js:1:42249)
    at Spicetify.ReactComponent.PlatformProvider (xpui-snapshot.js:1:43051)
    at z_ (xpui-snapshot.js:1:266956)
    at j (xpui-modules.js:1:4707702)
    at h (xpui-modules.js:1:1529181)
    at Suspense
    at c (xpui-modules.js:1:4990802)
    at l (xpui-modules.js:1:4990877)
    at s (xpui-modules.js:1:4709640)
    at B (xpui-modules.js:1:7183067)
    at Ut (xpui-snapshot.js:1:44039)
    at V_ (xpui-snapshot.js:1:267099)
    at h (xpui-modules.js:1:1529181)
    at Suspense
    at c (xpui-modules.js:1:4990802)
    at l (xpui-modules.js:1:4990877)
    at c (xpui-modules.js:1:7523826)
Vt @ xpui-modules.js:1

I tried hitting reload a bunch of time and finally got to the loading screen once and enabled "Use Direct Fetch (Experimental)". Didn't work so I restarted. Now I keep hitting reload but still get stuck at the reload page.

---

Can we not fix any errors with:
Your Spotify client version
The spicetify-creator build process
React version mismatches

---

Reload finally worked. But new console logs aren't promising:
spicetifyWrapper.js:515 [spicetifyWrapper] Waiting for required webpack modules to load
favicon.ico:1  GET https://xpui.app.spotify.com/favicon.ico net::ERR_NAME_NOT_RESOLVED
xpui-modules.js:1 Error: Unexpectedly hit unreachable code! Unhandled discriminated union member: false
    at i (xpui-modules.js:1:1037254)
    at r (xpui-modules.js:1:1037384)
    at xpui-modules.js:1:5452138
    at Wa (xpui-modules.js:1:5452148)
    at Object.factory (xpui-modules.js:1:6283397)
    at E.resolveImpl (xpui-modules.js:1:123359)
    at E.resolve (xpui-modules.js:1:122899)
    at addMissingPlatformAPIs (spicetifyWrapper.js:337:52)
r @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Wa @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
resolveImpl @ xpui-modules.js:1
resolve @ xpui-modules.js:1
addMissingPlatformAPIs @ spicetifyWrapper.js:337
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
(anonymous) @ spicetifyWrapper.js:345
spicetifyWrapper.js:536 [spicetifyWrapper] All required webpack modules loaded
xpui-modules.js:1  POST https://guc3-spclient.spotify.com/remote-config-resolver/v3/configuration 404 (Not Found)
M @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
(anonymous) @ xpui-modules.js:1
_tick @ xpui-modules.js:1
start @ xpui-modules.js:1
_sendRetriedRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
_sendRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
_dispatchFromStore @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
a @ xpui-modules.js:1
t @ xpui-modules.js:1
postMessage
c @ xpui-modules.js:1
emit @ xpui-modules.js:1
_connectToEndpoints @ xpui-modules.js:1
Promise.then
_performConnect @ xpui-modules.js:1
_connect @ xpui-modules.js:1
connect @ xpui-modules.js:1
ON @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
resolveImpl @ xpui-modules.js:1
resolve @ xpui-modules.js:1
FN @ xpui-modules.js:1
await in FN
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
xpui-modules.js:1 provider:transport resolve error k {url: 'https://guc3-spclient.spotify.com/remote-config-resolver/v3/configuration', status: 404, headers: L, body: {…}, offline: false, …} {}
f @ xpui-modules.js:1
t.<computed> @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.catch
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
hc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
yc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Lc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Uc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
resolve @ xpui-modules.js:1
FN @ xpui-modules.js:1
await in FN
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
spicetify-routes-stats.js:4  GET https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=long_term 429 (Too Many Requests)
ue @ spicetify-routes-stats.js:4
r @ spicetify-routes-stats.js:4
ce @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
a @ xpui-modules.js:1
_ @ xpui-modules.js:1
start @ xpui-modules.js:1
fetch @ xpui-modules.js:1
#D @ xpui-modules.js:1
onSubscribe @ xpui-modules.js:1
subscribe @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Ia @ xpui-modules.js:1
Qs @ xpui-modules.js:1
_l @ xpui-modules.js:1
rl @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
gl @ xpui-modules.js:1
el @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetify-routes-stats.js:4 stats - topArtists direct fetch failed, falling back to CosmosAsync: {code: 429, message: 'Rate limited. Retry after 3 seconds'}
spicetifyWrapper.js:479  GET https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=long_term 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:479
r @ spicetify-routes-stats.js:4
await in r
ce @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
a @ xpui-modules.js:1
_ @ xpui-modules.js:1
start @ xpui-modules.js:1
fetch @ xpui-modules.js:1
#D @ xpui-modules.js:1
onSubscribe @ xpui-modules.js:1
subscribe @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Ia @ xpui-modules.js:1
Qs @ xpui-modules.js:1
_l @ xpui-modules.js:1
rl @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
gl @ xpui-modules.js:1
el @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetify-routes-stats.js:4 stats - topArtists rate limited (response), retrying in 5000 ms
spicetifyWrapper.js:479  GET https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=long_term 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:479
r @ spicetify-routes-stats.js:4
await in r
ce @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
a @ xpui-modules.js:1
_ @ xpui-modules.js:1
start @ xpui-modules.js:1
fetch @ xpui-modules.js:1
#D @ xpui-modules.js:1
onSubscribe @ xpui-modules.js:1
subscribe @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Ia @ xpui-modules.js:1
Qs @ xpui-modules.js:1
_l @ xpui-modules.js:1
rl @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
gl @ xpui-modules.js:1
el @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetify-routes-stats.js:4 stats - topArtists rate limited (response), retrying in 10000 ms
spicetifyWrapper.js:479  GET https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=long_term 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:479
r @ spicetify-routes-stats.js:4
await in r
ce @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
a @ xpui-modules.js:1
_ @ xpui-modules.js:1
start @ xpui-modules.js:1
fetch @ xpui-modules.js:1
#D @ xpui-modules.js:1
onSubscribe @ xpui-modules.js:1
subscribe @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Ia @ xpui-modules.js:1
Qs @ xpui-modules.js:1
_l @ xpui-modules.js:1
rl @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
gl @ xpui-modules.js:1
el @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetify-routes-stats.js:4 stats - topArtists rate limited (response), retrying in 20000 ms

---

Okay. Well, as you said before LastFM mode still makes Spotify API calls. Can you make a new, separate version, that has it's own 'Use LastFM Only' toggle that only uses LastFM?

---

Currently getting:
Loading
Please wait, this may take a moment

Console:
spicetifyWrapper.js:515 [spicetifyWrapper] Waiting for required webpack modules to load
favicon.ico:1  Failed to load resource: net::ERR_NAME_NOT_RESOLVED
xpui-modules.js:1 Error: Unexpectedly hit unreachable code! Unhandled discriminated union member: false
    at i (xpui-modules.js:1:1037254)
    at r (xpui-modules.js:1:1037384)
    at xpui-modules.js:1:5452138
    at Wa (xpui-modules.js:1:5452148)
    at Object.factory (xpui-modules.js:1:6283397)
    at E.resolveImpl (xpui-modules.js:1:123359)
    at E.resolve (xpui-modules.js:1:122899)
    at addMissingPlatformAPIs (spicetifyWrapper.js:337:52)
r @ xpui-modules.js:1
spicetifyWrapper.js:536 [spicetifyWrapper] All required webpack modules loaded
guc3-spclient.spotify.com/remote-config-resolver/v3/configuration:1  Failed to load resource: the server responded with a status of 404 ()
xpui-modules.js:1 provider:transport resolve error k Object
f @ xpui-modules.js:1
spicetify-routes-stats.js:4 stats - lfmTopArtists fetch time: 885.6000000089407

Also, it appears the spicetify dev is very aware and grumpy about the issue and wants everyone to f off about it https://github.com/spicetify/cli/issues/3670

---

Sorry, I had to stop you. The:

Loading
Please wait, this may take a moment

was accurate. Just took longer than I expected.

But it appears the spicetify dev is very aware and grumpy about the issue and wants everyone to f off about it https://github.com/spicetify/cli/issues/3670

---

Artists:
All time seems to work.

---

Not sure if it's fully working, but it doesn't really matter. I guess my last.fm account stopped auto-scrobbling at some point. I just reconnected my accounts now, but my history is incomplete. 

Create a detailed .md with all the extensive research of everything we looked into this session. What worked, what didn't work, why, etc. Include all known issues, limitations, the spicetify dev's knowledge and opinion on it all, etc. And then commit and push to my github fork. Thank you!

---

In the issue I previously linked (https://github.com/spicetify/cli/issues/3670), the spicetify dev says:
'Quote: "There is information on our docs about CosmosAsync that you should only use it for internal endpoints"

I said what I said. I won't repeat myself. You also keep talking like it's CosmosAsync issue anyway when it's not.'
Is this an accurate statement?
It seems to imply the issue isn't that CosmosAsync should only be used for internal endpoints, that CosmosAsync overuse is not the cause of the 429 issues.

---

Okay, so it's not CosmosAsync specific. But this could still be handled better if spicetify routed all API requests, rather than allowing all extensions, custom apps, etc. to do whatever they want, right? It's not a spicetify bug, but they could make the experience better for users?


---

I was working with another agent to bypass Spotify's rate limits for the stats custom app for spicetify. We had fully implemented it, but I couldn't test it because Spotify had closed new app registrations at the time, but it's open again now. I'm unable to test anything though because the rate limiting prevents the app from even loading (see attached screenshot). So, I think I need to change the default settings for the stats app so it doesn't automatically try running with the rate limited API requests

---

I can't toggle it in the settings panel, because it does the whole immediately firing rate-limited Spotify API calls thing, preventing the settings button from showing. Do I need to do a fresh install? If so, do a rebuild with the new default setting.

---

In order to create an app for spotify and get an API key, I need to add Redirect URIs - what am I supposed to put here?

---

Can get into settings now. Attached an image of the URI it specifies. This URI isn't allowed by spotify, as it says it is not secure. I can do something like 
http://127.0.0.1:5173/callback though

---

Now I'm getting:
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=short_term 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
await in a
oe @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
setTimeout
o @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
batch @ xpui-modules.js:1
#s @ xpui-modules.js:1
setData @ xpui-modules.js:1
fetch @ xpui-modules.js:1
await in fetch
#U @ xpui-modules.js:1
fetch @ xpui-modules.js:1
refetch @ xpui-modules.js:1
onFocus @ xpui-modules.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
batch @ xpui-modules.js:1
onFocus @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-modules.js:1
onFocus @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
t @ xpui-modules.js:1
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=short_term 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
await in a
oe @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
setTimeout
o @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
batch @ xpui-modules.js:1
#s @ xpui-modules.js:1
setData @ xpui-modules.js:1
fetch @ xpui-modules.js:1
await in fetch
#U @ xpui-modules.js:1
fetch @ xpui-modules.js:1
refetch @ xpui-modules.js:1
onFocus @ xpui-modules.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
batch @ xpui-modules.js:1
onFocus @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-modules.js:1
onFocus @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
t @ xpui-modules.js:1

Is it even using the Developer API that I added?

---

Okay, some things are working now. The Artists and Tracks tabs both seem to work. The other 4 tabs have some issues. See below


xpui-modules.js:1 Error: Unexpectedly hit unreachable code! Unhandled discriminated union member: false
    at i (xpui-modules.js:1:7041740)
    at r (xpui-modules.js:1:7041870)
    at xpui-modules.js:1:3265101
    at Ra (xpui-modules.js:1:3265111)
    at Object.factory (xpui-modules.js:1:3763558)
    at E.resolveImpl (xpui-modules.js:1:4753055)
    at E.resolve (xpui-modules.js:1:4752595)
    at addMissingPlatformAPIs (spicetifyWrapper.js:339:52)
r @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Ra @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
resolveImpl @ xpui-modules.js:1
resolve @ xpui-modules.js:1
addMissingPlatformAPIs @ spicetifyWrapper.js:339
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
(anonymous) @ spicetifyWrapper.js:347
extension.js:8  GET https://api.github.com/search/repositories?per_page=100&q=topic%3Aspicetify-themes 403 (Forbidden)
(anonymous) @ extension.js:8
aa @ extension.js:8
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
extension.js:8  GET https://api.github.com/search/repositories?per_page=100&q=topic%3Aspicetify-extensions 403 (Forbidden)
(anonymous) @ extension.js:8
aa @ extension.js:8
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
extension.js:8  GET https://api.github.com/search/repositories?per_page=100&q=topic%3Aspicetify-apps 403 (Forbidden)
(anonymous) @ extension.js:8
aa @ extension.js:8
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
xpui-modules.js:1  GET https://api.spotify.com/v1/browse/categories?limit=10&offset=0&locale=en_US&market=from_token 429 (Too Many Requests)
M @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
(anonymous) @ xpui-modules.js:1
_tick @ xpui-modules.js:1
start @ xpui-modules.js:1
_sendRetriedRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
_sendRequest @ xpui-modules.js:1
request @ xpui-modules.js:1
send @ xpui-modules.js:1
send @ xpui-modules.js:1
sa @ made-for-you-shortcut.js?time=1773892130933:14
$t @ made-for-you-shortcut.js?time=1773892130933:1
await in $t
(anonymous) @ made-for-you-shortcut.js?time=1773892130933:14
(anonymous) @ made-for-you-shortcut.js?time=1773892130933:14
(anonymous) @ made-for-you-shortcut.js?time=1773892130933:14
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
xpui-modules.js:1  POST https://guc3-spclient.spotify.com/remote-config-resolver/v3/configuration 404 (Not Found)
M @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
(anonymous) @ xpui-modules.js:1
_tick @ xpui-modules.js:1
start @ xpui-modules.js:1
_sendRetriedRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
_sendRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
_dispatchFromStore @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
a @ xpui-modules.js:1
t @ xpui-modules.js:1
postMessage
c @ xpui-modules.js:1
emit @ xpui-modules.js:1
_connectToEndpoints @ xpui-modules.js:1
Promise.then
_performConnect @ xpui-modules.js:1
_connect @ xpui-modules.js:1
connect @ xpui-modules.js:1
gy @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
resolveImpl @ xpui-modules.js:1
resolve @ xpui-modules.js:1
My @ xpui-modules.js:1
await in My
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
xpui-modules.js:1 provider:transport resolve error k {url: 'https://guc3-spclient.spotify.com/remote-config-resolver/v3/configuration', status: 404, headers: L, body: {…}, offline: false, …} {}
f @ xpui-modules.js:1
t.<computed> @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.catch
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Qs @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
oc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
hc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
_c @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
resolve @ xpui-modules.js:1
My @ xpui-modules.js:1
await in My
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
xpui-modules.js:1 Uncaught (in promise) Error: enqueueSnackbar called with invalid argument
    at t.enqueueSnackbar (xpui-modules.js:1:2312774)
    at Spicetify.showNotification (spicetifyWrapper.js:1282:24)
    at extension.js:8:1208
    at async aa (extension.js:8:654)
    at async Promise.all (index 1)
    at async extension.js:10:1460
enqueueSnackbar @ xpui-modules.js:1
Spicetify.showNotification @ spicetifyWrapper.js:1282
(anonymous) @ extension.js:8
await in (anonymous)
aa @ extension.js:8
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
xpui-modules.js:1 Uncaught (in promise) HttpResponseError
    at i.fromResponse (xpui-modules.js:1:4453543)
    at e.onAfterSend (xpui-modules.js:1:6065563)
    at xpui-modules.js:1:4991799
    at async sa (made-for-you-shortcut.js?time=1773892130933:14:4403)
    at async $t (made-for-you-shortcut.js?time=1773892130933:1:100026)
    at async made-for-you-shortcut.js?time=1773892130933:14:730
fromResponse @ xpui-modules.js:1
e.onAfterSend @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.catch
send @ xpui-modules.js:1
sa @ made-for-you-shortcut.js?time=1773892130933:14
$t @ made-for-you-shortcut.js?time=1773892130933:1
await in $t
(anonymous) @ made-for-you-shortcut.js?time=1773892130933:14
(anonymous) @ made-for-you-shortcut.js?time=1773892130933:14
(anonymous) @ made-for-you-shortcut.js?time=1773892130933:14
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/me 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
(anonymous) @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:879
fetchUserMarket @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:890
main @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:36193
await in main
(anonymous) @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:36244
(anonymous) @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:36246
fc210f45-cfef-49c9-bf4f-ffbc40dbb040:888 [Sort-Play] FATAL: Could not determine user's market. Track availability checks may be inaccurate.
(anonymous) @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:888
await in (anonymous)
fetchUserMarket @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:890
main @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:36193
await in main
(anonymous) @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:36244
(anonymous) @ fc210f45-cfef-49c9-bf4f-ffbc40dbb040:36246
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/artists/1dfeR4HaWDbWqFHLkxsg1d?locale=EN_en 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
i @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
setTimeout
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
e @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:40
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
whatsThatGenre.js?time=1773892130931:5 Uncaught (in promise) TypeError: t is not iterable
i @ whatsThatGenre.js?time=1773892130931:5
await in i
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
setTimeout
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
e @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:5
(anonymous) @ whatsThatGenre.js?time=1773892130931:40
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
spicetify-routes-stats.js:4  GET https://api.spotify.com/v1/audio-features?ids=40F3i6gKdUibqjyZdW1o4D,6FB3v4YcR57y4tXFcdxI1E,6lrQo6KAYvb92MGk6ZuZlt,2ag1oJvKdEt4JObHRcdZWE,4KULAymBBJcPRpk1yO4dOG,2WRFD9WczJ975X2K1Y9YVs,3YRNCPqg75VeZ3wtN3KY3Z,6M0IsaUX4GNyto4niSegfI,3FIvCLgCbhOW1MRnh4Wn2T,3c91jaNIbYoS4PTueNeH6q,0QZwfrjDdVGKjKfIzopBfL,1gkhXnZAFfaHB78oV8pDXV,2PLqbVr0N1QKyDAq67g43M,5aqlAwqKApcEjHWto6VNdx,5lqyqPU3JkpCbUbLmTVQPW,7fRruZ12gXGwBs0zXQ6e5V,3y4oFrifsZaSUib1QhDhmv,2QMV9Kj5BFo8kjggLVHf86,09DR0sHnQUhHOiSNttc1mv,5UW4tA4j23YL6kDfRw3rWT,12EkF8uGofptstVIX7Oc0C,3HTLIvqe7MoSlsqw2DAynt,4CD4GfHOwo5ZP4FkIMTK6j,4LKYOetuIF5c9XjeLBL9av,6QXxmGsc0A2PG3alWT5bYi,09ebrkUKSLYAycT5DVPgjg,0CGMppRyZeAXdfaBcj7cMv,0KIpuVYhKUUUpjo6H5NvBY,0PzEqBOcfOMU9FZRjeNiz0,0TPS1dKI4m27xCxm7jF7SU,0pQvGy1DmlJcBTDIyTVKUK,0wIpjjcXFgGtJUmBIRAAju,10nyNJ6zNy2YVYLrcwLccB,1AKKVEylH3YPYm64MTzl7M,1Cz7QWaBJJcabdMqZxXwj9,1HfB7BLeW5XXIJ9sjCaL5U,1fXvxcQdz9OEe5IeNHQh72,1u8c2t2Cy7UBoG4ArRcF5g,1wSioaXBQufQTA5E0XJ1mi,1zb9cdsTMrEEL2Ut8rmTb6,259UpfomIaTr9PdBvR6R1c,2ZQKQJYnXbXKrgPZ1vLmiE,2ckYkLkKMdJ856YBmWpyZC,2tMPLJ8nmRARNXC7r2hDIq,34iOH7LY3vme5rQxsVILZ4,3BYKlVp3QPrUcfnZWyqO0K,3CWkXu2k702yk8s5cdzw5O,3QfM4MDEKsi07YzqynN7EU,3ShIGvHRm0q9iIDowUMjls,3cR7U1X3jcKaws71L3gZbc 403 (Forbidden)
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
a @ spicetify-routes-stats.js:4
se @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Je @ spicetify-routes-stats.js:4
bt @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetify-routes-stats.js:4  GET https://api.spotify.com/v1/artists?ids=3POLaElL9MR68BopYmink1 403 (Forbidden)
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
a @ spicetify-routes-stats.js:4
ce @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
et @ spicetify-routes-stats.js:4
bt @ spicetify-routes-stats.js:4
await in bt
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetify-routes-stats.js:4  GET https://api.spotify.com/v1/artists?ids=06HL4z0CvFAxyc27GXpf02,08GQAI4eElDnROBrJRGE0X,5e1BZulIiYWPRm8yogwUYH,7lOJ7WXyopaxri0dbOiZkd,1hLiboQ98IQWhpKeP9vRFw,12zbUHbPHL5DGuJtiUfsip,1r1uxoy19fzMxunt3ONAkG,07D1Bjaof0NFlU32KXiqUP,6ws5XBA70XgeBpnLZhQBoy,4wEVY6Zz9STrspLNOmyz50,1yAwtBaoHLEDWAnWR87hBT,40ZNYROS4zLfyyBSs2PGe2,70kkdajctXSbqSMJbQO424,3TNt4aUIxgfy9aoaft5Jj2,246dkjvS1zLTtiykXe5h60,6W1BHDF0T4a4KYcSwzD586,0JDkhL4rjiPNEp92jAgJnS,5H9IFTRxSICj24uxO15ScU,4mO4aGO6u29UyR6XLZR9XW,5uMNhVG30JzeZ5xtPb1tqR,2d6JU9LvNhZR7AAtu4x2rS,225Tr2NNMQspzjFVRneBJ8,2ye2Wgw4gimLv2eAKyk1NB,0hYxQe3AK5jBPCr5MumLHD,1M3BVQ36cqPQix8lQNCh4K,1fZpYWNWdL5Z3wrDtISFUH,2org0PubBAxTvjVvLo9PJ0,2TwOrUcYnAlIiKmVQkkoSZ,3vAaWhdBR38Q02ohXqaNHT,7GlBOeep6PqTfFi59PTUUN,1WudHeuEN3d18SXVos95mc,7vNNmjV14SKQzlQAEg0BXP,1xU878Z1QtBldR7ru9owdU,3l0CmX0FuQjFxr8SK7Vqag,53RsXctnNmj9oKXvcbvzI2,6ltzsmQQbmdoHHbLZ4ZN25,4WPY0N74T3KUja57xMQTZ3,29lz7gs8edwnnfuXW4FhMl,4Z8W4fKeB5YxbusRsdQVPb,3kjuyTCjPG1WMFCiyc5IuB,5BvJzeQpmsdsFp4HGUYUEx,4tX2TplrkIP4v05BNC903e,1G9G7WwrXka3Z1r7aIDjI7,19I4tYiChJoxEO5EuviXpz,0vW8z9pZMGCcRtGPGtyqiB,67f7GZXNMGRn98lqrtIdrN,432R46LaYsJZV2Gmc4jUV5,4SjCvf9Ctuz369ZKAnjkZP,1PrFsWVNcI16jsB84oYbAM,4yfPiAauSgUfyc4k4WtwM9 403 (Forbidden)
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
a @ spicetify-routes-stats.js:4
ce @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
et @ spicetify-routes-stats.js:4
bt @ spicetify-routes-stats.js:4
await in bt
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetify-routes-stats.js:4  GET https://api.spotify.com/v1/audio-features?ids=40F3i6gKdUibqjyZdW1o4D,6FB3v4YcR57y4tXFcdxI1E,6lrQo6KAYvb92MGk6ZuZlt,2ag1oJvKdEt4JObHRcdZWE,4KULAymBBJcPRpk1yO4dOG,2WRFD9WczJ975X2K1Y9YVs,3YRNCPqg75VeZ3wtN3KY3Z,6M0IsaUX4GNyto4niSegfI,3FIvCLgCbhOW1MRnh4Wn2T,3c91jaNIbYoS4PTueNeH6q,0QZwfrjDdVGKjKfIzopBfL,1gkhXnZAFfaHB78oV8pDXV,2PLqbVr0N1QKyDAq67g43M,5aqlAwqKApcEjHWto6VNdx,5lqyqPU3JkpCbUbLmTVQPW,7fRruZ12gXGwBs0zXQ6e5V,3y4oFrifsZaSUib1QhDhmv,2QMV9Kj5BFo8kjggLVHf86,09DR0sHnQUhHOiSNttc1mv,5UW4tA4j23YL6kDfRw3rWT,12EkF8uGofptstVIX7Oc0C,3HTLIvqe7MoSlsqw2DAynt,4CD4GfHOwo5ZP4FkIMTK6j,4LKYOetuIF5c9XjeLBL9av,6QXxmGsc0A2PG3alWT5bYi,09ebrkUKSLYAycT5DVPgjg,0CGMppRyZeAXdfaBcj7cMv,0KIpuVYhKUUUpjo6H5NvBY,0PzEqBOcfOMU9FZRjeNiz0,0TPS1dKI4m27xCxm7jF7SU,0pQvGy1DmlJcBTDIyTVKUK,0wIpjjcXFgGtJUmBIRAAju,10nyNJ6zNy2YVYLrcwLccB,1AKKVEylH3YPYm64MTzl7M,1Cz7QWaBJJcabdMqZxXwj9,1HfB7BLeW5XXIJ9sjCaL5U,1fXvxcQdz9OEe5IeNHQh72,1u8c2t2Cy7UBoG4ArRcF5g,1wSioaXBQufQTA5E0XJ1mi,1zb9cdsTMrEEL2Ut8rmTb6,259UpfomIaTr9PdBvR6R1c,2ZQKQJYnXbXKrgPZ1vLmiE,2ckYkLkKMdJ856YBmWpyZC,2tMPLJ8nmRARNXC7r2hDIq,34iOH7LY3vme5rQxsVILZ4,3BYKlVp3QPrUcfnZWyqO0K,3CWkXu2k702yk8s5cdzw5O,3QfM4MDEKsi07YzqynN7EU,3ShIGvHRm0q9iIDowUMjls,3cR7U1X3jcKaws71L3gZbc 403 (Forbidden)
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
a @ spicetify-routes-stats.js:4
se @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Je @ spicetify-routes-stats.js:4
bt @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
setTimeout
o @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
batch @ xpui-modules.js:1
#s @ xpui-modules.js:1
setData @ xpui-modules.js:1
fetch @ xpui-modules.js:1
await in fetch
#U @ xpui-modules.js:1
onSubscribe @ xpui-modules.js:1
subscribe @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
ya @ xpui-modules.js:1
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
Mixed Content: The page at '<URL>' was loaded over HTTPS, but requested an insecure resource '<URL>'. This request has been blocked; the content must be served over HTTPS. -- *this triggered 15k times from the Album tab*
spicetify-routes-stats.js:4  GET https://api.spotify.com/v1/artists?ids=3POLaElL9MR68BopYmink1 403 (Forbidden)
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
a @ spicetify-routes-stats.js:4
ce @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
et @ spicetify-routes-stats.js:4
bt @ spicetify-routes-stats.js:4
await in bt
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
setTimeout
o @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
batch @ xpui-modules.js:1
#s @ xpui-modules.js:1
setData @ xpui-modules.js:1
fetch @ xpui-modules.js:1
await in fetch
#U @ xpui-modules.js:1
onSubscribe @ xpui-modules.js:1
subscribe @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
ya @ xpui-modules.js:1
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetify-routes-stats.js:4  GET https://api.spotify.com/v1/artists?ids=06HL4z0CvFAxyc27GXpf02,08GQAI4eElDnROBrJRGE0X,5e1BZulIiYWPRm8yogwUYH,7lOJ7WXyopaxri0dbOiZkd,1hLiboQ98IQWhpKeP9vRFw,12zbUHbPHL5DGuJtiUfsip,1r1uxoy19fzMxunt3ONAkG,07D1Bjaof0NFlU32KXiqUP,6ws5XBA70XgeBpnLZhQBoy,4wEVY6Zz9STrspLNOmyz50,1yAwtBaoHLEDWAnWR87hBT,40ZNYROS4zLfyyBSs2PGe2,70kkdajctXSbqSMJbQO424,3TNt4aUIxgfy9aoaft5Jj2,246dkjvS1zLTtiykXe5h60,6W1BHDF0T4a4KYcSwzD586,0JDkhL4rjiPNEp92jAgJnS,5H9IFTRxSICj24uxO15ScU,4mO4aGO6u29UyR6XLZR9XW,5uMNhVG30JzeZ5xtPb1tqR,2d6JU9LvNhZR7AAtu4x2rS,225Tr2NNMQspzjFVRneBJ8,2ye2Wgw4gimLv2eAKyk1NB,0hYxQe3AK5jBPCr5MumLHD,1M3BVQ36cqPQix8lQNCh4K,1fZpYWNWdL5Z3wrDtISFUH,2org0PubBAxTvjVvLo9PJ0,2TwOrUcYnAlIiKmVQkkoSZ,3vAaWhdBR38Q02ohXqaNHT,7GlBOeep6PqTfFi59PTUUN,1WudHeuEN3d18SXVos95mc,7vNNmjV14SKQzlQAEg0BXP,1xU878Z1QtBldR7ru9owdU,3l0CmX0FuQjFxr8SK7Vqag,53RsXctnNmj9oKXvcbvzI2,6ltzsmQQbmdoHHbLZ4ZN25,4WPY0N74T3KUja57xMQTZ3,29lz7gs8edwnnfuXW4FhMl,4Z8W4fKeB5YxbusRsdQVPb,3kjuyTCjPG1WMFCiyc5IuB,5BvJzeQpmsdsFp4HGUYUEx,4tX2TplrkIP4v05BNC903e,1G9G7WwrXka3Z1r7aIDjI7,19I4tYiChJoxEO5EuviXpz,0vW8z9pZMGCcRtGPGtyqiB,67f7GZXNMGRn98lqrtIdrN,432R46LaYsJZV2Gmc4jUV5,4SjCvf9Ctuz369ZKAnjkZP,1PrFsWVNcI16jsB84oYbAM,4yfPiAauSgUfyc4k4WtwM9 403 (Forbidden)
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
a @ spicetify-routes-stats.js:4
ce @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
et @ spicetify-routes-stats.js:4
bt @ spicetify-routes-stats.js:4
await in bt
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
setTimeout
o @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
batch @ xpui-modules.js:1
#s @ xpui-modules.js:1
setData @ xpui-modules.js:1
fetch @ xpui-modules.js:1
await in fetch
#U @ xpui-modules.js:1
onSubscribe @ xpui-modules.js:1
subscribe @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
ya @ xpui-modules.js:1
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1

Genre and Library tabs still trigger:
xpui-modules.js:1 Error: Minified React error #31;

The Genre tab triggered the following error over 5k times in a few seconds:
spicetify-routes-stats.js:4 
 GET https://api.spotify.com/v1/me/top/tracks?limit=50&offset=0&time_range=short_term 429 (Too Many Requests)
(anonymous)	@	spicetify-routes-stats.js:4
await in (anonymous)		
a	@	spicetify-routes-stats.js:4
oe	@	spicetify-routes-stats.js:4
ht	@	spicetify-routes-stats.js:4
(anonymous)	@	spicetify-routes-stats.js:4
(anonymous)	@	spicetify-routes-stats.js:4
queryFn	@	spicetify-routes-stats.js:4
(anonymous)	@	spicetify-routes-stats.js:4
(anonymous)	@	spicetify-routes-stats.js:4
Xs	@	xpui-modules.js:1
gl	@	xpui-modules.js:1
(anonymous)	@	xpui-modules.js:1
v	@	xpui-modules.js:1
P	@	xpui-modules.js:1

---

I haven't had Lastfm enabled for any tests so far, and still don't. I do have an API key input in settings though for fallback.

Artists and tracks seem to work fine.

Library works but triggers lots of 400, 403, and 429 errors. The 'Most Frequent Artists' and 'Most Frequent Genres' sections are empty.

Albums and Charts seem to just trigger a lot of 400 errors.

Albums eventually falls back to scrobbles.

Charts shows scrobbles not spotify data. Not sure if this was intentional or a fallback. Charts only has 'Top Artists' or 'Top Tracks', there's no timeframe range selector though - can one be added?

The timeframe ranges on the tabs are 'Past Month' 'Past 6 Months' and 'All Time', can more be added (such as week, 2 weeks, year)?

Genres page only shows 'Release Year Distribution' and Explicit' %. None of the other data is populated.

Can you check the github projects under 'Similar Projects' in the `RATE_LIMIT_RESEARCH.md` doc for possible proper apis to use for the current issues?

---

Let's stop spamming API calls that just return 400, 403, and 429 errors.

I guess Albums and Charts are already explicitly labelled as Last.fm-backed in the settings panel tooltips, which is good enough.

I copied the updated app from https://github.com/harbassan/spicetify-apps/issues/242 to `stats/`. Is there anything useful there?

Explain what a `your_spotify` integration would look like.

---

What are the Spotify short, medium and long time windows? https://www.statsforspotify.com calls them 4 weeks, 6 months, and 1 year. This Spicetify stats app says 1 month, 6 months, all time. https://www.statsforspotify.com has working genres.

This file might have links to some useful info `.github/instructions/spotify.instructions.md`.

Switching from top artists to top tracks in the charts tab often causes a crash to the 'reload page' page.

xpui-modules.js:1 Error: Unexpectedly hit unreachable code! Unhandled discriminated union member: false
    at i (xpui-modules.js:1:7041740)
    at r (xpui-modules.js:1:7041870)
    at xpui-modules.js:1:3265101
    at Ra (xpui-modules.js:1:3265111)
    at Object.factory (xpui-modules.js:1:3763558)
    at E.resolveImpl (xpui-modules.js:1:4753055)
    at E.resolve (xpui-modules.js:1:4752595)
    at addMissingPlatformAPIs (spicetifyWrapper.js:339:52)
r @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Ra @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
resolveImpl @ xpui-modules.js:1
resolve @ xpui-modules.js:1
addMissingPlatformAPIs @ spicetifyWrapper.js:339
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
(anonymous) @ spicetifyWrapper.js:347
xpui-modules.js:1  GET https://api.spotify.com/v1/browse/categories?limit=10&offset=0&locale=en_US&market=from_token 429 (Too Many Requests)
M @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
(anonymous) @ xpui-modules.js:1
_tick @ xpui-modules.js:1
start @ xpui-modules.js:1
_sendRetriedRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
_sendRequest @ xpui-modules.js:1
request @ xpui-modules.js:1
send @ xpui-modules.js:1
send @ xpui-modules.js:1
sa @ made-for-you-shortcut.js?time=1773897955429:14
$t @ made-for-you-shortcut.js?time=1773897955429:1
await in $t
(anonymous) @ made-for-you-shortcut.js?time=1773897955429:14
(anonymous) @ made-for-you-shortcut.js?time=1773897955429:14
(anonymous) @ made-for-you-shortcut.js?time=1773897955429:14
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
xpui-modules.js:1  POST https://guc3-spclient.spotify.com/remote-config-resolver/v3/configuration 404 (Not Found)
M @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
(anonymous) @ xpui-modules.js:1
_tick @ xpui-modules.js:1
start @ xpui-modules.js:1
_sendRetriedRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
_sendRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
_dispatchFromStore @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
a @ xpui-modules.js:1
t @ xpui-modules.js:1
postMessage
c @ xpui-modules.js:1
emit @ xpui-modules.js:1
_connectToEndpoints @ xpui-modules.js:1
Promise.then
_performConnect @ xpui-modules.js:1
_connect @ xpui-modules.js:1
connect @ xpui-modules.js:1
gy @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
resolveImpl @ xpui-modules.js:1
resolve @ xpui-modules.js:1
My @ xpui-modules.js:1
await in My
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
xpui-modules.js:1 Uncaught (in promise) HttpResponseError
    at i.fromResponse (xpui-modules.js:1:4453543)
    at e.onAfterSend (xpui-modules.js:1:6065563)
    at xpui-modules.js:1:4991799
    at async sa (made-for-you-shortcut.js?time=1773897955429:14:4403)
    at async $t (made-for-you-shortcut.js?time=1773897955429:1:100026)
    at async made-for-you-shortcut.js?time=1773897955429:14:730
fromResponse @ xpui-modules.js:1
e.onAfterSend @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.catch
send @ xpui-modules.js:1
sa @ made-for-you-shortcut.js?time=1773897955429:14
$t @ made-for-you-shortcut.js?time=1773897955429:1
await in $t
(anonymous) @ made-for-you-shortcut.js?time=1773897955429:14
(anonymous) @ made-for-you-shortcut.js?time=1773897955429:14
(anonymous) @ made-for-you-shortcut.js?time=1773897955429:14
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
xpui-modules.js:1 provider:transport resolve error k {url: 'https://guc3-spclient.spotify.com/remote-config-resolver/v3/configuration', status: 404, headers: L, body: {…}, offline: false, …} {}
f @ xpui-modules.js:1
t.<computed> @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.catch
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Qs @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
oc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
hc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
_c @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
resolve @ xpui-modules.js:1
My @ xpui-modules.js:1
await in My
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/artists/1dfeR4HaWDbWqFHLkxsg1d?locale=EN_en 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
i @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
setTimeout
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
e @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:40
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
whatsThatGenre.js?time=1773897955428:5 Uncaught (in promise) TypeError: t is not iterable
i @ whatsThatGenre.js?time=1773897955428:5
await in i
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
setTimeout
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
e @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:5
(anonymous) @ whatsThatGenre.js?time=1773897955428:40
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
spicetify-routes-stats.js:4  GET https://api.spotify.com/v1/search?q=track:Stateside%20%2B%20Zara%20Larsson+artist:PinkPantheress&type=track&limit=50 400 (Bad Request)
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
a @ spicetify-routes-stats.js:4
ye @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Ue @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
w @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
queryFn @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
Qc @ xpui-modules.js:1
v @ xpui-modules.js:1
P @ xpui-modules.js:1
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/me 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
(anonymous) @ 2796ddde-8d4c-4954-a462-fba138a13189:879
fetchUserMarket @ 2796ddde-8d4c-4954-a462-fba138a13189:890
main @ 2796ddde-8d4c-4954-a462-fba138a13189:36229
await in main
(anonymous) @ 2796ddde-8d4c-4954-a462-fba138a13189:36280
(anonymous) @ 2796ddde-8d4c-4954-a462-fba138a13189:36282
2796ddde-8d4c-4954-a462-fba138a13189:888 [Sort-Play] FATAL: Could not determine user's market. Track availability checks may be inaccurate.
(anonymous) @ 2796ddde-8d4c-4954-a462-fba138a13189:888
await in (anonymous)
fetchUserMarket @ 2796ddde-8d4c-4954-a462-fba138a13189:890
main @ 2796ddde-8d4c-4954-a462-fba138a13189:36229
await in main
(anonymous) @ 2796ddde-8d4c-4954-a462-fba138a13189:36280
(anonymous) @ 2796ddde-8d4c-4954-a462-fba138a13189:36282

How do the top artists and top tracks pages in the charts tab work? Switching between the two can get different results every time. And they are never sorted by most plays/scrobbles.

A separate local or self-hosted backend means something that has to be running on the host machine then right? Are there free options for any sort of web hosted service?

---

Are there other APIs (lastfm or something else) that could be used as references against spotify top data to build top genres data?

Top Artists is now sometimes displaying songs instead of artists. Seem to be fewer crashes when switching though.

xpui-modules.js:1 Error: Unexpectedly hit unreachable code! Unhandled discriminated union member: false
    at i (xpui-modules.js:1:7041740)
    at r (xpui-modules.js:1:7041870)
    at xpui-modules.js:1:3265101
    at Ra (xpui-modules.js:1:3265111)
    at Object.factory (xpui-modules.js:1:3763558)
    at E.resolveImpl (xpui-modules.js:1:4753055)
    at E.resolve (xpui-modules.js:1:4752595)
    at addMissingPlatformAPIs (spicetifyWrapper.js:339:52)
r @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Ra @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
resolveImpl @ xpui-modules.js:1
resolve @ xpui-modules.js:1
addMissingPlatformAPIs @ spicetifyWrapper.js:339
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
setTimeout
addMissingPlatformAPIs @ spicetifyWrapper.js:326
(anonymous) @ spicetifyWrapper.js:347
xpui-modules.js:1  POST https://guc3-spclient.spotify.com/remote-config-resolver/v3/configuration 404 (Not Found)
M @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
(anonymous) @ xpui-modules.js:1
_tick @ xpui-modules.js:1
start @ xpui-modules.js:1
_sendRetriedRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
_sendRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
_dispatchFromStore @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
a @ xpui-modules.js:1
t @ xpui-modules.js:1
postMessage
c @ xpui-modules.js:1
emit @ xpui-modules.js:1
_connectToEndpoints @ xpui-modules.js:1
Promise.then
_performConnect @ xpui-modules.js:1
_connect @ xpui-modules.js:1
connect @ xpui-modules.js:1
gy @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
resolveImpl @ xpui-modules.js:1
resolve @ xpui-modules.js:1
My @ xpui-modules.js:1
await in My
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
xpui-modules.js:1 provider:transport resolve error k {url: 'https://guc3-spclient.spotify.com/remote-config-resolver/v3/configuration', status: 404, headers: L, body: {…}, offline: false, …} {}
f @ xpui-modules.js:1
t.<computed> @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.catch
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Qs @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
oc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
hc @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
_c @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
resolve @ xpui-modules.js:1
My @ xpui-modules.js:1
await in My
(anonymous) @ xpui-snapshot.js:1
await in (anonymous)
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
(anonymous) @ xpui-snapshot.js:1
xpui-modules.js:1  GET https://api.spotify.com/v1/browse/categories?limit=10&offset=0&locale=en_US&market=from_token 429 (Too Many Requests)
M @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
(anonymous) @ xpui-modules.js:1
_tick @ xpui-modules.js:1
start @ xpui-modules.js:1
_sendRetriedRequest @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.then
_sendRequest @ xpui-modules.js:1
request @ xpui-modules.js:1
send @ xpui-modules.js:1
send @ xpui-modules.js:1
sa @ made-for-you-shortcut.js?time=1773899319158:14
$t @ made-for-you-shortcut.js?time=1773899319158:1
await in $t
(anonymous) @ made-for-you-shortcut.js?time=1773899319158:14
(anonymous) @ made-for-you-shortcut.js?time=1773899319158:14
(anonymous) @ made-for-you-shortcut.js?time=1773899319158:14
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
xpui-modules.js:1 Uncaught (in promise) HttpResponseError
    at i.fromResponse (xpui-modules.js:1:4453543)
    at e.onAfterSend (xpui-modules.js:1:6065563)
    at xpui-modules.js:1:4991799
    at async sa (made-for-you-shortcut.js?time=1773899319158:14:4403)
    at async $t (made-for-you-shortcut.js?time=1773899319158:1:100026)
    at async made-for-you-shortcut.js?time=1773899319158:14:730
fromResponse @ xpui-modules.js:1
e.onAfterSend @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Promise.catch
send @ xpui-modules.js:1
sa @ made-for-you-shortcut.js?time=1773899319158:14
$t @ made-for-you-shortcut.js?time=1773899319158:1
await in $t
(anonymous) @ made-for-you-shortcut.js?time=1773899319158:14
(anonymous) @ made-for-you-shortcut.js?time=1773899319158:14
(anonymous) @ made-for-you-shortcut.js?time=1773899319158:14
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/artists/1dfeR4HaWDbWqFHLkxsg1d?locale=EN_en 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
i @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
setTimeout
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
e @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:40
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
whatsThatGenre.js?time=1773899319158:5 Uncaught (in promise) TypeError: t is not iterable
i @ whatsThatGenre.js?time=1773899319158:5
await in i
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
setTimeout
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
e @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:5
(anonymous) @ whatsThatGenre.js?time=1773899319158:40
PendingScript
(anonymous) @ extension.js:10
e @ extension.js:10
await in e
(anonymous) @ extension.js:10
(anonymous) @ extension.js:10
await in (anonymous)
(anonymous) @ extension.js:10
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/me 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
(anonymous) @ e3f3444f-209c-4945-8614-586f032a1b14:879
fetchUserMarket @ e3f3444f-209c-4945-8614-586f032a1b14:890
main @ e3f3444f-209c-4945-8614-586f032a1b14:36229
await in main
(anonymous) @ e3f3444f-209c-4945-8614-586f032a1b14:36280
(anonymous) @ e3f3444f-209c-4945-8614-586f032a1b14:36282
e3f3444f-209c-4945-8614-586f032a1b14:888 [Sort-Play] FATAL: Could not determine user's market. Track availability checks may be inaccurate.
(anonymous) @ e3f3444f-209c-4945-8614-586f032a1b14:888
await in (anonymous)
fetchUserMarket @ e3f3444f-209c-4945-8614-586f032a1b14:890
main @ e3f3444f-209c-4945-8614-586f032a1b14:36229
await in main
(anonymous) @ e3f3444f-209c-4945-8614-586f032a1b14:36280
(anonymous) @ e3f3444f-209c-4945-8614-586f032a1b14:36282


---

Okay, make the Genres tab use a fallback enrichment strategy based on Last.fm artist tags when Spotify artist metadata is blocked. It should use both top song and top artist data from the specified timeframe though, not just artist.

I'd like to also add an optional toggle to the settings to include Musicbrainz genre data from the top songs and top artist data.\

---

The genres look like they're probably fine, no need to tighten tag exclusions. The MusicBrainz data doesn't seem to get fetched though. Nothing changes when it's enabled and no console errors.

Image 1 shows a section of the Genres tab that still isn't populated.

Image 2 shows 3 sections of the Library tab that aren't populated.

---

Images are blank in Charts Top Tracks (see image). Also blank in Charts Top Artists (image 2), and Library Most Frequent Artists (image 3).

Still an unpopulated area in Genres tab (images 4 & 5). Similar area unpopulated in Library tab (image 6).

---

Can we get audio-features somewhere else? like MusicBrainz?

Why can't we get artwork/images for charts or library but we can get them for albums?

---

Sure. You should also make new commits for all the changes we've been making.

And create a new file in the project root documenting the various considerations made and limitations run into throughout the process. And things like `your_spotify` that were considered, the requirements of such an implementation, and why it was decided against.

---

Two errors:

[{
	"resource": "/workspaces/spicetify-apps/projects/stats/src/extensions/extension.tsx",
	"owner": "typescript",
	"code": "2554",
	"severity": 8,
	"message": "Expected 3-4 arguments, but got 5.",
	"source": "ts",
	"startLineNumber": 173,
	"startColumn": 12,
	"endLineNumber": 173,
	"endColumn": 16,
	"modelVersionId": 4,
	"origin": "extHost2"
}]

[{
	"resource": "/workspaces/spicetify-apps/projects/stats/src/utils/track_helper.ts",
	"owner": "typescript",
	"code": "2307",
	"severity": 8,
	"message": "Cannot find module '../../../shared/types/platform' or its corresponding type declarations.",
	"source": "ts",
	"startLineNumber": 5,
	"startColumn": 68,
	"endLineNumber": 5,
	"endColumn": 100,
	"modelVersionId": 7,
	"origin": "extHost2"
}]

---

Getting the pictured errors in the Artists, Tracks, and Genres tabs.

shuffle+:1  Failed to load resource: net::ERR_NAME_NOT_RESOLVED
sortByPlayCount:1  Failed to load resource: net::ERR_NAME_NOT_RESOLVED
fullAlbumDate:1  Failed to load resource: net::ERR_NAME_NOT_RESOLVED
xpui-modules.js:1 Error: Unexpectedly hit unreachable code! Unhandled discriminated union member: false
    at i (xpui-modules.js:1:7041740)
    at r (xpui-modules.js:1:7041870)
    at xpui-modules.js:1:3265101
    at Ra (xpui-modules.js:1:3265111)
    at Object.factory (xpui-modules.js:1:3763558)
    at E.resolveImpl (xpui-modules.js:1:4753055)
    at E.resolve (xpui-modules.js:1:4752595)
    at addMissingPlatformAPIs (spicetifyWrapper.js:339:52)
r @ xpui-modules.js:1
spicetify-routes-stats.js:4 Uncaught (in promise) ReferenceError: SpicetifyStats is not defined
    at wr (spicetify-routes-stats.js:4:118648)
    at Er (spicetify-routes-stats.js:4:118938)
    at pa (xpui-modules.js:1:1317852)
    at Tc (xpui-modules.js:1:1376814)
    at ml (xpui-modules.js:1:1366050)
    at pl (xpui-modules.js:1:1365978)
    at dl (xpui-modules.js:1:1365841)
    at Qc (xpui-modules.js:1:1361004)
    at v (xpui-modules.js:1:4174275)
    at MessagePort.P (xpui-modules.js:1:4174807)
api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=short_term:1  Failed to load resource: the server responded with a status of 429 ()
api.spotify.com/v1/me/top/tracks?limit=50&offset=0&time_range=short_term:1  Failed to load resource: the server responded with a status of 429 ()
guc3-spclient.spotify.com/remote-config-resolver/v3/configuration:1  Failed to load resource: the server responded with a status of 404 ()
xpui-modules.js:1 provider:transport resolve error k Object
f @ xpui-modules.js:1
api.spotify.com/v1/me:1  Failed to load resource: the server responded with a status of 429 ()
01500caf-c7f8-4423-bc0b-322011108e0c:888 [Sort-Play] FATAL: Could not determine user's market. Track availability checks may be inaccurate.
(anonymous) @ 01500caf-c7f8-4423-bc0b-322011108e0c:888
api.spotify.com/v1/browse/categories?limit=10&offset=0&locale=en_US&market=from_token:1  Failed to load resource: the server responded with a status of 429 ()
xpui-modules.js:1 Uncaught (in promise) HttpResponseError
    at i.fromResponse (xpui-modules.js:1:4453543)
    at e.onAfterSend (xpui-modules.js:1:6065563)
    at xpui-modules.js:1:4991799
    at async sa (made-for-you-shortcut.js?time=1773939279932:14:4403)
    at async $t (made-for-you-shortcut.js?time=1773939279932:1:100026)
    at async made-for-you-shortcut.js?time=1773939279932:14:730
api.spotify.com/v1/artists/4Ui2kfOqGujY81UcPrb5KE?locale=EN_en:1  Failed to load resource: the server responded with a status of 429 ()
whatsThatGenre.js?time=1773939279932:5 Uncaught (in promise) TypeError: t is not iterable
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=long_term 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
he @ spicetify-routes-stats.js:4
Xe @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/me/top/tracks?limit=50&offset=0&time_range=long_term 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
de @ spicetify-routes-stats.js:4
Ht @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
queryFn @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/search?q=album:Days%20Are%20Gone+artist:HAIM&type=album&limit=50 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
be @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
qe @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
f @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/search?q=track:Stateside%20%2B%20Zara%20Larsson+artist:PinkPantheress&type=track&limit=50 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
ye @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Ke @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
f @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
queryFn @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/audio-features?ids=3y4oFrifsZaSUib1QhDhmv,5ciSr1SyZUQrxySlxZhdhg,2tgQaL85WoRfgEa4hFQgrE,0fbR95FEaJUxiQYaqZZukv,2S6yBUXa5KddBV0CqBkcP1,0ahcTCz4kcic6vfIEIlFkq,13aiI2D4nrdD2sxXvCKn40,2S2fa3WH0w1TMdRwh3drEg,3aFMz2anc9vurZw6bPunI6,0NslHuacjxQYfUTOW3HCIV,64DpBZj4IlDFzCwxTq7azl,0hDQV9X1Da5JrwhK8gu86p,3B3eOgLJSqPEA0RfboIQVM,65aZDJQwNllPxuLPixJ4YO,7ojaBbxzyoqpvFycrhjyxq,3l3SbRkrK1aQ5Dk1h7vroV,56NkIxSZZiMpFP5ZNSxtnT,6exdwZ3EOSCjb11bd6k6Np,4absiGHMelB8eH976ytjBj,7kzKAuUzOITUauHAhoMoxA,4IvZLDtwBHmBmwgDIUbuwa,2wXZeaK0rXF3qrs7ernZ2L,6Zgd7SomLTZkL1WPh4CUnV,57Xjny5yNzAcsxnusKmAfA,7jIAttgQTpLDoNtykIQXjH,6UIxGIqWlO5wsddY44AV1R,0EKUJ4OqrNWaHpNPODNTaf,4iG2gAwKXsOcijVaVXzRPW,21Qsj3cMVCx2xF2EVVNbEu,34q2Y1O5zMeuBhX4WYn0aZ,0epAG0WWRlDMsMFJiE5c6I,1AEiKr56njftNDp67QCnHH,2LMloFiV7DHpBhITOaBSam,78Gzxi27GuNHTfkn2BylG4,6xAa0kGkTLU22ZyoHOCHgi,5cy5IStIn7OSHDEIgXeDyq,4fPBB44eDH71YohayI4eKV,4NnWuGQujzWUEg0uZokO5M,2YIOkqKgg3jZEFoL5qcEPT,6u0x5ad9ewHvs3z6u9Oe3c,3FtYbEfBqAlGO46NUDQSAt,0jBE7Fn78EAvmIs3dCd6GO,0ritgEzDOsxbd2IfYX96S9,4yY8JqTOQyi7K4O1QcQtBG,1fEGtTZjrjJW8eUeewnNJR,2Hr51Yy9FBqye5FJrEH8bK,5TS9LZZ3nf3W0EPZKZiYFX,5fj76kVAnqRKKhAw5d06jj,3lMOJhsiPBc5q0dGP73EaZ,5bVOX6eyHsML2sB4aMlZEi,3DQVgcqaP3iSMbaKsd57l5,19Shlms2uTnOjIUg50TXzd,57rAvblBMBmdPBugRF1T77,2Pdo1VvYDB9FqeuNx8D1FW,0lngUitwRDbvZ5yVO76dVN,1FvDJ9KGxcqwv1utyPL3JZ,2DBlfjL5chsdeULzhTp5K8,4vjvx7Zxkb4AltGcZ0BBvI,4oXg7xT4ksBxHTx8PcmSXw,1hmgNEcsynNHU1AN9MTxgp,3U5JVgI2x4rDyHGObzJfNf,2l57cfmCnOkwNX1tky02n1,3YQpycN8xEdHVo8qt0ahcI,1I97UEdJWw7uXtlpgGVMIp,0P4Te8j7vGE8A4GUPLcD6f,6oNvmplQGUkmAh441Teows,4a17WC0Cf5hSKFD6ts57mk,7jvtmQ3onpWeUm7dyFSSSc,6SEROp4snffbCv7VMAI6KN,0xaz4gPfYbdp8s4dHTI5Gm,55N8cxpE1QDoeaaNqUnoZ2,4sDbTF1BfdDiuWVEMFbEm2,5YoBEhJWkFwT0zsWD2rUst,1yWIsH3TC51gmzvQxZNCQC,0a9LL4ETCcFGsrrfI1oOm5,0Oi6TiuKVXRBS0191bEqnu,5zb7npjQqoJ7Kcpq4yD9qn,60s0QWaOZ2UTzqdIHBCt3x,3mFzIFFFmEXTQs6BDAK2ZZ,16e1DJIznzArBOCSomdvSn,6ah4KE4F2xwbS1qByjFmZj,6ar3x1gVqkABR1x6zQI9yH,7haAXAH1qACjdmLQKBYxCZ,5UW4tA4j23YL6kDfRw3rWT,2QMV9Kj5BFo8kjggLVHf86,3a9P1PqOV6gr4A9ywDZ7mg,4KVYz4U1Vm3pvjhhhS1E6s,7oFZxS78UzYI3VBivyrmDx,39lgO3AGc8pt7SM4VuB0Mh,2uvcftCCrCr2pprXUJ6Vjr,557ohTjqc5tofLMZJOCcOn,5DqrMSaG6KXa9PWlnnKJyb,056mbYcqyQo86Rfr9XfyYm,0cAFtuZPD4sKl0X1R3dFin,0TFTAtCYhp2tQ9KcJIZb55,7qjZnBKE73H4Oxkopwulqe,5T8OICEqdqbx8Uz7L5abkH,2dono2Koz7DEvGwxUsmMLq,2B664ulJSVBd6B8SAY3Wux,2SeDdNjPvN3uwkolnG2ODi 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
ve @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
wt @ spicetify-routes-stats.js:4
Tt @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/artists?ids=5e1BZulIiYWPRm8yogwUYH,5o206eFLx38glA2bb4zqIU,53RsXctnNmj9oKXvcbvzI2,3kjuyTCjPG1WMFCiyc5IuB,6FBDaR13swtiWwGhX1WQsP,2olXFp5y1AwrgJA9YSV4Sn,0epOFNiUfyON9EYx7Tpr6V,1yAwtBaoHLEDWAnWR87hBT,08GQAI4eElDnROBrJRGE0X,4aP1lp10BRYZO658B2NwkG,0XSqX2PB3C5dTMv7SZaxSm,0vW8z9pZMGCcRtGPGtyqiB,246dkjvS1zLTtiykXe5h60,3KDpcZPHxvsaVk5PReoGqh,4WPY0N74T3KUja57xMQTZ3,19I4tYiChJoxEO5EuviXpz,7wGrLSB3v7jkV3fSsjYwtv,2ye2Wgw4gimLv2eAKyk1NB,7lOJ7WXyopaxri0dbOiZkd,2qc41rNTtdLK0tV3mJn2Pm,6tbjWDEIzxoDsBA1FuhfPW,2EO56JK4txid1Pss9GVbOL,4Z8W4fKeB5YxbusRsdQVPb,3TNt4aUIxgfy9aoaft5Jj2,6XYvaoDGE0VmRt83Jss9Sn,4M5nCE77Qaxayuhp3fVn4V,06HL4z0CvFAxyc27GXpf02,6zvul52xwTWzilBZl6BUbT,2uYWxilOVlUdk4oV9DvwqK,4mO4aGO6u29UyR6XLZR9XW,7K3zpFXBvPcvzhj7zlGJdO,6Jrxnp0JgqmeUX1veU591p,5GHv1pBOWOQxIE6WQBq88Q,29lz7gs8edwnnfuXW4FhMl,1HY2Jd0NmPuamShAr6KMms,5lJ4XQ2hlPlxACN7q3xKL1,2cCUtGK9sDU2EoElnk0GNB,4wEVY6Zz9STrspLNOmyz50,1nJvji2KIlWSseXRSlNYsC,4tX2TplrkIP4v05BNC903e,0oSGxfWSnnOXhD2fKuz2Gy,0K1q0nXQ8is36PzOKAMbNe,4QCflfSOonkybNw5D7GqGk,1r1uxoy19fzMxunt3ONAkG,053q0ukIDRgzwTr4vNSwab,24XtlMhEMNdi822vi0MhY1,0OSABE1yGiZK2ALQDJ0SeO,3WrFJ7ztbogyGnTHbHJFl2,6kFay2DQ5aZfeu5OsrF3Pw,3iOvXCl6edW5Um0fXEBRXy 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
ge @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
It @ spicetify-routes-stats.js:4
Tt @ spicetify-routes-stats.js:4
await in Tt
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
spicetify-routes-stats.js:4  GET https://musicbrainz.org/ws/2/artist/a96ac800-bfcb-412a-8a63-0a98df600700?inc=genres+tags&fmt=json 503 (Service Unavailable)
vt @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
_t @ spicetify-routes-stats.js:4
Nt @ spicetify-routes-stats.js:4
await in Nt
It @ spicetify-routes-stats.js:4
await in It
Tt @ spicetify-routes-stats.js:4
await in Tt
(anonymous) @ spicetify-routes-stats.js:4
await in (anonymous)
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
Xs @ xpui-modules.js:1
gl @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
El @ xpui-modules.js:1
il @ xpui-modules.js:1
Br @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1

---

Is it even using the OAuth? My spotify developer dashboard shows 0 everything (weekly users, monthly users, api calls by endpoint, users by country). Not sure the dashboard update frequency though.

---

So, it looked like I was still connected in settings. But not all commands in the console returned true - the second and third commands returned null.

Clicking refresh would cause:
spicetifyWrapper.js:481  GET https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=long_term 429 (Too Many Requests)
(anonymous) @ spicetifyWrapper.js:481
a @ spicetify-routes-stats.js:4
ve @ spicetify-routes-stats.js:4
at @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
(anonymous) @ spicetify-routes-stats.js:4
w @ spicetify-routes-stats.js:4
callback @ spicetify-routes-stats.js:4
onClick @ spicetify-routes-stats.js:4
we @ xpui-modules.js:1
Ve @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
Di @ xpui-modules.js:1
wi @ xpui-modules.js:1
(anonymous) @ xpui-modules.js:1
rl @ xpui-modules.js:1
Pe @ xpui-modules.js:1
Vi @ xpui-modules.js:1
Kt @ xpui-modules.js:1
Yt @ xpui-modules.js:1

So, I disabled use OAuth and reenabled it and completed the PKCE flow and pasted the callback URL, and got the Successfully connected to Spotify! notification. Now it's working again.

How do I make sure OAuth doesn't just stop working again?

---

You mentioned that the app linked in issue [#242](https://github.com/harbassan/spicetify-apps/issues/242) - and copied locally here `stats/` - is a complete rebuild, so we just took what was useful from it and integrated it into our build. How is it completely rebuilt? Is the their codebase better structured than ours?

---

Okay, that sounds good. I don't want a monolith. Is there anything else useful that we should consider taking from that version?

We should update `projects/stats/README.md` with steps to set up OAuth. Something like:

- Go to https://developer.spotify.com/dashboard and create an app. 
- Give it any name and description.
- Add `http://localhost:5173/callback` as a Redirect URI in the app settings.
- For APIs used, select 'Web API'.
- Click 'Create'
- In the Dashboard, select the app you just created, click 'Copy' next to 'Client ID'.
- Open Spotify, open the Statistics app, click the app settings icon, paste the Client ID into the Spotify Client ID field, toggle Use OAuth on.
- This will open a new tab in your browser asking you to log in to Spotify and authorize the app. After authorizing, you will be redirected to a URL that starts with `http://localhost:5173/callback`. Copy this entire URL and paste it back into the Paste Callback URL field in the app settings, 
- You should see a Successfully connected to Spotify! notification, and the app should start populating with your data. You can click the refresh button in the app to trigger a fresh fetch of your Spotify data.

- OAuth status is displayed in the setting. If you ever see a Failed to connect to Spotify notification, try toggling Use OAuth off and on again and redoing the PKCE flow by pasting the callback URL again.

- [stuff about which sources of data are used for which features, and what limitations there are on that data]

- [stuff about other new toggles in the settings and what they do]

- [what the Use Direct Fetch (Experimental) toggle does and when to use it]

And we should zip the new version so it can be downloaded as the latest release.

Has the 'Spicetify Library' app in this repo been fixed as well? If not, can our fixes be ported? If so, rebuild it so I can test it.

---

Still error #31

Error: Minified React error #31; visit https://reactjs.org/docs/error-decoder.html?invariant=31&args[]=object%20with%20keys%20%7B%24%24typeof%2C%20render%7D for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at mo (xpui-modules.js:1:1307252)
    at e (xpui-modules.js:1:1312247)
    at Es (xpui-modules.js:1:1330246)
    at Tc (xpui-modules.js:1:1377186)
    at ml (xpui-modules.js:1:1366050)
    at pl (xpui-modules.js:1:1365978)
    at dl (xpui-modules.js:1:1365841)
    at el (xpui-modules.js:1:1362676)
    at Qc (xpui-modules.js:1:1361231)
    at v (xpui-modules.js:1:4174275)Caused by: React ErrorBoundary Error: Minified React error #31; visit https://reactjs.org/docs/error-decoder.html?invariant=31&args[]=object%20with%20keys%20%7B%24%24typeof%2C%20render%7D for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at xpui-modules.js:1:5760694
    at button
    at o (xpui-modules.js:1:7044364)
    at xpui-modules.js:1:6613689
    at l (xpui-modules.js:1:6608848)
    at v (xpui-modules.js:1:6614581)
    at d (xpui-modules.js:1:3907101)
    at y
    at oe (spicetify-routes-library.js:4:12279)
    at div
    at div
    at section
    at P (spicetify-routes-library.js:4:3700)
    at Ue (spicetify-routes-library.js:4:28371)
    at Je (spicetify-routes-library.js:4:34422)
    at div
    at Qe (spicetify-routes-library.js:4:35676)
    at render
    at R (xpui-modules.js:1:2915295)
    at F (xpui-modules.js:1:2918961)
    at hE (xpui-snapshot.js:1:249382)
    at Suspense
    at m (xpui-modules.js:1:6642272)
    at Suspense
    at c (xpui-modules.js:1:4484046)
    at l (xpui-modules.js:1:4484121)
    at main
    at xpui-snapshot.js:1:50663
    at div
    at div
    at xpui-modules.js:1:5462127
    at Xn (xpui-modules.js:1:5462930)
    at div
    at div
    at ba (xpui-snapshot.js:1:53184)
    at div
    at Kn (xpui-snapshot.js:1:51036)
    at div
    at Fy (xpui-snapshot.js:1:222466)
    at Jm (xpui-snapshot.js:1:183874)
    at s (xpui-modules.js:1:1499939)
    at qp (xpui-snapshot.js:1:166024)
    at qr (xpui-snapshot.js:1:64205)
    at l (xpui-modules.js:1:1216484)
    at t (xpui-modules.js:1:2312688)
    at A (xpui-modules.js:1:5318416)
    at Suspense
    at bm
    at a (xpui-modules.js:1:2714519)
    at l (xpui-modules.js:1:2625195)
    at l (xpui-modules.js:1:1925428)
    at l (xpui-modules.js:1:3924326)
    at c (xpui-modules.js:1:4608271)
    at dn (xpui-snapshot.js:1:46618)
    at am (xpui-snapshot.js:1:169853)
    at c (xpui-modules.js:1:2764663)
    at Suspense
    at pn (xpui-snapshot.js:1:46788)
    at a (xpui-modules.js:1:2276755)
    at a (xpui-modules.js:1:2996747)
    at l (xpui-modules.js:1:4857996)
    at Cx (xpui-snapshot.js:1:230510)
    at Lt (xpui-snapshot.js:1:43627)
    at kx (xpui-snapshot.js:1:230885)
    at Lx (xpui-snapshot.js:1:235678)
    at S (xpui-modules.js:1:4794167)
    at E (xpui-modules.js:1:4187590)
    at l (xpui-modules.js:1:6421092)
    at d (xpui-modules.js:1:3907101)
    at l (xpui-modules.js:1:3907576)
    at u (xpui-modules.js:1:1057160)
    at m (xpui-modules.js:1:2280791)
    at e (xpui-modules.js:1:3824014)
    at l (xpui-modules.js:1:2755788)
    at E (xpui-modules.js:1:2805089)
    at le (xpui-modules.js:1:5941889)
    at l (xpui-modules.js:1:6129795)
    at p (xpui-snapshot.js:1:11749)
    at Lt (xpui-snapshot.js:1:43627)
    at l (xpui-modules.js:1:4586533)
    at ye (xpui-snapshot.js:1:28848)
    at Qt (xpui-snapshot.js:1:44555)
    at Ot (xpui-snapshot.js:1:43953)
    at Dt (xpui-snapshot.js:1:43855)
    at a (xpui-modules.js:1:4939758)
    at a (xpui-modules.js:1:947302)
    at h (xpui-modules.js:1:7412494)
    at a (xpui-modules.js:1:5324236)
    at a (xpui-modules.js:1:2275587)
    at Ft (xpui-snapshot.js:1:44259)
    at s (xpui-modules.js:1:5253064)
    at u (xpui-modules.js:1:749066)
    at s (xpui-modules.js:1:48385)
    at a (xpui-modules.js:1:5008899)
    at ze (xpui-snapshot.js:1:31274)
    at s (xpui-modules.js:1:4809247)
    at Spicetify.ReactComponent.PlatformProvider (xpui-snapshot.js:1:42472)
    at c (xpui-modules.js:1:1243349)
    at Nt (xpui-snapshot.js:1:43391)
    at a (xpui-modules.js:1:4438816)
    at Ht (xpui-snapshot.js:1:44050)
    at a (xpui-modules.js:1:2396813)
    at Gt (xpui-snapshot.js:1:44631)
    at Lt (xpui-snapshot.js:1:43627)
    at Spicetify.ReactComponent.PlatformProvider (xpui-snapshot.js:1:44749)
    at fE (xpui-snapshot.js:1:264764)
    at j (xpui-modules.js:1:4461017)
    at m (xpui-modules.js:1:6642272)
    at Suspense
    at c (xpui-modules.js:1:4484046)
    at l (xpui-modules.js:1:4484121)
    at s (xpui-modules.js:1:4987377)
    at B (xpui-modules.js:1:2918330)
    at Xt (xpui-snapshot.js:1:45796)
    at vE (xpui-snapshot.js:1:264907)
    at m (xpui-modules.js:1:6642272)
    at Suspense
    at c (xpui-modules.js:1:4484046)
    at l (xpui-modules.js:1:4484121)
    at c (xpui-modules.js:1:1243349)

Also, there is a divergent branch issue. I'd like you to resolve it so I can push to oauth-bypass-ratelimits branch.

---

There's a new PR #245 that wants to merge 9 commits into harbassan:main from Akshay-86:main. Is there anything in those commits that we should integrate into our branch? 
