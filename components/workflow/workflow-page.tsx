/**
 * @fileoverview ワークフローページのメインコンポーネント
 * ReactFlowを使用したワークフローの表示と編集機能を提供
 * @module components/workflow/workflow-page
 */

"use client";
import { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Connection,
  addEdge,
  useEdgesState,
  useNodesState,
  XYPosition,
  OnEdgesDelete,
  OnConnectEnd,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  applyNodeChanges,
  NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { ChatNode } from "./chat-node";
import { WorkflowNode, WorkflowEdge } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { Database } from "@/types/supabase";
import { NodeSideBar } from "@/components/workflow/node-side-bar";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowSidebar } from "./workflow-sidebar";
import { toast } from "sonner";

// カスタムノードタイプの定義
const nodeTypes = {
  chatNode: ChatNode,
};

/**
 * 循環参照をチェックする関数
 * @param {Edge[]} edges - 既存のエッジ配列
 * @param {string} sourceId - 接続元ノードID
 * @param {string} targetId - 接続先ノードID
 * @param {Set<string>} visited - 訪問済みノードのセット
 * @returns {boolean} 循環参照が存在する場合はtrue
 */
const checkForCyclicDependency = (
  edges: Edge[],
  sourceId: string,
  targetId: string,
  visited = new Set<string>()
): boolean => {
  if (sourceId === targetId) return true;
  if (visited.has(targetId)) return false;

  visited.add(targetId);

  const childEdges = edges.filter((edge) => edge.source === targetId);
  for (const edge of childEdges) {
    if (checkForCyclicDependency(edges, sourceId, edge.target, visited)) {
      return true;
    }
  }

  return false;
};

/**
 * 既存の接続をチェックする関数
 * @param {Edge[]} edges - 既存のエッジ配列
 * @param {string} sourceId - 接続元ノードID
 * @param {string} targetId - 接続先ノードID
 * @returns {boolean} 接続が既に存在する場合はtrue
 */
const isConnectionExists = (
  edges: Edge[],
  sourceId: string,
  targetId: string
): boolean => {
  return edges.some(
    (edge) => edge.source === sourceId && edge.target === targetId
  );
};

// スレッドの型定義
type Thread = Database["public"]["Tables"]["reactflow_workflow_thread"]["Row"];

/**
 * ワークフローページのプロパティ型定義
 */
interface WorkflowPageProps {
  initialNodes: WorkflowNode[];
  initialEdges: WorkflowEdge[];
  threadId: string;
  threads: Thread[];
  currentThread: Thread;
}

/**
 * ワークフローページの内部コンポーネント
 * ReactFlowの主要な機能とイベントハンドラを実装
 */
function WorkflowPageContent({
  initialNodes,
  initialEdges,
  threadId,
  threads,
  currentThread,
}: WorkflowPageProps) {
  const [nodes, setNodes] = useNodesState(
    initialNodes.map((node) => ({
      id: node.id,
      type: "chatNode",
      position: node.position,
      data: {
        chatId: node.chat_id,
        isSelected: false,
      },
    }))
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }))
  );

  const { project } = useReactFlow();
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    title: "",
    description: "",
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
    show: boolean;
    nodeId?: string | null;
  }>({ x: 0, y: 0, show: false });

  const [flowPosition, setFlowPosition] = useState<XYPosition | null>(null);

  const supabase = createClient();

  /**
   * キーボードイベントハンドラ
   * Tabキーで新しいノードを作成し、選択中のノードと接続
   */
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Tab" && selectedNode) {
        event.preventDefault();

        // 選択中のノードの位置から新しいノードの位置を計算（右側に配置）
        const position = {
          x: selectedNode.position.x + 500,
          y: selectedNode.position.y,
        };

        // 新しいノードを作成
        const response = await fetch("/api/workflow/node", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            position,
            title: currentThread.title || "New Chat",
          }),
        });

        const { node: newNode } = await response.json();

        // 新しいノードを追加
        const newNodeData = {
          id: newNode.id,
          type: "chatNode",
          position: newNode.position,
          data: {
            chatId: newNode.chat_id,
            isSelected: false,
          },
        };

        setNodes((nds) => [...nds, newNodeData]);

        // エッジを作成
        const newEdge = {
          id: `${selectedNode.id}-${newNode.id}`,
          source: selectedNode.id,
          target: newNode.id,
        };

        setEdges((eds) => [...eds, newEdge]);

        // バックエンドAPIを呼び出して親子関係を更新
        await fetch("/api/workflow/edge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: selectedNode.id,
            target: newNode.id,
          }),
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNode,
    threadId,
    setNodes,
    setEdges,
    supabase,
    currentThread.title,
  ]);

  /**
   * ノード選択時のハンドラ
   * 選択されたノードの状態を更新
   */
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      const selectedNode = selectedNodes[0] || null;
      setSelectedNode(selectedNode);

      // 全ノードの選択状態を更新
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isSelected: selectedNode?.id === node.id,
          },
        }))
      );
    },
    [setNodes]
  );

  // ノードダブルクリックのハンドラを追加
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedChatId(node.data.chatId);
      setShowChatSidebar(false);
      // 非同期で状態を更新することで、確実にサイドバーが再レンダリングされるようにします
      setTimeout(() => {
        setShowChatSidebar(true);
      }, 0);
    },
    []
  );

  const onConnectStart = useCallback(
    (
      event: React.MouseEvent | React.TouchEvent,
      { nodeId }: { nodeId: string | null }
    ) => {
      setConnectingNodeId(nodeId);
    },
    []
  );

  // エッジ作成の共通処理
  const createEdge = async (source: string, target: string) => {
    // 既存の接続をチェック
    if (isConnectionExists(edges, source, target)) {
      toast.error("既に接続が存在します");
      return false;
    }

    // 循環参照をチェック
    if (checkForCyclicDependency(edges, source, target)) {
      toast.error("ループの作成はできません");
      return false;
    }

    try {
      // バックエンドAPIを呼び出して親子関係を更新
      const response = await fetch("/api/workflow/edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          target,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "エッジの作成に失敗しました");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Edge creation error:", error);
      toast.error("エッジの作成中にエラーが発生しました");
      return false;
    }
  };

  const onConnect = useCallback(
    async (params: Edge | Connection) => {
      // 通常の接続（ドラッグ&ドロップ以外）の場合のみ処理
      if (!connectingNodeId) {
        const success = await createEdge(params.source!, params.target!);
        if (success) {
          setEdges((eds) => addEdge(params, eds));
        }
      }
    },
    [setEdges, edges, connectingNodeId]
  );

  const onConnectEnd = useCallback<OnConnectEnd>(
    async (event) => {
      if (!connectingNodeId) return;

      // ドロップ先の要素を取得
      const targetElement = event.target as Element;
      const targetIsPane = targetElement.classList.contains("react-flow__pane");
      const targetIsNode = targetElement.closest(".react-flow__node");

      // ドロップ先が既存のノードの場合は、新しいノードを作成せずに終了
      if (!targetIsPane && !targetIsNode) return;

      if (targetIsNode) {
        // 既存のノードにドロップされた場合は、そのノードとの接続を作成
        const targetNodeId = targetIsNode.getAttribute("data-id");
        if (targetNodeId) {
          const success = await createEdge(connectingNodeId, targetNodeId);
          if (success) {
            const newEdge = {
              id: `${connectingNodeId}-${targetNodeId}`,
              source: connectingNodeId,
              target: targetNodeId,
            };
            setEdges((eds) => [...eds, newEdge]);
          }
        }
        return;
      }

      // 以下は空白領域にドロップされた場合の処理（新しいノードを作成）
      const { top, left } = (
        document.querySelector(".react-flow__renderer") as HTMLElement
      ).getBoundingClientRect();

      const mousePosition = project({
        x: (event as MouseEvent).clientX - left,
        y: (event as MouseEvent).clientY - top,
      });

      const position = {
        x: mousePosition.x,
        y: mousePosition.y - 150,
      };

      const response = await fetch("/api/workflow/node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          position,
          title: currentThread.title || "New Chat",
        }),
      });

      const { node: newNode } = await response.json();

      const newNodeData = {
        id: newNode.id,
        type: "chatNode",
        position: newNode.position,
        data: {
          chatId: newNode.chat_id,
          isSelected: false,
        },
      };

      setNodes((nds) => [...nds, newNodeData]);

      const newEdge = {
        id: `${connectingNodeId}-${newNode.id}`,
        source: connectingNodeId,
        target: newNode.id,
      };

      setEdges((eds) => [...eds, newEdge]);

      await fetch("/api/workflow/edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: connectingNodeId,
          target: newNode.id,
        }),
      });
    },
    [
      connectingNodeId,
      project,
      setNodes,
      setEdges,
      threadId,
      currentThread.title,
      edges,
    ]
  );

  const onEdgeDelete: OnEdgesDelete = useCallback(async (edges) => {
    // 複数のエッジを処理
    await Promise.all(
      edges.map((edge) =>
        fetch("/api/workflow/edge", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: edge.source,
            target: edge.target,
          }),
        })
      )
    );
  }, []);

  const onAddNode = useCallback(
    async (position: XYPosition) => {
      // バックエンドAPIを呼び出して新しいノードを作成
      const response = await fetch("/api/workflow/node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          position,
          title: currentThread.title || "New Chat",
        }),
      });

      const { node } = await response.json();

      // 新しいノードを追加
      setNodes((nds) => [
        ...nds,
        {
          id: node.id,
          type: "chatNode",
          position: node.position,
          data: {
            chatId: node.chat_id,
            isSelected: false,
          },
        },
      ]);
    },
    [threadId, setNodes, currentThread.title]
  );

  // コンテキストメニューを閉じる
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition((prev) => ({ ...prev, show: false }));
  }, []);

  // クリックイベントのリスナーを追加
  useEffect(() => {
    const handleClick = () => {
      closeContextMenu();
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [closeContextMenu]);

  const onNodesDelete = useCallback(
    async (nodesToDelete: Node[]) => {
      // 各ノードを削除
      await Promise.all(
        nodesToDelete.map((node) =>
          supabase.from("reactflow_workflow_node").delete().eq("id", node.id)
        )
      );
    },
    [supabase]
  );

  const onNodesChange = useCallback(
    async (changes: NodeChange[]) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);

        // ノードの位置が変更された場合にDBを更新
        changes.forEach(async (change) => {
          if (change.type === "position" && "position" in change) {
            await supabase
              .from("reactflow_workflow_node")
              .update({ position: change.position })
              .eq("id", change.id);
          }
        });

        return newNodes;
      });
    },
    [setNodes, supabase]
  );

  const handleCreateWorkflow = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error(error);
      return;
    }

    const { data } = await supabase
      .from("reactflow_workflow_thread")
      .insert({
        title: newWorkflow.title || "新規ワークフロー",
        description: newWorkflow.description,
        user_id: user?.id,
      })
      .select()
      .single();

    if (data) {
      window.location.href = `/workflow/${data.id}`;
    }
  };

  // ノードの内容をコピーする関数
  const copyNodeContent = useCallback(
    async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // ノードのチャット内容を取得
      const { data: chat } = await supabase
        .from("reactflow_chat")
        .select("title")
        .eq("id", node.data.chatId)
        .single();

      const { data: messages } = await supabase
        .from("reactflow_message")
        .select("*")
        .eq("chat_id", node.data.chatId)
        .order("created_at", { ascending: true });

      if (!chat || !messages) return;

      // コピーする内容を整形
      const content = `タイトル: ${chat.title}\n\n会話内容:\n${messages
        .map(
          (msg) =>
            `${msg.role === "user" ? "ユーザー" : "アシスタント"}: ${
              msg.content.text
            }`
        )
        .join("\n\n")}`;

      return content;
    },
    [nodes, supabase]
  );

  // すべてのノードの内容をコピーする関数
  const copyAllNodesContent = useCallback(async () => {
    const contents = await Promise.all(
      nodes.map(async (node) => {
        const content = await copyNodeContent(node.id);
        return content;
      })
    );

    const allContent = contents
      .filter(Boolean)
      .join("\n\n-------------------\n\n");
    navigator.clipboard.writeText(allContent);
    toast.success("すべてのブロックの内容をコピーしました");
  }, [nodes, copyNodeContent]);

  return (
    <div className="flex h-screen">
      {/* 左サイドバー - ワークフロー履歴 */}
      {showSidebar && (
        <WorkflowSidebar
          threads={threads}
          currentThreadId={threadId}
          onCreateClick={() => setShowCreateModal(true)}
        />
      )}

      <Button
        variant="ghost"
        onClick={() => setShowSidebar(!showSidebar)}
        className={`absolute top-4 z-10 ${showSidebar ? "left-64" : "left-4"}`}
      >
        <PanelLeft className="w-6 h-6" />
      </Button>

      {/* メインコンテンツ */}
      <div className="flex-1 relative dark:bg-gray-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onEdgesDelete={onEdgeDelete}
          onNodesDelete={onNodesDelete}
          onSelectionChange={onSelectionChange}
          onNodeDoubleClick={onNodeDoubleClick}
          onContextMenu={(e) => {
            e.preventDefault();
            const bounds = (e.target as HTMLElement)
              .closest(".react-flow__renderer")
              ?.getBoundingClientRect();
            if (!bounds) return;

            const position = project({
              x: e.clientX - bounds.left,
              y: e.clientY - bounds.top,
            });

            // 右クリックされた要素がノードかどうかを確認
            const targetNode = (e.target as HTMLElement).closest(
              ".react-flow__node"
            );
            const nodeId = targetNode?.getAttribute("data-id") || null;

            setFlowPosition(position);
            setContextMenuPosition({
              x: e.clientX,
              y: e.clientY,
              show: true,
              nodeId,
            });
          }}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          minZoom={0.1}
          maxZoom={4}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>

        {/* カスタムコンテキストメニュー */}
        {contextMenuPosition.show && (
          <div
            className="fixed bg-background border rounded-md shadow-lg py-1 z-50"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                if (flowPosition) {
                  onAddNode(flowPosition);
                }
                closeContextMenu();
              }}
            >
              新規チャットを追加
            </button>
            {contextMenuPosition.nodeId ? (
              <>
                <button
                  className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                  onClick={async () => {
                    if (contextMenuPosition.nodeId) {
                      const content = await copyNodeContent(
                        contextMenuPosition.nodeId
                      );
                      if (content) {
                        navigator.clipboard.writeText(content);
                        toast.success("ブロックの内容をコピーしました");
                      }
                    }
                    closeContextMenu();
                  }}
                >
                  ブロックの内容をコピー
                </button>
                <button
                  className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground text-red-500 hover:text-red-600"
                  onClick={() => {
                    if (contextMenuPosition.nodeId) {
                      const nodeToDelete = nodes.find(
                        (n) => n.id === contextMenuPosition.nodeId
                      );
                      if (nodeToDelete) {
                        onNodesDelete([nodeToDelete]);
                        setNodes((nds) =>
                          nds.filter((n) => n.id !== contextMenuPosition.nodeId)
                        );
                      }
                      toast.success("ブロックを削除しました");
                    }
                    closeContextMenu();
                  }}
                >
                  ブロックを削除
                </button>
              </>
            ) : (
              <button
                className="w-full px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  copyAllNodesContent();
                  closeContextMenu();
                }}
              >
                すべてのブロックの内容をコピー
              </button>
            )}
          </div>
        )}
      </div>

      {/* 新規作成モーダル */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規ワークフロー作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                placeholder="ワークフローのタイトル"
                value={newWorkflow.title}
                onChange={(e) =>
                  setNewWorkflow((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                placeholder="ワークフローの説明"
                value={newWorkflow.description}
                onChange={(e) =>
                  setNewWorkflow((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateWorkflow}>作成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 右サイドバー - チャットUI */}
      {showChatSidebar && selectedChatId && (
        <NodeSideBar
          currentChatId={selectedChatId}
          onClose={() => setShowChatSidebar(false)}
        />
      )}
    </div>
  );
}

/**
 * ワークフローページのメインコンポーネント
 * ReactFlowProviderでラップしてコンテキストを提供
 */
export function WorkflowPage(props: WorkflowPageProps) {
  return (
    <ReactFlowProvider>
      <WorkflowPageContent {...props} />
    </ReactFlowProvider>
  );
}
