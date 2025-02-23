/**
 * @fileoverview マークダウンレンダリングコンポーネント
 * シンタックスハイライトとコードブロックのコピー機能を提供
 * @module components/common/wrapped-markdown
 */

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Clipboard, CheckSquare } from "lucide-react";

/**
 * コードブロックコンポーネント
 * シンタックスハイライトとコピー機能を持つコードブロックを表示
 * @param {Object} props - コンポーネントのプロパティ
 * @param {boolean} props.inline - インラインコードかどうか
 * @param {string} props.className - コードブロックのクラス名（言語指定を含む）
 * @param {ReactNode} props.children - コードブロックの内容
 * @returns {JSX.Element} コードブロックコンポーネント
 */
function CodeBlock({ inline, className, children, ...props }: any) {
  // コピー成功状態の管理
  const [copySuccess, setCopySuccess] = useState(false);

  // 言語の判定（className から language-* を抽出）
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  // インラインコードの場合は単純なコードタグを返す
  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // コードブロックの内容を文字列化
  const codeString = String(children).replace(/\n$/, "");

  /**
   * コードをクリップボードにコピーする
   * コピー成功時に2秒間成功アイコンを表示
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* コピーボタン */}
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px",
        }}
      >
        {copySuccess ? (
          <CheckSquare color="#4caf50" size={20} />
        ) : (
          <Clipboard color="#ccc" size={20} />
        )}
      </button>
      {/* シンタックスハイライター */}
      <SyntaxHighlighter
        style={a11yDark}
        language={language}
        PreTag="div"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * マークダウンレンダリングコンポーネント
 * カスタムコードブロックを含むマークダウンコンテンツを表示
 * @param {Object} props - コンポーネントのプロパティ
 * @param {string} props.content - マークダウン形式のコンテンツ
 * @param {string} [props.className] - コンポーネントのクラス名
 * @returns {JSX.Element} マークダウンレンダリングコンポーネント
 */
export default function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <ReactMarkdown className={className} components={{ code: CodeBlock }}>
      {content}
    </ReactMarkdown>
  );
}
