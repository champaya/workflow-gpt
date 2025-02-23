/**
 * @fileoverview ワークフロースレッド詳細ページコンポーネント
 * @module app/workflow/[threadId]/page
 */

import { redirect } from "next/navigation";
import { WorkflowPage } from "@/components/workflow/workflow-page";
import { createClient } from "@/utils/supabase/server";

/**
 * ワークフロースレッドの詳細ページを表示するコンポーネント
 * 特定のスレッドのノードとエッジを表示し、フローの編集を可能にする
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Promise<{threadId: string}>} props.params - URLパラメータ（スレッドID）
 * @returns {Promise<JSX.Element>} ワークフローページコンポーネント
 */
export default async function WorkflowThreadPage({
  params,
}: {
  params: Promise<{
    threadId: string;
  }>;
}) {
  // Supabaseクライアントの初期化とユーザー認証チェック
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { threadId } = await params;

  // 未認証ユーザーはログインページにリダイレクト
  if (!user) {
    redirect("/login");
  }

  // スレッド一覧を取得
  const { data: threads } = await supabase
    .from("reactflow_workflow_thread")
    .select("*")
    .order("created_at", { ascending: false });

  // 現在のスレッドを取得
  const { data: currentThread } = await supabase
    .from("reactflow_workflow_thread")
    .select("*")
    .eq("id", threadId)
    .single();

  // スレッドが存在しない場合はワークフロー一覧ページにリダイレクト
  if (!currentThread) {
    redirect("/workflow");
  }

  // ノードとエッジを取得
  // ノードにはチャットデータも含めて取得
  const { data: nodes } = await supabase
    .from("reactflow_workflow_node")
    .select(
      `
      id,
      position,
      chat_id,
      thread_id,
      position,
      chat:reactflow_chat (
        id,
        title,
        created_at
      )
    `
    )
    .eq("thread_id", threadId);

  // スレッド内のすべてのノードIDを取得（エッジ検索用）
  const nodeIds = nodes?.map((node) => node.id) || [];

  // ノード間の関係性を取得してエッジを作成
  // 親ノードまたは子ノードとして含まれる関係性をすべて取得
  const { data: relationships } = await supabase
    .from("reactflow_node_relationship")
    .select("*")
    .or(`parent_node_id.in.(${nodeIds}),child_node_id.in.(${nodeIds})`);

  // 関係性データからエッジデータを生成
  const edges = (relationships || []).map((rel) => ({
    id: `${rel.parent_node_id}-${rel.child_node_id}`,
    source: rel.parent_node_id,
    target: rel.child_node_id,
  }));

  // ワークフローページコンポーネントを表示
  return (
    <WorkflowPage
      initialNodes={nodes || []}
      initialEdges={edges}
      threadId={threadId}
      threads={threads || []}
      currentThread={currentThread}
    />
  );
}
