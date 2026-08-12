"use client";
import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import type { GraphPayload } from "@/lib/kg/types";
type GraphNodeData = {
  label: string;
  kind: "sector" | "subsector" | "combination" | "selected";
  selected?: boolean;
  members?: string[];
};
function GraphNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const styles = {
    selected:
      "bg-gradient-to-br from-pink-500/30 to-fuchsia-500/20 border-pink-400/70 text-[var(--foreground)] shadow-[0_0_0_2px_rgba(244,114,182,0.35),0_0_30px_rgba(244,114,182,0.55)] animate-[pulseGlow_2s_ease-in-out_infinite]",
    sector:
      "bg-violet-500/15 border-violet-400/50 text-violet-700 hover:border-violet-300",
    subsector:
      "bg-cyan-500/10 border-cyan-400/40 text-cyan-700 hover:border-cyan-300",
    combination:
      "bg-amber-500/10 border-amber-400/40 text-amber-700 hover:border-amber-300 italic",
  }[data.kind];
  const sizing =
    data.kind === "selected"
      ? "px-5 py-3 text-sm font-semibold max-w-[260px]"
      : data.kind === "sector"
        ? "px-4 py-2.5 text-[13px] font-medium max-w-[220px]"
        : data.kind === "combination"
          ? "px-3 py-2 text-[11px] max-w-[280px]"
          : "px-3 py-2 text-[12px] max-w-[200px]";
  return (
    <div
      className={cn(
        "rounded-xl border text-center leading-snug shadow-[0_4px_18px_rgba(0,0,0,0.20)] backdrop-blur-sm transition-all",
        styles,
        sizing,
      )}
      title={data.label}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="pointer-events-none !opacity-0"
      />
      <span className="block break-words">{data.label}</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="pointer-events-none !opacity-0"
      />
    </div>
  );
}
const nodeTypes = { graphNode: GraphNode };
function InnerGraph({
  payload,
  onNodeClick,
}: {
  payload: GraphPayload;
  onNodeClick?: (id: string) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>(
    [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const flow = useReactFlow();
  React.useEffect(() => {
    setNodes(
      payload.nodes.map((node) => ({
        id: node.id,
        type: "graphNode",
        position: node.position,
        data: node.data,
        draggable: true,
      })),
    );
    setEdges(
      payload.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        className: cn(edge.type, edge.animated && "animated"),
        animated: !!edge.animated,
        type: "smoothstep",
      })),
    );
    requestAnimationFrame(() => {
      try {
        flow.fitView({ padding: 0.12, duration: 600 });
      } catch {}
    });
  }, [payload, setNodes, setEdges, flow]);
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onNodeClick?.(node.id)}
      proOptions={{ hideAttribution: false }}
      minZoom={0.15}
      maxZoom={2.5}
      fitView
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={28}
        size={1}
        color="rgba(0,0,0,0.08)"
      />
      <MiniMap
        pannable
        zoomable
        nodeStrokeWidth={2}
        maskColor="rgba(226,232,240,.7)"
        nodeColor={(node) => {
          const kind = (node.data as GraphNodeData)?.kind;
          return kind === "selected"
            ? "#f472b6"
            : kind === "sector"
              ? "#7c5cff"
              : kind === "combination"
                ? "#f59e0b"
                : "#22d3ee";
        }}
      />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
export function GraphView({
  payload,
  onNodeClick,
}: {
  payload: GraphPayload;
  onNodeClick?: (id: string) => void;
}) {
  return (
    <div className="kg-surface h-full w-full">
      <ReactFlowProvider>
        <InnerGraph payload={payload} onNodeClick={onNodeClick} />
      </ReactFlowProvider>
    </div>
  );
}
