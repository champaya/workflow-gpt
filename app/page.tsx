/**
 * @fileoverview アプリケーションのルートページコンポーネント
 * @module app/page
 */

"use server";

import { redirect } from "next/navigation";

/**
 * ホームページコンポーネント
 * ユーザーを自動的にワークフローページにリダイレクトします
 * @returns {Promise<never>} リダイレクト処理を実行
 */
export default async function Home() {
  // ワークフローページへリダイレクト
  redirect("/workflow");
}
