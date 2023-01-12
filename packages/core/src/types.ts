import type { LoadConfigResult } from 'unconfig'
import type MagicString from 'magic-string'
import type { UnoGenerator } from './generator'
import type { BetterMap } from './utils'

export type Awaitable<T> = T | Promise<T>
export type Arrayable<T> = T | T[]
export type ArgumentType<T> = T extends ((...args: infer A) => any) ? A : never
export type Shift<T> = T extends [_: any, ...args: infer A] ? A : never
export type RestArgs<T> = Shift<ArgumentType<T>>
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> }
export type FlatObjectTuple<T> = { [K in keyof T]: T[K] }
export type PartialByKeys<T, K extends keyof T = keyof T> = FlatObjectTuple<Partial<Pick<T, Extract<keyof T, K>>> & Omit<T, K>>
export type RequiredByKey<T, K extends keyof T = keyof T> = FlatObjectTuple<Required<Pick<T, Extract<keyof T, K>>> & Omit<T, K>>

export type CSSObject = Record<string, string | number | undefined>
export type CSSEntries = [string, string | number | undefined][]
export interface CSSColorValue {
  type: string
  components: (string | number)[]
  alpha: string | number | undefined
}

export type RGBAColorValue = [number, number, number, number] | [number, number, number]
export interface ParsedColorValue {
  /**
   * Parsed color value.
   */
  color?: string
  /**
   * Parsed opacity value.
   */
  opacity: string
  /**
   * Color name.
   */
  name: string
  /**
   * Color scale, preferably 000 - 999.
   */
  no: string
  /**
   * {@link CSSColorValue}
   */
  cssColor: CSSColorValue | undefined
  /**
   * Parsed alpha value from opacity
   */
  alpha: string | number | undefined
}

export type PresetOptions = Record<string, any>

export interface RuleContext<Theme extends {} = {}> {
  /**
   * Unprocessed selector from user input.
   * Useful for generating CSS rule.
   */
  rawSelector: string
  /**
   * Current selector for rule matching
   */
  currentSelector: string
  /**
   * UnoCSS generator instance
   */
  generator: UnoGenerator<Theme>
  /**
   * The theme object
   */
  theme: Theme
  /**
   * Matched variants handlers for this rule.
   */
  variantHandlers: VariantHandler[]
  /**
   * The result of variant matching.
   */
  variantMatch: VariantMatchedResult<Theme>
  /**
   * Construct a custom CSS rule.
   * Variants and selector escaping will be handled automatically.
   */
  constructCSS: (body: CSSEntries | CSSObject, overrideSelector?: string) => string
  /**
   * Available only when `details` option is enabled.
   */
  rules?: Rule<Theme>[]
  /**
   * Available only when `details` option is enabled.
   */
  shortcuts?: Shortcut<Theme>[]
  /**
   * Available only when `details` option is enabled.
   */
  variants?: Variant<Theme>[]
}

export interface VariantContext<Theme extends {} = {}> {
  /**
   * Unprocessed selector from user input.
   */
  rawSelector: string
  /**
   * UnoCSS generator instance
   */
  generator: UnoGenerator<Theme>
  /**
   * The theme object
   */
  theme: Theme
}

export interface ExtractorContext {
  readonly original: string
  code: string
  id?: string
}

export interface PreflightContext<Theme extends {} = {}> {
  /**
   * UnoCSS generator instance
   */
  generator: UnoGenerator<Theme>
  /**
   * The theme object
   */
  theme: Theme
}

export interface Extractor {
  name: string
  extract(ctx: ExtractorContext): Awaitable<Set<string> | string[] | undefined>
  order?: number
}

export interface RuleMeta {
  /**
   * The layer name of this rule.
   * @default 'default'
   */
  layer?: string

  /**
   * Option to not merge this selector even if the body are the same.
   * @default false
   */
  noMerge?: boolean

  /**
   * Fine tune sort
   */
  sort?: number

  /**
   * Templates to provide autocomplete suggestions
   */
  autocomplete?: Arrayable<AutoCompleteTemplate>

  /**
   * Matching prefix before this util
   */
  prefix?: string

  /**
   * Internal rules will only be matched for shortcuts but not the user code.
   * @default false
   */
  internal?: boolean
}

export type CSSValue = CSSObject | CSSEntries
export type CSSValues = CSSValue | CSSValue[]

export type DynamicMatcher<Theme extends {} = {}> = ((match: RegExpMatchArray, context: Readonly<RuleContext<Theme>>) => Awaitable<CSSValue | string | (CSSValue | string)[] | undefined>)
export type DynamicRule<Theme extends {} = {}> = [RegExp, DynamicMatcher<Theme>] | [RegExp, DynamicMatcher<Theme>, RuleMeta]
export type StaticRule = [string, CSSObject | CSSEntries] | [string, CSSObject | CSSEntries, RuleMeta]
export type Rule<Theme extends {} = {}> = DynamicRule<Theme> | StaticRule

export type DynamicShortcutMatcher<Theme extends {} = {}> = ((match: RegExpMatchArray, context: Readonly<RuleContext<Theme>>) => (string | ShortcutValue[] | undefined))

export type StaticShortcut = [string, string | ShortcutValue[]] | [string, string | ShortcutValue[], RuleMeta]
export type StaticShortcutMap = Record<string, string | ShortcutValue[]>
export type DynamicShortcut<Theme extends {} = {}> = [RegExp, DynamicShortcutMatcher<Theme>] | [RegExp, DynamicShortcutMatcher<Theme>, RuleMeta]
export type UserShortcuts<Theme extends {} = {}> = StaticShortcutMap | (StaticShortcut | DynamicShortcut<Theme> | StaticShortcutMap)[]
export type Shortcut<Theme extends {} = {}> = StaticShortcut | DynamicShortcut<Theme>
export type ShortcutValue = string | CSSValue

export type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null

export interface Preflight<Theme extends {} = {}> {
  getCSS: (context: PreflightContext<Theme>) => Promise<string | undefined> | string | undefined
  layer?: string
}

export type BlocklistRule = string | RegExp

export interface VariantHandlerContext {
  /**
   * Rewrite the output selector. Often be used to append parents.
   */
  prefix: string
  /**
   * Rewrite the output selector. Often be used to append pseudo classes.
   */
  selector: string
  /**
   * Rewrite the output selector. Often be used to append pseudo elements.
   */
  pseudo: string
  /**
   * Rewrite the output css body. The input come in [key,value][] pairs.
   */
  entries: CSSEntries
  /**
   * Provide a parent selector(e.g. media query) to the output css.
   */
  parent?: string
  /**
   * Provide order to the `parent` parent selector within layer.
   */
  parentOrder?: number
  /**
   * Override layer to the output css.
   */
  layer?: string
  /**
   * Order in which the variant is sorted within single rule.
   */
  sort?: number
  /**
   * Option to not merge the resulting entries even if the body are the same.
   * @default false
   */
  noMerge?: boolean
}

export interface VariantHandler {
  /**
   * Callback to process the handler.
   */
  handle?: (input: VariantHandlerContext, next: (input: VariantHandlerContext) => VariantHandlerContext) => VariantHandlerContext
  /**
   * The result rewritten selector for the next round of matching
   */
  matcher: string
  /**
   * Order in which the variant is applied to selector.
   */
  order?: number
  /**
   * Rewrite the output selector. Often be used to append pseudo classes or parents.
   */
  selector?: (input: string, body: CSSEntries) => string | undefined
  /**
   * Rewrite the output css body. The input come in [key,value][] pairs.
   */
  body?: (body: CSSEntries) => CSSEntries | undefined
  /**
   * Provide a parent selector(e.g. media query) to the output css.
   */
  parent?: string | [string, number] | undefined
  /**
   * Order in which the variant is sorted within single rule.
   */
  sort?: number
  /**
   * Override layer to the output css.
   */
  layer?: string | undefined
}

export type VariantFunction<Theme extends {} = {}> = (matcher: string, context: Readonly<VariantContext<Theme>>) => string | VariantHandler | undefined

export interface VariantObject<Theme extends {} = {}> {
  /**
   * The name of the variant.
   */
  name?: string
  /**
   * The entry function to match and rewrite the selector for further processing.
   */
  match: VariantFunction<Theme>

  /**
   * Allows this variant to be used more than once in matching a single rule
   *
   * @default false
   */
  multiPass?: boolean

  /**
   * Custom function for auto complete
   */
  autocomplete?: Arrayable<AutoCompleteFunction | AutoCompleteTemplate>
}

export type Variant<Theme extends {} = {}> = VariantFunction<Theme> | VariantObject<Theme>

export type Preprocessor = (matcher: string) => string | undefined
export type Postprocessor = (util: UtilObject) => void
export type ThemeExtender<T> = (theme: T) => void

export interface ConfigBase<Theme extends {} = {}> {
  /**
   * Rules to generate CSS utilities
   */
  rules?: Rule<Theme>[]

  /**
   * Variants that preprocess the selectors,
   * having the ability to rewrite the CSS object.
   */
  variants?: Variant<Theme>[]

  /**
   * Similar to Windi CSS's shortcuts,
   * allows you have create new utilities by combining existing ones.
   */
  shortcuts?: UserShortcuts<Theme>

  /**
   * Rules to exclude the selectors for your design system (to narrow down the possibilities).
   * Combining `warnExcluded` options it can also help you identify wrong usages.
   */
  blocklist?: BlocklistRule[]

  /**
   * Utilities that always been included
   */
  safelist?: string[]

  /**
   * Extractors to handle the source file and outputs possible classes/selectors
   * Can be language-aware.
   */
  extractors?: Extractor[]

  /**
   * Raw CSS injections.
   */
  preflights?: Preflight<Theme>[]

  /**
   * Theme object for shared configuration between rules
   */
  theme?: Theme

  /**
   * Layer orders. Default to 0.
   */
  layers?: Record<string, number>

  /**
   * Custom function to sort layers.
   */
  sortLayers?: (layers: string[]) => string[]

  /**
   * Preprocess the incoming utilities, return falsy value to exclude
   */
  preprocess?: Arrayable<Preprocessor>

  /**
   * Postprocess the generate utils object
   */
  postprocess?: Arrayable<Postprocessor>

  /**
   * Custom functions to extend the theme object
   */
  extendTheme?: Arrayable<ThemeExtender<Theme>>

  /**
   * Additional options for auto complete
   */
  autocomplete?: {
    /**
     * Custom functions / templates to provide autocomplete suggestions
     */
    templates?: Arrayable<AutoCompleteFunction | AutoCompleteTemplate>
    /**
     * Custom extractors to pickup possible classes and
     * transform class-name style suggestions to the correct format
     */
    extractors?: Arrayable<AutoCompleteExtractor>
  }

  /**
   * Expose internal details for debugging / inspecting
   *
   * Added `rules`, `shortcuts`, `variants` to the context and expose the context object in `StringifiedUtil`
   *
   * You don't usually need to set this.
   *
   * @default false
   */
  details?: boolean
}

export type AutoCompleteTemplate = string
export type AutoCompleteFunction = (input: string) => Awaitable<string[]>

export interface AutoCompleteExtractorContext {
  content: string
  cursor: number
}

export interface Replacement {
  /**
   * The range of the original text
   */
  start: number
  end: number
  /**
   * The text used to replace
   */
  replacement: string
}

export interface SuggestResult {
  /**
   * The generated suggestions
   *
   * `[original, formatted]`
   */
  suggestions: [string, string][]
  /**
   * The function to convert the selected suggestion back.
   * Needs to pass in the original one.
   */
  resolveReplacement: (suggestion: string) => Replacement
}

export interface AutoCompleteExtractorResult {
  /**
   * The extracted string
   */
  extracted: string
  /**
   * The function to convert the selected suggestion back
   */
  resolveReplacement: (suggestion: string) => Replacement
  /**
   * The function to format suggestions
   */
  transformSuggestions?: (suggestions: string[]) => string[]
}

export interface AutoCompleteExtractor {
  name: string
  extract: (context: AutoCompleteExtractorContext) => Awaitable<AutoCompleteExtractorResult | null>
  order?: number
}

export interface Preset<Theme extends {} = {}> extends ConfigBase<Theme> {
  name: string
  enforce?: 'pre' | 'post'
  /**
   * Preset options for other tools like IDE to consume
   */
  options?: PresetOptions
  /**
   * Apply prefix to all utilities and shortcuts
   */
  prefix?: string
  /**
   * Apply layer to all utilities and shortcuts
   */
  layer?: string
}

export interface GeneratorOptions {
  /**
   * Merge utilities with the exact same body to save the file size
   *
   * @default true
   */
  mergeSelectors?: boolean

  /**
   * Emit warning when matched selectors are presented in blocklist
   *
   * @default true
   */
  warn?: boolean
}

export interface UserOnlyOptions<Theme extends {} = {}> {
  /**
   * The theme object, will be merged with the theme provides by presets
   */
  theme?: Theme

  /**
   * Layout name of shortcuts
   *
   * @default 'shortcuts'
   */
  shortcutsLayer?: string

  /**
   * Presets
   */
  presets?: (Preset<Theme> | Preset<Theme>[])[]

  /**
   * Environment mode
   *
   * @default 'build'
   */
  envMode?: 'dev' | 'build'
}

/**
 * For unocss-cli config
 */
export interface CliOptions {
  cli?: {
    entry?: CliEntryItem | CliEntryItem[]
  }
}

export interface UnocssPluginContext<Config extends UserConfig = UserConfig> {
  ready: Promise<LoadConfigResult<Config>>
  uno: UnoGenerator
  /** All tokens scanned */
  tokens: Set<string>
  /** Map for all module's raw content */
  modules: BetterMap<string, string>
  /** Module IDs that been affected by UnoCSS */
  affectedModules: Set<string>

  /** Pending promises */
  tasks: Promise<any>[]
  /**
   * Await all pending tasks
   */
  flushTasks(): Promise<any>

  filter: (code: string, id: string) => boolean
  extract: (code: string, id?: string) => Promise<void>

  reloadConfig: () => Promise<LoadConfigResult<Config>>
  getConfig: () => Promise<Config>
  onReload: (fn: () => void) => void

  invalidate: () => void
  onInvalidate: (fn: () => void) => void

  root: string
  updateRoot: (root: string) => Promise<LoadConfigResult<Config>>
  getConfigFileList: () => string[]
}

export interface SourceMap {
  file?: string
  mappings?: string
  names?: string[]
  sources?: string[]
  sourcesContent?: string[]
  version?: number
}

export interface TransformResult {
  code: string
  map?: SourceMap | null
  etag?: string
  deps?: string[]
  dynamicDeps?: string[]
}

export type SourceCodeTransformerEnforce = 'pre' | 'post' | 'default'

export interface SourceCodeTransformer {
  name: string
  /**
   * The order of transformer
   */
  enforce?: SourceCodeTransformerEnforce
  /**
   * Custom id filter, if not provided, the extraction filter will be applied
   */
  idFilter?: (id: string) => boolean
  /**
   * The transform function
   */
  transform: (code: MagicString, id: string, ctx: UnocssPluginContext) => Awaitable<void>
}

export interface ExtraContentOptions {
  /**
   * Glob patterns to match the files to be extracted
   * In dev mode, the files will be watched and trigger HMR
   */
  filesystem?: string[]

  /**
   * Plain text to be extracted
   */
  plain?: string[]
}

/**
 * For other modules to aggregate the options
 */
export interface PluginOptions {
  /**
   * Load from configs files
   *
   * set `false` to disable
   */
  configFile?: string | false

  /**
   * List of files that will also trigger config reloads
   */
  configDeps?: string[]

  /**
   * Patterns that filter the files being extracted.
   */
  include?: FilterPattern

  /**
   * Patterns that filter the files NOT being extracted.
   */
  exclude?: FilterPattern

  /**
   * Custom transformers to the source code
   */
  transformers?: SourceCodeTransformer[]

  /**
   * Extra content outside of build pipeline (assets, backend, etc.) to be extracted
   */
  extraContent?: ExtraContentOptions
}

export interface UserConfig<Theme extends {} = {}> extends ConfigBase<Theme>, UserOnlyOptions<Theme>, GeneratorOptions, PluginOptions, CliOptions {}
export interface UserConfigDefaults<Theme extends {} = {}> extends ConfigBase<Theme>, UserOnlyOptions<Theme> {}

export interface ResolvedConfig<Theme extends {} = {}> extends Omit<
RequiredByKey<UserConfig<Theme>, 'mergeSelectors' | 'theme' | 'rules' | 'variants' | 'layers' | 'extractors' | 'blocklist' | 'safelist' | 'preflights' | 'sortLayers'>,
'rules' | 'shortcuts' | 'autocomplete'
> {
  presets: Preset<Theme>[]
  shortcuts: Shortcut<Theme>[]
  variants: VariantObject<Theme>[]
  preprocess: Preprocessor[]
  postprocess: Postprocessor[]
  rulesSize: number
  rulesDynamic: [number, ...DynamicRule<Theme>][]
  rulesStaticMap: Record<string, [number, CSSObject | CSSEntries, RuleMeta | undefined, Rule<Theme>] | undefined>
  autocomplete: {
    templates: (AutoCompleteFunction | AutoCompleteTemplate)[]
    extractors: AutoCompleteExtractor[]
  }
}

export interface GenerateResult {
  css: string
  layers: string[]
  getLayer(name?: string): string | undefined
  getLayers(includes?: string[], excludes?: string[]): string
  matched: Set<string>
}

export type VariantMatchedResult<Theme extends {} = {}> = readonly [
  raw: string,
  current: string,
  variantHandlers: VariantHandler[],
  variants: Set<Variant<Theme>>,
]

export type ParsedUtil = readonly [
  index: number,
  raw: string,
  entries: CSSEntries,
  meta: RuleMeta | undefined,
  variantHandlers: VariantHandler[],
]

export type RawUtil = readonly [
  index: number,
  rawCSS: string,
  meta: RuleMeta | undefined,
]

export type StringifiedUtil<Theme extends {} = {}> = readonly [
  index: number,
  selector: string | undefined,
  body: string,
  parent: string | undefined,
  meta: RuleMeta | undefined,
  context: RuleContext<Theme> | undefined,
  noMerge: boolean | undefined,
]

export type PreparedRule = readonly [
  selector: [string, number][],
  body: string,
  noMerge: boolean,
]

export interface CliEntryItem {
  patterns: string[]
  outFile: string
}

export interface UtilObject {
  selector: string
  entries: CSSEntries
  parent: string | undefined
  layer: string | undefined
  sort: number | undefined
  noMerge: boolean | undefined
}

export interface GenerateOptions {
  /**
   * Filepath of the file being processed.
   */
  id?: string

  /**
   * Generate preflights (if defined)
   *
   * @default true
   */
  preflights?: boolean

  /**
   * Includes safelist
   */
  safelist?: boolean

  /**
   * Generate minified CSS
   * @default false
   */
  minify?: boolean

  /**
   * @experimental
   */
  scope?: string
}
