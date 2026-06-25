"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database, initializeAnalytics } from "../lib/firebase";

type Team = {
  name: string;
  score: number;
  color: string;
};

type Soldier = {
  name: string;
  team: string;
  score: number;
};

const defaultTeamColor = "#74785b";

function records(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value);
  }

  return [];
}

function parseTeams(value: unknown): Team[] {
  return records(value)
    .filter(
      (
        item,
      ): item is {
        teamName: string;
        score: number;
        color?: unknown;
        teamColor?: unknown;
        primaryColor?: unknown;
      } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { teamName?: unknown }).teamName === "string" &&
        typeof (item as { score?: unknown }).score === "number",
    )
    .map((item) => {
      const backendColor = [item.color, item.teamColor, item.primaryColor].find(
        (color): color is string => typeof color === "string" && color.trim() !== "",
      );

      return {
        name: item.teamName,
        score: item.score,
        color: backendColor ?? defaultTeamColor,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function parseSoldiers(value: unknown): Soldier[] {
  return records(value)
    .filter(
      (item): item is { name: string; teamName: string; score: number } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { name?: unknown }).name === "string" &&
        typeof (item as { teamName?: unknown }).teamName === "string" &&
        typeof (item as { score?: unknown }).score === "number",
    )
    .map((item) => ({
      name: item.name,
      team: item.teamName,
      score: item.score,
    }))
    .sort((a, b) => b.score - a.score);
}

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    void initializeAnalytics();

    return onValue(
      ref(database, "leaderboards"),
      (snapshot) => {
        const value = snapshot.val() as {
          teams?: unknown;
          individuals?: unknown;
        } | null;
        console.log("Firebase leaderboards data:", value);
        setTeams(parseTeams(value?.teams));
        setSoldiers(parseSoldiers(value?.individuals));
        setLoadError(false);
        setIsLoading(false);
      },
      () => {
        setLoadError(true);
        setIsLoading(false);
      },
    );
  }, []);

  const teamColors = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.name, team.color])),
    [teams],
  );

  return (
    <main>
      <div className="eventBadge" aria-label="undefeted event title">
        <div className="eventBadgeImage" aria-hidden="true">
          <span className="eventBadgeRing" />
          <span className="eventBadgeStar" />
        </div>
        <div className="eventBadgeText">
          <h1>undefeted</h1>
        </div>
      </div>

      {isLoading && (
        <div className="loadingOverlay" role="status" aria-live="polite">
          <div className="radar" aria-hidden="true">
            <span className="radarSweep" />
            <span className="radarBlip radarBlipOne" />
            <span className="radarBlip radarBlipTwo" />
          </div>
          <p className="loadingCode">COMMS // FIREBASE RTDB</p>
          <h2>Acquiring battlefield data</h2>
          <div className="signalBars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="loadingMessage">Establishing secure live feed...</p>
        </div>
      )}

      <section className="teams">
        <div className="teamList">
          {!isLoading && teams.length === 0 && (
            <p className="emptyState">
              {loadError ? "SIGNAL LOST // RETRYING" : "NO TEAM INTEL RECEIVED"}
            </p>
          )}
          {teams.map((team, index) => (
            <article className="team" key={team.name}>
              <span className="rank">{String(index + 1).padStart(2, "0")}</span>
              <span
                className="teamMark"
                style={{ backgroundColor: team.color }}
                aria-hidden="true"
              />
              <div>
                <h2>{team.name}</h2>
              </div>
              <strong>{team.score.toLocaleString()}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="leaderboard">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Soldier</th>
                <th>Team</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && soldiers.length === 0 && (
                <tr>
                  <td className="emptyState" colSpan={4}>
                    {loadError
                      ? "LIVE FEED UNAVAILABLE"
                      : "NO SOLDIER INTEL RECEIVED"}
                  </td>
                </tr>
              )}
              {soldiers.map(({ name, team, score }, index) => (
                <tr key={name}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td className="soldier">{name}</td>
                  <td>
                    <span
                      className="dot"
                      style={{ backgroundColor: teamColors[team] ?? defaultTeamColor }}
                    />
                    {team}
                  </td>
                  <td className="score">{score.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
