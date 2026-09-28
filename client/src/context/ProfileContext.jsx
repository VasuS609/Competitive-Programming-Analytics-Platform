import { useState } from "react";
import { ProfileContext } from "./profileContext";

const STORAGE_KEY = "dsa-tracker:profile:v1";
const PLATFORMS = ["codeforces", "codechef", "leetcode"];
const DEFAULT_PROFILE = {
  activePlatform: "codeforces",
  handles: {
    codeforces: "",
    codechef: "",
    leetcode: "",
  },
};

function validateProfile(value) {
  if (!value || typeof value !== "object") return DEFAULT_PROFILE;
  if (!PLATFORMS.includes(value.activePlatform)) return DEFAULT_PROFILE;
  if (!value.handles || typeof value.handles !== "object") return DEFAULT_PROFILE;

  const handles = {};
  for (const platform of PLATFORMS) {
    if (typeof value.handles[platform] !== "string") return DEFAULT_PROFILE;
    const handle = value.handles[platform].trim();
    if (handle.length > 40) return DEFAULT_PROFILE;
    handles[platform] = handle;
  }

  return { activePlatform: value.activePlatform, handles };
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

  const updateProfile = (nextProfile) => {
    setProfile((current) => {
      const next = validateProfile({ ...current, ...nextProfile });
      writeProfile(next);
      return next;
    });
  };

  const setActivePlatform = (activePlatform) => {
    if (!PLATFORMS.includes(activePlatform)) return;
    updateProfile({ activePlatform });
  };

  const setHandle = (platform, handle) => {
    if (!PLATFORMS.includes(platform) || typeof handle !== "string") return;
    const trimmedHandle = handle.trim();
    if (trimmedHandle.length > 40) return;
    updateProfile({ handles: { ...profile.handles, [platform]: trimmedHandle } });
  };

  return (
    <ProfileContext.Provider
      value={{
        activePlatform: profile.activePlatform,
        handles: profile.handles,
        setActivePlatform,
        setHandle,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

