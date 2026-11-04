"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Pause, Play, RotateCcw, SendHorizontal } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import RequestComposer from "./request-composer";

/**
 * Homepage onboarding: a ~30 second, auto-advancing presentation that ends on
 * the request composer.
 *
 * tagline → who we are → typed example → why (4 values) → how (4 steps) → compose
 *
 * One pausable clock drives every scene, so pause / tab-hide / skip all stay
 * consistent. Visitors can tap to advance, jump with the progress bar, pause,
 * or skip straight to the composer; returning visitors start on the composer.
 * The narrative is also rendered as static text for screen readers and crawlers.
 */

const SCENES = ["tagline", "who", "example", "why", "how"];
const COMPOSE = SCENES.length;
const SEEN_KEY = "lenaqar_onboarding_seen_v1";

const TYPE_DELAY = 700;
const TYPE_SPEED = 30;
const TYPE_HOLD = 1900;
const WHY_START = 450;
const WHY_STEP = 1150;
const HOW_START = 450;
const HOW_STEP = 1000;

const EASE = [0.22, 1, 0.36, 1];

function sceneDuration(scene, exampleLength, reduced) {
  switch (scene) {
    case "tagline":
      return 3800;
    case "who":
      return 6800;
    case "example":
      return reduced
        ? 6500
        : TYPE_DELAY + exampleLength * TYPE_SPEED + TYPE_HOLD;
    case "why":
      return WHY_START + 4 * WHY_STEP + 2200;
    case "how":
      return HOW_START + 4 * HOW_STEP + 2200;
    default:
      return null;
  }
}

/** Per-scene elapsed time in ms. Pauses cleanly; never leaks across scenes. */
function useSceneClock(sceneIndex, running) {
  const [clock, setClock] = useState({ scene: sceneIndex, ms: 0 });

  useEffect(() => {
    if (!running) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      // Cap the step so a backgrounded tab doesn't jump scenes on return.
      const dt = Math.min(now - last, 100);
      last = now;
      setClock((prev) => ({
        scene: sceneIndex,
        ms: (prev.scene === sceneIndex ? prev.ms : 0) + dt,
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sceneIndex, running]);

  return clock.scene === sceneIndex ? clock.ms : 0;
}

function RevealWords({ text, elapsed, start = 0, step = 120, reduced }) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  return words.map((word, index) => {
    const shown = reduced || elapsed >= start + index * step;
    return (
      <span key={`${index}-${word}`}>
        {index > 0 ? " " : null}
        <motion.span
          className="inline-block"
          initial={false}
          animate={
            shown
              ? { opacity: 1, filter: "blur(0px)", y: 0 }
              : { opacity: 0, filter: "blur(10px)", y: "0.35em" }
          }
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
        >
          {word}
        </motion.span>
      </span>
    );
  });
}

function wordsEnd(text, start, step) {
  const count = String(text || "").split(/\s+/).filter(Boolean).length;
  return start + Math.max(count - 1, 0) * step + 700;
}

function SceneLabel({ children }) {
  return (
    <p className="mb-6 text-center text-sm font-semibold tracking-wide text-primary/60 sm:mb-8 sm:text-base">
      {children}
    </p>
  );
}

// Measured line widths (in em) of the tagline in its display font, plus a small
// buffer, so the tagline always fits on ONE line from phones to desktop.
const TAGLINE_EM = { ar: 19.6, en: 18.2 };

function TaglineScene({ text, locale }) {
  // Pure CSS reveal (see .lq-word in globals.css): it starts at first paint,
  // before hydration, so the opening line never waits on JavaScript.
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const em = TAGLINE_EM[locale === "en" ? "en" : "ar"];
  return (
    <div className="text-center">
      <p
        className="lq-display whitespace-nowrap font-bold leading-snug text-primary"
        style={{ fontSize: `min(3.5rem, calc((100vw - 2.5rem) / ${em}))` }}
      >
        {words.map((word, index) => (
          <span key={`${index}-${word}`}>
            {index > 0 ? " " : null}
            <span className="lq-word" style={{ animationDelay: `${250 + index * 150}ms` }}>
              {word}
            </span>
          </span>
        ))}
      </p>
      <div
        aria-hidden="true"
        className="lq-underline mx-auto mt-6 h-[3px] w-24 rounded-full bg-primary sm:w-40"
        style={{ animationDelay: `${250 + words.length * 150 + 300}ms` }}
      />
    </div>
  );
}

function WhoScene({ line1, line2, elapsed, reduced }) {
  const line2Start = wordsEnd(line1, 150, 85) + 350;
  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className="lq-display text-[clamp(1.05rem,3.1vw,1.9rem)] leading-relaxed text-black/55 text-balance">
        <RevealWords text={line1} elapsed={elapsed} start={150} step={85} reduced={reduced} />
      </p>
      <p className="lq-display mt-6 text-[clamp(1.45rem,4.6vw,3.25rem)] font-bold leading-snug text-primary text-balance sm:mt-8">
        <RevealWords text={line2} elapsed={elapsed} start={line2Start} step={140} reduced={reduced} />
      </p>
    </div>
  );
}

function ExampleScene({ label, text, sendLabel, elapsed, reduced }) {
  const count = reduced
    ? text.length
    : Math.max(0, Math.min(text.length, Math.floor((elapsed - TYPE_DELAY) / TYPE_SPEED)));
  const done = count >= text.length;
  return (
    <div className="mx-auto w-full max-w-2xl">
      <SceneLabel>{label}</SceneLabel>
      <div className="rounded-3xl border border-primary/20 bg-white p-5 text-start shadow-[0_24px_60px_-32px_rgba(3,2,80,0.45)] sm:p-6">
        {/* Invisible full copy reserves the final height so nothing jumps while typing. */}
        <div className="grid text-[clamp(1.02rem,2.4vw,1.3rem)] leading-relaxed">
          <p className="invisible col-start-1 row-start-1" aria-hidden="true">
            {text}
          </p>
          <p className="col-start-1 row-start-1 text-black">
            {text.slice(0, count)}
            <span
              aria-hidden="true"
              className={`ms-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.2em] bg-primary ${done ? "lq-caret" : ""}`}
            />
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <motion.span
            initial={false}
            animate={done ? { opacity: 1, scale: [1, 1.06, 1] } : { opacity: 0.35, scale: 1 }}
            transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
          >
            {sendLabel}
            <SendHorizontal aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function WhyScene({ label, lines, elapsed, reduced }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <SceneLabel>{label}</SceneLabel>
      <ul className="space-y-4 sm:space-y-6">
        {lines.map((line, index) => {
          const shown = reduced || elapsed >= WHY_START + index * WHY_STEP;
          return (
            <motion.li
              key={line}
              initial={false}
              animate={shown ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 14, filter: "blur(6px)" }}
              transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
              className="lq-display flex items-center gap-3 text-[clamp(1.02rem,2.7vw,1.7rem)] font-bold leading-snug text-primary sm:gap-4"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-white sm:size-10">
                <Check aria-hidden="true" className="size-4 sm:size-5" strokeWidth={3} />
              </span>
              <span>{line}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function HowScene({ label, steps, elapsed, reduced, formatNumber }) {
  const progress = reduced
    ? 1
    : Math.max(0, Math.min(1, (elapsed - HOW_START) / ((steps.length - 1) * HOW_STEP)));
  return (
    <div className="mx-auto w-full max-w-5xl">
      <SceneLabel>{label}</SceneLabel>
      <ol className="relative grid gap-7 sm:grid-cols-4 sm:gap-4">
        {/* Connector: vertical on mobile, horizontal from sm. */}
        <span aria-hidden="true" className="absolute inset-y-6 start-6 w-[2px] bg-primary/10 sm:hidden">
          <span
            className="block h-full w-full origin-top bg-primary"
            style={{ transform: `scaleY(${progress})` }}
          />
        </span>
        <span aria-hidden="true" className="absolute top-6 hidden h-[2px] bg-primary/10 sm:block sm:inset-x-[12.5%]">
          <span
            className="block h-full w-full bg-primary ltr:origin-left rtl:origin-right"
            style={{ transform: `scaleX(${progress})` }}
          />
        </span>
        {steps.map((step, index) => {
          const shown = reduced || elapsed >= HOW_START + index * HOW_STEP;
          return (
            <motion.li
              key={step}
              initial={false}
              animate={shown ? { opacity: 1, y: 0 } : { opacity: 0.25, y: 8 }}
              transition={{ duration: reduced ? 0 : 0.5, ease: EASE }}
              className="relative flex items-center gap-4 sm:flex-col sm:gap-4 sm:text-center"
            >
              <span
                className={`lq-display relative z-10 grid size-12 shrink-0 place-items-center rounded-full border-2 text-lg font-bold ring-8 ring-white transition-colors duration-500 ${
                  shown ? "border-primary bg-primary text-white" : "border-primary/20 bg-white text-primary/40"
                }`}
              >
                {formatNumber(index + 1)}
              </span>
              <span className="lq-display text-[clamp(1.02rem,2vw,1.3rem)] font-bold leading-snug text-primary">
                {step}
              </span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

export default function HomeOnboarding() {
  const { translate, locale } = useI18n();
  const reduced = Boolean(useReducedMotion());
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const composerRef = useRef(null);
  const stageRef = useRef(null);
  const focusOnCompose = useRef(false);
  const [focusComposer, setFocusComposer] = useState(false);

  const t = (key) => translate(`lenaqar.onboarding.${key}`);
  const exampleText = t("exampleText");
  const intro = scene < COMPOSE;
  const sceneName = SCENES[scene];
  const duration = intro ? sceneDuration(sceneName, exampleText.length, reduced) : null;
  const elapsed = useSceneClock(scene, mounted && intro && !paused);
  const formatNumber = (n) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(n);

  const goTo = useCallback((index, { focus = false } = {}) => {
    const next = Math.max(0, Math.min(COMPOSE, index));
    focusOnCompose.current = focus && next === COMPOSE;
    setPaused(false);
    setScene(next);
  }, []);

  const skip = useCallback(() => goTo(COMPOSE, { focus: true }), [goTo]);

  // First visit plays the intro; returning visitors (or #request) start on the composer.
  useEffect(() => {
    setMounted(true);
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* storage blocked: play the intro */
    }
    if (window.location.hash === "#request") {
      goTo(COMPOSE, { focus: true });
    } else if (seen) {
      setScene(COMPOSE);
    }
  }, [goTo]);

  // Auto-advance when the current scene's time is up.
  useEffect(() => {
    if (!intro || duration == null || elapsed < duration) return;
    setScene((current) => (current === scene ? current + 1 : current));
  }, [elapsed, duration, intro, scene]);

  // Reaching the composer: remember it, and focus when the visitor asked to skip.
  useEffect(() => {
    if (!mounted || intro) return;
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    // Focus on explicit skip, or on desktop; never pop the phone keyboard on its own.
    const finePointer = window.matchMedia?.("(pointer: fine)").matches;
    setFocusComposer(focusOnCompose.current || Boolean(finePointer));
    focusOnCompose.current = false;
  }, [intro, mounted]);

  // Keyboard: arrows move (direction-aware), Space pauses, Escape skips.
  useEffect(() => {
    if (!intro) return undefined;
    const onKey = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      const rtl = document.documentElement.dir === "rtl";
      const forwardKey = rtl ? "ArrowLeft" : "ArrowRight";
      const backKey = rtl ? "ArrowRight" : "ArrowLeft";
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
      } else if (event.key === forwardKey) {
        event.preventDefault();
        goTo(scene + 1, { focus: true });
      } else if (event.key === backKey) {
        event.preventDefault();
        goTo(scene - 1);
      } else if (event.key === " " && (tag === "BODY" || target === stageRef.current)) {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [intro, scene, goTo, skip]);

  const whyLines = [t("why1"), t("why2"), t("why3"), t("why4")];
  const howSteps = [t("how1"), t("how2"), t("how3"), t("how4")];

  const renderScene = () => {
    switch (sceneName) {
      case "tagline":
        return (
          <TaglineScene text={t("tagline")} locale={locale} />
        );
      case "who":
        return <WhoScene line1={t("whoLine1")} line2={t("whoLine2")} elapsed={elapsed} reduced={reduced} />;
      case "example":
        return (
          <ExampleScene
            label={t("exampleLabel")}
            text={exampleText}
            sendLabel={t("send")}
            elapsed={elapsed}
            reduced={reduced}
          />
        );
      case "why":
        return <WhyScene label={t("whyLabel")} lines={whyLines} elapsed={elapsed} reduced={reduced} />;
      case "how":
        return (
          <HowScene
            label={t("howLabel")}
            steps={howSteps}
            elapsed={elapsed}
            reduced={reduced}
            formatNumber={formatNumber}
          />
        );
      default:
        return (
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="lq-display text-center text-[clamp(1.75rem,5vw,3.25rem)] font-bold leading-tight text-primary">
              {t("composerTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-base text-black/60 sm:text-lg">
              {t("composerSub")}
            </p>
            <RequestComposer ref={composerRef} autoFocus={focusComposer} className="mt-7 sm:mt-9" />
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => goTo(0)}
                className="compact-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary/70 transition-colors hover:bg-primary/5 hover:text-primary"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                {t("replay")}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <section
      id="request"
      aria-labelledby="lq-home-title"
      // Server-rendered flag: CSS hides the mobile sticky bar during the intro (no flash).
      data-lq-stage={intro ? "intro" : "compose"}
      className={`relative flex scroll-mt-20 flex-col bg-white ${
        intro ? "min-h-[calc(100svh-4rem)]" : ""
      }`}
    >
      <h1 id="lq-home-title" className="sr-only">
        {t("tagline")}
      </h1>

      {/* Static narrative: screen readers and crawlers get the whole story at once. */}
      <div className="sr-only">
        <p>{t("whoLine1")}</p>
        <p>{t("whoLine2")}</p>
        <h2>{t("whyLabel")}</h2>
        <ul>
          {whyLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <h2>{t("howLabel")}</h2>
        <ol>
          {howSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {intro && mounted ? (
        <div className="container flex items-center gap-3 pt-4 sm:gap-4 sm:pt-6">
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? t("play") : t("pause")}
            aria-pressed={paused}
            className="compact-btn grid size-9 shrink-0 place-items-center rounded-full text-primary/70 transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
          </button>
          <div role="group" aria-label={t("progressLabel")} className="flex flex-1 items-center gap-1.5">
            {SCENES.map((name, index) => {
              const fill =
                index < scene ? 1 : index === scene && duration ? Math.min(1, elapsed / duration) : 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={t("goToStep").replace("{n}", formatNumber(index + 1))}
                  aria-current={index === scene ? "step" : undefined}
                  className="compact-btn flex h-6 flex-1 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                >
                  <span className="block h-1 w-full overflow-hidden rounded-full bg-primary/10">
                    <span
                      className="block h-full w-full bg-primary ltr:origin-left rtl:origin-right"
                      style={{ transform: `scaleX(${fill})` }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={skip}
            className="compact-btn inline-flex min-h-9 shrink-0 items-center rounded-full border border-primary/15 px-3.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="sm:hidden">{t("skip")}</span>
            <span className="hidden sm:inline">{t("skipLong")}</span>
          </button>
        </div>
      ) : null}

      <div
        ref={stageRef}
        tabIndex={intro ? -1 : undefined}
        aria-hidden={intro ? true : undefined}
        onClick={intro ? () => goTo(scene + 1) : undefined}
        className={`flex flex-1 items-center justify-center px-4 outline-none ${
          intro ? "cursor-pointer select-none py-10" : "py-12 sm:py-16"
        }`}
      >
        {intro ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={sceneName}
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
              transition={{ duration: reduced ? 0.15 : 0.5, ease: EASE }}
              className="w-full"
            >
              {renderScene()}
            </motion.div>
          </AnimatePresence>
        ) : (
          // Outside the scene transition on purpose: the composer must never wait
          // on an exit animation (returning visitors, skip). CSS fade only.
          <div className="lq-fade-up w-full">{renderScene()}</div>
        )}
      </div>

      {intro && mounted ? (
        <p aria-hidden="true" className="pb-6 text-center text-xs text-black/35 sm:pb-8 sm:text-sm">
          {t("tapHint")}
        </p>
      ) : null}
    </section>
  );
}
