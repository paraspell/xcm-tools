import { CodeHighlight, CodeHighlightProps } from "@mantine/code-highlight";
import { FC } from "react";

const CodeHighlightDark: FC<CodeHighlightProps> = (props) => {
  const { style } = props;
  return (
    <CodeHighlight
      {...props}
      style={{
        ...style,
        "--code-text-color": "var(--mantine-color-dark-1)",
        "--code-background": "var(--mantine-color-dark-8)",
        "--code-comment-color": "var(--mantine-color-dark-3)",
        "--code-keyword-color": "var(--mantine-color-violet-3)",
        "--code-tag-color": "var(--mantine-color-yellow-4)",
        "--code-literal-color": "var(--mantine-color-blue-4)",
        "--code-string-color": "var(--mantine-color-green-6)",
        "--code-variable-color": "var(--mantine-color-blue-2)",
        "--code-class-color": "var(--mantine-color-orange-5)",
      }}
    />
  );
};

export default CodeHighlightDark;
