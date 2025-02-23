/**
 * @fileoverview ログインページコンポーネント
 * @module app/login/page
 */

"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * ログインページを表示するコンポーネント
 * ログイン、サインアップ、Googleログインの機能を提供
 * @returns {JSX.Element} ログインフォームを含むページコンポーネント
 */
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // セッションチェックとリダイレクト処理
  useEffect(() => {
    const fetchSession = async () => {
      const supabase = await createClient();
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error(error);
      }
      // ログイン済みの場合はホームページへリダイレクト
      router.push("/");
    };
    fetchSession();
  }, []);

  /**
   * Googleログイン処理を実行
   */
  async function handleGoogleSignIn() {
    const supabase = await createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_URL}/api/auth/callback`,
      },
    });
  }

  /**
   * サインアップフォームの送信処理
   * @param {React.FormEvent<HTMLFormElement>} e - フォーム送信イベント
   */
  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      alert("確認メールを送信しました。メールをご確認ください。");
    } catch (error) {
      console.error(error);
      alert("サインアップに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    // メインコンテナ
    <div className="flex-1 flex items-center justify-center min-h-screen relative">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/haikei.png')" }}
      />
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/30" />

      {/* ログインフォームコンテナ */}
      <div className="relative max-w-md w-full m-4 space-y-8 p-8 bg-background backdrop-blur-none rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-center">
          ようこそ、Workflow GPTへ!!
        </h2>

        {/* ログイン/サインアップタブ */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">ログイン</TabsTrigger>
            <TabsTrigger value="signup">新規登録</TabsTrigger>
          </TabsList>

          {/* ログインフォーム */}
          <TabsContent value="login">
            <form action={login} className="space-y-4">
              <Input
                type="email"
                name="email"
                placeholder="メールアドレス"
                required
              />
              <Input
                type="password"
                name="password"
                placeholder="パスワード"
                required
              />
              <Button type="submit" className="w-full">
                ログイン
              </Button>
            </form>
          </TabsContent>

          {/* サインアップフォーム */}
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input
                type="email"
                name="email"
                placeholder="メールアドレス"
                required
              />
              <Input
                type="password"
                name="password"
                placeholder="パスワード（8文字以上）"
                minLength={8}
                required
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "処理中..." : "アカウント作成"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* セパレーター */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              または
            </span>
          </div>
        </div>

        {/* Googleログインボタン */}
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full flex justify-center items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <svg
            className="h-5 w-5 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          Googleでログイン/サインアップ
        </button>
      </div>
    </div>
  );
}
