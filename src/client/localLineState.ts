import { useCallback, useEffect, useState } from "react";
import { type RouterOutputs } from "../utils/trpc";

interface LocalLineStateProps {
  lineId?: string;
}

type Position = RouterOutputs["line"]["join"];

export const useLocalLineState = ({ lineId }: LocalLineStateProps) => {
  const [clientPositions, setClientPositions] = useState<Position[]>([]);

  useEffect(() => {
    const savedString = localStorage.getItem("clientPositions");
    if (!!savedString) {
      try {
        const parsed = JSON.parse(savedString) as Position[];
        setClientPositions(parsed);
      } catch (e) {}
    }
  }, []);

  const isInLine = clientPositions.filter((positions) => positions.lineId === lineId).length > 0;

  const joinLine = useCallback(
    (p: Position) => {
      console.log({ isInLine });
      if (!isInLine) {
        setClientPositions((prevPositions) => {
          const next = [...prevPositions, p];
          localStorage.setItem("clientPositions", JSON.stringify(next));
          return next;
        });
      }
    },
    [isInLine],
  );

  const flushLines = useCallback((lineId: string, currentPositions: Position[]) => {
    const currentPositionIds = new Set(currentPositions.map((p) => p.id));
    setClientPositions((prevPositions) => {
      console.log(currentPositionIds, prevPositions);
      const next = prevPositions.filter((p) => p.lineId !== lineId || currentPositionIds.has(p.id));
      localStorage.setItem("clientPositions", JSON.stringify(next));
      return next;
    });
  }, []);

  return { isInLine, joinLine, flushLines };
};
