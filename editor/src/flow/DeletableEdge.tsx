import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { useEditor } from '../store';

/**
 * Edge with an inline delete affordance: hovering the connection (or selecting
 * it) reveals an × button at its midpoint that severs the link — no keyboard
 * needed.
 */
export function DeletableEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    source,
    sourceHandleId,
    selected,
  } = props;

  const [hovered, setHovered] = useState(false);
  const chapterId = useEditor((s) => s.selectedChapterId);
  const callEditor = useEditor((s) => s.callEditor);
  const disconnect = useEditor((s) => s.disconnect);
  const disconnectCallStep = useEditor((s) => s.disconnectCallStep);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const visible = hovered || selected;

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      {/* Invisible widened path so the thin line is easy to hover. */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        style={{ pointerEvents: 'stroke' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <EdgeLabelRenderer>
        <button
          className={`edge-delete nodrag nopan ${visible ? 'show' : ''}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          title="Remover ligação"
          aria-label="Remover ligação"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            // Inside a call sub-flow the edge links STEPS, not chapter nodes —
            // sever it with the call-step disconnect; otherwise the chapter one.
            if (callEditor) disconnectCallStep(callEditor.chapterId, callEditor.nodeId, source, sourceHandleId ?? null);
            else if (chapterId) disconnect(chapterId, source, sourceHandleId ?? null);
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
