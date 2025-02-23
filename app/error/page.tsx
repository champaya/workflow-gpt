/**
 * @fileoverview エラーページコンポーネント
 * @module app/error/page
 */

"use client";

/**
 * エラーページを表示するコンポーネント
 * システムエラーが発生した際に表示される汎用エラーページ
 * @returns {JSX.Element} エラーメッセージを表示するコンポーネント
 */
export default function ErrorPage() {
  // エラーメッセージを表示
  return <p>Sorry, something went wrong</p>;
}
