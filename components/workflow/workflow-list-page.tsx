/**
 * @fileoverview ワークフローの一覧ページコンポーネント
 * ワークフローの一覧表示と新規作成機能を提供
 * @module components/workflow/workflow-list-page
 */

"use client";
import { WorkflowSidebar } from "./workflow-sidebar";
import { Database } from "@/types/supabase";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// スレッドの型定義
type Thread = Database["public"]["Tables"]["reactflow_workflow_thread"]["Row"];

/**
 * ワークフロー一覧ページを表示するコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Thread[]} props.threads - 表示するスレッド一覧
 */
export function WorkflowListPage({ threads }: { threads: Thread[] }) {
  // 状態管理
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    title: "",
    description: "",
  });
  const supabase = createClient();

  /**
   * 新規ワークフロー作成処理
   * 作成後、作成したワークフローのページに遷移
   */
  const handleCreateWorkflow = async () => {
    setIsCreating(true);
    try {
      // ユーザー情報の取得
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error(error);
        return;
      }

      // ワークフローの作成
      const { data } = await supabase
        .from("reactflow_workflow_thread")
        .insert({
          title: newWorkflow.title || "新規ワークフロー",
          description: newWorkflow.description,
          user_id: user?.id,
        })
        .select()
        .single();

      // 作成したワークフローのページに遷移
      if (data) {
        window.location.href = `/workflow/${data.id}`;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* サイドバー */}
      <WorkflowSidebar
        threads={threads}
        onCreateClick={() => setShowCreateModal(true)}
      />

      {/* メインコンテンツ */}
      <div className="flex-1 p-8 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6">ワークフロー一覧</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* ワークフローカード */}
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/workflow/${thread.id}`}
              className="block rounded-lg border dark:border-gray-700 p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all bg-white dark:bg-gray-700"
            >
              <h3 className="text-lg font-semibold mb-2">{thread.title}</h3>
              {thread.description && (
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  {thread.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  作成日: {new Date(thread.created_at).toLocaleString()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  開く →
                </Button>
              </div>
            </Link>
          ))}
        </div>
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
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={isCreating}
            >
              キャンセル
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                "作成"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
