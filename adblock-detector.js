(function () {
    const opts = {
        alertOnDetect: !0,
        consoleLog: !0,
        runScriptProbe: !0,
        runFetchProbe: !0,
        fetchProbeUrl: "/__ad_probe__",
        scriptProbeUrl:
            "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
        timeout: 1e3,
        combinedTimeout: 2e3,
    };
    const events = { onDetected: [], onNotDetected: [] };
    const state = {
        dom: !1,
        mutation: !1,
        scriptBlocked: !1,
        fetchBlocked: !1,
        timingSuspect: !1,
        decided: null,
    };

    function emitDetected(i) {
        events.onDetected.forEach((f) => f(i));
    }
    function emitNotDetected(i) {
        events.onNotDetected.forEach((f) => f(i));
    }
    function domBaitCheck() {
        return new Promise((r) => {
            try {
                const cls = "pub_" + Math.floor(Math.random() * 1e6),
                    b = document.createElement("div");
                b.className = cls + " pub_300x250 pub_728x90 text-ad";
                b.style.cssText =
                    "width:1px!important;height:1px!important;position:absolute!important;left:-9999px!important;top:-9999px!important;";
                b.setAttribute("data-ad-bait", "1");
                document.body.appendChild(b);
                setTimeout(() => {
                    const c = window.getComputedStyle
                        ? getComputedStyle(b)
                        : null;
                    const hidden =
                        !b.offsetParent ||
                        b.offsetHeight === 0 ||
                        b.offsetWidth === 0 ||
                        (c &&
                            (c.display === "none" ||
                                c.visibility === "hidden"));
                    if (hidden) {
                        state.dom = !0;
                        cleanup();
                        r(!0);
                        return;
                    }
                    let obs = new MutationObserver((m) => {
                        for (const mm of m)
                            if (
                                mm.type === "childList" &&
                                !document.body.contains(b)
                            ) {
                                state.mutation = !0;
                                obs.disconnect();
                                cleanup();
                                r(!0);
                                return;
                            }
                    });
                    obs.observe(document.body, { childList: !0, subtree: !0 });
                    setTimeout(() => {
                        try {
                            obs && obs.disconnect();
                        } catch (e) {}
                        cleanup();
                        r(!1);
                    }, opts.timeout);
                }, 50);
                function cleanup() {
                    try {
                        b && b.parentNode && b.parentNode.removeChild(b);
                    } catch (e) {}
                }
            } catch (e) {
                r(!1);
            }
        });
    }
    function scriptProbeCheck() {
        return new Promise((r) => {
            if (!opts.runScriptProbe) return r(!1);
            try {
                const id = randName("sp_"),
                    s = document.createElement("script");
                s.src =
                    opts.scriptProbeUrl +
                    "?_=" +
                    Math.random().toString(36).slice(2, 8);
                s.async = !0;
                s.id = id;
                let finished = !1;
                s.onerror = function () {
                    if (finished) return;
                    finished = !0;
                    state.scriptBlocked = !0;
                    cleanup();
                    r(!0);
                };
                s.onload = function () {
                    if (finished) return;
                    finished = !0;
                    cleanup();
                    r(!1);
                };
                document.head.appendChild(s);
                setTimeout(() => {
                    if (!finished) {
                        finished = !0;
                        state.scriptBlocked = !0;
                        cleanup();
                        r(!0);
                    }
                }, opts.timeout);
                function cleanup() {
                    try {
                        const e = document.getElementById(id);
                        e && e.parentNode && e.parentNode.removeChild(e);
                    } catch (e) {}
                }
            } catch (e) {
                r(!1);
            }
        });
    }
    function fetchProbeCheck() {
        return new Promise((r) => {
            if (!opts.runFetchProbe) return r(!1);
            fetch(opts.fetchProbeUrl, { method: "HEAD", cache: "no-store" })
                .then((resp) => {
                    if (!resp.ok) {
                        state.fetchBlocked = !0;
                        r(!0);
                        return;
                    }
                    r(!1);
                })
                .catch((err) => {
                    state.fetchBlocked = !0;
                    r(!0);
                });
            setTimeout(() => {}, opts.timeout + 200);
        });
    }
    function timingCheck() {
        return new Promise((r) => {
            try {
                const t0 = performance.now(),
                    el = document.createElement("div");
                el.style.cssText = "position:absolute;left:-9999px;";
                document.body.appendChild(el);
                for (let i = 0; i < 1e4; i++) el.textContent = i;
                const t1 = performance.now();
                try {
                    el.parentNode.removeChild(el);
                } catch (e) {}
                const delta = t1 - t0;
                const suspect = delta > 200;
                if (suspect) state.timingSuspect = !0;
                r(suspect);
            } catch (e) {
                r(!1);
            }
        });
    }
    async function runAll() {
        const results = await Promise.allSettled([
            domBaitCheck(),
            scriptProbeCheck(),
            fetchProbeCheck(),
            timingCheck(),
        ]);
        const bools = results.map((r) =>
            r.status === "fulfilled" && r.value ? 1 : 0
        );
        const anyDetected =
            bools.some((v) => v === 1) ||
            state.mutation ||
            state.dom ||
            state.scriptBlocked ||
            state.fetchBlocked ||
            state.timingSuspect;
        setTimeout(() => {
            if (anyDetected) {
                state.decided = !0;
                emitDetected({
                    dom: state.dom,
                    mutation: state.mutation,
                    scriptBlocked: state.scriptBlocked,
                    fetchBlocked: state.fetchBlocked,
                    timingSuspect: state.timingSuspect,
                    rawResults: results,
                });
            } else {
                state.decided = !1;
                emitNotDetected({ rawResults: results });
            }
        }, opts.combinedTimeout);
    }
    const detector = {
        run: runAll,
        onDetected: (fn) => events.onDetected.push(fn),
        onNotDetected: (fn) => events.onNotDetected.push(fn),
        getState: () => JSON.parse(JSON.stringify(state)),
        setOptions: (o) => Object.assign(opts, o),
    };
    detector.onDetected((e) => {
        console.log("detected");
    });
    detector.onNotDetected((e) => {
        console.log("no detected");
    });
    runAll();
    window.__ad_detector_test = detector;
})();
