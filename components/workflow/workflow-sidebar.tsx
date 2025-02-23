/**
 * @fileoverview ワークフローのサイドバーコンポーネント
 * スレッド一覧、新規作成、テーマ切り替え、ヘルプなどの機能を提供
 * @module components/workflow/workflow-sidebar
 */

"use client";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Moon, Sun, HelpCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Database } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { WorkflowHelpDialog } from "./workflow-help-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// スレッドの型定義
type Thread = Database["public"]["Tables"]["reactflow_workflow_thread"]["Row"];

/**
 * ワークフローサイドバーコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Thread[]} props.threads - スレッド一覧
 * @param {string} [props.currentThreadId] - 現在選択中のスレッドID
 * @param {() => void} props.onCreateClick - 新規作成ボタンのクリックハンドラ
 */
export function WorkflowSidebar({
  threads,
  currentThreadId,
  onCreateClick,
}: {
  threads: Thread[];
  currentThreadId?: string;
  onCreateClick: () => void;
}) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ユーザー情報の取得
  useEffect(() => {
    const fetchUser = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error(error);
      }
      setUser(user.user);
    };
    fetchUser();
  }, [threads]);

  /**
   * スレッド削除の実行
   * @param {string} threadId - 削除対象のスレッドID
   */
  const handleDeleteThread = async (threadId: string) => {
    setIsDeleting(true);
    try {
      await supabase
        .from("reactflow_workflow_thread")
        .delete()
        .eq("id", threadId);
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  /**
   * 削除ダイアログの表示
   * @param {string} threadId - 削除対象のスレッドID
   * @param {React.MouseEvent} e - クリックイベント
   */
  const handleDeleteClick = (threadId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDeletingThreadId(threadId);
    setShowDeleteDialog(true);
  };

  /**
   * ログアウト処理の実行
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="w-64 border-r bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4 workflow-sidebar">
      {/* ヘッダー部分 */}
      <div className="flex flex-col justify-between mb-4">
        <div className="text-xl font-semibold mb-2 flex items-center justify-between">
          <Link href="/workflow" className="flex items-center">
            Workflow GPT
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelpDialog(true)}
              className="w-8 h-8"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <div>
          <Button variant="outline" onClick={onCreateClick}>
            <Plus className="w-4 h-4 mr-1" />
            新規作成
          </Button>
        </div>
      </div>

      {/* スレッド一覧 */}
      <div className="space-y-2 h-[calc(100vh-15rem)] overflow-y-auto">
        {threads.map((thread) => (
          <Link
            key={thread.id}
            href={`/workflow/${thread.id}`}
            className={`block rounded-lg p-3 relative group ${
              thread.id === currentThreadId
                ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium line-clamp-1">{thread.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(thread.created_at).toLocaleString()}
                </div>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                onClick={(e) => handleDeleteClick(thread.id, e)}
              >
                <Trash className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" />
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* フッター部分 */}
      <Button variant="outline" onClick={handleLogout}>
        ログアウト
      </Button>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        {user?.email}
      </div>

      {/* ヘルプダイアログ */}
      <WorkflowHelpDialog
        open={showHelpDialog}
        onOpenChange={setShowHelpDialog}
      />

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スレッドの削除</DialogTitle>
            <DialogDescription>
              このスレッドを削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletingThreadId && handleDeleteThread(deletingThreadId)
              }
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  削除中...
                </>
              ) : (
                "削除"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * テーマ切り替えボタンコンポーネント
 * ライト/ダークモードの切り替えを提供
 */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">ダークモードを切り替え</span>
    </Button>
  );
}
