"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

type Zone = {
  name: string;
  scores: Record<string, number>;
  highestScore: number;
  leadingTeams: string[];
};

const defaultTeamColor = "#74785b";

const mapTerritories = [
  { x: 2, y: 4, w: 18, h: 20, shape: "8% 8%, 92% 0, 100% 74%, 70% 100%, 0 88%" },
  { x: 18, y: 2, w: 18, h: 22, shape: "10% 0, 100% 12%, 88% 100%, 18% 86%, 0 40%" },
  { x: 34, y: 4, w: 18, h: 19, shape: "0 14%, 72% 0, 100% 38%, 86% 100%, 10% 86%" },
  { x: 50, y: 2, w: 20, h: 22, shape: "18% 0, 100% 8%, 92% 72%, 64% 100%, 0 82%, 8% 28%" },
  { x: 68, y: 5, w: 16, h: 18, shape: "0 0, 100% 10%, 86% 92%, 24% 100%, 8% 58%" },
  { x: 82, y: 3, w: 16, h: 22, shape: "12% 8%, 100% 0, 92% 100%, 0 86%, 10% 44%" },
  { x: 4, y: 22, w: 17, h: 21, shape: "0 18%, 84% 0, 100% 100%, 20% 86%" },
  { x: 20, y: 23, w: 16, h: 20, shape: "16% 0, 100% 16%, 82% 100%, 0 82%, 8% 28%" },
  { x: 34, y: 21, w: 18, h: 22, shape: "8% 8%, 88% 0, 100% 54%, 70% 100%, 0 90%" },
  { x: 51, y: 23, w: 17, h: 20, shape: "0 0, 100% 12%, 90% 88%, 26% 100%, 8% 46%" },
  { x: 66, y: 22, w: 17, h: 22, shape: "14% 0, 100% 18%, 84% 100%, 0 82%, 8% 22%" },
  { x: 81, y: 24, w: 17, h: 19, shape: "6% 0, 100% 14%, 88% 86%, 10% 100%, 0 38%" },
  { x: 2, y: 42, w: 18, h: 21, shape: "8% 0, 100% 10%, 90% 94%, 0 100%, 14% 42%" },
  { x: 18, y: 42, w: 18, h: 22, shape: "0 10%, 74% 0, 100% 34%, 86% 100%, 14% 88%" },
  { x: 35, y: 43, w: 16, h: 20, shape: "10% 0, 100% 20%, 84% 100%, 0 84%, 8% 30%" },
  { x: 50, y: 42, w: 18, h: 23, shape: "0 18%, 78% 0, 100% 82%, 56% 100%, 8% 72%" },
  { x: 66, y: 43, w: 18, h: 20, shape: "10% 0, 92% 8%, 100% 68%, 70% 100%, 0 82%" },
  { x: 82, y: 42, w: 16, h: 22, shape: "0 12%, 90% 0, 100% 100%, 16% 88%" },
  { x: 4, y: 62, w: 17, h: 24, shape: "0 0, 92% 14%, 100% 84%, 22% 100%, 8% 48%" },
  { x: 20, y: 64, w: 18, h: 21, shape: "8% 0, 100% 8%, 84% 100%, 0 86%, 18% 38%" },
  { x: 36, y: 63, w: 17, h: 23, shape: "0 16%, 78% 0, 100% 38%, 90% 100%, 10% 86%" },
  { x: 52, y: 64, w: 17, h: 21, shape: "14% 0, 100% 12%, 82% 92%, 32% 100%, 0 64%" },
  { x: 68, y: 63, w: 17, h: 23, shape: "0 8%, 86% 0, 100% 86%, 16% 100%, 8% 36%" },
  { x: 83, y: 64, w: 15, h: 21, shape: "10% 0, 100% 18%, 88% 100%, 0 80%" },
];


function records(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value);
  }

  return [];
}

function scoreValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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

function parseZones(value: unknown): Zone[] {
  return records(value)
    .filter(
      (
        item,
      ): item is {
        zoneName: string;
        scores?: unknown;
        highestScore?: unknown;
        leadingTeams?: unknown;
      } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { zoneName?: unknown }).zoneName === "string",
    )
    .map((item) => {
      const scores =
        item.scores && typeof item.scores === "object" && !Array.isArray(item.scores)
          ? Object.fromEntries(
              Object.entries(item.scores)
                .map(([team, score]) => [team, scoreValue(score)] as const)
                .filter((entry): entry is [string, number] => entry[1] !== null),
            )
          : {};

      const highestScore =
        typeof item.highestScore === "number"
          ? item.highestScore
          : Math.max(0, ...Object.values(scores));

      const leadingTeams = Array.isArray(item.leadingTeams)
        ? item.leadingTeams.filter((team): team is string => typeof team === "string")
        : Object.entries(scores)
            .filter(([, score]) => score === highestScore)
            .map(([team]) => team);
      const hasAnyScore = Object.values(scores).some((score) => score > 0);

      return {
        name: item.zoneName,
        scores,
        highestScore,
        leadingTeams: hasAnyScore ? leadingTeams : [],
      };
    });
}

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);
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
          zones?: unknown;
        } | null;
        console.log("Firebase leaderboards data:", value);
        setTeams(parseTeams(value?.teams));
        setSoldiers(parseSoldiers(value?.individuals));
        setZones(parseZones(value?.zones));
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

  const zoneTeamNames = useMemo(() => teams.map((team) => team.name), [teams]);
  const selectedZone =
    selectedZoneIndex === null ? null : (zones[selectedZoneIndex] ?? null);
  const selectedZoneLeaderColor =
    selectedZone && selectedZone.leadingTeams.length > 0
      ? teamColors[selectedZone.leadingTeams[0]]
      : undefined;

  function closeMap() {
    setSelectedZoneIndex(null);
    setIsMapOpen(false);
  }

  return (
    <main>
      <div className="eventBadge" aria-label="undefeted event title">
        <div className="eventBadgeImage" aria-hidden="true">
          <span className="eventBadgeRing" />
          <span className="eventBadgeStar" />
        </div>
        <div className="eventBadgeText">
          <h1>undefeated</h1>
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

      <button
        className="mapTab"
        type="button"
        aria-expanded={isMapOpen}
        aria-controls="zone-map-panel"
        onClick={() => setIsMapOpen(true)}
      >
        <span>MAP ZONES</span>
      </button>

      {isMapOpen && (
        <div
          className="mapOverlay"
          id="zone-map-panel"
          role="dialog"
          aria-modal="true"
          aria-label="24 zone control map"
        >
          <button
            className="mapBackdrop"
            type="button"
            aria-label="Close zone map"
            onClick={closeMap}
          />
          <div className="zoneMap">
            <header className="zoneMapHeader">
              <div>
                <p>CONTROL MAP</p>
                <h2>24 Zones</h2>
              </div>
              <button
                className="closeMap"
                type="button"
                aria-label="Close zone map"
                onClick={closeMap}
              >
                X
              </button>
            </header>

            <div className="mapLegend" aria-label="Team color legend">
              {teams.map((team) => (
                <span key={team.name}>
                  <i style={{ backgroundColor: team.color }} />
                  {team.name}
                </span>
              ))}
            </div>

            <div className="zoneMapViewport">
              {zones.length === 0 && !isLoading && (
                <p className="emptyState zoneEmpty">
                  {loadError ? "ZONE FEED UNAVAILABLE" : "NO ZONE INTEL RECEIVED"}
                </p>
              )}
              <div className="territoryCanvas">
                {zones.map((zone, index) => {
                  const territory = mapTerritories[index % mapTerritories.length];
                  const hasSingleWinner =
                    zone.highestScore > 0 && zone.leadingTeams.length === 1;
                  const winner = hasSingleWinner ? zone.leadingTeams[0] : null;
                  const winnerColor = winner ? teamColors[winner] : undefined;
                  const contenders =
                    zone.leadingTeams.length > 0 ? zone.leadingTeams.join(" / ") : "NO DATA";
                  const scoreTeams =
                    zoneTeamNames.length > 0 ? zoneTeamNames : Object.keys(zone.scores);

                  return (
                    <button
                      className={`mapRegion ${hasSingleWinner ? "isCaptured" : ""}`}
                      key={`${zone.name}-${index}`}
                      type="button"
                      aria-label={`Open ${zone.name} zone details`}
                      aria-haspopup="dialog"
                      onClick={() => setSelectedZoneIndex(index)}
                      style={
                        {
                          "--zone-color": winnerColor ?? defaultTeamColor,
                          "--zone-x": `${territory.x}%`,
                          "--zone-y": `${territory.y}%`,
                          "--zone-w": `${territory.w}%`,
                          "--zone-h": `${territory.h}%`,
                          "--zone-shape": `polygon(${territory.shape})`,
                        } as CSSProperties
                      }
                    >
                      <div className="regionInner">
                        <div className="regionTopline">
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{winner ?? "TIE"}</strong>
                        </div>
                        <h3>{zone.name}</h3>
                        <p>{contenders}</p>
                        <dl className="regionScores">
                          {scoreTeams.map((team) => (
                            <div key={team} title={team}>
                              <dt>
                                <span
                                  style={{
                                    backgroundColor: teamColors[team] ?? defaultTeamColor,
                                  }}
                                />
                              </dt>
                              <dd>{(zone.scores[team] ?? 0).toLocaleString()}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedZone && (
            <div
              className="zoneDetailOverlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="zone-detail-title"
            >
              <button
                className="zoneDetailBackdrop"
                type="button"
                aria-label="Close zone details"
                onClick={() => setSelectedZoneIndex(null)}
              />
              <section
                className="zoneDetailModal"
                style={
                  {
                    "--zone-detail-color": selectedZoneLeaderColor ?? defaultTeamColor,
                  } as CSSProperties
                }
              >
                {(() => {
                  const zoneNumber = (selectedZoneIndex ?? 0) + 1;
                  const scoreTeams = Array.from(
                    new Set([...zoneTeamNames, ...Object.keys(selectedZone.scores)]),
                  );
                  const rankedScores = scoreTeams
                    .map((team) => ({
                      team,
                      score: selectedZone.scores[team] ?? 0,
                      color: teamColors[team] ?? defaultTeamColor,
                    }))
                    .sort((a, b) => b.score - a.score);
                  const hasSingleWinner =
                    selectedZone.highestScore > 0 &&
                    selectedZone.leadingTeams.length === 1;
                  const status = hasSingleWinner
                    ? `Captured by ${selectedZone.leadingTeams[0]}`
                    : selectedZone.leadingTeams.length > 1
                      ? "Contested tie"
                      : "No score reported";

                  return (
                    <>
                      <header className="zoneDetailHeader">
                        <div>
                          <p>ZONE {String(zoneNumber).padStart(2, "0")}</p>
                          <h2 id="zone-detail-title">{selectedZone.name}</h2>
                        </div>
                        <button
                          className="closeMap"
                          type="button"
                          aria-label="Close zone details"
                          onClick={() => setSelectedZoneIndex(null)}
                        >
                          X
                        </button>
                      </header>

                      <div className="zoneDetailStats">
                        <div>
                          <span>Status</span>
                          <strong>{status}</strong>
                        </div>
                        <div>
                          <span>Highest score</span>
                          <strong>{selectedZone.highestScore.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span>Leading teams</span>
                          <strong>
                            {selectedZone.leadingTeams.length > 0
                              ? selectedZone.leadingTeams.join(" / ")
                              : "-"}
                          </strong>
                        </div>
                      </div>

                      <div className="zoneDetailScores">
                        <h3>All team scores</h3>
                        <dl>
                          {rankedScores.map(({ team, score, color }) => (
                            <div key={team}>
                              <dt>
                                <span style={{ backgroundColor: color }} />
                                {team}
                              </dt>
                              <dd>{score.toLocaleString()}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </>
                  );
                })()}
              </section>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
