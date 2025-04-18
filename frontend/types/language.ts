export enum Language {
  Markdown = 'markdown',
  Python = 'python',
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Java = 'java',
  JSON = 'json',
  YAML = 'yaml',
  XML = 'xml',
  HTML = 'html',
  CSS = 'css',
  SCSS = 'scss',
  LESS = 'less',
  CPP = 'cpp',
  C = 'c',
  CSharp = 'csharp',
  Go = 'go',
  PHP = 'php',
  Ruby = 'ruby',
  Rust = 'rust',
  Swift = 'swift',
  Kotlin = 'kotlin',
  Dart = 'dart',
  Shell = 'shell',
  Bat = 'bat',
  PowerShell = 'powershell',
  SQL = 'sql',
  R = 'r',
  Lua = 'lua',
  Perl = 'perl',
  PlainText = 'plaintext',
}

export const languageMap: { [key: string]: Language } = {
  md: Language.Markdown,
  py: Language.Python,
  js: Language.JavaScript,
  ts: Language.TypeScript,
  java: Language.Java,
  json: Language.JSON,
  yaml: Language.YAML,
  yml: Language.YAML,
  xml: Language.XML,
  html: Language.HTML,
  css: Language.CSS,
  scss: Language.SCSS,
  less: Language.LESS,
  cpp: Language.CPP,
  c: Language.C,
  cs: Language.CSharp,
  go: Language.Go,
  php: Language.PHP,
  rb: Language.Ruby,
  rs: Language.Rust,
  swift: Language.Swift,
  kt: Language.Kotlin,
  dart: Language.Dart,
  sh: Language.Shell,
  bat: Language.Bat,
  ps1: Language.PowerShell,
  sql: Language.SQL,
  r: Language.R,
  lua: Language.Lua,
  perl: Language.Perl,
  txt: Language.PlainText,
};
