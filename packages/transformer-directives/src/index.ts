import { cssIdRE, toArray } from '@unocss/core'
import type { SourceCodeTransformer, UnoGenerator } from '@unocss/core'
import type { CssNode, List, ListItem } from 'css-tree'
import { parse, walk } from 'css-tree'
import type MagicString from 'magic-string'
import { handleThemeFn, themeFnRE } from './theme'
import { handleScreen } from './screen'
import { handleApply } from './apply'

export interface TransformerDirectivesOptions {
  enforce?: SourceCodeTransformer['enforce']

  /**
   * Throw an error if utils or themes are not found.
   *
   * @default true
   */
  throwOnMissing?: boolean

  /**
   * Treat CSS variables as @apply directives for CSS syntax compatible.
   *
   * Pass `false` to disable.
   *
   * @default ['--at-apply', '--uno-apply', '--uno']
   */
  applyVariable?: false | string | string[]

  /**
   * Treat CSS variables as directives for CSS syntax compatible.
   *
   * Pass `false` to disable, or a string to use as a prefix.
   *
   * @deprecated use `applyVariable` to specify the full var name instead.
   * @default '--at-'
   */
  varStyle?: false | string
}

export interface TransformerDirectivesContext {
  code: MagicString
  uno: UnoGenerator
  options: TransformerDirectivesOptions
  applyVariable: string[]
  offset?: number
  filename?: string
}

export default function transformerDirectives(options: TransformerDirectivesOptions = {}): SourceCodeTransformer {
  return {
    name: 'css-directive',
    enforce: options?.enforce,
    idFilter: id => !!id.match(cssIdRE),
    transform: (code, id, ctx) => {
      return transformDirectives(code, ctx.uno, options, id)
    },
  }
}

export async function transformDirectives(
  code: MagicString,
  uno: UnoGenerator,
  options: TransformerDirectivesOptions,
  filename?: string,
  originalCode?: string,
  offset?: number,
) {
  let { applyVariable } = options
  const varStyle = options.varStyle
  if (applyVariable === undefined) {
    if (varStyle !== undefined)
      applyVariable = varStyle ? [`${varStyle}apply`] : []
    applyVariable = ['--at-apply', '--uno-apply', '--uno']
  }
  applyVariable = toArray(applyVariable || [])

  const hasApply = code.original.includes('@apply') || applyVariable.some(s => code.original.includes(s))
  const hasScreen = code.original.includes('@screen')
  const hasThemeFn = code.original.match(themeFnRE)

  if (!hasApply && !hasThemeFn && !hasScreen)
    return

  const ast = parse(originalCode || code.original, {
    parseAtrulePrelude: false,
    positions: true,
    filename,
  })

  if (ast.type !== 'StyleSheet')
    return

  const stack: Promise<void>[] = []

  const ctx: TransformerDirectivesContext = {
    options,
    applyVariable,
    uno,
    code,
    filename,
    offset,
  }

  const processNode = async (node: CssNode, _item: ListItem<CssNode>, _list: List<CssNode>) => {
    if (hasScreen && node.type === 'Atrule')
      handleScreen(ctx, node)

    if (hasThemeFn && node.type === 'Declaration')
      handleThemeFn(ctx, node)

    if (hasApply && node.type === 'Rule')
      await handleApply(ctx, node)
  }

  walk(ast, (...args) => stack.push(processNode(...args)))

  await Promise.all(stack)
}
