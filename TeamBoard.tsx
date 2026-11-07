import { Users, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
export default function TeamBoard() {
  const board = trpc.classroom.teamBoard.useQuery(undefined, {
    refetchInterval: 3000,
  });
  if (board.isPending) return null;
  if (board.isError)
    return (
      <div className="error-banner">
        Team standings couldn't be loaded.{" "}
        <button onClick={() => board.refetch()}>Try again</button>
      </div>
    );
  return (
    <section className="panel team-board">
      <div className="panel-header">
        <div>
          <h2>
            <Users size={21} />
            Classroom team standings
          </h2>
          <p>
            Team Battle correct answers and Grammar Auction net winnings.
            Separate from individual points.
          </p>
        </div>
      </div>
      {!board.data?.teams.length ? (
        <p className="team-empty">
          Your first team round will start the scoreboard.
        </p>
      ) : (
        <div className="team-score-grid">
          {board.data.teams.map((team, index) => (
            <div key={team.name}>
              <span>
                <Trophy size={18} />
                {index + 1}
              </span>
              <strong>{team.name}</strong>
              <b>{team.score}</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
