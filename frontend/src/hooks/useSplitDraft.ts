import { useState } from "react"

export type SplitDraft = {
  combinationId: string
  index: number
  leftBase: string[]     // tiles que já estavam à esquerda
  rightBase: string[]    // tiles que já estavam à direita
  addedLeft: string[]    // tiles da mão
  addedRight: string[]   // tiles da mão
}

export function useSplitDraft() {
  const [draft, setDraft] = useState<SplitDraft | null>(null)

  // iniciar split
  function startSplit(
    combinationId: string,
    index: number,
    leftBase: string[],
    rightBase: string[]
  ) {
    setDraft({
      combinationId,
      index,
      leftBase,
      rightBase,
      addedLeft: [],
      addedRight: [],
    })
  }

  // adicionar tiles da mão
  function addTiles(
    side: "left" | "right",
    tileIds: string[]
  ) {
    setDraft(prev => {
      if (!prev) return prev

      return {
        ...prev,
        [side === "left" ? "addedLeft" : "addedRight"]: [
          ...prev[side === "left" ? "addedLeft" : "addedRight"],
          ...tileIds,
        ],
      }
    })
  }

  function cancelSplit() {
    setDraft(null)
  }

  function rollbackSplit() {
    setDraft(null)
  }

  const leftSize =
    draft ? draft.leftBase.length + draft.addedLeft.length : 0

  const rightSize =
    draft ? draft.rightBase.length + draft.addedRight.length : 0

  const canConfirm =
    draft !== null &&
    leftSize >= 3 &&
    rightSize >= 3

  // payload EXATO para o backend
  function buildPayload() {
    if (!draft || !canConfirm) return null

    return {
      combId: draft.combinationId,
      index: draft.index,
      added_left: draft.addedLeft,
      added_right: draft.addedRight,
    }
  }

  return {
    draft,
    startSplit,
    addTiles,
    cancelSplit,
    rollbackSplit,
    canConfirm,
    buildPayload,
    leftSize,
    rightSize,
  }
}
