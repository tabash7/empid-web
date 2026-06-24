"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getScreenshotCallouts,
  isScreenshotAnnotationVisible,
  isScreenshotModeEnabled,
  SCREENSHOT_NOTES_REFRESH_EVENT,
  type ScreenshotCallout
} from "../../lib/screenshotMode";

type PositionedCallout = ScreenshotCallout & {
  x: number;
  y: number;
};

function readPositions(callouts: ScreenshotCallout[]): PositionedCallout[] {
  return callouts
    .map((note) => {
      const target = document.querySelector(note.selector);
      if (!(target instanceof Element)) {
        return null;
      }
      const rect = target.getBoundingClientRect();
      return {
        selector: note.selector,
        text: note.text,
        x: Math.max(12, rect.left + 14),
        y: Math.max(12, rect.top + 14)
      };
    })
    .filter((entry): entry is PositionedCallout => Boolean(entry));
}

export function ScreenshotOverlay() {
  const [visible, setVisible] = useState(false);
  const [callouts, setCallouts] = useState<ScreenshotCallout[]>([]);
  const [positions, setPositions] = useState<PositionedCallout[]>([]);

  const refresh = () => {
    const modeEnabled = isScreenshotModeEnabled();
    const annotationsEnabled = isScreenshotAnnotationVisible();
    setVisible(modeEnabled && annotationsEnabled);
    const next = modeEnabled ? getScreenshotCallouts() : [];
    setCallouts(next);
    setPositions(modeEnabled ? readPositions(next) : []);
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    const onResize = () => {
      const latest = isScreenshotModeEnabled() ? getScreenshotCallouts() : [];
      setPositions(isScreenshotModeEnabled() ? readPositions(latest) : []);
    };
    const observer = new MutationObserver(() => {
      if (isScreenshotModeEnabled()) {
        onResize();
      }
    });

    observer.observe(document.documentElement || document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
      subtree: true,
      childList: true
    });

    window.addEventListener(SCREENSHOT_NOTES_REFRESH_EVENT, onChange);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener(SCREENSHOT_NOTES_REFRESH_EVENT, onChange);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, []);

  const visibleCallouts = useMemo(() => {
    if (!visible) return [];
    return positions.length > 0 ? positions : [];
  }, [positions, visible]);

  if (!visible || visibleCallouts.length === 0) return null;

  return (
    <div
      id="empid-screenshot-overlay"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2147483647
      }}
      aria-hidden="true"
    >
      {visibleCallouts.map((note, index) => (
        <div
          key={`${note.selector}-${index}`}
          style={{
            position: "absolute",
            left: note.x,
            top: note.y,
            maxWidth: 330,
            padding: "8px 10px",
            background: "rgba(7,35,82,0.95)",
            color: "#fff",
            border: "2px solid #ffd94a",
            borderRadius: 10,
            fontSize: 12,
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
            fontFamily: "Arial, sans-serif"
          }}
        >
          <span
            style={{
              display: "inline-flex",
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#ffd94a",
              color: "#072352",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 6,
              fontWeight: 700,
              fontSize: 10,
              transform: "translateY(1px)"
            }}
          >
            {index + 1}
          </span>
          <span>{note.text}</span>
        </div>
      ))}
    </div>
  );
}

export default ScreenshotOverlay;


