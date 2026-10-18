// app/src/components/ConditionProfileSelector.tsx

import React, { useState, useEffect } from "react";
import {
  profiles,
  getProfile,
  ConditionProfile,
} from "../conditionProfiles/index";

/** Simple selector that drives UI based on a condition profile */
export const ConditionProfileSelector: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id ?? "");
  const [profile, setProfile] = useState<ConditionProfile | undefined>(
    getProfile(selectedId)
  );

  useEffect(() => {
    setProfile(getProfile(selectedId));
  }, [selectedId]);

  if (!profile) return null;

  return (
    <div className="p-4">
      <label htmlFor="profile-select" className="mr-2 font-bold">
        Condition Profile:
      </label>
      <select
        id="profile-select"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="border rounded p-1"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.displayName}
          </option>
        ))}
      </select>

      {profile.clinicalReviewStatus === "unreviewed" && (
        <div
          role="alert"
          className="mt-2 p-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded"
        >
          Safety: This profile is unreviewed. Use under supervision of a
          qualified caregiver or health worker.
        </div>
      )}

      <section className="mt-4">
        <h2 className="text-lg font-semibold">Recommended Games</h2>
        <ul className="list-disc list-inside">
          {profile.recommendedGames.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4">
        <h2 className="text-lg font-semibold">Accessibility Preset</h2>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(
          profile.accessibilityPreset,
          null,
          2
        )}</pre>
      </section>
    </div>
  );
};
