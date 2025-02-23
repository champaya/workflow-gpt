/**
 * @fileoverview ワークフローのヘルプダイアログコンポーネント
 * 機能の使い方やショートカットキーなどのガイドを提供
 * @module components/workflow/workflow-help-dialog
 */

"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * ワークフローのヘルプダイアログを表示するコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {boolean} props.open - ダイアログの表示状態
 * @param {(open: boolean) => void} props.onOpenChange - ダイアログの表示状態を変更する関数
 */
export function WorkflowHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ワークフローの使い方</DialogTitle>
          <DialogDescription>
            ワークフローを効率的に使用するためのガイド
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本操作セクション */}
          <section>
            <h3 className="text-lg font-semibold mb-2">基本操作</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                ブロックの追加:
                キャンバス上で右クリックして「新規チャットを追加」を選択
              </li>
              <li>ブロックの移動: ブロックをドラッグ&ドロップ</li>
              <li>
                ブロックの削除: ブロックを選択して Delete キー, Backspace
                キーを押す
              </li>
              <li>ブロックの選択: クリックで選択</li>
              <li>ズーム: マウスホイールで拡大/縮小</li>
              <li>
                パン: スペースを押しながらドラッグ、または右クリックドラッグ
              </li>
            </ul>
          </section>

          {/* キーボードショートカットセクション */}
          <section>
            <h3 className="text-lg font-semibold mb-2">
              キーボードショートカット
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <kbd className="px-2 py-1 bg-muted rounded">Tab</kbd>:
                選択中のブロックから新しいブロックを作成（右側に配置）
              </li>
              <li>
                <kbd className="px-2 py-1 bg-muted rounded">Delete</kbd>,
                <kbd className="px-2 py-1 bg-muted rounded">Backspace</kbd>:
                選択中のブロックを削除
              </li>
            </ul>
          </section>

          {/* ブロックとラインの操作セクション */}
          <section>
            <h3 className="text-lg font-semibold mb-2">
              ブロックとラインの操作
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                ラインの作成: ブロックの左右の点をドラッグして他のブロックに接続
              </li>
              <li>
                ラインの削除: ラインを選択して Delete キー, Backspace キーを押す
              </li>
              <li>ブロックの編集: ダブルクリックでチャットを開く</li>
              <li>タイトルの編集: ブロックのタイトルをクリックして編集</li>
            </ul>
          </section>

          {/* チャット機能セクション */}
          <section>
            <h3 className="text-lg font-semibold mb-2">チャット機能</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>モデル選択: 各ブロックで使用するAIモデルを選択可能</li>
              <li>チャット履歴: ブロックごとに独立したチャット履歴を保持</li>
              <li>
                コンテキストメニュー:
                右クリックでブロックの内容をコピーなどの操作が可能
              </li>
            </ul>
          </section>

          {/* ワークフロー管理セクション */}
          <section>
            <h3 className="text-lg font-semibold mb-2">ワークフロー管理</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                新規作成: 左サイドバーの「新規作成」ボタンでワークフローを作成
              </li>
              <li>履歴: 左サイドバーでワークフローの履歴を確認・切り替え</li>
              <li>
                保存:
                自動保存（チャットのやり取り、ブロック、ラインの追加削除などのタイミングで保存されます）
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
