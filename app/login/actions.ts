/**
 * @fileoverview ログイン関連のサーバーサイドアクション
 * @module app/login/actions
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

/**
 * ログイン処理を実行するサーバーアクション
 * @param {FormData} formData - ログインフォームのデータ
 * @throws {Error} 認証エラー時にエラーページにリダイレクト
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  // フォームデータからログイン情報を取得
  // 実際の実装では入力値のバリデーションを行うべき
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Supabaseで認証を実行
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  // 認証成功時の処理
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * サインアップ処理を実行するサーバーアクション
 * @param {FormData} formData - サインアップフォームのデータ
 * @throws {Error} 登録エラー時にエラーページにリダイレクト
 */
export async function signup(formData: FormData) {
  const supabase = await createClient();

  // フォームデータからサインアップ情報を取得
  // 実際の実装では入力値のバリデーションを行うべき
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Supabaseで新規ユーザー登録を実行
  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  // 登録成功時の処理
  revalidatePath("/", "layout");
  redirect("/");
}
