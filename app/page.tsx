import { BoardView } from "./board";
import { loadBoard } from "@/lib/load-board";

export const dynamic = "force-dynamic";

export default async function Home() {
  const board = await loadBoard();
  return <BoardView board={board} />;
}
