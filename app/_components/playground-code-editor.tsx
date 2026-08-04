"use client";

import { indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PlaygroundSource } from "@/lib/playground-examples";

export type PlaygroundEditorTab = "html" | "css";
type PlaygroundEditorTheme = "avely-dark" | "one-dark" | "high-contrast";

type PlaygroundCodeEditorProps = {
  documentKey: string;
  isRendering: boolean;
  onChange: (tab: PlaygroundEditorTab, value: string) => void;
  onReset: () => void;
  onRun: () => void;
  source: PlaygroundSource;
};

const tabs: Array<{ id: PlaygroundEditorTab; label: string }> = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
];

const themeOptions: Array<{ id: PlaygroundEditorTheme; label: string }> = [
  { id: "avely-dark", label: "Avely Dark" },
  { id: "one-dark", label: "One Dark" },
  { id: "high-contrast", label: "High Contrast" },
];

const languageExtensions = {
  html: html(),
  css: css(),
};

type EditorThemePalette = {
  accent: string;
  activeLine: string;
  attribute: string;
  background: string;
  border: string;
  comment: string;
  foreground: string;
  function: string;
  gutter: string;
  gutterText: string;
  invalid: string;
  keyword: string;
  number: string;
  operator: string;
  panel: string;
  panelControl: string;
  punctuation: string;
  selection: string;
  selectionForeground: string;
  string: string;
  tag: string;
  variable: string;
};

function createEditorTheme(palette: EditorThemePalette): Extension {
  const surfaceTheme = EditorView.theme({
    "&": {
      height: "100%",
      backgroundColor: palette.background,
      color: palette.foreground,
      fontSize: "12px",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-code)",
      lineHeight: "1.65",
      overflow: "auto",
    },
    ".cm-content": {
      caretColor: palette.accent,
      padding: "14px 0 28px",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: palette.accent,
    },
    ".cm-gutters": {
      backgroundColor: palette.gutter,
      borderRight: `1px solid ${palette.border}`,
      color: palette.gutterText,
    },
    ".cm-activeLine, .cm-activeLineGutter": {
      backgroundColor: palette.activeLine,
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: `${palette.selection} !important`,
    },
    ".cm-content ::selection": {
      backgroundColor: `${palette.selection} !important`,
      color: `${palette.selectionForeground} !important`,
    },
    ".cm-searchMatch": {
      backgroundColor: palette.selection,
      outline: `1px solid ${palette.accent}`,
    },
    ".cm-panels": {
      backgroundColor: palette.panel,
      color: palette.foreground,
    },
    ".cm-panel.cm-search": {
      padding: "8px",
    },
    ".cm-panel input, .cm-panel button": {
      minHeight: "30px",
      border: `1px solid ${palette.border}`,
      borderRadius: "0",
      backgroundColor: palette.panelControl,
      color: palette.foreground,
      fontFamily: "var(--font-code)",
    },
  }, { dark: true });

  const highlightTheme = HighlightStyle.define([
    { tag: tags.comment, color: palette.comment, fontStyle: "italic" },
    { tag: [tags.keyword, tags.modifier, tags.operatorKeyword], color: palette.keyword },
    { tag: [tags.string, tags.special(tags.string), tags.regexp], color: palette.string },
    { tag: [tags.number, tags.bool, tags.null], color: palette.number },
    { tag: [tags.tagName, tags.typeName, tags.className], color: palette.tag },
    { tag: [tags.attributeName, tags.propertyName], color: palette.attribute },
    {
      tag: [tags.function(tags.variableName), tags.definition(tags.variableName)],
      color: palette.function,
    },
    { tag: tags.variableName, color: palette.variable },
    { tag: [tags.operator, tags.derefOperator], color: palette.operator },
    { tag: tags.punctuation, color: palette.punctuation },
    { tag: tags.invalid, color: palette.invalid, textDecoration: "underline" },
  ]);

  return [surfaceTheme, syntaxHighlighting(highlightTheme)];
}

const editorThemes: Record<PlaygroundEditorTheme, Extension> = {
  "avely-dark": createEditorTheme({
    accent: "#ffad33",
    activeLine: "rgb(255 173 51 / 10%)",
    attribute: "#f9d77e",
    background: "#0b1830",
    border: "#29456b",
    comment: "#91a4bd",
    foreground: "#f8fafc",
    function: "#a8c7ff",
    gutter: "#0f213f",
    gutterText: "#91a4bd",
    invalid: "#ff7b8c",
    keyword: "#ffad33",
    number: "#c4b5fd",
    operator: "#ff9677",
    panel: "#142b4e",
    panelControl: "#182f55",
    punctuation: "#b7c4d6",
    selection: "#f3a116",
    selectionForeground: "#071326",
    string: "#8de6b0",
    tag: "#7dd3fc",
    variable: "#edf4ff",
  }),
  "one-dark": createEditorTheme({
    accent: "#61afef",
    activeLine: "rgb(153 187 255 / 8%)",
    attribute: "#d19a66",
    background: "#282c34",
    border: "#3e4451",
    comment: "#8f96a3",
    foreground: "#d7dae0",
    function: "#61afef",
    gutter: "#21252b",
    gutterText: "#8f96a3",
    invalid: "#ff6c6b",
    keyword: "#c678dd",
    number: "#d19a66",
    operator: "#56b6c2",
    panel: "#21252b",
    panelControl: "#2c313c",
    punctuation: "#abb2bf",
    selection: "#61afef",
    selectionForeground: "#08131d",
    string: "#98c379",
    tag: "#e77680",
    variable: "#e5c07b",
  }),
  "high-contrast": createEditorTheme({
    accent: "#ffdc00",
    activeLine: "rgb(255 220 0 / 16%)",
    attribute: "#ff9df3",
    background: "#000000",
    border: "#ffffff",
    comment: "#d1d5db",
    foreground: "#ffffff",
    function: "#8ab4ff",
    gutter: "#090909",
    gutterText: "#ffffff",
    invalid: "#ff6b6b",
    keyword: "#ffdc00",
    number: "#d8b4fe",
    operator: "#ff9b71",
    panel: "#000000",
    panelControl: "#111111",
    punctuation: "#ffffff",
    selection: "#ffdc00",
    selectionForeground: "#000000",
    string: "#61ffad",
    tag: "#52ddff",
    variable: "#ffffff",
  }),
};

export function PlaygroundCodeEditor({
  documentKey,
  isRendering,
  onChange,
  onReset,
  onRun,
  source,
}: PlaygroundCodeEditorProps) {
  const id = useId().replaceAll(":", "");
  const editorHostRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const statesRef = useRef<Partial<Record<PlaygroundEditorTab, EditorState>>>({});
  const scrollPositionsRef = useRef<Record<PlaygroundEditorTab, number>>({
    html: 0,
    css: 0,
  });
  const tabButtonRefs = useRef<Partial<Record<PlaygroundEditorTab, HTMLButtonElement>>>({});
  const activeTabRef = useRef<PlaygroundEditorTab>("html");
  const loadedDocumentKeyRef = useRef(documentKey);
  const initialSourceRef = useRef(source);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const languageCompartmentRef = useRef(new Compartment());
  const themeCompartmentRef = useRef(new Compartment());
  const selectedThemeRef = useRef<PlaygroundEditorTheme>("avely-dark");
  const [activeTab, setActiveTab] = useState<PlaygroundEditorTab>("html");
  const [selectedTheme, setSelectedTheme] = useState<PlaygroundEditorTheme>("avely-dark");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  const createState = useCallback((tab: PlaygroundEditorTab, value: string) => {
    return EditorState.create({
      doc: value,
      extensions: [
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onRunRef.current();
              return true;
            },
          },
          indentWithTab,
        ]),
        basicSetup,
        EditorState.tabSize.of(2),
        languageCompartmentRef.current.of(languageExtensions[tab]),
        themeCompartmentRef.current.of(editorThemes[selectedThemeRef.current]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;

          const currentTab = activeTabRef.current;
          statesRef.current[currentTab] = update.state;
          onChangeRef.current(currentTab, update.state.doc.toString());
        }),
      ],
    });
  }, []);

  const replaceStates = useCallback((nextSource: PlaygroundSource) => {
    statesRef.current = {
      html: createState("html", nextSource.html),
      css: createState("css", nextSource.css),
    };
    scrollPositionsRef.current = { html: 0, css: 0 };

    const nextState = statesRef.current[activeTabRef.current];
    if (nextState) editorViewRef.current?.setState(nextState);
  }, [createState]);

  useEffect(() => {
    const host = editorHostRef.current;
    if (!host) return;

    const initialSource = initialSourceRef.current;
    statesRef.current = {
      html: createState("html", initialSource.html),
      css: createState("css", initialSource.css),
    };

    const view = new EditorView({
      parent: host,
      state: statesRef.current.html,
    });
    editorViewRef.current = view;

    return () => {
      editorViewRef.current = null;
      view.destroy();
    };
  }, [createState]);

  useEffect(() => {
    if (loadedDocumentKeyRef.current === documentKey) return;
    loadedDocumentKeyRef.current = documentKey;
    replaceStates(source);
  }, [documentKey, replaceStates, source]);

  function activateTab(tab: PlaygroundEditorTab, moveFocus: boolean) {
    const view = editorViewRef.current;
    const nextState = statesRef.current[tab];
    if (!view || !nextState) return;

    if (tab !== activeTabRef.current) {
      const previousTab = activeTabRef.current;
      statesRef.current[previousTab] = view.state;
      scrollPositionsRef.current[previousTab] = view.scrollDOM.scrollTop;
      activeTabRef.current = tab;
      view.setState(nextState);
      window.requestAnimationFrame(() => {
        view.scrollDOM.scrollTop = scrollPositionsRef.current[tab];
      });
      setActiveTab(tab);
    }

    if (moveFocus) tabButtonRefs.current[tab]?.focus();
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    tab: PlaygroundEditorTab,
  ) {
    const currentIndex = tabs.findIndex((item) => item.id === tab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    activateTab(tabs[nextIndex].id, true);
  }

  function changeEditorTheme(theme: PlaygroundEditorTheme) {
    const view = editorViewRef.current;
    selectedThemeRef.current = theme;
    setSelectedTheme(theme);
    if (!view) return;

    const activeEditorTab = activeTabRef.current;
    const scrollTop = view.scrollDOM.scrollTop;
    statesRef.current[activeEditorTab] = view.state;

    for (const tab of tabs) {
      const state = statesRef.current[tab.id];
      if (!state) continue;
      statesRef.current[tab.id] = state.update({
        effects: themeCompartmentRef.current.reconfigure(editorThemes[theme]),
      }).state;
    }

    const nextState = statesRef.current[activeEditorTab];
    if (!nextState) return;
    view.setState(nextState);
    window.requestAnimationFrame(() => {
      view.scrollDOM.scrollTop = scrollTop;
    });
  }

  return (
    <div className="playgroundCodeEditor">
      <div className="playgroundCodeEditorToolbar">
        <div aria-label="Source language" className="playgroundCodeEditorTabs" role="tablist">
          {tabs.map((tab) => (
            <button
              aria-controls={`${id}-editor-panel`}
              aria-selected={activeTab === tab.id}
              id={`${id}-${tab.id}-tab`}
              key={tab.id}
              onClick={() => activateTab(tab.id, false)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              ref={(element) => {
                tabButtonRefs.current[tab.id] = element ?? undefined;
              }}
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="playgroundCodeEditorActions">
          <label className="playgroundCodeEditorTheme">
            <span className="srOnly">Editor color theme</span>
            <select
              onChange={(event) => changeEditorTheme(event.target.value as PlaygroundEditorTheme)}
              title="Editor color theme"
              value={selectedTheme}
            >
              {themeOptions.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.label}</option>
              ))}
            </select>
          </label>
          <button onClick={onReset} type="button">Reset example</button>
          <button
            aria-keyshortcuts="Control+Enter Meta+Enter"
            className="playgroundCodeEditorRun"
            data-rendering={isRendering}
            onClick={onRun}
            title="Render now (Cmd/Ctrl + Enter)"
            type="button"
          >
            {isRendering ? "Rendering…" : "Run"}
          </button>
        </div>
      </div>
      <div
        aria-labelledby={`${id}-${activeTab}-tab`}
        className="playgroundCodeEditorPanel"
        id={`${id}-editor-panel`}
        role="tabpanel"
      >
        <div className="playgroundCodeEditorHost" ref={editorHostRef} />
      </div>
    </div>
  );
}
