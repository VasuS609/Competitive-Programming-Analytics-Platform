import { useState } from "react";
import { ProfileContext } from "./profileContext";
import { PLATFORM_IDS } from "../config/platforms";

const STORAGE_KEY = "dsa-tracker:profile:v1";

const DEFAULT_PROFILE = {
  activePlatform: PLATFORM_IDS[0] ?? "codeforces",
  days: 7,
  handles: Object.fromEntries(PLATFORM_IDS.map((id) => [id, ""])),
};

function validateProfile(value) {
  if (!value || typeof value !== "object") return DEFAULT_PROFILE;
  if (!PLATFORM_IDS.includes(value.activePlatform)) return DEFAULT_PROFILE;
  if (!value.handles || typeof value.handles !== "object") return DEFAULT_PROFILE;

  const handles = {};
  for (const platform of PLATFORM_IDS) {
    if (typeof value.handles[platform] !== "string") return DEFAULT_PROFILE;
    const handle = value.handles[platform].trim();
    if (handle.length > 40) return DEFAULT_PROFILE;
    handles[platform] = handle;
  }

  return {
    activePlatform: value.activePlatform,
    days: value.days === 30 ? 30 : 7,
    handles,
  };
}

function readProfile() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? validateProfile(JSON.parse(stored)) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage may be unavailable; in-memory state remains usable.
  }
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(readProfile);

  // Always use the functional form to avoid stale-closure overwrites.
  const updateProfile = (patch) => {
    setProfile((prev) => {
      const next = validateProfile({ ...prev, ...patch });
      writeProfile(next);
      return next;
    });
  };

  const setActivePlatform = (activePlatform) => {
    if (!PLATFORM_IDS.includes(activePlatform)) return;
    updateProfile({ activePlatform });
  };

  const setHandle = (platform, handle) => {
    if (!PLATFORM_IDS.includes(platform) || typeof handle !== "string") return;
    const trimmedHandle = handle.trim();
    if (trimmedHandle.length > 40) return;
    // Use functional form so concurrent handle updates don't overwrite each other.
    setProfile((prev) => {
      const next = validateProfile({
        ...prev,
        handles: { ...prev.handles, [platform]: trimmedHandle },
      });
      writeProfile(next);
      return next;
    });
  };

  return (
    <ProfileContext.Provider
      value={{
        activePlatform: profile.activePlatform,
        days: profile.days,
        handles: profile.handles,
        setActivePlatform,
        setHandle,
        setDays: (days) => {
          if (days !== 7 && days !== 30) return;
          updateProfile({ days });
        },
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
