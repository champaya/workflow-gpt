/**
 * @fileoverview ワークフローページコンポーネント
 * @module app/workflow/page
 */

import { redirect } from "next/navigation";
import { WorkflowListPage } from "@/components/workflow/workflow-list-page";
import { createClient } from "@/utils/supabase/server";

/**
 * ワークフローページを表示するコンポーネント
 * 認証済みユーザーのワークフローリストを表示
 * @returns {Promise<JSX.Element>} ワークフローリストページコンポーネント
 */
export default async function WorkflowPage() {
  // Supabaseクライアントの初期化とユーザー認証チェック
  const supabase = await createClient();
  const { data: user, error } = await supabase.auth.getUser();

  // 未認証ユーザーはログインページにリダイレクト
  if (error || !user) {
    redirect("/login");
  }

  // ユーザーのワークフロースレッドを取得
  const { data: threads } = await supabase
    .from("reactflow_workflow_thread")
    .select("*")
    .eq("user_id", user.user?.id)
    .order("created_at", { ascending: false });

  // ワークフローリストページを表示
  return <WorkflowListPage threads={threads || []} />;
}
