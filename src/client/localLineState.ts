import { useCallback, useEffect, useState } from "react";
import { type RouterOutputs } from "../utils/trpc";

interface LocalLineStateProps {
  lineId?: string;
}

export type Position = RouterOutputs["line"]["join"];

export const useLocalLine = ({ lineId }: LocalLineStateProps) => {
  const [clientPositions, setClientPositions] = useState<Position[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedString = localStorage.getItem("clientPositions");
    if (!!savedString) {
      try {
        const parsed = JSON.parse(savedString) as Position[];
        setClientPositions(parsed);
      } catch (e) {
      } finally {
        setHydrated(true);
      }
    }
  }, []);

  const isInLine = clientPositions.filter((positions) => positions.lineId === lineId).length > 0;

  const joinLine = useCallback(
    (p: Position) => {
      if (!isInLine) {
        setClientPositions((prev) => {
          const next = [...prev, p];
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
      const next = prevPositions.filter((p) => p.lineId !== lineId || currentPositionIds.has(p.id));
      localStorage.setItem("clientPositions", JSON.stringify(next));
      return next;
    });
  }, []);

  return { isInLine, joinLine, flushLines, hydrated };
};
