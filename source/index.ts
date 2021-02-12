import * as typescript from 'typescript'
import * as path from 'path'
import * as fs from 'fs'

type ImportExportModuleSpecifier = (typescript.ImportDeclaration | typescript.ExportDeclaration) & { moduleSpecifier: typescript.StringLiteral }

const transformer = (program: typescript.Program) => (transformationContext: typescript.TransformationContext) => (sourceFile: typescript.SourceFile) => {
  const compilerOptions = program.getCompilerOptions()
  const isNodeModuleResolution = compilerOptions.moduleResolution === typescript.ModuleResolutionKind.NodeJs

  function shouldMutateModuleSpecifier(node: typescript.Node): node is ImportExportModuleSpecifier {
		if (!typescript.isImportDeclaration(node) && !typescript.isExportDeclaration(node)) return false
		if (node.moduleSpecifier === undefined) return false
		// only when module specifier is valid
		if (!typescript.isStringLiteral(node.moduleSpecifier)) return false
		// only when path is relative
		if (!node.moduleSpecifier.text.startsWith('./') && !node.moduleSpecifier.text.startsWith('../')) return false
		// only when module specifier has no extension
		if (path.extname(node.moduleSpecifier.text) !== '') return false
		return true
	}

  // use node like module resolution on the module specifier for cases where it points to a directory
  // containing an index.ts which would ultimately results in module-specifier/index.js)
  function resolveModuleSpecifier(node: ImportExportModuleSpecifier) {
    const moduleSpecifier = node.moduleSpecifier.text
    // only attempt node type resolution when module resolution is node
    if (isNodeModuleResolution) {
      // in case the node has prior transforms get the original node
      const originalNode = typescript.getOriginalNode(node)
      // try the current node first then revert to original node for source file
      const sourceFile = node.getSourceFile() || originalNode.getSourceFile()
      if (sourceFile) {
        const absoluteModuleSpecifier = path.join(path.dirname(sourceFile.fileName), moduleSpecifier)
        // if the module specifier is not pointing to a source file, use
        // node like module resolution to try for <absoluteModuleSpecifier>/index.ts scheme
        if (!fs.existsSync(`${absoluteModuleSpecifier}.ts`) && fs.existsSync(`${absoluteModuleSpecifier}${path.sep}index.ts`)) {
          return `${moduleSpecifier}${path.sep}index.js`
        }
      }
    }
    // default to only append .js
    return `${moduleSpecifier}.js`
  }

  function visitNode(node: typescript.Node): typescript.VisitResult<typescript.Node> {
		if (shouldMutateModuleSpecifier(node)) {
			if (typescript.isImportDeclaration(node)) {
        const newModuleSpecifier = typescript.factory.createStringLiteral(resolveModuleSpecifier(node))
        return typescript.factory.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, newModuleSpecifier)
			} else if (typescript.isExportDeclaration(node)) {
        const newModuleSpecifier = typescript.factory.createStringLiteral(resolveModuleSpecifier(node))
				return typescript.factory.updateExportDeclaration(node, node.decorators, node.modifiers, false, node.exportClause, newModuleSpecifier)
			}
		}

		return typescript.visitEachChild(node, visitNode, transformationContext)
	}

	return typescript.visitNode(sourceFile, visitNode)
}

export default transformer
