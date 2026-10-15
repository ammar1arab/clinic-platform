"use client";

import { useImperativeHandle, useRef, type Ref } from "react";
import { cn } from "@/lib/utils";

const TOKEN = /\{\{\s*([^{}]+?)\s*\}\}/g;

function readEditor(root: HTMLElement): string {
  let text = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? "";
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const key = node.dataset.variable;
    if (key) {
      text += `{{${key}}}`;
      return;
    }
    if (node.tagName === "BR") {
      text += "\n";
      return;
    }
    const block = node.tagName === "DIV" || node.tagName === "P";
    if (block && text && !text.endsWith("\n")) text += "\n";
    node.childNodes.forEach(walk);
  };
  root.childNodes.forEach(walk);
  return text.replace(/\u00a0/g, " ");
}

function chip(key: string, label: string) {
  const node = document.createElement("span");
  node.dataset.variable = key;
  node.contentEditable = "false";
  node.className =
    "mx-0.5 inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-sm text-secondary-foreground";
  node.textContent = label;
  return node;
}

function paint(
  root: HTMLElement,
  value: string,
  labelFor: (key: string) => string,
) {
  root.replaceChildren();
  const pattern = new RegExp(TOKEN.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    appendText(root, value.slice(last, match.index));
    root.append(chip(match[1], labelFor(match[1])));
    last = match.index + match[0].length;
  }
  appendText(root, value.slice(last));
}

function appendText(root: HTMLElement, value: string) {
  value.split("\n").forEach((line, index) => {
    if (index) root.append(document.createElement("br"));
    if (line) root.append(document.createTextNode(line));
  });
}

function insertPlain(root: HTMLElement, value: string) {
  const selection = window.getSelection();
  if (!selection) return;
  const range =
    selection.rangeCount > 0 && root.contains(selection.anchorNode)
      ? selection.getRangeAt(0)
      : null;
  const target = range ?? document.createRange();
  if (!range) {
    target.selectNodeContents(root);
    target.collapse(false);
  }
  target.deleteContents();
  const fragment = document.createDocumentFragment();
  let last: Node | null = null;
  value.split(/\r\n|\r|\n/).forEach((line, index) => {
    if (index) {
      last = document.createElement("br");
      fragment.append(last);
    }
    if (line) {
      last = document.createTextNode(line);
      fragment.append(last);
    }
  });
  target.insertNode(fragment);
  if (last) {
    target.setStartAfter(last);
    target.collapse(true);
    selection.removeAllRanges();
    selection.addRange(target);
  }
}

export type EmailBodyEditorHandle = {
  insert: (key: string) => void;
};

export function EmailBodyEditor({
  ref,
  id,
  value,
  onChange,
  labelFor,
  disabled,
}: {
  ref?: Ref<EmailBodyEditorHandle>;
  id: string;
  value: string;
  onChange: (value: string) => void;
  labelFor: (key: string) => string;
  disabled?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  const publish = () => {
    const root = rootRef.current;
    if (!root) return;
    onChange(readEditor(root));
  };

  const root = rootRef.current;
  if (root && document.activeElement !== root && readEditor(root) !== value) {
    paint(root, value, labelFor);
  }

  useImperativeHandle(ref, () => ({
    insert(key: string) {
      const root = rootRef.current;
      if (!root || disabled) return;
      root.focus();
      const node = chip(key, labelFor(key));
      const selection = window.getSelection();
      const range =
        selection &&
        selection.rangeCount > 0 &&
        root.contains(selection.anchorNode)
          ? selection.getRangeAt(0)
          : null;
      if (range) {
        range.deleteContents();
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else {
        root.append(node);
      }
      publish();
    },
  }));

  return (
    <div
      id={id}
      ref={rootRef}
      role="textbox"
      aria-multiline="true"
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={publish}
      onPaste={(event) => {
        event.preventDefault();
        const root = rootRef.current;
        const text = event.clipboardData.getData("text/plain");
        if (!root || !text) return;
        insertPlain(root, text);
        publish();
      }}
      className={cn(
        "min-h-40 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm leading-7 outline-none focus-visible:border-border",
        disabled && "pointer-events-none opacity-50",
      )}
    />
  );
}
